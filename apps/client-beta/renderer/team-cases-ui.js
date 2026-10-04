"use strict";

(function installTeamCases(root) {
  let selected = "", current = null, query = "", offset = 0, historyOffset = 0;
  root.betaPersonalTools.register("cases", async (body, helpers) => {
    const { api, make, field, button, message, text, refresh } = helpers;
    const list = await api.teamCaseAction("list", { query, offset });
    if (helpers.automatic && helpers.context.isEditing?.()) return;
    if (root.betaPersonalTools.getTab() !== "cases") return;
    const layout = make("div", "personalPlanLayout"), sidebar = make("aside", "panel personalPlanList"), editor = make("section", "panel personalPlanEditor");
    sidebar.append(button("Новый случай", () => { selected = ""; current = null; historyOffset = 0; return showEditor(); }));
    sidebar.append(field("Поиск случаев", query, (value) => { query = value; offset = 0; }, { maximum: 100 }), button("Найти", refresh));
    for (const item of list.cases) sidebar.append(button(`${item.title} · ${item.status}`, async () => { selected = item.id; historyOffset = 0; current = await api.teamCaseAction("detail", { id: selected }); showEditor(); }));
    const previous = button("Предыдущие", () => { offset = Math.max(0, offset - 50); return refresh(); }); previous.disabled = offset === 0;
    const next = button("Следующие", () => { offset += 50; return refresh(); }); next.disabled = !list.more;
    sidebar.append(previous, next);
    layout.append(sidebar, editor); body.replaceChildren(layout);
    if (selected) { current = await api.teamCaseAction("detail", { id: selected, historyOffset }); showEditor(); } else showEditor();

    function showEditor() {
      editor.replaceChildren(make("h3", "", "Командный журнал случаев"), make("p", "mutedText", "Видны только случаи вашей команды. Решение требует другого ключа-проверяющего; журнал сам не применяет наказания."));
      if (!current) {
        const value = { title: "", subjectId: "", description: "", dueAt: "" };
        editor.append(field("Название случая", value.title, (input) => { value.title = input; }, { maximum: 150, attribute: "data-case-title" }), field("User ID или метка", value.subjectId, (input) => { value.subjectId = input; }, { maximum: 100 }), field("Описание и источник", value.description, (input) => { value.description = input; }, { multiline: true, maximum: 8000 }), field("Срок рассмотрения", value.dueAt, (input) => { value.dueAt = input; }, { type: "datetime-local" }));
        editor.append(button("Создать случай", async () => { const result = await api.teamCaseAction("create", { case: { ...value, dueAt: value.dueAt ? new Date(value.dueAt).toISOString() : null } }); selected = result.case.id; await refresh(); }, "data-case-create")); return;
      }
      const item = current.case;
      editor.append(make("h3", "", item.title), make("p", "", item.description), make("p", "mutedText", `${text("Статус")}: ${item.status} · ${text("Срок")}: ${item.due_at || "—"}`));
      if ([item.created_by, item.reviewer_id].includes(current.actorId)) {
        const edit = make("details", "personalRouteStep"); edit.append(make("summary", "", "Изменить карточку и срок"));
        const change = { title: item.title, subjectId: item.subject_id, description: item.description, dueAt: item.due_at ? new Date(new Date(item.due_at).getTime() - new Date(item.due_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "" };
        edit.append(field("Название случая", change.title, (value) => { change.title = value; }, { maximum: 150 }), field("Описание и источник", change.description, (value) => { change.description = value; }, { multiline: true, maximum: 8000 }), field("Срок рассмотрения", change.dueAt, (value) => { change.dueAt = value; }, { type: "datetime-local", attribute: "data-case-due" }), button("Сохранить изменения", async () => { await api.teamCaseAction("update", { id: selected, action: "edit", case: { ...change, dueAt: change.dueAt ? new Date(change.dueAt).toISOString() : null } }); await refresh(); }, "data-case-edit"));
        editor.append(edit);
      }
      let detail = "", evidenceTitle = "", evidenceContent = "";
      editor.append(field("Комментарий, решение или апелляция", detail, (value) => { detail = value; }, { multiline: true, maximum: 8000, attribute: "data-case-note" }));
      const actions = make("div", "personalPlanActions");
      for (const [action, label] of [["note", "Добавить заметку"], ["review", "Взять на проверку"], ["decide", "Сохранить решение"], ["appeal", "Добавить апелляцию"], ["return", "Вернуть на рассмотрение"], ["close", "Закрыть случай"]]) actions.append(button(label, async () => {
        try { await api.teamCaseAction("update", { id: selected, action, detail }); await refresh(); }
        catch (error) { const value = String(error.message || ""); message(value.includes("reviewer") ? "Требуется другой ключ-проверяющий этой команды." : value.includes("transition") ? "Это действие недоступно в текущем статусе." : value, true); }
      }, `data-case-${action}`)); editor.append(actions);
      editor.append(make("h3", "", "Доказательства"), make("p", "mutedText", "До 100 доказательств по 16 КБ. Текст или JSON отчёта сохраняется только в вашей команде."), field("Название доказательства", evidenceTitle, (value) => { evidenceTitle = value; }, { maximum: 150 }), field("Отчёт или описание доказательства", evidenceContent, (value) => { evidenceContent = value; }, { multiline: true, maximum: 16000 }));
      editor.append(button("Добавить доказательство", async () => { await api.teamCaseAction("evidence", { id: selected, title: evidenceTitle, content: evidenceContent }); await refresh(); }), button("Приложить файл отчёта", async () => { await api.attachCaseReport(selected); await refresh(); }));
      for (const evidence of current.evidence) { const row = make("details", "personalRouteStep"); row.append(make("summary", "", evidence.title), make("pre", "caseEvidenceText", evidence.content)); editor.append(row); }
      editor.append(make("h3", "", "История решений"));
      for (const event of current.history) editor.append(make("p", "personalRouteStep", `${event.created_at} · ${event.actor_label} · ${event.action}\n${event.detail}`));
      if (historyOffset || current.historyMore) {
        const newer = button("Предыдущие", () => { historyOffset = Math.max(0, historyOffset - 500); return refresh(); }); newer.disabled = historyOffset === 0;
        const older = button("Следующие", () => { historyOffset += 500; return refresh(); }); older.disabled = !current.historyMore; editor.append(newer, older);
      }
    }
  });
})(window);
