(function initBetaMiniGames(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.betaMiniGames = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBetaMiniGames() {
  "use strict";

  function normalizeWorlds(rows) {
    const unique = new Map();
    for (const row of Array.isArray(rows) ? rows : []) {
      const key = String(row?.world_key || row?.world_id || "").trim();
      const name = String(row?.world_name || "").trim().slice(0, 120);
      const lastSeen = Date.parse(row?.last_seen_at || "");
      const sessions = Number(row?.session_count);
      if (!key || !name || !Number.isFinite(lastSeen) || !Number.isSafeInteger(sessions) || sessions < 0) continue;
      if (!unique.has(key)) unique.set(key, { key, name, lastSeen, sessions });
    }
    return [...unique.values()];
  }

  function shuffled(items, random = Math.random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const draw = Number(random());
      const choice = Math.min(index, Math.max(0, Math.floor((Number.isFinite(draw) ? draw : 0) * (index + 1))));
      [result[index], result[choice]] = [result[choice], result[index]];
    }
    return result;
  }

  function recentQuestion(worlds, random = Math.random, usedKeys = []) {
    const sorted = worlds
      .filter((world) => Number.isFinite(world.lastSeen))
      .sort((left, right) => right.lastSeen - left.lastSeen);
    if (sorted.length < 2) return null;
    const unused = sorted.filter((world) => !usedKeys.includes(world.key));
    const candidates = unused.length >= 2 ? unused : sorted;
    const sampled = [];
    const names = new Set();
    const times = new Set();
    for (const world of shuffled(candidates, random)) {
      const nameKey = world.name.toLocaleLowerCase();
      if (names.has(nameKey) || times.has(world.lastSeen)) continue;
      sampled.push(world);
      names.add(nameKey);
      times.add(world.lastSeen);
      if (sampled.length === 4) break;
    }
    sampled.sort((left, right) => right.lastSeen - left.lastSeen);
    if (sampled.length < 2) return null;
    const latest = sampled[0];
    return {
      mode: "recent",
      sourceKey: latest.key,
      prompt: "Какой из этих миров ты посещал позже остальных?",
      options: shuffled(sampled.map((world) => ({ value: world.key, label: world.name })), random),
      answer: latest.key,
      explanation: `Последнее посещение: ${new Date(latest.lastSeen).toLocaleDateString("ru-RU")}`
    };
  }

  function visitsQuestion(worlds, random = Math.random, usedKeys = []) {
    const eligible = worlds.filter((world) => Number.isSafeInteger(world.sessions) && world.sessions > 0);
    if (!eligible.length) return null;
    const unused = eligible.filter((world) => !usedKeys.includes(world.key));
    const pool = unused.length ? unused : eligible;
    const world = shuffled(pool, random)[0];
    const counts = new Set([world.sessions]);
    for (let offset = 1; counts.size < 4; offset += 1) {
      if (world.sessions - offset > 0) counts.add(world.sessions - offset);
      if (counts.size < 4) counts.add(world.sessions + offset);
    }
    return {
      mode: "visits",
      sourceKey: world.key,
      prompt: `Сколько сохранённых сессий связано с миром «${world.name}»?`,
      options: shuffled([...counts].map((count) => ({ value: String(count), label: String(count) })), random),
      answer: String(world.sessions),
      explanation: `В локальной истории: ${world.sessions}`
    };
  }

  function createQuestion(rows, mode, random = Math.random, usedKeys = []) {
    const worlds = normalizeWorlds(rows);
    if (mode === "recent") return recentQuestion(worlds, random, usedKeys);
    if (mode === "visits") return visitsQuestion(worlds, random, usedKeys);
    return null;
  }

  return { createQuestion, normalizeWorlds };
});
