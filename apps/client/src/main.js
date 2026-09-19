"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { pathToFileURL } = require("node:url");
const { execFile } = require("node:child_process");
const { app, BrowserWindow, clipboard, dialog, ipcMain, Notification, safeStorage, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const { getHardwareId } = require("./hwid");
const { LogTailer, defaultLogDirectory, findLatestLogFile, readTodayPlayers } = require("./log-tailer");
const {
  isVrchatLogPath,
  requireAllowedExternalHttpsUrl
} = require("./security");
const { RuntimeConfigManager } = require("./runtime-config");
const { importStableSettings } = require("./stable-settings-import");
const { LocalCompanionStore } = require("./local-companion-store");
const { VrchatUserResolver } = require("./vrchat-api");
const { VrchatFriendPipeline } = require("./vrchat-friend-pipeline");

const CURRENT_SERVER_URL = "https://api.vrchatadmintools.ru";
const RETIRED_SERVER_URLS = new Set([
  "https://web-production-a9b1cd.up.railway.app",
  "https://web-production-a54bb.up.railway.app"
]);

function isBetaClient() {
  return process.env.VRCHAT_CLIENT_VARIANT === "beta" || /\bbeta\b/iu.test(app.getName());
}

function clientRendererPath() {
  const developmentOverride = String(process.env.VRCHAT_CLIENT_RENDERER_DIR || "").trim();
  if (!app.isPackaged && developmentOverride) {
    return path.join(path.resolve(developmentOverride), "index.html");
  }
  return path.join(__dirname, "..", "renderer", "index.html");
}
const RUNTIME_CONFIG_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAN7T6ncA2GWB9OpL4UdZcRuNZ5jk0tfSjK7DQ8lI1GHM=
-----END PUBLIC KEY-----`;
const RUNTIME_CONFIG_SOURCES = [
  "https://raw.githubusercontent.com/Rosecod337/VRChatAdminToolsPublic/main/runtime-config.json",
  {
    url: "https://api.github.com/repos/Rosecod337/VRChatAdminToolsPublic/contents/runtime-config.json?ref=main",
    headers: { accept: "application/vnd.github.raw+json" }
  }
];
const ALLOWED_EXTERNAL_HOSTS = new Set([
  "discord.gg",
  "github.com",
  "t.me",
  "vrchatadmintools.ru",
  "www.vrchatadmintools.ru",
  "vrchat.com",
  "www.vrchat.com"
]);

const DEFAULT_SETTINGS = {
  serverUrl: CURRENT_SERVER_URL,
  sessionToken: "",
  license: null,
  vrchatAuthCookie: "",
  rememberMe: false,
  freeMode: false
};

let mainWindow;
let heartbeatTimer;
let runtimeConfigTimer;
let initialRuntimeConfigRefresh;
let currentPlaySessionId = null;
let pendingPlaySessionWorldName = null;
let playSessionFinalization = null;
let quitFinalizationStarted = false;
let normalWindowBounds = null;
let alwaysOnTopEnabled = false;
let alwaysOnTopReapplyTimer = null;
let localCompanionStore = null;
const tailer = new LogTailer();
const resolver = new VrchatUserResolver();
const friendPipeline = new VrchatFriendPipeline({
  onEvent: (event) => {
    if (!isBetaClient()) return;
    const result = companionStore().recordSocialPipelineEvent(event);
    if (result.events) send("companion:social-activity", { userId: result.userId, count: result.events });
  }
});
const SETTINGS_SECRET_FIELDS = ["sessionToken", "vrchatAuthCookie"];
const volatileSecrets = Object.fromEntries(SETTINGS_SECRET_FIELDS.map((field) => [field, ""]));
let lastKnownSettings = null;
let settingsWriteQueue = Promise.resolve();
const approvedLogFiles = new Set();
const notificationTimes = new Map();
let protectedAvatarUserHashes = new Set();
let protectedAvatarIdHashes = new Set();
let protectedAvatarHashSalt = "";
let protectedAvatarProtectionReady = false;
const API_TIMEOUT_MS = 20_000;
const RUNTIME_CONFIG_REFRESH_MS = 10 * 60 * 1000;
const MIN_WINDOW_OPACITY = 0.4;
let preferredWindowOpacity = 1;
const runtimeConfig = new RuntimeConfigManager({
  builtInApiBaseUrl: CURRENT_SERVER_URL,
  publicKeyPem: RUNTIME_CONFIG_PUBLIC_KEY,
  sources: RUNTIME_CONFIG_SOURCES,
  timeoutMs: 5000
});

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

function companionStore() {
  if (!isBetaClient()) throw new Error("Local companion storage is only available in Beta");
  localCompanionStore ??= new LocalCompanionStore(path.join(app.getPath("userData"), "companion.sqlite"));
  return localCompanionStore;
}

async function syncFriendPipeline(authCookie, { createBaseline = false } = {}) {
  if (!isBetaClient() || !authCookie) {
    friendPipeline.stop();
    return false;
  }
  resolver.setAuthCookie(authCookie);
  if (createBaseline) {
    try {
      const summary = await resolver.fetchSocialSummary({ force: true });
      companionStore().recordSocialSnapshot(summary);
    } catch { /* The realtime feed can still connect and build a new baseline. */ }
  }
  return friendPipeline.start(authCookie);
}

function isFreeMode(settings) {
  return isBetaClient() && settings?.freeMode === true;
}

async function importStableSettingsForBeta({ force = false } = {}) {
  if (!isBetaClient()) return { imported: false, reason: "not_beta_client" };
  return importStableSettings({
    appDataPath: app.getPath("appData"),
    targetSettingsPath: settingsPath(),
    force
  });
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
  const normalized = String(value || "").trim().replace(/\/+$/u, "");
  if (RETIRED_SERVER_URLS.has(normalized)) return runtimeConfig.getApiBaseUrl();
  return runtimeConfig.normalizeApiUrl(normalized);
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
  await settingsWriteQueue.catch(() => {});
  try {
    const raw = await fs.readFile(settingsPath(), "utf8");
    const parsed = JSON.parse(raw);
    const normalized = hydrateSettings(parsed);
    lastKnownSettings = normalized;
    const hasPlainSecrets = SETTINGS_SECRET_FIELDS.some((field) => Boolean(parsed[field]));
    const savedServerUrl = String(parsed.serverUrl || "").trim().replace(/\/+$/u, "");
    const serverUrlChanged = savedServerUrl !== normalized.serverUrl;
    if (hasPlainSecrets || serverUrlChanged) {
      await writeSettings(normalized);
    }
    return normalized;
  } catch {
    return lastKnownSettings ? { ...lastKnownSettings } : { ...DEFAULT_SETTINGS };
  }
}

function writeSettings(settings) {
  const normalized = {
    ...DEFAULT_SETTINGS,
    ...settings,
    serverUrl: normalizeServerUrl(settings.serverUrl)
  };
  const targetPath = settingsPath();
  const temporaryPath = `${targetPath}.${process.pid}.tmp`;
  const operation = settingsWriteQueue.then(async () => {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    try {
      await fs.writeFile(temporaryPath, JSON.stringify(serializeSettings(normalized), null, 2), "utf8");
      await fs.rename(temporaryPath, targetPath);
      lastKnownSettings = normalized;
      return normalized;
    } finally {
      await fs.unlink(temporaryPath).catch(() => {});
    }
  });
  settingsWriteQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

let vrchatSessionPersistQueue = Promise.resolve();
resolver.setAuthCookieChangeHandler((authCookie) => {
  vrchatSessionPersistQueue = vrchatSessionPersistQueue.then(async () => {
    const settings = await readSettings();
    if (!authCookie || settings.vrchatAuthCookie === authCookie) return;
    await writeSettings({ ...settings, vrchatAuthCookie: authCookie });
    await syncFriendPipeline(authCookie).catch(() => {});
  }).catch(() => {});
});

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
  if (initialRuntimeConfigRefresh) await initialRuntimeConfigRefresh.catch(() => {});
  const response = await fetchWithTimeout(`${runtimeConfig.getApiBaseUrl()}${route}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.error || `HTTP ${response.status}`);
    error.retryAfterSeconds = Number(payload.retryAfterSeconds || response.headers.get("retry-after") || 0);
    throw error;
  }
  return payload;
}

