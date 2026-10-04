import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const renderer = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../apps/client-beta/renderer");
const port = Number(process.env.PREVIEW_PORT || 3187);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid preview port");
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml", ".ogg": "audio/ogg" };
const server = http.createServer(async (request, response) => {
  try {
    if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405).end(); return; }
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
    const target = path.resolve(renderer, `.${pathname}`);
    if (!target.startsWith(renderer + path.sep) || !mime[path.extname(target)]) { response.writeHead(404).end(); return; }
    const content = await fs.readFile(target);
    response.writeHead(200, { "Content-Type": mime[path.extname(target)], "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch { response.writeHead(404).end(); }
});
server.listen(port, "127.0.0.1", () => {
  console.log(`Local preview: http://127.0.0.1:${port}/?preview=1&seed=1&stress=0&lang=ru&appearancePreset=studio`);
});
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => server.close(() => process.exit(0)));
