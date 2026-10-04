"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const path = require("node:path");
const { EventEmitter } = require("node:events");
const { registerPreferencesWindow, sanitizeUiSettings, sanitizeBackupUi } = require("../apps/client/src/preferences-window");

function fixture() {
  const handles = new Map();
  const events = new Map();
  const windows = [];
  class FakeWindow extends EventEmitter {
    constructor(options) {
      super(); this.options = options; this.destroyed = false;
      this.webContents = new EventEmitter(); this.webContents.mainFrame = {};
      this.webContents.setWindowOpenHandler = (handler) => { this.openHandler = handler; };
      this.webContents.send = (channel, payload) => { this.lastMessage = { channel, payload }; };
      windows.push(this);
    }
    isDestroyed() { return this.destroyed; }
    removeMenu() {}
    show() { this.shown = true; }
    focus() { this.focused = true; }
    loadFile(file) { this.file = file; return Promise.resolve(); }
    close() { this.destroyed = true; this.emit("closed"); }
  }
  const parent = new FakeWindow({});
  const ipcMain = { handle: (channel, handler) => handles.set(channel, handler), on: (channel, handler) => events.set(channel, handler) };
  const operations = { stats: async () => ({ sessions: 0 }) };
  registerPreferencesWindow({ app: { isPackaged: false }, BrowserWindow: FakeWindow, ipcMain, getParent: () => parent, getRendererPath: () => path.resolve(__dirname, "../apps/client-beta/renderer/index.html"), operations });
  const sender = (window) => ({ sender: window.webContents, senderFrame: window.webContents.mainFrame });
  const open = () => handles.get("preferences:open")(sender(parent), { uiSettings: { language: "ru", scale: 100, animations: true }, defaults: { scale: 100 }, appearance: { font: "system", shell: "studio" }, licenseKey: "do-not-copy", backupUi: { sessionToken: "do-not-copy" } });
  return { handles, events, windows, parent, sender, open };
}

test("preferences IPC drops secrets and bounds UI values and backup payload", () => {
  assert.deepEqual(sanitizeUiSettings({ scale: 900, eventLimit: 5000, language: "ru", sessionToken: "secret", animations: "false", uiSidebarWidth: 900 }), { uiPlacement: "left", density: "comfortable", eventLimit: 5000, language: "ru", uiSidebarWidth: 360 });
  const data = sanitizeBackupUi({ uiSettings: { scale: 90, authCookie: "secret" }, sessionToken: "secret", savedLayout: { unknown: "secret", betaBuilderLayout: "x", betaInterfaceProfilesV1: "x".repeat(1024 * 1024 + 1) } });
  assert.deepEqual(data, { uiSettings: { uiPlacement: "left", density: "comfortable", scale: 90 }, savedLayout: { betaBuilderLayout: "x" } });
});

test("preferences is a single nonmodal sandboxed child and refuses other senders", async () => {
  const f = fixture();
  assert.throws(() => f.handles.get("preferences:open")({ sender: {}, senderFrame: {} }, {}), /sender_denied/u);
  f.open();
  const child = f.windows[1];
  assert.equal(child.options.modal, false);
  assert.equal(child.options.webPreferences.nodeIntegration, false);
  assert.equal(child.options.webPreferences.sandbox, true);
  assert.equal(child.options.webPreferences.backgroundThrottling, true);
  f.open();
  assert.equal(f.windows.length, 2);
  assert.equal(child.focused, true);
  assert.throws(() => f.handles.get("preferences:get")(f.sender(f.parent)), /sender_denied/u);
  const snapshot = f.handles.get("preferences:get")(f.sender(child));
  assert.equal(snapshot.fonts.length, 1);
  assert.equal(snapshot.backupUi, undefined);
  assert.equal(snapshot.licenseKey, undefined);
  await assert.rejects(f.handles.get("preferences:data")(f.sender(child), "vrchat-login", {}), /operation_denied/u);
  await assert.rejects(f.handles.get("preferences:data")(f.sender(child), "retention", 1), /operation_denied/u);
  child.close();
});

test("preferences waits for the main renderer to confirm persistence", async () => {
  const f = fixture(); f.open();
  const child = f.windows[1];
  const saved = f.handles.get("preferences:save")(f.sender(child), { uiSettings: { scale: 90, sessionToken: "secret" }, appearance: { font: "tahoma", preset: "studio" } });
  const request = f.parent.lastMessage.payload;
  assert.deepEqual(request.value.uiSettings, { uiPlacement: "left", density: "comfortable", scale: 90 });
  let resolved = false; saved.then(() => { resolved = true; });
  f.events.get("preferences:reply")(f.sender(child), { id: request.id, snapshot: { uiSettings: { scale: 200 } } });
  await Promise.resolve(); assert.equal(resolved, false);
  f.events.get("preferences:reply")(f.sender(f.parent), { id: request.id, snapshot: { uiSettings: { scale: 90 }, appearance: { font: "tahoma" } } });
  assert.equal((await saved).uiSettings.scale, 90);
  child.close();
});

test("closing the main window destroys preferences and rejects pending work", async () => {
  const f = fixture(); f.open();
  const pending = f.handles.get("preferences:save")(f.sender(f.windows[1]), { uiSettings: { scale: 125 } });
  f.parent.close();
  await assert.rejects(pending, /window_closed/u);
  assert.equal(f.windows[1].isDestroyed(), true);
});
