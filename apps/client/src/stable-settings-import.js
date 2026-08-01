"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const STABLE_USER_DATA_NAMES = Object.freeze([
  "VRChat Log Analyzer",
  "vrchat-log-analyzer"
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasStoredSession(settings) {
  if (!isPlainObject(settings)) return false;
  const protectedSettings = isPlainObject(settings.protected) ? settings.protected : {};
  return Boolean(
    String(settings.sessionToken || "").trim() ||
    String(protectedSettings.sessionToken || "").trim()
  );
}

async function readSettingsFile(filePath, fsApi = fs) {
  try {
    const parsed = JSON.parse(await fsApi.readFile(filePath, "utf8"));
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function importStableSettings({
  appDataPath,
  targetSettingsPath,
  force = false,
  fsApi = fs,
  stableUserDataNames = STABLE_USER_DATA_NAMES
}) {
  if (!appDataPath || !targetSettingsPath) {
    throw new TypeError("appDataPath and targetSettingsPath are required");
  }

  if (!force && await readSettingsFile(targetSettingsPath, fsApi)) {
    return { imported: false, reason: "beta_settings_exist" };
  }

  for (const userDataName of stableUserDataNames) {
    const sourceSettingsPath = path.join(appDataPath, userDataName, "settings.json");
    if (path.resolve(sourceSettingsPath) === path.resolve(targetSettingsPath)) continue;
    const stableSettings = await readSettingsFile(sourceSettingsPath, fsApi);
    if (!hasStoredSession(stableSettings)) continue;

    await fsApi.mkdir(path.dirname(targetSettingsPath), { recursive: true });
    const betaSettings = { ...stableSettings, importedStableSession: true };
    await fsApi.writeFile(
      targetSettingsPath,
      `${JSON.stringify(betaSettings, null, 2)}\n`,
      { encoding: "utf8", mode: 0o600 }
    );
    return { imported: true, reason: "stable_settings_imported" };
  }

  return { imported: false, reason: "stable_session_not_found" };
}

module.exports = {
  STABLE_USER_DATA_NAMES,
  hasStoredSession,
  importStableSettings
};
