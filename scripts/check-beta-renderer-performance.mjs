import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));

if (!chromePath) throw new Error("Chrome или Edge не найден. Укажите CHROME_PATH.");

const profileDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "vrchat-beta-perf-"));
const debuggingPort = 30000 + Math.floor(Math.random() * 10000);
const previewUrl = new URL(pathToFileURL(path.join(root, "apps", "client-beta", "renderer", "index.html")));
previewUrl.searchParams.set("preview", "1");
previewUrl.searchParams.set("seed", "1");
previewUrl.searchParams.set("stress", "1");
previewUrl.searchParams.set("animations", "0");

const browser = spawn(chromePath, [
  "--headless=new",
  "--disable-background-networking",
  "--disable-extensions",
  "--disable-gpu",
  "--disable-sync",
  "--no-default-browser-check",
  "--no-first-run",
  `--remote-debugging-port=${debuggingPort}`,
  `--user-data-dir=${profileDirectory}`,
  "--window-size=1366,768",
  previewUrl.href
], { stdio: ["ignore", "ignore", "pipe"], windowsHide: true });

let browserError = "";
browser.stderr.setEncoding("utf8");
browser.stderr.on("data", (chunk) => { browserError += chunk; });

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForPageTarget(timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (browser.exitCode !== null) throw new Error(`Браузер завершился раньше времени. ${browserError.trim()}`);
    try {
      const targets = await fetch(`http://127.0.0.1:${debuggingPort}/json/list`).then((response) => response.json());
      const target = targets.find((entry) => entry.type === "page" && entry.url.includes("apps/client-beta/renderer/index.html"));
      if (target?.webSocketDebuggerUrl) return target;
    } catch {
      // DevTools ещё запускается.
    }
    await delay(100);
  }
  throw new Error(`Не удалось подключиться к DevTools за ${timeoutMs} мс. ${browserError.trim()}`);
}

async function connectCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let messageId = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  return {
    close: () => socket.close(),
    send(method, params = {}) {
      const id = ++messageId;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    }
  };
}

let cdp = null;
try {
  const target = await waitForPageTarget();
  cdp = await connectCdp(target.webSocketDebuggerUrl);
  await cdp.send("Runtime.enable");
  await cdp.send("Runtime.evaluate", {
    expression: "new Promise((resolve) => setTimeout(resolve, 3500))",
    awaitPromise: true
  });
  const evaluation = await cdp.send("Runtime.evaluate", {
    expression: `(() => {
      const eventList = document.querySelector('[data-event-feed]');
      const playerList = document.querySelector('[data-player-list]');
      return {
        eventTotal: Number(eventList?.dataset.virtualTotal || 0),
        eventRows: eventList?.querySelectorAll('.eventRow').length || 0,
        playerTotal: Number(playerList?.dataset.virtualTotal || 0),
        playerRows: playerList?.querySelectorAll('.sessionPlayerButton').length || 0,
        totalDomNodes: document.querySelectorAll('*').length,
        usedJsHeapBytes: Number(performance.memory?.usedJSHeapSize || 0)
      };
    })()`,
    returnByValue: true
  });
  const metrics = evaluation.result.value;
  const failures = [];
  if (metrics.playerTotal !== 1000) failures.push(`ожидалось 1000 игроков, получено ${metrics.playerTotal}`);
  if (metrics.eventTotal !== 2000) failures.push(`ожидалось 2000 событий, получено ${metrics.eventTotal}`);
  if (metrics.playerRows > 40) failures.push(`создано слишком много строк игроков: ${metrics.playerRows}`);
  if (metrics.eventRows > 40) failures.push(`создано слишком много строк событий: ${metrics.eventRows}`);
  if (metrics.totalDomNodes > 1200) failures.push(`DOM разросся до ${metrics.totalDomNodes} узлов`);
  if (failures.length) throw new Error(failures.join("; "));
  console.log(JSON.stringify({
    ...metrics,
    usedJsHeapMb: Number((metrics.usedJsHeapBytes / 1024 / 1024).toFixed(1)),
    status: "ok"
  }, null, 2));
} finally {
  cdp?.close();
  if (browser.exitCode === null) browser.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => browser.once("exit", resolve)),
    delay(3000)
  ]);
  if (browser.exitCode === null) browser.kill("SIGKILL");
  fs.rmSync(profileDirectory, { recursive: true, force: true });
}
