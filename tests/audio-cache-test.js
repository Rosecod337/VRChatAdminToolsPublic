"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { createParser } = require("../packages/parser");

test("parses CacheComponents after an unpacked avatar", () => {
  const parser = createParser();
  const switching = parser.parseLine("2026.06.29 15:30:00 Debug      -  [Behaviour] Switching TestPlayer to avatar Cool Avatar by TestAuthor");
  const unpacking = parser.parseLine("2026.06.29 15:30:01 Debug      -  [AssetBundleDownloadManager] [123] Unpacking Avatar (Cool Avatar by TestAuthor)");
  const cache = parser.parseLine("2026.06.29 15:30:05 Debug      -  [Behaviour] CacheComponents: ParticleSystems 5, AudioSources 10");

  assert.equal(switching.type, "avatar-changed");
  assert.equal(unpacking, null);
  assert.equal(cache.type, "avatar-audio");
  assert.equal(cache.playerName, "TestPlayer");
  assert.equal(cache.avatarName, "Cool Avatar by TestAuthor");
  assert.equal(cache.particleSystems, 5);
  assert.equal(cache.audioSources, 10);
  assert.equal(cache.correlationConfidence, "temporal");
});

test("ignores CacheComponents with no relevant components", () => {
  const parser = createParser();
  parser.parseLine("2026.06.29 15:30:00 Debug      -  [Behaviour] Switching TestPlayer to avatar Simple Avatar");
  const cache = parser.parseLine("2026.06.29 15:30:05 Debug      -  [Behaviour] CacheComponents: ParticleSystems 0, AudioSources 0");
  assert.equal(cache, null);
});

test("parses CacheComponents for a cached avatar", () => {
  const parser = createParser();
  parser.parseLine("2026.06.29 15:30:00 Debug      -  [Behaviour] Switching TestPlayer to avatar Cached Avatar");
  const cache = parser.parseLine("2026.06.29 15:30:01 Debug      -  [Behaviour] CacheComponents: ParticleSystems 3, AudioSources 7");

  assert.equal(cache.playerName, "TestPlayer");
  assert.equal(cache.avatarName, "Cached Avatar");
  assert.equal(cache.correlationConfidence, "temporal");
});

test("links Avatar ID after CacheComponents to the same unambiguous context", () => {
  const parser = createParser();
  parser.parseLine("2026.06.29 15:31:00 Debug      -  [Behaviour] Switching ExampleUser to avatar Example Avatar");
  const cache = parser.parseLine("2026.06.29 15:31:02 Debug      -  [Behaviour] CacheComponents: ParticleSystems 1, AudioSources 3");
  const data = parser.parseLine("2026.06.29 15:31:03 Debug      -  Loading Avatar Data:avtr_11111111-1111-4111-8111-111111111111");

  assert.equal(cache.playerName, "ExampleUser");
  assert.equal(data.type, "avatar-data");
  assert.equal(data.playerName, "ExampleUser");
  assert.equal(data.avatarName, "Example Avatar");
  assert.equal(data.avatarId, "avtr_11111111-1111-4111-8111-111111111111");
});

test("keeps same-second avatar events unique", () => {
  const parser = createParser();
  parser.parseLine("2026.06.29 15:32:00 Debug      -  [Behaviour] Switching Alice to avatar Avatar A");
  const first = parser.parseLine("2026.06.29 15:32:00 Debug      -  [Behaviour] CacheComponents: ParticleSystems 1, AudioSources 1");
  parser.parseLine("2026.06.29 15:32:00 Debug      -  [Behaviour] Switching Bob to avatar Avatar B");
  const second = parser.parseLine("2026.06.29 15:32:00 Debug      -  [Behaviour] CacheComponents: ParticleSystems 1, AudioSources 1");

  assert.notEqual(first.id, second.id);
  assert.equal(first.playerName, "Alice");
  assert.equal(second.playerName, "Bob");
});

test("does not assign a shared avatar name to an arbitrary player", () => {
  const parser = createParser();
  parser.parseLine("2026.06.29 15:33:00 Debug      -  [Behaviour] Switching Alice to avatar Same Name");
  parser.parseLine("2026.06.29 15:33:01 Debug      -  [Behaviour] Switching Bob to avatar Same Name");
  const cache = parser.parseLine("2026.06.29 15:33:02 Debug      -  [Behaviour] CacheComponents: ParticleSystems 1, AudioSources 1");

  assert.equal(cache.playerName, "");
  assert.equal(cache.avatarName, "");
  assert.equal(cache.correlationConfidence, "ambiguous");
});
