"use strict";

const crypto = require("node:crypto");
const path = require("node:path");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createPool, migrate } = require("./db");
const {
  generateLicenseKey,
  generateSessionToken,
  hashHwid,
  hashLicenseKey,
  hashSessionToken,
  normalizeLicenseKey,
  requireSecret,
  safeEqual
} = require("./crypto");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const VERSION = "1.0.0";
const SERVER_FEATURES = ["global-player-notes", "note-history", "session-snapshots"];
const SOURCE_URL = String(process.env.SOURCE_URL || "").trim();
const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS ?? 24);
const REMEMBER_SESSION_TTL_HOURS = Number(process.env.REMEMBER_SESSION_TTL_HOURS ?? 720);
const PLAY_SESSION_STALE_MINUTES = Math.min(Math.max(Number(process.env.PLAY_SESSION_STALE_MINUTES ?? 30), 5), 24 * 60);
const API_RATE_LIMIT_PER_MINUTE = Math.min(Math.max(Number(process.env.API_RATE_LIMIT_PER_MINUTE ?? 600), 60), 2_000);
const CORS_ORIGINS = String(process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const AVATAR_ID_RE = /^avtr_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

function requireAdmin(req, res, next) {
  try {
    const expected = requireSecret("ADMIN_TOKEN");
    const header = req.get("x-admin-token") || "";
    const bearer = req.get("authorization")?.replace(/^Bearer\s+/iu, "") || "";
    if (!safeEqual(header || bearer, expected)) {
      return res.status(401).json({ ok: false, error: "admin_auth_required" });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

function publicLicense(row) {
  return {
    id: row.id,
    keyPrefix: row.key_prefix,
    label: row.label,
    teamId: row.team_id || row.id,
    active: row.active,
    maxDevices: row.max_devices,
    devicesUsed: Number(row.devices_used ?? 0),
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSeenAt: row.last_seen_at,
    devices: row.devices ?? []
  };
}

function addHours(date, hours) {
  return new Date(date.valueOf() + hours * 60 * 60 * 1000);
}

function parseExpiresAt(value) {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    const error = new Error("expiresAt must be a valid date");
    error.status = 400;
    throw error;
  }
  return date.toISOString();
}

function requireText(value, field) {
  const text = String(value ?? "").trim();
  if (!text) {
    const error = new Error(`${field} is required`);
    error.status = 400;
    throw error;
  }
  return text;
}

function validateMaxDevices(value) {
  const count = Number(value ?? 1);
  if (!Number.isInteger(count) || count < 1 || count > 50) {
    const error = new Error("maxDevices must be an integer from 1 to 50");
    error.status = 400;
    throw error;
  }
  return count;
}

function normalizeTeamId(value, fallback = "") {
  const text = String(value ?? "").trim().slice(0, 80);
  return text || fallback;
}

function optionalNonNegativeInteger(value, field) {
  if (value === undefined || value === null || value === "") return null;
  const count = Number(value);
  if (!Number.isInteger(count) || count < 0 || count > 1_000_000) {
    const error = new Error(`${field} must be an integer from 0 to 1000000`);
    error.status = 400;
    throw error;
  }
  return count;
}

function boundedLimit(value, fallback, max) {
  const number = Number(value ?? fallback);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(Math.trunc(number), 1), max);
}

function optionalText(value, maxLength) {
  if (value === undefined || value === null || value === "") return null;
  return String(value).trim().slice(0, maxLength) || null;
}

function sanitizePlaySessionSnapshot(value) {
  const source = value && typeof value === "object" ? value : {};
  const seen = new Set();
  const players = [];
  for (const item of Array.isArray(source.players) ? source.players : []) {
    const userId = String(item?.userId || "").trim().slice(0, 80);
    if (!userId || seen.has(userId) || players.length >= 250) continue;
    seen.add(userId);
    players.push({
      userId,
      displayName: String(item?.displayName || "").trim().slice(0, 120),
      status: String(item?.status || "ok").trim().slice(0, 40) || "ok"
    });
  }
  return { players, capturedAt: new Date().toISOString() };
}

async function closeOpenPlaySessions(pool, licenseId, hwidHash) {
  await pool.query(
    `UPDATE play_sessions
     SET ended_at = NOW(), last_updated_at = NOW()
     WHERE license_id = $1 AND hwid_hash = $2 AND ended_at IS NULL`,
    [licenseId, hwidHash]
  );
}

async function closeStalePlaySessions(pool, licenseId, hwidHash) {
  await pool.query(
    `UPDATE play_sessions
     SET ended_at = NOW(), last_updated_at = NOW()
     WHERE license_id = $1
       AND hwid_hash = $2
       AND ended_at IS NULL
       AND last_updated_at < NOW() - ($3::int * INTERVAL '1 minute')`,
    [licenseId, hwidHash, PLAY_SESSION_STALE_MINUTES]
  );
}

async function closeAllStalePlaySessions(pool) {
  await pool.query(
    `UPDATE play_sessions
     SET ended_at = NOW(), last_updated_at = NOW()
     WHERE ended_at IS NULL
       AND last_updated_at < NOW() - ($1::int * INTERVAL '1 minute')`,
    [PLAY_SESSION_STALE_MINUTES]
  );
}

function sessionTtlHours(rememberMe) {
  return rememberMe ? REMEMBER_SESSION_TTL_HOURS : SESSION_TTL_HOURS;
}

function sanitizePlayerNote(body) {
  const userId = requireText(body.userId, "userId").slice(0, 80);
  const displayName = String(body.displayName ?? "").trim().slice(0, 120);
  const status = String(body.status ?? "ok").trim().slice(0, 40) || "ok";
  const note = String(body.note ?? "").trim().slice(0, 2000);
  return { userId, displayName, status, note };
}

function noteAuthorFromSession(session) {
  const key = String(session.keyPrefix || session.licenseId || "").trim().slice(0, 80);
  const label = String(session.label || key || "unknown").trim().slice(0, 120);
  return {
    updatedByKey: key,
    updatedByLabel: label
  };
}

async function pruneNoteHistory(pool, entityType, entityKey, visibility, scopeId) {
  await pool.query(
    `DELETE FROM note_history
     WHERE id IN (
       SELECT id FROM note_history
       WHERE entity_type = $1 AND entity_key = $2 AND visibility = $3 AND scope_id = $4
       ORDER BY updated_at DESC
       OFFSET 200
     )`,
    [entityType, entityKey, visibility, scopeId]
  );
}

function avatarNameKey(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/gu, " ")
    .replace(/\s+by\s+.+$/iu, "")
    .toLowerCase()
    .slice(0, 180);
}

function sanitizeAvatarCatalogEntry(body) {
  const avatarName = requireText(body.avatarName, "avatarName").replace(/\s+/gu, " ").slice(0, 240);
  const avatarId = requireText(body.avatarId, "avatarId").slice(0, 80);
  if (!AVATAR_ID_RE.test(avatarId)) {
    const error = new Error("avatarId must be a valid VRChat avatar id");
    error.status = 400;
    throw error;
  }
  const avatarNameKeyValue = avatarNameKey(avatarName);
  if (!avatarNameKeyValue) {
    const error = new Error("avatarName is invalid");
    error.status = 400;
    throw error;
  }
  return { avatarName, avatarId, avatarNameKey: avatarNameKeyValue };
}

function sanitizeAvatarNote(body, fallbackKey = "") {
  const avatarName = String(body.avatarName ?? "").replace(/\s+/gu, " ").trim().slice(0, 240);
  const avatarId = String(body.avatarId ?? "").trim().slice(0, 80);
  if (avatarId && !AVATAR_ID_RE.test(avatarId)) {
    const error = new Error("avatarId must be a valid VRChat avatar id");
    error.status = 400;
    throw error;
  }
  const avatarKey = avatarId
    ? `id:${avatarId}`
    : avatarName
      ? `name:${avatarNameKey(avatarName)}`
      : String(body.avatarKey || fallbackKey || "").trim().slice(0, 220);
  if (!avatarKey || (!avatarName && !avatarId)) {
    const error = new Error("avatar note requires avatarKey and avatarName or avatarId");
    error.status = 400;
    throw error;
  }
  const requestedStatus = String(body.status ?? "ok").trim().toLowerCase();
  const status = requestedStatus === "crash" ? "crash" : "ok";
  const note = String(body.note ?? "").trim().slice(0, 2000);
  return { avatarKey, avatarName, avatarId, status, note };
}

async function listLicenses(pool) {
  const result = await pool.query(`
    SELECT
      l.*,
      COUNT(d.id)::int AS devices_used,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', d.id,
            'firstSeenAt', d.first_seen_at,
            'lastSeenAt', d.last_seen_at,
            'appVersion', d.app_version
          )
          ORDER BY d.last_seen_at DESC
        ) FILTER (WHERE d.id IS NOT NULL),
        '[]'::json
      ) AS devices
    FROM licenses l
    LEFT JOIN license_devices d ON d.license_id = l.id
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `);
  return result.rows.map(publicLicense);
}

async function createLicense(pool, body) {
  const label = String(body.label ?? "").trim();
  const requestedTeamId = normalizeTeamId(body.teamId);
  const maxDevices = validateMaxDevices(body.maxDevices);
  const expiresAt = parseExpiresAt(body.expiresAt);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const licenseKey = generateLicenseKey();
    const id = crypto.randomUUID();
    const teamId = requestedTeamId || id;
    const licenseHash = hashLicenseKey(licenseKey);
    const keyPrefix = normalizeLicenseKey(licenseKey).split("-").slice(0, 3).join("-");

    try {
      const result = await pool.query(
        `INSERT INTO licenses (id, license_hash, key_prefix, label, team_id, max_devices, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *, 0::int AS devices_used, '[]'::json AS devices`,
        [id, licenseHash, keyPrefix, label, teamId, maxDevices, expiresAt]
      );
      return {
        licenseKey,
        license: publicLicense(result.rows[0])
      };
    } catch (error) {
      if (error.code !== "23505" || attempt === 4) throw error;
    }
  }

  throw new Error("failed_to_generate_unique_license");
}

