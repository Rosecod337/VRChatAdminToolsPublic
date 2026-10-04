"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("preferencesApi", {
  get: () => ipcRenderer.invoke("preferences:get"),
  onSnapshot: (handler) => ipcRenderer.on("preferences:snapshot", (_event, snapshot) => handler(snapshot)),
  save: (draft) => ipcRenderer.invoke("preferences:save", draft),
  action: (action) => ipcRenderer.invoke("preferences:action", action),
  data: (action, value) => ipcRenderer.invoke("preferences:data", action, value),
  close: () => ipcRenderer.invoke("preferences:close")
});
