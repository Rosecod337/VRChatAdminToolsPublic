(function exposeAvatarModel(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.betaAvatarModel = api;
})(typeof window !== "undefined" ? window : globalThis, function createAvatarModel() {
  function clean(value, maximum = 500) {
    return String(value ?? "").trim().slice(0, maximum);
  }

  function nameKey(name) {
    const value = clean(name).toLocaleLowerCase("ru-RU");
    return value ? `name:${value}` : "";
  }

  function idKey(id) {
    const value = clean(id, 120);
    return value ? `id:${value}` : "";
  }

  function key(name, id) {
    return idKey(id) || nameKey(name);
  }

  function normalizeCatalog(row = {}) {
    const avatarName = clean(row.avatar_name ?? row.avatarName, 240);
    const avatarId = clean(row.avatar_id ?? row.avatarId, 120);
    if (!avatarName || !avatarId) return null;
    return {
      avatarName,
      avatarId,
      avatarKey: idKey(avatarId),
      seenCount: Math.max(1, Number(row.seen_count ?? row.seenCount ?? 1) || 1),
      updatedAt: row.updated_at || row.updatedAt || ""
    };
  }

  function normalizeNote(row = {}, fallback = {}) {
    const avatarName = clean(row.avatar_name ?? row.avatarName ?? fallback.avatarName, 240);
    const avatarId = clean(row.avatar_id ?? row.avatarId ?? fallback.avatarId, 120);
    return {
      avatarKey: clean(row.avatar_key ?? row.avatarKey ?? fallback.avatarKey ?? key(avatarName, avatarId), 400),
      avatarName,
      avatarId,
      status: String(row.status || fallback.status || "ok").toLowerCase() === "crash" ? "crash" : "ok",
      note: clean(row.note ?? fallback.note, 2000),
      updatedAt: row.updated_at || row.updatedAt || fallback.updatedAt || "",
      updatedByKey: clean(row.updated_by_key ?? row.updatedByKey ?? fallback.updatedByKey, 120),
      updatedByLabel: clean(row.updated_by_label ?? row.updatedByLabel ?? fallback.updatedByLabel, 160)
    };
  }

  function normalizeGlobal(row = {}) {
    return {
      ...normalizeNote(row),
      sourceTeamId: clean(row.source_team_id ?? row.sourceTeamId, 120)
    };
  }

  function buildRows(events = [], catalog = [], notes = []) {
    const rows = new Map();
    const merge = (value) => {
      const avatarName = clean(value.avatarName, 240);
      const avatarId = clean(value.avatarId, 120);
      const nameOnlyKey = nameKey(avatarName);
      let avatarKey = key(avatarName, avatarId);
      if (!avatarKey) return;
      let previous = rows.get(avatarKey);
      if (avatarId && nameOnlyKey && rows.has(nameOnlyKey)) {
        previous = { ...rows.get(nameOnlyKey), ...(previous || {}) };
        rows.delete(nameOnlyKey);
      } else if (!avatarId && nameOnlyKey) {
        const resolved = [...rows.values()].find((row) => row.avatarId && nameKey(row.avatarName) === nameOnlyKey);
        if (resolved) {
          avatarKey = resolved.avatarKey;
          previous = resolved;
        }
      }
      previous ||= { avatarKey, avatarName, avatarId, playerName: "", userId: "", timestamp: "", seenCount: 0, status: "ok", note: "" };
      rows.set(avatarKey, {
        ...previous,
        ...value,
        avatarKey,
        avatarName: avatarName || previous.avatarName,
        avatarId: avatarId || previous.avatarId,
        seenCount: Math.max(Number(previous.seenCount || 0), Number(value.seenCount || 0))
      });
    };
    for (const row of catalog) {
      const normalized = normalizeCatalog(row);
      if (normalized) merge(normalized);
    }
    for (const event of events) {
      if (event?.type !== "avatar-changed" && event?.type !== "avatar-data") continue;
      merge({
        avatarName: clean(event.avatarName, 240),
        avatarId: clean(event.avatarId, 120),
        playerName: clean(event.playerName || event.display, 240),
        userId: clean(event.userId, 120),
        timestamp: event.timestamp || event.capturedAt || "",
        seenCount: 1
      });
    }
    for (const note of notes) {
      const normalized = normalizeNote(note);
      if (normalized.avatarKey) merge(normalized);
    }
    return [...rows.values()].sort((left, right) => {
      if (left.status !== right.status) return left.status === "crash" ? -1 : 1;
      return new Date(right.timestamp || right.updatedAt || 0) - new Date(left.timestamp || left.updatedAt || 0) || left.avatarName.localeCompare(right.avatarName, "ru");
    });
  }

  function filterRows(rows, query = "", mode = "all") {
    const search = clean(query).toLocaleLowerCase("ru-RU");
    return (Array.isArray(rows) ? rows : []).filter((row) => {
      if (mode === "crash" && row.status !== "crash") return false;
      if (mode === "unresolved" && row.avatarId) return false;
      if (!search) return true;
      return `${row.avatarName} ${row.avatarId} ${row.playerName} ${row.userId} ${row.note}`.toLocaleLowerCase("ru-RU").includes(search);
    });
  }

  return { clean, nameKey, idKey, key, normalizeCatalog, normalizeNote, normalizeGlobal, buildRows, filterRows };
});