async function updateLicense(pool, id, body) {
  const current = await pool.query("SELECT * FROM licenses WHERE id = $1", [id]);
  if (current.rowCount === 0) {
    const error = new Error("license_not_found");
    error.status = 404;
    throw error;
  }

  const currentLicense = current.rows[0];
  const previousTeamId = currentLicense.team_id || currentLicense.id;
  const active = body.active === undefined ? currentLicense.active : Boolean(body.active);
  const label = body.label === undefined ? currentLicense.label : String(body.label ?? "").trim();
  const teamId = body.teamId === undefined ? previousTeamId : normalizeTeamId(body.teamId, currentLicense.id);
  const maxDevices = body.maxDevices === undefined ? currentLicense.max_devices : validateMaxDevices(body.maxDevices);
  const expiresAt = body.expiresAt === undefined ? currentLicense.expires_at : parseExpiresAt(body.expiresAt);

  const result = await pool.query(
    `UPDATE licenses
     SET active = $2, label = $3, max_devices = $4, expires_at = $5, team_id = $6, updated_at = NOW()
     WHERE id = $1
     RETURNING *, (
       SELECT COUNT(*)::int FROM license_devices WHERE license_id = licenses.id
     ) AS devices_used, '[]'::json AS devices`,
    [id, active, label, maxDevices, expiresAt, teamId]
  );
  await pool.query(
    `WITH moved AS (
       DELETE FROM player_notes
       WHERE license_id = $1
       RETURNING license_id, user_id, display_name, status, note, updated_by_key, updated_by_label, updated_at
     )
     INSERT INTO player_notes (license_id, team_id, user_id, display_name, status, note, updated_by_key, updated_by_label, updated_at)
     SELECT license_id, $2, user_id, display_name, status, note, updated_by_key, updated_by_label, updated_at
     FROM moved
     ON CONFLICT (team_id, user_id)
     DO UPDATE SET
       display_name = EXCLUDED.display_name,
       status = EXCLUDED.status,
       note = EXCLUDED.note,
       updated_by_key = EXCLUDED.updated_by_key,
       updated_by_label = EXCLUDED.updated_by_label,
       updated_at = EXCLUDED.updated_at
     WHERE EXCLUDED.updated_at >= player_notes.updated_at`,
    [id, teamId]
  );
  if (previousTeamId !== teamId) {
    await pool.query(
      `WITH moved AS (
         DELETE FROM avatar_catalog_entries
         WHERE license_id = $1 AND team_id = $2
         RETURNING license_id, avatar_id, avatar_name, avatar_name_key, seen_count, created_at, updated_at
       )
       INSERT INTO avatar_catalog_entries (
         team_id, license_id, avatar_id, avatar_name, avatar_name_key, seen_count, created_at, updated_at
       )
       SELECT $3, license_id, avatar_id, avatar_name, avatar_name_key, seen_count, created_at, updated_at
       FROM moved
       ON CONFLICT (team_id, avatar_id)
       DO UPDATE SET
         license_id = EXCLUDED.license_id,
         avatar_name = EXCLUDED.avatar_name,
         avatar_name_key = EXCLUDED.avatar_name_key,
         seen_count = GREATEST(avatar_catalog_entries.seen_count, EXCLUDED.seen_count),
         updated_at = GREATEST(avatar_catalog_entries.updated_at, EXCLUDED.updated_at)`,
      [id, previousTeamId, teamId]
    );
    await pool.query(
      `WITH moved AS (
         DELETE FROM avatar_notes
         WHERE license_id = $1 AND team_id = $2
         RETURNING license_id, avatar_key, avatar_name, avatar_id, status, note, updated_by_key, updated_by_label, updated_at
       )
       INSERT INTO avatar_notes (
         team_id, license_id, avatar_key, avatar_name, avatar_id, status, note, updated_by_key, updated_by_label, updated_at
       )
       SELECT $3, license_id, avatar_key, avatar_name, avatar_id, status, note, updated_by_key, updated_by_label, updated_at
       FROM moved
       ON CONFLICT (team_id, avatar_key)
       DO UPDATE SET
         license_id = EXCLUDED.license_id,
         avatar_name = EXCLUDED.avatar_name,
         avatar_id = EXCLUDED.avatar_id,
         status = EXCLUDED.status,
         note = EXCLUDED.note,
         updated_by_key = EXCLUDED.updated_by_key,
         updated_by_label = EXCLUDED.updated_by_label,
         updated_at = EXCLUDED.updated_at
       WHERE EXCLUDED.updated_at >= avatar_notes.updated_at`,
      [id, previousTeamId, teamId]
    );
  }
  return publicLicense(result.rows[0]);
}

