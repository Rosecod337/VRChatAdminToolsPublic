"use strict";

const previewMode = new URLSearchParams(window.location.search).get("preview") === "1";
const api = window.clientApi || (previewMode ? createPreviewApi() : null);
const activationView = document.querySelector("[data-activation-view]");
const activationForm = document.querySelector("[data-activation-form]");
const activationStatus = document.querySelector("[data-activation-status]");
const appView = document.querySelector("[data-app-view]");
const runtimeStatus = document.querySelector("[data-runtime-status]");
const filePathLabel = document.querySelector("[data-file-path]");
const eventCount = document.querySelector("[data-event-count]");
const eventFeed = document.querySelector("[data-event-feed]");
const playerList = document.querySelector("[data-player-list]");
const pageEyebrow = document.querySelector("[data-page-eyebrow]");
const pageTitle = document.querySelector("[data-page-title]");

const state = {
  settings: null,
  events: [],
  filePath: "",
  running: false,
  startedAt: null,
  view: "session"
};

const viewTitles = {
  session: "Живая сессия",
  insights: "Мой VRChat",
  admin: "Admin Tools",
  crash: "Crash Analyzer",
  builder: "Builder Beta"
};

const viewEyebrows = {
  session: "Текущая сессия",
  insights: "Личная статистика",
  admin: "Командная работа",
  crash: "Диагностика",
  builder: "Новый конструктор"
};

function setStatus(message, error = false) {
  runtimeStatus.textContent = message;
  runtimeStatus.style.color = error ? "var(--red)" : "";
}

function setActivationStatus(message, error = false) {
  activationStatus.textContent = message;
  activationStatus.classList.toggle("error", error);
}

function formatActivationError(error) {
  const code = String(error?.message || "");
  const messages = {
    invalid_license: "Ключ не найден. Введите тот же ключ, который используется в Stable.",
    license_blocked: "Этот ключ заблокирован.",
    license_expired: "Срок действия ключа истёк.",
    device_limit_reached: "Для ключа достигнут лимит устройств.",
    author_alias_required: "Для нового ключа придумайте имя автора заметок.",
    author_alias_length: "Имя автора должно содержать от 3 до 24 символов.",
    author_alias_invalid_characters: "В имени разрешены буквы, цифры, пробел, точка, дефис и подчёркивание.",
    author_alias_mixed_scripts: "Не смешивайте кириллицу и латиницу в имени автора.",
    author_alias_reserved: "Это имя зарезервировано. Выберите другое.",
    author_alias_taken: "Это имя уже используется другим ключом."
  };
  return messages[code] || code || "Не удалось активировать лицензию.";
}

function showActivation(message = "Введите данные лицензии.", error = false) {
  appView.hidden = true;
  activationView.hidden = false;
  setActivationStatus(message, error);
}

async function showApp() {
  activationView.hidden = true;
  appView.hidden = false;
  const latest = await api.latestFile().catch(() => ({ filePath: "" }));
  if (latest.filePath) setFilePath(latest.filePath);
  setStatus(previewMode ? "Безопасный Chrome preview · вымышленные данные" : "Готово к запуску");
}

