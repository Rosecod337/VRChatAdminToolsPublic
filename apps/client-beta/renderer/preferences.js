"use strict";

const bridge = window.preferencesApi;
const form = document.querySelector("form");
const status = document.querySelector("#status");
let snapshot;
let backupStatus = null;
let storageLoaded = false;
let busy = false;
let dirty = false;
let privacyState = null;
let refreshTimer = null;
let currentPage = "interface";
const text = (value) => window.betaI18n.translate(value, snapshot?.uiSettings.language || "ru");

function setStatus(message, error = false) {
  status.textContent = text(message);
  status.classList.toggle("error", error);
}

function operationError(error) {
  const message = String(error?.message || "");
  const errors = {
    backup_passphrase_length: "Введите пароль резервной копии длиной от 12 до 256 символов.",
    backup_wrong_passphrase_or_damaged: "Пароль неверен или резервная копия повреждена.",
    backup_invalid_format: "Это не зашифрованная резервная копия приложения.",
    backup_file_too_large: "Резервная копия превышает допустимый размер.",
    backup_paid_required: "Автокопии доступны только при активном платном ключе.",
    backup_os_encryption_unavailable: "Защита пароля Windows сейчас недоступна."
  };
  return Object.entries(errors).find(([code]) => message.includes(code))?.[1] || message || "Не удалось выполнить операцию.";
}

function applyAppearance() {
  document.body.classList.toggle("classic", snapshot.appearance.shell === "gamesense");
  const colors = { background: "--bg", surface: "--panel", secondary: "--secondary", text: "--text", muted: "--muted", accent: "--accent", border: "--line" };
  for (const [key, variable] of Object.entries(colors)) {
    const value = snapshot.appearance[key];
    if (/^#[0-9a-f]{6}$/iu.test(value || "")) document.documentElement.style.setProperty(variable, value);
  }
  const font = snapshot.fonts.find((item) => item.key === "system");
  if (font) document.documentElement.style.fontFamily = font.family;
}

function fill(settings) {
  for (const [key, value] of Object.entries(settings)) {
    const input = form.elements.namedItem(key);
    if (!input) continue;
    if (input.type === "checkbox") input.checked = Boolean(value);
    else input.value = String(value);
  }
  updateNotificationCount();
}

function updateNotificationCount() {
  const count = ["notifyMarkedPlayers", "notifyCrashAvatars"].filter((key) => form.elements[key].checked).length;
  document.querySelector("#notification-count").textContent = `${count}/2`;
}

async function operation(callback) {
  if (busy) return;
  busy = true;
  form.setAttribute("aria-busy", "true");
  const buttons = [...form.querySelectorAll("button")].filter((button) => !button.disabled);
  buttons.forEach((button) => { button.disabled = true; });
  try { await callback(); }
  catch (error) { setStatus(operationError(error), true); }
  finally {
    busy = false;
    form.removeAttribute("aria-busy");
    buttons.forEach((button) => { button.disabled = false; });
    const toggle = document.querySelector("#backup-toggle");
    if (backupStatus) toggle.disabled = !backupStatus.enabled && !backupStatus.canEnable;
  }
}

async function refreshStorage() {
  const [stats, backup] = await Promise.all([bridge.data("stats"), bridge.data("backup-status")]);
  const size = (Number(stats.fileBytes || 0) / (1024 * 1024)).toFixed(1);
  document.querySelector("#storage-status").textContent = `${size} ${text("МиБ")} · ${stats.sessions || 0} ${text("сессий")} · ${stats.players || 0} ${text("игроков")}`;
  document.querySelector("#retention").value = String(stats.retentionDays || 0);
  backupStatus = backup;
  document.querySelector("#backup-status").textContent = backup.enabled
    ? `${text("Папка")}: ${backup.directory} · ${text("Последняя копия")}: ${backup.lastAt || text("ещё не создана")}`
    : text("Выключены. Выберите папку и задайте пароль для включения.");
  const toggle = document.querySelector("#backup-toggle");
  toggle.textContent = text(backup.enabled ? "Выключить автокопии" : "Включить и выбрать папку");
  toggle.disabled = !backup.enabled && !backup.canEnable;
  storageLoaded = true;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!document.querySelector('[data-section="privacy"]').hidden) { void operation(applyPrivacy); return; }
  void operation(async () => {
    const uiSettings = { ...snapshot.uiSettings };
    for (const [key, previous] of Object.entries(uiSettings)) {
      const input = form.elements.namedItem(key);
      if (!input || input.disabled) continue;
      uiSettings[key] = input.type === "checkbox" ? input.checked : typeof previous === "number" ? Number(input.value) : input.value;
    }
    snapshot = await bridge.save({ uiSettings, appearance: { preset: form.elements.preset.value } });
    dirty = false;
    form.elements.preset.value = snapshot.appearance.preset;
    fill(snapshot.uiSettings);
    applyAppearance();
    document.documentElement.lang = snapshot.uiSettings.language;
    window.betaI18n.translateTree(document, snapshot.uiSettings.language);
    setStatus("Настройки сохранены.");
  });
});
form.addEventListener("change", (event) => {
  updateNotificationCount();
  if (!event.target.name) return;
  dirty = true;
  setStatus("Есть несохранённые изменения.");
});
document.querySelector("#reset").addEventListener("click", () => { dirty = true; fill(snapshot.defaults); setStatus("Есть несохранённые изменения."); });
document.querySelector("#cancel").addEventListener("click", () => { document.querySelector("#passphrase").value = ""; void bridge.close(); });
window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const popup = document.querySelector("details[open]");
  if (popup) { popup.open = false; popup.querySelector("summary").focus(); }
  else if (!busy) { document.querySelector("#passphrase").value = ""; void bridge.close(); }
});
document.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => {
  currentPage = button.dataset.page;
  document.querySelectorAll("[data-page]").forEach((item) => { item.classList.toggle("active", item === button); item.setAttribute("aria-current", item === button ? "page" : "false"); });
  document.querySelectorAll("[data-section]").forEach((section) => { section.hidden = section.dataset.section !== button.dataset.page; });
  document.querySelector("main").scrollTop = 0;
  if (button.dataset.page === "data" && !storageLoaded) void operation(refreshStorage);
  form.querySelector('[type="submit"]').hidden = button.dataset.page === "health";
  if (button.dataset.page === "privacy") void operation(refreshPrivacy);
  if (button.dataset.page === "health") void operation(refreshHealth);
  scheduleRefresh();
}));

