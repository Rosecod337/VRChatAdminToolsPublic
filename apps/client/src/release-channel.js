"use strict";

const path = require("node:path");

const MODERN_USER_DATA_NAME = "VRChat Admin Tools Beta";

function isModernClientVersion(version) {
  return Number.parseInt(String(version || "").split(".", 1)[0], 10) >= 2;
}

function isPrereleaseVersion(version) {
  return /-[0-9A-Za-z]/u.test(String(version || ""));
}

function modernUserDataPath(appDataPath) {
  return path.join(appDataPath, MODERN_USER_DATA_NAME);
}

module.exports = { isModernClientVersion, isPrereleaseVersion, modernUserDataPath };
