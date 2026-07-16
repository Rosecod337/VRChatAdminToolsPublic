"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { LogTailer, findCurrentInstanceStartIndex, findTodayLogFiles } = require("../apps/client/src/log-tailer");

test("current instance analysis prefers the last confirmed joined room", () => {
  const lines = [
    "2026.07.01 10:00:00 Debug      -  [Behaviour] Entering Room: Previous World",
    "2026.07.01 10:00:01 Debug      -  [Behaviour] Joining wrld_previous:12345",
    "2026.07.01 10:00:02 Debug      -  [Behaviour] Joining or Creating Room: Previous World",
    "2026.07.01 10:00:05 Debug      -  [Behaviour] OnPlayerJoined ExampleUser (usr_11111111-1111-4111-8111-111111111111)",
    "2026.07.01 10:05:00 Debug      -  [Behaviour] Entering Room: Wrong Loading World",
    "2026.07.01 10:05:01 Debug      -  [Behaviour] Joining wrld_wrong:99999"
  ];

  const boundary = findCurrentInstanceStartIndex(lines);

  assert.equal(boundary.type, "world-joined");
  assert.equal(boundary.startIndex, 0);
});

test("current instance analysis falls back to loading markers when no joined room exists", () => {
  const lines = [
    "2026.07.01 10:00:00 Debug      -  [Behaviour] OnPlayerJoined OldPlayer (usr_22222222-2222-4222-8222-222222222222)",
    "2026.07.01 10:05:00 Debug      -  [Behaviour] Entering Room: Loading World",
    "2026.07.01 10:05:01 Debug      -  [Behaviour] Joining wrld_loading:99999"
  ];

  const boundary = findCurrentInstanceStartIndex(lines);

  assert.equal(boundary.type, "world-joining");
  assert.equal(boundary.startIndex, 1);
});

test("current instance analysis can use VRChat account location", () => {
  const lines = [
    "2026.07.01 10:00:00 Debug      -  [Behaviour] Entering Room: Correct World",
    "2026.07.01 10:00:01 Debug      -  [Behaviour] Joining wrld_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:12345~private(usr_owner)",
    "2026.07.01 10:00:02 Debug      -  [Behaviour] Joining or Creating Room: Correct World",
    "2026.07.01 10:05:00 Debug      -  [Behaviour] Entering Room: Later Wrong World",
    "2026.07.01 10:05:01 Debug      -  [Behaviour] Joining wrld_bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb:99999"
  ];

  const boundary = findCurrentInstanceStartIndex(lines, {
    location: "wrld_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:12345~private(usr_owner)"
  });

  assert.equal(boundary.type, "vrchat-location");
  assert.equal(boundary.startIndex, 0);
});

test("today log selection ignores older VRChat logs", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vrchat-logs-"));
  const today = new Date("2026-07-09T12:00:00");
  const old = new Date("2026-07-08T12:00:00");
  const todayLog = path.join(directory, "output_log_2026-07-09_12-00-00.txt");
  const oldLog = path.join(directory, "output_log_2026-07-08_12-00-00.txt");
  const unrelated = path.join(directory, "notes.txt");

  await fs.writeFile(todayLog, "today", "utf8");
  await fs.writeFile(oldLog, "old", "utf8");
  await fs.writeFile(unrelated, "ignore", "utf8");
  await fs.utimes(todayLog, today, today);
  await fs.utimes(oldLog, old, old);

  try {
    const logs = await findTodayLogFiles(directory, 10, today);

    assert.deepEqual(logs.map((entry) => path.basename(entry.fullPath)), ["output_log_2026-07-09_12-00-00.txt"]);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("log rotation reads the beginning of the newly created VRChat log", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vrchat-rotation-"));
  const oldLog = path.join(directory, "output_log_2026-07-09_12-00-00.txt");
  const newLog = path.join(directory, "output_log_2026-07-09_12-05-00.txt");
  const oldTime = new Date("2026-07-09T12:00:00Z");
  const newTime = new Date("2026-07-09T12:05:00Z");
  const tailer = new LogTailer();
  const events = [];
  const rotations = [];
  tailer.on("event", (event) => events.push(event));
  tailer.on("rotation", (event) => rotations.push(event));

  await fs.writeFile(oldLog, "old log\n", "utf8");
  await fs.utimes(oldLog, oldTime, oldTime);

  try {
    await tailer.start({ filePath: oldLog, fromStart: false });
    await fs.writeFile(
      newLog,
      "2026.07.09 12:05:01 Debug      -  [Behaviour] OnPlayerJoined NewPlayer (usr_11111111-1111-4111-8111-111111111111)\n",
      "utf8"
    );
    await fs.utimes(newLog, newTime, newTime);

    await tailer.checkRotation();

    assert.equal(tailer.currentFile, newLog);
    assert.equal(rotations.length, 1);
    assert.equal(events.length, 1);
    assert.equal(events[0].type, "player-joined");
    assert.equal(events[0].playerName, "NewPlayer");
  } finally {
    await tailer.stop();
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("current instance analysis continues following new log lines", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vrchat-analysis-follow-"));
  const logFile = path.join(directory, "output_log_2026-07-12_12-00-00.txt");
  const tailer = new LogTailer();
  const events = [];
  tailer.on("event", (event) => events.push(event));

  await fs.writeFile(
    logFile,
    "2026.07.12 12:00:01 Debug      -  [Behaviour] OnPlayerJoined FollowPlayer (usr_33333333-3333-4333-8333-333333333333)\n",
    "utf8"
  );

  try {
    const result = await tailer.analyzeCurrentInstance(logFile, { mode: "current" });
    assert.equal(result.running, true);
    assert.equal(tailer.running, true);
    assert.equal(events.length, 1);
    assert.equal(events[0].type, "player-joined");

    await fs.appendFile(
      logFile,
      "2026.07.12 12:00:02 Debug      -  [Behaviour] OnPlayerLeft FollowPlayer (usr_33333333-3333-4333-8333-333333333333)\n",
      "utf8"
    );
    await tailer.readNewBytes();

    assert.equal(events.length, 2);
    assert.equal(events[1].type, "player-left");
  } finally {
    await tailer.stop();
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("truncated active log resets the parser and reads the replacement content", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vrchat-truncate-"));
  const logFile = path.join(directory, "output_log_2026-07-09_12-00-00.txt");
  const tailer = new LogTailer();
  const events = [];
  const rotations = [];
  tailer.on("event", (event) => events.push(event));
  tailer.on("rotation", (event) => rotations.push(event));

  await fs.writeFile(logFile, `${"old log data ".repeat(30)}\n`, "utf8");

  try {
    await tailer.start({ filePath: logFile, fromStart: true });
    await fs.writeFile(
      logFile,
      "2026.07.09 12:10:01 Debug      -  [Behaviour] OnPlayerJoined ReplacementPlayer (usr_22222222-2222-4222-8222-222222222222)\n",
      "utf8"
    );

    await tailer.readNewBytes();

    assert.equal(rotations.length, 1);
    assert.equal(rotations[0].reason, "truncated");
    assert.equal(events.length, 1);
    assert.equal(events[0].playerName, "ReplacementPlayer");
  } finally {
    await tailer.stop();
    await fs.rm(directory, { recursive: true, force: true });
  }
});
