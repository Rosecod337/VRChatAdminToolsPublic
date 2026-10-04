"use strict";

const path = require("node:path");
const fs = require("node:fs");
const { once } = require("node:events");
const { createHash, randomUUID } = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");
const { normalizePrivacyPolicy, redactedReportRow } = require("./privacy-policy");
const { PersonalToolsStore, KINDS: PERSONAL_KINDS } = require("./personal-tools-store");
const { PhotoAtlas } = require("./photo-atlas");
const { DiagnosticRecorder } = require("./diagnostic-recorder");
const EXTRA_BACKUP_TABLES = { photoRoots: ["photo_roots", "photos"], photos: ["photo_items", "photos"], diagnosticRuns: ["diagnostic_runs", "diagnostics"], diagnosticSamples: ["diagnostic_samples", "diagnostics"], diagnosticMarks: ["diagnostic_marks", "diagnostics"] };

const MAX_LOCAL_SESSIONS = 5_000;
const MAX_LOCAL_SOCIAL_EVENTS = 20_000;
const MAX_SEARCH_RESULTS = 100;
const ENTITY_SCHEMA_VERSION = "4";
const ENTITY_BACKFILL_BATCH_SIZE = 25;
const EXPORT_PAGE_SIZE = 250;
const USER_ID_RE = /^usr_[a-z0-9_-]{3,80}$/iu;
const WORLD_ID_RE = /^wrld_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const AVATAR_ID_RE = /^avtr_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

function isoTimestamp(value = Date.now()) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? new Date().toISOString() : date.toISOString();
}

function snapshotJson(value) {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? value : "{}";
    } catch {
      return "{}";
    }
  }
  return JSON.stringify(value && typeof value === "object" ? value : {});
}

function snapshotObject(value) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function socialFieldKnown(friend, key) {
  if (typeof friend?._known?.[key] === "boolean") return friend._known[key];
  return Object.hasOwn(friend || {}, key) && friend[key] !== undefined;
}

function searchPattern(value) {
  return `%${String(value || "").trim().slice(0, 120).replace(/[\\%_]/gu, "\\$&")}%`;
}

function normalizedWorld({ worldName = "", worldId = "" } = {}) {
  const safeWorldName = String(worldName || "").trim().slice(0, 300);
  const safeWorldId = WORLD_ID_RE.test(String(worldId || "").trim()) ? String(worldId).trim() : "";
  if (!safeWorldName && !safeWorldId) return null;
  return {
    worldKey: safeWorldId || `name:${safeWorldName.toLocaleLowerCase("ru-RU")}`,
    worldId: safeWorldId,
    worldName: safeWorldName || safeWorldId
  };
}

function normalizedAvatar({ avatarName = "", avatarId = "" } = {}) {
  const safeAvatarName = String(avatarName || "").trim().slice(0, 300);
  const safeAvatarId = AVATAR_ID_RE.test(String(avatarId || "").trim()) ? String(avatarId).trim() : "";
  if (!safeAvatarName && !safeAvatarId) return null;
  return {
    avatarKey: safeAvatarId || `name:${safeAvatarName.toLocaleLowerCase("ru-RU")}`,
    avatarId: safeAvatarId,
    avatarName: safeAvatarName || safeAvatarId
  };
}

function playerEventIdentity(source = {}) {
  return JSON.stringify([
    String(source.user_id ?? source.userId ?? "").trim(),
    String(source.display_name ?? source.displayName ?? source.playerName ?? "").trim().slice(0, 160),
    String(source.event_type ?? source.type ?? "").trim(),
    isoTimestamp(source.occurred_at ?? source.seenAt),
    String(source.world_name ?? source.worldName ?? "").trim().slice(0, 300),
    String(source.world_id ?? source.worldId ?? "").trim().slice(0, 80)
  ]);
}

function worldVisitIdentity(source = {}) {
  const existingWorldKey = String(source.world_key ?? source.worldKey ?? "").trim();
  if (existingWorldKey) return JSON.stringify([existingWorldKey, isoTimestamp(source.seen_at ?? source.seenAt)]);
  const world = normalizedWorld({
    worldName: source.world_name ?? source.worldName,
    worldId: source.world_id ?? source.worldId
  });
  if (!world) return "";
  return JSON.stringify([world.worldKey, isoTimestamp(source.seen_at ?? source.seenAt)]);
}

async function writeStreamChunk(stream, chunk) {
  if (stream.errored) throw stream.errored;
  if (!stream.write(chunk)) await once(stream, "drain");
}

