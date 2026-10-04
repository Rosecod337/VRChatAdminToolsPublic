"use strict";

const { normalizePersonalItem } = require("./personal-tools-store");
const FIELDS = ["type", "category", "userId", "displayName", "worldId", "worldName", "avatarId", "avatarName"];

function normalizedEvent(input, now = Date.now()) {
  const output = { observedAt: now };
  for (const field of FIELDS) output[field] = String(input?.[field] || "").slice(0, 200);
  output.displayName = String(input?.displayName || input?.playerName || "").slice(0, 200);
  output.timestamp = String(input?.timestamp || input?.ts || input?.time || "").slice(0, 60);
  output.id = String(input?.id || "").slice(0, 100);
  return output;
}

function inQuietHours(rule, timestamp) {
  const parse = (value) => {
    const match = /^(\d{2}):(\d{2})$/u.exec(value || "");
    return match && Number(match[1]) < 24 && Number(match[2]) < 60 ? Number(match[1]) * 60 + Number(match[2]) : null;
  };
  const start = parse(rule.quietStart), end = parse(rule.quietEnd);
  if (start === null || end === null || start === end) return false;
  const date = new Date(timestamp), minute = date.getHours() * 60 + date.getMinutes();
  return start < end ? minute >= start && minute < end : minute >= start || minute < end;
}

function explainMatch(rule, event, history) {
  const explanations = rule.conditions.map((condition) => {
    const actual = event[condition.field] || "";
    const expected = condition.value.toLocaleLowerCase();
    const matching = (item) => condition.operator === "contains" ? String(item[condition.field] || "").toLocaleLowerCase().includes(expected) : String(item[condition.field] || "").toLocaleLowerCase() === expected;
    const count = condition.operator === "count-at-least" ? history.filter((item) => item.observedAt >= event.observedAt - rule.windowSeconds * 1000 && matching(item)).length : 0;
    return { field: condition.field, actual, expected: condition.value, operator: condition.operator, count, matched: expected.length > 0 && (condition.operator === "count-at-least" ? count >= condition.count : matching(event)) };
  });
  return { matched: explanations.length > 0 && (rule.mode === "any" ? explanations.some((item) => item.matched) : explanations.every((item) => item.matched)), explanations };
}

class AttentionEngine {
  constructor({ onFire = () => {} } = {}) {
    this.onFire = onFire; this.rules = []; this.history = []; this.seen = new Map(); this.pending = new Map(); this.lastDelivered = new Map();
  }
  configure(items) {
    this.rules = items.slice(0, 100).map((item) => normalizePersonalItem("rules", item)).filter((item) => item.payload.enabled && item.payload.conditions.length);
    this.pending.clear();
    const active = new Set(this.rules.map((rule) => rule.id));
    for (const id of this.lastDelivered.keys()) if (!active.has(id)) this.lastDelivered.delete(id);
  }
  observe(input, now = Date.now()) {
    this.advance(now);
    const event = normalizedEvent(input, now);
    const fingerprint = JSON.stringify([event.id, event.timestamp, ...FIELDS.map((field) => event[field])]);
    if (this.seen.has(fingerprint)) return [];
    this.seen.set(fingerprint, now);
    for (const [key, time] of this.seen) if (time < now - 600000 || this.seen.size > 4096) this.seen.delete(key);
    this.history.push(event);
    this.history = this.history.filter((item) => item.observedAt >= now - 600000).slice(-4096);
    const matched = [];
    for (const item of this.rules) {
      const rule = item.payload;
      if (this.pending.has(item.id) || now - (this.lastDelivered.get(item.id) ?? -Infinity) < rule.cooldownSeconds * 1000 || inQuietHours(rule, now)) continue;
      const result = explainMatch(rule, event, this.history);
      if (!result.matched) continue;
      this.pending.set(item.id, { id: item.id, name: item.name, rule, event, explanations: result.explanations, dueAt: now + rule.delaySeconds * 1000 });
      matched.push(item.id);
    }
    this.advance(now);
    return matched;
  }
  advance(now = Date.now()) {
    for (const [id, item] of this.pending) {
      if (item.dueAt > now) continue;
      this.pending.delete(id);
      if (inQuietHours(item.rule, now)) continue;
      this.lastDelivered.set(id, now);
      this.onFire({ id, name: item.name, at: now, event: item.event, explanations: item.explanations });
    }
  }
  nextDue() { return this.pending.size ? Math.min(...[...this.pending.values()].map((item) => item.dueAt)) : null; }
  clear() { this.pending.clear(); this.history = []; this.seen.clear(); }
}

function simulateAttentionRule(item, events) {
  const output = [];
  const rule = normalizePersonalItem("rules", item); rule.payload.enabled = true;
  const engine = new AttentionEngine({ onFire: (result) => output.push(result) }); engine.configure([rule]);
  let cursor = 0;
  const fallback = Date.now();
  for (const [index, event] of events.slice(0, 2000).entries()) {
    const raw = event.occurredAt || event.timestamp || event.ts;
    const parsed = typeof raw === "number" ? raw : Date.parse(String(raw || ""));
    cursor = Math.max(cursor + 1, Number.isFinite(parsed) ? parsed : fallback + index * 1000);
    engine.observe(event, cursor);
  }
  engine.advance(cursor + rule.payload.delaySeconds * 1000);
  return { inputEvents: Math.min(events.length, 2000), matches: output.slice(-200), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
}

module.exports = { AttentionEngine, simulateAttentionRule, normalizedEvent, inQuietHours, explainMatch };