async function refreshRuntimeConfig() {
  const result = await runtimeConfig.refresh();
  if (result.changed) {
    const settings = await readSettings();
    await writeSettings({ ...settings, serverUrl: runtimeConfig.getApiBaseUrl() });
  }
  send("runtime-config:updated", runtimeConfig.getPublicState());
  return result;
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

function redactProtectedAvatarEvent(event) {
  if (!event || event.category !== "avatars") return event;
  const sourceUserId = String(event.userId || "").trim();
  const sourceHash = sourceUserId && protectedAvatarHashSalt
    ? createHash("sha256").update(`${protectedAvatarHashSalt}:${sourceUserId}`).digest("hex")
    : "";
  const protectedSource = protectedAvatarProtectionReady && sourceHash && protectedAvatarUserHashes.has(sourceHash);
  const unresolvedAvatarId = event.type === "avatar-data" && !sourceUserId;
  if (protectedAvatarProtectionReady && !protectedSource && !unresolvedAvatarId) return event;
  return {
    ...event,
    avatarName: "",
    avatarId: "",
    raw: "",
    avatarRedacted: true,
    avatarProtected: protectedSource,
    correlationConfidence: protectedSource ? "protected" : "unknown",
    protectionUnavailable: !protectedAvatarProtectionReady
  };
}

function protectedValueHash(value) {
  const normalized = String(value || "").trim();
  if (!normalized || !protectedAvatarHashSalt) return "";
  return createHash("sha256").update(`${protectedAvatarHashSalt}:${normalized}`).digest("hex");
}

function isProtectedAvatarId(avatarId) {
  if (!protectedAvatarProtectionReady) return true;
  const hash = protectedValueHash(avatarId);
  return Boolean(hash && protectedAvatarIdHashes.has(hash));
}

function filterProtectedAvatarPayload(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if (Array.isArray(payload)) return payload.filter((row) => !isProtectedAvatarId(row?.avatarId || row?.id));
  const next = { ...payload };
  if (Array.isArray(next.candidates)) next.candidates = filterProtectedAvatarPayload(next.candidates);
  if (Array.isArray(next.avatars)) next.avatars = filterProtectedAvatarPayload(next.avatars);
  return next;
}

function protectedAvatarFeatureUnavailable(error) {
  return /(?:^|\s)HTTP 404(?:\s|$)/u.test(String(error?.message || ""));
}

async function refreshProtectedAvatarUsers() {
  const settings = await readSettings();
  let payload;
  try {
    if (settings.sessionToken && !isFreeMode(settings)) {
      const hwid = await getHardwareId();
      payload = await apiPost("/protected-avatar-users/list", { sessionToken: settings.sessionToken, hwid });
    } else if (isFreeMode(settings)) {
      payload = await apiPost("/public/protected-avatar-policy", {});
    } else {
      protectedAvatarUserHashes = new Set();
      protectedAvatarIdHashes = new Set();
      protectedAvatarHashSalt = "";
      protectedAvatarProtectionReady = false;
      return;
    }
  } catch (error) {
    if (!protectedAvatarFeatureUnavailable(error)) throw error;
    protectedAvatarUserHashes = new Set();
    protectedAvatarIdHashes = new Set();
    protectedAvatarHashSalt = "";
    protectedAvatarProtectionReady = false;
    return { supported: false };
  }
  const salt = String(payload.salt || "").trim();
  const hashes = (payload.userIdHashes || []).map((value) => String(value || "").trim()).filter(Boolean);
  const avatarHashes = (payload.avatarIdHashes || []).map((value) => String(value || "").trim()).filter(Boolean);
  if (!salt) throw new Error("protected_avatar_policy_unavailable");
  protectedAvatarHashSalt = salt;
  protectedAvatarUserHashes = new Set(hashes);
  protectedAvatarIdHashes = new Set(avatarHashes);
  protectedAvatarProtectionReady = true;
  if (isBetaClient()) companionStore().applyProtectionPolicy({ salt, userIdHashes: hashes, avatarIdHashes: avatarHashes });
  return { supported: true };
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
  const rendererPath = clientRendererPath();
  const rendererUrl = pathToFileURL(rendererPath).toString();
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 980,
    minHeight: 660,
    title: isBetaClient() ? "VRChat Admin Tools Beta" : "VRChat Log Analyzer",
    backgroundColor: "#111111",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
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
  send("log:event", redactProtectedAvatarEvent(event));
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
  if (isFreeMode(settings)) return { ok: true, accessMode: "free", license: null };
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
  if (isFreeMode(settings)) {
    heartbeatTimer = setInterval(() => {
      refreshProtectedAvatarUsers().catch(() => {
        protectedAvatarProtectionReady = false;
      });
    }, RUNTIME_CONFIG_REFRESH_MS);
    return;
  }
  if (!settings.sessionToken) return;

  heartbeatTimer = setInterval(async () => {
    try {
      const hwid = await getHardwareId();
      const payload = await apiPost("/auth/heartbeat", {
        sessionToken: settings.sessionToken,
        hwid
      });
      if (payload.license) {
        await writeSettings({ ...settings, license: payload.license });
      }
      await refreshProtectedAvatarUsers().catch(() => {
        protectedAvatarProtectionReady = false;
      });
      send("auth:status", { ok: true, message: "Session active", license: payload.license || null });
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
  if (!app.isPackaged) return;

  const beta = isBetaClient();
  autoUpdater.allowPrerelease = beta;
  autoUpdater.allowDowngrade = false;
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
  await importStableSettingsForBeta().catch(() => {});
  runtimeConfig.setCachePath(path.join(app.getPath("userData"), "runtime-config.json"));
  await runtimeConfig.loadCache();
  const settings = await readSettings();
  resolver.setAuthCookie(settings.vrchatAuthCookie);
  createWindow();
  void syncFriendPipeline(settings.vrchatAuthCookie, { createBaseline: true });
  initialRuntimeConfigRefresh = refreshRuntimeConfig();
  initialRuntimeConfigRefresh.catch(() => {});
  runtimeConfigTimer = setInterval(() => {
    refreshRuntimeConfig().catch(() => {});
  }, RUNTIME_CONFIG_REFRESH_MS);
  startHeartbeat().catch(() => {});
  setupAutoUpdater();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", async () => {
  friendPipeline.stop();
  if (runtimeConfigTimer) clearInterval(runtimeConfigTimer);
  runtimeConfigTimer = null;
  await endCurrentPlaySession().catch(() => {});
  await tailer.stop();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", (event) => {
  friendPipeline.stop();
  if (quitFinalizationStarted || !currentPlaySessionId) {
    localCompanionStore?.close();
    localCompanionStore = null;
    return;
  }
  quitFinalizationStarted = true;
  event.preventDefault();
  Promise.race([
    endCurrentPlaySession().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 3000))
  ]).finally(() => {
    localCompanionStore?.close();
    localCompanionStore = null;
    app.quit();
  });
});

ipcMain.handle("client:get-settings", async () => {
  const settings = await readSettings();
  return {
    appVersion: app.getVersion(),
    serverUrl: settings.serverUrl,
    hasVrchatAuthCookie: Boolean(settings.vrchatAuthCookie),
    rememberMe: Boolean(settings.rememberMe),
    hasSession: Boolean(settings.sessionToken),
    freeMode: isFreeMode(settings),
    accessMode: isFreeMode(settings) ? "free" : (settings.sessionToken ? "paid" : "locked"),
    license: isFreeMode(settings) ? null : settings.license
  };
});

ipcMain.handle("client:import-stable-settings", () => importStableSettingsForBeta({ force: true }));

ipcMain.handle("client:continue-free", async () => {
  if (!isBetaClient()) throw new Error("free_mode_requires_beta");
  const settings = await readSettings();
  await writeSettings({
    ...settings,
    sessionToken: "",
    license: null,
    importedStableSession: false,
    freeMode: true
  });
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = null;
  protectedAvatarProtectionReady = false;
  await refreshProtectedAvatarUsers().catch(() => {
    protectedAvatarProtectionReady = false;
  });
  await startHeartbeat();
  return { ok: true, accessMode: "free" };
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

async function persistVrchatAccountSession(result) {
  if (!result?.authenticated) return result;
  const oldSettings = await readSettings();
  const saved = await writeSettings({
    ...oldSettings,
    vrchatAuthCookie: resolver.getAuthCookie()
  });
  resolver.setAuthCookie(saved.vrchatAuthCookie);
  await syncFriendPipeline(saved.vrchatAuthCookie, { createBaseline: true }).catch(() => {});
  return result;
}

ipcMain.handle("vrchat:account-login", async (_event, credentials) => {
  const username = String(credentials?.username || "");
  const password = String(credentials?.password || "");
  return persistVrchatAccountSession(await resolver.loginWithAccount(username, password));
});

ipcMain.handle("vrchat:account-verify", async (_event, payload) => {
  const method = String(payload?.method || "");
  const code = String(payload?.code || "");
  return persistVrchatAccountSession(await resolver.verifyAccountLogin(method, code));
});

ipcMain.handle("vrchat:account-cancel", () => {
  resolver.cancelAccountLogin();
  return { ok: true };
});

ipcMain.handle("vrchat:account-disconnect", async () => {
  resolver.cancelAccountLogin();
  resolver.setAuthCookie("");
  friendPipeline.stop();
  const oldSettings = await readSettings();
  await writeSettings({ ...oldSettings, vrchatAuthCookie: "" });
  return { ok: true, hasVrchatAuthCookie: false };
});

ipcMain.handle("vrchat:current-user", async () => {
  const settings = await readSettings();
  resolver.setAuthCookie(settings.vrchatAuthCookie);
  return resolver.fetchCurrentUser();
});

ipcMain.handle("runtime-config:get", () => runtimeConfig.getPublicState());

ipcMain.handle("vrchat:current-instance", async () => {
  const settings = await readSettings();
  resolver.setAuthCookie(settings.vrchatAuthCookie);
  return resolver.fetchCurrentInstance();
});

ipcMain.handle("vrchat:social-summary", async (_event, force = false) => {
  const settings = await readSettings();
  resolver.setAuthCookie(settings.vrchatAuthCookie);
  const summary = await resolver.fetchSocialSummary({ force: Boolean(force) });
  if (isBetaClient()) companionStore().recordSocialSnapshot(summary);
  return summary;
});

ipcMain.handle("vrchat:user-profile", async (_event, userId) => {
  const settings = await readSettings();
  resolver.setAuthCookie(settings.vrchatAuthCookie);
  return resolver.fetchUserProfile(String(userId || ""));
});

ipcMain.handle("vrchat:group", async (_event, groupId) => {
  const settings = await readSettings();
  resolver.setAuthCookie(settings.vrchatAuthCookie);
  return resolver.fetchGroup(String(groupId || ""));
});

ipcMain.handle("vrchat:personal-collection", async (_event, kind, force = false) => {
  const settings = await readSettings();
  resolver.setAuthCookie(settings.vrchatAuthCookie);
  return resolver.fetchPersonalCollection(String(kind || ""), { force: Boolean(force) });
});

ipcMain.handle("vrchat:avatar", async (_event, avatarId) => {
  if (isProtectedAvatarId(avatarId)) throw new Error("avatar_is_protected");
  const settings = await readSettings();
  resolver.setAuthCookie(settings.vrchatAuthCookie);
  return resolver.fetchAvatar(avatarId);
});

ipcMain.handle("vrchat:avatar-search", async (_event, avatarName) => {
  const settings = await readSettings();
  resolver.setAuthCookie(settings.vrchatAuthCookie);
  return filterProtectedAvatarPayload(await resolver.searchAvatarCandidates(avatarName));
});

ipcMain.handle("vrchat:avatar-browse", async (_event, searchText) => {
  const settings = await readSettings();
  resolver.setAuthCookie(settings.vrchatAuthCookie);
  return filterProtectedAvatarPayload(await resolver.searchAvatars(searchText));
});

ipcMain.handle("vrchat:avatar-favorite", async (_event, avatarId) => {
  if (isProtectedAvatarId(avatarId)) throw new Error("avatar_is_protected");
  const settings = await readSettings();
  resolver.setAuthCookie(settings.vrchatAuthCookie);
  return resolver.favoriteAvatar(avatarId);
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
    authorAlias: body.authorAlias,
    hwid,
    appVersion: app.getVersion(),
    rememberMe: Boolean(body.rememberMe)
  });
  await writeSettings({
    serverUrl: body.serverUrl,
    vrchatAuthCookie: nextCookie,
    rememberMe: Boolean(body.rememberMe),
    sessionToken: payload.sessionToken,
    license: payload.license,
    freeMode: false
  });
  await refreshProtectedAvatarUsers();
  await startHeartbeat();
  return payload;
});

ipcMain.handle("client:validate", async () => {
  const payload = await validateCurrentSession();
  if (payload.accessMode === "free") {
    await refreshProtectedAvatarUsers().catch(() => {
      protectedAvatarProtectionReady = false;
    });
  } else {
    await refreshProtectedAvatarUsers();
  }
  return payload;
});

ipcMain.handle("client:logout", async () => {
  const settings = await readSettings();
  await endCurrentPlaySession().catch(() => {});
  const preserveStableSession = isBetaClient() && settings.importedStableSession === true;
  if (settings.sessionToken && !preserveStableSession) {
    const hwid = await getHardwareId();
    await apiPost("/auth/logout", { sessionToken: settings.sessionToken, hwid }).catch(() => {});
  }
  await writeSettings({ ...settings, sessionToken: "", license: null, importedStableSession: false, freeMode: false });
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
    if (isFreeMode(settings)) {
      currentPlaySessionId = companionStore().createSession({ worldName });
      return currentPlaySessionId;
    }
    const hwid = await getHardwareId();
    const payload = await apiPost("/play-sessions/start", {
      sessionToken: settings.sessionToken,
      hwid,
      worldName: worldName || null
    });
    currentPlaySessionId = payload.playSessionId;
    if (isBetaClient() && currentPlaySessionId) {
      companionStore().ensureSession(currentPlaySessionId, { worldName });
    }
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
  const deferPlaySession = isBetaClient() && safeOptions.deferPlaySession === true;
  pendingPlaySessionWorldName = safeOptions.worldName || null;
  if (!deferPlaySession) await startCurrentPlaySession(safeOptions.worldName);

  return { ok: true, playSessionId: currentPlaySessionId };
});

function hasMeaningfulPlaySessionStats(stats) {
  return Boolean(
    String(stats?.worldName || "").trim()
    || Number(stats?.playerCount) > 0
    || Number(stats?.avatarCount) > 0
    || Number(stats?.eventCount) > 0
    || (Array.isArray(stats?.snapshot?.players) && stats.snapshot.players.length > 0)
  );
}

async function updateCurrentPlaySession(stats, end = false) {
  if (!currentPlaySessionId) return { ok: false, error: "no_active_play_session" };
  const settings = await readSettings();
  if (isFreeMode(settings)) return companionStore().updateSession(currentPlaySessionId, stats, { end });
  if (isBetaClient()) {
    companionStore().ensureSession(currentPlaySessionId, { worldName: stats?.worldName || "" });
    companionStore().updateSession(currentPlaySessionId, stats, { end });
  }
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
    const snapshot = stats.snapshot && typeof stats.snapshot === "object" ? stats.snapshot : {};
    const { playerEvents: _playerEvents, worldVisits: _worldVisits, ...sharedSnapshot } = snapshot;
    body.snapshot = sharedSnapshot;
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
    if (!currentPlaySessionId) {
      if (!isBetaClient() || !hasMeaningfulPlaySessionStats(stats)) {
        return isBetaClient() ? { ok: true, deferred: true, playSessionId: null } : { ok: false, error: "no_active_play_session" };
      }
      await startCurrentPlaySession(stats?.worldName || pendingPlaySessionWorldName || null);
      if (!currentPlaySessionId) return { ok: false, error: "play_session_start_failed" };
    }
    const result = await updateCurrentPlaySession(stats, false);
    return { ...result, playSessionId: currentPlaySessionId };
  } catch {
    return { ok: false };
  }
});

