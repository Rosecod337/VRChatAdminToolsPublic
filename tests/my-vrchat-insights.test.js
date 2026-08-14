"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildMyVrchatInsights,
  buildMyVrchatRecap,
  formatInsightDuration
} = require("../apps/client/renderer/my-vrchat-insights");

const NOW = new Date("2026-08-01T12:00:00.000Z").valueOf();

test("builds personal VRChat stats and counts a player once per session", () => {
  const insights = buildMyVrchatInsights([
    {
      started_at: "2026-07-30T10:00:00.000Z",
      ended_at: "2026-07-30T12:00:00.000Z",
      world_name: "The Great Pug",
      snapshot: {
        players: [
          { userId: "usr_a", displayName: "Alice" },
          { userId: "usr_b", displayName: "Bob" },
          { userId: "usr_a", displayName: "Alice" }
        ]
      }
    },
    {
      startedAt: "2026-07-31T09:00:00.000Z",
      endedAt: "2026-07-31T10:00:00.000Z",
      worldName: "The Great Pug",
      snapshot: JSON.stringify({
        players: [
          { userId: "usr_a", displayName: "Alice" },
          { userId: "usr_c", displayName: "Carol" }
        ]
      })
    },
    {
      started_at: "2026-05-01T09:00:00.000Z",
      ended_at: "2026-05-01T10:00:00.000Z",
      world_name: "Old World",
      snapshot: { players: [{ userId: "usr_old", displayName: "Old" }] }
    }
  ], { nowMs: NOW, days: 7 });

  assert.equal(insights.sessionCount, 2);
  assert.equal(insights.totalDurationMs, 3 * 60 * 60 * 1000);
  assert.equal(insights.totalEncounters, 4);
  assert.equal(insights.uniquePlayerCount, 3);
  assert.equal(insights.recurringPlayerCount, 1);
  assert.equal(insights.worldCount, 1);
  assert.deepEqual(insights.topPlayers[0], {
    userId: "usr_a",
    displayName: "Alice",
    sessions: 2,
    lastSeenAt: new Date("2026-07-31T10:00:00.000Z").valueOf()
  });
  assert.equal(insights.topWorlds[0].sessions, 2);
});

test("supports all saved sessions and produces a shareable recap", () => {
  const insights = buildMyVrchatInsights([{
    started_at: "2026-05-01T09:00:00.000Z",
    ended_at: "2026-05-01T10:30:00.000Z",
    world_name: "Old World",
    snapshot: { players: [{ userId: "usr_old", displayName: "Old" }] }
  }], { nowMs: NOW, days: null });

  assert.equal(insights.sessionCount, 1);
  assert.equal(formatInsightDuration(insights.totalDurationMs), "1 ч 30 мин");
  assert.match(buildMyVrchatRecap(insights, "вся история"), /Мой VRChat · вся история/u);
  assert.match(buildMyVrchatRecap(insights, "вся история"), /Old World \(1\)/u);
});

test("counts only the part of a session inside the selected period and ignores future sessions", () => {
  const day = 24 * 60 * 60 * 1000;
  const insights = buildMyVrchatInsights([
    {
      started_at: new Date(NOW - 8 * day).toISOString(),
      ended_at: new Date(NOW - 7 * day + 60 * 60 * 1000).toISOString(),
      world_name: "Boundary World",
      snapshot: { players: [{ userId: "usr_boundary", displayName: "Boundary" }] }
    },
    {
      started_at: new Date(NOW - 2 * 60 * 60 * 1000).toISOString(),
      ended_at: new Date(NOW).toISOString(),
      world_name: "Current World",
      snapshot: { players: [{ userId: "usr_current", displayName: "Current" }] }
    },
    {
      started_at: new Date(NOW + 60 * 60 * 1000).toISOString(),
      ended_at: null,
      world_name: "Future World",
      snapshot: { players: [{ userId: "usr_future", displayName: "Future" }] }
    }
  ], { nowMs: NOW, days: 7 });

  assert.equal(insights.sessionCount, 2);
  assert.equal(insights.totalDurationMs, 3 * 60 * 60 * 1000);
  assert.equal(insights.uniquePlayerCount, 2);
  assert.equal(insights.topWorlds.some((world) => world.worldName === "Future World"), false);
});
