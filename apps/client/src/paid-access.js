"use strict";

function paidLocalAllowed(settings = {}, { modern = true, now = Date.now() } = {}) {
  if (!modern || settings.freeMode === true || settings.accessMode === "free" || !settings.sessionToken || !settings.license || settings.license.active === false) return false;
  const expiry = settings.license.expiresAt || settings.license.expires_at;
  return !expiry || Number.isFinite(Date.parse(expiry)) && Date.parse(expiry) > now;
}
module.exports = { paidLocalAllowed };
