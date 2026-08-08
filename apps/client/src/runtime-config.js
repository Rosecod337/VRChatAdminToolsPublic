"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const net = require("node:net");
const path = require("node:path");

const RUNTIME_CONFIG_SCHEMA_VERSION = 1;
const MAX_CONFIG_BYTES = 32 * 1024;
const NOTICE_LEVELS = new Set(["info", "warning", "error"]);

function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

function normalizeApiBaseUrl(value) {
  const url = new URL(String(value || "").trim());
  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:"
    || url.username
    || url.password
    || url.search
    || url.hash
    || !hostname.includes(".")
    || hostname === "localhost"
    || net.isIP(hostname) !== 0
  ) {
    throw new Error("Runtime API URL must be a public HTTPS address");
  }

  const pathname = url.pathname.replace(/\/+$/u, "");
  return `${url.origin}${pathname}`;
}

function normalizeNotice(value) {
  if (value === null || value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Runtime notice must be an object or null");
  }

  const id = String(value.id || "").trim();
  const level = String(value.level || "info").trim().toLowerCase();
  const message = String(value.message || "").trim();
  if (!id || id.length > 80) throw new Error("Runtime notice id is invalid");
  if (!NOTICE_LEVELS.has(level)) throw new Error("Runtime notice level is invalid");
  if (!message || message.length > 500) throw new Error("Runtime notice message is invalid");
  return { id, level, message };
}

function normalizeRuntimeManifestPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Runtime config must be an object");
  }

  const schemaVersion = Number(value.schemaVersion);
  const revision = Number(value.revision);
  const issuedAt = String(value.issuedAt || "").trim();
  if (schemaVersion !== RUNTIME_CONFIG_SCHEMA_VERSION) {
    throw new Error("Unsupported runtime config schema");
  }
  if (!Number.isSafeInteger(revision) || revision < 1) {
    throw new Error("Runtime config revision is invalid");
  }
  if (!issuedAt || !Number.isFinite(Date.parse(issuedAt))) {
    throw new Error("Runtime config issuedAt is invalid");
  }

  return {
    schemaVersion,
    revision,
    issuedAt,
    apiBaseUrl: normalizeApiBaseUrl(value.apiBaseUrl),
    notice: normalizeNotice(value.notice)
  };
}

function verifyRuntimeManifest(value, publicKeyPem) {
  const payload = normalizeRuntimeManifestPayload(value);
  const signatureText = String(value.signature || "").trim();
  if (!/^[A-Za-z0-9+/]+={0,2}$/u.test(signatureText)) {
    throw new Error("Runtime config signature is invalid");
  }

  const signature = Buffer.from(signatureText, "base64");
  const valid = crypto.verify(
    null,
    Buffer.from(canonicalJson(payload), "utf8"),
    publicKeyPem,
    signature
  );
  if (!valid) throw new Error("Runtime config signature verification failed");
  return { ...payload, signature: signatureText };
}

async function fetchTextWithLimit(fetchImpl, source, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(source.url, {
      cache: "no-store",
      redirect: "follow",
      headers: source.headers || {},
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Runtime config HTTP ${response.status}`);
    const contentLength = Number(response.headers?.get?.("content-length") || 0);
    if (contentLength > MAX_CONFIG_BYTES) throw new Error("Runtime config is too large");
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > MAX_CONFIG_BYTES) {
      throw new Error("Runtime config is too large");
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

class RuntimeConfigManager {
  constructor(options = {}) {
    this.builtInApiBaseUrl = normalizeApiBaseUrl(options.builtInApiBaseUrl);
    this.publicKeyPem = options.publicKeyPem;
    this.sources = (options.sources || []).map((source) => (
      typeof source === "string" ? { url: source } : { ...source }
    ));
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
    this.timeoutMs = Math.max(1000, Math.min(Number(options.timeoutMs) || 5000, 15_000));
    this.cachePath = options.cachePath || null;
    this.current = {
      schemaVersion: RUNTIME_CONFIG_SCHEMA_VERSION,
      revision: 0,
      issuedAt: null,
      apiBaseUrl: this.builtInApiBaseUrl,
      notice: null,
      signature: null,
      source: "built-in"
    };
    this.refreshPromise = null;
    this.lastError = null;
  }

  setCachePath(cachePath) {
    this.cachePath = cachePath ? path.resolve(String(cachePath)) : null;
  }

  getApiBaseUrl() {
    return this.current.apiBaseUrl;
  }

  normalizeApiUrl() {
    return this.getApiBaseUrl();
  }

  getPublicState() {
    return {
      revision: this.current.revision,
      apiBaseUrl: this.current.apiBaseUrl,
      notice: this.current.notice ? { ...this.current.notice } : null,
      source: this.current.source,
      lastError: this.lastError
    };
  }

  applyVerified(manifest, source) {
    if (manifest.revision < this.current.revision) {
      throw new Error("Runtime config rollback was rejected");
    }

    const currentPayload = this.current.revision > 0
      ? canonicalJson(normalizeRuntimeManifestPayload(this.current))
      : null;
    const nextPayload = canonicalJson(normalizeRuntimeManifestPayload(manifest));
    if (manifest.revision === this.current.revision && currentPayload && currentPayload !== nextPayload) {
      throw new Error("Runtime config revision collision was rejected");
    }

    const changed = currentPayload !== nextPayload;
    this.current = { ...manifest, source };
    this.lastError = null;
    return changed;
  }

  async loadCache() {
    if (!this.cachePath) return { changed: false, state: this.getPublicState() };
    try {
      const raw = JSON.parse(await fs.readFile(this.cachePath, "utf8"));
      const manifest = verifyRuntimeManifest(raw, this.publicKeyPem);
      const changed = this.applyVerified(manifest, "cache");
      return { changed, state: this.getPublicState() };
    } catch (error) {
      if (error?.code !== "ENOENT") this.lastError = String(error?.message || error);
      return { changed: false, state: this.getPublicState() };
    }
  }

  async saveCache(manifest) {
    if (!this.cachePath) return;
    await fs.mkdir(path.dirname(this.cachePath), { recursive: true });
    await fs.writeFile(this.cachePath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }

  async refresh() {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.refreshInternal().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  async refreshInternal() {
    if (!this.fetchImpl || this.sources.length === 0) {
      return { changed: false, state: this.getPublicState() };
    }

    const attempts = await Promise.allSettled(this.sources.map(async (source) => {
      const text = await fetchTextWithLimit(this.fetchImpl, source, this.timeoutMs);
      return verifyRuntimeManifest(JSON.parse(text), this.publicKeyPem);
    }));
    const manifests = attempts
      .filter((attempt) => attempt.status === "fulfilled")
      .map((attempt) => attempt.value)
      .sort((left, right) => right.revision - left.revision);

    if (manifests.length === 0) {
      const errors = attempts
        .filter((attempt) => attempt.status === "rejected")
        .map((attempt) => String(attempt.reason?.message || attempt.reason));
      this.lastError = errors[0] || "Runtime config is unavailable";
      return { changed: false, state: this.getPublicState() };
    }

    try {
      const manifest = manifests[0];
      const changed = this.applyVerified(manifest, "remote");
      await this.saveCache(manifest);
      return { changed, state: this.getPublicState() };
    } catch (error) {
      this.lastError = String(error?.message || error);
      return { changed: false, state: this.getPublicState() };
    }
  }
}

module.exports = {
  RUNTIME_CONFIG_SCHEMA_VERSION,
  RuntimeConfigManager,
  canonicalJson,
  normalizeApiBaseUrl,
  normalizeRuntimeManifestPayload,
  verifyRuntimeManifest
};
