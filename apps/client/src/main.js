"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { execFile } = require("node:child_process");
const { app, BrowserWindow, clipboard, dialog, ipcMain, Notification, safeStorage, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const { getHardwareId } = require("./hwid");
const { LogTailer, defaultLogDirectory, findLatestLogFile } = require("./log-tailer");
const {
  isVrchatLogPath,
  normalizeTrustedServerUrl,
  requireAllowedExternalHttpsUrl
} = require("./security");
const { VrchatUserResolver } = require("./vrchat-api");

let bundledConfig = {};
try {
  bundledConfig = require("../config.json");
} catch {
  bundledConfig = {};
}

const CURRENT_SERVER_URL = String(
  process.env.VRCHAT_ADMIN_API_URL || bundledConfig.serverUrl || "http://localhost:8080"
).trim().replace(/\/+$/u, "");
const RETIRED_SERVER_URLS = new Set();
const AUTO_UPDATES_ENABLED = bundledConfig.autoUpdates === true;
const ALLOWED_EXTERNAL_HOSTS = new Set([
  "discord.gg",
  "github.com",
  "t.me",
  "vrchat.com",
  "www.vrchat.com"
]);

const DEFAULT_SETTINGS = {
  serverUrl: CURRENT_SERVER_URL,
  sessionToken: "",
  license: null,
  vrchatAuthCookie: "",
  rememberMe: false
};

let mainWindow;
let heartbeatTimer;
let currentPlaySessionId = null;
let playSessionFinalization = null;
let quitFinalizationStarted = false;
let normalWindowBounds = null;
let alwaysOnTopEnabled = false;
let alwaysOnTopReapplyTimer = null;
const tailer = new LogTailer();
const resolver = new VrchatUserResolver();
const SETTINGS_SECRET_FIELDS = ["sessionToken", "vrchatAuthCookie"];
const volatileSecrets = Object.fromEntries(SETTINGS_SECRET_FIELDS.map((field) => [field, ""]));
const approvedLogFiles = new Set();
const notificationTimes = new Map();
const API_TIMEOUT_MS = 20_000;
const MIN_WINDOW_OPACITY = 0.4;
let preferredWindowOpacity = 1;

function isVrchatRunning() {
  if (process.platform !== "win32") return Promise.resolve(false);
  return new Promise((resolve) => {
    execFile("tasklist", ["/FI", "IMAGENAME eq VRChat.exe", "/NH"], { windowsHide: true }, (_error, stdout) => {
      resolve(/\bVRChat\.exe\b/iu.test(stdout || ""));
    });
  });
}

function settingsPath() {
  return path.join(app.getPath("userData"), "settings.json");
}

function canEncryptSettings() {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch {
    return false;
  }
}

function decryptSetting(value) {
  if (!value || !canEncryptSettings()) return "";
  try {
    return safeStorage.decryptString(Buffer.from(String(value), "base64"));
  } catch {
    return "";
  }
}

function normalizeServerUrl(value) {
  return normalizeTrustedServerUrl(value, CURRENT_SERVER_URL, RETIRED_SERVER_URLS);
}

function hydrateSettings(rawSettings = {}) {
  const normalized = { ...DEFAULT_SETTINGS, ...rawSettings };
  normalized.serverUrl = normalizeServerUrl(normalized.serverUrl);
  const protectedSettings = rawSettings.protected && typeof rawSettings.protected === "object"
    ? rawSettings.protected
    : {};

  for (const field of SETTINGS_SECRET_FIELDS) {
    const decrypted = decryptSetting(protectedSettings[field]);
    normalized[field] = decrypted || String(normalized[field] || volatileSecrets[field] || "");
    volatileSecrets[field] = normalized[field];
  }

  delete normalized.protected;
  return normalized;
}

function serializeSettings(settings) {
  const stored = { ...settings };
  const protectedSettings = {};
  for (const field of SETTINGS_SECRET_FIELDS) {
    const value = String(stored[field] || "");
    volatileSecrets[field] = value;
    if (value && canEncryptSettings()) {
      protectedSettings[field] = safeStorage.encryptString(value).toString("base64");
    }
    stored[field] = "";
  }
  if (Object.keys(protectedSettings).length > 0) stored.protected = protectedSettings;
  else delete stored.protected;
  return stored;
}

async function readSettings() {
  try {
    const raw = await fs.readFile(settingsPath(), "utf8");
    const parsed = JSON.parse(raw);
    const normalized = hydrateSettings(parsed);
    const hasPlainSecrets = SETTINGS_SECRET_FIELDS.some((field) => Boolean(parsed[field]));
    const savedServerUrl = String(parsed.serverUrl || "").trim().replace(/\/+$/u, "");
    const serverUrlChanged = savedServerUrl !== normalized.serverUrl;
    if (hasPlainSecrets || serverUrlChanged) {
      await writeSettings(normalized);
    }
    return normalized;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

async function writeSettings(settings) {
  const normalized = {
    ...DEFAULT_SETTINGS,
    ...settings,
    serverUrl: normalizeServerUrl(settings.serverUrl)
  };
  await fs.mkdir(path.dirname(settingsPath()), { recursive: true });
  await fs.writeFile(settingsPath(), JSON.stringify(serializeSettings(normalized), null, 2), "utf8");
  return normalized;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Request timed out");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function apiRequest(route, options = {}) {
  const settings = await readSettings();
  const response = await fetchWithTimeout(`${settings.serverUrl}${route}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `HTTP ${response.status}`);
  }
  return payload;
}

function apiPost(route, body) {
  return apiRequest(route, { method: "POST", body: JSON.stringify(body) });
}

function rememberApprovedLogFile(filePath) {
  if (!filePath) return null;
  const resolved = path.resolve(String(filePath));
  approvedLogFiles.add(resolved.toLowerCase());
  while (approvedLogFiles.size > 256) {
    approvedLogFiles.delete(approvedLogFiles.values().next().value);
  }
  return resolved;
}

function isDefaultVrchatLog(filePath) {
  return isVrchatLogPath(filePath, defaultLogDirectory());
}

function requireApprovedLogFile(filePath) {
  const resolved = path.resolve(String(filePath || ""));
  if (!isDefaultVrchatLog(resolved) && !approvedLogFiles.has(resolved.toLowerCase())) {
    throw new Error("Log file must be selected through the application");
  }
  return resolved;
}

function sanitizeLogOptions(options = {}) {
  const safe = { ...options };
  if (safe.filePath) safe.filePath = requireApprovedLogFile(safe.filePath);
  if (Array.isArray(safe.filePaths)) {
    safe.filePaths = safe.filePaths.slice(0, 60).map(requireApprovedLogFile);
  }
  return safe;
}

function send(channel, payload) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send(channel, payload);
}

function openExternalHttpsUrl(value) {
  const url = requireAllowedExternalHttpsUrl(value, ALLOWED_EXTERNAL_HOSTS);
  return shell.openExternal(url.toString());
}

function normalizeWindowOpacity(value) {
  const opacity = Number(value);
  if (!Number.isFinite(opacity)) return 1;
  return Math.min(1, Math.max(MIN_WINDOW_OPACITY, opacity));
}

function applyWindowOpacity() {
  if (!mainWindow || mainWindow.isDestroyed()) return 1;
  mainWindow.setOpacity(alwaysOnTopEnabled ? preferredWindowOpacity : 1);
  return mainWindow.getOpacity();
}

function applyAlwaysOnTop({ moveToTop = false } = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  if (alwaysOnTopEnabled) {
    mainWindow.setAlwaysOnTop(true, "screen-saver");
    if (moveToTop) mainWindow.moveTop();
  } else {
    mainWindow.setAlwaysOnTop(false);
  }
  applyWindowOpacity();
  return mainWindow.isAlwaysOnTop();
}

function scheduleAlwaysOnTopReapply() {
  if (!alwaysOnTopEnabled) return;
  if (alwaysOnTopReapplyTimer) clearTimeout(alwaysOnTopReapplyTimer);
  alwaysOnTopReapplyTimer = setTimeout(() => {
    alwaysOnTopReapplyTimer = null;
    applyAlwaysOnTop();
  }, 80);
}

function createWindow() {
  const rendererPath = path.join(__dirname, "..", "renderer", "index.html");
  const rendererUrl = pathToFileURL(rendererPath).toString();
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 980,
    minHeight: 660,
    title: "VRChat Log Analyzer",
    backgroundColor: "#111111",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged
    }
  });

  mainWindow.removeMenu();
  mainWindow.loadFile(rendererPath);

  // Запрещаем навигацию на любые внешние URL — защита от случайного loadURL
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url !== rendererUrl) event.preventDefault();
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.session.setPermissionCheckHandler(() => false);
  mainWindow.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  mainWindow.on("blur", scheduleAlwaysOnTopReapply);
  mainWindow.on("focus", scheduleAlwaysOnTopReapply);
  mainWindow.on("show", scheduleAlwaysOnTopReapply);
  mainWindow.on("restore", scheduleAlwaysOnTopReapply);
  mainWindow.on("closed", () => {
    if (alwaysOnTopReapplyTimer) clearTimeout(alwaysOnTopReapplyTimer);
    alwaysOnTopReapplyTimer = null;
  });
}

tailer.on("status", (status) => {
  send("tail:status", status);
});

tailer.on("error", (error) => {
  const payload = { message: error.message };
  send("tail:error", payload);
});

tailer.on("event", (event) => {
  send("log:event", event);
  if (event.userId) {
    resolver.resolve(event.userId).then((profile) => {
      if (profile) send("user:resolved", profile);
    });
  }
});

tailer.on("analysis:start", () => {
  send("analysis:start", {});
});

tailer.on("rotation", (payload) => {
  send("tail:rotation", payload);
});

async function validateCurrentSession() {
  const settings = await readSettings();
  if (!settings.sessionToken) return { ok: false, error: "no_session" };
  const hwid = await getHardwareId();
  const payload = await apiPost("/auth/session", {
    sessionToken: settings.sessionToken,
    hwid
  });
  return payload;
}

async function startHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  const settings = await readSettings();
  if (!settings.sessionToken) return;

  heartbeatTimer = setInterval(async () => {
    try {
      const hwid = await getHardwareId();
      await apiPost("/auth/heartbeat", {
        sessionToken: settings.sessionToken,
        hwid
      });
      send("auth:status", { ok: true, message: "Session active" });
    } catch (error) {
      send("auth:status", { ok: false, message: error.message });
      await endCurrentPlaySession().catch(() => {});
      await tailer.stop();
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }, 60_000);
}

function setupAutoUpdater() {
  if (!app.isPackaged || !AUTO_UPDATES_ENABLED) return;

  autoUpdater.allowPrerelease = false;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = {
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: () => {}
  };

  autoUpdater.on("checking-for-update", () => {
    send("updater:status", { status: "checking" });
  });

  autoUpdater.on("update-available", (info) => {
    send("updater:status", { status: "available", version: info.version });
  });

  autoUpdater.on("update-not-available", (info) => {
    send("updater:status", { status: "not-available", version: info.version, currentVersion: app.getVersion() });
  });

  autoUpdater.on("download-progress", (progress) => {
    send("updater:status", { status: "downloading", percent: Math.round(progress.percent) });
  });

  autoUpdater.on("update-downloaded", (info) => {
    send("updater:status", { status: "downloaded", version: info.version });
  });

  autoUpdater.on("error", (error) => {
    send("updater:status", { status: "error", message: formatUpdaterError(error) });
    console.error("AutoUpdater error:", error);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      send("updater:status", { status: "error", message: formatUpdaterError(error) });
    });
  }, 3000);

  setInterval(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      send("updater:status", { status: "error", message: formatUpdaterError(error) });
    });
  }, 2 * 60 * 60 * 1000);
}

function formatUpdaterError(error) {
  const statusCode = error?.statusCode || error?.status || error?.response?.statusCode;
  const raw = String(error?.message || error || "unknown updater error");
  if (statusCode === 404 || raw.includes("404")) {
    return "GitHub ?? ????? ???? ??????????. ????????? ????? ? ?????????? ?????.";
  }
  if (/latest\.yml|latest-mac\.yml|latest-linux\.yml/iu.test(raw)) {
    return "GitHub release ??????, ?? metadata ?????????????? ??????????.";
  }
  if (/net::|ENOTFOUND|ECONNRESET|ETIMEDOUT|timeout|network/iu.test(raw)) {
    return "?????? ???? ??? ???????? ??????????.";
  }
  return raw.replace(/\s+/gu, " ").slice(0, 180);
}

app.whenReady().then(async () => {
  const settings = await readSettings();
  resolver.setAuthCookie(settings.vrchatAuthCookie);
  createWindow();
  startHeartbeat().catch(() => {});
  setupAutoUpdater();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", async () => {
  await endCurrentPlaySession().catch(() => {});
  await tailer.stop();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", (event) => {
  if (quitFinalizationStarted || !currentPlaySessionId) return;
  quitFinalizationStarted = true;
  event.preventDefault();
  Promise.race([
    endCurrentPlaySession().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 3000))
  ]).finally(() => app.quit());
});

ipcMain.handle("client:get-settings", async () => {
  const settings = await readSettings();
  return {
    serverUrl: settings.serverUrl,
    hasVrchatAuthCookie: Boolean(settings.vrchatAuthCookie),
    rememberMe: Boolean(settings.rememberMe),
    hasSession: Boolean(settings.sessionToken),
    license: settings.license
  };
});

ipcMain.handle("client:save-settings", async (_event, settings) => {
  const oldSettings = await readSettings();
  const nextCookie = settings.vrchatAuthCookie === undefined
    ? oldSettings.vrchatAuthCookie
    : String(settings.vrchatAuthCookie || "");
  const saved = await writeSettings({
    ...oldSettings,
    serverUrl: settings.serverUrl,
    vrchatAuthCookie: nextCookie,
    rememberMe: Boolean(settings.rememberMe ?? oldSettings.rememberMe)
  });
  resolver.setAuthCookie(saved.vrchatAuthCookie);
  return { serverUrl: saved.serverUrl, hasVrchatAuthCookie: Boolean(saved.vrchatAuthCookie) };
});

ipcMain.handle("vrchat:current-user", async () => {
  const settings = await readSettings();
  resolver.setAuthCookie(settings.vrchatAuthCookie);
  return resolver.fetchCurrentUser();
});

ipcMain.handle("vrchat:current-instance", async () => {
  const settings = await readSettings();
  resolver.setAuthCookie(settings.vrchatAuthCookie);
  return resolver.fetchCurrentInstance();
});

ipcMain.handle("vrchat:avatar", async (_event, avatarId) => {
  const settings = await readSettings();
  resolver.setAuthCookie(settings.vrchatAuthCookie);
  return resolver.fetchAvatar(avatarId);
});

ipcMain.handle("vrchat:avatar-search", async (_event, avatarName) => {
  const settings = await readSettings();
  resolver.setAuthCookie(settings.vrchatAuthCookie);
  return resolver.searchAvatarCandidates(avatarName);
});

ipcMain.handle("client:activate", async (_event, body) => {
  const oldSettings = await readSettings();
  const nextCookie = body.vrchatAuthCookie === undefined
    ? oldSettings.vrchatAuthCookie
    : String(body.vrchatAuthCookie || "");
  await writeSettings({
    ...oldSettings,
    serverUrl: body.serverUrl,
    vrchatAuthCookie: nextCookie,
    rememberMe: Boolean(body.rememberMe)
  });
  resolver.setAuthCookie(nextCookie);
  const hwid = await getHardwareId();
  const payload = await apiPost("/auth/activate", {
    licenseKey: body.licenseKey,
    hwid,
    appVersion: app.getVersion(),
    rememberMe: Boolean(body.rememberMe)
  });
  await writeSettings({
    serverUrl: body.serverUrl,
    vrchatAuthCookie: nextCookie,
    rememberMe: Boolean(body.rememberMe),
    sessionToken: payload.sessionToken,
    license: payload.license
  });
  await startHeartbeat();
  return payload;
});

ipcMain.handle("client:validate", validateCurrentSession);

ipcMain.handle("client:logout", async () => {
  const settings = await readSettings();
  await endCurrentPlaySession().catch(() => {});
  if (settings.sessionToken) {
    const hwid = await getHardwareId();
    await apiPost("/auth/logout", { sessionToken: settings.sessionToken, hwid }).catch(() => {});
  }
  await writeSettings({ ...settings, sessionToken: "", license: null });
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = null;
  await tailer.stop();
  return { ok: true };
});

ipcMain.handle("clipboard:write-text", (_event, value) => {
  const text = String(value ?? "");
  if (text.length > 1_000_000) throw new Error("Текст слишком большой для копирования");
  clipboard.writeText(text);
  return { ok: true };
});

ipcMain.handle("notification:show", (_event, payload) => {
  if (!Notification.isSupported()) return { ok: false, unsupported: true };
  const title = String(payload?.title || "VRChat Admin Tools").trim().slice(0, 120);
  const body = String(payload?.body || "").trim().slice(0, 500);
  const key = String(payload?.key || `${title}:${body}`).slice(0, 240);
  const now = Date.now();
  if (now - (notificationTimes.get(key) || 0) < 30_000) return { ok: true, throttled: true };
  notificationTimes.set(key, now);
  if (notificationTimes.size > 200) notificationTimes.delete(notificationTimes.keys().next().value);
  new Notification({ title, body }).show();
  return { ok: true };
});

async function startCurrentPlaySession(worldName = null) {
  try {
    const settings = await readSettings();
    const hwid = await getHardwareId();
    const payload = await apiPost("/play-sessions/start", {
      sessionToken: settings.sessionToken,
      hwid,
      worldName: worldName || null
    });
    currentPlaySessionId = payload.playSessionId;
  } catch {
    currentPlaySessionId = null;
  }
  return currentPlaySessionId;
}

ipcMain.handle("tail:start", async (_event, options) => {
  await validateCurrentSession();
  await endCurrentPlaySession().catch(() => {});
  const safeOptions = sanitizeLogOptions(options || {});
  await tailer.start(safeOptions);

  await startCurrentPlaySession(safeOptions.worldName);

  return { ok: true, playSessionId: currentPlaySessionId };
});

async function updateCurrentPlaySession(stats, end = false) {
  if (!currentPlaySessionId) return { ok: false, error: "no_active_play_session" };
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const body = {
    sessionToken: settings.sessionToken,
    hwid
  };
  if (stats) {
    body.playerCount = stats.playerCount;
    body.avatarCount = stats.avatarCount;
    body.eventCount = stats.eventCount;
    body.worldName = stats.worldName || null;
    body.snapshot = stats.snapshot || {};
  }
  const route = end
    ? `/play-sessions/${currentPlaySessionId}/end`
    : `/play-sessions/${currentPlaySessionId}/update`;
  return apiPost(route, body);
}

async function endCurrentPlaySession(stats = null) {
  if (!currentPlaySessionId) return { ok: true };
  if (playSessionFinalization) return playSessionFinalization;
  const playSessionId = currentPlaySessionId;
  playSessionFinalization = updateCurrentPlaySession(stats, true)
    .catch(() => ({ ok: false }))
    .finally(() => {
      if (currentPlaySessionId === playSessionId) currentPlaySessionId = null;
      playSessionFinalization = null;
    });
  return playSessionFinalization;
}

ipcMain.handle("tail:update-session", async (_event, stats) => {
  try {
    return await updateCurrentPlaySession(stats, false);
  } catch {
    return { ok: false };
  }
});

ipcMain.handle("tail:stop", async (_event, stats) => {
  await endCurrentPlaySession(stats);
  await tailer.stop();
  return { ok: true };
});

ipcMain.handle("play-sessions:list", async () => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const payload = await apiPost("/play-sessions/list", {
    sessionToken: settings.sessionToken,
    hwid,
    limit: 200
  });
  return payload.sessions ?? [];
});

ipcMain.handle("player-notes:list", async () => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const payload = await apiPost("/player-notes/list", {
    sessionToken: settings.sessionToken,
    hwid,
    limit: 1_000
  });
  return payload.notes ?? [];
});

ipcMain.handle("player-notes:save", async (_event, body) => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const payload = await apiRequest(`/player-notes/${encodeURIComponent(body.userId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      sessionToken: settings.sessionToken,
      hwid,
      userId: body.userId,
      displayName: body.displayName,
      status: body.status,
      note: body.note
    })
  });
  return payload.note;
});

ipcMain.handle("global-player-notes:list", async () => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const payload = await apiPost("/global-player-notes/list", {
    sessionToken: settings.sessionToken,
    hwid,
    limit: 2_000
  });
  return payload.notes ?? [];
});