function createPreviewApi() {
  const handlers = { log: [], status: [], error: [] };
  const sampleEvents = [
    { type: "world-joined", worldName: "Group Public", timestamp: "2026-08-01T21:41:00.000Z" },
    { type: "player-joined", playerName: "Nova", userId: "usr_demo_nova", timestamp: "2026-08-01T21:42:00.000Z" },
    { type: "player-joined", playerName: "Mira", userId: "usr_demo_mira", timestamp: "2026-08-01T21:43:00.000Z" },
    { type: "avatar-changed", playerName: "Mira", userId: "usr_demo_mira", avatarName: "Night Shift", timestamp: "2026-08-01T21:44:00.000Z" }
  ];
  return {
    getSettings: async () => ({ hasSession: true, serverUrl: "https://api.example.invalid", license: { authorAlias: "Beta Preview" } }),
    validate: async () => ({ ok: true }),
    activate: async () => ({ ok: true }),
    logout: async () => ({ ok: true }),
    latestFile: async () => ({ filePath: "C:\\VRChat\\output_log_preview.txt" }),
    chooseFile: async () => ({ filePath: "C:\\VRChat\\output_log_preview.txt" }),
    startTail: async () => {
      handlers.status.forEach((handler) => handler({ running: true, filePath: "C:\\VRChat\\output_log_preview.txt" }));
      sampleEvents.forEach((event, index) => setTimeout(() => handlers.log.forEach((handler) => handler(event)), index * 80));
      return { filePath: "C:\\VRChat\\output_log_preview.txt", playSessionId: "preview" };
    },
    stopTail: async () => {
      handlers.status.forEach((handler) => handler({ running: false }));
      return { ok: true };
    },
    listPlaySessions: async () => [
      { startedAt: "2026-08-01T20:30:00.000Z", endedAt: "2026-08-01T22:00:00.000Z", worldName: "Group Public", snapshot: JSON.stringify({ players: [{ userId: "usr_demo_nova" }, { userId: "usr_demo_mira" }] }) },
      { startedAt: "2026-07-31T18:00:00.000Z", endedAt: "2026-07-31T19:15:00.000Z", worldName: "The Great Pug", snapshot: JSON.stringify({ players: [{ userId: "usr_demo_alex" }] }) }
    ],
    listPlayerNotes: async () => [
      { userId: "usr_demo_nova", displayName: "Nova", status: "watch", note: "Вежливо напомнить правила" },
      { userId: "usr_demo_mira", displayName: "Mira", status: "ok", note: "Проверенный участник" }
    ],
    getCrashStatus: async () => ({ processRunning: true, filePath: "C:\\VRChat\\output_log_preview.txt", logModifiedAt: new Date().toISOString() }),
    onLogEvent: (handler) => handlers.log.push(handler),
    onTailStatus: (handler) => handlers.status.push(handler),
    onTailError: (handler) => handlers.error.push(handler)
  };
}

function setFilePath(filePath) {
  state.filePath = String(filePath || "");
  filePathLabel.textContent = state.filePath || "Лог ещё не выбран";
  filePathLabel.title = state.filePath;
}

