"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { DatabaseSync } = require("node:sqlite");
const { PersonalToolsStore, worldId } = require("../apps/client/src/personal-tools-store");

test("world plans preserve ordering and checklist state across export and import", () => {
  const database = new DatabaseSync(":memory:");
  const store = new PersonalToolsStore(database);
  const steps = Array.from({ length: 5 }, (_, index) => ({ title: `World ${index}`, worldId: `wrld_12345678-1234-1234-1234-123456789ab${index}`, checked: index === 2, minutes: 20 }));
  const route = store.save("routes", { name: "Evening", steps });
  route.payload.steps.reverse();
  store.save("routes", route);
  const copied = store.importItem(store.exportItem("routes", route.id));
  assert.notEqual(copied.id, route.id);
  assert.deepEqual(copied.payload.steps.map((step) => step.title), ["World 4", "World 3", "World 2", "World 1", "World 0"]);
  assert.equal(copied.payload.steps[2].checked, true);
  database.close();
});

test("imported attention rules are disabled and executable workflow fields cannot survive normalization", () => {
  const database = new DatabaseSync(":memory:");
  const store = new PersonalToolsStore(database);
  const rule = store.importItem({ format: "vrchat-personal-plan", version: 1, kind: "rules", item: { name: "Rule", payload: { enabled: true, conditions: [{ field: "eval", value: "alert(1)" }] } } });
  assert.equal(rule.payload.enabled, false);
  assert.equal(rule.payload.conditions[0].field, "type");
  const workflow = store.save("workflows", { name: "No shell", steps: [{ kind: "shell", target: "delete" }, { kind: "app", target: "../command.exe", args: ["--execute"] }] });
  assert.deepEqual(workflow.payload.steps, [{ kind: "app", target: "", vrMode: "vr", note: "" }]);
  database.close();
});

test("world IDs from allowed launch links drop private instance and unrelated URL data", () => {
  const id = "wrld_12345678-1234-1234-1234-123456789abc";
  assert.equal(worldId(`https://vrchat.com/home/launch?worldId=${id}&instanceId=private-instance`), id);
  assert.equal(worldId(`https://evil.example/home/world/${id}`), "");
});
