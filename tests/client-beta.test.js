"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { importStableSettings } = require("../apps/client/src/stable-settings-import");
const betaAdminNotes = require("../apps/client-beta/renderer/admin-notes");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("beta client is a separate product that reuses the trusted core", () => {
  const packageJson = JSON.parse(read("apps/client-beta/package.json"));
  const launcher = read("apps/client-beta/src/main.js");
  const coreMain = read("apps/client/src/main.js");

  assert.equal(packageJson.build.appId, "com.vrchatadmintools.beta");
  assert.match(packageJson.productName, /Beta/u);
  assert.match(launcher, /VRCHAT_CLIENT_VARIANT = "beta"/u);
  assert.match(launcher, /client\/src\/main\.js/u);
  assert.match(coreMain, /!app\.isPackaged && developmentOverride/u);
  assert.match(coreMain, /!app\.isPackaged \|\| isBetaClient\(\)/u);
  assert.match(coreMain, /preserveStableSession = isBetaClient\(\) && settings\.importedStableSession === true/u);
});

test("beta renderer stays shell-neutral and exposes the new navigation", () => {
  const html = read("apps/client-beta/renderer/index.html");
  const script = read("apps/client-beta/renderer/app.js");
  const coreMain = read("apps/client/src/main.js");

  assert.match(html, /Отдельное приложение · Beta/u);
  assert.match(html, /тот же, что в Stable/u);
  assert.match(html, /data-author-alias-field hidden/u);
  assert.doesNotMatch(html, /name="authorAlias"[^>]*required/u);
  assert.match(html, /data-import-stable/u);
  assert.match(html, /data-view-button="session"/u);
  assert.match(html, /data-view-button="builder"/u);
  assert.match(html, /admin-notes\.js/u);
  assert.match(html, /data-admin-card/u);
  assert.match(html, /data-app-version/u);
  assert.match(html, />Запустить</u);
  assert.match(html, />Остановить</u);
  assert.doesNotMatch(html, />Start</u);
  assert.doesNotMatch(html, />Stop</u);
  assert.match(script, /window\.clientApi/u);
  assert.match(script, /author_alias_required/u);
  assert.match(script, /setAuthorAliasRequested\(true\)/u);
  assert.match(script, /api\.importStableSettings\(\)/u);
  assert.match(script, /api\.savePlayerNote\(payload\)/u);
  assert.match(script, /api\.listPlayerNoteHistory\(userId\)/u);
  assert.match(script, /adminStatusLabel\(row\.status\)/u);
  assert.match(coreMain, /appVersion: app\.getVersion\(\)/u);
  assert.doesNotMatch(script, /require\s*\(/u);
  assert.doesNotMatch(script, /ipcRenderer|electron/u);
});

test("beta player-note helpers normalize server rows and keep one saved record", () => {
  const normalized = betaAdminNotes.normalizeNote({
    user_id: " usr_demo_nova ",
    display_name: " Nova ",
    status: "watch",
    note: "  Проверить позже  ",
    updated_at: "2026-08-01T20:35:00.000Z",
    updated_by_key: "VRC-PREVIEW",
    updated_by_label: "Beta Preview"
  });

  assert.deepEqual(normalized, {
    userId: "usr_demo_nova",
    displayName: "Nova",
    status: "watch",
    note: "Проверить позже",
    updatedAt: "2026-08-01T20:35:00.000Z",
    updatedByKey: "VRC-PREVIEW",
    updatedByLabel: "Beta Preview"
  });

  const payload = betaAdminNotes.editorPayload(normalized, { status: "warned", note: "  Новая заметка  " });
  assert.deepEqual(payload, {
    userId: "usr_demo_nova",
    displayName: "Nova",
    status: "warned",
    note: "Новая заметка"
  });

  const merged = betaAdminNotes.mergeSavedNote([
    normalized,
    { userId: "usr_demo_mira", displayName: "Mira", status: "ok", note: "" }
  ], { ...payload, updated_at: "2026-08-01T21:00:00.000Z" }, normalized);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].userId, "usr_demo_nova");
  assert.equal(merged[0].status, "warned");
  assert.equal(merged[1].userId, "usr_demo_mira");
});

test("beta imports a private copy of the Stable session without changing Stable", async (context) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vrchat-beta-import-"));
  context.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));
  const stableDirectory = path.join(tempRoot, "VRChat Log Analyzer");
  const betaSettingsPath = path.join(tempRoot, "VRChat Admin Tools Beta", "settings.json");
  const stableSettingsPath = path.join(stableDirectory, "settings.json");
  const stableSettings = {
    serverUrl: "https://api.example.invalid",
    sessionToken: "",
    protected: { sessionToken: "encrypted-session" },
    license: { authorAlias: "Tester" }
  };
  fs.mkdirSync(stableDirectory, { recursive: true });
  fs.writeFileSync(stableSettingsPath, JSON.stringify(stableSettings), "utf8");

  const result = await importStableSettings({
    appDataPath: tempRoot,
    targetSettingsPath: betaSettingsPath
  });

  assert.deepEqual(result, { imported: true, reason: "stable_settings_imported" });
  assert.deepEqual(JSON.parse(fs.readFileSync(betaSettingsPath, "utf8")), {
    ...stableSettings,
    importedStableSession: true
  });
  assert.deepEqual(JSON.parse(fs.readFileSync(stableSettingsPath, "utf8")), stableSettings);

  const secondResult = await importStableSettings({
    appDataPath: tempRoot,
    targetSettingsPath: betaSettingsPath
  });
  assert.deepEqual(secondResult, { imported: false, reason: "beta_settings_exist" });
});

test("build pipeline can stage the beta installer independently", () => {
  const rootPackage = JSON.parse(read("package.json"));
  const buildScript = read("scripts/build-electron.mjs");

  assert.equal(rootPackage.scripts["client-beta:dev"], "electron apps/client-beta");
  assert.equal(rootPackage.scripts["build:client-beta"], "node scripts/build-electron.mjs client-beta");
  assert.match(buildScript, /appName === "client-beta"/u);
  assert.match(buildScript, /apps", "client-beta", "renderer/u);
  assert.doesNotMatch(buildScript, /packageJson\.dependencies\s*=\s*\{\}/u);
  assert.match(buildScript, /verifyPackagedClientDependencies/u);
});
