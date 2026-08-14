"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { createParser } = require("../packages/parser");

test("parses player join and leave events", () => {
  const parser = createParser();
  const joined = parser.parseLine("2026.06.09 13:37:39 Debug      -  [Behaviour] OnPlayerJoined Rose337 (usr_3d586656-15eb-4702-9ab2-759a70b2f543)");
  const left = parser.parseLine("2026.06.09 13:37:55 Debug      -  [Behaviour] OnPlayerLeft Rose337 (usr_3d586656-15eb-4702-9ab2-759a70b2f543)");

  assert.equal(joined.type, "player-joined");
  assert.equal(joined.playerName, "Rose337");
  assert.equal(joined.userId, "usr_3d586656-15eb-4702-9ab2-759a70b2f543");
  assert.equal(left.type, "player-left");
});

test("parses the authenticated and local VRChat user from the log", () => {
  const parser = createParser();
  const authenticated = parser.parseLine("2026.08.08 21:48:10 Debug      -  User Authenticated: Rose337 (usr_3d586656-15eb-4702-9ab2-759a70b2f543)");
  const local = parser.parseLine('2026.08.08 21:49:00 Debug      -  [Behaviour] Initialized PlayerAPI "Rose337" is local');

  assert.equal(authenticated.type, "user-authenticated");
  assert.equal(authenticated.playerName, "Rose337");
  assert.equal(authenticated.userId, "usr_3d586656-15eb-4702-9ab2-759a70b2f543");
  assert.equal(local.type, "local-player");
  assert.equal(local.playerName, "Rose337");
});

test("parses avatar switch lines", () => {
  const parser = createParser();
  const event = parser.parseLine("2026.06.09 13:38:07 Debug      -  [Behaviour] Switching Kapitan Clark to avatar Pirate Clark / Captain Clark - BACKROOMS MOVIE");

  assert.equal(event.type, "avatar-changed");
  assert.equal(event.playerName, "Kapitan Clark");
  assert.equal(event.avatarName, "Pirate Clark / Captain Clark - BACKROOMS MOVIE");
  assert.equal(event.correlationConfidence, "direct");
});

test("links avatar data to one recent avatar switch", () => {
  const parser = createParser();
  parser.parseLine("2026.06.09 13:38:07 Debug      -  [Behaviour] Switching Avatar Tester to avatar Heavy Test Avatar");
  const event = parser.parseLine("2026.06.09 13:38:08 Debug      -  Loading Avatar Data:avtr_11111111-2222-3333-4444-555555555555");

  assert.equal(event.type, "avatar-data");
  assert.equal(event.playerName, "Avatar Tester");
  assert.equal(event.avatarName, "Heavy Test Avatar");
  assert.equal(event.avatarId, "avtr_11111111-2222-3333-4444-555555555555");
  assert.equal(event.correlationConfidence, "temporal");
});

test("links avatar events to the joined VRChat user id", () => {
  const parser = createParser();
  const userId = "usr_1373af91-5e80-42c5-94c1-3d6edb05f2fc";
  parser.parseLine(`2026.06.09 13:37:39 Debug      -  [Behaviour] OnPlayerJoined Protected User (${userId})`);
  const changed = parser.parseLine("2026.06.09 13:38:07 Debug      -  [Behaviour] Switching Protected User to avatar Hidden Avatar");
  const data = parser.parseLine("2026.06.09 13:38:08 Debug      -  Loading Avatar Data:avtr_11111111-2222-3333-4444-555555555555");

  assert.equal(changed.userId, userId);
  assert.equal(data.userId, userId);
});

test("resets parser state between independent log sessions", () => {
  const parser = createParser();
  parser.parseLine("2026.06.09 13:38:07 Debug      -  [Behaviour] Switching Old Player to avatar Old Avatar");
  parser.reset();
  const event = parser.parseLine("2026.06.09 13:38:08 Debug      -  Loading Avatar Data:avtr_11111111-2222-3333-4444-555555555555");

  assert.equal(event.playerName, "");
  assert.equal(event.avatarName, "");
  assert.equal(event.correlationConfidence, "unknown");
});

test("parses world events", () => {
  const parser = createParser();
  const fixture = fs.readFileSync(path.join(__dirname, "fixtures", "sample-vrchat.log"), "utf8").split(/\r?\n/u);
  const events = parser.parseLines(fixture);

  assert.equal(events.some((event) => event.type === "world-joining"), true);
  assert.equal(events.some((event) => event.type === "world-joined"), true);
});

test("parses portal create and destroy events without inventing an owner", () => {
  const parser = createParser();
  const created = parser.parseLine("2026.07.11 19:32:48 Debug      -  [PortalManager] Pending portal request fulfilled.");
  const destroyed = parser.parseLine("2026.07.11 19:33:18 Debug      -  [PortalManager] Received portal destroy event.");

  assert.equal(created.type, "portal-created");
  assert.equal(created.category, "portals");
  assert.equal(created.playerName, undefined);
  assert.equal(destroyed.type, "portal-destroyed");
  assert.equal(destroyed.category, "portals");
});

test("does not treat Portal in an avatar name as a portal event", () => {
  const parser = createParser();
  const event = parser.parseLine("2026.07.10 19:53:29 Debug      -  [Behaviour] Switching Player to avatar Cores | Portal 2");

  assert.equal(event.type, "avatar-changed");
  assert.equal(event.category, "avatars");
});
