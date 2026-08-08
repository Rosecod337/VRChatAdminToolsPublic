"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("adminApi", {
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings) => ipcRenderer.invoke("settings:save", settings),
  listLicenses: () => ipcRenderer.invoke("admin:list"),
  createLicense: (body) => ipcRenderer.invoke("admin:create", body),
  updateLicense: (id, body) => ipcRenderer.invoke("admin:update", id, body),
  resetLicenseDevices: (id) => ipcRenderer.invoke("admin:reset-devices", id),
  reissueLicense: (id) => ipcRenderer.invoke("admin:reissue", id),
  extendLicense: (id, days = 30) => ipcRenderer.invoke("admin:extend", id, days),
  revokeLicense: (id) => ipcRenderer.invoke("admin:revoke", id),
  openExternal: (url) => ipcRenderer.invoke("shell:open", url)
});
