"use strict";

const { Pool } = require("pg");

function createPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const useSsl = process.env.PGSSL === "true" || process.env.NODE_ENV === "production";
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.PG_POOL_MAX ?? 10)
  });
}

async function migrate(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY,
      license_hash TEXT UNIQUE NOT NULL,
      key_prefix TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      team_id TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      max_devices INTEGER NOT NULL DEFAULT 1 CHECK (max_devices > 0),
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS license_devices (
      id TEXT PRIMARY KEY,
      license_id TEXT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
      hwid_hash TEXT NOT NULL,
      app_version TEXT,
      first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (license_id, hwid_hash)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      license_id TEXT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
      hwid_hash TEXT NOT NULL,
      session_hash TEXT UNIQUE NOT NULL,
      app_version TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_license_devices_license_id ON license_devices(license_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_license_id ON sessions(license_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

    ALTER TABLE licenses ADD COLUMN IF NOT EXISTS team_id TEXT;
    UPDATE licenses SET team_id = id WHERE team_id IS NULL OR team_id = '';

    CREATE TABLE IF NOT EXISTS play_sessions (
      id TEXT PRIMARY KEY,
      license_id TEXT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
      hwid_hash TEXT NOT NULL,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ended_at TIMESTAMPTZ,
      world_name TEXT,
      player_count INTEGER NOT NULL DEFAULT 0,
      avatar_count INTEGER NOT NULL DEFAULT 0,
      event_count INTEGER NOT NULL DEFAULT 0,
      snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
      last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_play_sessions_license_id ON play_sessions(license_id);
    CREATE INDEX IF NOT EXISTS idx_play_sessions_started_at ON play_sessions(started_at);
    ALTER TABLE play_sessions ADD COLUMN IF NOT EXISTS snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;
    ALTER TABLE play_sessions ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ;
    UPDATE play_sessions
    SET last_updated_at = COALESCE(ended_at, started_at, NOW())
    WHERE last_updated_at IS NULL;
    ALTER TABLE play_sessions ALTER COLUMN last_updated_at SET DEFAULT NOW();
    ALTER TABLE play_sessions ALTER COLUMN last_updated_at SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_play_sessions_open_updated
      ON play_sessions(license_id, hwid_hash, last_updated_at DESC)
      WHERE ended_at IS NULL;

    CREATE TABLE IF NOT EXISTS player_notes (
      license_id TEXT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
      team_id TEXT,
      user_id TEXT NOT NULL,
      display_name TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'ok',
      note TEXT NOT NULL DEFAULT '',
      updated_by_key TEXT NOT NULL DEFAULT '',
      updated_by_label TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (license_id, user_id),
      CHECK (char_length(user_id) <= 80),
      CHECK (char_length(display_name) <= 120),
      CHECK (char_length(status) <= 40),
      CHECK (char_length(note) <= 2000),
      CHECK (char_length(updated_by_key) <= 80),
      CHECK (char_length(updated_by_label) <= 120)
    );

    ALTER TABLE player_notes ADD COLUMN IF NOT EXISTS team_id TEXT;
    ALTER TABLE player_notes ADD COLUMN IF NOT EXISTS updated_by_key TEXT NOT NULL DEFAULT '';
    ALTER TABLE player_notes ADD COLUMN IF NOT EXISTS updated_by_label TEXT NOT NULL DEFAULT '';
    UPDATE player_notes pn
    SET team_id = COALESCE(l.team_id, pn.license_id)
    FROM licenses l
    WHERE pn.license_id = l.id AND (pn.team_id IS NULL OR pn.team_id = '');
    CREATE INDEX IF NOT EXISTS idx_player_notes_license_updated ON player_notes(license_id, updated_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_player_notes_team_user ON player_notes(team_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_player_notes_team_updated ON player_notes(team_id, updated_at DESC);

    CREATE TABLE IF NOT EXISTS global_player_notes (
      source_team_id TEXT NOT NULL,
      license_id TEXT REFERENCES licenses(id) ON DELETE SET NULL,
      user_id TEXT NOT NULL,
      display_name TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'ok',
      note TEXT NOT NULL DEFAULT '',
      updated_by_key TEXT NOT NULL DEFAULT '',
      updated_by_label TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (source_team_id, user_id),
      CHECK (char_length(source_team_id) <= 80),
      CHECK (char_length(user_id) <= 80),
      CHECK (char_length(display_name) <= 120),
      CHECK (char_length(status) <= 40),
      CHECK (char_length(note) <= 2000),
      CHECK (char_length(updated_by_key) <= 80),
      CHECK (char_length(updated_by_label) <= 120)
    );

    CREATE INDEX IF NOT EXISTS idx_global_player_notes_user_updated
      ON global_player_notes(user_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_global_player_notes_updated
      ON global_player_notes(updated_at DESC);

    CREATE TABLE IF NOT EXISTS note_history (
      id BIGSERIAL PRIMARY KEY,
      entity_type TEXT NOT NULL,
      visibility TEXT NOT NULL,
      scope_id TEXT NOT NULL,
      entity_key TEXT NOT NULL,
      display_name TEXT NOT NULL DEFAULT '',
      previous_status TEXT NOT NULL DEFAULT '',
      previous_note TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'ok',
      note TEXT NOT NULL DEFAULT '',
      updated_by_key TEXT NOT NULL DEFAULT '',
      updated_by_label TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (entity_type IN ('player', 'avatar')),
      CHECK (visibility IN ('team', 'global')),
      CHECK (char_length(scope_id) <= 80),
      CHECK (char_length(entity_key) <= 220),
      CHECK (char_length(display_name) <= 240),
      CHECK (char_length(previous_status) <= 40),
      CHECK (char_length(previous_note) <= 2000),
      CHECK (char_length(status) <= 40),
      CHECK (char_length(note) <= 2000),
      CHECK (char_length(updated_by_key) <= 80),
      CHECK (char_length(updated_by_label) <= 120)
    );

    CREATE INDEX IF NOT EXISTS idx_note_history_entity
      ON note_history(entity_type, entity_key, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_note_history_scope
      ON note_history(visibility, scope_id, updated_at DESC);

    CREATE TABLE IF NOT EXISTS avatar_catalog (
      team_id TEXT NOT NULL,
      license_id TEXT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
      avatar_key TEXT NOT NULL,
      avatar_name TEXT NOT NULL,
      avatar_id TEXT NOT NULL,
      seen_count INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (team_id, avatar_key),
      CHECK (char_length(team_id) <= 80),
      CHECK (char_length(avatar_key) <= 180),
      CHECK (char_length(avatar_name) <= 240),
      CHECK (char_length(avatar_id) <= 80)
    );

    CREATE INDEX IF NOT EXISTS idx_avatar_catalog_team_updated ON avatar_catalog(team_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_avatar_catalog_avatar_id ON avatar_catalog(avatar_id);

    CREATE TABLE IF NOT EXISTS avatar_catalog_entries (
      team_id TEXT NOT NULL,
      avatar_id TEXT NOT NULL,
      avatar_name TEXT NOT NULL,
      avatar_name_key TEXT NOT NULL,
      license_id TEXT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
      seen_count INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (team_id, avatar_id),
      CHECK (char_length(team_id) <= 80),
      CHECK (char_length(avatar_id) <= 80),
      CHECK (char_length(avatar_name) <= 240),
      CHECK (char_length(avatar_name_key) <= 180)
    );

    CREATE INDEX IF NOT EXISTS idx_avatar_catalog_entries_team_updated
      ON avatar_catalog_entries(team_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_avatar_catalog_entries_team_name
      ON avatar_catalog_entries(team_id, avatar_name_key, updated_at DESC);

    INSERT INTO avatar_catalog_entries (
      team_id, avatar_id, avatar_name, avatar_name_key, license_id, seen_count, created_at, updated_at
    )
    SELECT team_id, avatar_id, avatar_name, avatar_key, license_id, seen_count, created_at, updated_at
    FROM avatar_catalog
    WHERE NOT EXISTS (SELECT 1 FROM avatar_catalog_entries)
    ON CONFLICT (team_id, avatar_id)
    DO UPDATE SET
      avatar_name = EXCLUDED.avatar_name,
      avatar_name_key = EXCLUDED.avatar_name_key,
      license_id = EXCLUDED.license_id,
      seen_count = GREATEST(avatar_catalog_entries.seen_count, EXCLUDED.seen_count),
      updated_at = GREATEST(avatar_catalog_entries.updated_at, EXCLUDED.updated_at);

    CREATE TABLE IF NOT EXISTS avatar_notes (
      team_id TEXT NOT NULL,
      license_id TEXT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
      avatar_key TEXT NOT NULL,
      avatar_name TEXT NOT NULL DEFAULT '',
      avatar_id TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'ok',
      note TEXT NOT NULL DEFAULT '',
      updated_by_key TEXT NOT NULL DEFAULT '',
      updated_by_label TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (team_id, avatar_key),
      CHECK (char_length(team_id) <= 80),
      CHECK (char_length(avatar_key) <= 220),
      CHECK (char_length(avatar_name) <= 240),
      CHECK (char_length(avatar_id) <= 80),
      CHECK (char_length(status) <= 40),
      CHECK (char_length(note) <= 2000),
      CHECK (char_length(updated_by_key) <= 80),
      CHECK (char_length(updated_by_label) <= 120)
    );

    CREATE INDEX IF NOT EXISTS idx_avatar_notes_team_updated ON avatar_notes(team_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_avatar_notes_avatar_id ON avatar_notes(avatar_id);
  `);
}

module.exports = {
  createPool,
  migrate
};
