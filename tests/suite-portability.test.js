"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { Writable } = require("node:stream");
const { LocalCompanionStore } = require("../apps/client/src/local-companion-store");
const { PhotoAtlas } = require("../apps/client/src/photo-atlas");
const { DiagnosticRecorder } = require("../apps/client/src/diagnostic-recorder");
const { PersonalToolsStore } = require("../apps/client/src/personal-tools-store");
const { LogTailer } = require("../apps/client/src/log-tailer");
const { buildSessionHealth } = require("../apps/client/src/session-health");
const { paidLocalAllowed } = require("../apps/client/src/paid-access");
const { GameProcessMonitor } = require("../apps/client/src/game-process-monitor");
const { EventEmitter } = require("node:events");
const { PassThrough } = require("node:stream");
const { createAttentionDelivery } = require("../apps/client/src/attention-delivery");
const PIXEL = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jD1kAAAAASUVORK5CYII=", "base64");

test("full portability restores plans, photo annotations and diagnostic counters without granting file authority", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "suite-portability-"));
  const pictures = path.join(directory, "private-pictures"); await fs.mkdir(pictures);
  const file = path.join(pictures, "private-photo.png"); await fs.writeFile(file, PIXEL);
  const store = new LocalCompanionStore(path.join(directory, "first.sqlite"));
  const restored = new LocalCompanionStore(path.join(directory, "restored.sqlite"));
  t.after(() => { store.close(); restored.close(); });
  const atlas = new PhotoAtlas(store.database); await atlas.scan(await atlas.approveRoot(pictures));
  atlas.annotate(atlas.list().rows[0].id, { album: "private-album", caption: "private-caption" });
  const plans = new PersonalToolsStore(store.database); plans.save("rules", { name: "private-rule", payload: { enabled: true } });
  const recorder = new DiagnosticRecorder(store.database, { intervalMs: 100000, sample: async () => ({ resources: { cpuPercent: 3, workingSetMiB: 42 } }) });
  const run = recorder.start("private-recording").current; await new Promise((resolve) => setImmediate(resolve)); recorder.mark("private-note"); recorder.stop();
  const chunks = [], output = new Writable({ write(chunk, _encoding, done) { chunks.push(chunk); done(); } });
  await store.exportToWritable(output);
  const backup = JSON.parse(Buffer.concat(chunks)); restored.importData(backup);
  const copies = new PhotoAtlas(restored.database, { thumbnail: async () => "thumbnail" });
  const photo = copies.list().rows[0]; assert.equal(photo.caption, "private-caption"); assert.equal(copies.list().needsApproval, 1);
  await assert.rejects(copies.getThumbnail(photo.id), /photo_missing/u);
  await copies.scan(await copies.approveRoot(pictures)); assert.equal(await copies.getThumbnail(photo.id), "thumbnail");
  assert.equal(new PersonalToolsStore(restored.database).list("rules")[0].payload.enabled, false);
  const history = new DiagnosticRecorder(restored.database); assert.equal(history.detail(run).samples[0].cpuPercent, 3);
  assert.equal(history.state().running, false);
  const redacted = [], reportOutput = new Writable({ write(chunk, _encoding, done) { redacted.push(chunk); done(); } });
  await store.exportToWritable(reportOutput, {}, { redacted: true });
  const report = Buffer.concat(redacted).toString();
  for (const value of ["private-pictures","private-photo","private-album","private-caption","private-rule","private-recording","private-note"]) assert.equal(report.includes(value), false);
  const excluded = [], excludedOutput = new Writable({ write(chunk, _encoding, done) { excluded.push(chunk); done(); } });
  await store.exportToWritable(excludedOutput, {}, { redacted: true, categories: [] });
  const empty = JSON.parse(Buffer.concat(excluded)); assert.equal(empty.personalPlans.length, 0); assert.equal(empty.photos.length, 0); assert.equal(empty.diagnosticRuns.length, 0);
  const counts = store.previewPrivacyChange({ category: "all" }).affected; assert.equal(counts.photos, 1); assert.equal(counts.diagnostics, 1); assert.equal(counts.plans, 1);
  store.clearCategory("all"); assert.equal(store.storageStats().photos, 0); assert.equal(store.storageStats().diagnostics, 0); assert.equal(store.storageStats().personalPlans, 0);
  assert.deepEqual(await fs.readFile(file), PIXEL);
});

