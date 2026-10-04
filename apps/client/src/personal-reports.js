"use strict";

function localDay(value, timezone) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return ["year", "month", "day"].map((key) => parts.find((part) => part.type === key).value).join("-");
}

function summarizePeriod(sessions, { from = "", to = "", world = "", minimumMinutes = 0 } = {}, timezone) {
  const selected = [], days = new Map(); let minutes = 0, incomplete = 0;
  for (const row of sessions) {
    const day = localDay(row.started_at || row.startedAt, timezone);
    if (!day || (from && day < from) || (to && day > to)) continue;
    const name = String(row.world_name || row.worldName || "");
    if (world && !name.toLocaleLowerCase().includes(world.toLocaleLowerCase())) continue;
    const start = new Date(row.started_at || row.startedAt).getTime();
    const end = new Date(row.ended_at || row.endedAt || NaN).getTime();
    const duration = Number.isFinite(end) && end >= start ? (end - start) / 60000 : null;
    if (minimumMinutes > 0 && (duration === null || duration < minimumMinutes)) continue;
    if (duration === null) incomplete += 1; else minutes += duration;
    const session = { id: row.id, day, worldName: name, minutes: duration, players: Number(row.player_count || row.playerCount) || 0, events: Number(row.event_count || row.eventCount) || 0 };
    selected.push(session);
    const bucket = days.get(day) || { day, sessions: 0, minutes: 0, incomplete: 0, ids: [] };
    bucket.sessions += 1; bucket.minutes += duration || 0; bucket.incomplete += duration === null ? 1 : 0; bucket.ids.push(row.id); days.set(day, bucket);
  }
  const uniqueWorlds = new Set(selected.map((row) => row.worldName).filter(Boolean));
  const returns = new Map();
  for (const row of selected) {
    if (!row.worldName) continue;
    const group = returns.get(row.worldName) || { worldName: row.worldName, sessions: 0, knownMinutes: 0, incomplete: 0 };
    group.sessions += 1; group.knownMinutes += row.minutes || 0; group.incomplete += row.minutes === null ? 1 : 0; returns.set(row.worldName, group);
  }
  return { sessionCount: selected.length, knownMinutes: minutes, incompleteSessions: incomplete, uniqueWorldCount: uniqueWorlds.size, worldIdentity: "observed-name", returns: [...returns.values()].sort((a,b) => b.sessions-a.sessions || a.worldName.localeCompare(b.worldName)), days: [...days.values()].sort((a, b) => a.day.localeCompare(b.day)), sessions: selected, observedDays: days.size };
}

function personalReport(sessions, filters = {}, timezone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const current = summarizePeriod(sessions, filters, timezone);
  const comparison = filters.compareFrom || filters.compareTo ? summarizePeriod(sessions, { ...filters, from: filters.compareFrom, to: filters.compareTo }, timezone) : null;
  return { generatedAt: new Date().toISOString(), timezone, filters, current, comparison, difference: comparison ? { sessions: current.sessionCount - comparison.sessionCount, knownMinutes: current.knownMinutes - comparison.knownMinutes } : null, coverage: "observed-local-sessions-only" };
}

module.exports = { localDay, summarizePeriod, personalReport };