async function createSession(client, license, hwidHash, appVersion, options = {}) {
  const sessionToken = generateSessionToken();
  const sessionHash = hashSessionToken(sessionToken);
  const expiresAt = addHours(new Date(), sessionTtlHours(options.rememberMe));
  const sessionId = crypto.randomUUID();

  await client.query(
    `UPDATE sessions
     SET revoked_at = NOW()
     WHERE license_id = $1 AND hwid_hash = $2 AND revoked_at IS NULL`,
    [license.id, hwidHash]
  );

  await client.query(
    `INSERT INTO sessions (id, license_id, hwid_hash, session_hash, app_version, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [sessionId, license.id, hwidHash, sessionHash, appVersion, expiresAt.toISOString()]
  );

  return { sessionToken, expiresAt: expiresAt.toISOString() };
}

async function activateLicense(pool, body) {
  const licenseKey = requireText(body.licenseKey, "licenseKey");
  const hwid = requireText(body.hwid, "hwid");
  const appVersion = String(body.appVersion ?? "").slice(0, 80);
  const rememberMe = Boolean(body.rememberMe);
  const licenseHash = hashLicenseKey(licenseKey);
  const hwidHash = hashHwid(hwid);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const licenseResult = await client.query("SELECT * FROM licenses WHERE license_hash = $1 FOR UPDATE", [licenseHash]);
    const license = licenseResult.rows[0];
    if (!license) {
      await client.query("ROLLBACK");
      return { status: 401, body: { ok: false, error: "invalid_license" } };
    }
    if (!license.active) {
      await client.query("ROLLBACK");
      return { status: 403, body: { ok: false, error: "license_blocked" } };
    }
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      await client.query("ROLLBACK");
      return { status: 403, body: { ok: false, error: "license_expired" } };
    }

    const deviceResult = await client.query(
      "SELECT * FROM license_devices WHERE license_id = $1 AND hwid_hash = $2",
      [license.id, hwidHash]
    );

    if (deviceResult.rowCount === 0) {
      const countResult = await client.query("SELECT COUNT(*)::int AS count FROM license_devices WHERE license_id = $1", [license.id]);
      if (Number(countResult.rows[0].count) >= Number(license.max_devices)) {
        await client.query("ROLLBACK");
        return { status: 403, body: { ok: false, error: "device_limit_reached" } };
      }
      await client.query(
        `INSERT INTO license_devices (id, license_id, hwid_hash, app_version)
         VALUES ($1, $2, $3, $4)`,
        [crypto.randomUUID(), license.id, hwidHash, appVersion]
      );
    } else {
      await client.query(
        "UPDATE license_devices SET last_seen_at = NOW(), app_version = $3 WHERE license_id = $1 AND hwid_hash = $2",
        [license.id, hwidHash, appVersion]
      );
    }

    const session = await createSession(client, license, hwidHash, appVersion, { rememberMe });
    await client.query("UPDATE licenses SET last_seen_at = NOW() WHERE id = $1", [license.id]);
    await client.query("COMMIT");

    const devicesUsed = await pool.query("SELECT COUNT(*)::int AS count FROM license_devices WHERE license_id = $1", [license.id]);
    return {
      status: 200,
      body: {
        ok: true,
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt,
        license: {
          id: license.id,
          keyPrefix: license.key_prefix,
          label: license.label,
          teamId: license.team_id || license.id,
          expiresAt: license.expires_at,
          maxDevices: license.max_devices,
          devicesUsed: Number(devicesUsed.rows[0].count)
        }
      }
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function validateSession(pool, body) {
  const sessionToken = requireText(body.sessionToken, "sessionToken");
  const hwid = requireText(body.hwid, "hwid");
  const hwidHash = hashHwid(hwid);
  const sessionHash = hashSessionToken(sessionToken);

  const result = await pool.query(
    `SELECT s.*, l.active, l.expires_at AS license_expires_at, l.max_devices, l.key_prefix, l.label, COALESCE(l.team_id, l.id) AS team_id
     FROM sessions s
     JOIN licenses l ON l.id = s.license_id
     WHERE s.session_hash = $1 AND s.revoked_at IS NULL`,
    [sessionHash]
  );
  const session = result.rows[0];

  if (!session) return { status: 401, body: { ok: false, error: "invalid_session" } };
  if (session.hwid_hash !== hwidHash) return { status: 403, body: { ok: false, error: "hwid_mismatch" } };
  if (new Date(session.expires_at) < new Date()) return { status: 401, body: { ok: false, error: "session_expired" } };
  if (!session.active) return { status: 403, body: { ok: false, error: "license_blocked" } };
  if (session.license_expires_at && new Date(session.license_expires_at) < new Date()) {
    return { status: 403, body: { ok: false, error: "license_expired" } };
  }

  await pool.query(
    "UPDATE sessions SET last_seen_at = NOW() WHERE id = $1 AND last_seen_at < NOW() - INTERVAL '1 minute'",
    [session.id]
  );
  await pool.query(
    `UPDATE license_devices
     SET last_seen_at = NOW()
     WHERE license_id = $1
       AND hwid_hash = $2
       AND last_seen_at < NOW() - INTERVAL '1 minute'`,
    [session.license_id, hwidHash]
  );
  await pool.query(
    "UPDATE licenses SET last_seen_at = NOW() WHERE id = $1 AND (last_seen_at IS NULL OR last_seen_at < NOW() - INTERVAL '1 minute')",
    [session.license_id]
  );

  return {
    status: 200,
    session: {
      licenseId: session.license_id,
      keyPrefix: session.key_prefix,
      label: session.label,
      teamId: session.team_id,
      hwidHash
    },
    body: {
      ok: true,
      expiresAt: session.expires_at,
      license: {
        id: session.license_id,
        keyPrefix: session.key_prefix,
        label: session.label,
        teamId: session.team_id,
        expiresAt: session.license_expires_at,
        maxDevices: session.max_devices
      }
    }
  };
}

async function main() {
  requireSecret("LICENSE_PEPPER");
  requireSecret("ADMIN_TOKEN");

  const pool = createPool();
  await migrate(pool);
  closeAllStalePlaySessions(pool).catch((error) => console.error("Unable to close stale play sessions", error));
  const staleSessionTimer = setInterval(() => {
    closeAllStalePlaySessions(pool).catch((error) => console.error("Unable to close stale play sessions", error));
  }, 5 * 60 * 1000);
  staleSessionTimer.unref();

  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  // Electron does not need browser CORS. Allow web origins only when explicitly configured.
  app.use(cors({ origin: CORS_ORIGINS.length > 0 ? CORS_ORIGINS : false }));
  app.use(express.json({ limit: "128kb" }));
  app.use((_req, res, next) => {
    res.set("cache-control", "no-store");
    res.set("pragma", "no-cache");
    next();
  });
  app.use(rateLimit({
    windowMs: 60_000,
    max: API_RATE_LIMIT_PER_MINUTE,
    standardHeaders: "draft-8",
    legacyHeaders: false
  }));
  const activationLimiter = rateLimit({
    windowMs: 15 * 60_000,
    max: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { ok: false, error: "too_many_activation_attempts" }
  });
  const sessionAuthLimiter = rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { ok: false, error: "too_many_session_requests" }
  });

  app.get("/health", async (_req, res, next) => {
    try {
      await pool.query("SELECT 1");
      res.json({ ok: true, version: VERSION, features: SERVER_FEATURES, sourceUrl: SOURCE_URL || null });
    } catch (error) {
      next(error);
    }
  });

  app.get("/admin/licenses", requireAdmin, async (_req, res, next) => {
    try {
      res.json({ ok: true, licenses: await listLicenses(pool) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/admin/licenses", requireAdmin, async (req, res, next) => {
    try {
      const payload = await createLicense(pool, req.body ?? {});
      res.status(201).json({ ok: true, ...payload });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/admin/licenses/:id", requireAdmin, async (req, res, next) => {
    try {
      const license = await updateLicense(pool, req.params.id, req.body ?? {});
      res.json({ ok: true, license });
    } catch (error) {
      next(error);
    }
  });

  app.post("/admin/licenses/:id/revoke", requireAdmin, async (req, res, next) => {
    try {
      const license = await updateLicense(pool, req.params.id, { active: false });
      await pool.query(
        "UPDATE sessions SET revoked_at = NOW() WHERE license_id = $1 AND revoked_at IS NULL",
        [req.params.id]
      );
      res.json({ ok: true, license });
    } catch (error) {
      next(error);
    }
  });

  app.post("/auth/activate", activationLimiter, async (req, res, next) => {
    try {
      const result = await activateLicense(pool, req.body ?? {});
      res.status(result.status).json(result.body);
    } catch (error) {
      next(error);
    }
  });

  app.post("/auth/session", sessionAuthLimiter, async (req, res, next) => {
    try {
      const result = await validateSession(pool, req.body ?? {});
      res.status(result.status).json(result.body);
    } catch (error) {
      next(error);
    }
  });

  app.post("/auth/heartbeat", sessionAuthLimiter, async (req, res, next) => {
    try {
      const result = await validateSession(pool, req.body ?? {});
      res.status(result.status).json(result.body);
    } catch (error) {
      next(error);
    }
  });

  // в”Ђв”Ђ РСЃС‚РѕСЂРёСЏ СЃРµСЃСЃРёР№ в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

  app.post("/play-sessions/start", async (req, res, next) => {
    try {
      const sessionResult = await validateSession(pool, req.body ?? {});
      if (!sessionResult.body.ok) return res.status(sessionResult.status).json(sessionResult.body);

      const hwidHash = hashHwid(requireText(req.body.hwid, "hwid"));
      const worldName = optionalText(req.body.worldName, 200);
      const snapshot = sanitizePlaySessionSnapshot(req.body.snapshot);
      const licenseId = sessionResult.session.licenseId;

      await closeOpenPlaySessions(pool, licenseId, hwidHash);
      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO play_sessions (id, license_id, hwid_hash, world_name, snapshot)
         VALUES ($1, $2, $3, $4, $5::jsonb)`,
        [id, licenseId, hwidHash, worldName, JSON.stringify(snapshot)]
      );

      return res.json({ ok: true, playSessionId: id });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/play-sessions/:id/end", async (req, res, next) => {
    try {
      const sessionResult = await validateSession(pool, req.body ?? {});
      if (!sessionResult.body.ok) return res.status(sessionResult.status).json(sessionResult.body);

      const playerCount = optionalNonNegativeInteger(req.body.playerCount, "playerCount");
      const avatarCount = optionalNonNegativeInteger(req.body.avatarCount, "avatarCount");
      const eventCount = optionalNonNegativeInteger(req.body.eventCount, "eventCount");
      const worldName = optionalText(req.body.worldName, 200);
      const snapshot = sanitizePlaySessionSnapshot(req.body.snapshot);
      const licenseId = sessionResult.session.licenseId;
      const hwidHash = sessionResult.session.hwidHash;

      const result = await pool.query(
        `UPDATE play_sessions
          SET ended_at = NOW(),
              player_count = COALESCE($2, player_count),
              avatar_count = COALESCE($3, avatar_count),
              event_count = COALESCE($4, event_count),
              world_name = COALESCE($5, world_name),
              snapshot = $6::jsonb,
              last_updated_at = NOW()
         WHERE id = $1 AND license_id = $7 AND hwid_hash = $8`,
        [req.params.id, playerCount, avatarCount, eventCount, worldName || null, JSON.stringify(snapshot), licenseId, hwidHash]
      );
      if (result.rowCount === 0) return res.status(404).json({ ok: false, error: "play_session_not_found" });

      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/source", (_req, res) => {
    if (!/^https:\/\//iu.test(SOURCE_URL)) {
      return res.status(404).json({ ok: false, error: "source_url_not_configured" });
    }
    return res.redirect(302, SOURCE_URL);
  });

  app.post("/auth/logout", sessionAuthLimiter, async (req, res, next) => {
    try {
      const result = await validateSession(pool, req.body ?? {});
      if (!result.body.ok) return res.status(result.status).json(result.body);
      const sessionHash = hashSessionToken(requireText(req.body.sessionToken, "sessionToken"));
      await pool.query(
        "UPDATE sessions SET revoked_at = NOW() WHERE session_hash = $1 AND revoked_at IS NULL",
        [sessionHash]
      );
      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  app.get(["/play-sessions", "/player-notes", "/avatar-catalog", "/avatar-notes"], (_req, res) => {
    res.status(405).json({ ok: false, error: "use_post_with_json_body" });
  });

  app.post("/play-sessions/:id/update", async (req, res, next) => {
    try {
      const sessionResult = await validateSession(pool, req.body ?? {});
      if (!sessionResult.body.ok) return res.status(sessionResult.status).json(sessionResult.body);

      const playerCount = optionalNonNegativeInteger(req.body.playerCount, "playerCount");
      const avatarCount = optionalNonNegativeInteger(req.body.avatarCount, "avatarCount");
      const eventCount = optionalNonNegativeInteger(req.body.eventCount, "eventCount");
      const worldName = optionalText(req.body.worldName, 200);
      const snapshot = sanitizePlaySessionSnapshot(req.body.snapshot);
      const licenseId = sessionResult.session.licenseId;
      const hwidHash = sessionResult.session.hwidHash;

      const result = await pool.query(
        `UPDATE play_sessions
         SET player_count = COALESCE($2, player_count),
              avatar_count = COALESCE($3, avatar_count),
              event_count = COALESCE($4, event_count),
              world_name = COALESCE($5, world_name),
              snapshot = $6::jsonb,
              last_updated_at = NOW()
         WHERE id = $1 AND license_id = $7 AND hwid_hash = $8 AND ended_at IS NULL`,
        [req.params.id, playerCount, avatarCount, eventCount, worldName || null, JSON.stringify(snapshot), licenseId, hwidHash]
      );
      if (result.rowCount === 0) return res.status(404).json({ ok: false, error: "play_session_not_found" });

      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/play-sessions/list", async (req, res, next) => {
    try {
      const sessionResult = await validateSession(pool, req.body ?? {});
      if (!sessionResult.body.ok) return res.status(sessionResult.status).json(sessionResult.body);

      const licenseId = sessionResult.session.licenseId;
      const hwidHash = sessionResult.session.hwidHash;
      const limit = boundedLimit(req.body?.limit, 50, 200);
      await closeStalePlaySessions(pool, licenseId, hwidHash);
      const result = await pool.query(
        `SELECT id, started_at, ended_at, world_name, player_count, avatar_count, event_count, snapshot, last_updated_at
         FROM play_sessions
         WHERE license_id = $1 AND hwid_hash = $2
         ORDER BY started_at DESC
         LIMIT $3`,
        [licenseId, hwidHash, limit]
      );
      return res.json({ ok: true, sessions: result.rows });
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/player-notes/:userId", async (req, res, next) => {
    try {
      const sessionResult = await validateSession(pool, req.body ?? {});
      if (!sessionResult.body.ok) return res.status(sessionResult.status).json(sessionResult.body);

      const note = sanitizePlayerNote({ ...req.body, userId: req.params.userId });
      const author = noteAuthorFromSession(sessionResult.session);
      const result = await pool.query(
        `WITH previous AS (
           SELECT status, note FROM player_notes WHERE team_id = $2 AND user_id = $3
         ), saved AS (
           INSERT INTO player_notes (license_id, team_id, user_id, display_name, status, note, updated_by_key, updated_by_label, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           ON CONFLICT (team_id, user_id)
           DO UPDATE SET
             license_id = EXCLUDED.license_id,
             display_name = EXCLUDED.display_name,
             status = EXCLUDED.status,
             note = EXCLUDED.note,
             updated_by_key = EXCLUDED.updated_by_key,
             updated_by_label = EXCLUDED.updated_by_label,
             updated_at = NOW()
           RETURNING user_id, display_name, status, note, updated_by_key, updated_by_label, updated_at
         ), logged AS (
           INSERT INTO note_history (
             entity_type, visibility, scope_id, entity_key, display_name,
             previous_status, previous_note, status, note, updated_by_key, updated_by_label
           )
           SELECT 'player', 'team', $2, $3, $4,
             COALESCE((SELECT status FROM previous), ''), COALESCE((SELECT note FROM previous), ''),
             $5, $6, $7, $8
           FROM saved
           WHERE NOT EXISTS (SELECT 1 FROM previous)
              OR (SELECT status FROM previous) IS DISTINCT FROM $5
              OR (SELECT note FROM previous) IS DISTINCT FROM $6
         )
         SELECT * FROM saved`,
        [
          sessionResult.session.licenseId,
          sessionResult.session.teamId,
          note.userId,
          note.displayName,
          note.status,
          note.note,
          author.updatedByKey,
          author.updatedByLabel
        ]
      );

      await pruneNoteHistory(pool, "player", note.userId, "team", sessionResult.session.teamId);
      return res.json({ ok: true, note: result.rows[0] });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/player-notes/list", async (req, res, next) => {
    try {
      const sessionResult = await validateSession(pool, req.body ?? {});
      if (!sessionResult.body.ok) return res.status(sessionResult.status).json(sessionResult.body);

      const limit = boundedLimit(req.body?.limit, 1_000, 5_000);
      const result = await pool.query(
        `SELECT user_id, display_name, status, note, updated_by_key, updated_by_label, updated_at
         FROM player_notes
         WHERE team_id = $1
         ORDER BY updated_at DESC
         LIMIT $2`,
        [sessionResult.session.teamId, limit]
      );

      return res.json({ ok: true, notes: result.rows });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/global-player-notes/list", async (req, res, next) => {
    try {
      const sessionResult = await validateSession(pool, req.body ?? {});
      if (!sessionResult.body.ok) return res.status(sessionResult.status).json(sessionResult.body);

      const limit = boundedLimit(req.body?.limit, 2_000, 5_000);
      const result = await pool.query(
        `SELECT source_team_id, user_id, display_name, status, note, updated_by_key, updated_by_label, updated_at
         FROM global_player_notes
         ORDER BY updated_at DESC
         LIMIT $1`,
        [limit]
      );
      return res.json({ ok: true, notes: result.rows });
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/global-player-notes/:userId", async (req, res, next) => {
    try {
      const sessionResult = await validateSession(pool, req.body ?? {});
      if (!sessionResult.body.ok) return res.status(sessionResult.status).json(sessionResult.body);

      const note = sanitizePlayerNote({ ...req.body, userId: req.params.userId });
      const author = noteAuthorFromSession(sessionResult.session);
      const result = await pool.query(
        `WITH previous AS (
           SELECT status, note FROM global_player_notes WHERE source_team_id = $1 AND user_id = $3
         ), saved AS (
           INSERT INTO global_player_notes (
             source_team_id, license_id, user_id, display_name, status, note,
             updated_by_key, updated_by_label, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           ON CONFLICT (source_team_id, user_id)
           DO UPDATE SET
             license_id = EXCLUDED.license_id,
             display_name = EXCLUDED.display_name,
             status = EXCLUDED.status,
             note = EXCLUDED.note,
             updated_by_key = EXCLUDED.updated_by_key,
             updated_by_label = EXCLUDED.updated_by_label,
             updated_at = NOW()
           RETURNING source_team_id, user_id, display_name, status, note, updated_by_key, updated_by_label, updated_at
         ), logged AS (
           INSERT INTO note_history (
             entity_type, visibility, scope_id, entity_key, display_name,
             previous_status, previous_note, status, note, updated_by_key, updated_by_label
           )
           SELECT 'player', 'global', $1, $3, $4,
             COALESCE((SELECT status FROM previous), ''), COALESCE((SELECT note FROM previous), ''),
             $5, $6, $7, $8
           FROM saved
           WHERE NOT EXISTS (SELECT 1 FROM previous)
              OR (SELECT status FROM previous) IS DISTINCT FROM $5
              OR (SELECT note FROM previous) IS DISTINCT FROM $6
         )
         SELECT * FROM saved`,
        [
          sessionResult.session.teamId,
          sessionResult.session.licenseId,
          note.userId,
          note.displayName,
          note.status,
          note.note,
          author.updatedByKey,
          author.updatedByLabel
        ]
      );
      await pruneNoteHistory(pool, "player", note.userId, "global", sessionResult.session.teamId);
      return res.json({ ok: true, note: result.rows[0] });
    } catch (error) {
      return next(error);
    }
  });

  app.delete("/global-player-notes/:userId", async (req, res, next) => {
    try {
      const sessionResult = await validateSession(pool, req.body ?? {});
      if (!sessionResult.body.ok) return res.status(sessionResult.status).json(sessionResult.body);

      const userId = requireText(req.params.userId, "userId").slice(0, 80);
      const author = noteAuthorFromSession(sessionResult.session);
      const result = await pool.query(
        `WITH removed AS (
           DELETE FROM global_player_notes
           WHERE source_team_id = $1 AND user_id = $2
           RETURNING user_id, display_name, status, note
         ), logged AS (
           INSERT INTO note_history (
             entity_type, visibility, scope_id, entity_key, display_name,
             previous_status, previous_note, status, note, updated_by_key, updated_by_label
           )
           SELECT 'player', 'global', $1, $2, display_name, status, note, 'removed', '', $3, $4
           FROM removed
         )
         SELECT * FROM removed`,
        [sessionResult.session.teamId, userId, author.updatedByKey, author.updatedByLabel]
      );
      await pruneNoteHistory(pool, "player", userId, "global", sessionResult.session.teamId);
      return res.json({ ok: true, removed: result.rowCount > 0 });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/note-history/player/:userId/list", async (req, res, next) => {
    try {
      const sessionResult = await validateSession(pool, req.body ?? {});
      if (!sessionResult.body.ok) return res.status(sessionResult.status).json(sessionResult.body);

      const userId = requireText(req.params.userId, "userId").slice(0, 80);
      const limit = boundedLimit(req.body?.limit, 50, 200);
      const result = await pool.query(
        `SELECT id, visibility, scope_id, display_name, previous_status, previous_note,
                status, note, updated_by_key, updated_by_label, updated_at
         FROM note_history
         WHERE entity_type = 'player'
           AND entity_key = $1
           AND ((visibility = 'team' AND scope_id = $2) OR visibility = 'global')
         ORDER BY updated_at DESC
         LIMIT $3`,
        [userId, sessionResult.session.teamId, limit]
      );
      return res.json({ ok: true, history: result.rows });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/avatar-catalog/list", async (req, res, next) => {
    try {
      const sessionResult = await validateSession(pool, req.body ?? {});
      if (!sessionResult.body.ok) return res.status(sessionResult.status).json(sessionResult.body);

      const limit = boundedLimit(req.body?.limit, 5_000, 10_000);
      const result = await pool.query(
        `SELECT avatar_id, avatar_name, avatar_name_key, seen_count, updated_at
         FROM avatar_catalog_entries
         WHERE team_id = $1
         ORDER BY updated_at DESC
         LIMIT $2`,
        [sessionResult.session.teamId, limit]
      );

      return res.json({ ok: true, avatars: result.rows });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/avatar-catalog", async (req, res, next) => {
    try {
      const sessionResult = await validateSession(pool, req.body ?? {});
      if (!sessionResult.body.ok) return res.status(sessionResult.status).json(sessionResult.body);

      const avatar = sanitizeAvatarCatalogEntry(req.body ?? {});
      const result = await pool.query(
        `INSERT INTO avatar_catalog_entries (team_id, license_id, avatar_id, avatar_name, avatar_name_key, seen_count, updated_at)
          VALUES ($1, $2, $3, $4, $5, 1, NOW())
          ON CONFLICT (team_id, avatar_id)
          DO UPDATE SET
            license_id = EXCLUDED.license_id,
            avatar_name = EXCLUDED.avatar_name,
            avatar_name_key = EXCLUDED.avatar_name_key,
            seen_count = avatar_catalog_entries.seen_count + 1,
            updated_at = NOW()
          RETURNING avatar_id, avatar_name, avatar_name_key, seen_count, updated_at`,
        [
          sessionResult.session.teamId,
          sessionResult.session.licenseId,
          avatar.avatarId,
          avatar.avatarName,
          avatar.avatarNameKey
        ]
      );

      return res.json({ ok: true, avatar: result.rows[0] });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/avatar-notes/list", async (req, res, next) => {
    try {
      const sessionResult = await validateSession(pool, req.body ?? {});
      if (!sessionResult.body.ok) return res.status(sessionResult.status).json(sessionResult.body);

      const limit = boundedLimit(req.body?.limit, 5_000, 10_000);
      const result = await pool.query(
        `SELECT avatar_key, avatar_name, avatar_id, status, note, updated_by_key, updated_by_label, updated_at
         FROM avatar_notes
         WHERE team_id = $1
         ORDER BY updated_at DESC
         LIMIT $2`,
        [sessionResult.session.teamId, limit]
      );

      return res.json({ ok: true, notes: result.rows });
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/avatar-notes/:avatarKey", async (req, res, next) => {
    try {
      const sessionResult = await validateSession(pool, req.body ?? {});
      if (!sessionResult.body.ok) return res.status(sessionResult.status).json(sessionResult.body);

      const note = sanitizeAvatarNote(req.body ?? {}, req.params.avatarKey);
      const author = noteAuthorFromSession(sessionResult.session);
      const result = await pool.query(
        `INSERT INTO avatar_notes (team_id, license_id, avatar_key, avatar_name, avatar_id, status, note, updated_by_key, updated_by_label, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT (team_id, avatar_key)
         DO UPDATE SET
           license_id = EXCLUDED.license_id,
           avatar_name = EXCLUDED.avatar_name,
           avatar_id = EXCLUDED.avatar_id,
           status = EXCLUDED.status,
           note = EXCLUDED.note,
           updated_by_key = EXCLUDED.updated_by_key,
           updated_by_label = EXCLUDED.updated_by_label,
           updated_at = NOW()
         RETURNING avatar_key, avatar_name, avatar_id, status, note, updated_by_key, updated_by_label, updated_at`,
        [
          sessionResult.session.teamId,
          sessionResult.session.licenseId,
          note.avatarKey,
          note.avatarName,
          note.avatarId,
          note.status,
          note.note,
          author.updatedByKey,
          author.updatedByLabel
        ]
      );

      return res.json({ ok: true, note: result.rows[0] });
    } catch (error) {
      return next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    if (status >= 500) {
      console.error(error);
    }
    res.status(status).json({
      ok: false,
      error: status >= 500 ? "internal_error" : error.message || "request_failed"
    });
  });

  const port = Number(process.env.PORT ?? 8080);
  app.listen(port, () => {
    console.log(`VRChat Log Suite API listening on :${port}`);
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  sanitizePlaySessionSnapshot
};
