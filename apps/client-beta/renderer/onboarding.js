"use strict";

(function installTutorial(root) {
  const STORAGE_KEY = "betaTutorialV1";
  const steps = [
    { view: "session", target: "[data-view-button=session]", title: "Сессия", description: "Здесь видно, кто находится рядом и что произошло. Источник — локальный игровой лог." },
    { view: "session", target: "[data-session-section=feed]", title: "Один раздел — несколько вкладок", description: "Лента, друзья, аватары и сводка относятся к текущей сессии. Переключайтесь здесь." },
    { view: "session", target: "[data-studio-search-open]", title: "Быстрый поиск", description: "Ctrl+K находит разделы, действия и объекты из локальной истории. Можно вставить известный ID или ссылку VRChat." },
    { view: "library", target: "[data-view-button=library]", title: "Библиотека", description: "Игроки, миры и аватары, которые приложение уже наблюдало. Это не полный каталог VRChat." },
    { view: "history", target: "[data-view-button=history]", title: "История", description: "Открывайте прошлые сессии, фильтруйте по дате и ищите знакомые имена. Данные можно перенести через настройки." },
    { view: "personal-tools", target: "[data-personal-tab=routes]", title: "Инструменты по ключу", description: "Маршруты, фото, отчёты, уведомления и подготовка к игре собраны по задачам. Командный журнал — отдельная вкладка для команды.", paid: true },
    { view: "games", target: "[data-arcade-mode=memory]", title: "Короткий перерыв", description: "Память и реакция работают сразу, без истории миров. Результаты сохраняются только на этом устройстве.", paid: true },
    { view: "session", target: "[data-settings-open]", title: "Настройки отдельно", description: "Настройки открываются в отдельном окне. Здесь находятся масштаб, язык, приватность, резервные копии и состояние чтения лога." },
    { view: "session", target: ".uiCustomLauncher", title: "Готовые цвета", description: "Оформление Studio едино для всех. Выберите удобную палитру; расположение элементов останется знакомым." },
    { view: "session", target: ".studioQuickSearch", title: "Готово", description: "Списки обновляются автоматически, пока раздел открыт. При вводе текста и сворачивании обновление делает паузу. Обучение можно повторить в настройках." }
  ];
  const exported = { STORAGE_KEY, steps };
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (!root.document) return;
  const document = root.document, text = value => root.betaI18n.translate(value, root.betaI18n.language());
  let context, index = 0, current = [], originalView, focus, target, resizeFrame = 0, skipped = [];
  const layer = document.createElement("dialog"); layer.className = "tourLayer";
  const spotlight = document.createElement("div"); spotlight.className = "tourFocus";
  const card = document.createElement("section"); card.className = "tourCard";
  const progress = document.createElement("p"), heading = document.createElement("h2"), description = document.createElement("p"), controls = document.createElement("div"); controls.className = "tourActions";
  const button = (label, callback) => { const item = document.createElement("button"); item.type = "button"; item.textContent = text(label); item.addEventListener("click", callback); return item; };
  const back = button("Назад", () => { index -= 1; showStep(); }); back.dataset.tourBack = "";
  const next = button("Далее", () => { if (index + 1 === current.length) finish("complete"); else { index += 1; showStep(); } }); next.dataset.tourNext = "";
  const skip = button("Закончить обучение", () => finish("dismissed"));
  controls.append(back, next, skip); card.append(progress, heading, description, controls); layer.append(spotlight, card); document.body.append(layer);
  function position() {
    resizeFrame = 0; if (!layer.open || !target) return;
    const rect = target.getBoundingClientRect();
    const left = Math.max(6, rect.left - 5), top = Math.max(6, rect.top - 5), width = Math.min(innerWidth - left - 6, rect.width + 10), height = Math.min(innerHeight - top - 6, rect.height + 10);
    Object.assign(spotlight.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
    const cardWidth = Math.min(360, innerWidth - 32), cardHeight = card.getBoundingClientRect().height;
    const x = rect.right + cardWidth + 30 < innerWidth ? rect.right + 18 : Math.max(16, Math.min(innerWidth - cardWidth - 16, rect.left));
    const y = rect.bottom + cardHeight + 24 < innerHeight ? rect.bottom + 14 : Math.max(16, Math.min(innerHeight - cardHeight - 16, rect.top - cardHeight - 18));
    Object.assign(card.style, { left: `${x}px`, top: `${y}px`, width: `${cardWidth}px` });
  }
  const schedulePosition = () => { if (layer.open && !resizeFrame) resizeFrame = root.requestAnimationFrame(position); };
  async function showStep() {
    const step = current[index]; context.selectView(step.view);
    await new Promise(resolve => root.requestAnimationFrame(resolve));
    target = document.querySelector(step.target);
    for (let attempt = 0; attempt < 20 && (!target || target.closest("[hidden]") || !target.getBoundingClientRect().width); attempt += 1) {
      await new Promise(resolve => root.setTimeout(resolve, 50)); target = document.querySelector(step.target);
    }
    if (!target || target.closest("[hidden]") || target.getBoundingClientRect().width === 0) { skipped.push({index,selector:step.target,hidden:target?.closest('[hidden]')?.className,width:target?.getBoundingClientRect().width}); if (index + 1 < current.length) { index += 1; return showStep(); } finish("complete"); return; }
    target.scrollIntoView({ block: "nearest", inline: "nearest" });
    progress.textContent = `${index + 1} / ${current.length}`; heading.textContent = text(step.title); description.textContent = text(step.description);
    back.disabled = index === 0; next.textContent = text(index + 1 === current.length ? "Готово" : "Далее"); layer.dataset.tourStep = String(index);
    position(); next.focus();
  }
  function finish(status) {
    root.localStorage.setItem(STORAGE_KEY, JSON.stringify({ status, version: 1 }));
    if (layer.open) layer.close(); target = null;
    if (originalView) context.selectView(originalView); focus?.focus?.();
  }
  function start() {
    const app = document.querySelector("[data-app-view]");
    if (!context || app.hidden || !app.classList.contains("uiStudio")) return;
    if (invitation.open) invitation.close();
    root.localStorage.setItem(STORAGE_KEY, JSON.stringify({ status: "started", version: 1 }));
    document.querySelector(".uiCustomPanel[open]")?.close();
    focus = document.activeElement; originalView = context.getView(); index = 0; current = steps.filter(step => !step.paid || context.paid());
    if (!layer.open) layer.showModal(); void showStep();
  }
  const invitation = document.createElement("dialog"); invitation.className = "tourInvitation";
  const inviteTitle = document.createElement("h2"); inviteTitle.textContent = text("Освоимся за минуту?");
  const inviteText = document.createElement("p"); inviteText.textContent = text("Короткое обучение подсветит основные кнопки и объяснит, где что находится. Можно пройти его позже в настройках.");
  const later = button("Позже", () => { root.localStorage.setItem(STORAGE_KEY, JSON.stringify({ status: "later", version: 1 })); invitation.close(); }); later.dataset.tourLater = "";
  const begin = button("Начать обучение", () => { invitation.close(); start(); }); begin.dataset.tourStart = "";
  invitation.append(inviteTitle, inviteText, begin, later); document.body.append(invitation);
  invitation.addEventListener("cancel", () => root.localStorage.setItem(STORAGE_KEY, JSON.stringify({ status: "later", version: 1 })));
  layer.addEventListener("cancel", event => { event.preventDefault(); finish("dismissed"); });
  root.addEventListener("resize", schedulePosition); document.addEventListener("scroll", schedulePosition, true);
  root.betaTutorial = { start, init(value) {
    context = value;
    if (root.localStorage.getItem(STORAGE_KEY)) return;
    const app = document.querySelector("[data-app-view]");
    const offer = () => {
      if (app.hidden || !app.classList.contains("uiStudio") || !document.querySelector("[data-view-button=session]")?.getBoundingClientRect().width) return;
      observer.disconnect(); root.requestAnimationFrame(() => { if (!root.localStorage.getItem(STORAGE_KEY) && !invitation.open && !layer.open) invitation.showModal(); });
    };
    const observer = new root.MutationObserver(offer); observer.observe(app, { attributes: true, attributeFilter: ["hidden", "class"] }); offer();
  }, getState: () => ({ open: layer.open, index, count: current.length, skipped }) };
})(typeof window === "object" ? window : globalThis);
