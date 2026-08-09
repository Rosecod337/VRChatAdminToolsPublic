(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.betaNotificationModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const RECENT_EVENT_WINDOW_MS = 2 * 60 * 1000;

  function clean(value, maximum = 240) {
    return String(value ?? "").trim().slice(0, maximum);
  }

  function eventTimestampMs(event) {
    const value = Date.parse(event?.timestamp || event?.capturedAt || event?.createdAt || "");
    return Number.isFinite(value) ? value : null;
  }

  function isRecentLiveEvent(event, now = Date.now()) {
    const timestamp = eventTimestampMs(event);
    return timestamp !== null && Math.abs(Number(now) - timestamp) <= RECENT_EVENT_WINDOW_MS;
  }

  function markedPlayer(event, notes = []) {
    if (event?.type !== "player-joined") return null;
    const userId = clean(event.userId, 120);
    if (!userId) return null;
    return (Array.isArray(notes) ? notes : []).find((row) => {
      const noteUserId = clean(row?.user_id ?? row?.userId, 120);
      const status = clean(row?.status || "ok", 40).toLowerCase();
      return noteUserId === userId && status !== "ok";
    }) || null;
  }

  function crashAvatar(event, notes = []) {
    if (event?.type !== "avatar-changed") return null;
    const avatarId = clean(event.avatarId, 120);
    const avatarName = clean(event.avatarName).toLocaleLowerCase("ru-RU");
    const crashNotes = (Array.isArray(notes) ? notes : []).filter((row) => clean(row?.status, 40).toLowerCase() === "crash");
    if (avatarId) {
      const byId = crashNotes.find((row) => {
        const noteId = clean(row?.avatar_id ?? row?.avatarId, 120);
        const noteKey = clean(row?.avatar_key ?? row?.avatarKey, 400);
        return noteId === avatarId || noteKey === `id:${avatarId}`;
      });
      if (byId) return byId;
    }
    if (!avatarName) return null;
    return crashNotes.find((row) => {
      const noteName = clean(row?.avatar_name ?? row?.avatarName).toLocaleLowerCase("ru-RU");
      const noteKey = clean(row?.avatar_key ?? row?.avatarKey, 400).toLocaleLowerCase("ru-RU");
      return noteName === avatarName || noteKey === `name:${avatarName}`;
    }) || null;
  }

  return { RECENT_EVENT_WINDOW_MS, eventTimestampMs, isRecentLiveEvent, markedPlayer, crashAvatar };
});
