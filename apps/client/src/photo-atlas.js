"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const zlib = require("node:zlib");
const { createHash, randomUUID } = require("node:crypto");
const PNG = Buffer.from([137,80,78,71,13,10,26,10]);
const MAX_BYTES = 32 * 1024 * 1024;

function imageParts(buffer) {
  if (buffer.length > MAX_BYTES) throw new Error("photo_file_too_large");
  if (buffer.subarray(0, 8).equals(PNG)) {
    const parts = []; let offset = 8;
    while (offset + 12 <= buffer.length) {
      const length = buffer.readUInt32BE(offset), end = offset + 12 + length;
      if (end > buffer.length) throw new Error("photo_png_invalid");
      const type = buffer.toString("ascii", offset + 4, offset + 8);
      parts.push({ type, start: offset, end, data: buffer.subarray(offset + 8, offset + 8 + length) }); offset = end;
      if (type === "IEND") return { format: "png", parts };
    }
    throw new Error("photo_png_invalid");
  }
  if (buffer[0] === 255 && buffer[1] === 216) {
    const parts = []; let offset = 2;
    while (offset + 2 <= buffer.length) {
      const start = offset;
      if (buffer[offset++] !== 255) throw new Error("photo_jpeg_invalid");
      while (buffer[offset] === 255) offset += 1;
      const marker = buffer[offset++];
      if (marker === 217) { parts.push({ type: marker, start, end: offset, data: Buffer.alloc(0) }); return { format: "jpg", parts }; }
      if (marker >= 208 && marker <= 215 || marker === 1) { parts.push({ type: marker, start, end: offset, data: Buffer.alloc(0) }); continue; }
      if (offset + 2 > buffer.length) throw new Error("photo_jpeg_invalid");
      const length = buffer.readUInt16BE(offset), end = offset + length;
      if (length < 2 || end > buffer.length) throw new Error("photo_jpeg_invalid");
      parts.push({ type: marker, start, end, data: buffer.subarray(offset + 2, end) }); offset = end;
      if (marker === 218) {
        const entropyStart = offset; let nextMarker = -1;
        for (let cursor = offset; cursor < buffer.length - 1; cursor += 1) {
          if (buffer[cursor] !== 255) continue;
          let following = cursor + 1; while (buffer[following] === 255) following += 1;
          const code = buffer[following];
          if (code === 0 || code >= 208 && code <= 215) { cursor = following; continue; }
          nextMarker = cursor; break;
        }
        if (nextMarker < 0) throw new Error("photo_jpeg_invalid");
        parts.push({ type: "entropy", start: entropyStart, end: nextMarker, data: Buffer.alloc(0) }); offset = nextMarker;
      }
    }
    throw new Error("photo_jpeg_invalid");
  }
  throw new Error("photo_format_unsupported");
}

function stripImageMetadata(buffer) {
  const image = imageParts(buffer);
  const header = buffer.subarray(0, image.format === "png" ? 8 : 2);
  const keep = image.parts.filter((part) => image.format === "png" ? !["tEXt", "zTXt", "iTXt", "eXIf"].includes(part.type) : ![225, 237, 254].includes(part.type));
  return Buffer.concat([header, ...keep.map((part) => buffer.subarray(part.start, part.end))]);
}

