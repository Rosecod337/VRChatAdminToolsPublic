"use strict";

const previewMode = new URLSearchParams(window.location.search).get("preview") === "1";
const noteTools = window.betaAdminNotes;
const api = window.clientApi || (previewMode ? createPreviewApi() : null);
const activationView = document.querySelector("[data-activation-view]");
const activationForm = document.querySelector("[data-activation-form]");
const activationStatus = document.querySelector("[data-activation-status]");
const authorAliasField = document.querySelector("[data-author-alias-field]");
const authorAliasInput = activationForm?.elements.namedItem("authorAlias");
const importStableButton = document.querySelector("[data-import-stable]");
const appView = document.querySelector("[data-app-view]");
const runtimeStatus = document.querySelector("[data-runtime-status]");
const filePathLabel = document.querySelector("[data-file-path]");
const eventCount = document.querySelector("[data-event-count]");
const eventFeed = document.querySelector("[data-event-feed]");
const playerList = document.querySelector("[data-player-list]");
const pageEyebrow = document.querySelector("[data-page-eyebrow]");
const pageTitle = document.querySelector("[data-page-title]");
const appVersionLabel = document.querySelector("[data-app-version]");
const noteList = document.querySelector("[data-note-list]");
const noteCount = document.querySelector("[data-note-count]");
const adminCard = document.querySelector("[data-admin-card]");

