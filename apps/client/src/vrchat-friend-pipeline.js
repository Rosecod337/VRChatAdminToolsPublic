"use strict";

const PIPELINE_URL = "wss://pipeline.vrchat.cloud";
const SUPPORTED_TYPES = new Set([
  "friend-add",
  "friend-delete",
  "friend-online",
  "friend-active",
  "friend-offline",
  "friend-location",
  "friend-update"
]);

function authTokenFromCookie(cookie) {
  return String(cookie || "").match(/(?:^|;\s*)auth=([^;]+)/iu)?.[1] || "";
}

function parsePipelineMessage(raw) {
  try {
    const envelope = JSON.parse(String(raw || ""));
    const content = typeof envelope.content === "string" ? JSON.parse(envelope.content) : envelope.content;
    if (!SUPPORTED_TYPES.has(envelope.type) || !content || typeof content !== "object") return null;
    return { type: envelope.type, content };
  } catch {
    return null;
  }
}

class VrchatFriendPipeline {
  constructor({ WebSocketImpl = globalThis.WebSocket, onEvent = () => {}, reconnectDelayMs = 5_000 } = {}) {
    this.WebSocketImpl = WebSocketImpl;
    this.onEvent = onEvent;
    this.reconnectDelayMs = Math.max(100, Number(reconnectDelayMs) || 5_000);
    this.token = "";
    this.socket = null;
    this.timer = null;
    this.generation = 0;
  }

  start(cookie) {
    const token = authTokenFromCookie(cookie);
    if (token === this.token && this.socket) return true;
    this.stop();
    if (!token || typeof this.WebSocketImpl !== "function") return false;
    this.token = token;
    this.connect(++this.generation);
    return true;
  }

  connect(generation) {
    if (!this.token || generation !== this.generation) return;
    const socket = new this.WebSocketImpl(`${PIPELINE_URL}/?auth=${encodeURIComponent(this.token)}`);
    this.socket = socket;
    socket.addEventListener("message", (event) => {
      const parsed = parsePipelineMessage(event?.data);
      if (parsed) {
        try { this.onEvent({ ...parsed, occurredAt: new Date().toISOString() }); }
        catch { /* A storage failure must not crash the desktop process. */ }
      }
    });
    socket.addEventListener("close", () => {
      if (this.socket === socket) this.socket = null;
      if (!this.token || generation !== this.generation) return;
      this.timer = setTimeout(() => {
        this.timer = null;
        this.connect(generation);
      }, this.reconnectDelayMs);
    });
    socket.addEventListener("error", () => {
      try { socket.close(); } catch { /* Close handling schedules reconnect. */ }
    });
  }

  stop() {
    this.generation += 1;
    this.token = "";
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const socket = this.socket;
    this.socket = null;
    try { socket?.close(); } catch { /* Already closed. */ }
  }
}

module.exports = { VrchatFriendPipeline, authTokenFromCookie, parsePipelineMessage, PIPELINE_URL };
