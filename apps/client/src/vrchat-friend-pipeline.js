"use strict";

const DefaultWebSocket = require("ws");

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
  constructor({ WebSocketImpl = DefaultWebSocket, userAgent = "VRChatAdminTools/0.5.5 contact:local", onEvent = () => {}, onStatus = () => {}, reconnectDelayMs = 5_000 } = {}) {
    this.WebSocketImpl = WebSocketImpl;
    this.userAgent = String(userAgent || "VRChatAdminTools/0.5.5 contact:local");
    this.onEvent = onEvent;
    this.onStatus = onStatus;
    this.reconnectDelayMs = Math.max(100, Number(reconnectDelayMs) || 5_000);
    this.token = "";
    this.socket = null;
    this.timer = null;
    this.generation = 0;
    this.state = { status: "disconnected", lastConnectedAt: "", lastEventAt: "", reason: "" };
  }

  emitStatus(status, reason = "") {
    this.state = { ...this.state, status, reason };
    try { this.onStatus(this.getStatus()); } catch { /* UI status reporting must not stop reconnects. */ }
  }

  getStatus() {
    return { ...this.state };
  }

  start(cookie) {
    const token = authTokenFromCookie(cookie);
    if (token === this.token && this.socket && this.state.status !== "error") return true;
    this.stop();
    if (!token || typeof this.WebSocketImpl !== "function") {
      this.emitStatus("disconnected", token ? "unsupported" : "no-session");
      return false;
    }
    this.token = token;
    this.connect(++this.generation);
    return true;
  }

  restart(cookie) {
    this.stop();
    return this.start(cookie);
  }

  connect(generation) {
    if (!this.token || generation !== this.generation) return;
    this.emitStatus("connecting");
    const socket = new this.WebSocketImpl(`${PIPELINE_URL}/?authToken=${encodeURIComponent(this.token)}`, {
      headers: { "User-Agent": this.userAgent }
    });
    this.socket = socket;
    socket.addEventListener("open", () => {
      if (this.socket !== socket || generation !== this.generation) return;
      this.state.lastConnectedAt = new Date().toISOString();
      this.emitStatus("connected");
    });
    socket.addEventListener("message", (event) => {
      try {
        const envelope = JSON.parse(String(event?.data || ""));
        if (envelope?.err) {
          const reason = /authToken|session/iu.test(String(envelope.err)) ? "session" : "server";
          this.emitStatus("error", reason);
          if (reason === "session") this.token = "";
          return;
        }
      } catch { /* Friend event parsing below owns malformed messages. */ }
      const parsed = parsePipelineMessage(event?.data);
      if (parsed) {
        const occurredAt = new Date().toISOString();
        this.state.lastEventAt = occurredAt;
        try { this.onEvent({ ...parsed, occurredAt }); }
        catch { /* A storage failure must not crash the desktop process. */ }
      }
    });
    socket.addEventListener("close", () => {
      if (this.socket === socket) this.socket = null;
      if (!this.token || generation !== this.generation) return;
      this.emitStatus("reconnecting", this.state.reason);
      this.timer = setTimeout(() => {
        this.timer = null;
        this.connect(generation);
      }, this.reconnectDelayMs);
    });
    socket.addEventListener("error", () => {
      this.emitStatus("error", "network");
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
    this.emitStatus("disconnected");
  }
}

module.exports = { VrchatFriendPipeline, authTokenFromCookie, parsePipelineMessage, PIPELINE_URL };
