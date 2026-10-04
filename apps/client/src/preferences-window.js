"use strict";

const path = require("node:path");
const { pathToFileURL } = require("node:url");

const CHOICES = Object.freeze({
  language: ["ru", "en"], uiPlacement: ["left"],
  startView: ["session", "insights", "social", "library", "admin", "owner", "crash", "history", "builder"],
  density: ["comfortable"], scale: [90, 100, 125, 150, 175, 200],
  eventLimit: [1000, 2500, 5000], sessionPlayerMode: ["online-first", "online-only", "all"]
});
const FLAGS = ["animations", "showHeader", "showToolbar", "autoAnalyzeCurrentLog", "protectMonitoring", "rememberSelection", "notifyMarkedPlayers", "notifyCrashAvatars", "clearOnLogout"];
const BACKUP_KEYS = ["betaInterfaceProfilesV1", "betaBuilderOrder", "betaBuilderVisible", "betaBuilderLayout", "betaBuilderGeometry", "betaBuilderQueries", "betaBuilderBlockSettings", "betaBuilderSnap", "betaBuilderAlwaysOnTop", "betaBuilderOpacity", "betaBuilderCompact", "betaBuilderDashboards", "betaBuilderDashboardId", "betaCrashIncidents", "betaCrashEnabled"];

function sanitizeUiSettings(input = {}) {
  const output = { uiPlacement: "left", density: "comfortable" };
  for (const [key, choices] of Object.entries(CHOICES)) {
    const value = typeof choices[0] === "number" ? Number(input[key]) : input[key];
    if (choices.includes(value)) output[key] = value;
  }
  for (const key of FLAGS) if (typeof input[key] === "boolean") output[key] = input[key];
  if (Number.isFinite(input.uiSidebarWidth)) output.uiSidebarWidth = Math.min(360, Math.max(72, input.uiSidebarWidth));
  return output;
}

function sanitizeBackupUi(input = {}) {
  const savedLayout = {};
  let remaining = 2 * 1024 * 1024;
  for (const key of BACKUP_KEYS) {
    const value = input.savedLayout?.[key];
    if (typeof value === "string" && value.length <= Math.min(1024 * 1024, remaining)) {
      savedLayout[key] = value;
      remaining -= value.length;
    }
  }
  const output = { uiSettings: sanitizeUiSettings(input.uiSettings), savedLayout };
  if (["personal", "team"].includes(input.workspaceMode)) output.workspaceMode = input.workspaceMode;
  if (Array.isArray(input.sessionEventFilters)) output.sessionEventFilters = input.sessionEventFilters.filter((value) => typeof value === "string").slice(0, 20).map((value) => value.slice(0, 40));
  if (input.workspaceLastView && typeof input.workspaceLastView === "object") {
    output.workspaceLastView = Object.fromEntries(["personal", "team"].filter((key) => CHOICES.startView.includes(input.workspaceLastView[key])).map((key) => [key, input.workspaceLastView[key]]));
  }
  return output;
}

