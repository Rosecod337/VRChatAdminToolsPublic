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

  function distinctWorlds(rows) {
    const names = new Set();
    return rows.filter((world) => {
      const name = world.name.toLocaleLowerCase();
      if (names.has(name)) return false;
      names.add(name);
      return true;
    });
  }

  function eligibleTargets(worlds, mode) {
    const ranked = distinctWorlds(worlds)
      .filter((world) => mode !== "visits" || world.sessions > 0)
      .sort((left, right) => mode === "recent" ? right.lastSeen - left.lastSeen : right.sessions - left.sessions);
    const score = (world) => mode === "recent" ? world.lastSeen : world.sessions;
    return ranked.filter((world) => ranked.some((other) => score(other) < score(world)));
  }

  function availableRounds(rows, mode) {
    if (!["recent", "visits"].includes(mode)) return 0;
    return eligibleTargets(normalizeWorlds(rows), mode).length;
  }

  function createQuestion(rows, mode, random = Math.random, usedKeys = []) {
    if (!["recent", "visits"].includes(mode)) return null;
    const worlds = distinctWorlds(normalizeWorlds(rows));
    const score = (world) => mode === "recent" ? world.lastSeen : world.sessions;
    const targets = eligibleTargets(worlds, mode).filter((world) => !usedKeys.includes(world.key));
    if (!targets.length) return null;
    const target = shuffled(targets, random)[0];
    const distractors = shuffled(worlds.filter((world) =>
      score(world) < score(target) && (mode !== "visits" || world.sessions > 0)), random).slice(0, 3);
    const options = shuffled([target, ...distractors], random).map((world) => ({
      value: world.key,
      label: world.name,
      detail: mode === "recent" ? new Date(world.lastSeen).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }) : String(world.sessions)
    }));
    return {
      mode,
      sourceKey: target.key,
      prompt: mode === "recent" ? "В какой мир ты заходил позже?" : "В какой мир ты возвращался чаще?",
      options,
      answer: target.key
    };
  }

  return { availableRounds, createQuestion, normalizeWorlds };
});
