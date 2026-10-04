"use strict";

const { spawn } = require("node:child_process");
const os = require("node:os");

class GameProcessMonitor {
  constructor({ launch = spawn } = {}) { this.launch = launch; this.worker = null; this.previous = null; this.latest = null; }
  start() {
    if (this.worker || process.platform !== "win32") return;
    const script = "$ErrorActionPreference='SilentlyContinue'; while($true){$p=Get-Process -Name VRChat | Select-Object -First 1; if($p){[Console]::WriteLine((@{pid=$p.Id;cpu=$p.CPU;memory=$p.WorkingSet64}|ConvertTo-Json -Compress))}else{[Console]::WriteLine('{}')}; Start-Sleep -Seconds 10}";
    this.worker = this.launch("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], { windowsHide: true, stdio: ["ignore", "pipe", "ignore"] });
    const worker = this.worker;
    let pending = "";
    this.worker.stdout.on("data", (chunk) => {
      if (this.worker !== worker) return;
      pending = (pending + String(chunk)).slice(-4096);
      let index; while ((index = pending.indexOf("\n")) >= 0) {
        const line = pending.slice(0, index); pending = pending.slice(index + 1);
        try {
          const value = JSON.parse(line), now = Date.now();
          const cpu = this.previous && value.pid === this.previous.pid && typeof value.cpu === "number" && typeof this.previous.cpu === "number" && value.cpu >= this.previous.cpu && now > this.previous.at ? (value.cpu - this.previous.cpu) * 1000 / (now - this.previous.at) / Math.max(1, os.cpus().length) * 100 : null;
          this.latest = { running: Boolean(value.pid), cpuPercent: cpu, memoryMiB: typeof value.memory === "number" ? value.memory / 1048576 : null, sampledAt: new Date(now).toISOString() };
          this.previous = { pid: value.pid, cpu: value.cpu, at: now };
        } catch { this.latest = null; }
      }
    });
    this.worker.on("error", () => { if (this.worker === worker) this.latest = null; });
    this.worker.on("exit", () => { if (this.worker === worker) { this.worker = null; this.latest = null; } });
  }
  stop() { this.worker?.kill(); this.worker = null; this.previous = null; this.latest = null; }
}
module.exports = { GameProcessMonitor };