ipcMain.handle("tail:stop", async (_event, stats) => {
  await endCurrentPlaySession(stats);
  pendingPlaySessionWorldName = null;
  await tailer.stop();
  return { ok: true };
});

ipcMain.handle("play-sessions:list", async () => {
  const settings = await readSettings();
  if (isFreeMode(settings)) return companionStore().listSessions(1_000);
  const hwid = await getHardwareId();
  const payload = await apiPost("/play-sessions/list", {
    sessionToken: settings.sessionToken,
    hwid,
    limit: 200
  });
  const sessions = payload.sessions ?? [];
  if (isBetaClient()) companionStore().ingestSessions(sessions);
  return sessions;
});

ipcMain.handle("companion:search", async (_event, query) => {
  if (!isBetaClient()) throw new Error("companion_search_requires_beta");
  return companionStore().search(String(query || ""), 50);
});

ipcMain.handle("companion:details", async (_event, kind, key) => {
  if (!isBetaClient()) throw new Error("companion_details_requires_beta");
  const safeKind = kind === "player" || kind === "world" || kind === "avatar" ? kind : "";
  if (!safeKind) throw new Error("invalid_companion_entity");
  return companionStore().details(safeKind, String(key || ""), 40);
});

ipcMain.handle("companion:save-player-preference", async (_event, preference) => {
  if (!isBetaClient()) throw new Error("companion_preferences_require_beta");
  return companionStore().savePlayerPreference(preference || {});
});

