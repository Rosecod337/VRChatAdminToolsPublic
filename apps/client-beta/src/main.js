"use strict";

const path = require("node:path");

process.env.VRCHAT_CLIENT_VARIANT = "beta";
process.env.VRCHAT_CLIENT_RENDERER_DIR = path.join(__dirname, "..", "renderer");

require("../../client/src/main.js");
