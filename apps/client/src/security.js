"use strict";

const path = require("node:path");

function normalizeTrustedServerUrl(value, currentServerUrl, retiredServerUrls = []) {
  const current = String(currentServerUrl || "").trim().replace(/\/+$/u, "");
  const normalized = String(value || current).trim().replace(/\/+$/u, "");
  const retired = retiredServerUrls instanceof Set ? retiredServerUrls : new Set(retiredServerUrls);
  if (retired.has(normalized)) return current;
  return normalized === current ? normalized : current;
}

function requireAllowedExternalHttpsUrl(value, allowedHosts) {
  const url = new URL(String(value || ""));
  const hosts = allowedHosts instanceof Set ? allowedHosts : new Set(allowedHosts);
  if (url.protocol !== "https:" || !hosts.has(url.hostname.toLowerCase())) {
    throw new Error("This external link is not allowed");
  }
  return url;
}

function isVrchatLogPath(filePath, logDirectory) {
  const resolved = path.resolve(String(filePath || ""));
  const directory = path.resolve(String(logDirectory || ""));
  const relative = path.relative(directory, resolved);
  const insideDirectory = relative && !relative.startsWith("..") && !path.isAbsolute(relative);
  return Boolean(insideDirectory && /^output_log_.*\.txt$/iu.test(path.basename(resolved)));
}

module.exports = {
  isVrchatLogPath,
  normalizeTrustedServerUrl,
  requireAllowedExternalHttpsUrl
};
