"use strict";

(function initializeModule(root) {
  const STORAGE_KEY = "betaInterfaceProfilesV1";
  const COLOR = /^#[0-9a-f]{6}$/iu;
  const SELECTOR = /^body(?: > [a-z][a-z0-9-]*:nth-of-type\([1-9][0-9]{0,3}\)){1,20}$/u;
  const FONTS = { system: '"Segoe UI Variable", "Segoe UI", sans-serif', sans: "Arial, sans-serif", mono: "Consolas, monospace" };
  const COLORS = { background: "--bg", surface: "--panel", secondary: "--panel-2", text: "--text", muted: "--muted", accent: "--cyan", border: "--line" };
  const bounded = (value, min, max) => Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Number(value))) : min;

  function normalizeProfile(input) {
    const profile = { name: String(input?.name || "Мой интерфейс").slice(0, 60), theme: {}, elements: {} };
    for (const key of Object.keys(COLORS)) {
      if (typeof input?.theme?.[key] === "string" && COLOR.test(input.theme[key])) profile.theme[key] = input.theme[key];
    }
    if (Object.hasOwn(FONTS, input?.theme?.font)) profile.theme.font = input.theme.font;
    if (input?.theme?.radius !== undefined) profile.theme.radius = bounded(input.theme.radius, 0, 32);
    if (input?.theme?.scale !== undefined) profile.theme.scale = bounded(input.theme.scale, 90, 110);
    for (const [selector, item] of Object.entries(input?.elements || {}).slice(0, 250)) {
      if (!SELECTOR.test(selector) || !item || typeof item !== "object") continue;
      const setting = {};
      for (const key of ["background", "color", "borderColor"]) {
        if (typeof item[key] === "string" && COLOR.test(item[key])) setting[key] = item[key];
      }
      for (const [key, min, max] of [["fontSize", 8, 64], ["radius", 0, 64], ["padding", 0, 48], ["opacity", 40, 100]]) {
        if (item[key] !== undefined) setting[key] = bounded(item[key], min, max);
      }
      if (typeof item.text === "string") setting.text = item.text.slice(0, 200);
      profile.elements[selector] = setting;
    }
    return profile;
  }

  function selectorFor(element) {
    const parts = [];
    for (let current = element; current && current !== document.body; current = current.parentElement) {
      if (!current.parentElement || parts.length >= 20) return "";
      const siblings = Array.from(current.parentElement.children).filter((node) => node.tagName === current.tagName);
      parts.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${siblings.indexOf(current) + 1})`);
    }
    const selector = `body > ${parts.join(" > ")}`;
    return SELECTOR.test(selector) ? selector : "";
  }

  function install() {
    const document = root.document;
    let profiles = [];
    let active = 0;
    try {
      const saved = JSON.parse(root.localStorage.getItem(STORAGE_KEY) || "null");
      profiles = Array.isArray(saved?.profiles) ? saved.profiles.slice(0, 8).map(normalizeProfile) : [];
      active = Math.floor(bounded(saved?.active || 0, 0, Math.max(0, profiles.length - 1)));
    } catch { /* Invalid local settings use defaults. */ }
    if (!profiles.length) profiles = [normalizeProfile({})];
    let selected = null;
    let selecting = false;
    let scheduled = false;
    const originalText = new WeakMap();
    const lastAppliedText = new WeakMap();
    const originalSkip = new WeakMap();
    const staticLabels = new WeakSet();
    // Capture only initial static captions. Runtime data and password fields are never relabelled.
    document.querySelectorAll("button,label,summary,a,span,p,small,legend").forEach((element) => {
      const text = element.textContent.trim();
      const runtimeValue = element.getAttributeNames().some((name) => /^data-.*(?:title|name|status|count|message|error|time|value|user|instance|id)$/u.test(name));
      const structuralControl = element.closest(".topNavigation, [data-view-button], [data-library-tab], [role='tablist']");
      if (!runtimeValue && !structuralControl && !element.children.length && text && !/^[\d\s—–.:-]+$/u.test(text) && !element.closest("[data-activation-view], [data-vrchat-auth-dialog], [data-i18n-skip]")) staticLabels.add(element);
    });
    // A file:// stylesheet has an opaque origin in Chrome. Keep overrides in
    // a constructable stylesheet, without changing the renderer CSP.
    const sheet = new root.CSSStyleSheet();
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    const baseRuleCount = 0;
    const button = make("button", "uiCustomLauncher", "Оформление");
    button.type = "button";
    button.title = "Оформление всего интерфейса Beta";
    const panel = make("aside", "uiCustomPanel");
    panel.hidden = true;
    panel.setAttribute("aria-label", "Редактор оформления");
    const heading = make("header", "uiCustomHeading");
    heading.append(make("strong", "", "Оформление Beta"));
    const close = make("button", "", "Закрыть");
    close.type = "button";
    heading.append(close);
    panel.append(heading, make("p", "", "Настройки сохраняются только на этом устройстве. Подписи изменяют вид интерфейса, а не данные VRChat."));
    const status = make("p", "uiCustomStatus");
    status.setAttribute("aria-live", "polite");
    const profileSelect = document.createElement("select");
    profileSelect.setAttribute("aria-label", "Профиль оформления");
    panel.append(profileSelect);
    const profileActions = make("div", "uiCustomActions");
    for (const [title, action, key] of [["Новый", newProfile, "new"], ["Экспорт", exportProfile, "export"], ["Импорт", importProfile, "import"], ["Удалить", deleteProfile, "delete"]]) {
      const control = make("button", "", title);
      control.type = "button";
      control.dataset.uiAction = key;
      control.addEventListener("click", action);
      profileActions.append(control);
    }
    panel.append(profileActions);
    const profileName = field(panel, "Имя профиля", "text");
    profileName.maxLength = 60;
    profileName.addEventListener("change", () => {
      current().name = profileName.value.trim().slice(0, 60) || "Мой интерфейс"; saveAndApply(); syncControls();
    });
    const themeFields = make("div", "uiCustomFields");
    const paletteTitles = { background: "Фон", surface: "Панели", secondary: "Второй фон", text: "Текст", muted: "Вторичный текст", accent: "Акцент", border: "Границы" };
    const defaults = { background: "#06090d", surface: "#0c131b", secondary: "#111c27", text: "#f4f7f9", muted: "#8fa2b2", accent: "#58d6e7", border: "#223241" };
    const themeInputs = {};
    for (const key of Object.keys(COLORS)) {
      const input = field(themeFields, paletteTitles[key], "color");
      themeInputs[key] = input;
      input.dataset.uiTheme = key;
      input.addEventListener("change", () => { current().theme[key] = input.value; saveAndApply(); });
    }
    const font = document.createElement("select");
    for (const [value, title] of [["system", "Системный"], ["sans", "Arial"], ["mono", "Моноширинный"]]) {
      const option = make("option", "", title); option.value = value; font.append(option);
    }
    const fontLabel = make("label", "", "Шрифт"); fontLabel.append(font); themeFields.append(fontLabel);
    font.addEventListener("change", () => { current().theme.font = font.value; saveAndApply(); });
    const scale = field(themeFields, "Масштаб, %", "number", 90, 110);
    scale.addEventListener("change", () => { current().theme.scale = bounded(scale.value, 90, 110); saveAndApply(); });
    const radius = field(themeFields, "Скругление панелей", "number", 0, 32);
    radius.addEventListener("change", () => { current().theme.radius = bounded(radius.value, 0, 32); saveAndApply(); });
    panel.append(make("h3", "", "Общий вид"), themeFields);
    const pick = make("button", "", "Выбрать элемент на экране"); pick.type = "button";
    pick.dataset.uiAction = "pick";
    panel.append(make("h3", "", "Любой блок или элемент"), pick);
    const selection = make("p", "uiCustomSelection", "Элемент не выбран"); panel.append(selection);
    const elementFields = make("div", "uiCustomFields");
    const inputs = {};
    for (const [key, title, type, min, max] of [
      ["background", "Фон элемента", "color"], ["color", "Цвет текста", "color"], ["borderColor", "Цвет границы", "color"],
      ["fontSize", "Размер шрифта", "number", 8, 64], ["radius", "Скругление", "number", 0, 64],
      ["padding", "Внутренний отступ", "number", 0, 48], ["opacity", "Прозрачность, %", "number", 40, 100], ["text", "Подпись", "text"]
    ]) {
      const input = field(elementFields, title, type, min, max); input.disabled = true;
      if (key === "text") input.maxLength = 200;
      inputs[key] = input;
      input.dataset.uiElement = key;
      input.addEventListener("change", () => {
        if (!selected) return;
        const selector = selectorFor(selected);
        if (!current().elements[selector] && Object.keys(current().elements).length >= 250) {
          status.textContent = "Максимум 250 элементов в профиле"; return;
        }
        const setting = current().elements[selector] || {};
        if (key === "text" && !staticLabels.has(selected)) return;
        setting[key] = type === "number" ? bounded(input.value, min, max) : input.value;
        current().elements[selector] = setting;
        saveAndApply();
      });
    }
    panel.append(elementFields, make("small", "", "Подпись доступна только для безопасных статических элементов. Названия разделов, вкладок, динамические данные и идентификаторы не заменяются."));
    const resetElement = make("button", "", "Сбросить выбранный элемент"); resetElement.type = "button";
    resetElement.dataset.uiAction = "reset-element";
    resetElement.addEventListener("click", () => {
      if (!selected) return;
      delete current().elements[selectorFor(selected)]; saveAndApply(); updateSelection();
    });
    const resetAll = make("button", "", "Сбросить оформление профиля"); resetAll.type = "button";
    resetAll.dataset.uiAction = "reset-profile";
    resetAll.addEventListener("click", () => {
      profiles[active] = normalizeProfile({ name: current().name }); saveAndApply(); syncControls();
    });
    panel.append(resetElement, resetAll, status);
    document.body.append(button, panel);
    button.addEventListener("click", () => { panel.hidden = !panel.hidden; document.body.classList.toggle("uiCustomOpen", !panel.hidden); if (panel.hidden) dismissSelection(); apply(); });
    close.addEventListener("click", () => { panel.hidden = true; document.body.classList.remove("uiCustomOpen"); dismissSelection(); apply(); });
    pick.addEventListener("click", () => {
      selecting = !selecting; pick.textContent = selecting ? "Выберите элемент; Esc — отмена" : "Выбрать элемент на экране";
      document.body.classList.toggle("uiCustomPicking", selecting);
    });
    document.addEventListener("click", (event) => {
      if (!selecting || !(event.target instanceof root.Element) || event.target.closest(".uiCustomPanel,.uiCustomLauncher")) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const element = event.target;
      if (!selectorFor(element)) return;
      selected?.classList.remove("uiCustomSelected"); selected = element;
      selected.classList.add("uiCustomSelected"); endSelection(); updateSelection();
    }, true);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") endSelection(); });
    profileSelect.addEventListener("change", () => { active = Number(profileSelect.value); saveAndApply(); syncControls(); });
    const observer = new root.MutationObserver(() => {
      if (scheduled || !Object.keys(current().elements).length) return;
      scheduled = true;
      root.requestAnimationFrame(() => { scheduled = false; applyElements(); });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    root.addEventListener("resize", () => { if (!panel.hidden) apply(); });
    syncControls(); apply();

    function make(tag, className, text = "") {
      const element = document.createElement(tag); element.className = className; element.textContent = text; return element;
    }
    function field(parent, title, type, min, max) {
      const label = make("label", "", title); const input = document.createElement("input"); input.type = type;
      if (min !== undefined) input.min = String(min); if (max !== undefined) input.max = String(max);
      label.append(input); parent.append(label); return input;
    }
    function current() { return profiles[active]; }
    function endSelection() { selecting = false; document.body.classList.remove("uiCustomPicking"); pick.textContent = "Выбрать элемент на экране"; }
    function dismissSelection() { endSelection(); selected?.classList.remove("uiCustomSelected"); }
    function saveAndApply() {
      profiles[active] = normalizeProfile(current());
      try { root.localStorage.setItem(STORAGE_KEY, JSON.stringify({ active, profiles })); status.textContent = "Сохранено"; }
      catch { status.textContent = "Не удалось сохранить. Экспортируйте профиль."; }
      apply();
    }
    function apply() {
      while (sheet.cssRules.length > baseRuleCount) sheet.deleteRule(baseRuleCount);
      const theme = current().theme;
      const variables = Object.entries(COLORS).filter(([key]) => theme[key]).map(([key, variable]) => `${variable}:${theme[key]}`);
      if (theme.font) variables.push(`font-family:${FONTS[theme.font]}`);
      if (variables.length) sheet.insertRule(`:root {${variables.join(";")}}`, sheet.cssRules.length);
      const scaleFactor = bounded(theme.scale ?? 100, 90, 110) / 100;
      const dockPadding = !panel.hidden && root.innerWidth >= 1180 ? 386 / scaleFactor : 0;
      sheet.insertRule(`.appShell {zoom:${scaleFactor};width:${100 / scaleFactor}vw;height:${100 / scaleFactor}vh;padding-right:${dockPadding}px}`, sheet.cssRules.length);
      if (theme.surface) sheet.insertRule(`.panel {background:${theme.surface}}`, sheet.cssRules.length);
      if (theme.radius !== undefined) sheet.insertRule(`.panel,dialog {border-radius:${theme.radius}px}`, sheet.cssRules.length);
      for (const [selector, setting] of Object.entries(current().elements)) {
        const styles = [];
        for (const [key, property, suffix] of [["background", "background", ""], ["color", "color", ""], ["borderColor", "border-color", ""],
          ["fontSize", "font-size", "px"], ["radius", "border-radius", "px"], ["padding", "padding", "px"]]) {
          if (setting[key] !== undefined) styles.push(`${property}:${setting[key]}${suffix} !important`);
        }
        if (setting.opacity !== undefined) styles.push(`opacity:${setting.opacity / 100} !important`);
        if (styles.length) sheet.insertRule(`${selector} {${styles.join(";")}}`, sheet.cssRules.length);
      }
      applyElements();
    }
    function applyElements() {
      document.querySelectorAll("[data-ui-relabelled]").forEach((element) => {
        if (current().elements[selectorFor(element)]?.text !== undefined) return;
        if (lastAppliedText.has(element) && element.textContent !== lastAppliedText.get(element)) originalText.set(element, element.textContent);
        if (originalText.has(element)) element.textContent = originalText.get(element);
        lastAppliedText.delete(element);
        if (originalSkip.get(element) === null) element.removeAttribute("data-i18n-skip");
        else if (originalSkip.has(element)) element.setAttribute("data-i18n-skip", originalSkip.get(element));
        originalSkip.delete(element);
        element.removeAttribute("data-ui-relabelled");
      });
      for (const [selector, setting] of Object.entries(current().elements)) {
        if (setting.text === undefined) continue;
        const element = document.querySelector(selector);
        if (!element || !staticLabels.has(element) || element.children.length) continue;
        if (!originalText.has(element) || (lastAppliedText.has(element) && element.textContent !== lastAppliedText.get(element))) originalText.set(element, element.textContent);
        if (!originalSkip.has(element)) originalSkip.set(element, element.getAttribute("data-i18n-skip"));
        element.setAttribute("data-i18n-skip", "");
        if (element.textContent !== setting.text) element.textContent = setting.text;
        lastAppliedText.set(element, setting.text);
        element.dataset.uiRelabelled = "true";
      }
    }
    function syncControls() {
      profileSelect.replaceChildren(...profiles.map((profile, index) => { const option = make("option", "", profile.name); option.value = String(index); return option; }));
      profileSelect.value = String(active);
      profileName.value = current().name;
      for (const key of Object.keys(COLORS)) themeInputs[key].value = current().theme[key] || defaults[key];
      font.value = current().theme.font || "system"; scale.value = String(current().theme.scale || 100); radius.value = String(current().theme.radius ?? 14);
      updateSelection();
    }
    function updateSelection() {
      if (!selected?.isConnected) { selected = null; selection.textContent = "Элемент не выбран"; for (const input of Object.values(inputs)) input.disabled = true; return; }
      selection.textContent = `${selected.tagName.toLowerCase()} · ${selected.textContent.trim().slice(0, 50)}`;
      const setting = current().elements[selectorFor(selected)] || {};
      for (const [key, input] of Object.entries(inputs)) {
        input.disabled = key === "text" && !staticLabels.has(selected);
        input.value = setting[key] ?? (input.type === "color" ? "#111c27" : key === "opacity" ? 100 : key === "text" ? selected.textContent : "");
      }
    }
    function newProfile() {
      if (profiles.length >= 8) { status.textContent = "Максимум 8 профилей"; return; }
      profiles.push(normalizeProfile({ ...current(), name: `Профиль ${profiles.length + 1}` })); active = profiles.length - 1; saveAndApply(); syncControls();
    }
    function deleteProfile() {
      if (profiles.length === 1) { resetAll.click(); return; }
      profiles.splice(active, 1); active = 0; saveAndApply(); syncControls();
    }
    function exportProfile() {
      const url = root.URL.createObjectURL(new Blob([JSON.stringify({ schema: 1, profile: current() }, null, 2)], { type: "application/json" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "beta-interface.json"; anchor.click();
      root.setTimeout(() => root.URL.revokeObjectURL(url), 1000);
    }
    function importProfile() {
      const input = document.createElement("input"); input.type = "file"; input.accept = ".json,application/json";
      input.addEventListener("change", async () => {
        try {
          const file = input.files?.[0]; if (!file || file.size > 256 * 1024) throw new Error("size");
          const data = JSON.parse(await file.text()); if (data.schema !== 1 || !data.profile) throw new Error("schema");
          if (profiles.length >= 8) throw new Error("count");
          profiles.push(normalizeProfile(data.profile)); active = profiles.length - 1; saveAndApply(); syncControls();
        } catch { status.textContent = "Нужен профиль Beta до 256 КБ; максимум 8 профилей."; }
      }); input.click();
    }
  }

  const exported = { normalizeProfile, STORAGE_KEY };
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root.document) { root.betaUiCustomizer = exported; install(); }
})(typeof window === "object" ? window : globalThis);
