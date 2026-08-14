"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  RuntimeConfigManager,
  canonicalJson,
  normalizeApiBaseUrl,
  normalizeRuntimeManifestPayload,
  verifyRuntimeManifest
} = require("../apps/client/src/runtime-config");

function keyPair() {
  return crypto.generateKeyPairSync("ed25519");
}

function signedManifest(privateKey, overrides = {}) {
  const payload = normalizeRuntimeManifestPayload({
    schemaVersion: 1,
    revision: 1,
    issuedAt: "2026-07-15T00:00:00.000Z",
    apiBaseUrl: "https://api.example.com",
    notice: null,
    ...overrides
  });
  return {
    ...payload,
    signature: crypto.sign(null, Buffer.from(canonicalJson(payload), "utf8"), privateKey).toString("base64")
  };
}

function responseFor(value) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => null },
    text: async () => JSON.stringify(value)
  };
}

test("runtime config accepts a valid signature and rejects tampering", () => {
  const { privateKey, publicKey } = keyPair();
  const manifest = signedManifest(privateKey, {
    notice: { id: "maintenance", level: "warning", message: "Temporary connection issues" }
  });
  const verified = verifyRuntimeManifest(manifest, publicKey);
  assert.equal(verified.apiBaseUrl, "https://api.example.com");
  assert.equal(verified.notice.level, "warning");
  assert.throws(() => verifyRuntimeManifest({ ...manifest, apiBaseUrl: "https://evil.example" }, publicKey));
});

test("runtime config only accepts public HTTPS base URLs", () => {
  assert.equal(normalizeApiBaseUrl("https://api.example.com/"), "https://api.example.com");
  assert.equal(normalizeApiBaseUrl("https://api.example.com/v1/"), "https://api.example.com/v1");
  assert.throws(() => normalizeApiBaseUrl("http://api.example.com"));
  assert.throws(() => normalizeApiBaseUrl("https://localhost"));
  assert.throws(() => normalizeApiBaseUrl("https://user:pass@api.example.com"));
});

test("runtime manager caches remote config and rejects rollback", async () => {
  const { privateKey, publicKey } = keyPair();
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vrchat-runtime-config-"));
  const cachePath = path.join(directory, "runtime-config.json");
  const revisionTwo = signedManifest(privateKey, {
    revision: 2,
    apiBaseUrl: "https://new.example.com"
  });
  const revisionOne = signedManifest(privateKey, {
    revision: 1,
    apiBaseUrl: "https://old.example.com"
  });
  let remote = revisionTwo;
  const manager = new RuntimeConfigManager({
    builtInApiBaseUrl: "https://built-in.example.com",
    publicKeyPem: publicKey,
    sources: ["https://config.example.com/runtime-config.json"],
    cachePath,
    fetchImpl: async () => responseFor(remote)
  });

  const first = await manager.refresh();
  assert.equal(first.changed, true);
  assert.equal(manager.getApiBaseUrl(), "https://new.example.com");

  const cachedManager = new RuntimeConfigManager({
    builtInApiBaseUrl: "https://built-in.example.com",
    publicKeyPem: publicKey,
    cachePath
  });
  await cachedManager.loadCache();
  assert.equal(cachedManager.getApiBaseUrl(), "https://new.example.com");

  remote = revisionOne;
  const rollback = await manager.refresh();
  assert.equal(rollback.changed, false);
  assert.equal(manager.getApiBaseUrl(), "https://new.example.com");

  await fs.rm(directory, { recursive: true, force: true });
});
