"use strict";

const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

let parser;
try {
  parser = require("@vrchat-log-suite/parser");
} catch {
  parser = require("../../../packages/parser");
}

function defaultLogDirectory() {
  return path.join(os.homedir(), "AppData", "LocalLow", "VRChat", "VRChat");
}

async function findLatestLogFile(directory = defaultLogDirectory()) {
  const logs = await findRecentLogFiles(directory, 1);
  return logs[0]?.fullPath || null;
}

function isVrchatLogName(name) {
  return /^output_log_.*\.txt$/iu.test(name);
}

async function findRecentLogFiles(directory = defaultLogDirectory(), limit = 6) {
  const entries = await fsp.readdir(directory, { withFileTypes: true });
  const candidates = [];
  for (const entry of entries) {
    if (!entry.isFile() || !isVrchatLogName(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    const stat = await fsp.stat(fullPath);
    candidates.push({ fullPath, mtimeMs: stat.mtimeMs });
  }
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates.slice(0, limit);
}

function localDateStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameLocalDate(left, right) {
  return localDateStamp(left) === localDateStamp(right);
}

async function findTodayLogFiles(directory = defaultLogDirectory(), limit = 24, referenceDate = new Date()) {
  const entries = await fsp.readdir(directory, { withFileTypes: true });
  const today = localDateStamp(referenceDate);
  const candidates = [];
  for (const entry of entries) {
    if (!entry.isFile() || !isVrchatLogName(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    const stat = await fsp.stat(fullPath);
    if (!entry.name.startsWith(`output_log_${today}_`) && !sameLocalDate(stat.mtime, referenceDate)) continue;
    candidates.push({ fullPath, mtimeMs: stat.mtimeMs });
  }
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates.slice(0, limit);
}

function clampInt(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(Math.max(Math.trunc(number), min), max);
}

async function logEntryFromPath(filePath) {
  const fullPath = path.resolve(String(filePath || ""));
  const stat = await fsp.stat(fullPath);
  return { fullPath, mtimeMs: stat.mtimeMs };
}

function uniqueLogEntries(entries) {
  const seen = new Set();
  const result = [];
  for (const entry of entries) {
    const key = path.resolve(entry.fullPath).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }
  return result;
}

class LogTailer extends EventEmitter {
  constructor() {
    super();
    this.currentFile = null;
    this.position = 0;
    this.carry = "";
    this.timer = null;
    this.rotationTimer = null;
    this.running = false;
    this.readInFlight = false;
    this.parser = typeof parser.createParser === "function" ? parser.createParser() : parser;
  }

  async start(options = {}) {
    await this.stop();
    const filePath = options.filePath || await findLatestLogFile();
    if (!filePath) throw new Error("VRChat log file not found");

    const stat = await fsp.stat(filePath);
    await this.beginFollowing(filePath, {
      position: options.fromStart ? 0 : stat.size,
      resetParser: true,
      message: options.fromStart ? "Чтение с начала файла" : "Отслеживание новых строк"
    });
  }

  async beginFollowing(filePath, options = {}) {
    const stat = await fsp.stat(filePath);
    this.currentFile = filePath;
    this.position = Math.min(Math.max(Number(options.position) || 0, 0), stat.size);
    this.carry = "";
    if (options.parser) this.parser = options.parser;
    else if (options.resetParser !== false) this.parser.reset?.();
    this.running = true;
    this.emit("status", {
      running: true,
      filePath,
      message: options.message || "Отслеживание новых строк"
    });

    this.timer = setInterval(() => {
      this.readNewBytes().catch((error) => this.emit("error", error));
    }, 600);

    this.rotationTimer = setInterval(() => {
      this.checkRotation().catch((error) => this.emit("error", error));
    }, 2500);

    await this.readNewBytes();
  }

  async stop() {
    if (this.timer) clearInterval(this.timer);
    if (this.rotationTimer) clearInterval(this.rotationTimer);
    this.timer = null;
    this.rotationTimer = null;
    this.running = false;
    if (this.currentFile) {
      this.emit("status", { running: false, filePath: this.currentFile, message: "Остановлено" });
    }
  }

  async checkRotation() {
    if (!this.running || !this.currentFile || this.readInFlight) return;
    const latest = await findLatestLogFile(path.dirname(this.currentFile));
    if (latest && latest !== this.currentFile) {
      const previousFile = this.currentFile;
      this.currentFile = latest;
      this.position = 0;
      this.carry = "";
      this.parser.reset?.();
      this.emit("rotation", { previousFile, filePath: latest });
      this.emit("status", { running: true, filePath: latest, message: "Переключено на новый лог" });
      await this.readNewBytes();
    }
  }

  async readNewBytes() {
    if (!this.running || !this.currentFile || this.readInFlight) return;
    const filePath = this.currentFile;
    this.readInFlight = true;
    try {
      const stat = await fsp.stat(filePath);
      if (!this.running || this.currentFile !== filePath) return;

      let position = this.position;
      if (stat.size < position) {
        position = 0;
        this.carry = "";
        this.parser.reset?.();
        this.emit("rotation", { previousFile: filePath, filePath, reason: "truncated" });
        this.emit("status", { running: true, filePath, message: "Лог был перезаписан, чтение начато заново" });
      }
      if (stat.size === position) {
        this.position = position;
        return;
      }

      const chunk = await readRange(filePath, position, stat.size - 1);
      if (!this.running || this.currentFile !== filePath) return;
      this.position = stat.size;
      this.consume(chunk);
    } finally {
      this.readInFlight = false;
    }
  }

  async analyzeCurrentInstance(filePath, options = {}) {
    const explicitFilePaths = Array.isArray(options.filePaths)
      ? options.filePaths.filter(Boolean)
      : [];
    const target = filePath || explicitFilePaths[explicitFilePaths.length - 1] || this.currentFile || await findLatestLogFile();
    if (!target) throw new Error("VRChat log file not found");
    await this.stop();

    const mode = String(options.mode || "recent").toLowerCase();
    const maxFiles = clampInt(options.maxFiles ?? 3, 1, 60);
    const maxLines = clampInt(options.maxLines ?? 30000, 1000, 100000);
    const maxBytesPerFile = clampInt(options.maxBytesPerFile ?? 4 * 1024 * 1024, 256 * 1024, 12 * 1024 * 1024);
    const directory = path.dirname(target);
    let logs = [];

    if (explicitFilePaths.length > 0 || mode === "manual") {
      logs = await Promise.all(explicitFilePaths.slice(0, maxFiles).map(logEntryFromPath));
    } else if (mode === "current") {
      logs = [await logEntryFromPath(target)];
    } else if (mode === "today") {
      logs = await findTodayLogFiles(directory, maxFiles);
      if (logs.length === 0) logs = await findRecentLogFiles(directory, Math.min(maxFiles, 3));
    } else {
      logs = await findRecentLogFiles(directory, maxFiles);
    }

    const selectedLogs = uniqueLogEntries(logs).sort((a, b) => a.mtimeMs - b.mtimeMs);
    if (selectedLogs.length === 0) throw new Error("VRChat log file not found");

    let lines = [];
    const snapshots = new Map();
    for (const log of selectedLogs) {
      const snapshot = await readLastLinesSnapshot(log.fullPath, Math.ceil(maxLines / selectedLogs.length), maxBytesPerFile);
      snapshots.set(path.resolve(log.fullPath).toLowerCase(), snapshot);
      lines.push(...snapshot.lines);
      if (lines.length > maxLines) lines = lines.slice(-maxLines);
    }

    const boundary = findCurrentInstanceStartIndex(lines, options.expectedLocation);
    const startIndex = boundary.startIndex;
    const boundaryType = boundary.type;

    const scopedLines = lines.slice(startIndex);
    this.emit("analysis:start");

    const analysisParser = typeof parser.createParser === "function" ? parser.createParser() : parser;
    for (const line of scopedLines) {
      const event = analysisParser.parseLine(line);
      if (event) this.emit("event", event);
    }

    const liveFile = await findLatestLogFile(directory) || selectedLogs[selectedLogs.length - 1].fullPath;
    const liveSnapshot = snapshots.get(path.resolve(liveFile).toLowerCase());
    await this.beginFollowing(liveFile, {
      position: liveSnapshot?.endPosition ?? 0,
      parser: liveSnapshot ? analysisParser : null,
      resetParser: !liveSnapshot,
      message: "Анализ завершён, новые события отслеживаются автоматически"
    });

    this.emit("status", {
      running: true,
      filePath: liveFile,
      message: `Анализ завершён: ${scopedLines.length} строк из ${selectedLogs.length} логов. Новые события отслеживаются автоматически`
    });
    return { filePath: liveFile, running: true, boundaryType, analyzedLines: scopedLines.length };
  }

  consume(chunk) {
    const combined = this.carry + chunk;
    const lines = combined.split(/\r?\n/u);
    this.carry = lines.pop() || "";

    for (const line of lines) {
      const event = this.parser.parseLine(line);
      if (event) this.emit("event", event);
    }
  }
}

function readRange(filePath, start, end) {
  return new Promise((resolve, reject) => {
    let data = "";
    const stream = fs.createReadStream(filePath, {
      start,
      end,
      encoding: "utf8"
    });
    stream.on("data", (chunk) => {
      data += chunk;
    });
    stream.on("error", reject);
    stream.on("end", () => resolve(data));
  });
}

async function readLastLinesSnapshot(filePath, limitLines, maxBytes = 4 * 1024 * 1024) {
  const stat = await fsp.stat(filePath);
  if (stat.size === 0) return { lines: [], endPosition: 0 };
  const start = Math.max(0, stat.size - maxBytes);
  const raw = await readRange(filePath, start, stat.size - 1);
  return {
    lines: raw.split(/\r?\n/u).slice(-limitLines),
    endPosition: stat.size
  };
}

function findCurrentInstanceStartIndex(lines, expectedLocation = null) {
  let startIndex = 0;
  let boundaryType = null;
  const expected = normalizeExpectedLocation(expectedLocation);
  const boundaryParser = typeof parser.createParser === "function" ? parser.createParser() : parser;
  const events = lines.map((line) => boundaryParser.parseLine(line));

  if (expected.worldId || expected.location) {
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const event = events[index];
      if (!event || event.type !== "world-joining") continue;
      if (matchesExpectedLocation(event, expected)) {
        startIndex = index;
        boundaryType = "vrchat-location";
        break;
      }
    }
  }

  if (!boundaryType) {
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const event = events[index];
      if (event?.type === "world-joined") {
        startIndex = index;
        boundaryType = event.type;
        break;
      }
    }
  }

  if (!boundaryType) {
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const event = events[index];
      if (event?.type === "world-entering" || event?.type === "world-joining") {
        startIndex = index;
        boundaryType = event.type;
        break;
      }
    }
  }

  for (let index = startIndex - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event?.type === "world-entering" || event?.type === "world-joining") {
      startIndex = index;
      continue;
    }
    if (event) break;
  }

  return { startIndex, type: boundaryType };
}

function normalizeExpectedLocation(location) {
  if (!location) return {};
  if (typeof location === "string") {
    return {
      location,
      worldId: location.match(/wrld_[0-9a-f-]+/iu)?.[0] || "",
      instanceId: location.includes(":") ? location.split(":").slice(1).join(":") : ""
    };
  }
  return {
    location: String(location.location || ""),
    worldId: String(location.worldId || ""),
    instanceId: String(location.instanceId || "")
  };
}

function matchesExpectedLocation(event, expected) {
  const instance = String(event.instance || "");
  if (expected.location && instance === expected.location) return true;
  if (expected.worldId && event.worldId !== expected.worldId) return false;
  if (!expected.instanceId) return Boolean(expected.worldId && event.worldId === expected.worldId);
  return instance.includes(expected.instanceId);
}

module.exports = {
  LogTailer,
  defaultLogDirectory,
  findRecentLogFiles,
  findTodayLogFiles,
  findLatestLogFile,
  findCurrentInstanceStartIndex
};
