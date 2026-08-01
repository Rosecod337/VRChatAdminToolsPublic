"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

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
  assert.match(coreMain, /!AUTO_UPDATES_ENABLED \|\| isBetaClient\(\)/u);
});

test("beta renderer stays shell-neutral and exposes the new navigation", () => {
  const html = read("apps/client-beta/renderer/index.html");
  const script = read("apps/client-beta/renderer/app.js");

  assert.match(html, /Отдельное приложение · Beta/u);
  assert.match(html, /тот же, что в Stable/u);
  assert.match(html, /Имя автора заметок/u);
  assert.doesNotMatch(html, /name="authorAlias"[^>]*required/u);
  assert.match(html, /data-view-button="session"/u);
  assert.match(html, /data-view-button="builder"/u);
  assert.match(script, /window\.clientApi/u);
  assert.match(script, /author_alias_required/u);
  assert.doesNotMatch(script, /api\.vrchatadmintools\.ru/u);
  assert.doesNotMatch(script, /require\s*\(/u);
  assert.doesNotMatch(script, /ipcRenderer|electron/u);
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
