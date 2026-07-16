import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import JavaScriptObfuscator from "javascript-obfuscator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const appName = process.argv[2];

if (!["admin", "client"].includes(appName)) {
  console.error("Usage: node scripts/build-electron.mjs <admin|client>");
  process.exit(1);
}

const appDir = path.join(root, "apps", appName);
const stageDir = path.join(root, ".build", appName);

assertCodeSigningConfiguration();
await fs.rm(stageDir, { recursive: true, force: true });
await copyDir(appDir, stageDir, (name) => name !== "node_modules");

const packagePath = path.join(stageDir, "package.json");
const packageJson = JSON.parse(await fs.readFile(packagePath, "utf8"));
if (process.env.BUILD_OUTPUT_DIR) {
  packageJson.build ??= {};
  packageJson.build.directories ??= {};
  packageJson.build.directories.output = path.resolve(root, process.env.BUILD_OUTPUT_DIR);
}
packageJson.dependencies = {};
await fs.writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");

if (appName === "client") {
  const parserSource = path.join(root, "packages", "parser");
  const parserTarget = path.join(stageDir, "node_modules", "@vrchat-log-suite", "parser");
  await copyDir(parserSource, parserTarget);

  // Copy electron-updater and all its transitive dependencies.
  // electron-updater установлен в apps/client/node_modules, а не в root
  const seen = new Set();
  async function copyWithDeps(pkgName, searchPaths = []) {
    if (seen.has(pkgName)) return;
    seen.add(pkgName);

    // Ищем пакет в нескольких местах
    const possiblePaths = [
      path.join(root, "node_modules", pkgName),
      path.join(appDir, "node_modules", pkgName),
      ...searchPaths.map((p) => path.join(p, "node_modules", pkgName))
    ];

    let src = null;
    for (const p of possiblePaths) {
      const ok = await fs.stat(p).then(() => true).catch(() => false);
      if (ok) {
        src = p;
        break;
      }
    }

    if (!src) return;

    await copyDir(src, path.join(stageDir, "node_modules", pkgName));
    const pkgJsonPath = path.join(src, "package.json");
    const pkgJson = await fs.readFile(pkgJsonPath, "utf8").then(JSON.parse).catch(() => ({}));
    for (const dep of Object.keys(pkgJson.dependencies || {})) {
      await copyWithDeps(dep, [src, ...searchPaths]);
    }
  }
  await copyWithDeps("electron-updater");
}

if (process.env.OBFUSCATE_BUILD === "true") {
  await obfuscate(path.join(stageDir, "src"));
  if (appName === "client") {
    await obfuscate(path.join(stageDir, "node_modules", "@vrchat-log-suite", "parser"));
  }
}

run(process.execPath, [path.join(root, "node_modules", "electron-builder", "cli.js"), "--projectDir", stageDir]);

if (appName === "client" && packageJson.build?.publish) {
  await verifyLatestYml(packageJson);
}

async function obfuscate(target) {
  const files = await collectJsFiles(target);
  console.log(`\nObfuscating ${files.length} JavaScript files...`);

  for (const file of files) {
    const source = await fs.readFile(file, "utf8");

    // Конфигурация обфускатора с высоким уровнем защиты
    const obfuscationResult = JavaScriptObfuscator.obfuscate(source, {
      // Базовые настройки
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.4,
      debugProtection: false, // Отключено чтобы не мешать разработке
      debugProtectionInterval: 0,
      disableConsoleOutput: false,

      // Преобразование идентификаторов
      identifierNamesGenerator: 'hexadecimal',
      identifiersPrefix: '',
      renameGlobals: false,
      renameProperties: false,

      // Защита строк
      stringArray: true,
      stringArrayCallsTransform: true,
      stringArrayCallsTransformThreshold: 0.75,
      stringArrayEncoding: ['base64'],
      stringArrayIndexShift: true,
      stringArrayRotate: true,
      stringArrayShuffle: true,
      stringArrayWrappersCount: 2,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersParametersMaxCount: 4,
      stringArrayWrappersType: 'function',
      stringArrayThreshold: 0.75,

      // Дополнительная защита
      transformObjectKeys: true,
      unicodeEscapeSequence: false,

      // Производительность
      target: 'node',
      sourceMap: false,
      sourceMapMode: 'separate'
    });

    await fs.writeFile(file, obfuscationResult.getObfuscatedCode(), "utf8");
  }

  console.log(`✓ Obfuscation complete`);
}

async function copyDir(source, target, filter = () => true) {
  await fs.mkdir(target, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    if (!filter(entry.name)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyDir(from, to, filter);
    } else if (entry.isFile()) {
      await fs.copyFile(from, to);
    }
  }
}

async function collectJsFiles(target) {
  const stat = await fs.stat(target);
  if (stat.isFile()) return target.endsWith(".js") ? [target] : [];

  const entries = await fs.readdir(target, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

function run(command, args, options = {}) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: options.shell || false
  });
  if (result.error) {
    console.error(result.error);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function hashName(value) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(16);
}

async function verifyLatestYml(packageJson) {
  const outputDir = path.resolve(stageDir, packageJson.build?.directories?.output || "dist");
  const latestPath = path.join(outputDir, "latest.yml");
  const latest = await fs.readFile(latestPath, "utf8").catch(() => "");
  const matches = [...latest.matchAll(/^\s*(?:url|path):\s*(.+?)\s*$/gmu)]
    .map((match) => match[1].trim().replace(/^['"]|['"]$/gu, ""));

  for (const fileName of new Set(matches)) {
    if (/^https?:\/\//iu.test(fileName)) continue;
    const filePath = path.join(outputDir, fileName);
    const exists = await fs.stat(filePath).then((stat) => stat.isFile()).catch(() => false);
    if (!exists) {
      throw new Error(`latest.yml references missing update artifact: ${fileName}`);
    }
  }

  const version = latest.match(/^version:\s*(.+?)\s*$/mu)?.[1]?.trim();
  if (!version || version !== packageJson.version) {
    throw new Error(`latest.yml version does not match client package version: ${version || "missing"}`);
  }

  const installerName = latest.match(/^path:\s*(.+?)\s*$/mu)?.[1]?.trim().replace(/^['"]|['"]$/gu, "");
  const expectedSha512 = latest.match(/^sha512:\s*(.+?)\s*$/mu)?.[1]?.trim();
  if (!installerName || !expectedSha512) {
    throw new Error("latest.yml is missing the installer path or sha512 checksum");
  }

  const installer = await fs.readFile(path.join(outputDir, installerName));
  const actualSha512 = crypto.createHash("sha512").update(installer).digest("base64");
  if (actualSha512 !== expectedSha512) {
    throw new Error(`latest.yml sha512 does not match installer: ${installerName}`);
  }
}

function assertCodeSigningConfiguration() {
  if (process.env.REQUIRE_CODE_SIGNING !== "true") return;
  const certificate = process.env.CSC_LINK || process.env.WIN_CSC_LINK;
  if (!certificate) {
    throw new Error("Code signing is required, but CSC_LINK or WIN_CSC_LINK is not configured");
  }
}