class LocalCompanionStore {
  constructor(filePath) {
    if (!path.isAbsolute(filePath)) throw new Error("Local companion database path must be absolute");
    this.filePath = filePath;
    this.closed = false;
    this.backfillHandle = null;
    this.maintenanceHandle = null;
    this.database = new DatabaseSync(filePath);
    this.database.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      CREATE TABLE IF NOT EXISTS play_sessions (
        id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        world_name TEXT NOT NULL DEFAULT '',
        player_count INTEGER NOT NULL DEFAULT 0,
        avatar_count INTEGER NOT NULL DEFAULT 0,
        event_count INTEGER NOT NULL DEFAULT 0,
        snapshot TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS play_sessions_started_at_idx
        ON play_sessions(started_at DESC);
      CREATE TABLE IF NOT EXISTS local_players (
        user_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL DEFAULT '',
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS local_players_name_idx
        ON local_players(display_name COLLATE NOCASE);
      CREATE TABLE IF NOT EXISTS session_players (
        session_id TEXT NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES local_players(user_id) ON DELETE CASCADE,
        display_name TEXT NOT NULL DEFAULT '',
        seen_at TEXT NOT NULL,
        PRIMARY KEY (session_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS session_players_user_idx
        ON session_players(user_id, seen_at DESC);
      CREATE TABLE IF NOT EXISTS local_player_names (
        user_id TEXT NOT NULL REFERENCES local_players(user_id) ON DELETE CASCADE,
        display_name TEXT NOT NULL,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        seen_count INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (user_id, display_name)
      );
      CREATE INDEX IF NOT EXISTS local_player_names_user_idx
        ON local_player_names(user_id, last_seen_at DESC);
      CREATE TABLE IF NOT EXISTS local_player_events (
        session_id TEXT NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,
        event_index INTEGER NOT NULL,
        user_id TEXT NOT NULL REFERENCES local_players(user_id) ON DELETE CASCADE,
        display_name TEXT NOT NULL DEFAULT '',
        event_type TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        world_name TEXT NOT NULL DEFAULT '',
        world_id TEXT NOT NULL DEFAULT '',
        PRIMARY KEY (session_id, event_index)
      );
      CREATE INDEX IF NOT EXISTS local_player_events_user_idx
        ON local_player_events(user_id, occurred_at DESC);
      CREATE TABLE IF NOT EXISTS local_player_preferences (
        user_id TEXT PRIMARY KEY,
        alias TEXT NOT NULL DEFAULT '',
        note TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'none',
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS local_worlds (
        world_key TEXT PRIMARY KEY,
        world_id TEXT NOT NULL DEFAULT '',
        world_name TEXT NOT NULL DEFAULT '',
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS local_worlds_name_idx
        ON local_worlds(world_name COLLATE NOCASE);
      CREATE TABLE IF NOT EXISTS session_worlds (
        session_id TEXT PRIMARY KEY REFERENCES play_sessions(id) ON DELETE CASCADE,
        world_key TEXT NOT NULL REFERENCES local_worlds(world_key) ON DELETE CASCADE,
        seen_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS session_worlds_world_idx
        ON session_worlds(world_key, seen_at DESC);
      CREATE TABLE IF NOT EXISTS local_world_visits (
        session_id TEXT NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,
        visit_index INTEGER NOT NULL,
        world_key TEXT NOT NULL REFERENCES local_worlds(world_key) ON DELETE CASCADE,
        seen_at TEXT NOT NULL,
        PRIMARY KEY (session_id, visit_index)
      );
      CREATE INDEX IF NOT EXISTS local_world_visits_world_idx
        ON local_world_visits(world_key, seen_at DESC);
      CREATE TABLE IF NOT EXISTS local_world_preferences (
        world_key TEXT PRIMARY KEY,
        favorite INTEGER NOT NULL DEFAULT 0,
        note TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS local_avatars (
        avatar_key TEXT PRIMARY KEY,
        avatar_id TEXT NOT NULL DEFAULT '',
        avatar_name TEXT NOT NULL DEFAULT '',
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS local_avatars_name_idx
        ON local_avatars(avatar_name COLLATE NOCASE);
      CREATE TABLE IF NOT EXISTS session_avatars (
        session_id TEXT NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,
        avatar_key TEXT NOT NULL REFERENCES local_avatars(avatar_key) ON DELETE CASCADE,
        user_id TEXT NOT NULL DEFAULT '',
        display_name TEXT NOT NULL DEFAULT '',
        seen_at TEXT NOT NULL,
        PRIMARY KEY (session_id, avatar_key, user_id)
      );
      CREATE INDEX IF NOT EXISTS session_avatars_avatar_idx
        ON session_avatars(avatar_key, seen_at DESC);
      CREATE TABLE IF NOT EXISTS local_social_friends (
        user_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'offline',
        status_description TEXT NOT NULL DEFAULT '',
        location TEXT NOT NULL DEFAULT '',
        platform TEXT NOT NULL DEFAULT '',
        online INTEGER NOT NULL DEFAULT 0,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        snapshot TEXT NOT NULL DEFAULT '{}'
      );
      CREATE INDEX IF NOT EXISTS local_social_friends_online_idx
        ON local_social_friends(online DESC, display_name COLLATE NOCASE);
      CREATE TABLE IF NOT EXISTS local_social_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        user_id TEXT NOT NULL,
        display_name TEXT NOT NULL DEFAULT '',
        previous_value TEXT NOT NULL DEFAULT '',
        current_value TEXT NOT NULL DEFAULT '',
        occurred_at TEXT NOT NULL,
        snapshot TEXT NOT NULL DEFAULT '{}'
      );
      CREATE INDEX IF NOT EXISTS local_social_events_time_idx
        ON local_social_events(occurred_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS local_social_events_user_idx
        ON local_social_events(user_id, occurred_at DESC);
      CREATE TABLE IF NOT EXISTS companion_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    const entitySchema = this.database.prepare("SELECT value FROM companion_meta WHERE key = 'entity_schema'").get();
    if (entitySchema?.value !== ENTITY_SCHEMA_VERSION) this.scheduleBackfillEntities();
    this.scheduleMaintenance();
  }

  createSession({ worldName = "", startedAt = Date.now() } = {}) {
    const id = `local-${randomUUID()}`;
    if (!this.getPrivacyPolicy().captureHistory) return id;
    const timestamp = isoTimestamp(startedAt);
    this.database.prepare(`
      INSERT INTO play_sessions (id, started_at, world_name, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(id, timestamp, String(worldName || "").slice(0, 300), timestamp);
    this.pruneOverflow();
    return id;
  }

  ensureSession(id, { worldName = "", startedAt = Date.now() } = {}) {
    if (!this.getPrivacyPolicy().captureHistory) return { ok: true, skipped: true, playSessionId: String(id || "") };
    const sessionId = String(id || "").trim();
    if (!/^[a-zA-Z0-9_-]{1,200}$/.test(sessionId)) return { ok: false, error: "invalid_session_id" };
    const timestamp = isoTimestamp(startedAt);
    this.database.prepare(`
      INSERT OR IGNORE INTO play_sessions (id, started_at, world_name, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, timestamp, String(worldName || "").slice(0, 300), timestamp);
    return { ok: true, playSessionId: sessionId };
  }

  updateSession(id, stats = {}, { end = false } = {}) {
    if (!this.getPrivacyPolicy().captureHistory) return { ok: true, skipped: true, playSessionId: String(id || "") };
    const sessionId = String(id || "").trim();
    if (!/^[a-zA-Z0-9_-]{1,200}$/.test(sessionId)) return { ok: false, error: "invalid_session_id" };
    const safeStats = stats && typeof stats === "object" ? stats : {};
    const timestamp = isoTimestamp();
    const hasWorldName = Object.hasOwn(safeStats, "worldName") && safeStats.worldName !== null;
    const hasPlayerCount = Object.hasOwn(safeStats, "playerCount");
    const hasAvatarCount = Object.hasOwn(safeStats, "avatarCount");
    const hasEventCount = Object.hasOwn(safeStats, "eventCount");
    const hasSnapshot = Object.hasOwn(safeStats, "snapshot") && safeStats.snapshot !== null;
    const nextWorldName = hasWorldName ? String(safeStats.worldName || "").slice(0, 300) : null;
    const nextSnapshot = hasSnapshot ? snapshotJson(safeStats.snapshot) : null;
    const previous = (hasSnapshot || hasWorldName)
      ? this.database.prepare("SELECT world_name, snapshot FROM play_sessions WHERE id = ?").get(sessionId)
      : null;
    const entitiesChanged = Boolean(previous) && (
      (hasWorldName && previous.world_name !== nextWorldName)
      || (hasSnapshot && previous.snapshot !== nextSnapshot)
    );
    const result = this.database.prepare(`
      UPDATE play_sessions
      SET ended_at = CASE WHEN ? THEN ? ELSE ended_at END,
          world_name = COALESCE(?, world_name),
          player_count = COALESCE(?, player_count),
          avatar_count = COALESCE(?, avatar_count),
          event_count = COALESCE(?, event_count),
          snapshot = COALESCE(?, snapshot),
          updated_at = ?
      WHERE id = ?
    `).run(
      end ? 1 : 0,
      timestamp,
      nextWorldName,
      hasPlayerCount ? Math.max(0, Number(safeStats.playerCount) || 0) : null,
      hasAvatarCount ? Math.max(0, Number(safeStats.avatarCount) || 0) : null,
      hasEventCount ? Math.max(0, Number(safeStats.eventCount) || 0) : null,
      nextSnapshot,
      timestamp,
      sessionId
    );
    if (result.changes > 0 && entitiesChanged) {
      const row = this.database.prepare(`
        SELECT started_at, world_name, snapshot
        FROM play_sessions
        WHERE id = ?
      `).get(sessionId);
      if (row) this.syncSessionEntities(sessionId, row, timestamp);
    }
    if (end) this.pruneOverflow();
    return { ok: result.changes > 0, playSessionId: sessionId };
  }

  listSessions(limit = 200) {
    const safeLimit = Math.min(MAX_LOCAL_SESSIONS, Math.max(1, Number(limit) || 200));
    return this.database.prepare(`
      SELECT id, started_at, ended_at, world_name, player_count, avatar_count, event_count, snapshot
      FROM play_sessions
      ORDER BY started_at DESC
      LIMIT ?
    `).all(safeLimit);
  }

  ingestSessions(sessions = [], { explicitImport = false } = {}) {
    if (!explicitImport && !this.getPrivacyPolicy().captureHistory) return { imported: 0 };
    const rows = Array.isArray(sessions) ? sessions.slice(0, MAX_LOCAL_SESSIONS) : [];
    const upsert = this.database.prepare(`
      INSERT INTO play_sessions (id, started_at, ended_at, world_name, player_count, avatar_count, event_count, snapshot, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        started_at = excluded.started_at,
        ended_at = excluded.ended_at,
        world_name = excluded.world_name,
        player_count = excluded.player_count,
        avatar_count = excluded.avatar_count,
        event_count = excluded.event_count,
        snapshot = excluded.snapshot,
        updated_at = excluded.updated_at
    `);
    const selectExistingSnapshot = this.database.prepare("SELECT snapshot FROM play_sessions WHERE id = ?");
    const now = isoTimestamp();
    for (const source of rows) {
      const id = String(source?.id || "").trim();
      const startedAt = isoTimestamp(source?.started_at ?? source?.startedAt);
      if (!id) continue;
      const endedValue = source?.ended_at ?? source?.endedAt;
      const endedAt = endedValue ? isoTimestamp(endedValue) : null;
      const worldName = String(source?.world_name ?? source?.worldName ?? "").trim().slice(0, 300);
      const sourceSnapshot = snapshotObject(source?.snapshot);
      const existingSnapshot = snapshotObject(selectExistingSnapshot.get(id)?.snapshot);
      for (const localKey of ["playerEvents", "worldVisits"]) {
        if (!Array.isArray(sourceSnapshot[localKey]) && Array.isArray(existingSnapshot[localKey])) {
          sourceSnapshot[localKey] = existingSnapshot[localKey];
        }
      }
      const snapshot = snapshotJson(sourceSnapshot);
      upsert.run(
        id,
        startedAt,
        endedAt,
        worldName,
        Math.max(0, Number(source?.player_count ?? source?.playerCount) || 0),
        Math.max(0, Number(source?.avatar_count ?? source?.avatarCount) || 0),
        Math.max(0, Number(source?.event_count ?? source?.eventCount) || 0),
        snapshot,
        now
      );
      this.syncSessionEntities(id, { started_at: startedAt, world_name: worldName, snapshot }, now);
    }
    return { ok: true, imported: rows.length };
  }

  syncSessionEntities(sessionId, session, updatedAt = isoTimestamp()) {
    this.database.exec("BEGIN IMMEDIATE");
    try {
    const snapshot = snapshotObject(session?.snapshot);
    const seenAt = isoTimestamp(session?.started_at || updatedAt);
    const players = new Map();
    for (const player of Array.isArray(snapshot.players) ? snapshot.players : []) {
      const userId = String(player?.userId || player?.id || "").trim();
      if (!USER_ID_RE.test(userId)) continue;
      players.set(userId, String(player?.displayName || player?.playerName || "").trim().slice(0, 160));
    }

    const upsertPlayer = this.database.prepare(`
      INSERT INTO local_players (user_id, display_name, first_seen_at, last_seen_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        display_name = CASE
          WHEN excluded.last_seen_at >= local_players.last_seen_at AND excluded.display_name <> '' THEN excluded.display_name
          ELSE local_players.display_name
        END,
        first_seen_at = MIN(local_players.first_seen_at, excluded.first_seen_at),
        last_seen_at = MAX(local_players.last_seen_at, excluded.last_seen_at),
        updated_at = excluded.updated_at
    `);
    const upsertSessionPlayer = this.database.prepare(`
      INSERT INTO session_players (session_id, user_id, display_name, seen_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(session_id, user_id) DO UPDATE SET
        display_name = CASE WHEN excluded.display_name <> '' THEN excluded.display_name ELSE session_players.display_name END,
        seen_at = excluded.seen_at
    `);
    const upsertPlayerName = this.database.prepare(`
      INSERT INTO local_player_names (user_id, display_name, first_seen_at, last_seen_at, seen_count)
      VALUES (?, ?, ?, ?, 1)
      ON CONFLICT(user_id, display_name) DO UPDATE SET
        first_seen_at = MIN(local_player_names.first_seen_at, excluded.first_seen_at),
        last_seen_at = MAX(local_player_names.last_seen_at, excluded.last_seen_at),
        seen_count = MAX(local_player_names.seen_count, excluded.seen_count)
    `);
    for (const [userId, displayName] of players) {
      upsertPlayer.run(userId, displayName, seenAt, seenAt, updatedAt);
      upsertSessionPlayer.run(sessionId, userId, displayName, seenAt);
      if (displayName) upsertPlayerName.run(userId, displayName, seenAt, seenAt);
    }

    const playerEvents = Array.isArray(snapshot.playerEvents) ? snapshot.playerEvents.slice(-2500) : [];
    const insertPlayerEvent = this.database.prepare(`
      INSERT INTO local_player_events
        (session_id, event_index, user_id, display_name, event_type, occurred_at, world_name, world_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const existingPlayerEvents = this.database.prepare(`
      SELECT event_index, user_id, display_name, event_type, occurred_at, world_name, world_id
      FROM local_player_events
      WHERE session_id = ?
      ORDER BY event_index DESC
      LIMIT 2500
    `).all(sessionId);
    const existingPlayerEventKeys = new Set(existingPlayerEvents.map(playerEventIdentity));
    let nextPlayerEventIndex = existingPlayerEvents.reduce((maximum, row) => Math.max(maximum, Number(row.event_index) || 0), -1) + 1;
    playerEvents.forEach((event) => {
      const userId = String(event?.userId || "").trim();
      const eventType = String(event?.type || "").trim();
      if (!USER_ID_RE.test(userId) || !["player-joined", "player-left"].includes(eventType)) return;
      const eventSeenAt = isoTimestamp(event?.seenAt || seenAt);
      const displayName = String(event?.displayName || event?.playerName || "").trim().slice(0, 160);
      const normalizedEvent = {
        userId,
        displayName,
        type: eventType,
        seenAt: eventSeenAt,
        worldName: String(event?.worldName || "").trim().slice(0, 300),
        worldId: String(event?.worldId || "").trim().slice(0, 80)
      };
      const eventKey = playerEventIdentity(normalizedEvent);
      if (existingPlayerEventKeys.has(eventKey)) return;
      upsertPlayer.run(userId, displayName, eventSeenAt, eventSeenAt, updatedAt);
      if (displayName) upsertPlayerName.run(userId, displayName, eventSeenAt, eventSeenAt);
      insertPlayerEvent.run(
        sessionId,
        nextPlayerEventIndex,
        userId,
        displayName,
        eventType,
        eventSeenAt,
        normalizedEvent.worldName,
        normalizedEvent.worldId
      );
      nextPlayerEventIndex += 1;
      existingPlayerEventKeys.add(eventKey);
    });

    const world = normalizedWorld({ worldName: session?.world_name, worldId: snapshot.worldId });
    if (world) {
      this.database.prepare(`
        INSERT INTO local_worlds (world_key, world_id, world_name, first_seen_at, last_seen_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(world_key) DO UPDATE SET
          world_id = CASE WHEN excluded.world_id <> '' THEN excluded.world_id ELSE local_worlds.world_id END,
          world_name = CASE WHEN excluded.world_name <> '' THEN excluded.world_name ELSE local_worlds.world_name END,
          first_seen_at = MIN(local_worlds.first_seen_at, excluded.first_seen_at),
          last_seen_at = MAX(local_worlds.last_seen_at, excluded.last_seen_at),
          updated_at = excluded.updated_at
      `).run(world.worldKey, world.worldId, world.worldName, seenAt, seenAt, updatedAt);
      this.database.prepare(`
        INSERT INTO session_worlds (session_id, world_key, seen_at)
        VALUES (?, ?, ?)
        ON CONFLICT(session_id) DO UPDATE SET world_key = excluded.world_key, seen_at = excluded.seen_at
      `).run(sessionId, world.worldKey, seenAt);
    }
    const worldVisits = Array.isArray(snapshot.worldVisits) ? snapshot.worldVisits.slice(-1000) : [];
    const upsertWorld = this.database.prepare(`
      INSERT INTO local_worlds (world_key, world_id, world_name, first_seen_at, last_seen_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(world_key) DO UPDATE SET
        world_id = CASE WHEN excluded.world_id <> '' THEN excluded.world_id ELSE local_worlds.world_id END,
        world_name = CASE WHEN excluded.world_name <> '' THEN excluded.world_name ELSE local_worlds.world_name END,
        first_seen_at = MIN(local_worlds.first_seen_at, excluded.first_seen_at),
        last_seen_at = MAX(local_worlds.last_seen_at, excluded.last_seen_at),
        updated_at = excluded.updated_at
    `);
    const insertWorldVisit = this.database.prepare(`
      INSERT INTO local_world_visits (session_id, visit_index, world_key, seen_at)
      VALUES (?, ?, ?, ?)
    `);
    const existingWorldVisits = this.database.prepare(`
      SELECT visit_index, world_key, seen_at
      FROM local_world_visits
      WHERE session_id = ?
      ORDER BY visit_index DESC
      LIMIT 1000
    `).all(sessionId);
    const existingWorldVisitKeys = new Set(existingWorldVisits.map(worldVisitIdentity));
    let nextWorldVisitIndex = existingWorldVisits.reduce((maximum, row) => Math.max(maximum, Number(row.visit_index) || 0), -1) + 1;
    worldVisits.forEach((visit) => {
      const normalized = normalizedWorld(visit || {});
      if (!normalized) return;
      const visitAt = isoTimestamp(visit?.seenAt || seenAt);
      const visitKey = worldVisitIdentity({ worldId: normalized.worldId, worldName: normalized.worldName, seenAt: visitAt });
      if (existingWorldVisitKeys.has(visitKey)) return;
      upsertWorld.run(normalized.worldKey, normalized.worldId, normalized.worldName, visitAt, visitAt, updatedAt);
      insertWorldVisit.run(sessionId, nextWorldVisitIndex, normalized.worldKey, visitAt);
      nextWorldVisitIndex += 1;
      existingWorldVisitKeys.add(visitKey);
    });

    const upsertAvatar = this.database.prepare(`
      INSERT INTO local_avatars (avatar_key, avatar_id, avatar_name, first_seen_at, last_seen_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(avatar_key) DO UPDATE SET
        avatar_id = CASE WHEN excluded.avatar_id <> '' THEN excluded.avatar_id ELSE local_avatars.avatar_id END,
        avatar_name = CASE WHEN excluded.avatar_name <> '' THEN excluded.avatar_name ELSE local_avatars.avatar_name END,
        first_seen_at = MIN(local_avatars.first_seen_at, excluded.first_seen_at),
        last_seen_at = MAX(local_avatars.last_seen_at, excluded.last_seen_at),
        updated_at = excluded.updated_at
    `);
    const upsertSessionAvatar = this.database.prepare(`
      INSERT INTO session_avatars (session_id, avatar_key, user_id, display_name, seen_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(session_id, avatar_key, user_id) DO UPDATE SET
        display_name = CASE WHEN excluded.display_name <> '' THEN excluded.display_name ELSE session_avatars.display_name END,
        seen_at = MAX(session_avatars.seen_at, excluded.seen_at)
    `);
    for (const observation of Array.isArray(snapshot.avatars) ? snapshot.avatars : []) {
      const avatar = normalizedAvatar(observation);
      if (!avatar) continue;
      const avatarSeenAt = isoTimestamp(observation?.seenAt || seenAt);
      const userId = USER_ID_RE.test(String(observation?.userId || "").trim()) ? String(observation.userId).trim() : "";
      const displayName = String(observation?.displayName || "").trim().slice(0, 160);
      upsertAvatar.run(avatar.avatarKey, avatar.avatarId, avatar.avatarName, avatarSeenAt, avatarSeenAt, updatedAt);
      upsertSessionAvatar.run(sessionId, avatar.avatarKey, userId, displayName, avatarSeenAt);
    }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  scheduleBackfillEntities() {
    if (this.closed || this.backfillHandle) return;
    this.backfillHandle = setImmediate(() => {
      this.backfillHandle = null;
      if (this.closed) return;
      try {
        const result = this.backfillEntities(ENTITY_BACKFILL_BATCH_SIZE);
        if (!result.complete) this.scheduleBackfillEntities();
      } catch {
        // Оставляем cursor и повторяем миграцию при следующем запуске.
      }
    });
  }

  backfillEntities(batchSize = ENTITY_BACKFILL_BATCH_SIZE) {
    const safeBatchSize = Math.min(100, Math.max(1, Number(batchSize) || ENTITY_BACKFILL_BATCH_SIZE));
    const cursor = Math.max(0, Number(this.database.prepare("SELECT value FROM companion_meta WHERE key = 'entity_backfill_cursor'").get()?.value) || 0);
    const rows = this.database.prepare(`
      SELECT rowid AS cursor_id, id, started_at, world_name, snapshot, updated_at
      FROM play_sessions
      WHERE rowid > ?
      ORDER BY rowid ASC
      LIMIT ?
    `).all(cursor, safeBatchSize);
    for (const row of rows) this.syncSessionEntities(row.id, row, row.updated_at);
    if (rows.length === safeBatchSize) {
      this.database.prepare(`
        INSERT INTO companion_meta (key, value) VALUES ('entity_backfill_cursor', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(String(rows.at(-1).cursor_id));
      return { complete: false, processed: rows.length };
    }
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare(`
        INSERT INTO companion_meta (key, value) VALUES ('entity_schema', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(ENTITY_SCHEMA_VERSION);
      this.database.prepare("DELETE FROM companion_meta WHERE key = 'entity_backfill_cursor'").run();
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return { complete: true, processed: rows.length };
  }

  scheduleMaintenance() {
    if (this.closed || this.maintenanceHandle) return;
    this.maintenanceHandle = setImmediate(() => {
      this.maintenanceHandle = null;
      if (this.closed) return;
      try {
        this.pruneOverflow();
      } catch {
        // Обслуживание повторится при следующей записи или запуске.
      }
    });
  }

  pruneOverflow() {
    const removedSessions = Number(this.database.prepare(`
      DELETE FROM play_sessions
      WHERE id IN (
        SELECT id FROM play_sessions
        ORDER BY started_at DESC, id DESC
        LIMIT -1 OFFSET ?
      )
    `).run(MAX_LOCAL_SESSIONS).changes) || 0;
    const removedSocialEvents = Number(this.database.prepare(`
      DELETE FROM local_social_events
      WHERE id IN (
        SELECT id FROM local_social_events
        ORDER BY occurred_at DESC, id DESC
        LIMIT -1 OFFSET ?
      )
    `).run(MAX_LOCAL_SOCIAL_EVENTS).changes) || 0;
    return removedSessions + removedSocialEvents;
  }

  search(query = "", limit = 40) {
    const safeLimit = Math.min(MAX_SEARCH_RESULTS, Math.max(1, Number(limit) || 40));
    const pattern = searchPattern(query);
    const players = this.database.prepare(`
      SELECT p.user_id, p.display_name, p.first_seen_at, p.last_seen_at,
             COALESCE(pref.alias, '') AS alias, COALESCE(pref.note, '') AS note,
             COALESCE(pref.status, 'none') AS status,
             COUNT(sp.session_id) AS session_count
      FROM local_players p
      LEFT JOIN session_players sp ON sp.user_id = p.user_id
      LEFT JOIN local_player_preferences pref ON pref.user_id = p.user_id
      WHERE p.display_name LIKE ? ESCAPE '\\' COLLATE NOCASE
         OR p.user_id LIKE ? ESCAPE '\\' COLLATE NOCASE
         OR pref.alias LIKE ? ESCAPE '\\' COLLATE NOCASE
         OR pref.note LIKE ? ESCAPE '\\' COLLATE NOCASE
      GROUP BY p.user_id
      ORDER BY (COALESCE(pref.status, 'none') = 'favorite') DESC, p.last_seen_at DESC, p.display_name COLLATE NOCASE
      LIMIT ?
    `).all(pattern, pattern, pattern, pattern, safeLimit);
    const worlds = this.database.prepare(`
      SELECT w.world_key, w.world_id, w.world_name, w.first_seen_at, w.last_seen_at,
             COALESCE(pref.favorite, 0) AS favorite, COALESCE(pref.note, '') AS note,
             COUNT(DISTINCT visit.session_id) AS session_count
      FROM local_worlds w
      LEFT JOIN (
        SELECT session_id, world_key FROM session_worlds
        UNION
        SELECT session_id, world_key FROM local_world_visits
      ) visit ON visit.world_key = w.world_key
      LEFT JOIN local_world_preferences pref ON pref.world_key = w.world_key
      WHERE w.world_name LIKE ? ESCAPE '\\' COLLATE NOCASE
         OR w.world_id LIKE ? ESCAPE '\\' COLLATE NOCASE
         OR pref.note LIKE ? ESCAPE '\\' COLLATE NOCASE
      GROUP BY w.world_key
      ORDER BY favorite DESC, w.last_seen_at DESC, w.world_name COLLATE NOCASE
      LIMIT ?
    `).all(pattern, pattern, pattern, safeLimit);
    const avatars = this.database.prepare(`
      SELECT a.avatar_key, a.avatar_id, a.avatar_name, a.first_seen_at, a.last_seen_at,
             COUNT(DISTINCT sa.session_id) AS session_count,
             COUNT(sa.user_id) AS observation_count
      FROM local_avatars a
      LEFT JOIN session_avatars sa ON sa.avatar_key = a.avatar_key
      WHERE a.avatar_name LIKE ? ESCAPE '\\' COLLATE NOCASE
         OR a.avatar_id LIKE ? ESCAPE '\\' COLLATE NOCASE
      GROUP BY a.avatar_key
      ORDER BY a.last_seen_at DESC, a.avatar_name COLLATE NOCASE
      LIMIT ?
    `).all(pattern, pattern, safeLimit);
    return { players, worlds, avatars };
  }

  details(kind, key, limit = 30) {
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 30));
    if (kind === "player") {
      const entity = this.database.prepare(`
        SELECT p.user_id, p.display_name, p.first_seen_at, p.last_seen_at,
               COALESCE(pref.alias, '') AS alias, COALESCE(pref.note, '') AS note,
               COALESCE(pref.status, 'none') AS status,
               COUNT(sp.session_id) AS session_count
        FROM local_players p
        LEFT JOIN session_players sp ON sp.user_id = p.user_id
        LEFT JOIN local_player_preferences pref ON pref.user_id = p.user_id
        WHERE p.user_id = ?
        GROUP BY p.user_id
      `).get(String(key || ""));
      if (!entity) return null;
      const sessions = this.database.prepare(`
        SELECT s.id, s.started_at, s.ended_at, s.world_name, s.player_count, s.avatar_count, s.event_count, s.snapshot
        FROM play_sessions s
        JOIN session_players sp ON sp.session_id = s.id
        WHERE sp.user_id = ?
        ORDER BY s.started_at DESC
        LIMIT ?
      `).all(entity.user_id, safeLimit);
      const names = this.database.prepare(`
        SELECT display_name, first_seen_at, last_seen_at, seen_count
        FROM local_player_names WHERE user_id = ?
        ORDER BY last_seen_at DESC LIMIT ?
      `).all(entity.user_id, safeLimit);
      const events = this.database.prepare(`
        SELECT event_type, display_name, occurred_at, world_name, world_id
        FROM local_player_events WHERE user_id = ?
        ORDER BY occurred_at DESC LIMIT ?
      `).all(entity.user_id, safeLimit);
      const worlds = this.database.prepare(`
        SELECT w.world_key, w.world_id, w.world_name, COUNT(DISTINCT visit.session_id) AS session_count,
               MAX(s.started_at) AS last_seen_at
        FROM local_worlds w
        JOIN (
          SELECT session_id, world_key FROM session_worlds
          UNION
          SELECT session_id, world_key FROM local_world_visits
        ) visit ON visit.world_key = w.world_key
        JOIN play_sessions s ON s.id = visit.session_id
        JOIN session_players sp ON sp.session_id = s.id
        WHERE sp.user_id = ?
        GROUP BY w.world_key ORDER BY last_seen_at DESC LIMIT ?
      `).all(entity.user_id, safeLimit);
      const avatars = this.database.prepare(`
        SELECT a.avatar_key, a.avatar_id, a.avatar_name, MAX(sa.seen_at) AS last_seen_at,
               COUNT(*) AS observation_count
        FROM local_avatars a
        JOIN session_avatars sa ON sa.avatar_key = a.avatar_key
        WHERE sa.user_id = ?
        GROUP BY a.avatar_key
        ORDER BY last_seen_at DESC LIMIT ?
      `).all(entity.user_id, safeLimit);
      return { kind, entity, sessions, names, events, worlds, avatars };
    }
    if (kind === "world") {
      const entity = this.database.prepare(`
        SELECT w.world_key, w.world_id, w.world_name, w.first_seen_at, w.last_seen_at,
               COALESCE(pref.favorite, 0) AS favorite, COALESCE(pref.note, '') AS note,
               COUNT(DISTINCT visit.session_id) AS session_count
        FROM local_worlds w
        LEFT JOIN (
          SELECT session_id, world_key FROM session_worlds
          UNION
          SELECT session_id, world_key FROM local_world_visits
        ) visit ON visit.world_key = w.world_key
        LEFT JOIN local_world_preferences pref ON pref.world_key = w.world_key
        WHERE w.world_key = ?
        GROUP BY w.world_key
      `).get(String(key || ""));
      if (!entity) return null;
      const sessions = this.database.prepare(`
        SELECT DISTINCT s.id, s.started_at, s.ended_at, s.world_name, s.player_count, s.avatar_count, s.event_count, s.snapshot
        FROM play_sessions s
        LEFT JOIN session_worlds sw ON sw.session_id = s.id
        LEFT JOIN local_world_visits wv ON wv.session_id = s.id
        WHERE sw.world_key = ? OR wv.world_key = ?
        ORDER BY s.started_at DESC
        LIMIT ?
      `).all(entity.world_key, entity.world_key, safeLimit);
      const visits = this.database.prepare(`
        SELECT visit.seen_at, visit.session_id
        FROM local_world_visits visit
        WHERE visit.world_key = ?
        ORDER BY visit.seen_at DESC LIMIT ?
      `).all(entity.world_key, safeLimit);
      return { kind, entity, sessions, visits };
    }
    if (kind === "avatar") {
      const entity = this.database.prepare(`
        SELECT a.avatar_key, a.avatar_id, a.avatar_name, a.first_seen_at, a.last_seen_at,
               COUNT(DISTINCT sa.session_id) AS session_count,
               COUNT(sa.user_id) AS observation_count
        FROM local_avatars a
        LEFT JOIN session_avatars sa ON sa.avatar_key = a.avatar_key
        WHERE a.avatar_key = ?
        GROUP BY a.avatar_key
      `).get(String(key || ""));
      if (!entity) return null;
      const sessions = this.database.prepare(`
        SELECT DISTINCT s.id, s.started_at, s.ended_at, s.world_name, s.player_count, s.avatar_count, s.event_count, s.snapshot
        FROM play_sessions s
        JOIN session_avatars sa ON sa.session_id = s.id
        WHERE sa.avatar_key = ?
        ORDER BY s.started_at DESC
        LIMIT ?
      `).all(entity.avatar_key, safeLimit);
      const users = this.database.prepare(`
        SELECT user_id, display_name, MAX(seen_at) AS last_seen_at, COUNT(*) AS observation_count
        FROM session_avatars
        WHERE avatar_key = ? AND (user_id <> '' OR display_name <> '')
        GROUP BY user_id, display_name
        ORDER BY last_seen_at DESC
        LIMIT 40
      `).all(entity.avatar_key);
      return { kind, entity, sessions, users };
    }
    return null;
  }

  savePlayerPreference(source = {}) {
    const userId = String(source.userId || source.user_id || "").trim();
    if (!USER_ID_RE.test(userId)) throw new Error("invalid_user_id");
    const alias = String(source.alias || "").trim().slice(0, 160);
    const note = String(source.note || "").trim().slice(0, 4000);
    const status = ["none", "watch", "favorite"].includes(source.status) ? source.status : "none";
    const now = isoTimestamp();
    this.database.prepare(`
      INSERT INTO local_players (user_id, display_name, first_seen_at, last_seen_at, updated_at)
      VALUES (?, '', ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET updated_at = excluded.updated_at
    `).run(userId, now, now, now);
    this.database.prepare(`
      INSERT INTO local_player_preferences (user_id, alias, note, status, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        alias = excluded.alias, note = excluded.note, status = excluded.status, updated_at = excluded.updated_at
    `).run(userId, alias, note, status, now);
    return this.details("player", userId);
  }

  listWatchedPlayers() {
    return this.database.prepare(`
      SELECT pref.user_id, pref.alias, pref.note, pref.status, p.display_name
      FROM local_player_preferences pref
      LEFT JOIN local_players p ON p.user_id = pref.user_id
      WHERE pref.status IN ('watch', 'favorite')
      ORDER BY pref.updated_at DESC
    `).all();
  }

  recordSocialSnapshot(summary = {}) {
    const friends = Array.isArray(summary?.friends) ? summary.friends.slice(0, 2_000) : [];
    const complete = summary?.completeFriends === true;
    const occurredAt = isoTimestamp(summary?.fetchedAt || Date.now());
    const previousRows = this.database.prepare("SELECT * FROM local_social_friends").all();
    const previousById = new Map(previousRows.map((row) => [row.user_id, row]));
    const baselineReady = this.database.prepare("SELECT value FROM companion_meta WHERE key = 'social_snapshot_ready'").get()?.value === "1";
    const upsert = this.database.prepare(`
      INSERT INTO local_social_friends (
        user_id, display_name, status, status_description, location, platform, online,
        first_seen_at, last_seen_at, snapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        display_name = excluded.display_name,
        status = excluded.status,
        status_description = excluded.status_description,
        location = excluded.location,
        platform = excluded.platform,
        online = excluded.online,
        last_seen_at = excluded.last_seen_at,
        snapshot = excluded.snapshot
    `);
    const insertEventStatement = this.database.prepare(`
      INSERT INTO local_social_events (
        event_type, user_id, display_name, previous_value, current_value, occurred_at, snapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertEvent = this.getPrivacyPolicy().captureSocialEvents ? insertEventStatement : { run: () => ({ changes: 0 }) };
    const seen = new Set();
    let eventCount = 0;
    this.database.exec("BEGIN IMMEDIATE");
    try {
      for (const friend of friends) {
        const userId = String(friend?.userId || "").trim();
        if (!USER_ID_RE.test(userId)) continue;
        seen.add(userId);
        const displayName = String(friend?.displayName || userId).slice(0, 160);
        const previous = previousById.get(userId);
        const previousSnapshot = snapshotObject(previous?.snapshot);
        const reportedStatus = socialFieldKnown(friend, "status") ? String(friend.status || "").slice(0, 60) : "";
        const online = typeof friend?.online === "boolean" ? friend.online : (reportedStatus !== "offline" && reportedStatus !== "");
        const previousStatus = String(previous?.status || "");
        const status = !online && previousStatus && previousStatus !== "offline"
          ? previousStatus
          : (reportedStatus && reportedStatus !== "offline" ? reportedStatus : (previousStatus && previousStatus !== "offline" ? previousStatus : (online ? "active" : "offline")));
        const statusDescription = String(socialFieldKnown(friend, "statusDescription") ? friend.statusDescription : previous?.status_description || "").slice(0, 300);
        const location = String(socialFieldKnown(friend, "location") ? friend.location : (online ? previous?.location : "offline") || "").slice(0, 600);
        const platform = String(socialFieldKnown(friend, "platform") ? friend.platform : previous?.platform || "").slice(0, 80);
        const avatarId = String(friend?.avatarId || previousSnapshot.avatarId || "").slice(0, 120);
        const avatarImageUrl = String(friend?.avatarImageUrl || previousSnapshot.avatarImageUrl || "").slice(0, 1_000);
        const bio = String(socialFieldKnown(friend, "bio") ? friend.bio : previousSnapshot.bio || "").slice(0, 2_000);
        const known = Object.fromEntries(["status", "statusDescription", "location", "platform", "avatarId", "avatarImageUrl", "bio"]
          .map((key) => [key, previousSnapshot._known?.[key] === true || socialFieldKnown(friend, key)]));
        const safeSnapshot = snapshotJson({ ...previousSnapshot, ...friend, _known: known, displayName, status, statusDescription, location, platform, online, avatarId, avatarImageUrl, bio });
        upsert.run(userId, displayName, status, statusDescription, location, platform, online ? 1 : 0, previous?.first_seen_at || occurredAt, occurredAt, safeSnapshot);
        if (!baselineReady) continue;
        if (!previous && complete) {
          insertEvent.run("friend-added", userId, displayName, "", "friend", occurredAt, safeSnapshot);
          eventCount += 1;
          continue;
        }
        if (!previous) continue;
        const onlineChanged = Boolean(previous.online) !== online;
        if (onlineChanged) {
          insertEvent.run(online ? "online" : "offline", userId, displayName, previous.online ? "online" : "offline", online ? "online" : "offline", occurredAt, safeSnapshot);
          eventCount += 1;
        }
        if (online && previous.online && previous.location && location && previous.location !== location) {
          insertEvent.run("location", userId, displayName, previous.location, location, occurredAt, safeSnapshot);
          eventCount += 1;
        }
        if (previous.display_name !== displayName) {
          insertEvent.run("renamed", userId, displayName, previous.display_name, displayName, occurredAt, safeSnapshot);
          eventCount += 1;
        }
        for (const [eventType, before, after, reliable] of [
          ["status", previous.status, status, Boolean(previous.online) && online && socialFieldKnown(friend, "status")],
          ["status-description", previous.status_description, statusDescription, socialFieldKnown(friend, "statusDescription") && (previousSnapshot._known?.statusDescription === true || Boolean(previous.status_description))],
          ["avatar", previousSnapshot.avatarId || previousSnapshot.avatarImageUrl, avatarId || avatarImageUrl, ((previousSnapshot.avatarId && avatarId && socialFieldKnown(friend, "avatarId")) || (!previousSnapshot.avatarId && !avatarId && previousSnapshot.avatarImageUrl && avatarImageUrl && socialFieldKnown(friend, "avatarImageUrl"))) && (previousSnapshot._known?.avatarId === true || previousSnapshot._known?.avatarImageUrl === true || Boolean(previousSnapshot.avatarId || previousSnapshot.avatarImageUrl))],
          ["bio", previousSnapshot.bio, bio, socialFieldKnown(friend, "bio") && (previousSnapshot._known?.bio === true || Boolean(previousSnapshot.bio))]
        ]) {
          if (!reliable || String(before || "") === String(after || "")) continue;
          insertEvent.run(eventType, userId, displayName, String(before || "").slice(0, 2_000), String(after || "").slice(0, 2_000), occurredAt, safeSnapshot);
          eventCount += 1;
        }
      }
      if (complete) {
        const removeFriend = this.database.prepare("DELETE FROM local_social_friends WHERE user_id = ?");
        for (const previous of previousRows) {
          if (seen.has(previous.user_id)) continue;
          if (baselineReady) {
            insertEvent.run("friend-removed", previous.user_id, previous.display_name, "friend", "", occurredAt, previous.snapshot);
            eventCount += 1;
          }
          removeFriend.run(previous.user_id);
        }
        this.database.prepare(`
          INSERT INTO companion_meta (key, value) VALUES ('social_snapshot_ready', '1')
          ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `).run();
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    if (eventCount > 0) this.pruneOverflow();
    return { ok: true, complete, friends: seen.size, events: eventCount, baselineCreated: !baselineReady && complete };
  }

  recordSocialPipelineEvent(event = {}) {
    const type = String(event?.type || "");
    const content = event?.content && typeof event.content === "object" ? event.content : {};
    const user = content.user && typeof content.user === "object" ? content.user : {};
    const userId = String(content.userId || user.id || "").trim();
    if (!USER_ID_RE.test(userId)) return { ok: false, ignored: true };
    const occurredAt = isoTimestamp(event?.occurredAt);
    const previous = this.database.prepare("SELECT * FROM local_social_friends WHERE user_id = ?").get(userId);
    const previousSnapshot = snapshotObject(previous?.snapshot);
    const displayName = String(user.displayName || previous?.display_name || userId).slice(0, 160);
    const previousStatus = String(previous?.status || "");
    const reportedStatus = typeof user.status === "string" ? user.status : "";
    const online = type === "friend-offline" ? false
      : ["friend-online", "friend-location"].includes(type) ? true
        : type === "friend-active" ? false
          : typeof content.online === "boolean" ? content.online
            : typeof user.online === "boolean" ? user.online
              : previous ? Boolean(previous.online) : Boolean(reportedStatus && reportedStatus !== "offline");
    const status = String(reportedStatus && reportedStatus !== "offline"
      ? reportedStatus
      : (previousStatus && previousStatus !== "offline" ? previousStatus : (online ? "active" : "offline"))).slice(0, 60);
    const statusDescription = String(user.statusDescription ?? previous?.status_description ?? "").slice(0, 300);
    const location = String(type === "friend-offline" ? "offline" : (content.location ?? user.location ?? previous?.location ?? "")).slice(0, 600);
    const platform = String(content.platform ?? user.platform ?? user.last_platform ?? previous?.platform ?? "").slice(0, 80);
    const safeSnapshot = {
      ...previousSnapshot,
      userId,
      displayName,
      status,
      statusDescription,
      location,
      platform,
      online,
      bio: String(user.bio ?? previousSnapshot.bio ?? "").slice(0, 2_000),
      avatarId: String(user.currentAvatar || user.currentAvatarId || previousSnapshot.avatarId || "").slice(0, 120),
      avatarImageUrl: String(user.currentAvatarImageUrl || user.currentAvatarThumbnailImageUrl || previousSnapshot.avatarImageUrl || "").slice(0, 1_000),
      profileImageUrl: String(user.profilePicOverride ?? user.userIcon ?? user.currentAvatarThumbnailImageUrl ?? user.currentAvatarImageUrl ?? previousSnapshot.profileImageUrl ?? previousSnapshot.avatarImageUrl ?? "").slice(0, 1_000),
      _known: {
        ...previousSnapshot._known,
        status: previousSnapshot._known?.status === true || (typeof user.status === "string" && user.status !== "offline"),
        statusDescription: previousSnapshot._known?.statusDescription === true || typeof user.statusDescription === "string",
        bio: previousSnapshot._known?.bio === true || typeof user.bio === "string",
        avatarId: previousSnapshot._known?.avatarId === true || typeof user.currentAvatar === "string" || typeof user.currentAvatarId === "string",
        avatarImageUrl: previousSnapshot._known?.avatarImageUrl === true || typeof user.currentAvatarImageUrl === "string" || typeof user.currentAvatarThumbnailImageUrl === "string"
      }
    };
    const serialized = snapshotJson(safeSnapshot);
    const insertEventStatement = this.database.prepare(`
      INSERT INTO local_social_events (
        event_type, user_id, display_name, previous_value, current_value, occurred_at, snapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const changes = [];
    const addChange = (eventType, before, after) => {
      if (String(before ?? "") !== String(after ?? "")) changes.push([eventType, String(before ?? "").slice(0, 2_000), String(after ?? "").slice(0, 2_000)]);
    };
    if (type === "friend-add") changes.push(["friend-added", "", "friend"]);
    if (type === "friend-delete") changes.push(["friend-removed", "friend", ""]);
    if (previous) {
      const onlineChanged = Boolean(previous.online) !== online;
      addChange(online ? "online" : "offline", previous.online ? "online" : "offline", online ? "online" : "offline");
      if (online && previous.online && previous.location && location && (content.location !== undefined || user.location !== undefined)) addChange("location", previous.location, location);
      addChange("renamed", previous.display_name, displayName);
      if (previous.online && online && reportedStatus && reportedStatus !== "offline") addChange("status", previous.status, status);
      if (typeof user.statusDescription === "string" && (previousSnapshot._known?.statusDescription === true || Boolean(previous.status_description))) addChange("status-description", previous.status_description, statusDescription);
      if ((typeof user.currentAvatar === "string" || typeof user.currentAvatarId === "string" || typeof user.currentAvatarImageUrl === "string" || typeof user.currentAvatarThumbnailImageUrl === "string")
        && (previousSnapshot._known?.avatarId === true || previousSnapshot._known?.avatarImageUrl === true || Boolean(previousSnapshot.avatarId || previousSnapshot.avatarImageUrl))) {
        addChange("avatar", previousSnapshot.avatarId || previousSnapshot.avatarImageUrl, safeSnapshot.avatarId || safeSnapshot.avatarImageUrl);
      }
      if (typeof user.bio === "string" && (previousSnapshot._known?.bio === true || Boolean(previousSnapshot.bio))) addChange("bio", previousSnapshot.bio, safeSnapshot.bio);
    } else if (!["friend-add", "friend-delete"].includes(type)) {
      changes.push([online ? "online" : "offline", "", online ? "online" : "offline"]);
    }
    this.database.exec("BEGIN IMMEDIATE");
    try {
      if (type === "friend-delete") {
        this.database.prepare("DELETE FROM local_social_friends WHERE user_id = ?").run(userId);
      } else {
        this.database.prepare(`
          INSERT INTO local_social_friends (
            user_id, display_name, status, status_description, location, platform, online,
            first_seen_at, last_seen_at, snapshot
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            display_name = excluded.display_name, status = excluded.status,
            status_description = excluded.status_description, location = excluded.location,
            platform = excluded.platform, online = excluded.online,
            last_seen_at = excluded.last_seen_at, snapshot = excluded.snapshot
        `).run(userId, displayName, status, statusDescription, location, platform, online ? 1 : 0, previous?.first_seen_at || occurredAt, occurredAt, serialized);
      }
      if (this.getPrivacyPolicy().captureSocialEvents) {
        for (const [eventType, before, after] of changes) insertEventStatement.run(eventType, userId, displayName, before, after, occurredAt, serialized);
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    if (changes.length) this.pruneOverflow();
    return { ok: true, events: this.getPrivacyPolicy().captureSocialEvents ? changes.length : 0, userId };
  }

  listSocialEvents(limit = 500) {
    const safeLimit = Math.min(2_000, Math.max(1, Number(limit) || 500));
    return this.database.prepare(`
      SELECT id, event_type, user_id, display_name, previous_value, current_value, occurred_at, snapshot
      FROM local_social_events
      ORDER BY occurred_at DESC, id DESC
      LIMIT ?
    `).all(safeLimit).map((row) => ({ ...row, snapshot: snapshotObject(row.snapshot) }));
  }

  saveWorldPreference(source = {}) {
    const worldKey = String(source.worldKey || source.world_key || "").trim().slice(0, 320);
    if (!worldKey) throw new Error("invalid_world_key");
    const favorite = source.favorite ? 1 : 0;
    const note = String(source.note || "").trim().slice(0, 4000);
    const now = isoTimestamp();
    this.database.prepare(`
      INSERT INTO local_world_preferences (world_key, favorite, note, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(world_key) DO UPDATE SET
        favorite = excluded.favorite, note = excluded.note, updated_at = excluded.updated_at
    `).run(worldKey, favorite, note, now);
    return this.details("world", worldKey);
  }

  exportData(uiSettings = {}) {
    return {
      format: "vrchat-admin-tools-local-backup",
      version: 1,
      exportedAt: isoTimestamp(),
      sessions: this.database.prepare(`
        SELECT id, started_at, ended_at, world_name, player_count, avatar_count, event_count, snapshot
        FROM play_sessions ORDER BY started_at ASC
      `).all(),
      playerPreferences: this.database.prepare("SELECT * FROM local_player_preferences ORDER BY updated_at ASC").all(),
      worldPreferences: this.database.prepare("SELECT * FROM local_world_preferences ORDER BY updated_at ASC").all(),
      socialFriends: this.database.prepare("SELECT * FROM local_social_friends ORDER BY last_seen_at ASC").all(),
      socialEvents: this.database.prepare("SELECT * FROM local_social_events ORDER BY occurred_at ASC, id ASC").all(),
      retentionDays: this.getRetentionDays(),
      privacyPolicy: this.getPrivacyPolicy(),
      personalPlans: this.personalPlanBackup(),
      ...Object.fromEntries(Object.entries(EXTRA_BACKUP_TABLES).map(([key, [table]]) => [key, this.optionalRows(table)])),
      uiSettings: uiSettings && typeof uiSettings === "object" && !Array.isArray(uiSettings) ? uiSettings : {}
    };
  }

  async exportToFile(filePath, uiSettings = {}, options = {}) {
    if (!path.isAbsolute(filePath)) throw new Error("Local companion export path must be absolute");
    const output = fs.createWriteStream(filePath, { encoding: "utf8", flags: "w" });
    try {
      await this.exportToWritable(output, uiSettings, options);
      return { ok: true, filePath };
    } catch (error) {
      output.destroy();
      throw error;
    }
  }

  async exportToWritable(output, uiSettings = {}, { redacted = false, categories = ["history", "social", "preferences", "photos", "diagnostics"] } = {}) {
    const completion = new Promise((resolve, reject) => {
      output.once("finish", resolve);
      output.once("error", reject);
    });
    void completion.catch(() => {});
    const safeUiSettings = uiSettings && typeof uiSettings === "object" && !Array.isArray(uiSettings) ? uiSettings : {};
    const writeRows = async (key, query) => {
      await writeStreamChunk(output, `${JSON.stringify(key)}:[`);
      const category = EXTRA_BACKUP_TABLES[key]?.[1] || (key === "sessions" ? "history" : key.startsWith("social") ? "social" : "preferences");
      if (!categories.includes(category) || EXTRA_BACKUP_TABLES[key] && !this.hasTable(EXTRA_BACKUP_TABLES[key][0]) || redacted && key === "photoRoots") { await writeStreamChunk(output, "]"); return; }
      const statement = this.database.prepare(`${query} LIMIT ? OFFSET ?`);
      let offset = 0;
      let first = true;
      while (true) {
        const rows = statement.all(EXPORT_PAGE_SIZE, offset);
        for (const row of rows) {
          await writeStreamChunk(output, `${first ? "" : ","}${JSON.stringify(redacted ? redactedReportRow(key, row) : row)}`);
          first = false;
        }
        if (rows.length < EXPORT_PAGE_SIZE) break;
        offset += rows.length;
        await new Promise((resolve) => setImmediate(resolve));
      }
      await writeStreamChunk(output, "]");
    };

    try {
      await writeStreamChunk(output, `{${JSON.stringify("format")}:${JSON.stringify(redacted ? "vrchat-admin-tools-redacted-report" : "vrchat-admin-tools-local-backup")},${JSON.stringify("version")}:1,${JSON.stringify("exportedAt")}:${JSON.stringify(isoTimestamp())},`);
      await writeRows("sessions", "SELECT id, started_at, ended_at, world_name, player_count, avatar_count, event_count, snapshot FROM play_sessions ORDER BY started_at ASC");
      await writeStreamChunk(output, ",");
      await writeRows("playerPreferences", "SELECT * FROM local_player_preferences ORDER BY updated_at ASC");
      await writeStreamChunk(output, ",");
      await writeRows("worldPreferences", "SELECT * FROM local_world_preferences ORDER BY updated_at ASC");
      await writeStreamChunk(output, ",");
      await writeRows("socialFriends", "SELECT * FROM local_social_friends ORDER BY last_seen_at ASC");
      await writeStreamChunk(output, ",");
      await writeRows("socialEvents", "SELECT * FROM local_social_events ORDER BY occurred_at ASC, id ASC");
      const plans = categories.includes("preferences") ? this.personalPlanBackup() : [];
      await writeStreamChunk(output, `,${JSON.stringify("personalPlans")}:${JSON.stringify(redacted ? plans.map((row) => ({ kind: row.kind, updatedDay: String(row.updated_at).slice(0, 10) })) : plans)}`);
      for (const [key, [table]] of Object.entries(EXTRA_BACKUP_TABLES)) { await writeStreamChunk(output, ","); await writeRows(key, `SELECT * FROM ${table} ORDER BY rowid`); }
      await writeStreamChunk(output, `,${JSON.stringify("retentionDays")}:${this.getRetentionDays()},${JSON.stringify("privacyPolicy")}:${JSON.stringify(this.getPrivacyPolicy())},${JSON.stringify("uiSettings")}:${JSON.stringify(redacted ? {} : safeUiSettings)}}\n`);
      output.end();
      await completion;
    } catch (error) {
      output.destroy();
      throw error;
    }
  }

  importData(payload = {}) {
    if (payload?.format !== "vrchat-admin-tools-local-backup" || Number(payload?.version) !== 1) {
      throw new Error("invalid_backup_format");
    }
    const sessions = Array.isArray(payload.sessions) ? payload.sessions.slice(0, MAX_LOCAL_SESSIONS) : [];
    if (Array.isArray(payload.personalPlans)) {
      const plans = new PersonalToolsStore(this.database);
      for (const row of payload.personalPlans.slice(0, 400)) {
        if (!PERSONAL_KINDS.includes(row?.kind)) continue;
        try {
          const data = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
          if (row.kind === "rules" && data) data.enabled = false;
          plans.save(row.kind, { id: row.id, name: row.name, payload: data });
        } catch { /* Invalid plans cannot create commands or block history restoration. */ }
      }
    }
    this.ingestSessions(sessions, { explicitImport: true });
    if (Array.isArray(payload.photos)) new PhotoAtlas(this.database).restoreBackup(payload.photoRoots || [], payload.photos);
    if (Array.isArray(payload.diagnosticRuns)) new DiagnosticRecorder(this.database).restoreBackup(payload.diagnosticRuns, payload.diagnosticSamples || [], payload.diagnosticMarks || []);
    for (const row of Array.isArray(payload.playerPreferences) ? payload.playerPreferences.slice(0, 10000) : []) {
      this.savePlayerPreference(row);
    }
    for (const row of Array.isArray(payload.worldPreferences) ? payload.worldPreferences.slice(0, 10000) : []) {
      this.saveWorldPreference(row);
    }
    const insertSocialFriend = this.database.prepare(`
      INSERT OR REPLACE INTO local_social_friends (
        user_id, display_name, status, status_description, location, platform, online,
        first_seen_at, last_seen_at, snapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const row of Array.isArray(payload.socialFriends) ? payload.socialFriends.slice(0, 2000) : []) {
      if (!USER_ID_RE.test(String(row?.user_id || ""))) continue;
      insertSocialFriend.run(row.user_id, String(row.display_name || "").slice(0, 160), String(row.status || "offline").slice(0, 60), String(row.status_description || "").slice(0, 300), String(row.location || "").slice(0, 600), String(row.platform || "").slice(0, 80), row.online ? 1 : 0, isoTimestamp(row.first_seen_at), isoTimestamp(row.last_seen_at), snapshotJson(row.snapshot));
    }
    const insertSocialEvent = this.database.prepare(`
      INSERT INTO local_social_events (event_type, user_id, display_name, previous_value, current_value, occurred_at, snapshot)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const row of Array.isArray(payload.socialEvents) ? payload.socialEvents.slice(-20000) : []) {
      if (!USER_ID_RE.test(String(row?.user_id || ""))) continue;
      insertSocialEvent.run(String(row.event_type || "").slice(0, 60), row.user_id, String(row.display_name || "").slice(0, 160), String(row.previous_value || "").slice(0, 1000), String(row.current_value || "").slice(0, 1000), isoTimestamp(row.occurred_at), snapshotJson(row.snapshot));
    }
    if (Object.hasOwn(payload, "retentionDays")) this.setRetentionDays(payload.retentionDays);
    if (payload.privacyPolicy) this.setPrivacyPolicy(payload.privacyPolicy, { prune: false });
    return {
      ok: true,
      importedSessions: sessions.length,
      uiSettings: payload.uiSettings && typeof payload.uiSettings === "object" ? payload.uiSettings : {}
    };
  }

  getRetentionDays() {
    const row = this.database.prepare("SELECT value FROM companion_meta WHERE key = 'retention_days'").get();
    const value = Number(row?.value);
    return [0, 30, 90, 180, 365].includes(value) ? value : 0;
  }

  setRetentionDays(value) {
    const retentionDays = [0, 30, 90, 180, 365].includes(Number(value)) ? Number(value) : 0;
    this.database.prepare(`
      INSERT INTO companion_meta (key, value) VALUES ('retention_days', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(String(retentionDays));
    this.setPrivacyPolicy({ ...this.getPrivacyPolicy(), historyDays: retentionDays, socialDays: retentionDays }, { prune: false });
    const removed = this.prune(retentionDays);
    return { ok: true, retentionDays, removed };
  }

  prune(retentionDays = this.getRetentionDays()) {
    const policy = this.getPrivacyPolicy();
    if (arguments.length > 0) { policy.historyDays = Number(retentionDays) || 0; policy.socialDays = Number(retentionDays) || 0; }
    let removed = this.pruneOverflow();
    if (policy.historyDays) {
      const cutoff = new Date(Date.now() - policy.historyDays * 86_400_000).toISOString();
      removed += Number(this.database.prepare("DELETE FROM play_sessions WHERE started_at < ?").run(cutoff).changes) || 0;
    }
    if (policy.socialDays) {
      const cutoff = new Date(Date.now() - policy.socialDays * 86_400_000).toISOString();
      removed += Number(this.database.prepare("DELETE FROM local_social_events WHERE occurred_at < ?").run(cutoff).changes) || 0;
    }
    if (policy.preferencesDays) {
      const cutoff = new Date(Date.now() - policy.preferencesDays * 86_400_000).toISOString();
      for (const table of ["local_player_preferences", "local_world_preferences"]) removed += Number(this.database.prepare(`DELETE FROM ${table} WHERE updated_at < ?`).run(cutoff).changes) || 0;
      if (this.hasTable("personal_items")) removed += Number(this.database.prepare("DELETE FROM personal_items WHERE updated_at < ?").run(cutoff).changes) || 0;
    }
    if (policy.photosDays && this.hasTable("photo_items")) removed += Number(this.database.prepare("DELETE FROM photo_items WHERE captured_at < ?").run(new Date(Date.now() - policy.photosDays * 86400000).toISOString()).changes) || 0;
    if (policy.diagnosticsDays && this.hasTable("diagnostic_runs")) {
      const cutoff = new Date(Date.now() - policy.diagnosticsDays * 86400000).toISOString();
      for (const table of ["diagnostic_samples", "diagnostic_marks"]) this.database.prepare(`DELETE FROM ${table} WHERE run_id IN (SELECT id FROM diagnostic_runs WHERE started_at < ? AND ended_at IS NOT NULL)`).run(cutoff);
      removed += Number(this.database.prepare("DELETE FROM diagnostic_runs WHERE started_at < ? AND ended_at IS NOT NULL").run(cutoff).changes) || 0;
    }
    this.database.exec(`
      DELETE FROM local_players
      WHERE NOT EXISTS (SELECT 1 FROM session_players WHERE session_players.user_id = local_players.user_id)
        AND NOT EXISTS (SELECT 1 FROM local_player_events WHERE local_player_events.user_id = local_players.user_id)
        AND NOT EXISTS (SELECT 1 FROM local_player_preferences WHERE local_player_preferences.user_id = local_players.user_id);
      DELETE FROM local_worlds
      WHERE NOT EXISTS (SELECT 1 FROM session_worlds WHERE session_worlds.world_key = local_worlds.world_key)
        AND NOT EXISTS (SELECT 1 FROM local_world_visits WHERE local_world_visits.world_key = local_worlds.world_key)
        AND NOT EXISTS (SELECT 1 FROM local_world_preferences WHERE local_world_preferences.world_key = local_worlds.world_key);
      DELETE FROM local_avatars
      WHERE NOT EXISTS (SELECT 1 FROM session_avatars WHERE session_avatars.avatar_key = local_avatars.avatar_key);
    `);
    return removed;
  }

  storageStats() {
    const count = (table) => Number(this.database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count) || 0;
    const fileBytes = [this.filePath, `${this.filePath}-wal`, `${this.filePath}-shm`].reduce((total, filePath) => {
      try {
        return total + fs.statSync(filePath).size;
      } catch {
        return total;
      }
    }, 0);
    return {
      sessions: count("play_sessions"),
      players: count("local_players"),
      worlds: count("local_worlds"),
      avatars: count("local_avatars"),
      socialFriends: count("local_social_friends"),
      socialEvents: count("local_social_events"),
      playerPreferences: count("local_player_preferences"),
      worldPreferences: count("local_world_preferences"),
      personalPlans: this.hasTable("personal_items") ? count("personal_items") : 0,
      photos: this.hasTable("photo_items") ? count("photo_items") : 0,
      diagnostics: this.hasTable("diagnostic_runs") ? count("diagnostic_runs") : 0,
      fileBytes,
      retentionDays: this.getRetentionDays()
    };
  }

  getPrivacyPolicy() {
    if (!this.privacyPolicyCache) {
      const stored = this.database.prepare("SELECT value FROM companion_meta WHERE key = 'privacy_policy'").get()?.value;
      let value = {};
      try { value = stored ? JSON.parse(stored) : {}; } catch { value = { captureHistory: false, captureSocialEvents: false, serverArchive: false }; }
      this.privacyPolicyCache = normalizePrivacyPolicy(value, this.getRetentionDays());
    }
    return { ...this.privacyPolicyCache };
  }

  personalPlanBackup() {
    if (!this.database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='personal_items'").get()) return [];
    return this.database.prepare("SELECT * FROM personal_items ORDER BY updated_at LIMIT 400").all();
  }

  hasTable(table) { return Boolean(this.database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table)); }
  optionalRows(table) { return this.hasTable(table) ? this.database.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all() : []; }

  setPrivacyPolicy(value, { prune = true } = {}) {
    const next = normalizePrivacyPolicy({ ...this.getPrivacyPolicy(), ...value }, this.getRetentionDays());
    this.database.prepare("INSERT INTO companion_meta (key,value) VALUES ('privacy_policy',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(next));
    this.privacyPolicyCache = next;
    return { policy: { ...next }, removed: prune ? this.prune() : 0 };
  }

  previewPrivacyChange({ category, policy } = {}) {
    if (category && !["history", "social", "preferences", "photos", "diagnostics", "all"].includes(category)) throw new Error("invalid_cleanup_category");
    const current = this.storageStats();
    const next = policy ? normalizePrivacyPolicy(policy, this.getRetentionDays()) : this.getPrivacyPolicy();
    const old = (table, field, days) => days ? Number(this.database.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${field} < ?`).get(new Date(Date.now() - days * 86400000).toISOString())?.n) || 0 : 0;
    return {
      category: category || "policy", current, policy: next,
      affected: category ? {
        sessions: ["history", "all"].includes(category) ? current.sessions : 0,
        friendEvents: ["social", "all"].includes(category) ? current.socialEvents : 0,
        friendCache: ["social", "all"].includes(category) ? current.socialFriends : 0,
        notes: ["preferences", "all"].includes(category) ? current.playerPreferences + current.worldPreferences : 0,
        plans: ["preferences", "all"].includes(category) ? current.personalPlans : 0,
        photos: ["photos", "all"].includes(category) ? current.photos : 0,
        diagnostics: ["diagnostics", "all"].includes(category) ? current.diagnostics : 0
      } : {
        sessions: old("play_sessions", "started_at", next.historyDays), friendEvents: old("local_social_events", "occurred_at", next.socialDays), friendCache: 0,
        notes: old("local_player_preferences", "updated_at", next.preferencesDays) + old("local_world_preferences", "updated_at", next.preferencesDays),
        plans: this.hasTable("personal_items") ? old("personal_items", "updated_at", next.preferencesDays) : 0,
        photos: this.hasTable("photo_items") ? old("photo_items", "captured_at", next.photosDays) : 0,
        diagnostics: this.hasTable("diagnostic_runs") ? old("diagnostic_runs", "started_at", next.diagnosticsDays) : 0
      }
    };
  }

  clearCategory(category) {
    const safeCategory = String(category || "").trim().toLowerCase();
    if (!["history", "social", "preferences", "photos", "diagnostics", "all"].includes(safeCategory)) throw new Error("invalid_cleanup_category");
    const before = this.storageStats();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      if (safeCategory === "history" || safeCategory === "all") {
        this.database.exec(`
          DELETE FROM play_sessions;
          DELETE FROM local_avatars;
          DELETE FROM local_players
          WHERE NOT EXISTS (SELECT 1 FROM local_player_preferences WHERE local_player_preferences.user_id = local_players.user_id);
          DELETE FROM local_worlds
          WHERE NOT EXISTS (SELECT 1 FROM local_world_preferences WHERE local_world_preferences.world_key = local_worlds.world_key);
        `);
      }
      if (safeCategory === "social" || safeCategory === "all") {
        this.database.exec("DELETE FROM local_social_events; DELETE FROM local_social_friends;");
        this.database.prepare("DELETE FROM companion_meta WHERE key = 'social_snapshot_ready'").run();
      }
      if (safeCategory === "preferences" || safeCategory === "all") {
        this.database.exec("DELETE FROM local_player_preferences; DELETE FROM local_world_preferences;");
        if (this.hasTable("personal_items")) this.database.exec("DELETE FROM personal_items");
        if (this.hasTable("personal_apps")) this.database.exec("DELETE FROM personal_apps");
      }
      if (["photos", "all"].includes(safeCategory) && this.hasTable("photo_items")) this.database.exec("DELETE FROM photo_items; DELETE FROM photo_roots;");
      if (["diagnostics", "all"].includes(safeCategory) && this.hasTable("diagnostic_runs")) this.database.exec("DELETE FROM diagnostic_samples; DELETE FROM diagnostic_marks; DELETE FROM diagnostic_runs;");
      if (safeCategory === "all") this.database.exec("DELETE FROM local_players; DELETE FROM local_worlds;");
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return { ok: true, category: safeCategory, before, after: this.storageStats() };
  }

  applyProtectionPolicy({ salt = "", userIdHashes = [], avatarIdHashes = [] } = {}) {
    const safeSalt = String(salt || "").trim();
    if (!safeSalt) return { ok: false, removed: 0 };
    const protectedUsers = new Set((Array.isArray(userIdHashes) ? userIdHashes : []).map(String));
    const protectedAvatars = new Set((Array.isArray(avatarIdHashes) ? avatarIdHashes : []).map(String));
    const valueHash = (value) => createHash("sha256").update(`${safeSalt}:${value}`).digest("hex");
    let removed = 0;
    const userRows = this.database.prepare("SELECT DISTINCT user_id FROM session_avatars WHERE user_id <> ''").all();
    const deleteByUser = this.database.prepare("DELETE FROM session_avatars WHERE user_id = ?");
    for (const row of userRows) {
      if (protectedUsers.has(valueHash(row.user_id))) removed += Number(deleteByUser.run(row.user_id).changes) || 0;
    }
    const avatarRows = this.database.prepare("SELECT avatar_key, avatar_id FROM local_avatars WHERE avatar_id <> ''").all();
    const deleteAvatar = this.database.prepare("DELETE FROM local_avatars WHERE avatar_key = ?");
    for (const row of avatarRows) {
      if (protectedAvatars.has(valueHash(row.avatar_id))) removed += Number(deleteAvatar.run(row.avatar_key).changes) || 0;
    }
    this.database.prepare(`
      DELETE FROM local_avatars
      WHERE NOT EXISTS (
        SELECT 1 FROM session_avatars WHERE session_avatars.avatar_key = local_avatars.avatar_key
      )
    `).run();
    return { ok: true, removed };
  }

  close() {
    this.closed = true;
    if (this.backfillHandle) clearImmediate(this.backfillHandle);
    if (this.maintenanceHandle) clearImmediate(this.maintenanceHandle);
    this.backfillHandle = null;
    this.maintenanceHandle = null;
    this.database.close();
  }
}

module.exports = { LocalCompanionStore, isoTimestamp, snapshotJson, snapshotObject, normalizedWorld, normalizedAvatar };