ipcMain.handle("companion:list-watched-players", async () => {
  if (!isBetaClient()) return [];
  return companionStore().listWatchedPlayers();
});

ipcMain.handle("companion:social-events", async (_event, limit = 500) => {
  if (!isBetaClient()) return [];
  return companionStore().listSocialEvents(limit);
});

ipcMain.handle("companion:save-world-preference", async (_event, preference) => {
  if (!isBetaClient()) throw new Error("companion_preferences_require_beta");
  return companionStore().saveWorldPreference(preference || {});
});

ipcMain.handle("companion:storage-stats", async () => {
  if (!isBetaClient()) throw new Error("companion_storage_requires_beta");
  return companionStore().storageStats();
});

ipcMain.handle("companion:set-retention", async (_event, days) => {
  if (!isBetaClient()) throw new Error("companion_storage_requires_beta");
  return companionStore().setRetentionDays(days);
});

ipcMain.handle("companion:export", async (event, uiSettings) => {
  if (!isBetaClient()) throw new Error("companion_backup_requires_beta");
  const parent = BrowserWindow.fromWebContents(event.sender) || undefined;
  const date = new Date().toISOString().slice(0, 10);
  const saveOptions = {
    title: "Экспорт локальных данных",
    defaultPath: path.join(app.getPath("documents"), `VRChat-Admin-Tools-backup-${date}.json`),
    filters: [{ name: "JSON", extensions: ["json"] }]
  };
  const result = await (parent ? dialog.showSaveDialog(parent, saveOptions) : dialog.showSaveDialog(saveOptions));
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };
  return companionStore().exportToFile(result.filePath, uiSettings || {});
});