const state = {
  settings: null,
  events: [],
  filePath: "",
  running: false,
  startedAt: null,
  view: "session",
  adminNotes: [],
  selectedAdminUserId: "",
  adminHistory: [],
  adminLoading: false,
  adminSaving: false,
  adminHistoryLoading: false,
  adminListError: "",
  adminError: "",
  adminListRequestId: 0,
  adminHistoryRequestId: 0
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

const ACTIVATION_ERROR_MESSAGES = Object.freeze({
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
});

function activationErrorCode(error) {
  const message = String(error?.message || error || "");
  return Object.keys(ACTIVATION_ERROR_MESSAGES).find((code) => message.includes(code)) || message;
}

function formatActivationError(error) {
  const code = activationErrorCode(error);
  return ACTIVATION_ERROR_MESSAGES[code] || code || "Не удалось активировать лицензию.";
}

function setAuthorAliasRequested(requested) {
  if (!authorAliasField || !authorAliasInput) return;
  authorAliasField.hidden = !requested;
  authorAliasInput.required = requested;
  if (!requested) authorAliasInput.value = "";
}

function showActivation(message = "Введите данные лицензии.", error = false) {
  appView.hidden = true;
  activationView.hidden = false;
  setAuthorAliasRequested(false);
  setActivationStatus(message, error);
}

async function showApp() {
  activationView.hidden = true;
  appView.hidden = false;
  if (appVersionLabel) {
    appVersionLabel.textContent = state.settings?.appVersion ? `Beta · ${state.settings.appVersion}` : "Beta";
  }
  const latest = await api.latestFile().catch(() => ({ filePath: "" }));
  if (latest.filePath) setFilePath(latest.filePath);
  setStatus(previewMode ? "Безопасный Chrome preview · вымышленные данные" : "Готово к запуску");
}

function createPreviewApi() {
  const handlers = { log: [], status: [], error: [] };
  let previewNotes = [
    { userId: "usr_demo_nova", displayName: "Nova", status: "watch", note: "Вежливо напомнить правила", updatedAt: "2026-08-01T20:35:00.000Z", updatedByKey: "VRC-PREVIEW", updatedByLabel: "Beta Preview" },
    { userId: "usr_demo_mira", displayName: "Mira", status: "ok", note: "Проверенный участник", updatedAt: "2026-08-01T20:20:00.000Z", updatedByKey: "VRC-PREVIEW", updatedByLabel: "Beta Preview" }
  ];
  const previewHistory = {
    usr_demo_nova: [
      { id: "preview-history-1", visibility: "team", previousStatus: "ok", previousNote: "", status: "watch", note: "Вежливо напомнить правила", updatedAt: "2026-08-01T20:35:00.000Z", updatedByKey: "VRC-PREVIEW", updatedByLabel: "Beta Preview" }
    ],
    usr_demo_mira: []
  };
  const sampleEvents = [
    { type: "world-joined", worldName: "Group Public", timestamp: "2026-08-01T21:41:00.000Z" },
    { type: "player-joined", playerName: "Nova", userId: "usr_demo_nova", timestamp: "2026-08-01T21:42:00.000Z" },
    { type: "player-joined", playerName: "Mira", userId: "usr_demo_mira", timestamp: "2026-08-01T21:43:00.000Z" },
    { type: "avatar-changed", playerName: "Mira", userId: "usr_demo_mira", avatarName: "Night Shift", timestamp: "2026-08-01T21:44:00.000Z" }
  ];
  return {
    getSettings: async () => ({ appVersion: "0.1.0-beta.5", hasSession: true, serverUrl: "https://api.vrchatadmintools.ru", license: { authorAlias: "Beta Preview" } }),
    importStableSettings: async () => ({ imported: true, reason: "stable_settings_imported" }),
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
    listPlayerNotes: async () => previewNotes.map((row) => ({ ...row })),
    savePlayerNote: async (payload) => {
      const previous = previewNotes.find((row) => row.userId === payload.userId) || {};
      const saved = {
        ...payload,
        updatedAt: new Date().toISOString(),
        updatedByKey: "VRC-PREVIEW",
        updatedByLabel: "Beta Preview"
      };
      previewHistory[payload.userId] = [{
        id: `preview-history-${Date.now()}`,
        visibility: "team",
        previousStatus: previous.status || "ok",
        previousNote: previous.note || "",
        status: saved.status,
        note: saved.note,
        updatedAt: saved.updatedAt,
        updatedByKey: saved.updatedByKey,
        updatedByLabel: saved.updatedByLabel
      }, ...(previewHistory[payload.userId] || [])];
      previewNotes = noteTools.mergeSavedNote(previewNotes, saved, previous);
      return { ...saved };
    },
    listPlayerNoteHistory: async (userId) => (previewHistory[userId] || []).map((row) => ({ ...row })),
    openExternal: async () => ({ ok: true }),
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

function adminElement(tag, className = "", text = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== "") element.textContent = text;
  return element;
}

function adminNote(userId) {
  return state.adminNotes.find((row) => row.userId === userId) || null;
}

function adminStatusLabel(status) {
  return noteTools.STATUS_OPTIONS.find((option) => option.value === status)?.label || status || "Без отметки";
}

function adminDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : date.toLocaleString("ru-RU");
}

function adminAuthor(record) {
  return record?.updatedByLabel || record?.updatedByKey || "—";
}

function renderAdminList() {
  noteList.replaceChildren();
  noteCount.textContent = state.adminLoading ? "загрузка…" : `${state.adminNotes.length} записей`;
  if (state.adminLoading && state.adminNotes.length === 0) {
    noteList.append(emptyMessage("Загружаем командные заметки…"));
    return;
  }
  if (state.adminListError && state.adminNotes.length === 0) {
    noteList.append(emptyMessage(state.adminListError));
    return;
  }
  for (const note of state.adminNotes.slice(0, 200)) {
    const row = adminElement("button", "dataRow adminNoteRow");
    row.type = "button";
    row.dataset.adminUserId = note.userId;
    row.classList.toggle("active", note.userId === state.selectedAdminUserId);
    row.setAttribute("aria-pressed", note.userId === state.selectedAdminUserId ? "true" : "false");
    const avatar = adminElement("span", "playerAvatar", (note.displayName || note.userId || "?").slice(0, 1).toUpperCase());
    const copy = adminElement("div");
    copy.append(
      adminElement("strong", "", note.displayName || note.userId || "Игрок"),
      adminElement("span", "", note.note || "Без заметки")
    );
    const status = adminElement("span", "adminNoteBadge", adminStatusLabel(note.status));
    status.dataset.status = note.status;
    row.append(avatar, copy, status);
    noteList.append(row);
  }
  if (!noteList.children.length) noteList.append(emptyMessage("Командных заметок пока нет."));
}

function appendAdminMeta(container, label, value) {
  const item = adminElement("div");
  item.append(adminElement("span", "", label), adminElement("strong", "", value || "—"));
  container.append(item);
}

function renderAdminHistory(container) {
  const section = adminElement("section", "adminHistory");
  section.append(adminElement("h3", "", "История изменений"));
  if (state.adminHistoryLoading) {
    section.append(emptyMessage("Загружаем историю…"));
  } else if (state.adminHistory.length === 0) {
    section.append(emptyMessage("Изменений пока нет."));
  } else {
    for (const row of state.adminHistory.slice(0, 12)) {
      const item = adminElement("article", "adminHistoryRow");
      const header = adminElement("header");
      header.append(
        adminElement("strong", "", adminAuthor(row)),
        adminElement("time", "", adminDate(row.updatedAt))
      );
      const scope = row.visibility === "global" ? "Для всех команд" : "Для команды";
      const previousStatus = row.previousStatus ? adminStatusLabel(row.previousStatus) : "—";
      item.append(header, adminElement("span", "adminHistoryChange", `${scope} · ${previousStatus} → ${adminStatusLabel(row.status)}`));
      if (row.previousNote !== row.note) {
        item.append(
          adminElement("p", "", `Было: ${row.previousNote || "без заметки"}`),
          adminElement("p", "", `Стало: ${row.note || "без заметки"}`)
        );
      }
      section.append(item);
    }
  }
  container.append(section);
}

function renderAdminCard() {
  adminCard.replaceChildren();
  const record = adminNote(state.selectedAdminUserId);
  if (!record) {
    adminCard.classList.add("adminPreviewEmpty");
    adminCard.append(
      adminElement("span", "profileAvatar", "N"),
      adminElement("h2", "", "Выберите игрока"),
      adminElement("p", "", "Откройте сохранённого игрока слева, чтобы изменить командную метку или заметку.")
    );
    return;
  }

  adminCard.classList.remove("adminPreviewEmpty");
  const content = adminElement("div", "adminCardContent");
  const header = adminElement("header", "adminCardHeader");
  const identity = adminElement("div", "adminIdentity");
  identity.append(
    adminElement("span", "profileAvatar", (record.displayName || record.userId || "?").slice(0, 1).toUpperCase()),
    adminElement("div", "", "")
  );
  identity.lastElementChild.append(
    adminElement("h2", "", record.displayName || record.userId || "Игрок"),
    adminElement("code", "", record.userId)
  );
  const actions = adminElement("div", "adminCardActions");
  const profileButton = adminElement("button", "", "Профиль");
  profileButton.type = "button";
  profileButton.dataset.adminProfile = `https://vrchat.com/home/user/${encodeURIComponent(record.userId)}`;
  const closeButton = adminElement("button", "adminCardClose", "×");
  closeButton.type = "button";
  closeButton.dataset.adminClear = "true";
  closeButton.title = "Убрать выбранного игрока";
  actions.append(profileButton, closeButton);
  header.append(identity, actions);
  content.append(header);

  if (state.adminError) content.append(adminElement("p", "adminError", state.adminError));

  const form = adminElement("form", "adminNoteForm");
  form.dataset.playerNoteForm = "true";
  form.dataset.userId = record.userId;
  const statusField = adminElement("label", "adminField");
  statusField.append(adminElement("span", "", "Метка"));
  const select = adminElement("select");
  select.name = "status";
  const statusOptions = noteTools.STATUS_OPTIONS.some((option) => option.value === record.status)
    ? noteTools.STATUS_OPTIONS
    : [...noteTools.STATUS_OPTIONS, { value: record.status, label: record.status }];
  for (const option of statusOptions) {
    const element = adminElement("option", "", option.label);
    element.value = option.value;
    element.selected = option.value === record.status;
    select.append(element);
  }
  statusField.append(select);
  const noteField = adminElement("label", "adminField");
  noteField.append(adminElement("span", "", "Заметка команды"));
  const textarea = adminElement("textarea");
  textarea.name = "note";
  textarea.maxLength = 2000;
  textarea.rows = 6;
  textarea.placeholder = "Заметка для вашей команды…";
  textarea.value = record.note;
  noteField.append(textarea);
  const saveBar = adminElement("div", "adminSaveBar");
  saveBar.append(adminElement("span", "", state.adminSaving ? "Сохраняем…" : "До 2000 символов"));
  const saveButton = adminElement("button", "primaryButton", state.adminSaving ? "Сохранение…" : "Сохранить");
  saveButton.type = "submit";
  saveButton.disabled = state.adminSaving;
  saveBar.append(saveButton);
  form.append(statusField, noteField, saveBar);
  content.append(form);

  const meta = adminElement("div", "adminMetaGrid");
  appendAdminMeta(meta, "Изменил", adminAuthor(record));
  appendAdminMeta(meta, "Ключ", record.updatedByKey || "—");
  appendAdminMeta(meta, "Обновлено", adminDate(record.updatedAt));
  content.append(meta);
  renderAdminHistory(content);
  adminCard.append(content);
}

async function loadAdminHistory(userId) {
  const requestId = ++state.adminHistoryRequestId;
  state.adminHistoryLoading = true;
  state.adminHistory = [];
  renderAdminCard();
  try {
    const rows = await api.listPlayerNoteHistory(userId);
    if (requestId !== state.adminHistoryRequestId || userId !== state.selectedAdminUserId) return;
    state.adminHistory = (rows || []).map(noteTools.normalizeHistoryRow);
  } catch (error) {
    if (requestId !== state.adminHistoryRequestId || userId !== state.selectedAdminUserId) return;
    state.adminError = error.message || "Не удалось загрузить историю изменений.";
  } finally {
    if (requestId === state.adminHistoryRequestId && userId === state.selectedAdminUserId) {
      state.adminHistoryLoading = false;
      renderAdminCard();
    }
  }
}

function selectAdminPlayer(userId) {
  if (!adminNote(userId)) return;
  state.selectedAdminUserId = userId;
  state.adminError = "";
  state.adminHistory = [];
  renderAdminList();
  renderAdminCard();
  void loadAdminHistory(userId);
}

async function saveAdminNote(form) {
  if (state.adminSaving) return;
  const record = adminNote(form.dataset.userId);
  if (!record) throw new Error("Игрок не найден в текущем списке.");
  const data = new FormData(form);
  const payload = noteTools.editorPayload(record, {
    status: data.get("status"),
    note: data.get("note")
  });
  state.adminNotes = noteTools.mergeSavedNote(state.adminNotes, payload, record);
  state.adminSaving = true;
  state.adminError = "";
  renderAdminList();
  renderAdminCard();
  try {
    const saved = await api.savePlayerNote(payload);
    state.adminNotes = noteTools.mergeSavedNote(state.adminNotes, saved || payload, payload);
    setStatus("Командная заметка сохранена");
    await loadAdminHistory(payload.userId);
  } catch (error) {
    state.adminError = error.message || "Не удалось сохранить заметку.";
    setStatus(state.adminError, true);
  } finally {
    state.adminSaving = false;
    renderAdminList();
    renderAdminCard();
  }
}

async function refreshAdmin() {
  const requestId = ++state.adminListRequestId;
  state.adminLoading = true;
  state.adminListError = "";
  renderAdminList();
  try {
    const notes = await api.listPlayerNotes();
    if (requestId !== state.adminListRequestId) return;
    state.adminNotes = (notes || []).map(noteTools.normalizeNote).filter((row) => row.userId);
    if (state.selectedAdminUserId && !adminNote(state.selectedAdminUserId)) {
      state.selectedAdminUserId = "";
      state.adminHistory = [];
    }
  } catch (error) {
    if (requestId !== state.adminListRequestId) return;
    state.adminListError = error.message || "Не удалось загрузить заметки.";
    setStatus(state.adminListError, true);
  } finally {
    if (requestId === state.adminListRequestId) {
      state.adminLoading = false;
      renderAdminList();
      renderAdminCard();
      if (state.selectedAdminUserId) void loadAdminHistory(state.selectedAdminUserId);
    }
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
    setAuthorAliasRequested(false);
    await showApp();
  } catch (error) {
    const code = activationErrorCode(error);
    if (code.startsWith("author_alias_")) {
      setAuthorAliasRequested(true);
      authorAliasInput?.focus();
    }
    setActivationStatus(formatActivationError(error), true);
  } finally {
    submit.disabled = false;
  }
});

