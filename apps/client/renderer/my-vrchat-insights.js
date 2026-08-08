"use strict";

(function exposeMyVrchatInsights(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.myVrchatInsights = api;
})(typeof globalThis === "object" ? globalThis : null, () => {
  const HOUR_MS = 60 * 60 * 1000;
  const DAY_MS = 24 * HOUR_MS;

  function sessionValue(session, snakeKey, camelKey, fallback = null) {
    return session?.[snakeKey] ?? session?.[camelKey] ?? fallback;
  }

  function sessionSnapshot(session) {
    const value = sessionValue(session, "snapshot", "snapshot", {});
    if (value && typeof value === "object") return value;
    try {
      return JSON.parse(value || "{}");
    } catch {
      return {};
    }
  }

  function timestamp(value) {
    const parsed = new Date(value).valueOf();
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeDays(value) {
    if (value === null || value === "all") return null;
    const days = Number(value ?? 30);
    return Number.isFinite(days) && days > 0 ? Math.trunc(days) : 30;
  }

  function buildMyVrchatInsights(sessions, options = {}) {
    const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now();
    const periodDays = normalizeDays(options.days);
    const cutoff = periodDays === null ? null : nowMs - periodDays * DAY_MS;
    const selected = (Array.isArray(sessions) ? sessions : [])
      .map((session) => {
        const startedAt = timestamp(sessionValue(session, "started_at", "startedAt"));
        const storedEndedAt = timestamp(sessionValue(session, "ended_at", "endedAt"));
        const endedAt = Math.min(storedEndedAt ?? nowMs, nowMs);
        return {
          session,
          startedAt,
          endedAt,
          durationStart: startedAt === null ? null : Math.max(startedAt, cutoff ?? startedAt),
          durationEnd: endedAt
        };
      })
      .filter(({ startedAt, endedAt }) => (
        startedAt !== null &&
        startedAt <= nowMs &&
        endedAt >= startedAt &&
        (cutoff === null || endedAt >= cutoff)
      ))
      .sort((left, right) => right.startedAt - left.startedAt);

    const players = new Map();
    const worlds = new Map();
    let totalDurationMs = 0;
    let totalEncounters = 0;

    for (const { session, startedAt, endedAt, durationStart, durationEnd } of selected) {
      totalDurationMs += Math.max(0, durationEnd - durationStart);

      const worldName = String(sessionValue(session, "world_name", "worldName", "") || "").trim();
      if (worldName) {
        const world = worlds.get(worldName) || { worldName, sessions: 0, lastSeenAt: 0 };
        world.sessions += 1;
        world.lastSeenAt = Math.max(world.lastSeenAt, startedAt);
        worlds.set(worldName, world);
      }

      const seenInSession = new Set();
      const snapshot = sessionSnapshot(session);
      for (const player of Array.isArray(snapshot.players) ? snapshot.players : []) {
        const userId = String(player?.userId || "").trim();
        if (!userId || seenInSession.has(userId)) continue;
        seenInSession.add(userId);
        const current = players.get(userId) || {
          userId,
          displayName: "",
          sessions: 0,
          lastSeenAt: 0
        };
        current.displayName = String(player?.displayName || "").trim() || current.displayName || userId;
        current.sessions += 1;
        current.lastSeenAt = Math.max(current.lastSeenAt, endedAt, startedAt);
        players.set(userId, current);
      }
      totalEncounters += seenInSession.size;
    }

    const topPlayers = [...players.values()]
      .sort((left, right) => right.sessions - left.sessions || right.lastSeenAt - left.lastSeenAt || left.displayName.localeCompare(right.displayName, "ru"));
    const topWorlds = [...worlds.values()]
      .sort((left, right) => right.sessions - left.sessions || right.lastSeenAt - left.lastSeenAt || left.worldName.localeCompare(right.worldName, "ru"));

    return {
      periodDays,
      sessionCount: selected.length,
      totalDurationMs,
      totalEncounters,
      uniquePlayerCount: players.size,
      recurringPlayerCount: topPlayers.filter((player) => player.sessions > 1).length,
      worldCount: worlds.size,
      topPlayers: topPlayers.slice(0, 10),
      topWorlds: topWorlds.slice(0, 6)
    };
  }

  function formatInsightDuration(value) {
    const totalMinutes = Math.max(0, Math.floor(Number(value || 0) / 60_000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes} мин`;
    if (minutes === 0) return `${hours} ч`;
    return `${hours} ч ${minutes} мин`;
  }

  function buildMyVrchatRecap(insights, periodLabel) {
    const topPlayers = insights.topPlayers
      .filter((player) => player.sessions > 1)
      .slice(0, 3)
      .map((player) => `${player.displayName} (${player.sessions})`)
      .join(", ");
    const topWorld = insights.topWorlds[0];
    return [
      `Мой VRChat · ${periodLabel}`,
      `Сессий: ${insights.sessionCount}`,
      `Время: ${formatInsightDuration(insights.totalDurationMs)}`,
      `Миров: ${insights.worldCount}`,
      `Уникальных игроков: ${insights.uniquePlayerCount}`,
      `Повторных встреч: ${insights.recurringPlayerCount}`,
      topPlayers ? `Чаще встречались: ${topPlayers}` : "",
      topWorld ? `Чаще записанный мир: ${topWorld.worldName} (${topWorld.sessions})` : ""
    ].filter(Boolean).join("\n");
  }

  return {
    buildMyVrchatInsights,
    buildMyVrchatRecap,
    formatInsightDuration
  };
});
