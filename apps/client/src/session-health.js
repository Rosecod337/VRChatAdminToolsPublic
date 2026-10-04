"use strict";

const path = require("node:path");

function buildSessionHealth({ tailer = {}, pipeline = {}, file = null, lastEventAt = null, metrics = [], minimized = false } = {}) {
  const finite = (value) => Number.isFinite(Number(value)) && value !== null && value !== undefined ? Number(value) : null;
  const workingSets = metrics.map((row) => finite(row.memory?.workingSetSize)).filter((value) => value !== null);
  const cpus = metrics.map((row) => finite(row.cpu?.percentCPUUsage)).filter((value) => value !== null);
  const name = tailer.currentFile ? path.win32.basename(path.basename(String(tailer.currentFile))).slice(0, 160) : null;
  const error = ["ENOENT", "EACCES", "EPERM", "EIO", "EBUSY", "read-error"].includes(tailer.lastReadError) ? tailer.lastReadError : name && !file ? "ENOENT" : null;
  return {
    sampledAt: new Date().toISOString(), running: tailer.running === true, fileName: name,
    log: file ? { bytes: finite(file.size), modifiedAt: file.mtime instanceof Date ? file.mtime.toISOString() : null, cursor: finite(tailer.position) } : null,
    lastEventAt: Number.isFinite(lastEventAt) ? new Date(lastEventAt).toISOString() : null,
    lastReadAt: Number.isFinite(tailer.lastReadAt) ? new Date(tailer.lastReadAt).toISOString() : null,
    logError: error,
    pipeline: { status: ["connected", "connecting", "disconnected", "error"].includes(pipeline.status) ? pipeline.status : "unknown", lastEventAt: Number.isFinite(pipeline.lastEventAt) ? new Date(pipeline.lastEventAt).toISOString() : null },
    resources: { processCount: metrics.length, workingSetMiB: workingSets.length ? workingSets.reduce((sum, value) => sum + value, 0) / 1024 : null, cpuPercent: cpus.length ? cpus.reduce((sum, value) => sum + value, 0) : null, source: "Electron app.getAppMetrics" },
    minimized
  };
}

function redactedHealthReport(value) {
  return { format: "vrchat-session-health", version: 1, sampledAt: value.sampledAt, running: value.running, logError: value.logError, lastReadAt: value.lastReadAt, lastEventAt: value.lastEventAt, pipeline: value.pipeline, resources: value.resources, minimized: value.minimized };
}
module.exports = { buildSessionHealth, redactedHealthReport };
