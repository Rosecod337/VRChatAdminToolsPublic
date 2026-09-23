"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { createQuestion, normalizeWorlds } = require("../apps/client-beta/renderer/mini-games");

const worlds = [
  { world_key: "one", world_name: "Ocean", last_seen_at: "2026-09-20T10:00:00Z", session_count: 1 },
  { world_key: "two", world_name: "Forest", last_seen_at: "2026-09-21T10:00:00Z", session_count: 3 },
  { world_key: "three", world_name: "City", last_seen_at: "2026-09-22T10:00:00Z", session_count: 6 },
  { world_key: "four", world_name: "Space", last_seen_at: "2026-09-23T10:00:00Z", session_count: 2 }
];

test("world games use only valid local history and produce unambiguous answers", () => {
  const normalized = normalizeWorlds([...worlds, worlds[0], {
    world_key: "bad", world_name: "", last_seen_at: "invalid", session_count: -1
  }]);
  assert.equal(normalized.length, 4);

  const recent = createQuestion(worlds, "recent", () => 0);
  assert.equal(recent.answer, "four");
  assert.equal(recent.options.length, 4);
  assert.equal(new Set(recent.options.map((option) => option.value)).size, 4);

  const visits = createQuestion([worlds[0]], "visits", () => 0);
  assert.equal(visits.answer, "1");
  assert.equal(visits.options.length, 4);
  assert.equal(new Set(visits.options.map((option) => option.value)).size, 4);
  assert.equal(createQuestion([], "recent"), null);
  assert.equal(createQuestion([], "visits"), null);
});

test("Beta keeps mini-games behind the paid-key navigation guard", () => {
  const root = path.resolve(__dirname, "..");
  const html = fs.readFileSync(path.join(root, "apps/client-beta/renderer/index.html"), "utf8");
  const script = fs.readFileSync(path.join(root, "apps/client-beta/renderer/app.js"), "utf8");
  assert.match(html, /data-view-button="games" hidden/u);
  assert.match(html, /src="mini-games\.js" defer/u);
  assert.match(script, /if \(view === "games" && !hasPaidAccess\(\)\) return;/u);
  assert.match(script, /button\.dataset\.viewButton === "games" && !hasPaidAccess\(\)/u);
  assert.match(script, /if \(!hasPaidAccess\(\) \|\| !gameState\.question \|\| gameState\.answered\) return;/u);
});
