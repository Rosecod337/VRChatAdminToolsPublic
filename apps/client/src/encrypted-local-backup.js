"use strict";

const fs = require("node:fs/promises");
const { createWriteStream } = require("node:fs");
const path = require("node:path");
const { createCipheriv, createDecipheriv, randomBytes, scrypt } = require("node:crypto");
const { finished } = require("node:stream/promises");
const { promisify } = require("node:util");

const deriveKey = promisify(scrypt);
const MAGIC = Buffer.from("VRCBAK01", "ascii");
const HEADER_BYTES = MAGIC.length + 16 + 12;
const TAG_BYTES = 16;
const MAX_FILE_BYTES = 75 * 1024 * 1024;
const MAX_BACKUPS = 7;
const BACKUP_NAME = /^VRChat-Admin-Tools-\d{8}T\d{6}Z-[0-9a-f]{8}\.vrcbackup$/u;

function requirePassphrase(passphrase) {
  const value = String(passphrase || "");
  if (value.length < 12 || value.length > 256) throw new Error("backup_passphrase_length");
  return value;
}

async function keyFromPassphrase(passphrase, salt) {
  return deriveKey(requirePassphrase(passphrase), salt, 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
}

async function encryptBuffer(plain, passphrase) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await keyFromPassphrase(passphrase, salt);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  return Buffer.concat([MAGIC, salt, iv, cipher.update(plain), cipher.final(), cipher.getAuthTag()]);
}

async function decryptBuffer(encrypted, passphrase) {
  if (!Buffer.isBuffer(encrypted) || encrypted.length <= HEADER_BYTES + TAG_BYTES || !encrypted.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error("backup_invalid_format");
  }
  if (encrypted.length > MAX_FILE_BYTES) throw new Error("backup_file_too_large");
  const salt = encrypted.subarray(MAGIC.length, MAGIC.length + 16);
  const iv = encrypted.subarray(MAGIC.length + 16, HEADER_BYTES);
  const key = await keyFromPassphrase(passphrase, salt);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(encrypted.subarray(-TAG_BYTES));
  try {
    return Buffer.concat([decipher.update(encrypted.subarray(HEADER_BYTES, -TAG_BYTES)), decipher.final()]);
  } catch {
    throw new Error("backup_wrong_passphrase_or_damaged");
  }
}

async function createEncryptedBackup(store, directory, passphrase, uiSettings = {}) {
  if (!path.isAbsolute(directory)) throw new Error("backup_directory_invalid");
  const resolved = await fs.realpath(directory);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await keyFromPassphrase(passphrase, salt);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const stamp = new Date().toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}Z$/u, "");
  const fileName = `VRChat-Admin-Tools-${stamp}-${randomBytes(4).toString("hex")}.vrcbackup`;
  const finalPath = path.join(resolved, fileName);
  const temporaryPath = `${finalPath}.part`;
  let finalized = false;
  await fs.writeFile(temporaryPath, Buffer.concat([MAGIC, salt, iv]), { flag: "wx" });
  const output = createWriteStream(temporaryPath, { flags: "a" });
  const outputDone = finished(output);
  const cipherDone = finished(cipher);
  void outputDone.catch(() => {});
  void cipherDone.catch(() => {});
  output.on("error", (error) => cipher.destroy(error));
  cipher.pipe(output, { end: false });
  try {
    await store.exportToWritable(cipher, uiSettings);
    await cipherDone;
    output.end(cipher.getAuthTag());
    await outputDone;
    const size = (await fs.stat(temporaryPath)).size;
    if (size > MAX_FILE_BYTES) throw new Error("backup_file_too_large");
    await fs.rename(temporaryPath, finalPath);
    finalized = true;
    const verified = await readEncryptedBackup(finalPath, passphrase);
    if (verified?.format !== "vrchat-admin-tools-local-backup" || Number(verified.version) !== 1) throw new Error("backup_invalid_format");
    await pruneOldBackups(resolved).catch(() => {});
    return { ok: true, filePath: finalPath, bytes: size };
  } catch (error) {
    cipher.destroy();
    output.destroy();
    await fs.unlink(temporaryPath).catch(() => {});
    if (finalized) await fs.unlink(finalPath).catch(() => {});
    throw error;
  }
}

async function pruneOldBackups(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const ownFiles = entries.filter((entry) => entry.isFile() && BACKUP_NAME.test(entry.name)).map((entry) => entry.name).sort().reverse();
  for (const name of ownFiles.slice(MAX_BACKUPS)) await fs.unlink(path.join(directory, name));
}

async function readEncryptedBackup(filePath, passphrase) {
  const info = await fs.stat(filePath);
  if (!info.isFile() || info.size > MAX_FILE_BYTES) throw new Error("backup_file_too_large");
  const plain = await decryptBuffer(await fs.readFile(filePath), passphrase);
  try {
    return JSON.parse(plain.toString("utf8"));
  } catch {
    throw new Error("backup_invalid_format");
  }
}

module.exports = { MAGIC, MAX_FILE_BYTES, requirePassphrase, encryptBuffer, decryptBuffer, createEncryptedBackup, readEncryptedBackup };