function scheduleRefresh() {
  if (refreshTimer) window.clearTimeout(refreshTimer); refreshTimer = null;
  if (document.hidden || !["data","privacy","health"].includes(currentPage)) return;
  refreshTimer = window.setTimeout(async () => {
    refreshTimer = null;
    if (!busy && !document.hidden) {
      try {
        if (currentPage === "health") await refreshHealth();
        else if (currentPage === "data" && !dirty) await refreshStorage();
        else if (currentPage === "privacy" && !dirty) await refreshPrivacy();
      } catch { /* Keep the last valid data until connection recovers. */ }
    }
    scheduleRefresh();
  }, currentPage === "health" ? 5000 : 15000);
}
document.addEventListener("visibilitychange", scheduleRefresh);
window.addEventListener("beforeunload", () => { if (refreshTimer) window.clearTimeout(refreshTimer); });
document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => {
  void operation(() => bridge.action(button.dataset.action));
}));
document.querySelectorAll("[data-data]").forEach((button) => button.addEventListener("click", () => {
  void operation(async () => {
    const action = button.dataset.data;
    const password = document.querySelector("#passphrase");
    const value = action === "backup-configure" ? { enabled: !backupStatus.enabled, passphrase: password.value } : action === "backup-restore" ? password.value : undefined;
    let result;
    try { result = await bridge.data(action, value); }
    finally { if (action.startsWith("backup-")) password.value = ""; }
    if (result?.canceled) { setStatus("Операция отменена."); return; }
    if (["import", "backup-restore"].includes(action) && result?.ok) {
      snapshot = await bridge.get();
      fill(snapshot.uiSettings);
      applyAppearance();
      dirty = false;
    }
    if (action === "backup-configure" && result.enabled) await bridge.data("backup-run");
    await refreshStorage();
    setStatus("Готово.");
  });
}));
document.querySelector("#retention").addEventListener("change", (event) => {
  const days = Number(event.target.value);
  if (!window.confirm(text("Изменить срок хранения? Записи старше выбранного срока будут удалены. Перед очисткой можно сделать экспорт."))) { storageLoaded = false; void operation(refreshStorage); return; }
  void operation(async () => { await bridge.data("retention", days); await refreshStorage(); setStatus("Срок хранения сохранён."); });
});
document.querySelectorAll("[data-clear]").forEach((button) => button.addEventListener("click", () => {
  void operation(async () => {
    const preview = await bridge.data("privacy-preview", { category: button.dataset.clear });
    if (!window.confirm(`${text("Удалить выбранные локальные данные? Перед очисткой можно сделать экспорт.")}\n${privacySummary(preview.affected)}`)) return;
    await bridge.data("clear", button.dataset.clear); await refreshStorage(); setStatus("Выбранные локальные данные удалены.");
  });
}));

