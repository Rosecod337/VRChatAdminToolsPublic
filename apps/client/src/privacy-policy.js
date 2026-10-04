"use strict";

const RETENTION_DAYS = [0, 30, 90, 180, 365];
function normalizePrivacyPolicy(value = {}, fallbackDays = 0) {
  const days = (key, fallback) => RETENTION_DAYS.includes(Number(value[key])) ? Number(value[key]) : fallback;
  return {
    historyDays: days("historyDays", fallbackDays), socialDays: days("socialDays", fallbackDays), preferencesDays: days("preferencesDays", 0),
    photosDays: days("photosDays", 0), diagnosticsDays: days("diagnosticsDays", 30),
    captureHistory: value.captureHistory !== false, captureSocialEvents: value.captureSocialEvents !== false,
    serverArchive: value.serverArchive !== false
  };
}

function redactedReportRow(kind, row) {
  const day = (value) => /^\d{4}-\d{2}-\d{2}/u.test(String(value || "")) ? String(value).slice(0, 10) : null;
  const count = (value) => Math.max(0, Math.min(1000000, Number(value) || 0));
  if (kind === "sessions") return { startedDay: day(row.started_at), endedDay: day(row.ended_at), players: count(row.player_count), avatars: count(row.avatar_count), events: count(row.event_count) };
  if (kind === "socialEvents") return { day: day(row.occurred_at), type: ["online", "offline", "location", "renamed", "avatar", "status", "status-description", "added", "removed", "friend-add", "friend-delete"].includes(row.event_type) ? row.event_type : "other" };
  if (kind === "socialFriends") return { online: row.online === 1, lastSeenDay: day(row.last_seen_at) };
  if (kind === "photos") return { capturedDay: day(row.captured_at), dateSource: row.date_source === "metadata" ? "metadata" : "file-modification" };
  if (kind === "diagnosticRuns") return { startedDay: day(row.started_at), endedDay: day(row.ended_at) };
  if (kind === "diagnosticSamples" || kind === "diagnosticMarks") return { day: day(row.at) };
  return { updatedDay: day(row.updated_at) };
}

module.exports = { RETENTION_DAYS, normalizePrivacyPolicy, redactedReportRow };
