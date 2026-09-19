"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { LocalCompanionStore } = require("../apps/client/src/local-companion-store");

async function temporaryStore(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vrchat-companion-test-"));
  const store = new LocalCompanionStore(path.join(directory, "companion.sqlite"));
  t.after(async () => {
    store.close();
    await fs.rm(directory, { recursive: true, force: true });
  });
  return { directory, store };
}

test("session entity sync appends only new history and keeps previous observations", async (t) => {
  const { store } = await temporaryStore(t);
  const userId = "usr_11111111-1111-4111-8111-111111111111";
  const worldId = "wrld_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const avatarId = "avtr_22222222-2222-4222-8222-222222222222";
  const sessionId = store.createSession({ worldName: "First World", startedAt: "2026-08-23T10:00:00.000Z" });
  const firstSnapshot = {
    worldId,
    players: [{ userId, displayName: "Demo" }],
    playerEvents: [{ userId, displayName: "Demo", type: "player-joined", seenAt: "2026-08-23T10:00:01.000Z", worldName: "First World", worldId }],
    worldVisits: [{ worldId, worldName: "First World", seenAt: "2026-08-23T10:00:00.000Z" }],
    avatars: [{ userId, displayName: "Demo", avatarId, avatarName: "First Avatar", seenAt: "2026-08-23T10:00:02.000Z" }]
  };

  store.updateSession(sessionId, { worldName: "First World", playerCount: 1, eventCount: 1, snapshot: firstSnapshot });
  const secondSnapshot = {
    ...firstSnapshot,
    playerEvents: [
      ...firstSnapshot.playerEvents,
      { userId, displayName: "Demo", type: "player-left", seenAt: "2026-08-23T10:05:00.000Z", worldName: "First World", worldId }
    ],
    avatars: [
      ...firstSnapshot.avatars,
      { userId, displayName: "Demo", avatarName: "Second Avatar", seenAt: "2026-08-23T10:03:00.000Z" }
    ]
  };
  store.updateSession(sessionId, { playerCount: 1, eventCount: 2, snapshot: secondSnapshot });
  store.updateSession(sessionId, { playerCount: 1, eventCount: 2, snapshot: secondSnapshot });

  assert.equal(store.database.prepare("SELECT COUNT(*) AS count FROM local_player_events WHERE session_id = ?").get(sessionId).count, 2);
  assert.equal(store.database.prepare("SELECT COUNT(*) AS count FROM local_world_visits WHERE session_id = ?").get(sessionId).count, 1);
  assert.equal(store.database.prepare("SELECT COUNT(*) AS count FROM session_avatars WHERE session_id = ?").get(sessionId).count, 2);
  assert.equal(store.database.prepare("SELECT COUNT(*) AS count FROM session_players WHERE session_id = ?").get(sessionId).count, 1);
});

test("streaming export preserves the backup format without building one giant payload", async (t) => {
  const { directory, store } = await temporaryStore(t);
  const sessionId = store.createSession({ worldName: "Export World", startedAt: "2026-08-23T11:00:00.000Z" });
  store.updateSession(sessionId, { eventCount: 0, snapshot: { players: [], playerEvents: [], worldVisits: [], avatars: [] } });
  const target = path.join(directory, "backup.json");

  const result = await store.exportToFile(target, { language: "ru" });
  const backup = JSON.parse(await fs.readFile(target, "utf8"));

  assert.equal(result.ok, true);
  assert.equal(backup.format, "vrchat-admin-tools-local-backup");
  assert.equal(backup.version, 1);
  assert.equal(backup.sessions.length, 1);
  assert.equal(backup.sessions[0].id, sessionId);
  assert.deepEqual(backup.uiSettings, { language: "ru" });
});

test("quick search keeps an older local favorite when the result limit is reached", async (t) => {
  const { store } = await temporaryStore(t);
  const favorite = "usr_old_favorite";
  store.savePlayerPreference({ userId: favorite, alias: "Demo Favorite", status: "favorite" });
  store.database.prepare("UPDATE local_players SET last_seen_at=? WHERE user_id=?").run("2020-01-01T00:00:00.000Z", favorite);
  for (let index = 0; index < 5; index += 1) {
    store.savePlayerPreference({ userId: `usr_new_${index}`, alias: `Demo Recent ${index}` });
  }
  const result = store.search("Demo", 1);
  assert.equal(result.players.length, 1);
  assert.equal(result.players[0].user_id, favorite);
  assert.equal(result.players[0].status, "favorite");
});
