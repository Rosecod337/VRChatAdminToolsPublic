"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { VrchatFriendPipeline, authTokenFromCookie, parsePipelineMessage } = require("../apps/client/src/vrchat-friend-pipeline");

test("friend pipeline extracts only the auth cookie and accepts friend events", () => {
  assert.equal(authTokenFromCookie("twoFactorAuth=ok; auth=authcookie_demo"), "authcookie_demo");
  assert.deepEqual(parsePipelineMessage(JSON.stringify({
    type: "friend-update",
    content: JSON.stringify({ userId: "usr_demo", user: { displayName: "Demo" } })
  })), { type: "friend-update", content: { userId: "usr_demo", user: { displayName: "Demo" } } });
  assert.equal(parsePipelineMessage(JSON.stringify({ type: "notification", content: "{}" })), null);
});

test("friend pipeline connects without exposing the token in emitted activity", () => {
  const sockets = [];
  class FakeSocket {
    constructor(url, options) { this.url = url; this.options = options; this.listeners = {}; sockets.push(this); }
    addEventListener(name, handler) { this.listeners[name] = handler; }
    close() {}
    emit(name, value) { this.listeners[name]?.(value); }
  }
  const events = [];
  const pipeline = new VrchatFriendPipeline({ WebSocketImpl: FakeSocket, onEvent: (event) => events.push(event) });
  assert.equal(pipeline.start("auth=authcookie_secret; twoFactorAuth=ok"), true);
  assert.equal(sockets.length, 1);
  assert.equal(sockets[0].url, "wss://pipeline.vrchat.cloud/?authToken=authcookie_secret");
  assert.match(sockets[0].options.headers["User-Agent"], /^VRChatAdminTools\//u);
  sockets[0].emit("open");
  assert.equal(pipeline.getStatus().status, "connected");
  sockets[0].emit("message", { data: JSON.stringify({ type: "friend-online", content: JSON.stringify({ userId: "usr_demo" }) }) });
  assert.equal(events[0].type, "friend-online");
  assert.ok(pipeline.getStatus().lastEventAt);
  assert.doesNotMatch(JSON.stringify(events[0]), /authcookie_secret/u);
  pipeline.stop();
});

test("friend pipeline reports session errors without exposing the server token", () => {
  const sockets = [];
  class FakeSocket {
    constructor(url) { this.url = url; this.listeners = {}; sockets.push(this); }
    addEventListener(name, handler) { this.listeners[name] = handler; }
    close() { this.listeners.close?.(); }
    emit(name, value) { this.listeners[name]?.(value); }
  }
  const statuses = [];
  const pipeline = new VrchatFriendPipeline({ WebSocketImpl: FakeSocket, onStatus: (status) => statuses.push(status) });
  pipeline.start("auth=authcookie_secret");
  sockets[0].emit("message", { data: JSON.stringify({ err: "authToken doesn't correspond with an active session", authToken: "authcookie_secret" }) });
  sockets[0].emit("close");
  assert.equal(pipeline.getStatus().status, "error");
  assert.equal(pipeline.getStatus().reason, "session");
  assert.doesNotMatch(JSON.stringify(statuses), /authcookie_secret/u);
});
