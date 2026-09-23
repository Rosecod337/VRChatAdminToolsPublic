"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { isModernClientVersion, isPrereleaseVersion, modernUserDataPath } = require("../apps/client/src/release-channel");

test("the legacy client stays separate while Beta and its Stable successor share data", () => {
  assert.equal(isModernClientVersion("1.1.8"), false);
  assert.equal(isModernClientVersion("2.0.0-beta.7"), true);
  assert.equal(isModernClientVersion("2.0.0"), true);
  assert.equal(isPrereleaseVersion("2.0.0-beta.7"), true);
  assert.equal(isPrereleaseVersion("2.0.0"), false);
  assert.equal(modernUserDataPath("C:\\Users\\Example\\AppData\\Roaming"), path.join("C:\\Users\\Example\\AppData\\Roaming", "VRChat Admin Tools Beta"));
});

test("the update bridge and new Stable share an installer identity but not the legacy feed", () => {
  const readPackage = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "apps", name, "package.json"), "utf8"));
  const legacy = readPackage("client");
  const bridge = readPackage("client-beta");
  const stable = readPackage("client-stable");

  assert.equal(legacy.build.publish.repo, "VRChatAdminToolsPublic");
  assert.equal(legacy.version, "1.1.8");
  assert.notEqual(legacy.build.appId, stable.build.appId);
  assert.equal(bridge.build.appId, stable.build.appId);
  assert.equal(bridge.build.publish.repo, stable.build.publish.repo);
  assert.equal(stable.build.publish.repo, "VRChatAdminTools");
  assert.equal(isPrereleaseVersion(bridge.version), true);
  assert.equal(isPrereleaseVersion(stable.version), false);
});
