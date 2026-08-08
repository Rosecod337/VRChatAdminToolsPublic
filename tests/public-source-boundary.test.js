"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const publicFiles = [
  "apps/admin/renderer/index.html",
  "apps/admin/renderer/renderer.js",
  "apps/admin/renderer/styles.css",
  "apps/admin/src/main.js",
  "apps/admin/src/preload.js",
  "server-template/src/index.js",
  "server-template/src/db.js"
];

test("public admin and server template exclude private tax and payment integrations", () => {
  const source = publicFiles
    .map((relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8"))
    .join("\n");

  assert.doesNotMatch(source, /tax|receipt|налог|чек|yookassa|payment_orders/iu);
});
