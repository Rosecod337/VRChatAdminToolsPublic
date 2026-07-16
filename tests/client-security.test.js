"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const {
  isVrchatLogPath,
  normalizeTrustedServerUrl,
  requireAllowedExternalHttpsUrl
} = require("../apps/client/src/security");

const SERVER_URL = "https://service.example";

test("client keeps the configured trusted server", () => {
  const retired = new Set(["https://old.example"]);
  assert.equal(normalizeTrustedServerUrl(SERVER_URL, SERVER_URL, retired), SERVER_URL);
  assert.equal(normalizeTrustedServerUrl(`${SERVER_URL}/`, SERVER_URL, retired), SERVER_URL);
  assert.equal(normalizeTrustedServerUrl("https://attacker.example", SERVER_URL, retired), SERVER_URL);
  assert.equal(normalizeTrustedServerUrl("https://old.example", SERVER_URL, retired), SERVER_URL);
});

test("external links require HTTPS and an exact allowlisted host", () => {
  const hosts = new Set(["vrchat.com", "discord.gg"]);
  assert.equal(requireAllowedExternalHttpsUrl("https://vrchat.com/home", hosts).hostname, "vrchat.com");
  assert.throws(() => requireAllowedExternalHttpsUrl("http://vrchat.com/home", hosts));
  assert.throws(() => requireAllowedExternalHttpsUrl("https://vrchat.com.attacker.example/home", hosts));
  assert.throws(() => requireAllowedExternalHttpsUrl("https://attacker.example/?next=vrchat.com", hosts));
});

test("automatic log access stays inside the VRChat log directory", () => {
  const logs = path.resolve("C:/Users/example/AppData/LocalLow/VRChat/VRChat");
  assert.equal(isVrchatLogPath(path.join(logs, "output_log_2026-07-11.txt"), logs), true);
  assert.equal(isVrchatLogPath(path.join(logs, "settings.json"), logs), false);
  assert.equal(isVrchatLogPath(path.resolve(logs, "..", "output_log_stolen.txt"), logs), false);
});

test("renderer copies text through the Electron bridge", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");
  const preload = fs.readFileSync(path.join(__dirname, "../apps/client/src/preload.js"), "utf8");
  const main = fs.readFileSync(path.join(__dirname, "../apps/client/src/main.js"), "utf8");

  assert.doesNotMatch(renderer, /navigator\.clipboard/u);
  assert.match(renderer, /clientApi\.writeClipboardText/u);
  assert.match(preload, /clipboard:write-text/u);
  assert.match(main, /clipboard\.writeText/u);
});

test("renderer requests Windows notifications through the Electron bridge", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");
  const preload = fs.readFileSync(path.join(__dirname, "../apps/client/src/preload.js"), "utf8");
  const main = fs.readFileSync(path.join(__dirname, "../apps/client/src/main.js"), "utf8");

  assert.doesNotMatch(renderer, /new Notification/u);
  assert.match(renderer, /clientApi\.showNotification/u);
  assert.match(preload, /notification:show/u);
  assert.match(main, /Notification\.isSupported/u);
});

test("silent VRChat logs produce a five minute warning instead of a crash incident", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");

  assert.match(renderer, /CRASH_LOG_SILENCE_WARNING_MS = 5 \* 60 \* 1000/u);
  assert.doesNotMatch(renderer, /createCrashIncident\("Возможный фриз/u);
});