function privacySummary(affected) {
  return `${text("Сессий")}: ${affected.sessions} · ${text("Событий друзей")}: ${affected.friendEvents} · ${text("Кеш друзей")}: ${affected.friendCache} · ${text("Заметок")}: ${affected.notes} · ${text("Планов")}: ${affected.plans || 0} · ${text("Фотографий")}: ${affected.photos || 0} · ${text("Записей диагностики")}: ${affected.diagnostics || 0}`;
}

async function refreshPrivacy() {
  privacyState = await bridge.data("privacy");
  for (const input of document.querySelectorAll("[data-policy]")) {
    const value = privacyState.policy[input.dataset.policy];
    if (input.type === "checkbox") input.checked = value;
    else {
      if (!input.options.length) for (const days of [0, 30, 90, 180, 365]) input.add(new Option(days ? `${days} ${text("дней")}` : text("Без ограничения"), String(days)));
      input.value = String(value);
    }
  }
  document.querySelector("#privacy-stats").textContent = `${text("Локально")}: ${privacyState.stats.sessions} ${text("сессий")}, ${privacyState.stats.socialEvents} ${text("событий друзей")}, ${privacyState.stats.playerPreferences + privacyState.stats.worldPreferences} ${text("заметок")}.`;
}

async function applyPrivacy() {
  if (!privacyState) return;
  const policy = {};
  for (const input of document.querySelectorAll("[data-policy]")) policy[input.dataset.policy] = input.type === "checkbox" ? input.checked : Number(input.value);
  const preview = await bridge.data("privacy-preview", { policy });
  if (!window.confirm(`${text("Применить политику хранения? Старые записи за пределами срока будут удалены.")}\n${privacySummary(preview.affected)}`)) return;
  await bridge.data("privacy-update", policy);
  await refreshPrivacy(); storageLoaded = false;
  setStatus("Политика хранения сохранена.");
}

