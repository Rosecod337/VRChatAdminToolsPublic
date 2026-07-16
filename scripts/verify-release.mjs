import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const requestedVersion = String(process.argv[2] || "").replace(/^v/iu, "").trim();
const clientPackage = JSON.parse(await fs.readFile(path.join(root, "apps", "client", "package.json"), "utf8"));
const outputDir = path.join(root, "release", "client");
const latest = await fs.readFile(path.join(outputDir, "latest.yml"), "utf8");
const releaseVersion = latest.match(/^version:\s*(.+?)\s*$/mu)?.[1]?.trim();
const installerName = latest.match(/^path:\s*(.+?)\s*$/mu)?.[1]?.trim().replace(/^['"]|['"]$/gu, "");
const expectedSha512 = latest.match(/^sha512:\s*(.+?)\s*$/mu)?.[1]?.trim();

if (!releaseVersion || !installerName || !expectedSha512) {
  throw new Error("latest.yml is missing release metadata");
}
if (releaseVersion !== clientPackage.version) {
  throw new Error(`latest.yml version (${releaseVersion}) does not match client package (${clientPackage.version})`);
}
if (requestedVersion && requestedVersion !== clientPackage.version) {
  throw new Error(`requested version (${requestedVersion}) does not match client package (${clientPackage.version})`);
}

const installerPath = path.join(outputDir, installerName);
const installer = await fs.readFile(installerPath).catch(() => null);
if (!installer) throw new Error(`installer is missing: ${installerName}`);

const actualSha512 = crypto.createHash("sha512").update(installer).digest("base64");
if (actualSha512 !== expectedSha512) {
  throw new Error(`installer checksum does not match latest.yml: ${installerName}`);
}

console.log(`Release ${clientPackage.version} is internally consistent: ${installerName}`);
