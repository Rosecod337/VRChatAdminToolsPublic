"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { Writable } = require("node:stream");
const { LocalCompanionStore } = require("../apps/client/src/local-companion-store");
const { buildSessionHealth } = require("../apps/client/src/session-health");

async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vrchat-privacy-fixture-"));
  const store = new LocalCompanionStore(path.join(directory, "history.sqlite"));
  t.after(() => store.close());
  return store;
}

test("privacy preview is read-only, independent retention does not remove newer categories", async (t) => {
  const store = await fixture(t);
  const old = new Date(Date.now() - 100 * 86400000).toISOString();
  store.ingestSessions([{ id: "old-session", started_at: old, world_name: "Private World", snapshot: "{}" }]);
  const before = store.storageStats();
  const preview = store.previewPrivacyChange({ policy: { historyDays: 30, socialDays: 0 } });
  assert.equal(preview.affected.sessions, 1);
  assert.deepEqual(store.storageStats(), before);
  store.setPrivacyPolicy({ historyDays: 30, socialDays: 0, captureHistory: false });
  assert.equal(store.storageStats().sessions, 0);
  store.createSession({ worldName: "Do not retain" });
  assert.equal(store.storageStats().sessions, 0);
  store.ingestSessions([{ id: "import", started_at: new Date().toISOString(), snapshot: "{}" }], { explicitImport: true });
  assert.equal(store.storageStats().sessions, 1);
});

test("disabled friend event history preserves the live baseline without future duplicate changes", async (t) => {
  const store = await fixture(t);
  const id = "usr_11111111-1111-4111-8111-111111111111";
  const user = { userId: id, displayName: "Private Name", online: true, status: "active", statusDescription: "original" };
  store.recordSocialSnapshot({ friends: [user], completeFriends: true });
  store.setPrivacyPolicy({ captureSocialEvents: false });
  store.recordSocialSnapshot({ friends: [{ ...user, statusDescription: "new" }], completeFriends: true });
  assert.equal(store.storageStats().socialEvents, 0);
  assert.equal(store.storageStats().socialFriends, 1);
  store.setPrivacyPolicy({ captureSocialEvents: true });
  store.recordSocialSnapshot({ friends: [{ ...user, statusDescription: "new" }], completeFriends: true });
  assert.equal(store.storageStats().socialEvents, 0);
  store.clearCategory("social");
  store.recordSocialSnapshot({ friends: [user], completeFriends: true });
  assert.equal(store.storageStats().socialEvents, 0);
});

test("shareable report never includes identities, free text, file paths, raw snapshots or restoring secrets", async (t) => {
  const store = await fixture(t);
  store.ingestSessions([{ id: "private-session-marker", started_at: new Date().toISOString(), world_name: "secret-world-marker", snapshot: JSON.stringify({ token: "secret-token-marker", players: [{ userId: "usr_sensitive-marker", displayName: "private-name-marker" }] }) }]);
  const chunks = [];
  const output = new Writable({ write: (chunk, _encoding, done) => { chunks.push(chunk); done(); } });
  await store.exportToWritable(output, { password: "secret-password-marker" }, { redacted: true });
  const content = Buffer.concat(chunks).toString("utf8");
  for (const marker of ["private-session-marker", "secret-world-marker", "secret-token-marker", "usr_sensitive-marker", "private-name-marker", "secret-password-marker"]) assert.equal(content.includes(marker), false);
  const report = JSON.parse(content);
  assert.equal(report.format, "vrchat-admin-tools-redacted-report");
  assert.equal(report.sessions.length, 1);
  assert.throws(() => store.importData(report), /invalid_backup_format/u);
});

test("health reports missing observations as unknown and omits full paths and process details", () => {
  const empty = buildSessionHealth();
  assert.equal(empty.resources.cpuPercent, null);
  assert.equal(empty.log, null);
  const health = buildSessionHealth({ tailer: { currentFile: "C:\\Users\\private-user\\output_log.txt", running: true, position: 12 }, metrics: [{ memory: { workingSetSize: 2048 }, cpu: { percentCPUUsage: 1.5 }, commandLine: "secret-argument" }] });
  assert.equal(health.fileName, "output_log.txt");
  assert.equal(health.resources.workingSetMiB, 2);
  assert.equal(JSON.stringify(health).includes("private-user"), false);
  assert.equal(JSON.stringify(health).includes("secret-argument"), false);
});
