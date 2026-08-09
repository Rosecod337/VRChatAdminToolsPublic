(function initInsightsModel(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.betaInsightsModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createInsightsModel() {
  "use strict";

  const DAY_MS = 24 * 60 * 60 * 1000;

  function value(session, snake, camel, fallback = null) {
    return session?.[snake] ?? session?.[camel] ?? fallback;
  }

  function timestamp(input) {
    if (input === null || input === undefined || input === "") return null;
    const parsed = new Date(input).valueOf();
    return Number.isFinite(parsed) ? parsed : null;
  }

  function snapshot(session) {
    const stored = value(session, "snapshot", "snapshot", {});
    if (stored && typeof stored === "object") return stored;
    try {
      return JSON.parse(stored || "{}");
    } catch {
      return {};
    }
  }

  function snapshotPlayers(session) {
    const seen = new Set();
    return (Array.isArray(snapshot(session).players) ? snapshot(session).players : [])
      .map((player) => ({
        userId: String(player?.userId || "").trim(),
        displayName: String(player?.displayName || player?.playerName || "").trim(),
        status: String(player?.status || "").trim()
      }))
      .filter((player) => player.userId && !seen.has(player.userId) && seen.add(player.userId));
  }

  function normalizeDays(input) {
    if (input === null || input === "all") return null;
    const days = Number(input ?? 30);
    return Number.isFinite(days) && days > 0 ? Math.trunc(days) : 30;
  }

  function normalizeSession(session, nowMs) {
    const startedAt = timestamp(value(session, "started_at", "startedAt"));
    const storedEndedAt = timestamp(value(session, "ended_at", "endedAt"));
    if (startedAt === null || startedAt > nowMs) return null;
    const endedAt = Math.min(storedEndedAt ?? nowMs, nowMs);
    if (endedAt < startedAt) return null;
    const worldName = String(value(session, "world_name", "worldName", "") || "").trim();
    const players = snapshotPlayers(session);
    const id = String(value(session, "id", "id", "") || "").trim();
    const playerCount = Math.max(players.length, Number(value(session, "player_count", "playerCount", 0)) || 0);
    const avatarCount = Math.max(0, Number(value(session, "avatar_count", "avatarCount", 0)) || 0);
    const eventCount = Math.max(0, Number(value(session, "event_count", "eventCount", 0)) || 0);
    return { source: session, id, startedAt, endedAt, complete: storedEndedAt !== null, worldName, players, playerCount, avatarCount, eventCount };
  }

  function isMeaningfulSession(session) {
    return Boolean(session?.worldName || session?.players?.length || session?.playerCount || session?.avatarCount || session?.eventCount);
  }

  function dedupeSessions(sessions, nowMs = Date.now()) {
    const groups = new Map();
    for (const source of Array.isArray(sessions) ? sessions : []) {
      const session = normalizeSession(source, nowMs);
      if (!session || !isMeaningfulSession(session)) continue;
      const key = session.id ? `id:${session.id}` : `start:${session.startedAt}|world:${session.worldName.toLocaleLowerCase("ru-RU")}`;
      const previous = groups.get(key);
      if (!previous || session.complete > previous.complete || session.endedAt > previous.endedAt || session.players.length > previous.players.length) groups.set(key, session);
    }
    return [...groups.values()].sort((left, right) => right.startedAt - left.startedAt);
  }

  function buildInsights(sessions, options = {}) {
    const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now();
    const periodDays = normalizeDays(options.days);
    const cutoff = periodDays === null ? null : nowMs - periodDays * DAY_MS;
    const selected = dedupeSessions(sessions, nowMs).filter((session) => cutoff === null || session.endedAt >= cutoff);
    const players = new Map();
    const worlds = new Map();
    let totalDurationMs = 0;
    let totalEncounters = 0;

    for (const session of selected) {
      const durationStart = Math.max(session.startedAt, cutoff ?? session.startedAt);
      totalDurationMs += Math.max(0, session.endedAt - durationStart);
      if (session.worldName) {
        const world = worlds.get(session.worldName) || { worldName: session.worldName, sessions: 0, lastSeenAt: 0 };
        world.sessions += 1;
        world.lastSeenAt = Math.max(world.lastSeenAt, session.startedAt);
        worlds.set(session.worldName, world);
      }
      for (const player of session.players) {
        const current = players.get(player.userId) || { userId: player.userId, displayName: "", sessions: 0, lastSeenAt: 0 };
        current.displayName = player.displayName || current.displayName || player.userId;
        current.sessions += 1;
        current.lastSeenAt = Math.max(current.lastSeenAt, session.endedAt);
        players.set(player.userId, current);
      }
      totalEncounters += session.players.length;
    }

    const topPlayers = [...players.values()].sort((left, right) => right.sessions - left.sessions || right.lastSeenAt - left.lastSeenAt || left.displayName.localeCompare(right.displayName, "ru"));
    const topWorlds = [...worlds.values()].sort((left, right) => right.sessions - left.sessions || right.lastSeenAt - left.lastSeenAt || left.worldName.localeCompare(right.worldName, "ru"));
    return {
      periodDays,
      sessionCount: selected.length,
      totalDurationMs,
      totalEncounters,
      uniquePlayerCount: players.size,
      recurringPlayerCount: topPlayers.filter((player) => player.sessions > 1).length,
      worldCount: worlds.size,
      topPlayers: topPlayers.slice(0, 12),
      topWorlds: topWorlds.slice(0, 8),
      sessions: selected
    };
  }

  function formatDuration(milliseconds) {
    const totalMinutes = Math.max(0, Math.floor(Number(milliseconds || 0) / 60_000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (!hours) return `${minutes} мин`;
    if (!minutes) return `${hours} ч`;
    return `${hours} ч ${minutes} мин`;
  }

  function recap(insights, periodLabel) {
    const recurring = insights.topPlayers.filter((player) => player.sessions > 1).slice(0, 3).map((player) => `${player.displayName} (${player.sessions})`).join(", ");
    const topWorld = insights.topWorlds[0];
    return [
      `Мой VRChat · ${periodLabel}`,
      `Сессий: ${insights.sessionCount}`,
      `Время: ${formatDuration(insights.totalDurationMs)}`,
      `Миров: ${insights.worldCount}`,
      `Уникальных игроков: ${insights.uniquePlayerCount}`,
      `Повторных встреч: ${insights.recurringPlayerCount}`,
      recurring ? `Чаще встречались: ${recurring}` : "",
      topWorld ? `Чаще записанный мир: ${topWorld.worldName} (${topWorld.sessions})` : ""
    ].filter(Boolean).join("\n");
  }

  return { DAY_MS, timestamp, snapshot, snapshotPlayers, normalizeDays, normalizeSession, isMeaningfulSession, dedupeSessions, buildInsights, formatDuration, recap };
});
