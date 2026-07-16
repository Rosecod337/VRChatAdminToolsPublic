"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { app, BrowserWindow, ipcMain, safeStorage, shell } = require("electron");

const DEFAULT_SETTINGS = {
  serverUrl: "http://localhost:8080",
  adminToken: ""
};

let mainWindow;
const API_TIMEOUT_MS = 20_000;

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

function decryptAdminToken(value) {
  if (!value || !canEncryptSettings()) return "";
  try {
    return safeStorage.decryptString(Buffer.from(String(value), "base64"));
  } catch {
    return "";
  }
}

async function readSettings() {
  try {
    const raw = await fs.readFile(settingsPath(), "utf8");
    const parsed = JSON.parse(raw);
    const normalized = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      adminToken: decryptAdminToken(parsed?.protected?.adminToken) || parsed.adminToken || ""
    };
    delete normalized.protected;
    if (parsed.adminToken && canEncryptSettings()) await writeSettings(normalized);
    return normalized;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

async function writeSettings(settings) {
  const normalized = {
    serverUrl: String(settings.serverUrl || DEFAULT_SETTINGS.serverUrl).replace(/\/+$/u, ""),
    adminToken: String(settings.adminToken || "")
  };
  const stored = { ...normalized };
  if (canEncryptSettings()) {
    stored.protected = {};
    if (normalized.adminToken) {
      stored.protected.adminToken = safeStorage.encryptString(normalized.adminToken).toString("base64");
    }
    stored.adminToken = "";
  }
  await fs.mkdir(path.dirname(settingsPath()), { recursive: true });
  await fs.writeFile(settingsPath(), JSON.stringify(stored, null, 2), "utf8");
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
  const url = `${settings.serverUrl}${route}`;
  const response = await fetchWithTimeout(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-admin-token": settings.adminToken,
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `HTTP ${response.status}`);
  }
  return payload;
}

function openExternalHttpsUrl(value) {
  const url = new URL(String(value || ""));
  if (url.protocol !== "https:") throw new Error("Only HTTPS links can be opened");
  return shell.openExternal(url.toString());
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 920,
    minHeight: 620,
    title: "VRChat Key Admin",
    backgroundColor: "#101317",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("settings:get", () => readSettings());
ipcMain.handle("settings:save", (_event, settings) => writeSettings(settings));
ipcMain.handle("admin:list", () => apiRequest("/admin/licenses"));
ipcMain.handle("admin:create", (_event, body) =>
  apiRequest("/admin/licenses", { method: "POST", body: JSON.stringify(body || {}) })
);
ipcMain.handle("admin:update", (_event, id, body) =>
  apiRequest(`/admin/licenses/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body || {}) })
);
ipcMain.handle("admin:revoke", (_event, id) =>
  apiRequest(`/admin/licenses/${encodeURIComponent(id)}/revoke`, { method: "POST", body: "{}" })
);
ipcMain.handle("shell:open", (_event, url) => openExternalHttpsUrl(url));