function readPhotoMetadata(buffer, modifiedAt) {
  const image = imageParts(buffer); let metadata = "";
  if (image.format === "png") {
    const header = image.parts.find((part) => part.type === "IHDR");
    if (!header || header.data.length < 8 || header.data.readUInt32BE(0) * header.data.readUInt32BE(4) > 40000000) throw new Error("photo_dimensions_too_large");
  } else {
    const frame = image.parts.find((part) => [192,193,194,195,197,198,199,201,202,203,205,206,207].includes(part.type));
    if (frame && frame.data.length >= 5 && frame.data.readUInt16BE(1) * frame.data.readUInt16BE(3) > 40000000) throw new Error("photo_dimensions_too_large");
  }
  for (const part of image.parts) {
    if (part.data.length > 1024 * 1024) continue;
    if (image.format === "png" && part.type === "tEXt" || image.format === "jpg" && [225,237,254].includes(part.type)) metadata += part.data.toString("utf8");
    if (image.format === "png" && part.type === "iTXt") {
      const keywordEnd = part.data.indexOf(0), compressed = part.data[keywordEnd + 1];
      const languageEnd = part.data.indexOf(0, keywordEnd + 3), translatedEnd = part.data.indexOf(0, languageEnd + 1);
      try {
        if (keywordEnd >= 0 && languageEnd >= 0 && translatedEnd >= 0) {
          const content = part.data.subarray(translatedEnd + 1);
          metadata += (compressed === 1 ? zlib.inflateSync(content, { maxOutputLength: 1024 * 1024 }) : content).toString("utf8");
        }
      } catch { /* Invalid optional metadata stays unknown. */ }
    }
    if (image.format === "png" && part.type === "zTXt") {
      const end = part.data.indexOf(0);
      try { if (end >= 0) metadata += zlib.inflateSync(part.data.subarray(end + 2), { maxOutputLength: 1024 * 1024 }).toString("utf8"); } catch { /* Invalid optional metadata stays unknown. */ }
    }
    if (metadata.length > 1024 * 1024) { metadata = metadata.slice(0, 1024 * 1024); break; }
  }
  const vrchat = /vrchat|vrc:/iu.test(metadata);
  const worldId = vrchat ? metadata.match(/wrld_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/iu)?.[0] || "" : "";
  const created = metadata.match(/(?:CreateDate|DateTimeOriginal|creationDate)[^\d]{1,10}(\d{4}-\d{2}-\d{2}T[\d:.+-]+Z?)/iu)?.[1];
  const date = created && Number.isFinite(Date.parse(created)) ? new Date(created).toISOString() : new Date(modifiedAt).toISOString();
  return { format: image.format, worldId, capturedAt: date, dateSource: created && Number.isFinite(Date.parse(created)) ? "metadata" : "file-modification", hasMetadata: metadata.length > 0 };
}

