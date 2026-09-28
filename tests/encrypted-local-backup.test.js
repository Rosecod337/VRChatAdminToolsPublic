"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { finished } = require("node:stream/promises");
const { MAGIC, encryptBuffer, decryptBuffer, createEncryptedBackup, readEncryptedBackup } = require("../apps/client/src/encrypted-local-backup");

test("encrypted backup round-trips without storing notes as plaintext", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vrchat-encrypted-backup-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const payload = { format: "vrchat-admin-tools-local-backup", version: 1, sessions: [], note: "private memory" };
  const store = {
    async exportToWritable(output) {
      output.end(JSON.stringify(payload));
      await finished(output);
    }
  };
  const result = await createEncryptedBackup(store, directory, "test recovery phrase 12345");
  const disk = await fs.readFile(result.filePath);
  assert.ok(disk.subarray(0, MAGIC.length).equals(MAGIC));
  assert.equal(disk.includes(Buffer.from(payload.note)), false);
  assert.deepEqual(await readEncryptedBackup(result.filePath, "test recovery phrase 12345"), payload);
  await assert.rejects(readEncryptedBackup(result.filePath, "incorrect recovery phrase"), /backup_wrong_passphrase_or_damaged/u);
});

test("backup decrypt rejects changed ciphertext", async () => {
  const encrypted = await encryptBuffer(Buffer.from("local history"), "test recovery phrase 12345");
  encrypted[MAGIC.length + 30] ^= 1;
  await assert.rejects(decryptBuffer(encrypted, "test recovery phrase 12345"), /backup_wrong_passphrase_or_damaged/u);
});