ipcMain.handle("global-player-notes:save", async (_event, body) => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const payload = await apiRequest(`/global-player-notes/${encodeURIComponent(body.userId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      sessionToken: settings.sessionToken,
      hwid,
      userId: body.userId,
      displayName: body.displayName,
      status: body.status,
      note: body.note
    })
  });
  return payload.note;
});

ipcMain.handle("global-player-notes:remove", async (_event, userId) => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  return apiRequest(`/global-player-notes/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    body: JSON.stringify({ sessionToken: settings.sessionToken, hwid })
  });
});

ipcMain.handle("player-notes:history", async (_event, userId) => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const payload = await apiPost(`/note-history/player/${encodeURIComponent(userId)}/list`, {
    sessionToken: settings.sessionToken,
    hwid,
    limit: 100
  });
  return payload.history ?? [];
});

ipcMain.handle("avatar-catalog:list", async () => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const payload = await apiPost("/avatar-catalog/list", {
    sessionToken: settings.sessionToken,
    hwid,
    limit: 5_000
  });
  return payload.avatars ?? [];
});

ipcMain.handle("avatar-catalog:save", async (_event, entry) => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  return apiPost("/avatar-catalog", {
    sessionToken: settings.sessionToken,
    hwid,
    avatarName: entry?.avatarName,
    avatarId: entry?.avatarId
  });
});

