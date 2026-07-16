"use strict";

const crypto = require("node:crypto");

function requireSecret(name) {
  const value = process.env[name];
  if (!value || value.length < 24) {
    throw new Error(`${name} must be set and at least 24 characters long`);
  }
  return value;
}

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function hmac(input, secret) {
  return crypto.createHmac("sha256", secret).update(input).digest("hex");
}

function normalizeLicenseKey(value) {
  return String(value ?? "").trim().toUpperCase().replace(/\s+/gu, "");
}

function hashLicenseKey(licenseKey) {
  const pepper = requireSecret("LICENSE_PEPPER");
  return sha256(`${pepper}:license:${normalizeLicenseKey(licenseKey)}`);
}

function hashHwid(hwid) {
  const pepper = requireSecret("LICENSE_PEPPER");
  return hmac(String(hwid ?? "").trim(), `${pepper}:hwid`);
}

function hashSessionToken(sessionToken) {
  const pepper = requireSecret("LICENSE_PEPPER");
  return sha256(`${pepper}:session:${String(sessionToken ?? "").trim()}`);
}

function generateLicenseKey() {
  const body = crypto.randomBytes(24).toString("base64url").toUpperCase();
  return `VRC-${body.slice(0, 6)}-${body.slice(6, 12)}-${body.slice(12, 18)}-${body.slice(18, 24)}-${body.slice(24, 32)}`;
}

function generateSessionToken() {
  return `sess_${crypto.randomBytes(32).toString("base64url")}`;
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a ?? ""));
  const right = Buffer.from(String(b ?? ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

module.exports = {
  generateLicenseKey,
  generateSessionToken,
  hashHwid,
  hashLicenseKey,
  hashSessionToken,
  normalizeLicenseKey,
  requireSecret,
  safeEqual,
  sha256
};
