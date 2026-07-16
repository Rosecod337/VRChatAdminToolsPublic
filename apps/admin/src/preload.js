"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("adminApi", {
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings) => ipcRenderer.invoke("settings:save", settings),
  listLicenses: () => ipcRenderer.invoke("admin:list"),
  createLicense: (body) => ipcRenderer.invoke("admin:create", body),
  updateLicense: (id, body) => ipcRenderer.invoke("admin:update", id, body),
  revokeLicense: (id) => ipcRenderer.invoke("admin:revoke", id),
  openExternal: (url) => ipcRenderer.invoke("shell:open", url)
});