importStableButton?.addEventListener("click", async () => {
  importStableButton.disabled = true;
  setActivationStatus("Копируем сохранённый вход из Stable…");
  try {
    const result = await api.importStableSettings();
    if (!result?.imported) {
      const message = result?.reason === "stable_session_not_found"
        ? "В Stable не найден сохранённый вход. Введите обычный ключ вручную."
        : "Не удалось перенести вход из Stable.";
      setActivationStatus(message, true);
      return;
    }
    state.settings = await api.getSettings();
    if (!state.settings.hasSession) throw new Error("Сохранённая сессия Stable недоступна.");
    await api.validate();
    await showApp();
  } catch (error) {
    setActivationStatus(error?.message || "Не удалось проверить вход из Stable.", true);
  } finally {
    importStableButton.disabled = false;
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-player-note-form]");
  if (!form) return;
  event.preventDefault();
  saveAdminNote(form).catch((error) => {
    state.adminError = error.message || "Не удалось сохранить заметку.";
    setStatus(state.adminError, true);
    renderAdminCard();
  });
});

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view-button]");
  if (viewButton) selectView(viewButton.dataset.viewButton);

  const layout = event.target.closest("[data-layout]")?.dataset.layout;
  if (layout) {
    document.querySelectorAll("[data-layout]").forEach((button) => button.classList.toggle("active", button.dataset.layout === layout));
    document.querySelector("[data-builder]").classList.toggle("rows", layout === "rows");
  }

  const adminUserButton = event.target.closest("[data-admin-user-id]");
  if (adminUserButton) {
    selectAdminPlayer(adminUserButton.dataset.adminUserId);
    return;
  }

  const profileButton = event.target.closest("[data-admin-profile]");
  if (profileButton) {
    api.openExternal(profileButton.dataset.adminProfile).catch((error) => setStatus(error.message || "Не удалось открыть профиль.", true));
    return;
  }

  if (event.target.closest("[data-admin-clear]")) {
    state.selectedAdminUserId = "";
    state.adminHistoryRequestId += 1;
    state.adminHistory = [];
    state.adminError = "";
    renderAdminList();
    renderAdminCard();
    return;
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
  if (!api || !noteTools) {
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
renderAdminList();
renderAdminCard();
initialize();
