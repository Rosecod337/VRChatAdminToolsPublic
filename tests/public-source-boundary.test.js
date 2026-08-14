"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const publicFiles = [
  "server-template/src/index.js",
  "server-template/src/db.js"
];

test("public server template excludes private tax and payment integrations", () => {
  const source = publicFiles
    .map((relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8"))
    .join("\n");

  assert.doesNotMatch(source, /tax|receipt|налог|чек|yookassa|payment_orders/iu);
});

test("private applications and deployment files are absent from public source", () => {
  for (const relativePath of ["apps/admin", "apps/server", "apps/site", "deploy"]) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), false, `${relativePath} must not be published`);
  }
});