class PhotoAtlas {
  constructor(database, { thumbnail = null } = {}) {
    this.database = database; this.thumbnail = thumbnail; this.verifiedFiles = new Map(); this.cancelled = false; this.job = { running: false, indexed: 0, skipped: 0, error: "" };
    database.exec(`CREATE TABLE IF NOT EXISTS photo_roots(id TEXT PRIMARY KEY,path TEXT NOT NULL UNIQUE);
      CREATE TABLE IF NOT EXISTS photo_items(id TEXT PRIMARY KEY,root_id TEXT NOT NULL,file_path TEXT NOT NULL UNIQUE,filename TEXT NOT NULL,mtime_ms REAL NOT NULL,bytes INTEGER NOT NULL,format TEXT NOT NULL,world_id TEXT NOT NULL,captured_at TEXT NOT NULL,date_source TEXT NOT NULL,album TEXT NOT NULL DEFAULT '',caption TEXT NOT NULL DEFAULT '',session_id TEXT NOT NULL DEFAULT '');
      CREATE INDEX IF NOT EXISTS photo_items_date ON photo_items(captured_at);`);
    if (!database.prepare("PRAGMA table_info(photo_roots)").all().some((row) => row.name === "approved")) database.exec("ALTER TABLE photo_roots ADD COLUMN approved INTEGER NOT NULL DEFAULT 1");
    if (!database.prepare("PRAGMA table_info(photo_items)").all().some((row) => row.name === "content_hash")) database.exec("ALTER TABLE photo_items ADD COLUMN content_hash TEXT NOT NULL DEFAULT ''");
  }
  async approveRoot(directory) {
    const root = await fs.realpath(String(directory));
    if (!(await fs.stat(root)).isDirectory()) throw new Error("photo_folder_required");
    const old = this.database.prepare("SELECT id FROM photo_roots WHERE path=?").get(root);
    const id = old?.id || randomUUID(); this.database.prepare("INSERT INTO photo_roots(id,path) VALUES (?,?) ON CONFLICT(path) DO UPDATE SET approved=1").run(id, root); return id;
  }
  async permittedFile(id) {
    const item = this.database.prepare("SELECT p.*,r.path AS root FROM photo_items p JOIN photo_roots r ON r.id=p.root_id WHERE p.id=? AND r.approved=1").get(String(id));
    if (!item) throw new Error("photo_missing");
    const resolved = await fs.realpath(item.file_path);
    if (!resolved.startsWith(item.root + path.sep)) throw new Error("photo_path_outside_folder");
    const stat = await fs.stat(resolved);
    if (stat.size > MAX_BYTES) throw new Error("photo_file_too_large");
    return { ...item, file_path: resolved, diskBytes: stat.size, diskMtimeMs: stat.mtimeMs };
  }
  async scan(rootId, { allowed = () => true, progress = () => {} } = {}) {
    if (this.job.running) throw new Error("photo_scan_running");
    const root = this.database.prepare("SELECT * FROM photo_roots WHERE id=?").get(String(rootId));
    if (!root || root.approved !== 1) throw new Error("photo_folder_missing");
    this.cancelled = false; this.job = { running: true, indexed: 0, skipped: 0, error: "" };
    const directories = [root.path]; let inspected = 0;
    try {
      while (directories.length && inspected < 20000 && !this.cancelled && allowed()) {
        const directory = directories.shift();
        for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
          if (this.cancelled || !allowed() || inspected >= 20000) break;
          if (entry.isSymbolicLink()) continue;
          const filePath = path.join(directory, entry.name);
          if (entry.isDirectory()) { if (directories.length < 1000) directories.push(filePath); continue; }
          if (!entry.isFile() || !/\.(png|jpg|jpeg)$/iu.test(entry.name)) continue;
          inspected += 1;
          try {
            const file = await fs.realpath(filePath);
            if (!file.startsWith(root.path + path.sep)) throw new Error("photo_path_outside_folder");
            const stat = await fs.stat(file);
            if (stat.size > MAX_BYTES) throw new Error("photo_file_too_large");
            const previous = this.database.prepare("SELECT * FROM photo_items WHERE file_path=?").get(file);
            if (!previous || !previous.content_hash || previous.mtime_ms !== stat.mtimeMs || previous.bytes !== stat.size) {
              const buffer = await fs.readFile(file);
              const metadata = readPhotoMetadata(buffer, stat.mtime);
              const contentHash = createHash("sha256").update(buffer).digest("hex");
              const saved = previous || this.database.prepare("SELECT * FROM photo_items WHERE content_hash=? LIMIT 1").get(contentHash);
              const id = previous?.id || createHash("sha256").update(rootId + file).digest("hex");
              this.database.prepare("INSERT INTO photo_items(id,root_id,file_path,filename,mtime_ms,bytes,format,world_id,captured_at,date_source) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(file_path) DO UPDATE SET mtime_ms=excluded.mtime_ms,bytes=excluded.bytes,world_id=excluded.world_id,captured_at=excluded.captured_at,date_source=excluded.date_source").run(id, rootId, file, entry.name, stat.mtimeMs, stat.size, metadata.format, metadata.worldId, metadata.capturedAt, metadata.dateSource);
              this.database.prepare("UPDATE photo_items SET content_hash=?,album=?,caption=?,session_id=? WHERE id=?").run(contentHash, saved?.album || "", saved?.caption || "", saved?.session_id || "", id);
            }
            this.job.indexed += 1;
          } catch { this.job.skipped += 1; }
          if (inspected % 8 === 0) { progress({ ...this.job }); await new Promise((resolve) => setImmediate(resolve)); }
        }
      }
    } catch (error) { this.job.error = String(error.code || "photo_scan_failed"); }
    finally { this.job.running = false; progress({ ...this.job }); }
    return { ...this.job, limited: inspected >= 20000, cancelled: this.cancelled || !allowed() };
  }
  list({ query = "", from = "", to = "", album = "", offset = 0 } = {}) {
    const where = "(filename LIKE ? OR caption LIKE ? OR world_id LIKE ?) AND (?='' OR captured_at>=?) AND (?='' OR captured_at<=?) AND (?='' OR album=?)";
    const term = `%${String(query).slice(0, 120)}%`, parameters = [term, term, term, from, from, to, `${to}T23:59:59Z`, album, album];
    const total = Number(this.database.prepare(`SELECT COUNT(*) AS n FROM photo_items WHERE ${where}`).get(...parameters).n);
    const rows = this.database.prepare(`SELECT id,filename,world_id,captured_at,date_source,album,caption,session_id FROM photo_items WHERE ${where} ORDER BY captured_at DESC LIMIT 36 OFFSET ?`).all(...parameters, Math.max(0, Number(offset) || 0));
    return { total, rows, needsApproval: Number(this.database.prepare("SELECT COUNT(*) AS n FROM photo_roots WHERE approved=0").get().n), albums: this.database.prepare("SELECT DISTINCT album FROM photo_items WHERE album<>'' ORDER BY album").all().map((row) => row.album), job: { ...this.job } };
  }
  annotate(id, value) {
    const session = String(value.sessionId || "").slice(0, 200);
    if (session && !this.database.prepare("SELECT 1 FROM play_sessions WHERE id=?").get(session)) throw new Error("photo_session_missing");
    this.database.prepare("UPDATE photo_items SET album=?,caption=?,session_id=? WHERE id=?").run(String(value.album || "").slice(0, 80), String(value.caption || "").slice(0, 500), session, String(id));
    return { ok: true };
  }
  async getThumbnail(id) {
    const item = await this.permittedFile(id); if (!this.thumbnail) return null;
    const identity = `${item.file_path}|${item.diskMtimeMs}|${item.diskBytes}`;
    if (!this.verifiedFiles.has(identity)) readPhotoMetadata(await fs.readFile(item.file_path), new Date());
    this.verifiedFiles.delete(identity); this.verifiedFiles.set(identity, true);
    while (this.verifiedFiles.size > 72) this.verifiedFiles.delete(this.verifiedFiles.keys().next().value);
    return this.thumbnail(item.file_path, identity);
  }
  restoreBackup(roots = [], items = []) {
    const approved = new Map();
    for (const row of roots.slice(0, 100)) {
      if (!path.isAbsolute(String(row.path || "")) || String(row.path).length > 1000) continue;
      const stored = this.database.prepare("SELECT id FROM photo_roots WHERE path=?").get(row.path);
      const id = stored?.id || randomUUID();
      this.database.prepare("INSERT INTO photo_roots(id,path,approved) VALUES (?,?,0) ON CONFLICT(path) DO UPDATE SET approved=0").run(id, row.path);
      approved.set(String(row.id), { id, path: row.path });
    }
    for (const row of items.slice(0, 20000)) {
      const folder = approved.get(String(row.root_id));
      if (!folder || !String(row.file_path || "").startsWith(folder.path + path.sep) || !["png", "jpg"].includes(row.format) || !Number.isFinite(Date.parse(row.captured_at))) continue;
      const id = createHash("sha256").update(folder.id + row.file_path).digest("hex");
      this.database.prepare("INSERT INTO photo_items(id,root_id,file_path,filename,mtime_ms,bytes,format,world_id,captured_at,date_source,album,caption,session_id,content_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(file_path) DO UPDATE SET album=excluded.album,caption=excluded.caption,session_id=excluded.session_id,content_hash=excluded.content_hash").run(id, folder.id, String(row.file_path).slice(0, 1200), path.basename(String(row.filename)).slice(0, 250), Number(row.mtime_ms) || 0, Math.max(0, Math.min(MAX_BYTES, Number(row.bytes) || 0)), row.format, /^wrld_[a-f0-9-]{36}$/iu.test(row.world_id) ? row.world_id : "", new Date(row.captured_at).toISOString(), row.date_source === "metadata" ? "metadata" : "file-modification", String(row.album || "").slice(0, 80), String(row.caption || "").slice(0, 500), String(row.session_id || "").slice(0, 200), /^[a-f0-9]{64}$/u.test(row.content_hash) ? row.content_hash : "");
    }
  }
  async exportCopies(ids, directory, { stripMetadata = true, hideFilenames = true } = {}) {
    const destination = await fs.realpath(directory); let copied = 0;
    for (const [index, id] of ids.slice(0, 500).entries()) {
      const item = await this.permittedFile(id);
      const input = await fs.readFile(item.file_path), output = stripMetadata ? stripImageMetadata(input) : input;
      const filename = hideFilenames ? `photo-${String(index + 1).padStart(4, "0")}-${randomUUID().slice(0, 8)}.${item.format}` : path.basename(item.filename);
      await fs.writeFile(path.join(destination, filename), output, { flag: "wx" }); copied += 1;
      await new Promise((resolve) => setImmediate(resolve));
    }
    return { copied };
  }
}

module.exports = { PhotoAtlas, imageParts, stripImageMetadata, readPhotoMetadata };
