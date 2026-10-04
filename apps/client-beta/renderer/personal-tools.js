"use strict";

(function installPersonalTools(root) {
  const document = root.document;
  const panel = document.querySelector('[data-view="personal-tools"]');
  document.querySelector(".workspace")?.append(panel);
  const body = panel.querySelector("[data-personal-body]");
  const status = panel.querySelector("[data-personal-status]");
  let api, translate = (value) => value, context = {};
  let tab = "routes", items = [], draft = null, busy = false;
  let applications = [], workflowRoutes = [], workflowResults = [];
  let automatic = false;
  const renderers = new Map();
  const refreshers = new Map();
  const text = (value) => translate(value);
  const make = (tag, className = "", label = "") => {
    const node = document.createElement(tag); node.className = className; node.textContent = text(label); return node;
  };
  function message(value, error = false) { status.textContent = text(value); status.classList.toggle("error", error); }
  async function operation(callback) {
    if (busy) return;
    busy = true; panel.setAttribute("aria-busy", "true");
    const controls = [...panel.querySelectorAll("button,input,select,textarea")].filter((node) => !node.disabled);
    controls.forEach((node) => { node.disabled = true; });
    try { return await callback(); }
    catch (error) {
      const raw = String(error.message || "");
      const failure = raw.includes("personal_paid_key_required") ? "Нужен активный платный ключ." : /HTTP 404|Cannot POST/u.test(raw) ? "Командный журнал пока недоступен на сервере. Остальные инструменты работают." : /HTTP|fetch|network|ECONN/iu.test(raw) ? "Не удалось получить данные. Повторим автоматически после восстановления связи." : raw || "Не удалось выполнить операцию.";
      message(failure, true);
      if (tab === "cases") body.replaceChildren(make("p", "panel emptyState", failure));
    } finally { busy = false; panel.removeAttribute("aria-busy"); controls.forEach((node) => { if (node.isConnected) node.disabled = false; }); }
  }
  const call = (action, input = {}) => api.personalAction(action, input);
  function button(label, callback, attribute = "") {
    const node = make("button", "", label); node.type = "button";
    if (attribute) node.setAttribute(attribute, "");
    node.addEventListener("click", () => { void operation(callback); }); return node;
  }
  function field(label, value, callback, options = {}) {
    const wrapper = make("label", "adminField"); wrapper.append(make("span", "", label));
    const input = document.createElement(options.multiline ? "textarea" : "input");
    if (!options.multiline) input.type = options.type || "text";
    input.value = value ?? ""; input.maxLength = options.maximum || 800;
    input.defaultValue = input.value;
    if (options.attribute) input.setAttribute(options.attribute, "");
    input.addEventListener("input", () => callback(options.type === "number" ? Number(input.value) : input.value));
    wrapper.append(input); return wrapper;
  }
  function newDraft() {
    draft = tab === "rules"
      ? { name: text("Новое правило"), payload: { enabled: false, mode: "all", delaySeconds: 0, cooldownSeconds: 60, windowSeconds: 60, quietStart: "", quietEnd: "", conditions: [{ field: "type", operator: "equals", value: "player-joined", count: 1 }] } }
      : tab === "workflows" ? { name: text("Новый сценарий"), payload: { steps: [{ kind: "check", target: "license", note: "" }] } }
      : tab === "reports" ? { name: text("Новый отчёт"), payload: { from: "", to: "", compareFrom: "", compareTo: "", world: "", minimumMinutes: 0 } }
      : { name: text("Новый маршрут"), payload: { steps: [], categories: [] } };
    render();
  }
  async function load(selectId = draft?.id) {
    items = await call("list", { kind: tab });
    if (tab === "workflows") [applications, workflowRoutes] = await Promise.all([call("applications"), call("list", { kind: "routes" })]);
    draft = items.find((item) => item.id === selectId) || items[0] || null;
    if (draft) draft = structuredClone(draft);
    render();
  }
  async function save() {
    const saved = await call("save", { kind: tab, item: draft });
    await load(saved.id); message("План сохранён."); return saved;
  }
  async function importPlan() {
    const result = await call("import");
    if (result?.canceled) return;
    tab = result.kind || tab;
    panel.querySelectorAll("[data-personal-tab]").forEach((item) => { item.classList.toggle("active", item.dataset.personalTab === tab); item.setAttribute("aria-selected", String(item.dataset.personalTab === tab)); });
    await load(result.id);
  }
  function render() {
    if (renderers.has(tab)) return renderers.get(tab)(body, { api, call, make, field, button, operation, message, text, context, automatic, refresh: render });
    if (tab === "rules") { renderRules(); return; }
    if (tab === "workflows") { renderWorkflow(); return; }
    if (tab === "reports") { renderReport(); return; }
    if (tab !== "routes") { body.replaceChildren(make("p", "emptyState", "Этот раздел ещё не подключён.")); return; }
    const layout = make("div", "personalPlanLayout");
    const list = make("aside", "panel personalPlanList");
    list.append(button("Новый маршрут", newDraft, "data-plan-new"), button("Импорт плана", importPlan, "data-plan-import"));
    for (const item of items) {
      const select = button(item.name, () => { draft = structuredClone(item); render(); }, "data-plan-select");
      select.dataset.planId = item.id; select.classList.toggle("active", draft?.id === item.id); list.append(select);
    }
    const editor = make("section", "panel personalPlanEditor");
    layout.append(list, editor); body.replaceChildren(layout);
    if (!draft) { editor.append(make("p", "emptyState", "Создайте маршрут для следующего вечера.")); return; }
    editor.append(make("h3", "", "Маршрут по мирам"));
    editor.append(field("Название", draft.name, (value) => { draft.name = value; }, { maximum: 100, attribute: "data-route-name" }));
    editor.append(field("Категории через запятую", (draft.payload.categories || []).join(", "), (value) => { draft.payload.categories = value.split(",").map((part) => part.trim()).filter(Boolean); }));
    const actions = make("div", "personalPlanActions");
    actions.append(button("Сохранить", save, "data-plan-save"), button("Добавить мир", () => {
      draft.payload.steps.push({ id: root.crypto.randomUUID(), title: "", worldId: "", minutes: 20, note: "", checked: false, fallbackWorldId: "" }); render();
    }, "data-route-add"));
    if (draft.id) {
      actions.append(button("Экспорт", async () => { await save(); await call("export", { kind: tab, id: draft.id }); }, "data-plan-export"));
      actions.append(button("Удалить", async () => {
        if (!root.confirm(text("Удалить выбранный план?"))) return;
        await call("remove", { kind: tab, id: draft.id }); await load("");
      }, "data-plan-delete"));
    }
    editor.append(actions);
    const summary = make("p", "mutedText", `${draft.payload.steps.length} ${text("миров")} · ${draft.payload.steps.reduce((sum, step) => sum + Number(step.minutes || 0), 0)} ${text("минут по плану")}`);
    editor.append(summary);
    const steps = make("ol", "personalRouteSteps");
    draft.payload.steps.forEach((step, index) => {
      const row = make("li", "personalRouteStep"); row.dataset.routeStep = String(index);
      const heading = make("div", "personalStepHeading");
      const done = make("label"); const check = document.createElement("input"); check.type = "checkbox"; check.checked = step.checked;
      check.setAttribute("data-route-done", "");
      check.addEventListener("change", () => { step.checked = check.checked; void operation(save); });
      done.append(check, make("span", "", `${index + 1}. ${step.title || text("Мир")}`)); heading.append(done); row.append(heading);
      const fields = make("div", "personalStepFields");
      fields.append(field("Название мира", step.title, (value) => { step.title = value; }, { maximum: 120, attribute: "data-route-title" }), field("World ID или ссылка", step.worldId, (value) => { step.worldId = value; }, { attribute: "data-route-world" }));
      fields.append(field("Длительность, минут", step.minutes, (value) => { step.minutes = value; }, { type: "number" }), field("Запасной World ID", step.fallbackWorldId, (value) => { step.fallbackWorldId = value; }));
      fields.append(field("Заметка ведущего", step.note, (value) => { step.note = value; }, { multiline: true })); row.append(fields);
      const controls = make("div", "personalStepControls");
      const up = button("Выше", () => { [draft.payload.steps[index - 1], draft.payload.steps[index]] = [step, draft.payload.steps[index - 1]]; render(); }, "data-route-up"); up.disabled = index === 0;
      const down = button("Ниже", () => { [draft.payload.steps[index + 1], draft.payload.steps[index]] = [step, draft.payload.steps[index + 1]]; render(); }, "data-route-down"); down.disabled = index === draft.payload.steps.length - 1;
      controls.append(up, down, button("Убрать", () => { draft.payload.steps.splice(index, 1); render(); }));
      const open = button("Открыть мир", () => call("open-world", { worldId: step.worldId }), "data-route-open"); open.disabled = !step.worldId;
      controls.append(open);
      if (step.fallbackWorldId) controls.append(button("Запасной мир", () => call("open-world", { worldId: step.fallbackWorldId })));
      row.append(controls); steps.append(row);
    });
    editor.append(steps, make("p", "mutedText", "Открывается страница мира. Доступ к закрытому миру или инстансу не гарантируется; отметки посещения ставятся вручную."));
  }
  async function open(bridge, options = {}) {
    api = bridge; translate = options.translate || ((value) => value); context = options;
    if (!options.paid) { body.replaceChildren(make("p", "emptyState", "Нужен активный платный ключ.")); return; }
    if (!api.personalAction) { message("Личные инструменты доступны в Electron-приложении.", true); return; }
    await operation(() => ["routes", "rules", "workflows", "reports"].includes(tab) ? load() : render());
  }
  panel.querySelectorAll("[data-personal-tab]").forEach((node) => {
    node.addEventListener("click", () => {
      if (busy) return;
      tab = node.dataset.personalTab; draft = null;
      message(""); body.replaceChildren(make("p", "emptyState", "Загружаем данные…"));
      panel.querySelectorAll("[data-personal-tab]").forEach((item) => { item.classList.toggle("active", item === node); item.setAttribute("aria-selected", String(item === node)); });
      void operation(() => ["routes", "rules", "workflows", "reports"].includes(tab) ? load() : render());
    });
  });
  root.betaPersonalTools = { open, register: (kind, renderer) => renderers.set(kind, renderer), getTab: () => tab,
    registerAutoRefresh: (kind, callback) => refreshers.set(kind, callback),
    async autoRefresh() {
      if (busy) return;
      if (refreshers.has(tab)) return refreshers.get(tab)();
      if (tab === "photos" || tab === "cases") {
        automatic = true;
        try { await render(); message(""); }
        catch (error) { message("Не удалось получить данные. Повторим автоматически после восстановления связи.", true); throw error; }
        finally { automatic = false; }
      }
    }
  };

  function selectField(label, value, options, callback) {
    const wrapper = make("label", "adminField"); wrapper.append(make("span", "", label));
    const select = document.createElement("select");
    for (const [key, title] of options) select.add(new Option(text(title), key));
    select.value = value; select.addEventListener("change", () => callback(select.value)); wrapper.append(select); return wrapper;
  }

  function renderRules() {
    const layout = make("div", "personalPlanLayout"), list = make("aside", "panel personalPlanList"), editor = make("section", "panel personalPlanEditor");
    list.append(button("Новое правило", newDraft, "data-rule-new"), button("Импорт плана", importPlan, "data-plan-import"));
    for (const item of items) {
      const select = button(`${item.payload.enabled ? "● " : "○ "}${item.name}`, () => { draft = structuredClone(item); render(); });
      select.classList.toggle("active", draft?.id === item.id); list.append(select);
    }
    layout.append(list, editor); body.replaceChildren(layout);
    if (!draft) { editor.append(make("p", "emptyState", "Создайте правило для наблюдаемых событий.")); return; }
    const rule = draft.payload;
    editor.append(make("h3", "", "Правило внимания"), field("Название", draft.name, (value) => { draft.name = value; }, { maximum: 100, attribute: "data-rule-name" }));
    const enabled = make("label", "checkRow"); const toggle = document.createElement("input"); toggle.type = "checkbox"; toggle.checked = rule.enabled;
    toggle.setAttribute("data-rule-enabled", ""); toggle.addEventListener("change", () => { rule.enabled = toggle.checked; }); enabled.append(toggle, make("span", "", "Правило включено")); editor.append(enabled);
    editor.append(selectField("Условия", rule.mode, [["all", "Все одновременно (AND)"], ["any", "Хотя бы одно (OR)"]], (value) => { rule.mode = value; }));
    const clauses = make("div", "personalRouteSteps");
    rule.conditions.forEach((clause, index) => {
      const row = make("div", "personalRouteStep"); row.dataset.ruleClause = String(index);
      row.append(selectField("Поле события", clause.field, [["type", "Тип события"], ["category", "Категория"], ["userId", "User ID"], ["displayName", "Имя игрока"], ["worldId", "World ID"], ["worldName", "Название мира"], ["avatarId", "Avatar ID"], ["avatarName", "Название аватара"]], (value) => { clause.field = value; }));
      row.append(selectField("Проверка", clause.operator, [["equals", "Равно"], ["contains", "Содержит"], ["count-at-least", "Не менее N событий"]], (value) => { clause.operator = value; render(); }));
      row.append(field("Значение", clause.value, (value) => { clause.value = value; }, { maximum: 200, attribute: "data-rule-value" }));
      if (clause.operator === "count-at-least") row.append(field("Количество событий", clause.count, (value) => { clause.count = value; }, { type: "number" }));
      row.append(button("Убрать", () => { rule.conditions.splice(index, 1); render(); })); clauses.append(row);
    });
    editor.append(clauses, button("Добавить условие", () => { if (rule.conditions.length < 10) rule.conditions.push({ field: "type", operator: "equals", value: "", count: 1 }); render(); }, "data-rule-add"));
    const times = make("div", "personalStepFields");
    times.append(field("Задержка, секунд", rule.delaySeconds, (value) => { rule.delaySeconds = value; }, { type: "number" }), field("Между уведомлениями, секунд", rule.cooldownSeconds, (value) => { rule.cooldownSeconds = value; }, { type: "number" }));
    times.append(field("Период серии, секунд", rule.windowSeconds, (value) => { rule.windowSeconds = value; }, { type: "number" }), field("Тихие часы с", rule.quietStart, (value) => { rule.quietStart = value; }, { type: "time" }), field("Тихие часы до", rule.quietEnd, (value) => { rule.quietEnd = value; }, { type: "time" }));
    editor.append(times, make("p", "mutedText", "Только наблюдаемые локальные события. Время тихих часов берётся с этого устройства. Правило не отправляет сообщения людям и не применяет наказания."));
    const actions = make("div", "personalPlanActions"); actions.append(button("Сохранить", save, "data-plan-save"));
    const simulation = make("div", "personalRuleSimulation"); simulation.setAttribute("data-rule-simulation", "");
    let sessionId = "";
    const history = make("div", "personalPlanActions");
    history.append(button("Выбрать сохранённую сессию", async () => {
      const sessions = await call("rule-sessions");
      const select = document.createElement("select"); select.dataset.ruleSession = ""; select.add(new Option(text("Текущая сессия"), ""));
      for (const session of sessions) select.add(new Option(session.name, session.id));
      select.addEventListener("change", () => { sessionId = select.value; }); history.replaceChildren(select);
    }, "data-rule-session-chooser"));
    actions.append(button("Проверить на истории", async () => {
      const result = await call("simulate-rule", { item: draft, sessionId, events: context.events?.() || [] });
      simulation.replaceChildren(make("p", "", `${text("Событий проверено")}: ${result.inputEvents} · ${text("Срабатываний")}: ${result.matches.length}`));
      for (const match of result.matches.slice(-20)) {
        const row = make("div", "personalRouteStep"); row.append(make("strong", "", new Date(match.at).toLocaleString()));
        for (const explanation of match.explanations) row.append(make("p", "mutedText", `${explanation.field}: ${explanation.actual || "—"} · ${explanation.operator} · ${explanation.expected}${explanation.operator === "count-at-least" ? ` (${explanation.count})` : ""}`));
        simulation.append(row);
      }
    }, "data-rule-simulate"));
    if (draft.id) actions.append(button("Экспорт", async () => { await save(); return call("export", { kind: "rules", id: draft.id }); }), button("Удалить", async () => { if (!root.confirm(text("Удалить выбранный план?"))) return; await call("remove", { kind: "rules", id: draft.id }); await load(""); }));
    editor.append(history, actions, simulation);
  }

  function renderWorkflow() {
    const layout = make("div", "personalPlanLayout"), list = make("aside", "panel personalPlanList"), editor = make("section", "panel personalPlanEditor");
    list.append(button("Новый сценарий", newDraft, "data-workflow-new"), button("Импорт плана", importPlan, "data-plan-import"));
    for (const item of items) { const select = button(item.name, () => { draft = structuredClone(item); render(); }); select.classList.toggle("active", draft?.id === item.id); list.append(select); }
    layout.append(list, editor); body.replaceChildren(layout);
    if (!draft) { editor.append(make("p", "emptyState", "Подготовьте сценарий для стрима или обычного вечера.")); return; }
    editor.append(make("h3", "", "Подготовка сессии"), field("Название", draft.name, (value) => { draft.name = value; }, { maximum: 100, attribute: "data-workflow-name" }));
    editor.append(button("Выбрать установленное приложение", async () => { await call("choose-app"); applications = await call("applications"); render(); }, "data-workflow-choose-app"));
    editor.append(make("p", "mutedText", "Разрешены VRChat, Discord, OBS, Steam и VRCX. Вы выбираете установленный exe сами. Импорт не запускает программы и не добавляет разрешённые пути."));
    const steps = make("ol", "personalRouteSteps");
    draft.payload.steps.forEach((step, index) => {
      const row = make("li", "personalRouteStep"); row.dataset.workflowStep = String(index);
      row.append(selectField("Действие", step.kind, [["app", "Запустить приложение"], ["workspace", "Открыть рабочее место"], ["route", "Открыть маршрут"], ["check", "Проверить готовность"]], (value) => { step.kind = value; step.target = value === "check" ? "log" : ""; render(); }));
      const targets = step.kind === "app" ? applications.map((item) => [item.id, item.name]) : step.kind === "workspace" ? (context.workspaces?.() || []).map((item) => [item.id, item.name]) : step.kind === "route" ? workflowRoutes.map((item) => [item.id, item.name]) : [["log", "Доступен лог"], ["account", "Сессия VRChat сохранена"], ["license", "Активный ключ"]];
      row.append(selectField("Выбор", step.target, [["", "Выберите"], ...targets], (value) => { step.target = value; }));
      if (step.kind === "app") row.append(selectField("Режим VRChat", step.vrMode || "vr", [["vr", "Обычный запуск"], ["desktop", "Без VR"]], (value) => { step.vrMode = value; }));
      row.append(field("Заметка", step.note || "", (value) => { step.note = value; }, { maximum: 200 }));
      const actions = make("div", "personalStepControls");
      const up = button("Выше", () => { [draft.payload.steps[index - 1], draft.payload.steps[index]] = [step, draft.payload.steps[index - 1]]; render(); }); up.disabled = index === 0;
      const down = button("Ниже", () => { [draft.payload.steps[index + 1], draft.payload.steps[index]] = [step, draft.payload.steps[index + 1]]; render(); }); down.disabled = index === draft.payload.steps.length - 1;
      actions.append(up, down, button("Убрать", () => { draft.payload.steps.splice(index, 1); render(); })); row.append(actions); steps.append(row);
    });
    editor.append(steps, button("Добавить шаг", () => { if (draft.payload.steps.length < 20) draft.payload.steps.push({ kind: "check", target: "log", note: "" }); render(); }, "data-workflow-add"));
    const actions = make("div", "personalPlanActions");
    actions.append(button("Сохранить", save, "data-plan-save"), button("Выполнить сценарий", runWorkflow, "data-workflow-run"));
    if (draft.id) actions.append(button("Экспорт", () => call("export", { kind: "workflows", id: draft.id })), button("Удалить", async () => { if (!root.confirm(text("Удалить выбранный план?"))) return; await call("remove", { kind: "workflows", id: draft.id }); await load(""); }));
    editor.append(actions);
    const results = make("div", "personalWorkflowResults"); results.setAttribute("data-workflow-results", "");
    for (const result of workflowResults) results.append(make("p", "", result)); editor.append(results);
  }

  async function runWorkflow() {
    if (!draft.payload.steps.length) return;
    if (!root.confirm(text("Выполнить показанные шаги? Приложения будут запущены только из ранее выбранных путей."))) return;
    const plan = structuredClone(draft);
    const workspaces = context.workspaces?.() || [];
    for (const step of plan.payload.steps) {
      if (!step.target) throw new Error(text("Выберите цель для каждого шага."));
      if (step.kind === "app" && !applications.some((item) => item.id === step.target)) throw new Error(text("Приложение не найдено."));
      if (step.kind === "workspace" && !workspaces.some((item) => item.id === step.target)) throw new Error(text("Рабочее место не найдено."));
      if (step.kind === "route" && !workflowRoutes.some((item) => item.id === step.target)) throw new Error(text("Маршрут не найден."));
    }
    workflowResults = [];
    let cancelled = false;
    const stop = make("button", "", "Остановить следующие шаги"); stop.type = "button";
    stop.addEventListener("click", () => { cancelled = true; stop.disabled = true; });
    panel.querySelector("[data-workflow-results]")?.append(stop);
    try {
    for (const [index, step] of plan.payload.steps.entries()) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (cancelled) { render(); message("Сценарий остановлен. Запущенные приложения остаются открытыми."); return; }
      if (!step.target) throw new Error(text("Выберите цель для каждого шага."));
      if (step.kind === "app") {
        const result = await call("launch-app", { id: step.target, vrMode: step.vrMode });
        workflowResults.push(`${index + 1}. ${result.name}: ${text(result.preview ? "Просмотр: запуск пропущен" : "Запущено")}`);
      } else if (step.kind === "check") {
        const result = await call("check", { target: step.target });
        workflowResults.push(`${index + 1}. ${text(result.label)}: ${text(result.ok ? "Готово" : "Не готово")}`);
        if (!result.ok) { render(); message("Проверка не пройдена. Следующие шаги не выполнялись.", true); return; }
      } else if (step.kind === "workspace") {
        if (!(context.workspaces?.() || []).some((item) => item.id === step.target)) throw new Error(text("Рабочее место не найдено."));
        context.openWorkspace?.(step.target); workflowResults.push(`${index + 1}. ${text("Рабочее место открыто")}`);
      } else if (step.kind === "route") {
        const route = workflowRoutes.find((item) => item.id === step.target);
        if (!route) throw new Error(text("Маршрут не найден."));
        tab = "routes"; items = await call("list", { kind: "routes" }); draft = structuredClone(route);
        panel.querySelectorAll("[data-personal-tab]").forEach((item) => { item.classList.toggle("active", item.dataset.personalTab === "routes"); item.setAttribute("aria-selected", String(item.dataset.personalTab === "routes")); });
        context.showTools?.();
        workflowResults.push(`${index + 1}. ${text("Маршрут подготовлен")}: ${route.name}`);
      }
    }
    render(); message("Сценарий завершён."); context.notify?.("Сценарий завершён.");
    } catch (error) { render(); throw error; }
    finally { stop.remove(); }
  }

  function renderReport() {
    const layout = make("div", "personalPlanLayout"), list = make("aside", "panel personalPlanList"), editor = make("section", "panel personalPlanEditor");
    list.append(button("Новый отчёт", newDraft, "data-report-new"), button("Импорт плана", importPlan, "data-plan-import"));
    for (const item of items) list.append(button(item.name, () => { draft = structuredClone(item); render(); }));
    layout.append(list, editor); body.replaceChildren(layout);
    if (!draft) { editor.append(make("p", "emptyState", "Сохраните фильтры для сравнения собственной активности.")); return; }
    editor.append(make("h3", "", "Личный отчёт"), field("Название", draft.name, (value) => { draft.name = value; }, { maximum: 100 }));
    const filters = make("div", "personalStepFields");
    for (const [key, label] of [["from", "Период с"], ["to", "Период до"], ["compareFrom", "Сравнить с"], ["compareTo", "Сравнить до"]]) filters.append(field(label, draft.payload[key], (value) => { draft.payload[key] = value; }, { type: "date" }));
    filters.append(field("Мир содержит", draft.payload.world, (value) => { draft.payload.world = value; }), field("Минимум минут", draft.payload.minimumMinutes, (value) => { draft.payload.minimumMinutes = value; }, { type: "number" }));
    editor.append(filters);
    const results = make("div", "personalReportResult"); results.setAttribute("data-report-result", "");
    const actions = make("div", "personalPlanActions");
    actions.append(button("Построить отчёт", async () => {
      const report = await call("report", { filters: draft.payload });
      results.replaceChildren();
      const metrics = make("div", "metricGrid");
      for (const [label, value] of [["Сессий", report.current.sessionCount], ["Известная длительность, минут", Math.round(report.current.knownMinutes)], ["Разных названий миров", report.current.uniqueWorldCount], ["Дней с наблюдениями", report.current.observedDays]]) { const card = button("", () => showReportSessions(label === "Известная длительность, минут" ? report.current.sessions.filter((row) => row.minutes !== null) : report.current.sessions, results)); card.append(make("span", "", label), make("strong", "", String(value))); metrics.append(card); }
      results.append(metrics, make("p", "mutedText", `${text("Незавершённых сессий")}: ${report.current.incompleteSessions} · ${report.timezone}`));
      if (report.difference) results.append(button(`${text("Разница с периодом сравнения")}: ${report.difference.sessions} ${text("сессий")}, ${Math.round(report.difference.knownMinutes)} ${text("минут")}`, () => showReportSessions(report.comparison.sessions, results)));
      results.append(make("p", "mutedText", "Время учитывается только у завершённых сессий. Пустой день означает отсутствие наблюдений, а не доказанную нулевую активность."));
      results.append(make("h4", "", "Частые возвращения"), make("p", "mutedText", "Группировка по наблюдаемому названию. Разные миры с одинаковым названием могут совпасть."));
      for (const group of report.current.returns.slice(0, 20)) results.append(button(`${group.worldName} · ${group.sessions} · ${Math.round(group.knownMinutes)} ${text("минут")}`, () => showReportSessions(report.current.sessions.filter((row) => row.worldName === group.worldName), results)));
      const heatmap = make("div", "personalHeatmap");
      const byDay = new Map(report.current.days.map((day) => [day.day, day]));
      const first = draft.payload.from || report.current.days[0]?.day;
      const last = draft.payload.to || report.current.days.at(-1)?.day;
      const maximum = Math.max(1, ...report.current.days.map((day) => day.sessions));
      let page = 0;
      const start = Date.parse(`${first}T00:00:00Z`), end = Date.parse(`${last}T00:00:00Z`);
      const pages = make("div", "personalPlanActions");
      const drawCalendar = () => {
        heatmap.replaceChildren(); pages.replaceChildren();
        if (!Number.isFinite(start) || !Number.isFinite(end)) return;
        const pageStart = start + page * 366 * 86400000, pageEnd = Math.min(end, pageStart + 365 * 86400000);
        const previous = button("Предыдущие", () => { page -= 1; drawCalendar(); }); previous.disabled = page === 0;
        const next = button("Следующие", () => { page += 1; drawCalendar(); }); next.disabled = pageEnd >= end;
        pages.append(previous, make("span", "mutedText", `${new Date(pageStart).toISOString().slice(0,10)} — ${new Date(pageEnd).toISOString().slice(0,10)}`), next);
        for (let cursor = pageStart; cursor <= pageEnd; cursor += 86400000) {
        const date = new Date(cursor).toISOString().slice(0, 10), day = byDay.get(date);
        const tile = button(`${date}\n${day ? day.sessions : "—"}`, () => showReportSessions(report.current.sessions.filter((session) => session.day === date), results));
        tile.title = day ? `${date} · ${day.sessions} · ${Math.round(day.minutes)} ${text("минут")} · ${day.incomplete} ${text("Незавершённых сессий")}` : `${date} · ${text("Нет наблюдений")}`;
        tile.className = `personalHeatmapDay heatLevel${day ? Math.max(1, Math.ceil(day.sessions / maximum * 4)) : 0}`;
        tile.classList.toggle("incomplete", Boolean(day?.incomplete)); heatmap.append(tile);
        }
      };
      drawCalendar(); results.append(pages, heatmap); showReportSessions(report.current.sessions, results);
    }, "data-report-build"));
    actions.append(button("Сохранить фильтры", save, "data-plan-save"), button("Экспорт отчёта без имён и ID", () => call("report-export", { filters: draft.payload })));
    if (draft.id) actions.append(button("Удалить", async () => { if (!root.confirm(text("Удалить выбранный план?"))) return; await call("remove", { kind: "reports", id: draft.id }); await load(""); }));
    editor.append(actions, results);
  }

  function showReportSessions(sessions, results, offset = 0) {
    let list = results.querySelector(".personalReportSessions");
    if (!list) { list = make("div", "personalReportSessions"); results.append(list); }
    list.replaceChildren();
    list.append(make("p", "mutedText", `${offset + (sessions.length ? 1 : 0)}–${Math.min(offset + 100, sessions.length)} / ${sessions.length}`));
    for (const session of sessions.slice(offset, offset + 100)) {
      const row = button(`${session.day} · ${session.worldName || text("Мир неизвестен")} · ${session.minutes === null ? text("Длительность неизвестна") : `${Math.round(session.minutes)} ${text("минут")}`}`, () => context.openHistory?.(session.id));
      row.dataset.reportSession = session.id; list.append(row);
    }
    if (!sessions.length) list.append(make("p", "emptyState", "За этот период наблюдений нет."));
    if (sessions.length > 100) {
      const previous = button("Предыдущие", () => showReportSessions(sessions, results, offset - 100)); previous.disabled = offset === 0;
      const next = button("Следующие", () => showReportSessions(sessions, results, offset + 100)); next.disabled = offset + 100 >= sessions.length;
      list.append(previous, next);
    }
  }
})(window);