function eventTime(event) {
  const date = new Date(event.timestamp || event.capturedAt || Date.now());
  return Number.isNaN(date.getTime()) ? "--:--" : date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function eventName(event) {
  return String(event.display || event.playerName || event.worldName || event.avatarName || "Событие");
}

function eventKind(event) {
  const labels = {
    "player-joined": "вошёл",
    "player-left": "вышел",
    "avatar-changed": "сменил аватар",
    "avatar-data": "Avatar ID",
    "world-entering": "загрузка мира",
    "world-joining": "подключение к миру",
    "world-joined": "мир загружен",
    "portal-created": "создан портал",
    "portal-destroyed": "портал удалён"
  };
  return labels[event.type] || String(event.type || "событие");
}

function eventDetail(event) {
  return String(event.avatarName || event.worldName || event.userId || event.raw || "—");
}

function sessionStats() {
  const statusByUser = new Map();
  const unique = new Map();
  let online = 0;
  let peak = 0;
  let world = "—";

  for (const event of state.events) {
    if (event.type?.startsWith("world-") && (event.worldName || event.worldId)) world = event.worldName || event.worldId;
    if (!event.userId) continue;
    if (event.type === "player-joined") {
      unique.set(event.userId, event);
      if (statusByUser.get(event.userId)?.type !== "player-joined") online += 1;
      statusByUser.set(event.userId, event);
      peak = Math.max(peak, online);
    }
    if (event.type === "player-left") {
      if (statusByUser.get(event.userId)?.type === "player-joined") online = Math.max(0, online - 1);
      statusByUser.set(event.userId, event);
    }
  }

  const players = [...statusByUser.values()].filter((event) => event.type === "player-joined");
  return { online: players.length, peak, unique: unique.size, world, players };
}

function renderSession() {
  const stats = sessionStats();
  for (const [key, value] of Object.entries({ online: stats.online, peak: stats.peak, unique: stats.unique, world: stats.world })) {
    const target = document.querySelector(`[data-metric="${key}"]`);
    if (target) target.textContent = String(value);
  }

  eventCount.textContent = `${state.events.length} событий`;
  document.querySelector("[data-feed-count]").textContent = `${state.events.length} записей`;
  eventFeed.replaceChildren();
  for (const event of state.events.slice(-120).reverse()) {
    const row = document.createElement("div");
    row.className = `eventRow${event.type === "player-left" ? " left" : event.type?.startsWith("world-") ? " world" : ""}`;
    const time = document.createElement("time");
    time.textContent = eventTime(event);
    const dot = document.createElement("i");
    const name = document.createElement("strong");
    name.textContent = `${eventName(event)} · ${eventKind(event)}`;
    const detail = document.createElement("span");
    detail.textContent = eventDetail(event);
    row.append(time, dot, name, detail);
    eventFeed.append(row);
  }
  if (!eventFeed.children.length) {
    const empty = document.createElement("p");
    empty.className = "emptyState";
    empty.textContent = "Запустите чтение лога — новые события появятся здесь.";
    eventFeed.append(empty);
  }

  playerList.replaceChildren();
  for (const event of stats.players.slice(-80).reverse()) {
    const row = document.createElement("div");
    row.className = "playerRow";
    const avatar = document.createElement("span");
    avatar.className = "playerAvatar";
    avatar.textContent = eventName(event).slice(0, 1).toUpperCase() || "?";
    const copy = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = eventName(event);
    const id = document.createElement("span");
    id.textContent = event.userId || "ID не найден";
    copy.append(name, id);
    const badge = document.createElement("em");
    badge.textContent = "онлайн";
    row.append(avatar, copy, badge);
    playerList.append(row);
  }
  if (!playerList.children.length) {
    const empty = document.createElement("p");
    empty.className = "emptyState";
    empty.textContent = "Пока никого нет.";
    playerList.append(empty);
  }
}

function addEvent(event) {
  if (!event || typeof event !== "object") return;
  state.events.push(event);
  state.events = state.events.slice(-600);
  renderSession();
}

function selectView(view) {
  if (!viewTitles[view]) return;
  state.view = view;
  pageEyebrow.textContent = viewEyebrows[view];
  pageTitle.textContent = viewTitles[view];
  document.querySelectorAll("[data-view-button]").forEach((button) => button.classList.toggle("active", button.dataset.viewButton === view));
  document.querySelectorAll("[data-view]").forEach((panel) => {
    const active = panel.dataset.view === view;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });
  if (view === "insights") void refreshInsights();
  if (view === "admin") void refreshAdmin();
  if (view === "crash") void refreshCrash();
}

function parseSnapshot(session) {
  try {
    return typeof session.snapshot === "string" ? JSON.parse(session.snapshot) : session.snapshot || {};
  } catch {
    return {};
  }
}

function formatDuration(milliseconds) {
  const minutes = Math.max(0, Math.round(milliseconds / 60000));
  if (minutes < 60) return `${minutes} мин`;
  return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
}

async function refreshInsights() {
  const list = document.querySelector("[data-session-list]");
  list.replaceChildren();
  try {
    const sessions = await api.listPlaySessions();
    const worlds = new Set();
    const players = new Set();
    let duration = 0;
    for (const session of sessions) {
      if (session.worldName) worlds.add(session.worldName);
      const start = new Date(session.startedAt).getTime();
      const end = new Date(session.endedAt || Date.now()).getTime();
      if (Number.isFinite(start) && Number.isFinite(end)) duration += Math.max(0, end - start);
      for (const player of parseSnapshot(session).players || []) if (player.userId) players.add(player.userId);
    }
    document.querySelector('[data-insight="sessions"]').textContent = String(sessions.length);
    document.querySelector('[data-insight="duration"]').textContent = formatDuration(duration);
    document.querySelector('[data-insight="worlds"]').textContent = String(worlds.size);
    document.querySelector('[data-insight="players"]').textContent = String(players.size);
    for (const session of sessions.slice(0, 80)) {
      const row = document.createElement("div");
      row.className = "dataRow";
      const avatar = document.createElement("span");
      avatar.className = "playerAvatar";
      avatar.textContent = "W";
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = session.worldName || "Неизвестный мир";
      const meta = document.createElement("span");
      meta.textContent = new Date(session.startedAt).toLocaleString("ru-RU");
      copy.append(title, meta);
      const durationText = document.createElement("span");
      durationText.textContent = formatDuration(new Date(session.endedAt || Date.now()) - new Date(session.startedAt));
      row.append(avatar, copy, durationText);
      list.append(row);
    }
    if (!list.children.length) list.append(emptyMessage("Сохранённых сессий пока нет."));
  } catch (error) {
    list.append(emptyMessage(error.message || "Не удалось загрузить историю."));
  }
}

async function refreshAdmin() {
  const list = document.querySelector("[data-note-list]");
  list.replaceChildren();
  try {
    const notes = await api.listPlayerNotes();
    for (const note of notes.slice(0, 100)) {
      const row = document.createElement("div");
      row.className = "dataRow";
      const avatar = document.createElement("span");
      avatar.className = "playerAvatar";
      avatar.textContent = String(note.displayName || note.userId || "?").slice(0, 1).toUpperCase();
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = note.displayName || note.userId || "Игрок";
      const text = document.createElement("span");
      text.textContent = note.note || "Без заметки";
      copy.append(title, text);
      const status = document.createElement("span");
      status.textContent = note.status || "—";
      row.append(avatar, copy, status);
      list.append(row);
    }
    if (!list.children.length) list.append(emptyMessage("Командных заметок пока нет."));
  } catch (error) {
    list.append(emptyMessage(error.message || "Не удалось загрузить заметки."));
  }
}

async function refreshCrash() {
  try {
    const status = await api.getCrashStatus({ filePath: state.filePath });
    document.querySelector('[data-crash="process"]').textContent = status.processRunning ? "запущен" : "не запущен";
    document.querySelector('[data-crash="log"]').textContent = status.filePath ? "найден" : "не найден";
    document.querySelector('[data-crash="updated"]').textContent = status.logModifiedAt ? new Date(status.logModifiedAt).toLocaleString("ru-RU") : "—";
  } catch (error) {
    setStatus(error.message || "Не удалось проверить состояние.", true);
  }
}

function emptyMessage(text) {
  const empty = document.createElement("p");
  empty.className = "emptyState";
  empty.textContent = text;
  return empty;
}

async function chooseLog() {
  const result = await api.chooseFile();
  if (result.filePath) setFilePath(result.filePath);
}

async function startTail() {
  const stats = sessionStats();
  const payload = await api.startTail({ filePath: state.filePath, fromStart: false, worldName: stats.world === "—" ? "" : stats.world });
  state.running = true;
  state.startedAt = Date.now();
  state.events = [];
  renderSession();
  document.querySelector('[data-action="start"]').disabled = true;
  document.querySelector('[data-action="stop"]').disabled = false;
  setStatus(payload?.filePath ? "Чтение лога запущено" : "Мониторинг запущен");
}

async function stopTail() {
  const stats = sessionStats();
  await api.stopTail({ worldName: stats.world === "—" ? "" : stats.world, durationMs: state.startedAt ? Date.now() - state.startedAt : 0 });
  state.running = false;
  document.querySelector('[data-action="start"]').disabled = false;
  document.querySelector('[data-action="stop"]').disabled = true;
  setStatus("Чтение лога остановлено");
}

activationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(activationForm);
  const submit = activationForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  setActivationStatus("Активируем лицензию…");
  try {
    await api.activate({
      serverUrl: state.settings?.serverUrl,
      licenseKey: String(form.get("licenseKey") || ""),
      authorAlias: String(form.get("authorAlias") || ""),
      vrchatAuthCookie: String(form.get("vrchatAuthCookie") || "") || undefined,
      rememberMe: form.get("rememberMe") === "on"
    });
    activationForm.reset();
    await showApp();
  } catch (error) {
    setActivationStatus(formatActivationError(error), true);
  } finally {
    submit.disabled = false;
  }
});

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view-button]");
  if (viewButton) selectView(viewButton.dataset.viewButton);

  const layout = event.target.closest("[data-layout]")?.dataset.layout;
  if (layout) {
    document.querySelectorAll("[data-layout]").forEach((button) => button.classList.toggle("active", button.dataset.layout === layout));
    document.querySelector("[data-builder]").classList.toggle("rows", layout === "rows");
  }

  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  const operations = {
    choose: chooseLog,
    start: startTail,
    stop: stopTail,
    "refresh-insights": refreshInsights,
    "refresh-admin": refreshAdmin,
    "refresh-crash": refreshCrash,
    logout: async () => {
      await api.logout();
      showActivation("Сессия завершена.");
    }
  };
  const operation = operations[action];
  if (operation) operation().catch((error) => setStatus(error.message || "Операция не выполнена.", true));
});

api?.onLogEvent(addEvent);
api?.onTailStatus((status) => {
  state.running = Boolean(status.running);
  if (status.filePath) setFilePath(status.filePath);
  document.querySelector('[data-action="start"]').disabled = state.running;
  document.querySelector('[data-action="stop"]').disabled = !state.running;
  setStatus(state.running ? "Чтение лога активно" : "Чтение лога остановлено");
});
api?.onTailError((error) => setStatus(error?.message || "Ошибка чтения лога", true));

async function initialize() {
  if (!api) {
    showActivation("Безопасный мост приложения недоступен.", true);
    return;
  }
  try {
    state.settings = await api.getSettings();
    if (!state.settings.hasSession) {
      showActivation();
      return;
    }
    await api.validate();
    await showApp();
  } catch (error) {
    showActivation(error.message || "Сохранённая сессия недействительна.", true);
  }
}

renderSession();
initialize();
