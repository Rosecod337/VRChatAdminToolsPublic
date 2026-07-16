"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { recentAvatarUses } = require("../apps/client/renderer/recent-avatar-uses");

test("keeps different rapid avatar switches as separate rows", () => {
  const rows = recentAvatarUses([
    {
      type: "avatar-changed",
      timestamp: "2026-07-11T19:53:10.000Z",
      avatarName: "lacey [PUBLIC]",
      avatarId: "avtr_11111111-1111-1111-1111-111111111111"
    },
    {
      type: "avatar-changed",
      timestamp: "2026-07-11T19:53:57.000Z",
      avatarName: "MAXIRUS",
      avatarId: "avtr_22222222-2222-2222-2222-222222222222"
    }
  ]);

  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => row.avatarName), ["lacey [PUBLIC]", "MAXIRUS"]);
});

test("merges the name and id events of the same avatar", () => {
  const rows = recentAvatarUses([
    {
      type: "avatar-changed",
      timestamp: "2026-07-11T19:53:10.000Z",
      avatarName: "Same Avatar"
    },
    {
      type: "avatar-data",
      timestamp: "2026-07-11T19:53:12.000Z",
      avatarId: "avtr_33333333-3333-3333-3333-333333333333"
    }
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].avatarName, "Same Avatar");
  assert.equal(rows[0].avatarId, "avtr_33333333-3333-3333-3333-333333333333");
});