ipcMain.handle("avatar-notes:list", async () => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const payload = await apiPost("/avatar-notes/list", {
    sessionToken: settings.sessionToken,
    hwid,
    limit: 5_000
  });
  return payload.notes ?? [];
});

ipcMain.handle("avatar-notes:save", async (_event, note) => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const avatarKey = String(note?.avatarKey || "");
  const payload = await apiRequest(`/avatar-notes/${encodeURIComponent(avatarKey)}`, {
    method: "PATCH",
    body: JSON.stringify({
      sessionToken: settings.sessionToken,
      hwid,
      avatarKey,
      avatarName: note?.avatarName,
      avatarId: note?.avatarId,
      status: note?.status,
      note: note?.note
    })
  });
  return payload.note;
});

const ANALYSIS_LOAD_PROFILES = [
  {
    id: "normal",
    label: "Нормально",
    maxLines: 30000,
    maxBytesPerFile: 4 * 1024 * 1024,
    todayMaxFiles: 24
  },
  {
    id: "safe",
    label: "Бережно",
    maxLines: 12000,
    maxBytesPerFile: 2 * 1024 * 1024,
    todayMaxFiles: 12
  },
  {
    id: "fast",
    label: "Быстро",
    maxLines: 80000,
    maxBytesPerFile: 8 * 1024 * 1024,
    todayMaxFiles: 50
  }
];

