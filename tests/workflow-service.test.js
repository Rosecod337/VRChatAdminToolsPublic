"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { DatabaseSync } = require("node:sqlite");
const { WorkflowService } = require("../apps/client/src/workflow-service");

test("workflow apps use an approved canonical file and never pass arbitrary arguments to a shell", async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), "vrchat-workflow-fixture-"));
  const database = new DatabaseSync(":memory:");
  const file = path.join(folder, "VRChat.exe"); await fs.writeFile(file, "MZ fixture executable; never actually run");
  const calls = [], service = new WorkflowService(database, { launch: async (...args) => { calls.push(args); return { started: true }; } });
  const app = await service.approve(file);
  assert.equal(service.list()[0].filePath, undefined);
  await service.run(app.id, "desktop");
  assert.deepEqual(calls[0], [await fs.realpath(file), ["--no-vr"]]);
  await assert.rejects(service.run("../unknown.exe"), /app_missing/u);
  const script = path.join(folder, "command.exe"); await fs.writeFile(script, "MZ");
  await assert.rejects(service.approve(script), /not_allowed/u);
  database.close();
});
test("preview mode does not launch an approved executable", async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), "vrchat-workflow-preview-"));
  const file = path.join(folder, "Discord.exe"); await fs.writeFile(file, "MZ fixture");
  const database = new DatabaseSync(":memory:"); let called = false;
  const service = new WorkflowService(database, { preview: true, launch: async () => { called = true; } });
  const app = await service.approve(file);
  assert.equal((await service.run(app.id)).preview, true);
  assert.equal(called, false); database.close();
});
