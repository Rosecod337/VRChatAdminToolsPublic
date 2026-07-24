"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  sanitizeGlobalAvatarNote,
  sanitizePlaySessionSnapshot
} = require("../server-template/src/index");

test("play session snapshot keeps a bounded unique player list", () => {
  const players = Array.from({ length: 300 }, (_value, index) => ({
    userId: `usr_${index}`,
    displayName: `Player ${index}`,
    status: index === 0 ? "watch" : "ok"
  }));
  players.push({ userId: "usr_0", displayName: "Duplicate", status: "ok" });

  const snapshot = sanitizePlaySessionSnapshot({ players });

  assert.equal(snapshot.players.length, 250);
  assert.equal(snapshot.players[0].displayName, "Player 0");
  assert.equal(snapshot.players[0].status, "watch");
  assert.equal(snapshot.players.filter((player) => player.userId === "usr_0").length, 1);
});

test("play session snapshot ignores entries without a user id", () => {
  const snapshot = sanitizePlaySessionSnapshot({
    players: [{ displayName: "Missing" }, null, { userId: "usr_valid", displayName: "Valid" }]
  });

  assert.deepEqual(snapshot.players.map((player) => player.userId), ["usr_valid"]);
});

test("global avatar notes require a confirmed VRChat avatar id", () => {
  const avatarId = "avtr_0cf89a3e-314b-40f2-bc97-600bbf0e0f1d";
  const note = sanitizeGlobalAvatarNote({
    avatarId,
    avatarName: "Example",
    status: "crash",
    note: "Test note"
  });

  assert.equal(note.avatarKey, `id:${avatarId}`);
  assert.equal(note.status, "crash");
  assert.throws(() => sanitizeGlobalAvatarNote({ avatarId: "name-only" }));
});
