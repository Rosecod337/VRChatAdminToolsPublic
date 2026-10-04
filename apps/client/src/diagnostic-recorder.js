"use strict";

const { randomUUID } = require("node:crypto");

function cleanDiagnosticSample(value = {}) {
  const number = (input) => Number.isFinite(Number(input)) && input !== null && input !== undefined ? Number(input) : null;
  return { at: new Date().toISOString(), cpuPercent: number(value.resources?.cpuPercent), memoryMiB: number(value.resources?.workingSetMiB), logBytes: number(value.log?.bytes), logCursor: number(value.log?.cursor), running: value.running === true, eventLoopMs: number(value.eventLoopMs),
    game: value.game ? { running: value.game.running === true, cpuPercent: number(value.game.cpuPercent), memoryMiB: number(value.game.memoryMiB), sampledAt: String(value.game.sampledAt || "").slice(0, 40) } : null };
}
class DiagnosticRecorder {
  constructor(database, { sample = async () => ({}), allowed = () => true, intervalMs = 2000, notify = () => {}, onStop = () => {} } = {}) {
    this.database = database; this.sample = sample; this.allowed = allowed; this.intervalMs = intervalMs; this.notify = notify; this.onStop = onStop; this.current = null; this.timer = null; this.busy = false;
    database.exec(`CREATE TABLE IF NOT EXISTS diagnostic_runs(id TEXT PRIMARY KEY,name TEXT NOT NULL,started_at TEXT NOT NULL,ended_at TEXT);
      CREATE TABLE IF NOT EXISTS diagnostic_samples(id INTEGER PRIMARY KEY AUTOINCREMENT,run_id TEXT NOT NULL,at TEXT NOT NULL,payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS diagnostic_marks(id INTEGER PRIMARY KEY AUTOINCREMENT,run_id TEXT NOT NULL,at TEXT NOT NULL,label TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS diagnostic_samples_run ON diagnostic_samples(run_id,id);`);
    if (!database.prepare("PRAGMA table_info(diagnostic_runs)").all().some((row) => row.name === "interrupted")) database.exec("ALTER TABLE diagnostic_runs ADD COLUMN interrupted INTEGER NOT NULL DEFAULT 0");
    database.prepare("UPDATE diagnostic_runs SET ended_at=COALESCE((SELECT MAX(at) FROM diagnostic_samples WHERE run_id=diagnostic_runs.id),started_at),interrupted=1 WHERE ended_at IS NULL").run();
  }
  start(name = "") {
    if (!this.allowed()) throw new Error("diagnostic_paid_required");
    if (this.current) throw new Error("diagnostic_already_running");
    this.current = randomUUID();
    this.database.prepare("INSERT INTO diagnostic_runs(id,name,started_at) VALUES (?,?,?)").run(this.current, String(name || "Сеанс диагностики").slice(0, 100), new Date().toISOString());
    const old = this.database.prepare("SELECT id FROM diagnostic_runs ORDER BY started_at DESC LIMIT -1 OFFSET 20").all();
    for (const row of old) { this.database.prepare("DELETE FROM diagnostic_samples WHERE run_id=?").run(row.id); this.database.prepare("DELETE FROM diagnostic_marks WHERE run_id=?").run(row.id); this.database.prepare("DELETE FROM diagnostic_runs WHERE id=?").run(row.id); }
    this.timer = setInterval(() => { void this.tick(); }, this.intervalMs); this.timer.unref?.();
    void this.tick(); return this.state();
  }
  async tick() {
    if (!this.current || this.busy) return;
    if (!this.allowed()) { this.stop(); return; }
    const run = this.current; this.busy = true;
    try {
      const sample = cleanDiagnosticSample(await this.sample());
      if (run !== this.current) return;
      this.database.prepare("INSERT INTO diagnostic_samples(run_id,at,payload) VALUES (?,?,?)").run(run, sample.at, JSON.stringify(sample));
      this.database.prepare("DELETE FROM diagnostic_samples WHERE run_id=? AND id NOT IN (SELECT id FROM diagnostic_samples WHERE run_id=? ORDER BY id DESC LIMIT 1200)").run(run, run);
      this.notify(this.state());
    } catch { /* A missing counter must not stop the application. */ }
    finally { this.busy = false; }
  }
  mark(label = "") {
    if (!this.current) throw new Error("diagnostic_not_running");
    this.recordMark(label); return this.state();
  }
  recordMark(label) {
    this.database.prepare("INSERT INTO diagnostic_marks(run_id,at,label) VALUES (?,?,?)").run(this.current, new Date().toISOString(), String(label || "Лаг").slice(0, 150));
    this.database.prepare("DELETE FROM diagnostic_marks WHERE run_id=? AND id NOT IN (SELECT id FROM diagnostic_marks WHERE run_id=? ORDER BY id DESC LIMIT 200)").run(this.current, this.current);
  }
  observe(event) {
    if (!this.current || !["avatar-changed", "world-loaded", "player-joined", "player-left"].includes(event.type)) return;
    this.recordMark(String(event.type));
  }
  stop() {
    if (this.timer) clearInterval(this.timer); this.timer = null;
    if (this.current) this.database.prepare("UPDATE diagnostic_runs SET ended_at=? WHERE id=?").run(new Date().toISOString(), this.current);
    this.current = null; this.onStop(); return this.state();
  }
  state() { return { running: Boolean(this.current), current: this.current, runs: this.database.prepare("SELECT * FROM diagnostic_runs ORDER BY started_at DESC LIMIT 20").all() }; }
  detail(id) {
    const run = this.database.prepare("SELECT * FROM diagnostic_runs WHERE id=?").get(String(id));
    if (!run) throw new Error("diagnostic_run_missing");
    return { run, samples: this.database.prepare("SELECT payload FROM diagnostic_samples WHERE run_id=? ORDER BY id LIMIT 1200").all(id).map((row) => JSON.parse(row.payload)), marks: this.database.prepare("SELECT at,label FROM diagnostic_marks WHERE run_id=? ORDER BY id LIMIT 200").all(id) };
  }
  compare(first, second) {
    const summarize = (id) => {
      const data = this.detail(id), values = (key) => data.samples.map((row) => row[key]).filter((value) => value !== null);
      const mean = (key) => { const rows = values(key); return rows.length ? rows.reduce((sum, value) => sum + value, 0) / rows.length : null; };
      return { id, samples: data.samples.length, meanCpuPercent: mean("cpuPercent"), meanMemoryMiB: mean("memoryMiB"), peakEventLoopMs: values("eventLoopMs").length ? Math.max(...values("eventLoopMs")) : null };
    };
    return { first: summarize(first), second: summarize(second) };
  }
  exportReport(id) {
    const data = this.detail(id);
    return { format: "vrchat-diagnostic-report", version: 1, startedAt: data.run.started_at, endedAt: data.run.ended_at, interrupted: data.run.interrupted === 1, samples: data.samples, marks: data.marks.map((row) => ({ at: row.at, label: ["avatar-changed", "world-loaded", "player-joined", "player-left"].includes(row.label) ? row.label : "manual-marker" })), causality: "correlation-is-not-proof" };
  }
  restoreBackup(runs = [], samples = [], marks = []) {
    const mapping = new Map();
    for (const row of runs.slice(-20)) {
      if (!Number.isFinite(Date.parse(row.started_at))) continue;
      const id = /^[a-z0-9_-]{1,100}$/iu.test(row.id) ? row.id : randomUUID();
      mapping.set(String(row.id), id);
      this.database.prepare("INSERT INTO diagnostic_runs(id,name,started_at,ended_at,interrupted) VALUES (?,?,?,?,?) ON CONFLICT(id) DO NOTHING").run(id, String(row.name || "Запись").slice(0, 100), new Date(row.started_at).toISOString(), Number.isFinite(Date.parse(row.ended_at)) ? new Date(row.ended_at).toISOString() : new Date(row.started_at).toISOString(), row.interrupted === 1 || !row.ended_at ? 1 : 0);
      this.database.prepare("DELETE FROM diagnostic_samples WHERE run_id=?").run(id);
      this.database.prepare("DELETE FROM diagnostic_marks WHERE run_id=?").run(id);
    }
    const counts = new Map(), markCounts = new Map();
    for (const row of samples.slice(-24000)) {
      const run = mapping.get(String(row.run_id)); if (!run || (counts.get(run) || 0) >= 1200 || !Number.isFinite(Date.parse(row.at))) continue;
      try {
        const input = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
        const value = cleanDiagnosticSample({ resources: { cpuPercent: input.cpuPercent, workingSetMiB: input.memoryMiB }, log: { bytes: input.logBytes, cursor: input.logCursor }, running: input.running, eventLoopMs: input.eventLoopMs, game: input.game });
        value.at = new Date(row.at).toISOString();
        this.database.prepare("INSERT INTO diagnostic_samples(run_id,at,payload) VALUES (?,?,?)").run(run, value.at, JSON.stringify(value)); counts.set(run, (counts.get(run) || 0) + 1);
      } catch { /* Invalid counters do not block restoration. */ }
    }
    for (const row of marks.slice(-4000)) {
      const run = mapping.get(String(row.run_id)); if (!run || (markCounts.get(run) || 0) >= 200 || !Number.isFinite(Date.parse(row.at))) continue;
      this.database.prepare("INSERT INTO diagnostic_marks(run_id,at,label) VALUES (?,?,?)").run(run, new Date(row.at).toISOString(), String(row.label || "Маркер").slice(0, 150)); markCounts.set(run, (markCounts.get(run) || 0) + 1);
    }
  }
}
module.exports = { DiagnosticRecorder, cleanDiagnosticSample };