async function refreshHealth() {
  const value = await bridge.data("health");
  const unknown = text("Неизвестно");
  const when = (date) => date ? new Date(date).toLocaleString(snapshot.uiSettings.language) : unknown;
  const rows = [
    ["Чтение лога", value.logError ? "Ошибка" : value.running ? "Активно" : "Остановлено"], ["Файл", value.fileName || "Не выбран"],
    ["Последнее успешное чтение", when(value.lastReadAt)],
    ["Причина", ({ ENOENT: "Файл отсутствует. Выберите новый лог.", EACCES: "Нет доступа к выбранному файлу.", EPERM: "Нет доступа к выбранному файлу.", EIO: "Ошибка чтения диска.", EBUSY: "Файл занят. Повторите чтение.", "read-error": "Не удалось прочитать лог." })[value.logError] || (value.running ? "Сбоев чтения не обнаружено" : "Чтение остановлено")],
    ["Последняя запись файла", when(value.log?.modifiedAt)], ["Последнее прочитанное событие", when(value.lastEventAt)],
    ["Подключение друзей", ({ connected: "Подключено", connecting: "Подключаемся…", disconnected: "Отключено", error: "Ошибка", unknown: "Неизвестно" })[value.pipeline.status] || unknown], ["Память процессов приложения", value.resources.workingSetMiB === null ? unknown : `${value.resources.workingSetMiB.toFixed(1)} ${text("МиБ")}`],
    ["CPU процессов приложения", value.resources.cpuPercent === null ? unknown : `${value.resources.cpuPercent.toFixed(2)}%`],
    ["Окно", value.minimized ? "Свёрнуто" : "Открыто"]
  ];
  const target = document.querySelector("#health-values"); target.replaceChildren();
  for (const [label, content] of rows) { const title = document.createElement("dt"); const detail = document.createElement("dd"); title.textContent = text(label); detail.textContent = text(content); target.append(title, detail); }
}

document.querySelector("#health-refresh").addEventListener("click", () => { void operation(refreshHealth); });
document.querySelector("#privacy-report").addEventListener("click", () => {
  void operation(async () => {
    const categories = [...document.querySelectorAll("[data-report-category]:checked")].map((input) => input.dataset.reportCategory);
    const stats = privacyState?.stats || (await bridge.data("privacy")).stats;
    const labels = { history: "История сессий", social: "События друзей", preferences: "Количество заметок", photos: "Количество фото", diagnostics: "Количество диагностических записей" };
    const preview = `${text("Отчёт без личных идентификаторов")}: ${categories.map((key) => text(labels[key])).join(", ")}\n${text("Сессий")}: ${categories.includes("history") ? stats.sessions : 0}\n${text("Событий друзей")}: ${categories.includes("social") ? stats.socialEvents : 0}\n${text("Заметок")}: ${categories.includes("preferences") ? stats.playerPreferences + stats.worldPreferences : 0}\n${text("Планов")}: ${categories.includes("preferences") ? stats.personalPlans : 0}\n${text("Фотографий")}: ${categories.includes("photos") ? stats.photos : 0}\n${text("Записей диагностики")}: ${categories.includes("diagnostics") ? stats.diagnostics : 0}`;
    if (!window.confirm(preview)) return;
    const result = await bridge.data("privacy-report", { categories });
    setStatus(result?.canceled ? "Операция отменена." : "Готово.");
  });
});

async function initialize() {
  if (!bridge) { setStatus("Откройте настройки из приложения.", true); return; }
  snapshot = await bridge.get();
  for (const preset of snapshot.presets) form.elements.preset.add(new Option(preset.label, preset.key));
  for (const option of form.elements.scale.options) { const value = option.value; option.textContent += "%"; option.value = value; }
  form.elements.preset.value = snapshot.appearance.preset || "studio";
  fill(snapshot.uiSettings);
  applyAppearance();
  document.documentElement.lang = snapshot.uiSettings.language;
  window.betaI18n.translateTree(document, snapshot.uiSettings.language);
  document.querySelector("#preview-label").hidden = !snapshot.preview;
  bridge.onSnapshot((updated) => {
    if (dirty) { setStatus("Есть несохранённые изменения."); return; }
    snapshot = updated;
    fill(snapshot.uiSettings);
    form.elements.preset.value = snapshot.appearance.preset || "studio";
    applyAppearance();
    document.documentElement.lang = snapshot.uiSettings.language;
    window.betaI18n.translateTree(document, snapshot.uiSettings.language);
    storageLoaded = false;
  });
}

void initialize().catch((error) => setStatus(error.message || "Не удалось загрузить настройки.", true));
