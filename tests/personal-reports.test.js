"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { personalReport, localDay } = require("../apps/client/src/personal-reports");

test("personal report compares known durations and preserves unknown active sessions", () => {
  const rows = [
    { id: "a", started_at: "2026-09-01T12:00:00Z", ended_at: "2026-09-01T13:00:00Z", world_name: "World A" },
    { id: "b", started_at: "2026-10-01T12:00:00Z", ended_at: null, world_name: "World A" },
    { id: "c", started_at: "2026-10-02T12:00:00Z", ended_at: "2026-10-02T14:00:00Z", world_name: "World B" }
  ];
  const report = personalReport(rows, { from: "2026-10-01", to: "2026-10-03", compareFrom: "2026-09-01", compareTo: "2026-09-30" }, "UTC");
  assert.equal(report.current.sessionCount, 2);
  assert.equal(report.current.knownMinutes, 120);
  assert.equal(report.current.incompleteSessions, 1);
  assert.equal(report.current.sessions[0].minutes, null);
  assert.equal(report.difference.knownMinutes, 60);
  assert.deepEqual(report.current.days[0].ids, ["b"]);
});
test("report day buckets respect the user's timezone and filters", () => {
  assert.equal(localDay("2026-09-30T21:30:00Z", "Europe/Samara"), "2026-10-01");
  const report = personalReport([{ id: "a", started_at: "2026-09-30T21:30:00Z", ended_at: "2026-09-30T22:30:00Z", world_name: "Test World" }], { from: "2026-10-01", world: "test", minimumMinutes: 30 }, "Europe/Samara");
  assert.equal(report.current.sessionCount, 1);
});
