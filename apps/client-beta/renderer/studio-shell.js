"use strict";

(function initStudioShell(root) {
  const ICONS = {
    session: "M3 12h4l2-7 4 14 2-7h6",
    insights: "M4 20V10m5 10V4m5 16v-7m5 7V7",
    social: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-4M16 3a4 4 0 0 1 0 8",
    library: "M3 5h7v7H3zM14 5h7v7h-7zM3 16h7v5H3zM14 16h7v5h-7z",
    games: "M8 8h8a5 5 0 0 1 5 5v5a2 2 0 0 1-3 2l-3-2H9l-3 2a2 2 0 0 1-3-2v-5a5 5 0 0 1 5-5M7 12v4m-2-2h4M16 13h.01M18 15h.01",
    crash: "m12 3 10 18H2L12 3zM12 9v5m0 3h.01",
    history: "M3 12a9 9 0 1 0 2-6M3 3v5h5M12 7v5l4 2",
    builder: "M3 3h8v8H3zM15 3h6v8h-6zM3 15h8v6H3zM15 15h6v6h-6z",
    "personal-tools": "M12 3v18M3 12h18M6 6l12 12M6 18 18 6",
    admin: "M12 3 3 7v6c0 4 5 7 9 9 4-2 9-5 9-9V7l-9-4zM8 12l3 3 5-6",
    owner: "m3 7 4 4 5-7 5 7 4-4-2 13H5L3 7z"
  };

  function parseKnownVrchatId(value) {
    const input = String(value || "").trim();
    const idPattern = /^(usr|wrld|avtr)_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
    if (idPattern.test(input)) return input;
    try {
      const url = new URL(input);
      if (url.protocol !== "https:" || url.username || url.password || !["vrchat.com", "www.vrchat.com"].includes(url.hostname)) return "";
      const id = url.pathname.split("/").filter(Boolean).at(-1) || "";
      return idPattern.test(id) ? id : "";
    } catch { return ""; }
  }

  function create({ app, translate, getTitle, getMode, preview = false, searchEntities }) {
    const document = root.document;
    const t = translate || ((text) => text);
    const make = (tag, className, text = "") => {
      const element = document.createElement(tag);
      element.className = className;
      element.textContent = text;
      return element;
    };
    const nav = app.querySelector(".topNavigation");
    const groups = ["session", "personal", "tools"].map((key) => {
      const group = make("span", "studioNavGroup");
      group.dataset.studioGroup = key;
      group.hidden = true;
      nav.append(group);
      return group;
    });
    for (const button of nav.querySelectorAll("[data-view-button]")) {
      const path = ICONS[button.dataset.viewButton];
      if (path) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${path}" fill="none" stroke="black" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        button.style.setProperty("--studio-icon", `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
      }
    }
    const header = make("header", "studioTopbar");
    header.hidden = true;
    const context = make("div", "studioContext");
    const mode = make("span", "studioContextMode");
    const title = make("strong", "studioContextTitle");
    context.append(mode, title);
    const search = make("button", "studioQuickSearch");
    search.type = "button";
    search.dataset.studioSearchOpen = "";
    const searchText = make("span", "");
    search.append(searchText, make("kbd", "", "Ctrl K"));
    header.append(context, search);
    app.insertBefore(header, app.querySelector(".contentStatusBar"));
    const globalSearch = make("button", "globalCommandTrigger", "Ctrl+K");
    globalSearch.type = "button";
    globalSearch.title = t("Найти раздел, действие или локальный объект");
    app.querySelector(".windowActions")?.prepend(globalSearch);

    const dialog = make("dialog", "studioCommandDialog");
    dialog.dataset.studioCommandDialog = "";
    const dialogHeader = make("header", "studioCommandHeader");
    const dialogTitle = make("h2", "");
    dialogTitle.id = "studioCommandTitle";
    dialog.setAttribute("aria-labelledby", dialogTitle.id);
    const close = make("button", "");
    close.type = "button";
    const input = make("input", "studioCommandInput");
    input.type = "search";
    input.autocomplete = "off";
    input.maxLength = 120;
    input.dataset.studioCommandInput = "";
    const results = make("div", "studioCommandResults");
    results.id = "studioCommandResults";
    input.setAttribute("aria-controls", results.id);
    const hint = make("p", "studioCommandHint");
    dialogHeader.append(dialogTitle, close);
    dialog.append(dialogHeader, input, results, hint);
    app.append(dialog);
    let active = false;
    let selected = 0;
    let matches = [];
    let returnFocus = null;
    let lastActiveView = "";
    let entities = [];
    let entityQuery = "";
    let searchTimer = 0;
    let searchRequest = 0;
    let searchMessage = "";

    function commands() {
      const views = [...nav.querySelectorAll("[data-view-button]")].filter((button) => !button.hidden && !button.disabled)
        .map((button) => ({ label: button.textContent.trim(), type: "Раздел", target: button }));
      const actions = [
        ["Настройки", app.querySelector("[data-settings-open]")],
        ["Оформление", document.querySelector(".uiCustomLauncher")],
        ["Аккаунт VRChat", app.querySelector("[data-vrchat-account-open]")]
      ].filter(([, target]) => target && !target.hidden && !target.disabled)
        .map(([label, target]) => ({ label: t(label), type: "Действие", target }));
      return [...views, ...actions];
    }

    function renderResults() {
      const query = input.value.trim().toLocaleLowerCase(document.documentElement.lang || "ru");
      matches = commands().filter((command) => command.label.toLocaleLowerCase(document.documentElement.lang || "ru").includes(query));
      if (entityQuery === input.value.trim()) matches.push(...entities);
      selected = Math.max(0, Math.min(selected, matches.length - 1));
      results.replaceChildren();
      for (const [index, command] of matches.entries()) {
        const row = make("button", "studioCommandRow");
        row.type = "button";
        row.dataset.studioCommand = String(index);
        row.classList.toggle("selected", index === selected);
        row.append(make("strong", "", command.label), make("span", "", t(command.type)));
        row.addEventListener("click", () => activateCommand(index));
        results.append(row);
      }
      if (!matches.length) results.append(make("p", "emptyState", t("Ничего не найдено.")));
      if (searchMessage) results.append(make("p", "studioSearchStatus", t(searchMessage)));
      results.querySelector(".selected")?.scrollIntoView({ block: "nearest" });
    }

    function activateCommand(index) {
      const command = matches[index];
      if (command?.run) { dialog.close(); void command.run(); return; }
      const target = command?.target;
      if (!target || target.hidden || target.disabled || !target.isConnected) return;
      dialog.close();
      target.click();
    }

    function open() {
      if (app.hidden || dialog.open || document.querySelector("dialog[open]")) return;
      returnFocus = document.activeElement;
      input.value = "";
      selected = 0;
      entities = []; entityQuery = ""; searchMessage = "";
      refresh();
      renderResults();
      dialog.showModal();
      input.focus();
    }

    function refresh() {
      const team = getMode() === "team";
      mode.textContent = t(preview ? "Просмотр на вымышленных данных" : team ? "Командное пространство" : "Личное пространство");
      title.textContent = t(getTitle());
      searchText.textContent = t("Найти раздел, действие или локальный объект");
      groups[0].textContent = t(team ? "Управление" : "В игре");
      groups[1].textContent = t(team ? "Журнал" : "Личное");
      groups[2].textContent = t("Инструменты");
      dialogTitle.textContent = t("Разделы, действия и локальная история");
      close.textContent = t("Закрыть");
      input.placeholder = t("Название, VRChat ID или ссылка…");
      input.setAttribute("aria-label", t("Найти раздел, действие или локальный объект"));
      hint.textContent = t("Enter — открыть · Esc — закрыть");
      const currentView = nav.querySelector("[data-view-button].active");
      if (active && currentView && currentView.dataset.viewButton !== lastActiveView) {
        currentView.scrollIntoView({ block: "nearest" });
        lastActiveView = currentView.dataset.viewButton;
      }
      if (dialog.open) renderResults();
    }

    function setActive(value) {
      active = Boolean(value);
      header.hidden = !active;
      groups.forEach((group) => { group.hidden = !active; });
      if (!active && dialog.open) dialog.close();
      refresh();
    }

    search.addEventListener("click", open);
    globalSearch.addEventListener("click", open);
    close.addEventListener("click", () => dialog.close());
    input.addEventListener("input", () => {
      selected = 0; entities = []; entityQuery = "";
      clearTimeout(searchTimer);
      const request = ++searchRequest;
      const query = input.value.trim();
      searchMessage = query.length >= 2 && searchEntities ? "Ищем в локальной истории…" : "";
      renderResults();
      if (!searchMessage) return;
      searchTimer = setTimeout(async () => {
        try {
          const found = await searchEntities(query);
          if (request !== searchRequest || !dialog.open) return;
          entities = found.slice(0, 30); entityQuery = query;
          searchMessage = entities.length ? "Результаты из локальной истории. Полный каталог VRChat сюда не входит." : "В локальной истории совпадений нет.";
        } catch {
          if (request !== searchRequest || !dialog.open) return;
          searchMessage = "Локальный поиск сейчас недоступен.";
        }
        renderResults();
      }, 180);
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        selected += event.key === "ArrowDown" ? 1 : -1;
        renderResults();
      } else if (event.key === "Enter") {
        event.preventDefault();
        activateCommand(selected);
      }
    });
    dialog.addEventListener("close", () => {
      if (dialog.open) return;
      clearTimeout(searchTimer); searchRequest += 1;
      results.replaceChildren();
      matches = []; entities = []; entityQuery = ""; searchMessage = "";
      returnFocus?.focus?.();
    });
    dialog.addEventListener("keydown", (event) => { if (event.key === "Escape") event.stopPropagation(); });
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "k" && !app.hidden) {
        event.preventDefault();
        open();
      }
    });
    return { refresh, setActive, open };
  }

  const exported = { create, parseKnownVrchatId };
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root.document) root.betaStudioShell = exported;
})(typeof window === "object" ? window : globalThis);
