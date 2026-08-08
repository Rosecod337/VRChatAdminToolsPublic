(function exposeBetaAdminNotes(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.betaAdminNotes = api;
})(typeof globalThis === "object" ? globalThis : this, () => {
  const STATUS_OPTIONS = Object.freeze([
    { value: "ok", label: "Без отметки" },
    { value: "watch", label: "Наблюдение" },
    { value: "warned", label: "Предупреждён" },
    { value: "blocked elsewhere", label: "Заблокирован в другом месте" }
  ]);

  function cleanText(value, limit) {
    return String(value ?? "").trim().slice(0, limit);
  }

  function normalizeNote(row = {}, fallback = {}) {
    return {
      userId: cleanText(row.user_id || row.userId || fallback.userId, 80),
      displayName: cleanText(row.display_name || row.displayName || fallback.displayName, 120),
      status: cleanText(row.status || fallback.status || "ok", 40) || "ok",
      note: cleanText(row.note ?? fallback.note, 2000),
      updatedAt: cleanText(row.updated_at || row.updatedAt || fallback.updatedAt, 80),
      updatedByKey: cleanText(row.updated_by_key || row.updatedByKey || fallback.updatedByKey, 80),
      updatedByLabel: cleanText(row.updated_by_label || row.updatedByLabel || fallback.updatedByLabel, 120)
    };
  }

  function normalizeHistoryRow(row = {}) {
    return {
      id: cleanText(row.id, 80),
      visibility: row.visibility === "global" ? "global" : "team",
      previousStatus: cleanText(row.previous_status ?? row.previousStatus, 40),
      previousNote: cleanText(row.previous_note ?? row.previousNote, 2000),
      status: cleanText(row.status || "ok", 40) || "ok",
      note: cleanText(row.note, 2000),
      updatedAt: cleanText(row.updated_at || row.updatedAt, 80),
      updatedByKey: cleanText(row.updated_by_key || row.updatedByKey, 80),
      updatedByLabel: cleanText(row.updated_by_label || row.updatedByLabel, 120)
    };
  }

  function editorPayload(record, values = {}) {
    const normalized = normalizeNote({
      ...record,
      status: values.status ?? record?.status,
      note: values.note ?? record?.note
    });
    if (!normalized.userId) throw new Error("Игрок не выбран.");
    return {
      userId: normalized.userId,
      displayName: normalized.displayName,
      status: normalized.status,
      note: normalized.note
    };
  }

  function mergeSavedNote(notes, saved, fallback = {}) {
    const normalized = normalizeNote(saved, fallback);
    if (!normalized.userId) return Array.isArray(notes) ? [...notes] : [];
    return [normalized, ...(Array.isArray(notes) ? notes : []).filter((row) => normalizeNote(row).userId !== normalized.userId)];
  }

  return { STATUS_OPTIONS, normalizeNote, normalizeHistoryRow, editorPayload, mergeSavedNote };
});
