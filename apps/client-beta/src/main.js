"use strict";

const path = require("node:path");
const { app } = require("electron");
const { mkdirSync } = require("node:fs");

if (!app.isPackaged && process.argv.includes("--ui-preview")) {
  process.env.VRCHAT_CLIENT_UI_PREVIEW = "1";
  const previewProfile = process.env.VRCHAT_CLIENT_UI_PREVIEW_DIR
    ? path.resolve(process.env.VRCHAT_CLIENT_UI_PREVIEW_DIR)
    : path.join(app.getPath("appData"), "VRChat Admin Tools UI Preview");
  mkdirSync(previewProfile, { recursive: true });
  app.setPath("userData", previewProfile);
}

process.env.VRCHAT_CLIENT_VARIANT = "beta";
process.env.VRCHAT_CLIENT_RENDERER_DIR = path.join(__dirname, "..", "renderer");

require("../../client/src/main.js");
