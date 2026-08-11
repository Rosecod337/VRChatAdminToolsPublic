import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const i18n = require(path.join(root, "apps", "client-beta", "renderer", "i18n.js"));
const rendererDir = path.join(root, "apps", "client-beta", "renderer");
const scriptSources = fs.readdirSync(rendererDir)
  .filter((name) => name.endsWith(".js") && name !== "i18n.js")
  .map((name) => fs.readFileSync(path.join(rendererDir, name), "utf8"));
const htmlSource = fs.readFileSync(path.join(rendererDir, "index.html"), "utf8");
const cyrillic = /[А-Яа-яЁё]/u;
const values = new Set();

for (const scriptSource of scriptSources) {
  for (const pattern of [/"(?<value>(?:\\.|[^"\\])*)"/gu, /'(?<value>(?:\\.|[^'\\])*)'/gu]) {
    for (const match of scriptSource.matchAll(pattern)) {
      const value = String(match.groups?.value || "").replace(/\\(["'])/gu, "$1");
      if (cyrillic.test(value)) values.add(value);
    }
  }
  for (const match of scriptSource.matchAll(/`(?<value>[^`\r\n$]*)`/gu)) {
    const value = String(match.groups?.value || "");
    if (cyrillic.test(value)) values.add(value);
  }
}

for (const match of htmlSource.matchAll(/>(?<value>[^<>]+)</gu)) {
  const value = String(match.groups?.value || "").trim();
  if (cyrillic.test(value)) values.add(value);
}

for (const match of htmlSource.matchAll(/(?:placeholder|title|aria-label)="(?<value>[^"]+)"/gu)) {
  const value = String(match.groups?.value || "").trim();
  if (cyrillic.test(value)) values.add(value);
}

const untranslated = [...values]
  .filter((value) => i18n.translate(value, "en") === value)
  .sort((left, right) => left.localeCompare(right, "ru"));

if (untranslated.length) {
  console.error(`Untranslated Beta UI strings: ${untranslated.length}`);
  for (const value of untranslated) console.error(`- ${value}`);
  process.exitCode = 1;
} else {
  console.log(`Beta i18n coverage: ${values.size} Russian UI strings translated`);
}