async function resolveLogDirectory(seedFile) {
  if (seedFile) return path.dirname(seedFile);
  const latest = await findLatestLogFile().catch(() => null);
  return latest ? path.dirname(latest) : defaultLogDirectory();
}

function analysisSourceOptions(mode, profile, filePath, filePaths = []) {
  if (mode === "current") {
    return {
      mode,
      filePath,
      maxFiles: 1,
      sourceLabel: "текущий лог"
    };
  }
  if (mode === "today") {
    return {
      mode,
      filePath,
      maxFiles: profile.todayMaxFiles,
      sourceLabel: "логи за сегодня"
    };
  }
  if (mode === "manual") {
    return {
      mode,
      filePath: filePaths[filePaths.length - 1] || filePath,
      filePaths,
      maxFiles: filePaths.length,
      sourceLabel: "выбранные файлы"
    };
  }
  return {
    mode: "recent",
    filePath,
    maxFiles: 3,
    sourceLabel: "последние 3 лога"
  };
}

ipcMain.handle("tail:prepare-analysis-options", async (_event, options) => {
  const requestedFilePath = options?.filePath ? requireApprovedLogFile(options.filePath) : null;
  const filePath = requestedFilePath || tailer.currentFile || await findLatestLogFile().catch(() => null);
  const logDirectory = await resolveLogDirectory(filePath);
  const sourceResult = await dialog.showMessageBox(mainWindow, {
    type: "question",
    title: "Analyze Server",
    message: "Какие VRChat логи анализировать?",
    detail: [
      "Рекомендуется: последние 3 лога. Это помогает не потерять текущий сервер после перезаходов и не читать слишком много старых событий.",
      "",
      `Папка логов: ${logDirectory}`
    ].join("\n"),
    buttons: ["Последние 3 лога", "Текущий лог", "Логи за сегодня", "Выбрать файлы", "Отмена"],
    defaultId: 0,
    cancelId: 4,
    noLink: true
  });

  if (sourceResult.response === 4) return { canceled: true };

  const modes = ["recent", "current", "today", "manual"];
  const mode = modes[sourceResult.response] || "recent";
  let filePaths = [];
  if (mode === "manual") {
    const fileResult = await dialog.showOpenDialog(mainWindow, {
      title: "Выберите VRChat output_log файлы",
      defaultPath: logDirectory,
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "VRChat logs", extensions: ["txt"] }]
    });
    if (fileResult.canceled || fileResult.filePaths.length === 0) return { canceled: true };
    filePaths = fileResult.filePaths.map(rememberApprovedLogFile);
  }

  const loadResult = await dialog.showMessageBox(mainWindow, {
    type: "warning",
    title: "Нагрузка анализа",
    message: "Насколько можно нагрузить ПК во время анализа?",
    detail: [
      "Быстрый режим читает больше данных и может дать краткие лаги.",
      "Если VRChat открыт на слабом ПК, выбирайте Бережно или Нормально.",
      "Самый точный вариант для будущих событий: нажать Start и перезайти в мир."
    ].join("\n"),
    buttons: ["Нормально", "Бережно", "Быстро", "Отмена"],
    defaultId: 0,
    cancelId: 3,
    noLink: true
  });

  if (loadResult.response === 3) return { canceled: true };

  const profile = ANALYSIS_LOAD_PROFILES[loadResult.response] || ANALYSIS_LOAD_PROFILES[0];
  return {
    canceled: false,
    ...analysisSourceOptions(mode, profile, filePath, filePaths),
    loadProfile: profile.id,
    loadProfileLabel: profile.label,
    maxLines: profile.maxLines,
    maxBytesPerFile: profile.maxBytesPerFile,
    logDirectory
  };
});