function registerPreferencesWindow({ app, BrowserWindow, ipcMain, getParent, getRendererPath, operations }) {
  let window = null;
  let snapshot = null;
  let appearanceModel = null;
  let nextRequest = 0;
  const pending = new Map();
  const isSender = (event, target) => target && !target.isDestroyed() && event.sender === target.webContents && event.senderFrame === event.sender.mainFrame;
  const requireChild = (event) => { if (!isSender(event, window)) throw new Error("preferences_sender_denied"); };
  const capture = (value) => ({
    uiSettings: sanitizeUiSettings(value?.uiSettings), defaults: sanitizeUiSettings(value?.defaults),
    appearance: appearanceModel.normalizeProfile({ theme: value?.appearance }).theme,
    backupUi: sanitizeBackupUi(value?.backupUi), preview: Boolean(value?.preview)
  });
  const publicSnapshot = () => ({
    uiSettings: snapshot.uiSettings, defaults: snapshot.defaults, appearance: snapshot.appearance, preview: snapshot.preview,
    fonts: Object.entries(appearanceModel.FONTS).map(([key, family]) => ({ key, family, label: appearanceModel.FONT_LABELS[key] })),
    presets: Object.entries(appearanceModel.PRESETS).map(([key, preset]) => ({ key, label: preset.name }))
  });
  const notify = (command, value) => getParent()?.webContents.send("preferences:command", { command, value });
  const askParent = (command, value) => new Promise((resolve, reject) => {
    const parent = getParent();
    if (!parent || parent.isDestroyed()) { reject(new Error("preferences_parent_closed")); return; }
    const id = ++nextRequest;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error("preferences_apply_timeout")); }, 5000);
    pending.set(id, { resolve, reject, timer });
    parent.webContents.send("preferences:command", { id, command, value });
  });

  ipcMain.handle("preferences:open", (event, value) => {
    const parent = getParent();
    if (!isSender(event, parent)) throw new Error("preferences_sender_denied");
    if (window && !window.isDestroyed()) {
      snapshot = capture(value);
      window.webContents.send("preferences:snapshot", publicSnapshot());
      window.show(); window.focus();
      return { opened: true };
    }
    const renderer = path.dirname(getRendererPath());
    appearanceModel = require(path.join(renderer, "ui-customizer.js"));
    snapshot = capture(value);
    window = new BrowserWindow({
      parent, modal: false, width: 510, height: 760, minWidth: 420, minHeight: 540,
      title: "VRChat Admin Tools — Настройки", backgroundColor: "#0b0e15", show: false,
      autoHideMenuBar: true,
      webPreferences: { preload: path.join(__dirname, "preferences-preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: true, devTools: !app.isPackaged }
    });
    const child = window;
    const source = path.join(renderer, "preferences.html");
    const allowedUrl = pathToFileURL(source).href;
    child.removeMenu();
    child.webContents.on("will-navigate", (navigation, url) => { if (url !== allowedUrl) navigation.preventDefault(); });
    child.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    child.once("ready-to-show", () => { if (!child.isDestroyed()) child.show(); });
    const closeChild = () => { if (!child.isDestroyed()) child.close(); };
    parent.once("closed", closeChild);
    child.once("closed", () => {
      parent.removeListener("closed", closeChild);
      window = null;
      snapshot = null;
      for (const request of pending.values()) { clearTimeout(request.timer); request.reject(new Error("preferences_window_closed")); }
      pending.clear();
    });
    void child.loadFile(source);
    return { opened: true };
  });
  ipcMain.handle("preferences:get", (event) => { requireChild(event); return publicSnapshot(); });
  ipcMain.on("preferences:reply", (event, response) => {
    if (!isSender(event, getParent())) return;
    const request = pending.get(response?.id);
    if (!request) return;
    clearTimeout(request.timer);
    pending.delete(response.id);
    if (response.error) { request.reject(new Error(String(response.error).slice(0, 500))); return; }
    if (response.snapshot) snapshot = capture(response.snapshot);
    request.resolve(publicSnapshot());
  });
  ipcMain.handle("preferences:save", async (event, draft) => {
    requireChild(event);
    const appearance = {};
    if (Object.hasOwn(appearanceModel.FONTS, draft?.appearance?.font)) appearance.font = draft.appearance.font;
    if (Object.hasOwn(appearanceModel.PRESETS, draft?.appearance?.preset)) appearance.preset = draft.appearance.preset;
    return askParent("save", { uiSettings: sanitizeUiSettings(draft?.uiSettings), appearance });
  });
  ipcMain.handle("preferences:action", async (event, action) => {
    requireChild(event);
    if (!["appearance", "account", "monitor-resume", "choose-log", "tutorial"].includes(action)) throw new Error("preferences_action_denied");
    window.hide();
    getParent()?.show();
    getParent()?.focus();
    await askParent(action);
    return { ok: true };
  });
  ipcMain.handle("preferences:data", async (event, action, value) => {
    requireChild(event);
    if (!Object.hasOwn(operations, action)) throw new Error("preferences_operation_denied");
    let argument = value;
    if (action === "export" || action === "backup-run") argument = snapshot.backupUi;
    if (action === "retention" && ![0, 30, 90, 180, 365].includes(value)) throw new Error("preferences_retention_invalid");
    if (action === "clear" && !["history", "social", "preferences", "photos", "diagnostics", "all"].includes(value)) throw new Error("preferences_category_invalid");
    const result = await operations[action](event, argument);
    if ((action === "import" || action === "backup-restore") && result?.ok) await askParent("import", result.uiSettings);
    if (["clear", "retention", "backup-configure"].includes(action)) notify("data-changed", { action, category: action === "clear" ? value : "" });
    return result;
  });
  ipcMain.handle("preferences:close", (event) => {
    requireChild(event);
    const child = window;
    setImmediate(() => { if (!child.isDestroyed()) child.close(); });
    return true;
  });
}

module.exports = { registerPreferencesWindow, sanitizeUiSettings, sanitizeBackupUi };