ipcMain.handle("companion:import", async (event) => {
  if (!isBetaClient()) throw new Error("companion_backup_requires_beta");
  const parent = BrowserWindow.fromWebContents(event.sender) || undefined;
  const openOptions = {
    title: "Импорт локальных данных",
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  };
  const result = await (parent ? dialog.showOpenDialog(parent, openOptions) : dialog.showOpenDialog(openOptions));
  if (result.canceled || !result.filePaths?.[0]) return { ok: false, canceled: true };
  const filePath = result.filePaths[0];
  const info = await fs.stat(filePath);
  if (info.size > 50 * 1024 * 1024) throw new Error("backup_file_too_large");
  const payload = JSON.parse(await fs.readFile(filePath, "utf8"));
  return { ...companionStore().importData(payload), filePath };
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

ipcMain.handle("moderation:request-group-ban", async (_event, request) => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const payload = await apiPost("/moderation/ban-requests", {
    sessionToken: settings.sessionToken,
    hwid,
    targetUserId: request?.targetUserId,
    targetDisplayName: request?.targetDisplayName,
    reason: request?.reason,
    evidenceUrl: request?.evidenceUrl,
    durationMinutes: request?.durationMinutes ?? null
  });
  return {
    ...payload.request,
    deduplicated: payload.deduplicated === true,
    retryAfterSeconds: Number(payload.retryAfterSeconds || 0)
  };
});

ipcMain.handle("moderation:request-group-unban", async (_event, request) => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const payload = await apiPost("/moderation/unban-requests", {
    sessionToken: settings.sessionToken,
    hwid,
    targetUserId: request?.targetUserId,
    targetDisplayName: request?.targetDisplayName,
    reason: request?.reason,
    evidenceUrl: request?.evidenceUrl
  });
  return {
    ...payload.request,
    deduplicated: payload.deduplicated === true,
    retryAfterSeconds: Number(payload.retryAfterSeconds || 0)
  };
});