test("log recovery preserves the cursor, pending events and independent history after a missing file", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "suite-recovery-"));
  const file = path.join(directory, "output_log_recovery.txt"), moved = path.join(directory, "temporarily-unavailable.txt");
  const before = "2026.10.01 10:00:00 Debug      -  [Behaviour] OnPlayerJoined Before (usr_11111111-1111-4111-8111-111111111111)\n";
  const after = "2026.10.01 10:00:01 Debug      -  [Behaviour] OnPlayerJoined After (usr_22222222-2222-4222-8222-222222222222)\n";
  await fs.writeFile(file, before); const tailer = new LogTailer(), events = []; tailer.on("event", (value) => events.push(value)); tailer.on("error", () => {}); t.after(() => tailer.stop());
  await tailer.start({ filePath: file, fromStart: true }); const cursor = tailer.position;
  await fs.rename(file, moved); await assert.rejects(tailer.readNewBytes(), /ENOENT/u);
  assert.equal(buildSessionHealth({ tailer }).logError, "ENOENT"); assert.equal(tailer.position, cursor);
  await fs.appendFile(moved, after); await fs.rename(moved, file); await tailer.recover();
  assert.equal(tailer.lastReadError, null); assert.equal(events.filter((value) => value.type === "player-joined").length, 2);
  await tailer.stop(); await fs.appendFile(file, after.replace("10:00:01", "10:00:02")); await tailer.recover();
  assert.equal(events.filter((value) => value.type === "player-joined").length, 3);
});

test("paid local operations reject free, expired, revoked and malformed licenses", () => {
  const settings = { sessionToken: "test-session", license: { expiresAt: "2030-01-01T00:00:00Z" } };
  assert.equal(paidLocalAllowed(settings), true);
  assert.equal(paidLocalAllowed({ ...settings, freeMode: true }), false);
  assert.equal(paidLocalAllowed({ ...settings, license: { active: false } }), false);
  assert.equal(paidLocalAllowed({ ...settings, license: { expiresAt: "2000-01-01" } }), false);
  assert.equal(paidLocalAllowed({ ...settings, license: { expiresAt: "invalid" } }), false);
  assert.equal(paidLocalAllowed(settings, { modern: false }), false);
});

test("late exit of an old diagnostic helper cannot lose or overwrite its replacement", () => {
  if (process.platform !== "win32") return;
  const workers = [], monitor = new GameProcessMonitor({ launch: () => { const worker = new EventEmitter(); worker.stdout = new PassThrough(); worker.kill = () => {}; workers.push(worker); return worker; } });
  monitor.start(); monitor.stop(); monitor.start(); const current = monitor.worker;
  workers[0].stdout.write('{"pid":1,"cpu":1,"memory":1000}\n'); workers[0].emit("exit");
  assert.equal(monitor.worker, current); assert.equal(monitor.latest, null);
  workers[1].stdout.write('{"pid":2,"memory":1048576}\n'); assert.equal(monitor.latest.memoryMiB, 1); assert.equal(monitor.latest.cpuPercent, null);
  monitor.stop(); assert.equal(monitor.worker, null);
});

test("attention delivery rechecks current permission and survives a failed system notification", () => {
  let allowed = true, sent = 0, failed = 0;
  const delivery = createAttentionDelivery({ allowed: () => allowed, send: () => { sent += 1; }, notify: () => { throw new Error("OS failure"); }, failed: () => { failed += 1; } });
  const result = { name: "Test", event: { type: "player-joined" } }; delivery(result);
  assert.equal(sent, 1); assert.equal(failed, 1);
  allowed = false; delivery(result); assert.equal(sent, 1); assert.equal(failed, 1);
});
