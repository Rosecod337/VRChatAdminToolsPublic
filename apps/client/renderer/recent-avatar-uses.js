"use strict";

(function exposeRecentAvatarUses(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.recentAvatarUses = api.recentAvatarUses;
})(typeof globalThis === "object" ? globalThis : null, () => {
  function avatarNameKey(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/gu, " ")
      .replace(/\s+by\s+.+$/iu, "")
      .toLowerCase()
      .slice(0, 180);
  }

  function recentAvatarUses(events) {
    const rows = [];
    for (const event of events) {
      if (event.type !== "avatar-changed" && event.type !== "avatar-data") continue;
      if (!event.avatarName && !event.avatarId) continue;

      const eventTime = new Date(event.timestamp || event.capturedAt || 0).getTime();
      const key = avatarNameKey(event.avatarName);
      const avatarId = String(event.avatarId || "").trim().toLowerCase();
      const existing = [...rows].reverse().find((row) => {
        const rowTime = new Date(row.timestamp || row.capturedAt || 0).getTime();
        const timeDistance = Math.abs(eventTime - rowTime);
        const closeInTime = Number.isFinite(eventTime) && Number.isFinite(rowTime) && timeDistance <= 60_000;
        const sameName = Boolean(key) && avatarNameKey(row.avatarName) === key;
        const sameId = Boolean(avatarId) && String(row.avatarId || "").trim().toLowerCase() === avatarId;
        const complementaryPair = timeDistance <= 10_000 && (
          (event.type === "avatar-data" && row.type === "avatar-changed") ||
          (event.type === "avatar-changed" && row.type === "avatar-data")
        ) && (!event.avatarName || !row.avatarName) && (!event.avatarId || !row.avatarId);
        return closeInTime && (sameName || sameId || complementaryPair);
      });

      if (existing) {
        existing.avatarId ||= event.avatarId || "";
        existing.avatarName ||= event.avatarName || "";
        existing.avatarIdSource ||= event.avatarIdSource || "";
        existing.avatarMatchConfidence ||= event.avatarMatchConfidence || "";
        existing.avatarCandidates ||= event.avatarCandidates || [];
        existing.timestamp = event.timestamp || existing.timestamp;
        continue;
      }

      rows.push({ ...event });
    }
    return rows;
  }

  return { recentAvatarUses };
});