ipcMain.handle("tail:analyze-current-instance", async (_event, options) => {
  await validateCurrentSession();
  const safeOptions = sanitizeLogOptions(options || {});
  let currentUser = null;
  let currentInstance = null;
  const analysisFilePath = safeOptions.filePath || safeOptions.filePaths?.[safeOptions.filePaths.length - 1] || tailer.currentFile;
  try {
    if (resolver.hasAuthCookie()) {
      currentUser = await resolver.fetchCurrentUser();
      try {
        currentInstance = await resolver.fetchCurrentInstance(currentUser);
      } catch {
        currentInstance = null;
      }
      send("tail:status", {
        running: tailer.running,
        filePath: analysisFilePath,
        message: `VRChat account: ${currentUser.displayName}${currentUser.location ? ` (${currentUser.location})` : ""}${Number.isFinite(currentInstance?.nUsers) ? `, online: ${currentInstance.nUsers}` : ""}`
      });
    }
  } catch (error) {
    send("tail:status", {
      running: tailer.running,
      filePath: analysisFilePath,
      message: `VRChat account check skipped: ${error.message}`
    });
  }
  const followState = await tailer.analyzeCurrentInstance(safeOptions.filePath, {
    ...safeOptions,
    expectedLocation: currentUser
  });
  if (!currentPlaySessionId) {
    await startCurrentPlaySession(currentInstance?.worldName || currentUser?.worldName || null);
  }
  return { ok: true, currentUser, currentInstance, followState, playSessionId: currentPlaySessionId };
});

