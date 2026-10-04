"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { DatabaseSync } = require("node:sqlite");
const { DiagnosticRecorder } = require("../apps/client/src/diagnostic-recorder");

test("diagnostic recordings compare measured samples and redact all free-form evidence", async () => {
  const database = new DatabaseSync(":memory:"); let cpu = 5;
  const recorder = new DiagnosticRecorder(database, { intervalMs: 1000000, sample: async () => ({ resources: { cpuPercent: cpu, workingSetMiB: 100 }, eventLoopMs: 10, token: "private-token", userId: "usr_private" }) });
  const first = recorder.start("private-name").current; await new Promise((resolve) => setImmediate(resolve));
  recorder.mark("private-user-path C:\\Users\\secret"); recorder.observe({ type: "avatar-changed", userId: "usr_private", avatarId: "avtr_secret" }); recorder.stop();
  cpu = 2; const second = recorder.start("another").current; await new Promise((resolve) => setImmediate(resolve)); recorder.stop();
  const compare = recorder.compare(first, second); assert.equal(compare.first.meanCpuPercent, 5); assert.equal(compare.second.meanCpuPercent, 2);
  const report = JSON.stringify(recorder.exportReport(first));
  for (const privateValue of ["private-name", "private-user-path", "private-token", "usr_private", "avtr_secret"]) assert.equal(report.includes(privateValue), false);
  assert.equal(report.includes("avatar-changed"), true); database.close();
});
test("revoked recording permission stops sampling and releases its monitor", async () => {
  const database = new DatabaseSync(":memory:"); let allowed = true, stopped = false;
  const recorder = new DiagnosticRecorder(database, { allowed: () => allowed, onStop: () => { stopped = true; }, intervalMs: 1000000 });
  recorder.start(); await new Promise((resolve) => setImmediate(resolve));
  allowed = false; await recorder.tick();
  assert.equal(recorder.state().running, false); assert.equal(stopped, true); database.close();
});

test("a long recording keeps a bounded marker ring and still accepts a new manual lag marker", async () => {
  const database = new DatabaseSync(":memory:"), recorder = new DiagnosticRecorder(database, { intervalMs: 1000000 });
  const id = recorder.start().current; await new Promise((resolve) => setImmediate(resolve));
  for (let index=0;index<300;index+=1) recorder.observe({ type: "avatar-changed" });
  recorder.mark("late manual marker"); recorder.stop(); const detail = recorder.detail(id);
  assert.equal(detail.marks.length, 200); assert.equal(detail.marks.at(-1).label, "late manual marker"); database.close();
});
