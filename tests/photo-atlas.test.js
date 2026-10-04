"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { DatabaseSync } = require("node:sqlite");
const { PhotoAtlas, imageParts, stripImageMetadata, readPhotoMetadata } = require("../apps/client/src/photo-atlas");

const PIXEL = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jD1kAAAAASUVORK5CYII=", "base64");
function taggedPng() {
  const text = Buffer.from('XML\0vrchat:worldId="wrld_12345678-1234-1234-1234-123456789abc" private-name secret-coordinate');
  const chunk = Buffer.alloc(text.length + 12); chunk.writeUInt32BE(text.length); chunk.write("tEXt", 4); text.copy(chunk, 8);
  return Buffer.concat([PIXEL.subarray(0, PIXEL.length - 12), chunk, PIXEL.subarray(PIXEL.length - 12)]);
}
test("photo export removes metadata while preserving compressed pixels and originals", async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), "vrchat-photo-atlas-"));
  const pictures = path.join(folder, "pictures"), output = path.join(folder, "output"); await fs.mkdir(pictures); await fs.mkdir(output);
  const input = taggedPng(), file = path.join(pictures, "private-name.png"); await fs.writeFile(file, input);
  const database = new DatabaseSync(":memory:"); database.exec("CREATE TABLE play_sessions(id TEXT PRIMARY KEY)");
  const atlas = new PhotoAtlas(database);
  await atlas.scan(await atlas.approveRoot(pictures));
  const listed = atlas.list(); assert.equal(listed.total, 1); assert.equal(listed.rows[0].world_id, "wrld_12345678-1234-1234-1234-123456789abc");
  atlas.annotate(listed.rows[0].id, { album: "Winter", caption: "My picture" });
  assert.equal(atlas.list({ album: "Winter" }).total, 1);
  assert.equal((await atlas.exportCopies([listed.rows[0].id], output)).copied, 1);
  const name = (await fs.readdir(output))[0]; assert.equal(name.includes("private-name"), false);
  const copied = await fs.readFile(path.join(output, name)); assert.equal(copied.includes(Buffer.from("secret-coordinate")), false);
  const pixels = (buffer) => imageParts(buffer).parts.filter((part) => part.type === "IDAT").map((part) => part.data.toString("hex"));
  assert.deepEqual(pixels(copied), pixels(input)); assert.deepEqual(await fs.readFile(file), input); database.close();
});
test("missing photo metadata stays unknown and malformed files are rejected", () => {
  const result = readPhotoMetadata(PIXEL, new Date("2026-10-01T12:00:00Z"));
  assert.equal(result.worldId, ""); assert.equal(result.dateSource, "file-modification");
  assert.throws(() => stripImageMetadata(PIXEL.subarray(0, 20)), /png_invalid/u);
});

test("JPEG export strips metadata between image scans and trailing data without changing entropy bytes", () => {
  const segment = (marker, data) => { const value = Buffer.alloc(data.length + 4); value[0]=255; value[1]=marker; value.writeUInt16BE(data.length + 2,2); data.copy(value,4); return value; };
  const scan = segment(218,Buffer.from([1,1,0,0,63,0])), pixels = Buffer.from([1,2,255,0,3,255,208,4]);
  const input = Buffer.concat([Buffer.from([255,216]), segment(225,Buffer.from("Exif private-before")), scan, pixels, segment(225,Buffer.from("XMP private-between")), scan, pixels, Buffer.from([255,217]), Buffer.from("private-trailer")]);
  const output = stripImageMetadata(input);
  for (const value of ["private-before","private-between","private-trailer"]) assert.equal(output.includes(Buffer.from(value)),false);
  assert.deepEqual(output,Buffer.concat([Buffer.from([255,216]),scan,pixels,scan,pixels,Buffer.from([255,217])]));
  assert.throws(()=>stripImageMetadata(input.subarray(0,20)), /jpeg_invalid/u);
});
