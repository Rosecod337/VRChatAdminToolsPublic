"use strict";

(function initializeAppearance(root) {
  const STORAGE_KEY = "betaInterfaceProfilesV1";
  const COLORS = { background: "--bg", surface: "--panel", secondary: "--panel-2", text: "--text", muted: "--muted", accent: "--cyan", positive: "--green", warning: "--amber", danger: "--red", border: "--line", softBorder: "--line-soft" };
  const BASE = { background: "#0b0e15", surface: "#111620", secondary: "#192132", text: "#edf1f8", muted: "#a4afc2", accent: "#7c9bff", positive: "#78d9ac", warning: "#f0ca7c", danger: "#f28e9c", border: "#2c3547", softBorder: "#202735" };
  const colors = {
    studio: ["Студия", {}],
    midnight: ["Ночной", { background: "#06090d", surface: "#0c131b", secondary: "#111c27", muted: "#a6bdca", accent: "#58d6e7", border: "#223241" }],
    violet: ["Фиолетовый", { background: "#0e0b18", surface: "#181329", secondary: "#241a3a", muted: "#b5a7cb", accent: "#b78cff", border: "#45365e" }],
    vrchat: ["В стиле VRChat", { background: "#141821", surface: "#1c222c", secondary: "#292f3a", muted: "#aeb7c3", accent: "#42cadd", border: "#384450" }],
    ocean: ["Морской", { background: "#071721", surface: "#0d2634", secondary: "#133549", muted: "#a7c7d0", accent: "#72dcf2", border: "#31586a" }],
    rose: ["Розовый кварц", { background: "#170e18", surface: "#281729", secondary: "#38243d", muted: "#d5b6c9", accent: "#f59bd3", border: "#69485f" }],
    graphite: ["Графит", { background: "#0d1013", surface: "#181d22", secondary: "#242b32", muted: "#b7c3ca", accent: "#a9d2e6", border: "#53606a" }],
    neon: ["Неон", { background: "#080a12", surface: "#111728", secondary: "#1c2641", muted: "#adb9d9", accent: "#adfa69", border: "#505381" }],
    forest: ["Лесной", { background: "#07110f", surface: "#0d1e19", secondary: "#153027", muted: "#9db8aa", accent: "#69dca4", border: "#2c5143" }],
    ember: ["Тёплый", { background: "#150d0b", surface: "#251713", secondary: "#35231c", muted: "#cbb2a3", accent: "#f5a86c", border: "#604333" }]
  };
  const PRESETS = Object.freeze(Object.fromEntries(Object.entries(colors).map(([key, [name, palette]]) => [key, { name, theme: { ...BASE, ...palette, preset: key, font: "system", radius: 6, shell: "studio" } }])));
  const FONTS = Object.freeze({ system: '"Segoe UI Variable", "Segoe UI", sans-serif' });
  const FONT_LABELS = { system: "Системный" };
  function normalizeProfile(input = {}) {
    const theme = input.theme || {};
    const key = Object.hasOwn(PRESETS, theme.preset) ? theme.preset : Object.entries(PRESETS).find(([, value]) => value.theme.accent === theme.accent && value.theme.background === theme.background)?.[0] || "studio";
    return { name: PRESETS[key].name, theme: { ...PRESETS[key].theme }, elements: {} };
  }
  function migrateAppearance(saved) {
    const selected = saved?.profiles?.[Number(saved.active) || 0] || {};
    return { schema: 2, active: 0, profiles: [normalizeProfile(selected)] };
  }
  const api = { STORAGE_KEY, PRESETS, FONTS, FONT_LABELS, normalizeProfile, migrateAppearance };
  if (typeof module === "object" && module.exports) module.exports = api;
  if (!root.document) return;
  root.betaUiCustomizer = api;
  let saved;
  try { saved = JSON.parse(root.localStorage.getItem(STORAGE_KEY) || "null"); } catch { saved = null; }
  let model = migrateAppearance(saved);
  const requested = new root.URLSearchParams(root.location.search).get("appearancePreset");
  if (!saved && Object.hasOwn(PRESETS, requested)) model = migrateAppearance({ profiles: [PRESETS[requested]] });
  const document = root.document;
  const text = (value) => root.betaI18n?.translate(value, root.betaI18n.language()) || value;
  const launcher = document.createElement("button"); launcher.type = "button"; launcher.className = "uiCustomLauncher"; launcher.textContent = text("Цвета");
  const panel = document.createElement("dialog"); panel.className = "uiCustomPanel"; panel.hidden = true;
  const title = document.createElement("h2"); title.textContent = text("Цветовая палитра");
  const hint = document.createElement("p"); hint.textContent = text("Единый интерфейс Studio. Выберите готовые цвета — изменение применяется сразу.");
  const options = document.createElement("div"); options.className = "uiPaletteGrid"; options.setAttribute("role", "group"); options.setAttribute("aria-label", text("Цветовая палитра"));
  const close = document.createElement("button"); close.type = "button"; close.textContent = text("Закрыть");
  panel.append(title, hint, options, close); document.body.append(launcher, panel);
  function apply() {
    const theme = model.profiles[0].theme;
    for (const [key, variable] of Object.entries(COLORS)) document.documentElement.style.setProperty(variable, theme[key]);
    document.documentElement.style.fontFamily = FONTS.system;
    document.documentElement.style.setProperty("--ui-radius", "6px");
    document.body.classList.add("uiThemeStudio"); document.documentElement.classList.add("uiThemeStudio");
    document.body.classList.remove("uiThemeGameSense", "uiThemeVrchat");
    root.localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
    for (const button of options.children) { const active = button.dataset.palette === theme.preset; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); }
    root.dispatchEvent(new root.CustomEvent("beta-appearance-change"));
  }
  for (const [key, value] of Object.entries(PRESETS)) {
    const button = document.createElement("button"); button.type = "button"; button.dataset.palette = key; button.textContent = text(value.name);
    button.style.setProperty("--palette-accent", value.theme.accent); button.style.setProperty("--palette-surface", value.theme.surface);
    button.addEventListener("click", () => { api.applyPreferences({ preset: key }); }); options.append(button);
  }
  api.applyPreferences = ({ preset } = {}) => { if (Object.hasOwn(PRESETS, preset)) model = migrateAppearance({ profiles: [PRESETS[preset]] }); apply(); };
  api.getAppearance = () => ({ ...model.profiles[0].theme });
  launcher.addEventListener("click", () => { panel.hidden = false; panel.showModal(); });
  close.addEventListener("click", () => panel.close()); panel.addEventListener("close", () => { panel.hidden = true; launcher.focus(); });
  apply();
})(typeof window === "object" ? window : globalThis);