ipcMain.handle("moderation:list-group-ban-requests", async () => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const payload = await apiPost("/moderation/ban-requests/list", {
    sessionToken: settings.sessionToken,
    hwid,
    limit: 200
  });
  return payload.requests ?? [];
});

ipcMain.handle("moderation:retry-group-ban-request", async (_event, requestId) => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const safeRequestId = String(requestId || "").trim();
  if (!/^[0-9a-f-]{36}$/iu.test(safeRequestId)) {
    throw new Error("invalid_moderation_request_id");
  }
  const payload = await apiPost(`/moderation/ban-requests/${encodeURIComponent(safeRequestId)}/retry`, {
    sessionToken: settings.sessionToken,
    hwid
  });
  return payload.request;
});

ipcMain.handle("group-management:request", async (_event, request) => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const payload = await apiPost("/group-management/requests", {
    sessionToken: settings.sessionToken,
    hwid,
    action: request?.action,
    query: request?.query,
    offset: request?.offset,
    limit: request?.limit,
    targetUserId: request?.targetUserId,
    targetDisplayName: request?.targetDisplayName,
    roleId: request?.roleId,
    roleName: request?.roleName,
    managerNotes: request?.managerNotes
  });
  return payload.request;
});

ipcMain.handle("group-management:list-requests", async () => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const payload = await apiPost("/group-management/requests/list", {
    sessionToken: settings.sessionToken,
    hwid,
    limit: 200
  });
  return payload.requests ?? [];
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
  if (isProtectedAvatarId(entry?.avatarId)) throw new Error("avatar_is_protected");
  const settings = await readSettings();
  const hwid = await getHardwareId();
  return apiPost("/avatar-catalog", {
    sessionToken: settings.sessionToken,
    hwid,
    avatarName: entry?.avatarName,
    avatarId: entry?.avatarId,
    sourceUserId: entry?.sourceUserId
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
  if (isProtectedAvatarId(note?.avatarId)) throw new Error("avatar_is_protected");
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

ipcMain.handle("global-avatar-notes:list", async () => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const payload = await apiPost("/global-avatar-notes/list", {
    sessionToken: settings.sessionToken,
    hwid,
    limit: 5_000
  });
  return payload.notes ?? [];
});

ipcMain.handle("global-avatar-notes:save", async (_event, note) => {
  if (isProtectedAvatarId(note?.avatarId)) throw new Error("avatar_is_protected");
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const avatarId = String(note?.avatarId || "");
  const payload = await apiRequest(`/global-avatar-notes/${encodeURIComponent(avatarId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      sessionToken: settings.sessionToken,
      hwid,
      avatarName: note?.avatarName,
      avatarId,
      status: note?.status,
      note: note?.note
    })
  });
  return payload.note;
});

ipcMain.handle("global-avatar-notes:remove", async (_event, avatarIdValue) => {
  const settings = await readSettings();
  const hwid = await getHardwareId();
  const avatarId = String(avatarIdValue || "");
  return apiRequest(`/global-avatar-notes/${encodeURIComponent(avatarId)}`, {
    method: "DELETE",
    body: JSON.stringify({ sessionToken: settings.sessionToken, hwid })
  });
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
  pendingPlaySessionWorldName = currentInstance?.worldName || currentUser?.worldName || safeOptions.worldName || null;
  if (!currentPlaySessionId && !(isBetaClient() && safeOptions.deferPlaySession === true)) {
    await startCurrentPlaySession(currentInstance?.worldName || currentUser?.worldName || null);
  }
  return { ok: true, currentUser, currentInstance, followState, playSessionId: currentPlaySessionId };
});

ipcMain.handle("tail:latest-file", async () => {
  const filePath = await findLatestLogFile().catch(() => null);
  return { filePath: filePath ? rememberApprovedLogFile(filePath) : null };
});

ipcMain.handle("tail:read-today-players", async () => {
  await validateCurrentSession();
  return readTodayPlayers(defaultLogDirectory(), {
    maxPlayers: 10000
  });
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
    mainWindow.setMinimumSize(560, 360);
    mainWindow.setBounds({
      x: current.x,
      y: current.y,
      width: Math.min(current.width, 720),
      height: Math.min(current.height, 520)
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