ipcMain.handle("tail:latest-file", async () => {
  const filePath = await findLatestLogFile().catch(() => null);
  return { filePath: filePath ? rememberApprovedLogFile(filePath) : null };
});

ipcMain.handle("tail:choose-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select VRChat output log",
    properties: ["openFile"],
    filters: [{ name: "VRChat logs", extensions: ["txt"] }]
  });
  return { filePath: result.canceled ? null : rememberApprovedLogFile(result.filePaths[0]) };
});

ipcMain.handle("crash:status", async (_event, options) => {
  const filePath = options?.filePath ? requireApprovedLogFile(options.filePath) : tailer.currentFile;
  const [processRunning, stat] = await Promise.all([
    isVrchatRunning(),
    filePath ? fs.stat(filePath).catch(() => null) : Promise.resolve(null)
  ]);
  return {
    processRunning,
    filePath: filePath || null,
    logModifiedAt: stat?.mtime ? stat.mtime.toISOString() : null
  };
});

ipcMain.handle("shell:open", (_event, url) => openExternalHttpsUrl(url));

ipcMain.handle("window:set-always-on-top", (_event, enabled, opacity) => {
  if (!mainWindow || mainWindow.isDestroyed()) throw new Error("Window is not available");
  if (opacity !== undefined) preferredWindowOpacity = normalizeWindowOpacity(opacity);
  alwaysOnTopEnabled = enabled === true;
  return {
    enabled: applyAlwaysOnTop({ moveToTop: alwaysOnTopEnabled }),
    opacity: mainWindow.getOpacity(),
    preferredOpacity: preferredWindowOpacity
  };
});

