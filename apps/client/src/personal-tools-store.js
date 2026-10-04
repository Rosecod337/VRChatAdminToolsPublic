"use strict";

const { randomUUID } = require("node:crypto");

const KINDS = ["routes", "rules", "workflows", "reports"];
const WORLD_ID = /^wrld_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const safeText = (value, maximum = 800) => String(value || "").trim().slice(0, maximum);
const identifier = (value) => /^[a-z0-9_-]{1,100}$/iu.test(String(value || "")) ? String(value) : "";
const bounded = (value, minimum, maximum, fallback = minimum) => Number.isFinite(Number(value)) ? Math.min(maximum, Math.max(minimum, Number(value))) : fallback;
const clock = (value) => /^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(String(value || "")) ? String(value) : "";
const day = (value) => /^\d{4}-\d{2}-\d{2}$/u.test(String(value || "")) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0,10) === value ? value : "";

function worldId(value) {
  const text = safeText(value, 1000);
  if (WORLD_ID.test(text)) return text;
  try {
    const url = new URL(text);
    if (url.protocol !== "https:" || url.username || url.password || !["vrchat.com", "www.vrchat.com"].includes(url.hostname)) return "";
    const pathId = url.pathname.split("/").filter(Boolean).at(-1) || "";
    const candidate = WORLD_ID.test(pathId) ? pathId : url.searchParams.get("worldId") || "";
    return WORLD_ID.test(candidate) ? candidate : "";
  } catch { return ""; }
}

function normalizePersonalItem(kind, input = {}) {
  if (!KINDS.includes(kind)) throw new Error("personal_kind_invalid");
  const result = { id: identifier(input.id) || randomUUID(), name: safeText(input.name, 100) || "Новый план", payload: {} };
  const value = input.payload && typeof input.payload === "object" ? input.payload : input;
  if (kind === "routes") {
    result.payload.categories = (Array.isArray(value.categories) ? value.categories : []).slice(0, 12).map((label) => safeText(label, 40)).filter(Boolean);
    result.payload.steps = (Array.isArray(value.steps) ? value.steps : []).slice(0, 100).map((step) => ({
      id: identifier(step.id) || randomUUID(), worldId: worldId(step.worldId || step.url), title: safeText(step.title, 120),
      minutes: Math.round(bounded(step.minutes, 0, 240)), note: safeText(step.note), checked: step.checked === true, fallbackWorldId: worldId(step.fallbackWorldId)
    }));
  } else if (kind === "rules") {
    result.payload.enabled = value.enabled === true;
    result.payload.mode = value.mode === "any" ? "any" : "all";
    result.payload.delaySeconds = bounded(value.delaySeconds, 0, 300);
    result.payload.cooldownSeconds = bounded(value.cooldownSeconds, 5, 86400, 60);
    result.payload.windowSeconds = bounded(value.windowSeconds, 1, 600, 60);
    result.payload.quietStart = clock(value.quietStart);
    result.payload.quietEnd = clock(value.quietEnd);
    result.payload.conditions = (Array.isArray(value.conditions) ? value.conditions : []).slice(0, 10).map((clause) => {
      const field = ["type", "category", "userId", "displayName", "worldId", "worldName", "avatarId", "avatarName"].includes(clause.field) ? clause.field : "type";
      const operator = ["equals", "contains", "count-at-least"].includes(clause.operator) ? clause.operator : "equals";
      return { field, operator, value: safeText(clause.value, 200), count: Math.round(bounded(clause.count, 1, 100, 1)) };
    });
  } else if (kind === "workflows") {
    result.payload.steps = (Array.isArray(value.steps) ? value.steps : []).slice(0, 20).filter((step) => ["app", "workspace", "route", "check"].includes(step.kind)).map((step) => ({
      kind: step.kind, target: step.kind === "check" ? (["log", "account", "license"].includes(step.target) ? step.target : "log") : identifier(step.target),
      vrMode: step.vrMode === "desktop" ? "desktop" : "vr", note: safeText(step.note, 200)
    }));
  } else {
    result.payload.from = day(value.from);
    result.payload.to = day(value.to);
    result.payload.compareFrom = day(value.compareFrom);
    result.payload.compareTo = day(value.compareTo);
    result.payload.world = safeText(value.world, 120);
    result.payload.minimumMinutes = bounded(value.minimumMinutes, 0, 1440);
  }
  return result;
}

class PersonalToolsStore {
  constructor(database) {
    this.database = database;
    database.exec(`CREATE TABLE IF NOT EXISTS personal_items (
      id TEXT NOT NULL, kind TEXT NOT NULL, name TEXT NOT NULL, payload TEXT NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(kind,id)
    ); CREATE INDEX IF NOT EXISTS personal_items_updated ON personal_items(kind,updated_at);`);
  }

  list(kind) {
    if (!KINDS.includes(kind)) throw new Error("personal_kind_invalid");
    return this.database.prepare("SELECT * FROM personal_items WHERE kind=? ORDER BY updated_at DESC LIMIT 100").all(kind).map((row) => {
      let payload = {}; try { payload = JSON.parse(row.payload); } catch { /* Corrupt records stay inspectable. */ }
      return { id: row.id, name: row.name, payload, createdAt: row.created_at, updatedAt: row.updated_at };
    });
  }

  save(kind, input) {
    const item = normalizePersonalItem(kind, input);
    const exists = this.database.prepare("SELECT 1 FROM personal_items WHERE kind=? AND id=?").get(kind, item.id);
    if (!exists && Number(this.database.prepare("SELECT COUNT(*) AS n FROM personal_items WHERE kind=?").get(kind).n) >= 100) throw new Error("personal_items_limit");
    const now = new Date().toISOString();
    this.database.prepare("INSERT INTO personal_items(kind,id,name,payload,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET name=excluded.name,payload=excluded.payload,updated_at=excluded.updated_at").run(kind, item.id, item.name, JSON.stringify(item.payload), now, now);
    return this.list(kind).find((row) => row.id === item.id);
  }

  remove(kind, id) {
    if (!KINDS.includes(kind) || !identifier(id)) throw new Error("personal_item_invalid");
    return { removed: Number(this.database.prepare("DELETE FROM personal_items WHERE kind=? AND id=?").run(kind, id).changes) };
  }

  exportItem(kind, id) {
    const item = this.list(kind).find((row) => row.id === id);
    if (!item) throw new Error("personal_item_missing");
    return { format: "vrchat-personal-plan", version: 1, kind, item };
  }

  importItem(payload) {
    if (payload?.format !== "vrchat-personal-plan" || payload.version !== 1 || !KINDS.includes(payload.kind)) throw new Error("personal_import_invalid");
    // Imported automation is always disabled and never runs during import.
    const item = normalizePersonalItem(payload.kind, { ...payload.item, id: randomUUID() });
    if (payload.kind === "rules") item.payload.enabled = false;
    return { ...this.save(payload.kind, item), kind: payload.kind };
  }
}

module.exports = { PersonalToolsStore, normalizePersonalItem, worldId, KINDS };
