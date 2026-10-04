"use strict";

function createAttentionDelivery({ allowed, send, notify, failed = () => {} }) {
  return (result) => {
    if (!allowed()) return;
    send(result);
    try { notify?.({ title: result.name, body: `${result.event.displayName || "VRChat"} · ${result.event.type}`.slice(0, 250) }); }
    catch { failed(); }
  };
}
module.exports = { createAttentionDelivery };
