"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { spawn } = require("node:child_process");
const APPS = Object.freeze({ "vrchat.exe": "VRChat", "discord.exe": "Discord", "obs64.exe": "OBS Studio", "steam.exe": "Steam", "vrcx.exe": "VRCX" });

class WorkflowService {
  constructor(database, { launch = null, preview = false } = {}) {
    this.database = database; this.preview = preview;
    this.launch = launch || ((file, arguments_) => new Promise((resolve, reject) => {
      const child = spawn(file, arguments_, { detached: true, stdio: "ignore", windowsHide: true, shell: false });
      child.once("error", reject);
      child.once("spawn", () => { child.unref(); resolve({ started: true }); });
    }));
    database.exec("CREATE TABLE IF NOT EXISTS personal_apps(id TEXT PRIMARY KEY, name TEXT NOT NULL, file_path TEXT NOT NULL UNIQUE, executable_name TEXT NOT NULL)");
  }
  list() { return this.database.prepare("SELECT id,name,executable_name FROM personal_apps ORDER BY name").all().map((row) => ({ id: row.id, name: row.name, executable: row.executable_name })); }
  async approve(filePath) {
    const resolved = await fs.realpath(String(filePath || ""));
    const executable = path.basename(resolved).toLowerCase();
    if (!Object.hasOwn(APPS, executable)) throw new Error("workflow_app_not_allowed");
    const stat = await fs.stat(resolved);
    if (!stat.isFile() || stat.size < 2 || stat.size > 512 * 1024 * 1024) throw new Error("workflow_app_invalid");
    const file = await fs.open(resolved, "r");
    const header = Buffer.alloc(2);
    try { await file.read(header, 0, 2, 0); } finally { await file.close(); }
    if (header.toString("ascii") !== "MZ") throw new Error("workflow_app_invalid");
    const existing = this.database.prepare("SELECT id FROM personal_apps WHERE file_path=?").get(resolved);
    const id = existing?.id || randomUUID();
    this.database.prepare("INSERT INTO personal_apps(id,name,file_path,executable_name) VALUES (?,?,?,?) ON CONFLICT(file_path) DO NOTHING").run(id, APPS[executable], resolved, executable);
    return this.list().find((row) => row.id === id);
  }
  async run(id, vrMode = "vr") {
    const row = this.database.prepare("SELECT * FROM personal_apps WHERE id=?").get(String(id || ""));
    if (!row || !Object.hasOwn(APPS, row.executable_name)) throw new Error("workflow_app_missing");
    const resolved = await fs.realpath(row.file_path);
    if (resolved !== row.file_path || path.basename(resolved).toLowerCase() !== row.executable_name) throw new Error("workflow_app_changed");
    if (this.preview) return { started: false, preview: true, name: row.name };
    const arguments_ = row.executable_name === "vrchat.exe" && vrMode === "desktop" ? ["--no-vr"] : [];
    return { ...(await this.launch(resolved, arguments_)), name: row.name };
  }
}

module.exports = { WorkflowService, APPS };
