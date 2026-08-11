(function exposeBetaSessionModel(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.betaSessionModel = api;
})(typeof globalThis === "object" ? globalThis : this, () => {
  const MAX_BUFFERED_EVENTS = 5000;
  const PLAYER_MODES = Object.freeze(["online-first", "online-only", "all"]);

  function timestamp(value) {
    const time = new Date(value || 0).getTime();
    return Number.isFinite(time) ? time : 0;
  }

  function displayName(event = {}) {
    return String(event.display || event.playerName || event.userId || "Игрок");
  }

  function normalizedPlayerName(value) {
    return String(value || "").trim().toLocaleLowerCase("ru-RU");
  }

  function eventBelongsToPlayer(event = {}, player = {}) {
    const eventUserId = String(event.userId || "").trim();
    const playerUserId = String(player.userId || player.id || "").trim();
    if (eventUserId && playerUserId) return eventUserId === playerUserId;
    if (eventUserId || !playerUserId) return false;
    const eventPlayerName = normalizedPlayerName(event.display || event.playerName);
    const playerName = normalizedPlayerName(player.displayName || player.playerName || player.display || player.name);
    return Boolean(eventPlayerName && playerName && eventPlayerName === playerName);
  }

  function buildSessionStats(events = []) {
    const statusByUser = new Map();
    const displayByUser = new Map();
    const unique = new Set();
    let online = 0;
    let peak = 0;
    let world = "—";

    for (const event of Array.isArray(events) ? events : []) {
      if (String(event?.type || "").startsWith("world-") && (event.worldName || event.worldId)) {
        world = event.worldName || event.worldId;
      }
      const userId = String(event?.userId || "").trim();
      if (!userId) continue;
      if (event.display || event.playerName) displayByUser.set(userId, event.display || event.playerName);
      if (event.type === "player-joined") {
        unique.add(userId);
        if (statusByUser.get(userId)?.type !== "player-joined") online += 1;
        statusByUser.set(userId, event);
        peak = Math.max(peak, online);
      } else if (event.type === "player-left") {
        if (statusByUser.get(userId)?.type === "player-joined") online = Math.max(0, online - 1);
        statusByUser.set(userId, event);
      }
    }

    const players = [...statusByUser.entries()].map(([userId, event]) => ({
      ...event,
      userId,
      display: displayByUser.get(userId) || displayName(event),
      online: event.type === "player-joined",
      lastEventAt: event.timestamp || event.capturedAt || ""
    }));
    return { online, peak, unique: unique.size, world, players };
  }

  function buildPlaySessionStats(events = [], notes = []) {
    const source = Array.isArray(events) ? events : [];
    const session = buildSessionStats(source);
    const statusByUser = new Map();
    for (const note of Array.isArray(notes) ? notes : []) {
      const userId = String(note?.user_id ?? note?.userId ?? "").trim();
      if (userId) statusByUser.set(userId, String(note?.status || "ok"));
    }
    const players = session.players.slice(0, 250).map((player) => ({
      userId: player.userId,
      displayName: displayName(player),
      status: statusByUser.get(player.userId) || "ok"
    }));
    const avatarCount = source.filter((event) => {
      if (event?.type === "avatar-loading") return false;
      return event?.category === "avatars" || event?.type === "avatar-changed" || event?.type === "avatar-data";
    }).length;
    return {
      playerCount: session.unique,
      avatarCount,
      eventCount: source.length,
      worldName: session.world === "—" ? null : session.world,
      snapshot: { players }
    };
  }

  function filterPlayers(players = [], mode = "online-first", query = "") {
    const normalizedMode = PLAYER_MODES.includes(mode) ? mode : "online-first";
    const normalizedQuery = String(query || "").trim().toLocaleLowerCase("ru-RU");
    const visible = (Array.isArray(players) ? players : []).filter((player) => {
      if (normalizedMode === "online-only" && !player.online) return false;
      if (!normalizedQuery) return true;
      return `${displayName(player)} ${player.userId || ""}`.toLocaleLowerCase("ru-RU").includes(normalizedQuery);
    });
    return visible.sort((left, right) => {
      if (normalizedMode === "online-first" && Boolean(left.online) !== Boolean(right.online)) return left.online ? -1 : 1;
      return timestamp(right.lastEventAt) - timestamp(left.lastEventAt);
    });
  }

  function buildAvatarSummary(events = []) {
    const rows = (Array.isArray(events) ? events : [])
      .filter((event) => event?.type === "avatar-changed" || event?.type === "avatar-data")
      .map((event) => ({
        type: event.type,
        avatarName: String(event.avatarName || "Неизвестный аватар"),
        avatarId: String(event.avatarId || ""),
        userId: String(event.userId || ""),
        playerName: String(event.display || event.playerName || event.userId || "Игрок"),
        timestamp: event.timestamp || event.capturedAt || ""
      }))
      .reverse();
    const unique = new Set(rows.map((row) => row.avatarName !== "Неизвестный аватар" ? row.avatarName.toLocaleLowerCase("ru-RU") : row.avatarId).filter(Boolean));
    const players = new Set(rows.map((row) => row.userId || row.playerName.toLocaleLowerCase("ru-RU")).filter(Boolean));
    return {
      rows,
      events: rows.length,
      unique: unique.size,
      resolved: rows.filter((row) => row.avatarId).length,
      players: players.size
    };
  }

  function buildDashboard(events = []) {
    const counts = { joins: 0, leaves: 0, avatars: 0, worlds: 0, other: 0 };
    for (const event of Array.isArray(events) ? events : []) {
      if (event?.type === "player-joined") counts.joins += 1;
      else if (event?.type === "player-left") counts.leaves += 1;
      else if (event?.type === "avatar-changed" || event?.type === "avatar-data") counts.avatars += 1;
      else if (String(event?.type || "").startsWith("world-")) counts.worlds += 1;
      else counts.other += 1;
    }
    return counts;
  }

  function importantEvents(events = [], limit = 8) {
    const importantTypes = new Set([
      "player-joined",
      "player-left",
      "world-entering",
      "world-joining",
      "world-joined",
      "portal-created",
      "portal-destroyed"
    ]);
    const safeLimit = Math.max(1, Math.min(20, Math.floor(Number(limit) || 8)));
    return (Array.isArray(events) ? events : [])
      .filter((event) => importantTypes.has(String(event?.type || "")) || /crash|freeze|error/iu.test(String(event?.type || "")))
      .slice(-safeLimit)
      .reverse();
  }

  function virtualWindow({ total = 0, scrollTop = 0, viewportHeight = 0, rowHeight = 1, overscan = 4 } = {}) {
    const safeTotal = Math.max(0, Math.floor(Number(total) || 0));
    const safeRowHeight = Math.max(1, Number(rowHeight) || 1);
    const safeViewport = Math.max(safeRowHeight, Number(viewportHeight) || safeRowHeight);
    const safeOverscan = Math.max(0, Math.floor(Number(overscan) || 0));
    const maximumScroll = Math.max(0, safeTotal * safeRowHeight - safeViewport);
    const safeScrollTop = Math.min(maximumScroll, Math.max(0, Number(scrollTop) || 0));
    const firstVisible = Math.floor(safeScrollTop / safeRowHeight);
    const start = Math.max(0, firstVisible - safeOverscan);
    const visibleCount = Math.ceil(safeViewport / safeRowHeight);
    const end = Math.min(safeTotal, firstVisible + visibleCount + safeOverscan);
    return {
      start,
      end,
      offset: start * safeRowHeight,
      totalHeight: safeTotal * safeRowHeight
    };
  }

  return { MAX_BUFFERED_EVENTS, PLAYER_MODES, buildSessionStats, buildPlaySessionStats, filterPlayers, eventBelongsToPlayer, buildAvatarSummary, buildDashboard, importantEvents, virtualWindow };
});
