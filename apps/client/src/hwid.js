"use strict";

const crypto = require("node:crypto");
const os = require("node:os");
const { execFile } = require("node:child_process");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readMachineGuid() {
  if (process.platform !== "win32") return Promise.resolve("");

  return new Promise((resolve) => {
    execFile(
      "reg",
      ["query", "HKLM\\SOFTWARE\\Microsoft\\Cryptography", "/v", "MachineGuid"],
      { windowsHide: true },
      (error, stdout) => {
        if (error) {
          resolve("");
          return;
        }
        const match = /MachineGuid\s+REG_SZ\s+([^\r\n]+)/iu.exec(stdout);
        resolve(match?.[1]?.trim() || "");
      }
    );
  });
}

async function getHardwareId() {
  const machineGuid = await readMachineGuid();
  const parts = [
    machineGuid,
    os.hostname(),
    os.platform(),
    os.arch(),
    os.cpus()?.[0]?.model || ""
  ].filter(Boolean);

  return sha256(parts.join("|"));
}

module.exports = {
  getHardwareId
};
