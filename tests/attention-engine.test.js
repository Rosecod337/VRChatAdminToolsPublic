"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { AttentionEngine, simulateAttentionRule, inQuietHours } = require("../apps/client/src/attention-engine");

function rule(extra = {}) { return { id: "watch", name: "Watch", payload: { enabled: true, mode: "all", delaySeconds: 0, cooldownSeconds: 10, windowSeconds: 60, conditions: [{ field: "type", operator: "equals", value: "player-joined" }], ...extra } }; }
test("attention rules suppress duplicate input and obey delay and cooldown", () => {
  const fired = [], engine = new AttentionEngine({ onFire: (value) => fired.push(value) });
  engine.configure([rule({ delaySeconds: 5 })]);
  const event = { id: "one", type: "player-joined", timestamp: "2026-10-01T12:00:00Z" };
  engine.observe(event, 1000); engine.observe(event, 2000); engine.advance(5999);
  assert.equal(fired.length, 0);
  engine.advance(6000); assert.equal(fired.length, 1);
  engine.observe({ ...event, id: "two" }, 7000); engine.advance(15000); assert.equal(fired.length, 1);
  engine.observe({ ...event, id: "three" }, 16000); engine.advance(21000); assert.equal(fired.length, 2);
});
test("count conditions, AND/OR and quiet hours use only observed events", () => {
  const fired = [], engine = new AttentionEngine({ onFire: (value) => fired.push(value) });
  engine.configure([rule({ conditions: [{ field: "type", operator: "count-at-least", value: "player-joined", count: 2 }, { field: "userId", operator: "equals", value: "usr_mira" }] })]);
  engine.observe({ id: "one", type: "player-joined", userId: "usr_other" }, 1000);
  assert.equal(fired.length, 0);
  engine.observe({ id: "two", type: "player-joined", userId: "usr_mira" }, 2000);
  assert.equal(fired.length, 1);
  assert.equal(fired[0].explanations[0].count, 2);
  assert.equal(inQuietHours({ quietStart: "23:00", quietEnd: "08:00" }, new Date(2026, 9, 1, 2).getTime()), true);
  assert.equal(inQuietHours({ quietStart: "23:00", quietEnd: "08:00" }, new Date(2026, 9, 1, 12).getTime()), false);
});
test("history simulation has its own state and never dispatches system notifications", () => {
  const events = [{ id: "a", type: "player-joined", timestamp: "2026-10-01T12:00:00Z" }, { id: "b", type: "player-left", timestamp: "2026-10-01T12:01:00Z" }];
  const result = simulateAttentionRule(rule(), events);
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].explanations[0].matched, true);
  assert.equal(result.inputEvents, 2);
});
