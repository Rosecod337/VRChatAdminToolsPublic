"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { parseKnownVrchatId } = require("../apps/client-beta/renderer/studio-shell");

test("unified search accepts exact public VRChat IDs and website links", () => {
  for (const prefix of ["usr", "wrld", "avtr"]) {
    const id = `${prefix}_12345678-1234-1234-1234-123456789abc`;
    assert.equal(parseKnownVrchatId(id), id);
    assert.equal(parseKnownVrchatId(`https://vrchat.com/home/avatar/${id}?ignored=1`), id);
  }
});

test("unified search never treats unrelated or credential-bearing links as VRChat actions", () => {
  const id = "avtr_12345678-1234-1234-1234-123456789abc";
  for (const input of [`javascript:${id}`, `https://vrchat.com.evil.example/home/avatar/${id}`, `https://x:secret@vrchat.com/home/avatar/${id}`, `file:///home/avatar/${id}`, `${id}/extra`, "avtr_undefined"]) assert.equal(parseKnownVrchatId(input), "");
});