ipcMain.handle("window:set-opacity", (_event, opacity) => {
  if (!mainWindow || mainWindow.isDestroyed()) throw new Error("Window is not available");
  preferredWindowOpacity = normalizeWindowOpacity(opacity);
  return {
    opacity: applyWindowOpacity(),
    preferredOpacity: preferredWindowOpacity
  };
});

ipcMain.handle("window:set-compact", (_event, enabled) => {
  if (!mainWindow || mainWindow.isDestroyed()) throw new Error("Window is not available");
  const next = enabled === true;
  if (next) {
    if (!normalWindowBounds) normalWindowBounds = mainWindow.getBounds();
    const current = mainWindow.getBounds();
    mainWindow.setMinimumSize(480, 320);
    mainWindow.setBounds({
      x: current.x,
      y: current.y,
      width: Math.min(current.width, 640),
      height: Math.min(current.height, 420)
    }, true);
  } else {
    const target = normalWindowBounds || { ...mainWindow.getBounds(), width: 1240, height: 820 };
    mainWindow.setMinimumSize(980, 660);
    mainWindow.setBounds({
      ...target,
      width: Math.max(target.width, 980),
      height: Math.max(target.height, 660)
    }, true);
    normalWindowBounds = null;
  }
  return { enabled: next, bounds: mainWindow.getBounds() };
});

ipcMain.handle("updater:install-now", () => {
  autoUpdater.quitAndInstall();
});
