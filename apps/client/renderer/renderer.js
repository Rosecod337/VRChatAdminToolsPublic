"use strict";

const shell = document.querySelector(".shell");
const activationView = document.querySelector("#activationView");
const appView = document.querySelector("#appView");
const activationForm = document.querySelector("#activationForm");
const activationStatus = document.querySelector("#activationStatus");
const licenseKey = document.querySelector("#licenseKey");
const activationAuthorField = document.querySelector("#activationAuthorField");
const activationAuthorAlias = document.querySelector("#activationAuthorAlias");
const vrchatAuthCookie = document.querySelector("#vrchatAuthCookie");
const rememberMe = document.querySelector("#rememberMe");
const checkVrchatBtn = document.querySelector("#checkVrchatBtn");
const activateBtn = document.querySelector("#activateBtn");
const runtimeStatus = document.querySelector("#runtimeStatus");
const updateBtn = document.querySelector("#updateBtn");
const communityBtn = document.querySelector("#communityBtn");
const betaPromo = document.querySelector("#betaPromo");
const betaPromoButton = document.querySelector("#betaPromoButton");
const betaPromoDismiss = document.querySelector("#betaPromoDismiss");
const chooseFileBtn = document.querySelector("#chooseFileBtn");
const analyzeCurrentBtn = document.querySelector("#analyzeCurrentBtn");
const copySnapshotBtn = document.querySelector("#copySnapshotBtn");
const startBtn = document.querySelector("#startBtn");
const stopBtn = document.querySelector("#stopBtn");
const logoutBtn = document.querySelector("#logoutBtn");
const filePathLabel = document.querySelector("#filePathLabel");
const eventCountLabel = document.querySelector("#eventCountLabel");
const tabs = document.querySelectorAll(".tab");
const panes = document.querySelectorAll(".tabPane");
const playersList = document.querySelector("#playersList");
const avatarsList = document.querySelector("#avatarsList");
const playersCount = document.querySelector("#playersCount");
const avatarsCount = document.querySelector("#avatarsCount");
const historyList = document.querySelector("#historyList");
const refreshHistoryBtn = document.querySelector("#refreshHistoryBtn");
const historySearch = document.querySelector("#historySearch");
const historyDate = document.querySelector("#historyDate");
const historyState = document.querySelector("#historyState");
const historyResetBtn = document.querySelector("#historyResetBtn");
const myVrchatPeriod = document.querySelector("#myVrchatPeriod");
const refreshMyVrchatBtn = document.querySelector("#refreshMyVrchatBtn");
const copyMyVrchatBtn = document.querySelector("#copyMyVrchatBtn");
const myVrchatContent = document.querySelector("#myVrchatContent");
const adminPlayerSearch = document.querySelector("#adminPlayerSearch");
const adminOnlineFilter = document.querySelector("#adminOnlineFilter");
const adminReadTodayPlayersBtn = document.querySelector("#adminReadTodayPlayersBtn");
const adminPlayerList = document.querySelector("#adminPlayerList");
const adminPlayerCard = document.querySelector("#adminPlayerCard");
const copyAdminSnapshotBtn = document.querySelector("#copyAdminSnapshotBtn");
const adminSyncStatus = document.querySelector("#adminSyncStatus");
const ownerTabButton = document.querySelector("#ownerTabButton");
const ownerGroupLabel = document.querySelector("#ownerGroupLabel");
const ownerSourceSelect = document.querySelector("#ownerSourceSelect");
const ownerPlayerSearch = document.querySelector("#ownerPlayerSearch");
const ownerGroupSearchBtn = document.querySelector("#ownerGroupSearchBtn");
const ownerOnlineFilter = document.querySelector("#ownerOnlineFilter");
const ownerReadTodayPlayersBtn = document.querySelector("#ownerReadTodayPlayersBtn");
const ownerPlayerList = document.querySelector("#ownerPlayerList");
const ownerPlayerCard = document.querySelector("#ownerPlayerCard");
const refreshModerationBtn = document.querySelector("#refreshModerationBtn");
const banRequestDialog = document.querySelector("#banRequestDialog");
const banRequestForm = document.querySelector("#banRequestForm");
const banRequestTarget = document.querySelector("#banRequestTarget");
const banRequestReason = document.querySelector("#banRequestReason");
const banRequestEvidence = document.querySelector("#banRequestEvidence");
const banRequestDurationField = document.querySelector("#banRequestDurationField");
const banRequestDuration = document.querySelector("#banRequestDuration");
const banRequestDurationUnit = document.querySelector("#banRequestDurationUnit");
const banReasonTemplate = document.querySelector("#banReasonTemplate");
const banRequestCloseBtn = document.querySelector("#banRequestCloseBtn");
const banRequestCancelBtn = document.querySelector("#banRequestCancelBtn");
const banRequestSubmitBtn = document.querySelector("#banRequestSubmitBtn");
const banRequestDialogTitle = banRequestForm?.querySelector("header h2");
const banRequestDialogNotice = banRequestForm?.querySelector(".moderationDialogNotice");
const banRequestModeField = banRequestForm?.querySelector(".moderationMode");
const banReasonTemplateField = banReasonTemplate?.closest("label");
const playerActionDialog = document.querySelector("#playerActionDialog");
const playerActionName = document.querySelector("#playerActionName");
const playerActionUserId = document.querySelector("#playerActionUserId");
const playerActionCloseBtn = document.querySelector("#playerActionCloseBtn");
const playerActionOwnerBtn = document.querySelector("#playerActionOwnerBtn");
const playerActionProfileBtn = document.querySelector("#playerActionProfileBtn");
const crashStatusBadge = document.querySelector("#crashStatusBadge");
const crashToggleBtn = document.querySelector("#crashToggleBtn");
const captureLagBtn = document.querySelector("#captureLagBtn");
const copyCrashReportBtn = document.querySelector("#copyCrashReportBtn");
const clearCrashHistoryBtn = document.querySelector("#clearCrashHistoryBtn");
const crashStatusText = document.querySelector("#crashStatusText");
const crashIncidentList = document.querySelector("#crashIncidentList");
const builderLayout = document.querySelector("#builderLayout");
const builderGrid = document.querySelector("#builderGrid");
const builderAddBlockBtn = document.querySelector("#builderAddBlockBtn");
const builderBlockPicker = document.querySelector("#builderBlockPicker");
const builderVisPlayers = document.querySelector("#builderVisPlayers");
const builderVisAvatars = document.querySelector("#builderVisAvatars");
const builderVisPortals = document.querySelector("#builderVisPortals");
const builderVisWorlds = document.querySelector("#builderVisWorlds");
const builderVisAdmin = document.querySelector("#builderVisAdmin");
const alwaysOnTopBtn = document.querySelector("#alwaysOnTopBtn");
const windowOpacityControl = document.querySelector("#windowOpacityControl");
const windowOpacityRange = document.querySelector("#windowOpacityRange");
const windowOpacityValue = document.querySelector("#windowOpacityValue");
const compactModeBtn = document.querySelector("#compactModeBtn");
const diagnosticsUpdatedAt = document.querySelector("#diagnosticsUpdatedAt");
const diagTail = document.querySelector("#diagTail");
const diagLastEvent = document.querySelector("#diagLastEvent");
const diagSync = document.querySelector("#diagSync");
const diagApi = document.querySelector("#diagApi");
const diagMemory = document.querySelector("#diagMemory");
const notifyMarkedPlayers = document.querySelector("#notifyMarkedPlayers");
const notifyCrashAvatars = document.querySelector("#notifyCrashAvatars");

const BUILDER_KINDS = ["players", "avatars", "portals", "worlds", "admin"];
const CRASH_LOG_SILENCE_WARNING_MS = 5 * 60 * 1000;
const CRASH_BUFFER_SAVE_DELAY_MS = 500;
const RESUME_REFRESH_DELAY_MS = 120;
const WINDOW_OPACITY_MIN_PERCENT = 40;
const WINDOW_OPACITY_MAX_PERCENT = 100;
const PLAYER_LIST_PAGE_SIZE = 100;
const BUILDER_PLAYER_LIMIT = 250;
const ACTIVE_MODERATION_STATUSES = new Set(["pending", "dispatching", "awaiting_review", "processing"]);
const MODERATION_REASON_TEMPLATES = {
  "crash-avatar": "Использование аватара, вызывающего критические лаги или сбой VRChat.",
  harassment: "Оскорбления, угрозы или систематическое преследование участников.",
  disruption: "Намеренный срыв мероприятия или работы администрации.",
  "ban-evasion": "Обход ранее выданной блокировки или ограничений группы.",
  rules: "Нарушение правил группы. Подробности: "
};
const savedBuilderSearch = loadJson("builderSearch", {});

function normalizeWindowOpacityPercent(value) {
  const percent = Number(value);
  if (!Number.isFinite(percent)) return WINDOW_OPACITY_MAX_PERCENT;
  return Math.min(WINDOW_OPACITY_MAX_PERCENT, Math.max(WINDOW_OPACITY_MIN_PERCENT, Math.round(percent)));
}

const state = {
  currentFile: null,
  events: [],
  eventIds: new Set(),
  playerEventIndex: null,
  historicalPlayerSummaries: null,
  renderTimer: null,
  renderDeferred: false,
  renderSuspended: false,
  resumeRefreshTimer: null,
  resumeRefreshInFlight: false,
  profiles: new Map(),
  search: { players: "", avatars: "" },
  adminSearch: "",
  adminOnlineFilter: localStorage.getItem("adminOnlineFilter") === "online" ? "online" : "all",
  adminPlayerPage: 0,
  selectedUserId: "",
  ownerSearch: "",
  ownerOnlineFilter: localStorage.getItem("ownerOnlineFilter") === "online" ? "online" : "all",
  ownerPlayerPage: 0,
  ownerSource: "logs",
  ownerSelectedUserId: "",
  playerActionTarget: null,
  moderationRequests: [],
  moderationRequestsInFlight: false,
  groupManagementRequests: [],
  groupManagementRequestsInFlight: false,
  groupManagementAppliedRequestId: "",
  groupMembers: [],
  groupRoles: [],
  groupMembersTotal: 0,
  groupMembersOffset: 0,
  groupMembersLimit: 100,
  groupMembersQuery: "",
  groupMembersHasMore: false,
  banRequestTarget: null,
  moderationRequestAction: "ban",
  license: null,
  teamId: "",
  teamScopeVersion: 0,
  playerNotesReady: false,
  playerNotes: {},
  knownPlayers: {},
  knownPlayersSaveTimer: null,
  noteSaveTimers: new Map(),
  notePollTimer: null,
  noteSyncInFlight: false,
  playerNoteOutbox: {},
  playerNoteFlushInFlight: false,
  globalPlayerNotes: loadJson("globalPlayerNotes", {}),
  globalPlayerNotesReady: false,
  globalPlayerNotesInFlight: false,
  globalPlayerNotesLastFetchAt: 0,
  globalAvatarNotes: loadJson("globalAvatarNotes", {}),
  globalAvatarNotesReady: false,
  globalAvatarNotesInFlight: false,
  globalAvatarNotesLastFetchAt: 0,
  playerNoteHistory: {},
  playerNoteHistoryInFlight: new Set(),
  avatarCatalog: {},
  avatarCatalogReady: false,
  avatarCatalogSyncInFlight: false,
  avatarCatalogSaveTimers: new Map(),
  avatarCatalogOutbox: {},
  avatarCatalogFlushInFlight: false,
  avatarCatalogPollTimer: null,
  avatarNotes: {},
  avatarNotesReady: false,
  avatarNotesSyncInFlight: false,
  avatarNotesSaveTimers: new Map(),
  avatarNotesPollTimer: null,
  avatarNoteOutbox: {},
  avatarNoteFlushInFlight: false,
  avatarResolveInFlight: new Set(),
  avatarNameResolveInFlight: new Set(),
  avatarCandidateResults: new Map(),
  serverSnapshot: loadJson("serverSnapshot", null),
  serverSamples: loadJson("serverSamples", []),
  serverSnapshotInFlight: false,
  serverSnapshotLastFetchAt: 0,
  tailRunning: false,
  lastEventAt: "",
  lastSyncAt: "",
  lastSyncError: "",
  notifyMarkedPlayers: localStorage.getItem("notifyMarkedPlayers") === "true",
  notifyCrashAvatars: localStorage.getItem("notifyCrashAvatars") === "true",
  notificationKeys: new Map(),
  crashAnalyzerEnabled: localStorage.getItem("crashAnalyzerEnabled") === "true",
  crashPollTimer: null,
  crashLastStatus: null,
  crashLastLogModifiedAt: "",
  crashFreezeReported: false,
  crashEventBuffer: loadJson("crashEventBuffer", []),
  crashBufferSaveTimer: null,
  crashIncidents: loadJson("crashIncidents", []),
  currentPlaySessionId: "",
  currentPlaySessionStartedAt: "",
  playSessionLastSyncAt: 0,
  playSessionSyncInFlight: false,
  historySessions: [],
  historyFilters: { search: "", date: "", state: "all" },
  builderOrder: loadJson("builderOrder", BUILDER_KINDS),
  builderLayout: localStorage.getItem("builderLayout") || "grid",
  builderVisible: loadJson("builderVisible", BUILDER_KINDS),
  builderSearch: {
    players: { name: "", ...(savedBuilderSearch.players || {}) },
    avatars: { name: "", avatar: "", ...(savedBuilderSearch.avatars || {}) },
    portals: { event: "", ...(savedBuilderSearch.portals || {}) },
    worlds: { world: "", ...(savedBuilderSearch.worlds || {}) }
  },
  builderAdminUserId: localStorage.getItem("builderAdminUserId") || "",
  alwaysOnTop: localStorage.getItem("alwaysOnTop") === "true",
  windowOpacity: normalizeWindowOpacityPercent(localStorage.getItem("windowOpacity") || WINDOW_OPACITY_MAX_PERCENT),
  compactMode: false
};

function setActivationStatus(text, isError = false) {
  activationStatus.textContent = text;
  activationStatus.style.color = isError ? "#ffb1a8" : "";
}

const ACTIVATION_ERROR_MESSAGES = Object.freeze({
    author_alias_required: "Для этого ключа укажите имя автора заметок.",
    author_alias_length: "Имя автора должно содержать от 3 до 24 символов.",
    author_alias_invalid_characters: "В имени автора разрешены буквы, цифры, пробел, точка, дефис и подчёркивание.",
    author_alias_mixed_scripts: "Не смешивайте кириллицу и латиницу в имени автора.",
    author_alias_reserved: "Это имя автора зарезервировано. Выберите другое.",
    author_alias_taken: "Это имя автора уже используется другим ключом."
});

function activationErrorCode(error) {
  const message = String(error?.message || error || "");
  return Object.keys(ACTIVATION_ERROR_MESSAGES).find((code) => message.includes(code)) || message;
}

function formatActivationError(error) {
  const code = activationErrorCode(error);
  return ACTIVATION_ERROR_MESSAGES[code] || code || "Не удалось активировать ключ";
}

function setAuthorAliasRequested(requested) {
  if (!activationAuthorField || !activationAuthorAlias) return;
  activationAuthorField.hidden = !requested;
  activationAuthorAlias.required = requested;
  if (!requested) activationAuthorAlias.value = "";
}

function formatVrchatAuthError(error) {
  const message = error?.message || String(error || "");
  if (/VRChat API HTTP 401|HTTP 401/u.test(message)) {
    return "VRChat cookie не подошёл или устарел. Проверьте, что вставили его в формате auth=authcookie_...";
  }
  if (/not configured|session is invalid/u.test(message)) {
    return "VRChat cookie не указан или недействителен. Скопируйте cookie auth через Cookie-Editor и вставьте его в формате auth=значение.";
  }
  return message;
}

function submittedVrchatCookie() {
  return vrchatAuthCookie.dataset.dirty === "true" ? vrchatAuthCookie.value : undefined;
}

function setStoredCookieState(hasStoredCookie) {
  vrchatAuthCookie.value = "";
  vrchatAuthCookie.dataset.dirty = "false";
  vrchatAuthCookie.dataset.stored = hasStoredCookie ? "true" : "false";
  vrchatAuthCookie.placeholder = hasStoredCookie ? "Cookie сохранён безопасно" : "auth=...";
}

function setRuntimeStatus(text, isError = false) {
  const value = String(text || "");
  runtimeStatus.textContent = value.length > 180 ? `${value.slice(0, 177)}...` : value;
  runtimeStatus.title = value;
  runtimeStatus.style.color = isError ? "#ffb1a8" : "";
}

function showApp() {
  activationView.hidden = true;
  appView.hidden = false;
  shell.hidden = false;
}

function showActivation() {
  appView.hidden = true;
  activationView.hidden = false;
  shell.hidden = false;
  setAuthorAliasRequested(false);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;");
}

function formatTime(event) {
  if (!event.timestamp) return event.timeText || "-";
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(event.timestamp));
}

function displayName(event) {
  const profile = event.userId ? state.profiles.get(event.userId) : null;
  if (profile?.displayName && profile.displayName !== event.userId) return profile.displayName;
  if (event.category === "portals") return "Портал";
  if (event.category === "worlds") return "VRChat";
  return event.playerName || event.userId || "-";
}

function eventKind(event) {
  const map = {
    "player-joined": "Вошел",
    "player-left": "Вышел",
    "avatar-changed": "Аватар",
    "avatar-loading": "Загрузка",
    "avatar-data": "Avatar ID",
    "avatar-audio": "📊 Стат",
    "world-entering": "Мир",
    "world-joining": "Instance",
    "world-joined": "Room",
    "portal-created": "Создан",
    "portal-destroyed": "Удалён"
  };
  return map[event.type] || event.type;
}

function eventDetails(event) {
  if (event.type === "avatar-changed") return event.avatarName || event.avatarId || "-";
  if (event.type === "avatar-loading") return "Loading avatar";
  if (event.type === "avatar-data") return event.avatarId || "-";
  if (event.type === "avatar-audio") {
    const name = event.avatarName || "неизвестный аватар";
    const ps = event.particleSystems ?? 0;
    const au = event.audioSources ?? 0;
    const parts = [];
    if (ps > 0) parts.push(`PS: ${ps}`);
    if (au > 0) parts.push(`🔊 Audio: ${au}`);
    return `${name} — ${parts.join(" | ")}`;
  }
  if (event.type?.startsWith("world-")) return event.worldName || event.worldId || event.instance || "-";
  if (event.type === "portal-created") return "Портал появился";
  if (event.type === "portal-destroyed") return "Портал удалён";
  if (event.type === "player-joined" || event.type === "player-left") return event.userId || "-";
  return event.raw || "-";
}

function playerLabel(userId, fallback = "") {
  const profile = userId ? state.profiles.get(userId) : null;
  return profile?.displayName || fallback || userId || "-";
}

function userIdByPlayerName(name) {
  const normalized = String(name || "").trim().toLowerCase();
  if (!normalized) return "";
  for (let index = state.events.length - 1; index >= 0; index -= 1) {
    const event = state.events[index];
    if (!event.userId || !event.playerName) continue;
    if (event.playerName.trim().toLowerCase() === normalized) return event.userId;
  }
  return "";
}

function normalizedPlayerName(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizedSeenAt(value) {
  const time = new Date(value || "").valueOf();
  return Number.isFinite(time) ? new Date(time).toISOString() : "";
}

function normalizeKnownPlayer(value, userId) {
  const source = value && typeof value === "object" ? value : {};
  return {
    userId,
    displayName: String(source.displayName || source.display_name || "").trim(),
    firstSeenAt: normalizedSeenAt(source.firstSeenAt || source.first_seen_at),
    lastSeenAt: normalizedSeenAt(source.lastSeenAt || source.last_seen_at)
  };
}

function trimKnownPlayers(limit = 10000) {
  const entries = Object.entries(state.knownPlayers);
  if (entries.length <= limit) return;
  entries.sort((left, right) => (
    new Date(right[1]?.lastSeenAt || 0).valueOf() - new Date(left[1]?.lastSeenAt || 0).valueOf()
  ));
  state.knownPlayers = Object.fromEntries(entries.slice(0, limit));
  invalidateHistoricalPlayerSummaries();
}

function cacheKnownPlayers() {
  if (state.knownPlayersSaveTimer) clearTimeout(state.knownPlayersSaveTimer);
  state.knownPlayersSaveTimer = null;
  trimKnownPlayers();
  saveTeamJson("knownPlayers", state.knownPlayers);
}

function queueKnownPlayersCache() {
  if (state.knownPlayersSaveTimer) return;
  state.knownPlayersSaveTimer = setTimeout(cacheKnownPlayers, 300);
}

function rememberKnownPlayer(value, options = {}) {
  const userId = String(value?.userId || "").trim();
  if (!userId.startsWith("usr_")) return false;
  const current = normalizeKnownPlayer(state.knownPlayers[userId], userId);
  const incomingSeenAt = normalizedSeenAt(value.lastSeenAt || value.timestamp || value.firstSeenAt) || new Date().toISOString();
  const incomingFirstSeenAt = normalizedSeenAt(value.firstSeenAt || value.timestamp) || incomingSeenAt;
  const currentLastMs = new Date(current.lastSeenAt || 0).valueOf();
  const incomingLastMs = new Date(incomingSeenAt).valueOf();
  const incomingName = String(value.displayName || value.playerName || "").trim();
  const next = {
    userId,
    displayName: incomingName && (!current.displayName || incomingLastMs >= currentLastMs)
      ? incomingName
      : current.displayName,
    firstSeenAt: !current.firstSeenAt || new Date(incomingFirstSeenAt).valueOf() < new Date(current.firstSeenAt).valueOf()
      ? incomingFirstSeenAt
      : current.firstSeenAt,
    lastSeenAt: !current.lastSeenAt || incomingLastMs >= currentLastMs ? incomingSeenAt : current.lastSeenAt
  };
  const changed = JSON.stringify(next) !== JSON.stringify(current);
  if (!changed) return false;
  state.knownPlayers[userId] = next;
  if (options.invalidateHistory !== false) invalidateHistoricalPlayerSummaries();
  if (options.cache !== false) queueKnownPlayersCache();
  return true;
}

function invalidateHistoricalPlayerSummaries() {
  state.historicalPlayerSummaries = null;
}

function invalidatePlayerEventIndex() {
  state.playerEventIndex = null;
}

function playerEventIndex() {
  if (state.playerEventIndex) return state.playerEventIndex;

  const userIds = new Set();
  const ownersByName = new Map();
  for (const event of state.events) {
    if (!event.userId) continue;
    userIds.add(event.userId);
    const name = normalizedPlayerName(event.playerName);
    if (!name) continue;
    if (!ownersByName.has(name)) ownersByName.set(name, new Set());
    ownersByName.get(name).add(event.userId);
  }

  const byUserId = new Map([...userIds].map((userId) => [userId, []]));
  const currentByUserId = new Map([...userIds].map((userId) => [userId, []]));
  const currentWorldStart = currentWorldStartIndex(state.events);
  for (let index = 0; index < state.events.length; index += 1) {
    const event = state.events[index];
    let userId = event.userId || "";
    if (!userId) {
      const owners = ownersByName.get(normalizedPlayerName(event.playerName));
      if (owners?.size === 1) userId = owners.values().next().value;
    }
    if (!userId || !byUserId.has(userId)) continue;
    byUserId.get(userId).push(event);
    if (index >= currentWorldStart) currentByUserId.get(userId).push(event);
  }

  state.playerEventIndex = { byUserId, currentByUserId, userIds };
  return state.playerEventIndex;
}

function playerRecord(userId) {
  if (!state.playerNotes[userId]) {
    state.playerNotes[userId] = { status: "ok", note: "", displayName: "", updatedAt: "", updatedByKey: "", updatedByLabel: "" };
  } else {
    state.playerNotes[userId] = normalizePlayerNote(state.playerNotes[userId], {
      status: "ok",
      note: "",
      displayName: "",
      updatedAt: "",
      updatedByKey: "",
      updatedByLabel: ""
    });
  }
  return state.playerNotes[userId];
}

function playerRecordView(userId) {
  return normalizePlayerNote(state.playerNotes[userId]);
}

function currentAdminIdentity() {
  const license = state.license || {};
  const key = String(license.keyPrefix || license.id || "").trim();
  const authorAlias = String(license.authorAlias || "").trim();
  const legacyLabel = String(license.label || "").trim();
  const legacyPaymentLabel = /^(?:yookassa|payment)\s+order\s+#\d+$/iu.test(legacyLabel);
  const label = authorAlias || (!legacyPaymentLabel ? legacyLabel : "") || key;
  return {
    key: key.slice(0, 80),
    label: label.slice(0, 120)
  };
}

function formatAuthorIdentity(labelValue, keyValue) {
  const label = String(labelValue || "").trim();
  const key = String(keyValue || "").trim();
  if (!label && !key) return "Неизвестный администратор";
  if (!key || label === key) return label || key;
  const suffix = key.endsWith("…") || key.endsWith("...") ? "" : "…";
  return `${label || "Администратор"} · ${key}${suffix}`;
}

function moderationRequestError(error) {
  const code = error?.message || String(error || "");
  const messages = {
    moderation_request_permission_required: "У этого ключа нет Owner-доступа.",
    moderation_group_not_configured: "Для этого ключа не настроена VRChat-группа.",
    active_moderation_request_exists: "По этому игроку уже есть незавершённый запрос.",
    moderation_request_retry_not_allowed: "Повторно отправить можно только операцию, завершившуюся ошибкой.",
    "durationMinutes is not allowed": "Выбран недопустимый срок временного бана.",
    "targetUserId must be a VRChat user id": "В логе не найден корректный VRChat User ID игрока.",
    "evidenceUrl must be a valid HTTPS URL": "Ссылка на доказательства должна начинаться с https://"
  };
  return messages[code] || code;
}

function groupManagementError(error) {
  const code = error?.message || String(error || "");
  const retryAfterSeconds = Math.max(0, Number(error?.retryAfterSeconds || 0));
  if (code === "group_management_cooldown") {
    return `Подождите ${retryAfterSeconds || 15} сек. перед повтором этой операции.`;
  }
  if (code === "group_management_request_active") {
    return "Такая операция уже находится в очереди. Дождитесь её завершения.";
  }
  const messages = {
    group_management_permission_required: "У этого ключа нет доступа к управлению группой.",
    moderation_group_not_configured: "Для этого ключа не настроена VRChat-группа.",
    invalid_group_management_action: "Недопустимое действие управления группой.",
    "group member search requires at least 3 characters": "Для поиска по имени введите не менее трёх символов.",
    "targetUserId must be a VRChat user id": "Укажите корректный VRChat User ID или ссылку на профиль.",
    "roleId must be a VRChat group role id": "VRChat вернул некорректный идентификатор роли."
  };
  return messages[code] || code;
}

function globalPublicationError(error) {
  const code = error?.message || String(error || "");
  if (code === "global_publication_cooldown") {
    const retryAfterSeconds = Math.max(1, Number(error?.retryAfterSeconds || 60));
    return `Подождите ${retryAfterSeconds} сек. перед следующей общей публикацией.`;
  }
  const messages = {
    global_publication_permission_required: "У этого ключа нет отдельного права на общую публикацию.",
    global_publication_daily_limit: "Суточный лимит общих публикаций для этой команды исчерпан."
  };
  return messages[code] || code;
}

function vrchatUserIdFromInput(value) {
  const text = String(value || "").trim();
  const direct = text.match(/^usr_[0-9a-f-]{36}$/iu);
  if (direct) return direct[0];
  const profile = text.match(/^https?:\/\/(?:www\.)?vrchat\.com\/home\/user\/(usr_[0-9a-f-]{36})(?:[/?#].*)?$/iu);
  return profile?.[1] || "";
}

function moderationDurationMinutes() {
  const amount = Number(banRequestDuration?.value);
  const multiplier = {
    minutes: 1,
    hours: 60,
    days: 24 * 60
  }[banRequestDurationUnit?.value] || 1;
  const minutes = amount * multiplier;
  if (!Number.isInteger(amount) || !Number.isInteger(minutes) || minutes < 5 || minutes > 30 * 24 * 60) {
    throw new Error("durationMinutes is not allowed");
  }
  return minutes;
}

function syncModerationDurationLimits() {
  if (!banRequestDuration || !banRequestDurationUnit) return;
  const limits = {
    minutes: { min: 5, max: 43200 },
    hours: { min: 1, max: 720 },
    days: { min: 1, max: 30 }
  }[banRequestDurationUnit.value];
  banRequestDuration.min = String(limits.min);
  banRequestDuration.max = String(limits.max);
  const value = Number(banRequestDuration.value);
  if (!Number.isFinite(value) || value < limits.min) banRequestDuration.value = String(limits.min);
  if (value > limits.max) banRequestDuration.value = String(limits.max);
}

function syncModerationRequestDialog() {
  const isUnban = state.moderationRequestAction === "unban";
  if (banRequestDialogTitle) {
    banRequestDialogTitle.textContent = isUnban ? "Разбанить в группе" : "Забанить в группе";
  }
  if (banRequestDialogNotice) {
    banRequestDialogNotice.textContent = isUnban
      ? "Разбан будет передан службе модерации без ручного подтверждения. Проверьте профиль игрока и укажите причину перед отправкой."
      : "Действие будет передано службе модерации без ручного подтверждения. Проверьте игрока, срок и причину перед отправкой.";
  }
  if (banRequestSubmitBtn) {
    banRequestSubmitBtn.textContent = isUnban ? "Выполнить разбан" : "Выполнить бан";
  }
  if (banRequestModeField) banRequestModeField.hidden = isUnban;
  if (banReasonTemplateField) banReasonTemplateField.hidden = isUnban;
  const temporary = banRequestForm?.querySelector('input[name="banDurationMode"]:checked')?.value === "temporary";
  if (banRequestDurationField) banRequestDurationField.hidden = isUnban || !temporary;
}

function openBanRequestDialog(userId, action = "ban") {
  if (!banRequestDialog || !state.license?.canRequestGroupBan) return;
  const summary = buildPlayerSummary(userId);
  const groupMember = groupMemberById(userId);
  state.moderationRequestAction = action === "unban" ? "unban" : "ban";
  state.banRequestTarget = {
    userId,
    displayName: groupMember?.displayName || summary.name || userId
  };
  banRequestTarget.textContent = `${state.banRequestTarget.displayName} · ${userId}`;
  banRequestReason.value = "";
  banRequestEvidence.value = "";
  if (banReasonTemplate) banReasonTemplate.value = "";
  if (banRequestDuration) banRequestDuration.value = "30";
  if (banRequestDurationUnit) banRequestDurationUnit.value = "minutes";
  syncModerationDurationLimits();
  const permanent = banRequestForm?.querySelector('input[name="banDurationMode"][value="permanent"]');
  if (permanent) permanent.checked = true;
  syncModerationRequestDialog();
  banRequestDialog.showModal();
  banRequestReason.focus();
}

function closeBanRequestDialog() {
  if (banRequestDialog?.open) banRequestDialog.close();
  state.banRequestTarget = null;
  state.moderationRequestAction = "ban";
}

function canRequestOwnerBans() {
  return Boolean(state.license?.canRequestGroupBan);
}

function canViewGroupMembers() {
  return Boolean(state.license?.canViewGroupMembers);
}

function canManageGroupRoles() {
  return Boolean(state.license?.canManageGroupRoles);
}

function canKickGroupMembers() {
  return Boolean(state.license?.canKickGroupMembers);
}

function canPublishGlobalNotes() {
  return Boolean(state.license?.canPublishGlobalNotes);
}

function hasGroupManagementAccess() {
  return canViewGroupMembers() || canManageGroupRoles() || canKickGroupMembers();
}

function hasOwnerAccess() {
  return (canRequestOwnerBans() || hasGroupManagementAccess()) &&
    Boolean(state.license?.moderationGroupId);
}

function syncOwnerAccess() {
  const enabled = hasOwnerAccess();
  if (ownerTabButton) ownerTabButton.hidden = !enabled;
  if (ownerGroupLabel) {
    ownerGroupLabel.textContent = enabled
      ? state.license.moderationGroupId
      : "VRChat-группа не настроена";
  }
  if (ownerSourceSelect) {
    const groupOption = ownerSourceSelect.querySelector('option[value="group"]');
    if (groupOption) groupOption.disabled = !canViewGroupMembers();
    if (!canViewGroupMembers() && state.ownerSource === "group") {
      state.ownerSource = "logs";
      ownerSourceSelect.value = "logs";
    }
  }
  if (ownerGroupSearchBtn) ownerGroupSearchBtn.disabled = !canViewGroupMembers();
  if (!enabled && activePaneName() === "owner") {
    document.querySelector('.tab[data-tab="admin"]')?.click();
  }
}

function normalizePlayerNote(row, fallback = {}) {
  return {
    status: row?.status || fallback.status || "ok",
    note: row?.note ?? fallback.note ?? "",
    displayName: row?.display_name || row?.displayName || fallback.displayName || "",
    updatedAt: row?.updated_at || row?.updatedAt || fallback.updatedAt || "",
    updatedByKey: row?.updated_by_key || row?.updatedByKey || fallback.updatedByKey || "",
    updatedByLabel: row?.updated_by_label || row?.updatedByLabel || fallback.updatedByLabel || ""
  };
}

function touchPlayerRecord(record) {
  const admin = currentAdminIdentity();
  record.updatedAt = new Date().toISOString();
  if (admin.key) record.updatedByKey = admin.key;
  if (admin.label) record.updatedByLabel = admin.label;
  invalidateHistoricalPlayerSummaries();
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "-";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function teamIdFromLicense(license) {
  return String(license?.teamId || license?.team_id || license?.id || "").trim();
}

function teamStorageKey(name, teamId = state.teamId) {
  return `team-cache-v2:${encodeURIComponent(teamId || "unassigned")}:${name}`;
}

function loadTeamJson(name, fallback, teamId = state.teamId) {
  return loadJson(teamStorageKey(name, teamId), fallback);
}

function saveTeamJson(name, value, teamId = state.teamId) {
  if (!teamId) return;
  localStorage.setItem(teamStorageKey(name, teamId), JSON.stringify(value));
}

function migrateLegacyTeamCache(teamId) {
  if (!teamId || localStorage.getItem("team-cache-v2:migrated")) return;
  for (const name of ["playerNotes", "avatarCatalog", "avatarNotes"]) {
    const legacy = loadJson(name, null);
    if (legacy && typeof legacy === "object" && Object.keys(legacy).length > 0) {
      saveTeamJson(name, legacy, teamId);
    }
  }
  localStorage.setItem("team-cache-v2:migrated", teamId);
}

function setTeamScope(license, options = {}) {
  const teamId = teamIdFromLicense(license);
  if (!teamId) {
    clearTeamScope();
    return false;
  }
  if (options.migrateLegacy) migrateLegacyTeamCache(teamId);
  if (state.teamId === teamId) return false;

  if (state.teamId) cacheKnownPlayers();
  clearPendingTeamSaveTimers();
  state.teamScopeVersion += 1;
  state.teamId = teamId;
  state.avatarNameResolveInFlight.clear();
  state.avatarCandidateResults.clear();
  state.playerNotes = loadTeamJson("playerNotes", {});
  state.knownPlayers = loadTeamJson("knownPlayers", {});
  invalidateHistoricalPlayerSummaries();
  state.playerNoteOutbox = loadTeamJson("playerNoteOutbox", {});
  state.avatarCatalog = loadTeamJson("avatarCatalog", {});
  state.avatarCatalogOutbox = loadTeamJson("avatarCatalogOutbox", {});
  state.avatarNotes = loadTeamJson("avatarNotes", {});
  state.avatarNoteOutbox = loadTeamJson("avatarNoteOutbox", {});
  state.playerNotesReady = false;
  state.avatarCatalogReady = false;
  state.avatarNotesReady = false;
  state.noteSyncInFlight = false;
  state.playerNoteFlushInFlight = false;
  state.avatarCatalogSyncInFlight = false;
  state.avatarCatalogFlushInFlight = false;
  state.avatarNotesSyncInFlight = false;
  state.avatarNoteFlushInFlight = false;
  return true;
}

function clearTeamScope() {
  if (state.teamId) cacheKnownPlayers();
  clearPendingTeamSaveTimers();
  state.teamScopeVersion += 1;
  state.teamId = "";
  state.avatarNameResolveInFlight.clear();
  state.avatarCandidateResults.clear();
  state.playerNotes = {};
  state.knownPlayers = {};
  invalidateHistoricalPlayerSummaries();
  state.playerNoteOutbox = {};
  state.avatarCatalog = {};
  state.avatarCatalogOutbox = {};
  state.avatarNotes = {};
  state.avatarNoteOutbox = {};
  state.playerNotesReady = false;
  state.avatarCatalogReady = false;
  state.avatarNotesReady = false;
  state.noteSyncInFlight = false;
  state.playerNoteFlushInFlight = false;
  state.avatarCatalogSyncInFlight = false;
  state.avatarCatalogFlushInFlight = false;
  state.avatarNotesSyncInFlight = false;
  state.avatarNoteFlushInFlight = false;
}

function clearPendingTeamSaveTimers() {
  for (const timer of state.noteSaveTimers.values()) clearTimeout(timer);
  for (const timer of state.avatarNotesSaveTimers.values()) clearTimeout(timer);
  for (const timer of state.avatarCatalogSaveTimers.values()) clearTimeout(timer);
  state.noteSaveTimers.clear();
  state.avatarNotesSaveTimers.clear();
  state.avatarCatalogSaveTimers.clear();
}

function stopTeamSyncPolling() {
  if (state.notePollTimer) clearInterval(state.notePollTimer);
  if (state.avatarNotesPollTimer) clearInterval(state.avatarNotesPollTimer);
  if (state.avatarCatalogPollTimer) clearInterval(state.avatarCatalogPollTimer);
  state.notePollTimer = null;
  state.avatarNotesPollTimer = null;
  state.avatarCatalogPollTimer = null;
  clearPendingTeamSaveTimers();
}

function isCurrentTeamScope(version, teamId) {
  return Boolean(teamId) && state.teamScopeVersion === version && state.teamId === teamId;
}

function cachePlayerNotes() {
  saveTeamJson("playerNotes", state.playerNotes);
}

function cachePlayerNoteOutbox() {
  saveTeamJson("playerNoteOutbox", state.playerNoteOutbox);
}

function importServerPlayerNotes(notes) {
  const next = { ...state.playerNotes };
  let summariesChanged = false;
  for (const row of notes || []) {
    const userId = row.user_id || row.userId;
    if (!userId) continue;
    if (state.noteSaveTimers.has(userId) || state.playerNoteOutbox[userId] || isEditingAdminPlayer(userId)) continue;
    const normalized = normalizePlayerNote(row, next[userId]);
    if (JSON.stringify(normalized) !== JSON.stringify(next[userId])) summariesChanged = true;
    next[userId] = normalized;
  }
  state.playerNotes = next;
  if (summariesChanged) invalidateHistoricalPlayerSummaries();
  state.playerNotesReady = true;
  cachePlayerNotes();
  if (activePaneName() === "admin" && !isEditingAdminPlayer()) renderWhenVisible(renderAdminTools);
  if (activePaneName() === "owner" && !isEditingAdminPlayer(state.ownerSelectedUserId)) {
    renderWhenVisible(renderOwnerTools);
  }
}

async function loadPlayerNotes(options = {}) {
  const { pushLocal = false, silent = false } = options;
  const scopeVersion = state.teamScopeVersion;
  const teamId = state.teamId;
  if (!teamId) return;
  if (state.noteSyncInFlight) return;
  state.noteSyncInFlight = true;
  try {
    const localBeforeSync = { ...state.playerNotes };
    const notes = await window.clientApi.listPlayerNotes();
    if (!isCurrentTeamScope(scopeVersion, teamId)) return;
    const serverUserIds = new Set((notes || []).map((row) => row.user_id || row.userId).filter(Boolean));
    importServerPlayerNotes(notes);
    if (pushLocal) {
      const localOnlyRecords = Object.entries(localBeforeSync)
        .filter(([userId, record]) => !serverUserIds.has(userId) && (record?.status !== "ok" || record?.note))
        .slice(0, 100)
        .map(([userId]) => userId);
      for (const userId of localOnlyRecords) state.playerNoteOutbox[userId] = true;
      cachePlayerNoteOutbox();
      await flushPlayerNotes({ silent: true });
      if (!isCurrentTeamScope(scopeVersion, teamId)) return;
    }
    if (!silent) setRuntimeStatus("Admin Tools notes synced");
    state.lastSyncAt = new Date().toISOString();
    state.lastSyncError = "";
  } catch (error) {
    if (!isCurrentTeamScope(scopeVersion, teamId)) return;
    state.playerNotesReady = false;
    state.lastSyncError = error.message;
    if (!silent) setRuntimeStatus(`Admin Tools notes: local cache only (${error.message})`, true);
  } finally {
    if (isCurrentTeamScope(scopeVersion, teamId)) state.noteSyncInFlight = false;
  }
}

function normalizeGlobalPlayerNote(row) {
  return {
    sourceTeamId: String(row?.source_team_id || row?.sourceTeamId || ""),
    userId: String(row?.user_id || row?.userId || ""),
    displayName: String(row?.display_name || row?.displayName || ""),
    status: String(row?.status || "ok"),
    note: String(row?.note || ""),
    updatedByKey: String(row?.updated_by_key || row?.updatedByKey || ""),
    updatedByLabel: String(row?.updated_by_label || row?.updatedByLabel || ""),
    updatedAt: row?.updated_at || row?.updatedAt || ""
  };
}

function importGlobalPlayerNotes(rows) {
  const grouped = {};
  for (const row of rows || []) {
    const note = normalizeGlobalPlayerNote(row);
    if (!note.userId || !note.sourceTeamId) continue;
    if (!grouped[note.userId]) grouped[note.userId] = [];
    grouped[note.userId].push(note);
  }
  for (const notes of Object.values(grouped)) {
    notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }
  state.globalPlayerNotes = grouped;
  state.globalPlayerNotesReady = true;
  state.globalPlayerNotesLastFetchAt = Date.now();
  localStorage.setItem("globalPlayerNotes", JSON.stringify(grouped));
  if (activePaneName() === "admin" && !isEditingAdminPlayer()) renderWhenVisible(renderAdminPlayerCard);
  if (activePaneName() === "owner" && !isEditingAdminPlayer(state.ownerSelectedUserId)) {
    renderWhenVisible(renderOwnerTools);
  }
}

async function loadGlobalPlayerNotes(options = {}) {
  const { force = false, silent = false } = options;
  if (state.globalPlayerNotesInFlight) return;
  if (!force && Date.now() - state.globalPlayerNotesLastFetchAt < 15_000) return;
  state.globalPlayerNotesInFlight = true;
  try {
    importGlobalPlayerNotes(await window.clientApi.listGlobalPlayerNotes());
  } catch (error) {
    state.globalPlayerNotesReady = false;
    state.globalPlayerNotesLastFetchAt = Date.now();
    if (!silent) setRuntimeStatus(`Общие заметки недоступны: ${error.message}`, true);
  } finally {
    state.globalPlayerNotesInFlight = false;
  }
}

function globalReportsForPlayer(userId) {
  return Array.isArray(state.globalPlayerNotes[userId]) ? state.globalPlayerNotes[userId] : [];
}

function ownGlobalReport(userId) {
  return globalReportsForPlayer(userId).find((row) => row.sourceTeamId === state.teamId) || null;
}

async function loadPlayerNoteHistory(userId, options = {}) {
  if (!userId || state.playerNoteHistoryInFlight.has(userId)) return;
  if (!options.force && state.playerNoteHistory[userId]) return;
  state.playerNoteHistoryInFlight.add(userId);
  try {
    state.playerNoteHistory[userId] = await window.clientApi.listPlayerNoteHistory(userId);
  } catch (error) {
    state.playerNoteHistory[userId] = [];
    if (!options.silent) setRuntimeStatus(`История заметки недоступна: ${error.message}`, true);
  } finally {
    state.playerNoteHistoryInFlight.delete(userId);
    if (state.selectedUserId === userId && activePaneName() === "admin" && !isEditingAdminPlayer(userId)) {
      renderAdminPlayerCard();
    }
    if (state.ownerSelectedUserId === userId && activePaneName() === "owner" && !isEditingAdminPlayer(userId)) {
      renderOwnerTools();
    }
  }
}

async function publishGlobalPlayerNote(userId) {
  if (!canPublishGlobalNotes()) {
    throw new Error("global_publication_permission_required");
  }
  const record = playerRecord(userId);
  const saved = await window.clientApi.saveGlobalPlayerNote({
    userId,
    displayName: buildPlayerSummary(userId).name,
    status: record.status,
    note: record.note
  });
  const note = normalizeGlobalPlayerNote(saved);
  const others = globalReportsForPlayer(userId).filter((row) => row.sourceTeamId !== note.sourceTeamId);
  state.globalPlayerNotes[userId] = [note, ...others];
  localStorage.setItem("globalPlayerNotes", JSON.stringify(state.globalPlayerNotes));
  delete state.playerNoteHistory[userId];
  await loadPlayerNoteHistory(userId, { force: true, silent: true });
  setRuntimeStatus("Заметка опубликована для всех команд");
}

async function removeGlobalPlayerNote(userId) {
  if (!canPublishGlobalNotes()) {
    throw new Error("global_publication_permission_required");
  }
  await window.clientApi.removeGlobalPlayerNote(userId);
  state.globalPlayerNotes[userId] = globalReportsForPlayer(userId)
    .filter((row) => row.sourceTeamId !== state.teamId);
  localStorage.setItem("globalPlayerNotes", JSON.stringify(state.globalPlayerNotes));
  delete state.playerNoteHistory[userId];
  await loadPlayerNoteHistory(userId, { force: true, silent: true });
  setRuntimeStatus("Общая заметка удалена");
}

function normalizeGlobalAvatarNote(row) {
  return {
    sourceTeamId: String(row?.source_team_id || row?.sourceTeamId || ""),
    avatarKey: String(row?.avatar_key || row?.avatarKey || ""),
    avatarName: String(row?.avatar_name || row?.avatarName || ""),
    avatarId: String(row?.avatar_id || row?.avatarId || ""),
    status: String(row?.status || "ok").toLowerCase() === "crash" ? "crash" : "ok",
    note: String(row?.note || ""),
    updatedByKey: String(row?.updated_by_key || row?.updatedByKey || ""),
    updatedByLabel: String(row?.updated_by_label || row?.updatedByLabel || ""),
    updatedAt: row?.updated_at || row?.updatedAt || ""
  };
}

function importGlobalAvatarNotes(rows) {
  const grouped = {};
  for (const row of rows || []) {
    const note = normalizeGlobalAvatarNote(row);
    if (!note.sourceTeamId || !avatarIdNoteKey(note.avatarId)) continue;
    const key = avatarIdNoteKey(note.avatarId);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(note);
  }
  for (const notes of Object.values(grouped)) {
    notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }
  state.globalAvatarNotes = grouped;
  state.globalAvatarNotesReady = true;
  state.globalAvatarNotesLastFetchAt = Date.now();
  localStorage.setItem("globalAvatarNotes", JSON.stringify(grouped));
  if (activePaneName() === "admin" && !isEditingAdminPlayer()) renderWhenVisible(renderAdminPlayerCard);
  if (activePaneName() === "owner" && !isEditingAdminPlayer(state.ownerSelectedUserId)) {
    renderWhenVisible(renderOwnerTools);
  }
  if (activePaneName() === "crash" && !isEditingCrashAvatarNote()) renderWhenVisible(renderCrashAnalyzer);
}

async function loadGlobalAvatarNotes(options = {}) {
  const { force = false, silent = false } = options;
  if (!window.clientApi.listGlobalAvatarNotes || state.globalAvatarNotesInFlight) return;
  if (!force && Date.now() - state.globalAvatarNotesLastFetchAt < 15_000) return;
  state.globalAvatarNotesInFlight = true;
  try {
    importGlobalAvatarNotes(await window.clientApi.listGlobalAvatarNotes());
  } catch (error) {
    state.globalAvatarNotesReady = false;
    state.globalAvatarNotesLastFetchAt = Date.now();
    if (!silent) setRuntimeStatus(`Общие отметки аватаров недоступны: ${error.message}`, true);
  } finally {
    state.globalAvatarNotesInFlight = false;
  }
}

function globalAvatarReportsForId(avatarId) {
  const key = avatarIdNoteKey(avatarId);
  return key && Array.isArray(state.globalAvatarNotes[key]) ? state.globalAvatarNotes[key] : [];
}

function ownGlobalAvatarReport(avatarId) {
  return globalAvatarReportsForId(avatarId).find((row) => row.sourceTeamId === state.teamId) || null;
}

async function publishGlobalAvatarNote(avatarKey) {
  if (!canPublishGlobalNotes()) {
    throw new Error("global_publication_permission_required");
  }
  const record = normalizeAvatarNote(state.avatarNotes[avatarKey]);
  const confirmedKey = avatarIdNoteKey(record.avatarId);
  if (!confirmedKey || confirmedKey !== avatarKey) {
    throw new Error("Для общей публикации нужен подтверждённый Avatar ID");
  }
  const saved = normalizeGlobalAvatarNote(await window.clientApi.saveGlobalAvatarNote({
    avatarName: record.avatarName,
    avatarId: record.avatarId,
    status: record.status,
    note: record.note
  }));
  const others = globalAvatarReportsForId(record.avatarId)
    .filter((row) => row.sourceTeamId !== saved.sourceTeamId);
  state.globalAvatarNotes[confirmedKey] = [saved, ...others];
  localStorage.setItem("globalAvatarNotes", JSON.stringify(state.globalAvatarNotes));
  setRuntimeStatus("Отметка аватара опубликована для всех команд");
}

async function removeGlobalAvatarNote(avatarId) {
  if (!canPublishGlobalNotes()) {
    throw new Error("global_publication_permission_required");
  }
  const key = avatarIdNoteKey(avatarId);
  if (!key) throw new Error("Подтверждённый Avatar ID не найден");
  await window.clientApi.removeGlobalAvatarNote(avatarId);
  state.globalAvatarNotes[key] = globalAvatarReportsForId(avatarId)
    .filter((row) => row.sourceTeamId !== state.teamId);
  localStorage.setItem("globalAvatarNotes", JSON.stringify(state.globalAvatarNotes));
  setRuntimeStatus("Общая отметка аватара удалена");
}

async function restorePlayerNoteHistory(userId, historyId) {
  const rows = Array.isArray(state.playerNoteHistory[userId]) ? state.playerNoteHistory[userId] : [];
  const row = rows.find((item) => String(item.id) === String(historyId));
  if (!row) throw new Error("Запись истории не найдена");
  const status = row.previous_status || row.previousStatus || "ok";
  const note = row.previous_note ?? row.previousNote ?? "";
  if (row.visibility === "global") {
    const scopeId = row.scope_id || row.scopeId;
    if (scopeId !== state.teamId) throw new Error("Нельзя изменять публикацию другой команды");
    const saved = normalizeGlobalPlayerNote(await window.clientApi.saveGlobalPlayerNote({
      userId,
      displayName: buildPlayerSummary(userId).name,
      status,
      note
    }));
    state.globalPlayerNotes[userId] = [
      saved,
      ...globalReportsForPlayer(userId).filter((item) => item.sourceTeamId !== state.teamId)
    ];
    localStorage.setItem("globalPlayerNotes", JSON.stringify(state.globalPlayerNotes));
  } else {
    const record = playerRecord(userId);
    record.status = status;
    record.note = note;
    touchPlayerRecord(record);
    await savePlayerRecord(userId);
  }
  delete state.playerNoteHistory[userId];
  await loadPlayerNoteHistory(userId, { force: true, silent: true });
  setRuntimeStatus("Предыдущее значение восстановлено");
}

function startPlayerNotesPolling() {
  if (state.notePollTimer) return;
  state.notePollTimer = setInterval(() => {
    if (document.hidden) return;
    loadPlayerNotes({ silent: true }).catch(() => {});
    loadGlobalPlayerNotes({ silent: true }).catch(() => {});
    flushPlayerNotes({ silent: true }).catch(() => {});
  }, 5000);
}

async function flushPlayerNotes(options = {}) {
  const { silent = false } = options;
  const scopeVersion = state.teamScopeVersion;
  const teamId = state.teamId;
  if (state.playerNoteFlushInFlight || !teamId) return;
  state.playerNoteFlushInFlight = true;
  try {
    for (const userId of Object.keys(state.playerNoteOutbox)) {
      if (!isCurrentTeamScope(scopeVersion, teamId)) return;
      const record = playerRecord(userId);
      try {
        const saved = await window.clientApi.savePlayerNote({
          userId,
          displayName: buildPlayerSummary(userId).name,
          status: record.status,
          note: record.note
        });
        if (!isCurrentTeamScope(scopeVersion, teamId)) return;
        if (saved) {
          const savedUserId = saved.user_id || saved.userId || userId;
          state.playerNotes[savedUserId] = normalizePlayerNote(saved, record);
          delete state.playerNoteHistory[savedUserId];
          loadPlayerNoteHistory(savedUserId, { force: true, silent: true }).catch(() => {});
        }
        delete state.playerNoteOutbox[userId];
      } catch (error) {
        if (!isCurrentTeamScope(scopeVersion, teamId)) return;
        if (!silent) setRuntimeStatus(`Admin note remains queued: ${error.message}`, true);
      }
    }
    cachePlayerNotes();
    cachePlayerNoteOutbox();
    if (Object.keys(state.playerNoteOutbox).length === 0) {
      state.playerNotesReady = true;
      if (!silent) setRuntimeStatus("Admin note synced");
    }
  } finally {
    if (isCurrentTeamScope(scopeVersion, teamId)) state.playerNoteFlushInFlight = false;
  }
}

async function savePlayerRecord(userId) {
  playerRecord(userId);
  state.playerNoteOutbox[userId] = true;
  cachePlayerNotes();
  cachePlayerNoteOutbox();
  await flushPlayerNotes();
}

function avatarNameKey(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/gu, " ")
    .replace(/\s+by\s+.+$/iu, "")
    .toLowerCase()
    .slice(0, 180);
}

function avatarNameNoteKey(avatarName = "") {
  const nameKey = avatarNameKey(avatarName);
  return nameKey ? `name:${nameKey}` : "";
}

function avatarIdNoteKey(avatarId = "") {
  const id = String(avatarId || "").trim();
  if (/^avtr_[0-9a-f-]{36}$/iu.test(id)) return `id:${id}`;
  return "";
}

function avatarNoteKey(avatarName = "", avatarId = "") {
  return avatarIdNoteKey(avatarId) || avatarNameNoteKey(avatarName);
}

function avatarCandidateNoteKey(avatarName = "", avatarId = "") {
  return avatarIdNoteKey(avatarId) || avatarNameNoteKey(avatarName);
}

function verifiedAvatarId(event) {
  return event?.avatarIdSource === "api-name" ? "" : String(event?.avatarId || "").trim();
}

function normalizeAvatarNote(row, fallback = {}) {
  const status = String(row?.status || fallback.status || "ok").toLowerCase() === "crash" ? "crash" : "ok";
  return {
    avatarKey: row?.avatar_key || row?.avatarKey || fallback.avatarKey || "",
    avatarName: row?.avatar_name || row?.avatarName || fallback.avatarName || "",
    avatarId: row?.avatar_id || row?.avatarId || fallback.avatarId || "",
    status,
    note: row?.note ?? fallback.note ?? "",
    updatedAt: row?.updated_at || row?.updatedAt || fallback.updatedAt || "",
    updatedByKey: row?.updated_by_key || row?.updatedByKey || fallback.updatedByKey || "",
    updatedByLabel: row?.updated_by_label || row?.updatedByLabel || fallback.updatedByLabel || ""
  };
}

function cacheAvatarNotes() {
  saveTeamJson("avatarNotes", state.avatarNotes);
}

function cacheAvatarNoteOutbox() {
  saveTeamJson("avatarNoteOutbox", state.avatarNoteOutbox);
}

function importServerAvatarNotes(notes) {
  const next = { ...state.avatarNotes };
  for (const row of notes || []) {
    const avatarKey = row.avatar_key || row.avatarKey;
    if (!avatarKey || state.avatarNotesSaveTimers.has(avatarKey) || state.avatarNoteOutbox[avatarKey]) continue;
    next[avatarKey] = normalizeAvatarNote(row, next[avatarKey]);
  }
  state.avatarNotes = next;
  state.avatarNotesReady = true;
  cacheAvatarNotes();
  if (activePaneName() === "admin" && !isEditingAdminPlayer()) renderWhenVisible(renderAdminPlayerCard);
  if (activePaneName() === "crash") renderWhenVisible(renderCrashAnalyzer);
}

async function loadAvatarNotes(options = {}) {
  const { silent = false, pushLocal = false } = options;
  const scopeVersion = state.teamScopeVersion;
  const teamId = state.teamId;
  if (!teamId) return;
  if (state.avatarNotesSyncInFlight || !window.clientApi.listAvatarNotes) return;
  state.avatarNotesSyncInFlight = true;
  try {
    const localBeforeSync = { ...state.avatarNotes };
    const notes = await window.clientApi.listAvatarNotes();
    if (!isCurrentTeamScope(scopeVersion, teamId)) return;
    const serverKeys = new Set((notes || []).map((row) => row.avatar_key || row.avatarKey).filter(Boolean));
    importServerAvatarNotes(notes);
    if (pushLocal) {
      for (const [avatarKey, record] of Object.entries(localBeforeSync)) {
        if (!serverKeys.has(avatarKey) && (record?.status !== "ok" || record?.note)) {
          state.avatarNoteOutbox[avatarKey] = true;
        }
      }
      cacheAvatarNoteOutbox();
      await flushAvatarNotes({ silent: true });
      if (!isCurrentTeamScope(scopeVersion, teamId)) return;
    }
  } catch (error) {
    if (!isCurrentTeamScope(scopeVersion, teamId)) return;
    state.avatarNotesReady = false;
    if (!silent) setRuntimeStatus(`Avatar notes: local cache only (${error.message})`, true);
  } finally {
    if (isCurrentTeamScope(scopeVersion, teamId)) state.avatarNotesSyncInFlight = false;
  }
}

function startAvatarNotesPolling() {
  if (state.avatarNotesPollTimer) return;
  state.avatarNotesPollTimer = setInterval(() => {
    if (document.hidden) return;
    loadAvatarNotes({ silent: true }).catch(() => {});
    loadGlobalAvatarNotes({ silent: true }).catch(() => {});
    flushAvatarNotes({ silent: true }).catch(() => {});
  }, 10_000);
}

function avatarNoteRecord(avatarName = "", avatarId = "", forcedKey = "") {
  const key = forcedKey || avatarNoteKey(avatarName, avatarId);
  if (!key) return null;
  const nameRecord = avatarName ? state.avatarNotes[avatarNameNoteKey(avatarName)] : null;
  const fallback = normalizeAvatarNote(nameRecord, {
    avatarKey: key,
    avatarName,
    avatarId,
    status: "ok",
    note: ""
  });
  fallback.avatarKey = key;
  if (avatarId) fallback.avatarId = avatarId;
  state.avatarNotes[key] = normalizeAvatarNote(state.avatarNotes[key], fallback);
  if (!state.avatarNotes[key].avatarName && avatarName) state.avatarNotes[key].avatarName = avatarName;
  if (!state.avatarNotes[key].avatarId && avatarId) state.avatarNotes[key].avatarId = avatarId;
  return state.avatarNotes[key];
}

function teamAvatarNoteForEvent(event) {
  if (!event) return null;
  const avatarId = verifiedAvatarId(event);
  const byId = avatarId ? state.avatarNotes[avatarIdNoteKey(avatarId)] : null;
  if (byId) return { ...normalizeAvatarNote(byId), match: "id" };
  const byName = event.avatarName ? state.avatarNotes[avatarNameNoteKey(event.avatarName)] : null;
  return byName ? { ...normalizeAvatarNote(byName), match: "name" } : null;
}

function avatarNoteForEvent(event) {
  if (!event) return null;
  const teamNote = teamAvatarNoteForEvent(event);
  const avatarId = verifiedAvatarId(event);
  const globalReports = globalAvatarReportsForId(avatarId);
  const globalCrash = globalReports.find((row) => row.status === "crash");
  if (teamNote?.status === "crash") return { ...teamNote, visibility: "team" };
  if (globalCrash) return { ...globalCrash, match: "global-id", visibility: "global" };
  if (teamNote) return { ...teamNote, visibility: "team" };
  return globalReports[0]
    ? { ...globalReports[0], match: "global-id", visibility: "global" }
    : null;
}

function touchAvatarNoteRecord(record) {
  const admin = currentAdminIdentity();
  record.updatedAt = new Date().toISOString();
  if (admin.key) record.updatedByKey = admin.key;
  if (admin.label) record.updatedByLabel = admin.label;
}

async function flushAvatarNotes(options = {}) {
  const { silent = false } = options;
  const scopeVersion = state.teamScopeVersion;
  const teamId = state.teamId;
  if (state.avatarNoteFlushInFlight || !teamId) return;
  state.avatarNoteFlushInFlight = true;
  try {
    for (const avatarKey of Object.keys(state.avatarNoteOutbox)) {
      if (!isCurrentTeamScope(scopeVersion, teamId)) return;
      const record = normalizeAvatarNote(state.avatarNotes[avatarKey]);
      if (!record.avatarKey) record.avatarKey = avatarKey;
      try {
        const saved = await window.clientApi.saveAvatarNote({
          avatarKey,
          avatarName: record.avatarName,
          avatarId: record.avatarId,
          status: record.status,
          note: record.note
        });
        if (!isCurrentTeamScope(scopeVersion, teamId)) return;
        if (saved) {
          const savedKey = saved.avatar_key || saved.avatarKey || avatarKey;
          state.avatarNotes[savedKey] = normalizeAvatarNote(saved, record);
        }
        delete state.avatarNoteOutbox[avatarKey];
      } catch (error) {
        if (!isCurrentTeamScope(scopeVersion, teamId)) return;
        if (!silent) setRuntimeStatus(`Avatar note remains queued: ${error.message}`, true);
      }
    }
    cacheAvatarNotes();
    cacheAvatarNoteOutbox();
    if (Object.keys(state.avatarNoteOutbox).length === 0) {
      state.avatarNotesReady = true;
      if (!silent) setRuntimeStatus("Avatar note synced");
    }
  } finally {
    if (isCurrentTeamScope(scopeVersion, teamId)) state.avatarNoteFlushInFlight = false;
  }
}

async function saveAvatarNoteRecord(avatarKey) {
  const record = normalizeAvatarNote(state.avatarNotes[avatarKey]);
  if (!record.avatarKey) record.avatarKey = avatarKey;
  state.avatarNotes[avatarKey] = record;
  state.avatarNoteOutbox[avatarKey] = true;
  cacheAvatarNotes();
  cacheAvatarNoteOutbox();
  await flushAvatarNotes();
}

function cacheAvatarCatalog() {
  saveTeamJson("avatarCatalog", state.avatarCatalog);
}

function cacheAvatarCatalogOutbox() {
  saveTeamJson("avatarCatalogOutbox", state.avatarCatalogOutbox);
}

function mergeAvatarCatalogRow(row) {
  const avatarName = row.avatar_name || row.avatarName || "";
  const avatarId = row.avatar_id || row.avatarId || "";
  const avatarNameKeyValue = row.avatar_name_key || row.avatarNameKey || row.avatar_key || row.avatarKey || avatarNameKey(avatarName);
  if (!avatarName || !avatarId || !avatarNameKeyValue) return false;
  state.avatarCatalog[avatarId] = {
    avatarName,
    avatarId,
    avatarNameKey: avatarNameKeyValue,
    seenCount: Number(row.seen_count ?? row.seenCount ?? 1),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
  };
  return true;
}

function knownAvatarById(avatarId) {
  const id = String(avatarId || "").trim();
  if (!id) return null;
  return state.avatarCatalog[id] || Object.values(state.avatarCatalog).find((entry) => entry.avatarId === id) || null;
}

function knownAvatarByName(avatarName) {
  const key = avatarNameKey(avatarName);
  if (!key) return null;
  const matches = Object.values(state.avatarCatalog)
    .filter((entry) => (entry.avatarNameKey || avatarNameKey(entry.avatarName)) === key);
  return matches.length === 1 ? matches[0] : null;
}

async function loadAvatarCatalog(options = {}) {
  const { silent = false, pushLocal = false } = options;
  const scopeVersion = state.teamScopeVersion;
  const teamId = state.teamId;
  if (!teamId) return;
  if (state.avatarCatalogSyncInFlight || !window.clientApi.listAvatarCatalog) return;
  state.avatarCatalogSyncInFlight = true;
  try {
    const localBeforeSync = { ...state.avatarCatalog };
    const rows = await window.clientApi.listAvatarCatalog();
    if (!isCurrentTeamScope(scopeVersion, teamId)) return;
    const serverIds = new Set((rows || []).map((row) => row.avatar_id || row.avatarId).filter(Boolean));
    let changed = false;
    for (const row of rows || []) {
      const avatarId = row.avatar_id || row.avatarId;
      if (avatarId && state.avatarCatalogOutbox[avatarId]) continue;
      changed = mergeAvatarCatalogRow(row) || changed;
    }
    if (pushLocal) {
      for (const [avatarId, entry] of Object.entries(localBeforeSync)) {
        if (!serverIds.has(avatarId) && entry?.avatarId) {
          state.avatarCatalogOutbox[avatarId] = entry;
        }
      }
      cacheAvatarCatalogOutbox();
      await flushAvatarCatalog({ silent: true });
      if (!isCurrentTeamScope(scopeVersion, teamId)) return;
    }
    state.avatarCatalogReady = true;
    const eventsChanged = applyAvatarCatalogToEvents();
    if (changed) {
      cacheAvatarCatalog();
    }
    if ((changed || eventsChanged) && !isEditingAdminPlayer()) scheduleRender();
  } catch (error) {
    if (!isCurrentTeamScope(scopeVersion, teamId)) return;
    state.avatarCatalogReady = false;
    if (!silent) setRuntimeStatus(`Avatar catalog: local cache only (${error.message})`, true);
  } finally {
    if (isCurrentTeamScope(scopeVersion, teamId)) state.avatarCatalogSyncInFlight = false;
  }
}

function startAvatarCatalogPolling() {
  if (state.avatarCatalogPollTimer) return;
  state.avatarCatalogPollTimer = setInterval(() => {
    if (document.hidden) return;
    loadAvatarCatalog({ silent: true }).catch(() => {});
    flushAvatarCatalog({ silent: true }).catch(() => {});
  }, 30_000);
}

function queueAvatarCatalogSave(entry) {
  if (!window.clientApi.saveAvatarCatalog) return;
  const key = String(entry.avatarId || "").trim();
  if (!key) return;
  state.avatarCatalogOutbox[key] = { ...entry };
  cacheAvatarCatalog();
  cacheAvatarCatalogOutbox();
  if (state.avatarCatalogSaveTimers.has(key)) clearTimeout(state.avatarCatalogSaveTimers.get(key));
  state.avatarCatalogSaveTimers.set(key, setTimeout(() => {
    state.avatarCatalogSaveTimers.delete(key);
    flushAvatarCatalog({ silent: true }).catch(() => {});
  }, 700));
}

async function flushAvatarCatalog(options = {}) {
  const { silent = false } = options;
  const scopeVersion = state.teamScopeVersion;
  const teamId = state.teamId;
  if (state.avatarCatalogFlushInFlight || !teamId) return;
  state.avatarCatalogFlushInFlight = true;
  try {
    for (const [avatarId, queuedEntry] of Object.entries(state.avatarCatalogOutbox)) {
      if (!isCurrentTeamScope(scopeVersion, teamId)) return;
      const entry = queuedEntry || state.avatarCatalog[avatarId];
      if (!entry?.avatarId || !entry?.avatarName) {
        delete state.avatarCatalogOutbox[avatarId];
        continue;
      }
      try {
        const payload = await window.clientApi.saveAvatarCatalog({
          avatarName: entry.avatarName,
          avatarId: entry.avatarId
        });
        if (!isCurrentTeamScope(scopeVersion, teamId)) return;
        const saved = payload?.avatar || payload;
        if (saved) mergeAvatarCatalogRow(saved);
        delete state.avatarCatalogOutbox[avatarId];
      } catch (error) {
        if (!isCurrentTeamScope(scopeVersion, teamId)) return;
        if (!silent) setRuntimeStatus(`Avatar catalog remains queued: ${error.message}`, true);
      }
    }
    cacheAvatarCatalog();
    cacheAvatarCatalogOutbox();
  } finally {
    if (isCurrentTeamScope(scopeVersion, teamId)) state.avatarCatalogFlushInFlight = false;
  }
}

function rememberAvatarCatalogEntry(event) {
  if (!event?.avatarName || !event?.avatarId || ["catalog", "api-name"].includes(event.avatarIdSource)) return;
  const key = String(event.avatarId).trim();
  if (!key) return;
  const existing = knownAvatarById(key);
  const same = existing?.avatarId === event.avatarId && existing?.avatarName === event.avatarName;
  state.avatarCatalog[key] = {
    avatarName: event.avatarName,
    avatarId: event.avatarId,
    avatarNameKey: avatarNameKey(event.avatarName),
    updatedAt: new Date().toISOString()
  };
  cacheAvatarCatalog();
  if (!same) queueAvatarCatalogSave(state.avatarCatalog[key]);
}

function enrichAvatarEvent(event) {
  if (!event || event.category !== "avatars") return event;
  if (event.avatarId && !event.avatarName) {
    const known = knownAvatarById(event.avatarId);
    if (known?.avatarName) {
      return {
        ...event,
        avatarName: known.avatarName,
        avatarIdSource: "catalog"
      };
    }
  }
  if (!event.avatarId && event.avatarName) {
    const known = knownAvatarByName(event.avatarName);
    if (known?.avatarId) {
      return {
        ...event,
        avatarId: known.avatarId,
        avatarIdSource: "catalog"
      };
    }
  }
  rememberAvatarCatalogEntry(event);
  return event;
}

function applyAvatarCatalogToEvents() {
  let changed = false;
  state.events = state.events.map((event) => {
    if (event.category !== "avatars") return event;
    if (event.avatarId && !event.avatarName) {
      const known = knownAvatarById(event.avatarId);
      if (!known?.avatarName) return event;
      changed = true;
      return { ...event, avatarName: known.avatarName, avatarIdSource: "catalog" };
    }
    if ((!event.avatarId || event.avatarIdSource === "api-name") && event.avatarName) {
      const known = knownAvatarByName(event.avatarName);
      if (!known?.avatarId) return event;
      changed = true;
      return {
        ...event,
        avatarId: known.avatarId,
        avatarIdSource: "catalog",
        avatarMatchConfidence: "confirmed",
        avatarCandidates: undefined,
        avatarLookupDone: true
      };
    }
    return event;
  });
  if (changed) invalidatePlayerEventIndex();
  return changed;
}

function applyResolvedAvatar(avatar) {
  if (!avatar?.avatarId || !avatar?.avatarName) return false;
  mergeAvatarCatalogRow(avatar);
  cacheAvatarCatalog();
  queueAvatarCatalogSave(avatar);

  const uniqueKnownName = knownAvatarByName(avatar.avatarName);
  const canAttachByName = uniqueKnownName?.avatarId === avatar.avatarId;
  let changed = false;
  state.events = state.events.map((event) => {
    if (event.category !== "avatars") return event;

    if (event.avatarId === avatar.avatarId && !event.avatarName) {
      changed = true;
      return {
        ...event,
        avatarName: avatar.avatarName,
        avatarIdSource: event.avatarIdSource || "api"
      };
    }

    if (!event.avatarId && canAttachByName && event.avatarName && avatarNameKey(event.avatarName) === avatarNameKey(avatar.avatarName)) {
      changed = true;
      return {
        ...event,
        avatarId: avatar.avatarId,
        avatarIdSource: "api"
      };
    }

    return event;
  });
  if (changed) invalidatePlayerEventIndex();
  return changed;
}

function resolveAvatarFromApi(event) {
  if (!event?.avatarId || event.avatarName || !window.clientApi.resolveVrchatAvatar) return;
  if (state.avatarResolveInFlight.has(event.avatarId)) return;

  state.avatarResolveInFlight.add(event.avatarId);
  window.clientApi.resolveVrchatAvatar(event.avatarId)
    .then((avatar) => {
      if (applyResolvedAvatar(avatar) && !isEditingAdminPlayer()) scheduleRender();
    })
    .catch(() => {})
    .finally(() => state.avatarResolveInFlight.delete(event.avatarId));
}

function applyAvatarNameCandidates(avatarName, candidates = []) {
  const nameKey = avatarNameKey(avatarName);
  if (!nameKey) return false;
  const exactCandidates = (Array.isArray(candidates) ? candidates : [])
    .filter((candidate) => candidate?.avatarId && avatarNameKey(candidate.avatarName) === nameKey)
    .slice(0, 10);
  const candidateIds = exactCandidates.map((candidate) => candidate.avatarId).join("|");
  let changed = false;

  state.events = state.events.map((event) => {
    if (event.category !== "avatars" || avatarNameKey(event.avatarName) !== nameKey) return event;
    if (event.avatarId && event.avatarIdSource !== "api-name") return event;

    const previousIds = (event.avatarCandidates || []).map((candidate) => candidate.avatarId).join("|");
    if (event.avatarLookupDone && previousIds === candidateIds) {
      if (exactCandidates.length !== 1 || event.avatarId === exactCandidates[0].avatarId) return event;
    }

    changed = true;
    if (exactCandidates.length === 1) {
      return {
        ...event,
        avatarId: exactCandidates[0].avatarId,
        avatarIdSource: "api-name",
        avatarMatchConfidence: "probable",
        avatarCandidates: exactCandidates,
        avatarLookupDone: true
      };
    }

    if (event.avatarIdSource === "api-name") {
      const { avatarId: _avatarId, avatarIdSource: _avatarIdSource, avatarMatchConfidence: _confidence, ...rest } = event;
      return {
        ...rest,
        avatarCandidates: exactCandidates,
        avatarLookupDone: true
      };
    }

    return {
      ...event,
      avatarCandidates: exactCandidates,
      avatarLookupDone: true
    };
  });
  if (changed) invalidatePlayerEventIndex();
  return changed;
}

function resolveAvatarNameFromApi(event) {
  if (
    !event?.avatarName ||
    event.avatarId ||
    !["avatar-changed", "avatar-data"].includes(event.type) ||
    !window.clientApi.findVrchatAvatarCandidates
  ) return;

  const nameKey = avatarNameKey(event.avatarName);
  if (!nameKey) return;
  if (state.avatarCandidateResults.has(nameKey)) {
    if (applyAvatarNameCandidates(event.avatarName, state.avatarCandidateResults.get(nameKey)) && !isEditingAdminPlayer()) scheduleRender();
    return;
  }
  if (state.avatarNameResolveInFlight.has(nameKey)) return;

  state.avatarNameResolveInFlight.add(nameKey);
  window.clientApi.findVrchatAvatarCandidates(event.avatarName)
    .then((result) => {
      const candidates = Array.isArray(result?.candidates) ? result.candidates : [];
      state.avatarCandidateResults.set(nameKey, candidates);
      if (applyAvatarNameCandidates(event.avatarName, candidates) && !isEditingAdminPlayer()) scheduleRender();
    })
    .catch(() => {})
    .finally(() => state.avatarNameResolveInFlight.delete(nameKey));
}

function eventsForUser(userId) {
  return playerEventIndex().byUserId.get(userId) || [];
}

function buildPlayerSummary(userId) {
  const events = eventsForUser(userId);
  const currentEvents = playerEventIndex().currentByUserId.get(userId) || [];
  const playerEvents = events.filter((event) => event.type === "player-joined" || event.type === "player-left");
  const currentPlayerEvents = currentEvents.filter((event) => event.type === "player-joined" || event.type === "player-left");
  const joins = playerEvents.filter((event) => event.type === "player-joined");
  const leaves = playerEvents.filter((event) => event.type === "player-left");
  const avatars = events.filter((event) => (
    event.category === "avatars" &&
    event.type !== "avatar-loading" &&
    (event.avatarName || event.avatarId)
  ));
  const last = playerEvents[playerEvents.length - 1];
  const currentLast = currentPlayerEvents[currentPlayerEvents.length - 1];
  const firstJoin = joins[0];
  const known = normalizeKnownPlayer(state.knownPlayers[userId], userId);
  const savedName = String(state.playerNotes[userId]?.displayName || "").trim();
  const eventName = firstJoin?.playerName || last?.playerName || "";
  const eventTime = new Date(last?.timestamp || last?.capturedAt || 0).valueOf();
  const knownTime = new Date(known.lastSeenAt || 0).valueOf();
  return {
    userId,
    name: playerLabel(userId, eventName || known.displayName || savedName),
    joins,
    leaves,
    avatars,
    firstJoin,
    last,
    lastActivityAt: Math.max(Number.isFinite(eventTime) ? eventTime : 0, Number.isFinite(knownTime) ? knownTime : 0),
    historicalOnly: playerEvents.length === 0,
    online: currentLast?.type === "player-joined"
  };
}

function isEditingAdminPlayer(userId = state.selectedUserId) {
  const active = document.activeElement;
  if (!active?.matches?.("[data-player-note-status], [data-player-note-text], [data-admin-avatar-note-status], [data-admin-avatar-note-text]")) return false;
  return active.closest("[data-player-note-editor]")?.dataset.userId === userId;
}

function profileButton(event) {
  if (!event.userId) return "<span></span>";
  return playerProfileButton(event.userId, event.playerName || displayName(event));
}

function playerProfileUrl(userId) {
  const profile = state.profiles.get(userId);
  return profile?.profileUrl || `https://vrchat.com/home/user/${encodeURIComponent(userId)}`;
}

function playerProfileButton(userId, displayNameValue = "", options = {}) {
  if (!userId) return "";
  const label = options.label || (hasOwnerAccess() && activePaneName() !== "owner" ? "Действия" : "Профиль");
  const className = options.className || "eventAction";
  return `<button type="button" class="${escapeHtml(className)}" data-player-profile-user-id="${escapeHtml(userId)}" data-player-profile-name="${escapeHtml(displayNameValue || userId)}">${escapeHtml(label)}</button>`;
}

function closePlayerActionDialog() {
  state.playerActionTarget = null;
  if (playerActionDialog?.open) playerActionDialog.close();
}

function openPlayerAction(userId, displayNameValue = "") {
  if (!userId) return;
  if (!hasOwnerAccess() || activePaneName() === "owner" || !playerActionDialog?.showModal) {
    window.clientApi.openExternal(playerProfileUrl(userId));
    return;
  }
  state.playerActionTarget = {
    userId,
    displayName: displayNameValue || buildPlayerSummary(userId).name || userId
  };
  if (playerActionName) playerActionName.textContent = state.playerActionTarget.displayName;
  if (playerActionUserId) playerActionUserId.textContent = userId;
  playerActionDialog.showModal();
}

function openPlayerInOwner(userId, displayNameValue = "") {
  if (!hasOwnerAccess() || !userId) return;
  rememberKnownPlayer({
    userId,
    displayName: displayNameValue,
    lastSeenAt: state.knownPlayers[userId]?.lastSeenAt || new Date().toISOString()
  });
  state.ownerSource = "logs";
  state.ownerSelectedUserId = userId;
  if (ownerSourceSelect) ownerSourceSelect.value = "logs";
  closePlayerActionDialog();
  ownerTabButton?.click();
  renderOwnerTools();
  loadPlayerNoteHistory(userId, { silent: true }).catch(() => {});
}

function avatarButton(event) {
  if (!event.avatarId) return "";
  const url = avatarUrl(event.avatarId);
  const probable = event.avatarIdSource === "api-name";
  const label = probable ? "Возможный ID" : "Аватар";
  const title = probable ? "ID найден только по совпадению названия и ещё не подтверждён логом." : "Открыть страницу аватара";
  return `<button class="eventAction" data-url="${escapeHtml(url)}" title="${escapeHtml(title)}">${label}</button>`;
}

function avatarUrl(avatarId) {
  return `https://vrchat.com/home/avatar/${encodeURIComponent(avatarId)}`;
}

function shortAvatarId(avatarId) {
  const id = String(avatarId || "");
  return id.length > 12 ? `…${id.slice(-8)}` : id;
}

function avatarCandidateActions(event, mini = false) {
  const candidates = Array.isArray(event?.avatarCandidates) ? event.avatarCandidates : [];
  if (candidates.length < 2) return "";
  const shown = candidates.slice(0, 3);
  const buttons = shown.map((candidate, index) => {
    const author = candidate.authorName ? `\nАвтор: ${candidate.authorName}` : "";
    const sourceLabels = { own: "свои", favorite: "избранные", licensed: "приобретённые" };
    const sources = (candidate.sources || []).map((source) => sourceLabels[source] || source).join(", ");
    const title = `Вариант ${index + 1}: ${candidate.avatarName}${author}\n${candidate.avatarId}${sources ? `\nИсточник: ${sources}` : ""}`;
    return `<button class="eventAction${mini ? " eventAction--mini" : ""}" data-url="${escapeHtml(avatarUrl(candidate.avatarId))}" title="${escapeHtml(title)}">${escapeHtml(shortAvatarId(candidate.avatarId))}</button>`;
  }).join("");
  const remaining = candidates.length - shown.length;
  return `<div class="avatarCandidateActions">
    <small>Возможные ID: ${candidates.length}</small>
    <div>${buttons}${remaining > 0 ? `<span>+${remaining}</span>` : ""}</div>
  </div>`;
}

function avatarMiniAction(event) {
  if (!event.avatarId) return `<span class="adminMiniMuted">Без ссылки</span>`;
  const probable = event.avatarIdSource === "api-name";
  return `<button class="eventAction eventAction--mini" data-url="${escapeHtml(avatarUrl(event.avatarId))}" title="${probable ? "ID найден по совпадению названия и не подтверждён логом." : "Открыть страницу аватара"}">${probable ? "Возможный ID" : "Аватар"}</button>`;
}

function adminAvatarGlobalReportsHtml(avatarId) {
  if (!avatarIdNoteKey(avatarId)) {
    return `<div class="adminAvatarGlobalHint">Общая публикация доступна после подтверждения Avatar ID.</div>`;
  }
  const reports = globalAvatarReportsForId(avatarId);
  if (reports.length === 0) {
    return `<div class="adminAvatarGlobalHint">В общих данных отметок пока нет.</div>`;
  }
  return `<div class="adminAvatarGlobalReports">
    ${reports.map((report) => `<div>
      <span class="eventAvatarBadge eventAvatarBadge--${escapeHtml(report.status)}">${escapeHtml(report.status)}</span>
      <strong>${escapeHtml(formatAuthorIdentity(report.updatedByLabel, report.updatedByKey))}</strong>
      <small>${escapeHtml(formatDateTime(report.updatedAt))}</small>
      ${report.note ? `<p>${escapeHtml(report.note)}</p>` : ""}
    </div>`).join("")}
  </div>`;
}

function adminAvatarRow(event) {
  const avatarName = event.avatarName || event.avatarId || "-";
  const shownAvatarId = event.avatarId || "";
  const avatarId = verifiedAvatarId(event);
  const key = avatarNoteKey(avatarName, avatarId);
  const inherited = teamAvatarNoteForEvent(event);
  const record = normalizeAvatarNote(state.avatarNotes[key], {
    avatarKey: key,
    avatarName,
    avatarId,
    status: inherited?.status || "ok",
    note: inherited?.note || ""
  });
  const effective = avatarNoteForEvent(event);
  const ownReport = ownGlobalAvatarReport(avatarId);
  const source = event.avatarIdSource === "catalog"
    ? " · из каталога"
    : event.avatarIdSource === "api-name"
      ? " · возможный ID по имени"
      : "";
  const action = event.avatarId ? avatarMiniAction(event) : avatarCandidateActions(event, true) || `<span class="adminMiniMuted">Без ссылки</span>`;
  const effectiveBadge = effective
    ? `<span class="eventAvatarBadge eventAvatarBadge--${escapeHtml(effective.status)}" data-admin-avatar-effective-status title="${effective.visibility === "global" ? "Отметка из общих данных" : "Командная отметка"}">${escapeHtml(effective.status)}${effective.visibility === "global" ? " · общая" : ""}</span>`
    : "";
  return `<article class="adminAvatarEditor" data-admin-avatar-editor data-avatar-key="${escapeHtml(key)}" data-avatar-name="${escapeHtml(avatarName)}" data-avatar-id="${escapeHtml(avatarId)}">
    <div class="adminMiniRow adminMiniRow--avatar">
      <span>${escapeHtml(formatTime(event))}</span>
      <div class="adminAvatarInfo">
        <strong>${escapeHtml(avatarName)}</strong>
        ${shownAvatarId ? `<small>${escapeHtml(shownAvatarId + source)}</small>` : `<small>avtr_... не найден в логе</small>`}
      </div>
      <div class="adminAvatarRowActions">${effectiveBadge}${action}</div>
    </div>
    ${key ? `<div class="adminAvatarControls">
      <label>
        <span>Командная метка</span>
        <select data-admin-avatar-note-status>
          <option value="ok"${record.status === "ok" ? " selected" : ""}>ok</option>
          <option value="crash"${record.status === "crash" ? " selected" : ""}>crash</option>
        </select>
      </label>
      <label class="adminAvatarNoteField">
        <span>Заметка об аватаре</span>
        <textarea data-admin-avatar-note-text spellcheck="false" placeholder="Почему аватар отмечен...">${escapeHtml(record.note)}</textarea>
      </label>
      ${canPublishGlobalNotes() ? `<div class="adminAvatarShareActions">
        <span>${avatarId ? "Публикация будет видна всем лицензированным командам." : "Нужен подтверждённый Avatar ID; совпадения только по имени не публикуются."}</span>
        <button type="button" data-publish-global-avatar-note${avatarId ? "" : " disabled"}>${ownReport ? "Обновить общую" : "Опубликовать всем"}</button>
        ${ownReport ? `<button type="button" data-remove-global-avatar-note>Убрать общую</button>` : ""}
      </div>` : ""}
      ${adminAvatarGlobalReportsHtml(avatarId)}
    </div>` : ""}
  </article>`;
}

function adminEventRow(event) {
  const avatarAction = event.avatarId ? avatarMiniAction(event) : "";
  return `<div class="adminMiniRow${avatarAction ? " adminMiniRow--eventAction" : ""}">
    <span>${escapeHtml(formatTime(event))}</span>
    <strong>${escapeHtml(eventKind(event))}</strong>
    <em>${escapeHtml(eventDetails(event))}</em>
    ${avatarAction}
  </div>`;
}

function rowHtml(event) {
  const kindClass = event.type === "player-joined"
    ? "eventKind eventKind--joined"
    : event.type === "player-left"
      ? "eventKind eventKind--left"
      : event.type === "avatar-audio"
        ? "eventKind eventKind--audio"
        : "eventKind";

  // Для строк аватаров показываем кнопку Avatar если есть avatarId
  const actionBtn = event.category === "avatars"
    ? event.avatarId
      ? avatarButton(event)
      : avatarCandidateActions(event) || profileButton(event)
    : profileButton(event);
  const avatarNote = event.category === "avatars" ? avatarNoteForEvent(event) : null;
  const avatarBadge = avatarNote?.status
    ? `<span class="eventAvatarBadge eventAvatarBadge--${escapeHtml(avatarNote.status)}" title="${avatarNote.visibility === "global" ? "Отметка из общих данных" : "Командная отметка"}">${escapeHtml(avatarNote.status)}</span>`
    : "";
  const avatarMatchBadge = event.category === "avatars" && event.avatarIdSource === "api-name"
    ? `<span class="eventAvatarBadge eventAvatarBadge--probable">ID по имени</span>`
    : "";

  return `
    <div class="eventRow" data-id="${escapeHtml(event.id)}">
      <span class="eventTime">${escapeHtml(formatTime(event))}</span>
      <strong title="${escapeHtml(displayName(event))}">${escapeHtml(displayName(event))}</strong>
      <span class="eventDetailsLine" title="${escapeHtml(`${eventKind(event)} ${eventDetails(event)}`.trim())}">
        <span class="${kindClass}">${escapeHtml(eventKind(event))}</span>
        ${avatarBadge}
        ${avatarMatchBadge}
        <span class="eventMeta">${escapeHtml(eventDetails(event))}</span>
      </span>
      ${actionBtn}
    </div>
  `;
}

function renderList(target, events, emptyText) {
  if (events.length === 0) {
    target.innerHTML = `<div class="emptyState">${escapeHtml(emptyText)}</div>`;
    return;
  }
  target.innerHTML = events.slice(-600).reverse().map(rowHtml).join("");
}

function partitionEvents() {
  return {
    players: state.events.filter((event) => {
      if (event.type !== "player-joined" && event.type !== "player-left") return false;
      const q = state.search.players.toLowerCase();
      if (!q) return true;
      const name = displayName(event).toLowerCase();
      const id = (event.userId || "").toLowerCase();
      return name.includes(q) || id.includes(q);
    }),
    avatars: state.events.filter((event) => {
      if (event.category !== "avatars" || event.type === "avatar-loading") return false;
      const q = state.search.avatars.toLowerCase();
      if (!q) return true;
      const name = displayName(event).toLowerCase();
      const detail = (event.avatarName || event.avatarId || "").toLowerCase();
      return name.includes(q) || detail.includes(q);
    }),
    portals: state.events.filter((event) => event.category === "portals"),
    worlds: state.events.filter((event) => event.category === "worlds")
  };
}

function activePaneName() {
  return document.querySelector(".tabPane.active")?.dataset.pane || "players";
}

function render() {
  const parts = partitionEvents();
  const activePane = activePaneName();
  if (activePane === "players") renderList(playersList, parts.players, "Нет событий");
  if (activePane === "avatars") renderList(avatarsList, parts.avatars, "Нет событий");

  playersCount.textContent = String(parts.players.length);
  avatarsCount.textContent = String(parts.avatars.length);
  eventCountLabel.textContent = `${state.events.length} событий`;
  if (activePane === "builder") renderBuilder(builderParts(parts));
  if (activePane === "admin") renderAdminTools();
  if (activePane === "owner") renderOwnerTools();
  if (activePane === "crash") renderCrashAnalyzer();
}

function scheduleRender(delayMs = 75) {
  if (document.hidden || state.renderSuspended) {
    state.renderDeferred = true;
    return;
  }
  if (state.renderTimer) return;
  state.renderTimer = setTimeout(() => {
    state.renderTimer = null;
    if (document.hidden || state.renderSuspended) {
      state.renderDeferred = true;
      return;
    }
    state.renderDeferred = false;
    render();
  }, delayMs);
}

function renderWhenVisible(renderTask) {
  if (document.hidden || state.renderSuspended) {
    state.renderDeferred = true;
    return;
  }
  renderTask();
}

function comparePlayerSummaries(a, b) {
  if (a.online !== b.online) return a.online ? -1 : 1;
  const aWatch = state.playerNotes[a.userId]?.status !== "ok" && state.playerNotes[a.userId]?.status ? 1 : 0;
  const bWatch = state.playerNotes[b.userId]?.status !== "ok" && state.playerNotes[b.userId]?.status ? 1 : 0;
  if (aWatch !== bWatch) return bWatch - aWatch;
  if (a.lastActivityAt !== b.lastActivityAt) return b.lastActivityAt - a.lastActivityAt;
  return a.name.localeCompare(b.name, "ru");
}

function historicalPlayerSummary(userId) {
  const known = normalizeKnownPlayer(state.knownPlayers[userId], userId);
  const savedName = String(state.playerNotes[userId]?.displayName || "").trim();
  const knownTime = new Date(known.lastSeenAt || 0).valueOf();
  return {
    userId,
    name: playerLabel(userId, known.displayName || savedName),
    joins: [],
    leaves: [],
    avatars: [],
    firstJoin: null,
    last: null,
    lastActivityAt: Number.isFinite(knownTime) ? knownTime : 0,
    historicalOnly: true,
    online: false
  };
}

function historicalPlayerSummaryList() {
  if (state.historicalPlayerSummaries) return state.historicalPlayerSummaries;
  const userIds = new Set([...Object.keys(state.knownPlayers), ...Object.keys(state.playerNotes)]);
  state.historicalPlayerSummaries = [...userIds]
    .filter((userId) => userId.startsWith("usr_"))
    .map(historicalPlayerSummary)
    .sort(comparePlayerSummaries);
  return state.historicalPlayerSummaries;
}

function mergePlayerSummaries(left, right, limit = Infinity) {
  const merged = [];
  let leftIndex = 0;
  let rightIndex = 0;
  while (merged.length < limit && (leftIndex < left.length || rightIndex < right.length)) {
    if (rightIndex >= right.length || (
      leftIndex < left.length && comparePlayerSummaries(left[leftIndex], right[rightIndex]) <= 0
    )) {
      merged.push(left[leftIndex]);
      leftIndex += 1;
    } else {
      merged.push(right[rightIndex]);
      rightIndex += 1;
    }
  }
  return merged;
}

function livePlayerSummaries() {
  return [...playerEventIndex().userIds]
    .filter((userId) => userId.startsWith("usr_"))
    .map(buildPlayerSummary)
    .sort(comparePlayerSummaries);
}

function playerSummaries(limit = Infinity) {
  const live = livePlayerSummaries();
  const liveIds = playerEventIndex().userIds;
  const historical = historicalPlayerSummaryList().filter((summary) => !liveIds.has(summary.userId));
  return mergePlayerSummaries(live, historical, limit);
}

function pagedPlayerSummaries(summaries, requestedPage) {
  const pageCount = Math.max(1, Math.ceil(summaries.length / PLAYER_LIST_PAGE_SIZE));
  const page = Math.min(Math.max(0, requestedPage), pageCount - 1);
  const start = page * PLAYER_LIST_PAGE_SIZE;
  return { page, pageCount, rows: summaries.slice(start, start + PLAYER_LIST_PAGE_SIZE) };
}

function playerListPagerHtml(kind, page, pageCount, total) {
  if (total <= PLAYER_LIST_PAGE_SIZE) return "";
  return `<div class="playerListPager">
    <button type="button" data-${kind}-list-page="previous" ${page <= 0 ? "disabled" : ""}>←</button>
    <span>${page + 1} / ${pageCount} · ${total}</span>
    <button type="button" data-${kind}-list-page="next" ${page >= pageCount - 1 ? "disabled" : ""}>→</button>
  </div>`;
}

function renderAdminTools() {
  if (!adminPlayerList || !adminPlayerCard) return;
  if (adminSyncStatus) {
    const syncReady = state.playerNotesReady && state.avatarNotesReady &&
      state.globalPlayerNotesReady && state.globalAvatarNotesReady;
    adminSyncStatus.textContent = syncReady ? "Общие данные" : "Локальный кэш";
    adminSyncStatus.title = syncReady
      ? "Метки игроков и аватаров синхронизируются с командными и общими данными."
      : "Нет связи с сервисом. Используются данные, сохранённые на этом устройстве.";
    adminSyncStatus.classList.toggle("adminSyncStatus--synced", syncReady);
  }
  const q = state.adminSearch.toLowerCase();
  const sourceSummaries = state.adminOnlineFilter === "online" ? livePlayerSummaries() : playerSummaries();
  const summaries = sourceSummaries.filter((summary) => {
    if (state.adminOnlineFilter === "online" && !summary.online) return false;
    if (!q) return true;
    return summary.name.toLowerCase().includes(q) || summary.userId.toLowerCase().includes(q);
  });

  const paged = pagedPlayerSummaries(summaries, state.adminPlayerPage);
  state.adminPlayerPage = paged.page;
  const playerListHtml = paged.rows.map((summary) => {
    const record = playerRecordView(summary.userId);
    const active = summary.userId === state.selectedUserId ? " active" : "";
    const statusClass = summary.online ? "adminStatus adminStatus--online" : "adminStatus adminStatus--offline";
    const status = record.status !== "ok" ? `<span class="adminBadge">${escapeHtml(record.status)}</span>` : "";
    const activity = summary.historicalOnly ? "из истории" : `${summary.joins.length} заходов`;
    return `<button class="adminPlayerItem${active}" data-user-id="${escapeHtml(summary.userId)}">
      <span>${escapeHtml(summary.name)}</span>
      <small><span class="${statusClass}">${summary.online ? "в сети" : "не в сети"}</span> · ${activity}</small>
      ${status}
    </button>`;
  }).join("") || `<div class="emptyState">Нет игроков</div>`;
  const listHtml = playerListHtml + playerListPagerHtml("admin", paged.page, paged.pageCount, summaries.length);
  if (adminPlayerList._renderedHtml !== listHtml) {
    const previousScrollTop = adminPlayerList.scrollTop;
    adminPlayerList.innerHTML = listHtml;
    adminPlayerList._renderedHtml = listHtml;
    adminPlayerList.scrollTop = previousScrollTop;
  }

  if (state.selectedUserId && !summaries.some((summary) => summary.userId === state.selectedUserId)) {
    state.selectedUserId = "";
  }
  if (isEditingAdminPlayer()) return;
  renderAdminPlayerCard();
}

function adminGlobalReportsHtml(userId) {
  const reports = globalReportsForPlayer(userId);
  if (reports.length === 0) {
    return `<div class="emptyState">Другие команды пока ничего не публиковали</div>`;
  }
  return reports.map((report) => `<article class="adminGlobalReport">
    <header>
      <strong>${escapeHtml(formatAuthorIdentity(report.updatedByLabel, report.updatedByKey))}</strong>
      <span>${escapeHtml(formatDateTime(report.updatedAt))}</span>
    </header>
    <span class="adminBadge">${escapeHtml(report.status)}</span>
    ${report.note ? `<p>${escapeHtml(report.note)}</p>` : ""}
  </article>`).join("");
}

function adminNoteHistoryHtml(userId) {
  if (state.playerNoteHistoryInFlight.has(userId)) return `<div class="emptyState">Загрузка...</div>`;
  const rows = Array.isArray(state.playerNoteHistory[userId]) ? state.playerNoteHistory[userId] : [];
  if (rows.length === 0) return `<div class="emptyState">Изменений пока нет</div>`;
  return rows.slice(0, 12).map((row) => {
    const visibility = row.visibility === "global" ? "Для всех команд" : "Для команды";
    const oldStatus = row.previous_status || row.previousStatus || "-";
    const nextStatus = row.status || "ok";
    const previousNote = row.previous_note ?? row.previousNote ?? "";
    const note = row.note || "";
    const scopeId = row.scope_id || row.scopeId || "";
    const canRestore = row.visibility !== "global" || scopeId === state.teamId;
    return `<article class="adminHistoryRow">
      <header>
        <strong>${escapeHtml(formatAuthorIdentity(
          row.updated_by_label || row.updatedByLabel,
          row.updated_by_key || row.updatedByKey
        ))}</strong>
        <span>${escapeHtml(formatDateTime(row.updated_at || row.updatedAt))}${canRestore ? ` · <button type="button" data-restore-note-history="${escapeHtml(String(row.id))}">Вернуть</button>` : ""}</span>
      </header>
      <span>${escapeHtml(visibility)} · ${escapeHtml(oldStatus)} → ${escapeHtml(nextStatus)}</span>
      ${previousNote !== note ? `<p><b>Было:</b> ${escapeHtml(previousNote || "без заметки")}<br><b>Стало:</b> ${escapeHtml(note || "без заметки")}</p>` : ""}
    </article>`;
  }).join("");
}

function adminPlayerCardHtml(userId, options = {}) {
  if (!userId) return `<div class="emptyState">Выберите игрока</div>`;

  const { showClose = false } = options;
  const summary = buildPlayerSummary(userId);
  const record = playerRecord(userId);
  const lastAvatars = recentAvatarUses(summary.avatars).slice(-5).reverse();
  const recent = eventsForUser(userId).slice(-10).reverse();
  const updatedByLabel = record.updatedByLabel || "-";
  const updatedByKey = record.updatedByKey || "-";
  const updatedAt = formatDateTime(record.updatedAt);
  const ownReport = ownGlobalReport(userId);

  return `<div data-player-note-editor data-user-id="${escapeHtml(userId)}">
    <div class="adminCardHeader">
      <div>
        <h2>${escapeHtml(summary.name)}</h2>
        <p>${escapeHtml(userId)}</p>
      </div>
      <div class="adminCardActions">
        ${playerProfileButton(userId, summary.name)}
        ${showClose ? `<button type="button" class="adminCardClose" data-clear-admin-selection title="Убрать выбранного игрока" aria-label="Убрать выбранного игрока">×</button>` : ""}
      </div>
    </div>
    <div class="adminStats">
      <div><strong class="adminStatus ${summary.online ? "adminStatus--online" : "adminStatus--offline"}">${summary.online ? "В сети" : "Не в сети"}</strong><span>Статус</span></div>
      <div><strong>${summary.joins.length}</strong><span>Заходы</span></div>
      <div><strong>${summary.avatars.length}</strong><span>Аватары</span></div>
      <div><strong>${recent.length}</strong><span>События</span></div>
    </div>
    <label class="adminField">
      <span>Метка</span>
      <select data-player-note-status>
        ${["ok", "watch", "warned", "blocked elsewhere"].map((value) => `<option value="${escapeHtml(value)}"${record.status === value ? " selected" : ""}>${escapeHtml(value)}</option>`).join("")}
      </select>
    </label>
    <label class="adminField">
      <span>Заметка</span>
      <textarea data-player-note-text spellcheck="false" placeholder="Заметка для команды...">${escapeHtml(record.note)}</textarea>
    </label>
    <div class="adminMetaGrid">
      <div><span>Изменил</span><strong>${escapeHtml(updatedByLabel)}</strong></div>
      <div><span>Ключ</span><strong>${escapeHtml(updatedByKey)}</strong></div>
      <div><span>Обновлено</span><strong>${escapeHtml(updatedAt)}</strong></div>
    </div>
    ${canPublishGlobalNotes() ? `<div class="adminShareActions">
      <p>Общая публикация видна всем командам. Автор и время изменения сохраняются.</p>
      <button type="button" data-publish-global-note>${ownReport ? "Обновить общую" : "Опубликовать всем"}</button>
      ${ownReport ? `<button type="button" data-remove-global-note>Убрать общую</button>` : ""}
    </div>` : ""}
    <div class="adminSection">
      <h3>Общие сообщения команд</h3>
      ${adminGlobalReportsHtml(userId)}
    </div>
    <div class="adminSection">
      <h3>История изменений</h3>
      ${adminNoteHistoryHtml(userId)}
    </div>
    <div class="adminSection">
      <h3>Последние аватары</h3>
      ${lastAvatars.map(adminAvatarRow).join("") || `<div class="emptyState">Нет данных</div>`}
    </div>
    <div class="adminSection">
      <h3>Последние события</h3>
      ${recent.map(adminEventRow).join("") || `<div class="emptyState">Нет событий</div>`}
    </div>
  </div>`;
}

function renderAdminPlayerCard() {
  if (!adminPlayerCard) return;
  const previousScrollTop = adminPlayerCard.scrollTop;
  const nextHtml = adminPlayerCardHtml(state.selectedUserId, { showClose: true });
  if (adminPlayerCard._renderedHtml === nextHtml) return;
  adminPlayerCard.innerHTML = nextHtml;
  adminPlayerCard._renderedHtml = nextHtml;
  adminPlayerCard.scrollTop = previousScrollTop;
}

function moderationStatusLabel(status) {
  return {
    pending: "В очереди",
    dispatching: "Служба модерации выполняет",
    processing: "Выполняется",
    succeeded: "Выполнено",
    expired: "Срок завершён",
    revoked: "Разбанен",
    failed: "Ошибка",
    rejected: "Отклонено",
    cancelled: "Отменено",
    awaiting_review: "Ожидает"
  }[status] || status || "Неизвестно";
}

function moderationAction(request) {
  return request?.action === "unban" ? "unban" : "ban";
}

function moderationActionLabel(request) {
  return moderationAction(request) === "unban" ? "Разбан" : "Бан";
}

function moderationDurationLabel(request) {
  const actionLabel = moderationActionLabel(request);
  if (moderationAction(request) === "unban") return actionLabel;
  if (!request.durationMinutes) return `${actionLabel} · бессрочно`;
  const minutes = Number(request.durationMinutes);
  if (minutes < 60) return `${actionLabel} · ${minutes} мин.`;
  if (minutes < 1440) return `${actionLabel} · ${minutes / 60} ч.`;
  return `${actionLabel} · ${minutes / 1440} дн.`;
}

function moderationRemainingLabel(request) {
  if (!request?.banExpiresAt) return "";
  const remainingMs = new Date(request.banExpiresAt).valueOf() - Date.now();
  if (!Number.isFinite(remainingMs)) return "";
  if (remainingMs <= 0) return "Срок истёк, ожидается подтверждение снятия";
  const minutes = Math.ceil(remainingMs / 60_000);
  if (minutes < 60) return `Осталось ${minutes} мин.`;
  if (minutes < 1440) return `Осталось ${Math.ceil(minutes / 60)} ч.`;
  return `Осталось ${Math.ceil(minutes / 1440)} дн.`;
}

function confirmedModerationCount(userId) {
  const requests = state.moderationRequests.filter((request) => request.targetUserId === userId);
  return Math.max(
    0,
    ...requests.map((request) => Number(request.repeatCount || 0)),
    requests.filter((request) => ["succeeded", "expired", "revoked"].includes(request.status)).length
  );
}

function moderationHistoryHtml(userId, limit = 50) {
  const requests = state.moderationRequests
    .filter((request) => !userId || request.targetUserId === userId)
    .slice(0, limit);
  if (state.moderationRequestsInFlight && requests.length === 0) {
    return `<div class="emptyState">Загрузка операций...</div>`;
  }
  if (requests.length === 0) return `<div class="emptyState">Операций пока нет</div>`;
  return `<div class="moderationHistory">${requests.map((request) => `
    <article class="moderationHistoryRow">
      <div>
        <strong>${escapeHtml(request.targetDisplayName || request.targetUserId)}</strong>
        <small>${escapeHtml(moderationDurationLabel(request))} · ${escapeHtml(formatDateTime(request.createdAt))} · ${escapeHtml(request.keyLabel || request.keyPrefix || "Администратор")}</small>
      </div>
      <div class="moderationHistoryStatus">
        <strong class="moderationStatus--${escapeHtml(request.status)}">${escapeHtml(moderationStatusLabel(request.status))}</strong>
        ${request.status === "failed" ? `<button type="button" class="eventAction eventAction--mini" data-retry-moderation="${escapeHtml(request.id)}">Повторить</button>` : ""}
      </div>
      <p>${escapeHtml(request.reason || "Причина не указана")}${request.errorMessage ? `<br>Ошибка: ${escapeHtml(request.errorMessage)}` : ""}</p>
    </article>
  `).join("")}</div>`;
}

function ownerQueueRowsHtml(requests, emptyText) {
  if (requests.length === 0) return `<div class="emptyState">${escapeHtml(emptyText)}</div>`;
  return `<div class="ownerCompactList">${requests.map((request) => `
    <article class="ownerCompactRow">
      <div>
        <strong>${escapeHtml(request.targetDisplayName || request.targetUserId)}</strong>
        <small>${escapeHtml(moderationActionLabel(request))} · ${escapeHtml(request.reason || "Причина не указана")}</small>
      </div>
      <div>
        <strong class="moderationStatus--${escapeHtml(request.status)}">${escapeHtml(moderationStatusLabel(request.status))}</strong>
        <small>${escapeHtml(moderationRemainingLabel(request) || formatDateTime(request.updatedAt))}</small>
      </div>
    </article>
  `).join("")}</div>`;
}

function groupMemberById(userId) {
  return state.groupMembers.find((member) => member.userId === userId) || null;
}

function groupManagementStatusLabel(status) {
  return {
    pending: "в очереди",
    processing: "выполняется",
    succeeded: "готово",
    failed: "ошибка",
    cancelled: "отменено"
  }[status] || status;
}

function groupManagementHistoryHtml(limit = 20) {
  const requests = state.groupManagementRequests.slice(0, limit);
  if (state.groupManagementRequestsInFlight && requests.length === 0) {
    return `<div class="emptyState">Загрузка операций группы...</div>`;
  }
  if (!requests.length) return `<div class="emptyState">Операций с группой пока нет</div>`;
  return `<div class="moderationHistory">${requests.map((request) => `
    <article class="moderationHistoryRow">
      <div>
        <strong>${escapeHtml(request.targetDisplayName || request.query || request.action)}</strong>
        <small>${escapeHtml(request.roleName || request.action)} · ${escapeHtml(formatDateTime(request.createdAt))}</small>
      </div>
      <div class="moderationHistoryStatus">
        <strong class="moderationStatus--${escapeHtml(request.status)}">${escapeHtml(groupManagementStatusLabel(request.status))}</strong>
      </div>
      ${request.errorMessage ? `<p>Ошибка: ${escapeHtml(request.errorMessage)}</p>` : ""}
    </article>
  `).join("")}</div>`;
}

function ownerGroupMemberHtml(userId) {
  const member = groupMemberById(userId);
  if (!member) {
    return `<section class="adminSection ownerGroupMemberPanel">
      <h3>Участник VRChat-группы</h3>
      <p class="ownerWarning">Членство ещё не проверено или пользователь не найден в загруженной странице группы.</p>
      <button type="button" class="eventAction" data-group-member-check>Проверить членство</button>
    </section>`;
  }
  const assigned = new Set(member.roleIds || []);
  const roleRows = (roles, action) => roles.map((role) => `
    <button
      type="button"
      class="ownerRoleButton${role.isManagementRole ? " ownerRoleButton--management" : ""}"
      data-group-role-${action}="${escapeHtml(role.id)}"
      data-group-role-name="${escapeHtml(role.name)}"
      ${canManageGroupRoles() ? "" : "disabled"}
    >
      <strong>${escapeHtml(role.name)}</strong>
      <small>${canManageGroupRoles() ? (role.isManagementRole ? "Управляющая роль" : "Роль группы") : "Только просмотр"}</small>
    </button>
  `).join("");
  const availableRoles = state.groupRoles.filter((role) => !assigned.has(role.id));
  const assignedRoles = state.groupRoles.filter((role) => assigned.has(role.id));
  return `<section class="adminSection ownerGroupMemberPanel">
    <div class="adminCardHeader">
      <div>
        <h3>Участник VRChat-группы</h3>
        <p>${escapeHtml(member.displayName || userId)} · ${escapeHtml(member.membershipStatus || "member")}</p>
      </div>
      <div class="adminCardActions">
        ${playerProfileButton(userId, member.displayName || userId, { label: "Профиль" })}
        <button type="button" class="eventAction" data-group-member-check>Проверить снова</button>
      </div>
    </div>
    <div class="ownerRoleColumns">
      <div>
        <h4>Доступные роли</h4>
        <div class="ownerRoleList">${roleRows(availableRoles, "add") || `<div class="emptyState">Нет доступных ролей</div>`}</div>
      </div>
      <div>
        <h4>Назначенные роли</h4>
        <div class="ownerRoleList">${roleRows(assignedRoles, "remove") || `<div class="emptyState">Нет назначенных ролей</div>`}</div>
      </div>
    </div>
    <label class="ownerManagerNotes">
      <span>Заметки управляющих VRChat-группы</span>
      <textarea data-group-manager-notes maxlength="1000">${escapeHtml(member.managerNotes || "")}</textarea>
    </label>
    <button type="button" class="eventAction" data-group-member-notes-save>Сохранить заметки</button>
    ${canManageGroupRoles() ? `<p class="ownerWarning">Назначение управляющей роли даёт права внутри VRChat. Перед подтверждением повторно проверьте профиль игрока.</p>` : ""}
    ${canKickGroupMembers() ? `<button type="button" class="eventAction eventAction--danger" data-group-member-kick>Исключить из группы</button>` : ""}
  </section>`;
}

function ownerOverviewHtml() {
  const queue = state.moderationRequests.filter((request) => ACTIVE_MODERATION_STATUSES.has(request.status));
  const activeTemporary = state.moderationRequests.filter((request) => (
    moderationAction(request) === "ban" &&
    request.status === "succeeded" &&
    request.durationMinutes &&
    request.banExpiresAt
  ));
  const watched = Object.entries(state.playerNotes)
    .filter(([, record]) => record?.status === "watch")
    .sort(([, a], [, b]) => String(a.displayName || "").localeCompare(String(b.displayName || ""), "ru"));
  const failed = state.moderationRequests.filter((request) => request.status === "failed").length;
  return `<div class="ownerActionPanel ownerOverview">
    ${canRequestOwnerBans() ? `<div class="ownerSummaryGrid">
      <div><strong>${queue.length}</strong><span>В очереди</span></div>
      <div><strong>${activeTemporary.length}</strong><span>Временные баны</span></div>
      <div><strong>${watched.length}</strong><span>Под наблюдением</span></div>
      <div><strong>${failed}</strong><span>Требуют внимания</span></div>
    </div>
    <section class="adminSection">
      <h3>Активные временные баны</h3>
      ${ownerQueueRowsHtml(activeTemporary, "Активных временных банов нет")}
    </section>
    <section class="adminSection">
      <h3>Очередь операций</h3>
      ${ownerQueueRowsHtml(queue, "Очередь пуста")}
    </section>` : ""}
    <section class="adminSection">
      <h3>Наблюдение</h3>
      ${watched.length ? `<div class="ownerWatchList">${watched.map(([userId, record]) => `
        <span><strong>${escapeHtml(record.displayName || userId)}</strong><small>${escapeHtml(userId)}</small></span>
      `).join("")}</div>` : `<div class="emptyState">Список наблюдения пуст</div>`}
    </section>
    ${canRequestOwnerBans() ? `<section class="adminSection">
      <h3>Журнал модерации команды</h3>
      ${moderationHistoryHtml("", 50)}
    </section>` : ""}
    ${hasGroupManagementAccess() ? `<section class="adminSection">
      <h3>Операции управления VRChat-группой</h3>
      ${groupManagementHistoryHtml()}
    </section>` : ""}
  </div>`;
}

function ownerIncidentReport(userId) {
  const summary = buildPlayerSummary(userId);
  const record = playerRecord(userId);
  const world = currentWorldEvent();
  const worldName = world?.worldName || world?.worldId || world?.instance || "-";
  const avatars = recentAvatarUses(summary.avatars).slice(-5).reverse();
  const recent = eventsForUser(userId).slice(-8).reverse();
  return [
    "VRChat Admin Tools · карточка инцидента",
    `Игрок: ${summary.name}`,
    `User ID: ${userId}`,
    `Мир: ${worldName}`,
    `Статус: ${record.status}`,
    `Заметка: ${record.note || "нет"}`,
    `Подтверждённых операций: ${confirmedModerationCount(userId)}`,
    "",
    "Последние аватары:",
    ...(avatars.length ? avatars.map((event) => `- ${event.avatarName || event.avatarId || "-"}${event.avatarId ? ` · ${event.avatarId}` : ""}`) : ["- нет данных"]),
    "",
    "Последние события:",
    ...(recent.length ? recent.map((event) => `- ${formatTime(event)} · ${eventKind(event)} · ${eventDetails(event)}`) : ["- нет событий"])
  ].join("\n");
}

function ownerIncidentHtml(userId) {
  const summary = buildPlayerSummary(userId);
  const record = playerRecord(userId);
  const recent = eventsForUser(userId).slice(-5).reverse();
  const repeats = confirmedModerationCount(userId);
  return `<section class="ownerIncident">
    <div class="adminCardHeader">
      <div>
        <h2>Карточка инцидента</h2>
        <p>Краткий контекст перед решением модератора</p>
      </div>
      <button type="button" class="eventAction" data-copy-owner-incident>Копировать отчёт</button>
    </div>
    <div class="ownerIncidentStats">
      <div><strong>${escapeHtml(summary.name)}</strong><span>Игрок</span></div>
      <div><strong>${escapeHtml(record.status)}</strong><span>Метка</span></div>
      <div><strong>${repeats}</strong><span>Прошлые операции</span></div>
      <div><strong>${recent.length}</strong><span>События</span></div>
    </div>
    <div class="ownerIncidentEvents">
      ${recent.map(adminEventRow).join("") || `<div class="emptyState">Событий пока нет</div>`}
    </div>
  </section>`;
}

function ownerPlayerCardHtml(userId) {
  if (!userId) return ownerOverviewHtml();
  const watched = playerRecord(userId).status === "watch";
  return `<div class="ownerActionPanel" data-owner-player="${escapeHtml(userId)}">
    ${canViewGroupMembers() ? ownerGroupMemberHtml(userId) : ""}
    ${canRequestOwnerBans() ? `<section class="ownerModerationPanel">
      <div class="adminCardHeader">
        <div>
          <h2>Управление баном</h2>
          <p>${escapeHtml(state.license?.moderationGroupId || "")}</p>
        </div>
        <div class="adminCardActions">
          <button class="eventAction" data-owner-watch>${watched ? "Убрать наблюдение" : "Наблюдать"}</button>
          <button class="eventAction eventAction--danger" data-owner-ban>Забанить</button>
          <button class="eventAction eventAction--success" data-owner-unban>Разбанить</button>
          <button type="button" class="adminCardClose" data-clear-owner-selection title="Убрать выбранного игрока" aria-label="Убрать выбранного игрока">×</button>
        </div>
      </div>
      <p class="ownerWarning">Временный бан экспериментальный: служба модерации снимет его после указанного срока. Перед действием проверьте профиль и причину.</p>
      <div class="adminSection">
        <h3>Операции с игроком · подтверждено ранее: ${confirmedModerationCount(userId)}</h3>
        ${moderationHistoryHtml(userId)}
      </div>
    </section>` : ""}
    ${ownerIncidentHtml(userId)}
    ${adminPlayerCardHtml(userId)}
  </div>`;
}

function renderOwnerTools() {
  if (!ownerPlayerList || !ownerPlayerCard || !hasOwnerAccess()) return;
  if (ownerGroupLabel) ownerGroupLabel.textContent = state.license.moderationGroupId;
  const query = state.ownerSearch.toLowerCase();
  const loggedPlayers = state.ownerSource === "group" || state.ownerOnlineFilter === "online"
    ? livePlayerSummaries()
    : playerSummaries();
  const loggedByUserId = new Map(loggedPlayers.map((summary) => [summary.userId, summary]));
  const summaries = state.ownerSource === "group"
    ? state.groupMembers
      .map((member) => {
        const logged = loggedByUserId.get(member.userId);
        return {
          name: member.displayName || logged?.name || member.userId,
          userId: member.userId,
          online: Boolean(logged?.online),
          joins: logged?.joins || [],
          lastActivityAt: logged?.lastActivityAt || 0,
          membershipStatus: member.membershipStatus || "member"
        };
      })
      .filter((summary) => (
        (state.ownerOnlineFilter !== "online" || summary.online) &&
        (!query || summary.name.toLowerCase().includes(query) || summary.userId.toLowerCase().includes(query))
      ))
      .sort(comparePlayerSummaries)
    : loggedPlayers.filter((summary) => (
      (state.ownerOnlineFilter !== "online" || summary.online) &&
      (!query || summary.name.toLowerCase().includes(query) || summary.userId.toLowerCase().includes(query))
    ));
  const paged = state.ownerSource === "logs"
    ? pagedPlayerSummaries(summaries, state.ownerPlayerPage)
    : { page: 0, pageCount: 1, rows: summaries };
  state.ownerPlayerPage = paged.page;
  let listHtml = paged.rows.map((summary) => {
    const record = playerRecordView(summary.userId);
    const active = summary.userId === state.ownerSelectedUserId ? " active" : "";
    const statusClass = summary.online ? "adminStatus adminStatus--online" : "adminStatus adminStatus--offline";
    const sourceStatus = state.ownerSource === "group"
      ? `<span class="${statusClass}">${summary.online ? "в сети" : "не в сети"}</span> · ${escapeHtml(summary.membershipStatus)}`
      : `<span class="${statusClass}">${summary.online ? "в сети" : "не в сети"}</span> · ${summary.historicalOnly ? "из истории" : `${summary.joins.length} заходов`}`;
    const status = record.status !== "ok" ? `<span class="adminBadge">${escapeHtml(record.status)}</span>` : "";
    return `<button class="adminPlayerItem${active}" data-owner-user-id="${escapeHtml(summary.userId)}">
      <span>${escapeHtml(summary.name)}</span>
      <small>${sourceStatus}</small>
      ${status}
    </button>`;
  }).join("") || `<div class="emptyState">${state.ownerSource === "group" ? "Нажмите «Обновить», чтобы загрузить участников группы" : "Нет игроков"}</div>`;
  if (state.ownerSource === "logs") {
    listHtml += playerListPagerHtml("owner", paged.page, paged.pageCount, summaries.length);
  }
  if (state.ownerSource === "group" && state.groupManagementRequests.length) {
    const first = state.groupMembers.length ? state.groupMembersOffset + 1 : 0;
    const last = state.groupMembersOffset + state.groupMembers.length;
    const totalLabel = state.groupMembersQuery ? ` из ${state.groupMembersTotal}` : "";
    listHtml += `<div class="ownerGroupPager">
      <button type="button" data-group-page="previous" ${state.groupMembersOffset <= 0 ? "disabled" : ""}>←</button>
      <span>${first}–${last}${totalLabel}</span>
      <button type="button" data-group-page="next" ${state.groupMembersHasMore ? "" : "disabled"}>→</button>
    </div>`;
  }
  if (ownerPlayerList._renderedHtml !== listHtml) {
    const scrollTop = ownerPlayerList.scrollTop;
    ownerPlayerList.innerHTML = listHtml;
    ownerPlayerList._renderedHtml = listHtml;
    ownerPlayerList.scrollTop = scrollTop;
  }
  if (state.ownerSelectedUserId && !summaries.some((summary) => summary.userId === state.ownerSelectedUserId)) {
    state.ownerSelectedUserId = "";
  }
  if (isEditingAdminPlayer(state.ownerSelectedUserId)) return;
  if (document.activeElement?.matches("[data-group-manager-notes]")) return;
  const cardHtml = ownerPlayerCardHtml(state.ownerSelectedUserId);
  if (ownerPlayerCard._renderedHtml !== cardHtml) {
    const scrollTop = ownerPlayerCard.scrollTop;
    ownerPlayerCard.innerHTML = cardHtml;
    ownerPlayerCard._renderedHtml = cardHtml;
    ownerPlayerCard.scrollTop = scrollTop;
  }
}

async function loadModerationRequests({ silent = false } = {}) {
  if (!canRequestOwnerBans() || state.moderationRequestsInFlight) return;
  state.moderationRequestsInFlight = true;
  if (activePaneName() === "owner") renderWhenVisible(renderOwnerTools);
  try {
    state.moderationRequests = await window.clientApi.listGroupBanRequests();
  } catch (error) {
    if (!silent) setRuntimeStatus(moderationRequestError(error), true);
  } finally {
    state.moderationRequestsInFlight = false;
    if (activePaneName() === "owner") renderWhenVisible(renderOwnerTools);
  }
}

function applyGroupManagementResults() {
  const succeeded = state.groupManagementRequests
    .filter((request) => request.status === "succeeded")
    .slice()
    .reverse();
  const latestList = [...succeeded].reverse().find((request) => request.action === "list_members");
  let members = latestList?.result?.members
    ? latestList.result.members.slice()
    : state.groupMembers.slice();
  const latestListTime = latestList ? new Date(latestList.createdAt).valueOf() : 0;
  for (const request of succeeded.filter((item) => new Date(item.createdAt).valueOf() >= latestListTime)) {
    const member = request.result?.member;
    if (request.action === "kick_member") {
      members = members.filter((item) => item.userId !== request.targetUserId);
    } else if (member?.userId) {
      const index = members.findIndex((item) => item.userId === member.userId);
      if (index === -1) members.push(member);
      else members[index] = member;
    }
  }
  const withRoles = [...succeeded].reverse().find((request) => Array.isArray(request.result?.roles));
  state.groupMembers = members;
  state.groupRoles = withRoles?.result?.roles || state.groupRoles;
  state.groupMembersTotal = Number(latestList?.result?.total ?? state.groupMembersTotal);
  state.groupMembersOffset = Number(latestList?.result?.offset ?? state.groupMembersOffset);
  state.groupMembersLimit = Number(latestList?.result?.limit ?? state.groupMembersLimit);
  state.groupMembersQuery = String(latestList?.result?.query ?? state.groupMembersQuery);
  state.groupMembersHasMore = Boolean(latestList?.result?.hasMore);
}

async function loadGroupManagementRequests({ silent = false } = {}) {
  if (!hasGroupManagementAccess() || state.groupManagementRequestsInFlight) return;
  state.groupManagementRequestsInFlight = true;
  try {
    state.groupManagementRequests = await window.clientApi.listGroupManagementRequests();
    applyGroupManagementResults();
  } catch (error) {
    if (!silent) setRuntimeStatus(groupManagementError(error), true);
  } finally {
    state.groupManagementRequestsInFlight = false;
    if (activePaneName() === "owner") renderWhenVisible(renderOwnerTools);
  }
}

async function submitGroupManagement(request, successMessage) {
  const queued = await window.clientApi.requestGroupManagement(request);
  const existingIndex = state.groupManagementRequests.findIndex((item) => item.id === queued.id);
  if (existingIndex >= 0) state.groupManagementRequests[existingIndex] = queued;
  else state.groupManagementRequests.unshift(queued);
  renderOwnerTools();
  setRuntimeStatus(
    queued.deduplicated
      ? `Такая операция уже выполняется. Повторный запрос не отправлен${
        queued.retryAfterSeconds ? `; подождите примерно ${queued.retryAfterSeconds} сек.` : "."
      }`
      : successMessage || "Операция добавлена в служебную очередь."
  );
}

async function requestOwnerGroupMembers() {
  if (!canViewGroupMembers()) throw new Error("group_management_permission_required");
  const value = ownerPlayerSearch?.value.trim() || "";
  const userId = vrchatUserIdFromInput(value);
  if (userId) {
    await submitGroupManagement({
      action: "get_member",
      targetUserId: userId,
      targetDisplayName: userId
    }, "Проверка участника добавлена в очередь.");
    state.ownerSelectedUserId = userId;
    return;
  }
  if (value && value.length < 3) throw new Error("group member search requires at least 3 characters");
  await submitGroupManagement({
    action: "list_members",
    query: value,
    offset: 0,
    limit: state.groupMembersLimit
  }, value ? "Поиск участников добавлен в очередь." : "Загрузка участников добавлена в очередь.");
}

function filterBuilderEvents(kind, events) {
  if (kind === "players") {
    const q = state.builderSearch.players.name.toLowerCase();
    if (!q) return events;
    return events.filter((event) => {
      const name = displayName(event).toLowerCase();
      const id = (event.userId || "").toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }
  if (kind === "avatars") {
    const qName = state.builderSearch.avatars.name.toLowerCase();
    const qAvatar = state.builderSearch.avatars.avatar.toLowerCase();
    return events.filter((event) => {
      const nameOk = !qName || displayName(event).toLowerCase().includes(qName);
      const avatarOk = !qAvatar || (event.avatarName || event.avatarId || "").toLowerCase().includes(qAvatar);
      return nameOk && avatarOk;
    });
  }
  if (kind === "portals") {
    const q = state.builderSearch.portals.event.toLowerCase();
    if (!q) return events;
    return events.filter((event) => `${eventKind(event)} ${eventDetails(event)}`.toLowerCase().includes(q));
  }
  if (kind === "worlds") {
    const q = state.builderSearch.worlds.world.toLowerCase();
    if (!q) return events;
    return events.filter((event) => eventDetails(event).toLowerCase().includes(q));
  }
  return events;
}

function builderSearchHtml(kind) {
  if (kind === "players") {
    return `<div class="builderSearchRow" data-search-block="${kind}">
      <input class="builderSearchInput" data-builder-search="${kind}" data-builder-field="name"
        type="search" placeholder="Поиск по имени..." value="${escapeHtml(state.builderSearch.players.name)}">
    </div>`;
  }
  if (kind === "avatars") {
    return `<div class="builderSearchRow" data-search-block="${kind}">
      <input class="builderSearchInput" data-builder-search="${kind}" data-builder-field="name"
        type="search" placeholder="Поиск по игроку..." value="${escapeHtml(state.builderSearch.avatars.name)}">
      <input class="builderSearchInput" data-builder-search="${kind}" data-builder-field="avatar"
        type="search" placeholder="Поиск по аватару..." value="${escapeHtml(state.builderSearch.avatars.avatar)}">
    </div>`;
  }
  if (kind === "portals") {
    return `<div class="builderSearchRow" data-search-block="${kind}">
      <input class="builderSearchInput" data-builder-search="${kind}" data-builder-field="event"
        type="search" placeholder="Создан / удалён..." value="${escapeHtml(state.builderSearch.portals.event)}">
    </div>`;
  }
  if (kind === "worlds") {
    return `<div class="builderSearchRow" data-search-block="${kind}">
      <input class="builderSearchInput" data-builder-search="${kind}" data-builder-field="world"
        type="search" placeholder="Поиск мира или instance..." value="${escapeHtml(state.builderSearch.worlds.world)}">
    </div>`;
  }
  return "";
}

const BUILDER_TITLES = {
  players: "Заход / Выход",
  avatars: "Аватары",
  portals: "Порталы",
  worlds: "Мир / инстанс",
  admin: "Admin Tools"
};

function builderPlayerSummaries() {
  const summaries = playerSummaries(BUILDER_PLAYER_LIMIT);
  const userId = state.builderAdminUserId;
  if (!userId || summaries.some((summary) => summary.userId === userId)) return summaries;
  if (playerEventIndex().userIds.has(userId)) summaries.push(buildPlayerSummary(userId));
  else if (state.knownPlayers[userId] || state.playerNotes[userId]) summaries.push(historicalPlayerSummary(userId));
  return summaries;
}

function builderParts(parts = partitionEvents()) {
  if (!state.builderVisible.includes("admin")) return parts;
  return { ...parts, admin: builderPlayerSummaries() };
}

function setBuilderScrollableHtml(element, html) {
  if (!element || element._renderedHtml === html) return;
  const previousTop = element.scrollTop;
  const previousHeight = element.scrollHeight;
  const pinnedToTop = previousTop <= 3;
  element.innerHTML = html;
  element._renderedHtml = html;
  if (pinnedToTop) {
    element.scrollTop = 0;
  } else {
    element.scrollTop = previousTop + Math.max(0, element.scrollHeight - previousHeight);
  }
}

function renderBuilderAdminBlock(block, summaries) {
  const availableIds = new Set(summaries.map((summary) => summary.userId));
  if (!availableIds.has(state.builderAdminUserId)) {
    state.builderAdminUserId = availableIds.has(state.selectedUserId) ? state.selectedUserId : "";
    localStorage.setItem("builderAdminUserId", state.builderAdminUserId);
  }

  const select = block.querySelector("[data-builder-admin-user]");
  const options = `<option value="">Выберите игрока...</option>${summaries.map((summary) => {
    const record = playerRecordView(summary.userId);
    const prefix = summary.online ? "В сети" : "Не в сети";
    const marker = record.status === "ok" ? "" : ` [${record.status}]`;
    return `<option value="${escapeHtml(summary.userId)}">${escapeHtml(`${prefix} — ${summary.name}${marker}`)}</option>`;
  }).join("")}`;
  if (select._renderedHtml !== options) {
    select.innerHTML = options;
    select._renderedHtml = options;
  }
  select.value = state.builderAdminUserId;

  const card = block.querySelector(".builderAdminCard");
  if (isEditingAdminPlayer(state.builderAdminUserId)) return;
  setBuilderScrollableHtml(card, adminPlayerCardHtml(state.builderAdminUserId));
}

function builderStructureMatches(visibleOrder) {
  const blocks = [...builderGrid.querySelectorAll(":scope > .builderBlock")];
  return blocks.length === visibleOrder.length && blocks.every((block, index) => block.dataset.kind === visibleOrder[index]);
}

function renderBuilder(parts = partitionEvents(), { force = false } = {}) {
  const visibleOrder = state.builderOrder.filter(
    (kind) => kind in parts && state.builderVisible.includes(kind)
  );
  const expectedLayoutClass = `layout-${state.builderLayout}`;

  if (!force && builderGrid.classList.contains(expectedLayoutClass) && builderStructureMatches(visibleOrder)) {
    for (const kind of visibleOrder) updateBuilderBlock(kind, parts[kind]);
    return;
  }

  const previousGridTop = builderGrid.scrollTop;
  const previousBlockTops = new Map([...builderGrid.querySelectorAll(":scope > .builderBlock")].map((block) => [
    block.dataset.kind,
    (block.querySelector(".builderMiniList, .builderAdminCard") || {}).scrollTop || 0
  ]));

  builderGrid.className = `builderGrid ${expectedLayoutClass}`;
  builderLayout.value = state.builderLayout;
  builderGrid.innerHTML = "";
  builderGrid.style.setProperty("--builder-column-count", String(Math.max(visibleOrder.length, 1)));

  if (visibleOrder.length === 0) {
    builderGrid.innerHTML = `<div class="emptyState builderEmptyState">Нет активных блоков. Нажмите "Добавить блок", чтобы отобразить данные.</div>`;
    return;
  }

  for (const kind of visibleOrder) {
    const block = document.createElement("section");
    block.className = `builderBlock builderBlock--${kind}`;
    block.dataset.kind = kind;
    block.innerHTML = `
      <header class="builderDragHandle" draggable="true">
        <strong>${escapeHtml(BUILDER_TITLES[kind])}</strong>
        <span>0</span>
      </header>
      ${kind === "admin"
        ? `<div class="builderAdminPicker"><select data-builder-admin-user aria-label="Выбор игрока"></select></div><div class="builderAdminCard adminPlayerCard"></div>`
        : `${builderSearchHtml(kind)}<div class="builderMiniList"></div>`}
    `;
    block.querySelectorAll(".builderSearchInput").forEach((input) => {
      input.addEventListener("mousedown", (event) => event.stopPropagation());
      input.addEventListener("dragstart", (event) => event.stopPropagation());
      input.addEventListener("input", () => {
        const searchKind = input.dataset.builderSearch;
        const field = input.dataset.builderField;
        if (state.builderSearch[searchKind] === undefined) return;
        state.builderSearch[searchKind][field] = input.value;
        saveBuilder();
        updateBuilderBlock(searchKind);
      });
    });
    builderGrid.appendChild(block);
    updateBuilderBlock(kind, parts[kind]);
    const scrollable = block.querySelector(".builderMiniList, .builderAdminCard");
    if (scrollable) scrollable.scrollTop = previousBlockTops.get(kind) || 0;
  }
  builderGrid.scrollTop = previousGridTop;
}

function updateBuilderBlock(kind, sourceEvents = null) {
  const block = builderGrid.querySelector(`.builderBlock[data-kind="${kind}"]`);
  if (!block) return;
  const events = sourceEvents || (kind === "admin" ? builderPlayerSummaries() : partitionEvents()[kind]);
  if (!events) return;
  if (kind === "admin") {
    const countEl = block.querySelector(".builderDragHandle span");
    if (countEl) countEl.textContent = String(events.length);
    renderBuilderAdminBlock(block, events);
    return;
  }

  const filtered = filterBuilderEvents(kind, events);

  const countEl = block.querySelector(".builderDragHandle span");
  if (countEl) countEl.textContent = String(filtered.length);

  const listEl = block.querySelector(".builderMiniList");
  const html = filtered.slice(-80).reverse().map(rowHtml).join("") || `<div class="emptyState">-</div>`;
  setBuilderScrollableHtml(listEl, html);
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function saveBuilder() {
  localStorage.setItem("builderOrder", JSON.stringify(state.builderOrder));
  localStorage.setItem("builderLayout", state.builderLayout);
  localStorage.setItem("builderVisible", JSON.stringify(state.builderVisible));
  localStorage.setItem("builderSearch", JSON.stringify(state.builderSearch));
}

function migrateBuilderState() {
  state.builderOrder = [...new Set(state.builderOrder.filter((kind) => BUILDER_KINDS.includes(kind)))];
  for (const kind of BUILDER_KINDS) {
    if (!state.builderOrder.includes(kind)) state.builderOrder.push(kind);
  }
  state.builderVisible = [...new Set(state.builderVisible.filter((kind) => BUILDER_KINDS.includes(kind)))];
  if (localStorage.getItem("builderSchemaVersion") !== "3") {
    for (const kind of ["portals", "worlds", "admin"]) {
      if (!state.builderVisible.includes(kind)) state.builderVisible.push(kind);
    }
    localStorage.setItem("builderSchemaVersion", "3");
  }
  saveBuilder();
}

async function runButton(button, task) {
  const oldText = button.textContent;
  button.disabled = true;
  button.textContent = "...";
  try {
    return await task();
  } finally {
    button.disabled = false;
    button.textContent = oldText;
  }
}

function setFilePath(filePath) {
  state.currentFile = filePath;
  filePathLabel.textContent = filePath || "-";
}

function recentLiveEvent(event) {
  if (!state.tailRunning) return false;
  const timestamp = eventTimestampMs(event);
  return timestamp === null || Math.abs(Date.now() - timestamp) <= 2 * 60 * 1000;
}

function notifyForEvent(event) {
  if (!recentLiveEvent(event) || !window.clientApi.showNotification) return;
  if (state.notifyMarkedPlayers && event.type === "player-joined" && event.userId) {
    const record = playerRecord(event.userId);
    if (record.status !== "ok") {
      window.clientApi.showNotification({
        key: `player:${event.userId}`,
        title: "Отмеченный игрок вошёл",
        body: `${displayName(event)} · ${record.status}`
      }).catch(() => {});
    }
  }
  if (state.notifyCrashAvatars && event.type === "avatar-changed") {
    const record = avatarNoteRecord(event.avatarName, event.avatarId);
    if (record?.status === "crash") {
      window.clientApi.showNotification({
        key: `avatar:${record.avatarKey}`,
        title: "Обнаружен отмеченный аватар",
        body: `${event.avatarName || event.avatarId || "Неизвестный аватар"} · ${displayName(event)}`
      }).catch(() => {});
    }
  }
}

function addEvent(event) {
  event = enrichAvatarEvent(event);
  if (!event?.id || state.eventIds.has(event.id)) return;
  state.eventIds.add(event.id);
  state.events.push(event);
  if (event.userId) rememberKnownPlayer(event, { invalidateHistory: false });
  state.lastEventAt = new Date().toISOString();
  invalidatePlayerEventIndex();
  rememberCrashEvent(event);
  resolveAvatarFromApi(event);
  resolveAvatarNameFromApi(event);
  notifyForEvent(event);
  syncCurrentPlaySession().catch(() => {});
  if (state.events.length > 5000) {
    const removed = state.events.splice(0, state.events.length - 5000);
    for (const oldEvent of removed) state.eventIds.delete(oldEvent.id);
    invalidatePlayerEventIndex();
    const remainingUserIds = playerEventIndex().userIds;
    if (removed.some((oldEvent) => oldEvent.userId && !remainingUserIds.has(oldEvent.userId))) {
      invalidateHistoricalPlayerSummaries();
    }
  }
  scheduleRender();
}

function rememberCrashEvent(event) {
  const inferredUserId = event.userId || userIdByPlayerName(event.playerName);
  const kept = {
    ...event,
    userId: inferredUserId,
    capturedAt: new Date().toISOString(),
    display: displayName({ ...event, userId: inferredUserId })
  };
  state.crashEventBuffer.push(kept);
  const cutoff = Date.now() - 10 * 60 * 1000;
  state.crashEventBuffer = state.crashEventBuffer
    .filter((item) => new Date(item.timestamp || item.capturedAt).getTime() >= cutoff)
    .slice(-500);
  scheduleCrashBufferSave();
}

function resetEvents(options = {}) {
  const { clearCrashBuffer = false } = options;
  state.events = [];
  state.lastEventAt = "";
  state.eventIds.clear();
  invalidatePlayerEventIndex();
  invalidateHistoricalPlayerSummaries();
  if (state.renderTimer) clearTimeout(state.renderTimer);
  state.renderTimer = null;
  state.renderDeferred = false;
  if (clearCrashBuffer) {
    state.crashEventBuffer = [];
    state.crashLastLogModifiedAt = "";
    state.crashFreezeReported = false;
    saveCrashState();
  }
  render();
  const activePane = document.querySelector(".tabPane.active");
  if (activePane?.dataset.pane === "dashboard") renderDashboard();
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeServerSnapshot(snapshot) {
  if (!snapshot) return null;
  const nUsers = numberOrNull(snapshot.nUsers ?? snapshot.n_users);
  if (nUsers === null) return null;
  return {
    location: String(snapshot.location || ""),
    worldId: String(snapshot.worldId || ""),
    instanceId: String(snapshot.instanceId || ""),
    worldName: String(snapshot.worldName || ""),
    nUsers,
    capacity: numberOrNull(snapshot.capacity),
    queueSize: numberOrNull(snapshot.queueSize),
    fetchedAt: snapshot.fetchedAt || new Date().toISOString(),
    source: snapshot.source || "api"
  };
}

function serverLocationKey(snapshot) {
  if (!snapshot) return "";
  if (snapshot.location) return snapshot.location;
  if (snapshot.worldId && snapshot.instanceId) return `${snapshot.worldId}:${snapshot.instanceId}`;
  return snapshot.worldId || "";
}

function serverSnapshotMatchesWorld(snapshot) {
  const world = currentWorldEvent();
  if (!world || !snapshot) return true;
  if (world.worldId && snapshot.worldId && world.worldId !== snapshot.worldId) return false;
  if (!world.instance || !snapshot.instanceId) return true;
  return world.instance === snapshot.location || world.instance.includes(snapshot.instanceId);
}

function activeServerSnapshot(maxAgeMs = 3 * 60 * 1000) {
  const snapshot = normalizeServerSnapshot(state.serverSnapshot);
  if (!snapshot) return null;
  const fetchedAt = new Date(snapshot.fetchedAt).getTime();
  if (!Number.isFinite(fetchedAt) || Date.now() - fetchedAt > maxAgeMs) return null;
  if (!serverSnapshotMatchesWorld(snapshot)) return null;
  return snapshot;
}

function saveServerSnapshotState() {
  if (state.serverSnapshot) {
    localStorage.setItem("serverSnapshot", JSON.stringify(state.serverSnapshot));
  }
  localStorage.setItem("serverSamples", JSON.stringify(state.serverSamples.slice(-300)));
}

function rememberServerSnapshot(snapshot) {
  const normalized = normalizeServerSnapshot(snapshot);
  if (!normalized) return null;
  const locationKey = serverLocationKey(normalized);
  state.serverSnapshot = normalized;
  state.serverSamples = (Array.isArray(state.serverSamples) ? state.serverSamples : [])
    .filter((sample) => {
      const sampleTime = new Date(sample.fetchedAt).getTime();
      return Number.isFinite(sampleTime) && Date.now() - sampleTime <= 24 * 60 * 60 * 1000;
    });

  const last = state.serverSamples[state.serverSamples.length - 1];
  const lastTime = last ? new Date(last.fetchedAt).getTime() : 0;
  const currentTime = new Date(normalized.fetchedAt).getTime();
  if (!last || serverLocationKey(last) !== locationKey || last.nUsers !== normalized.nUsers || currentTime - lastTime > 60_000) {
    state.serverSamples.push(normalized);
  }

  state.serverSamples = state.serverSamples.slice(-300);
  saveServerSnapshotState();
  return normalized;
}

function currentServerSamples(snapshot) {
  const key = serverLocationKey(snapshot);
  return (Array.isArray(state.serverSamples) ? state.serverSamples : [])
    .map(normalizeServerSnapshot)
    .filter(Boolean)
    .filter((sample) => !key || serverLocationKey(sample) === key)
    .sort((a, b) => new Date(a.fetchedAt).getTime() - new Date(b.fetchedAt).getTime());
}

function buildServerOnlineSeries(samples) {
  const now = Date.now();
  const sampleCount = 48;
  const emptyResult = { points: new Array(sampleCount).fill(0), rangeStart: now - 3600000, rangeEnd: now };
  const rows = samples
    .map((sample) => ({ ...sample, timeMs: new Date(sample.fetchedAt).getTime() }))
    .filter((sample) => Number.isFinite(sample.timeMs))
    .sort((a, b) => a.timeMs - b.timeMs);
  if (rows.length === 0) return emptyResult;

  const firstTs = rows[0].timeMs;
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;
  const rangeStart = Math.max(dayAgo, Math.min(firstTs, oneHourAgo));
  const rangeEnd = now;
  const stepMs = (rangeEnd - rangeStart) / (sampleCount - 1);
  const points = [];
  let rowIndex = 0;
  let currentValue = rows[0].nUsers;

  while (rowIndex < rows.length && rows[rowIndex].timeMs <= rangeStart) {
    currentValue = rows[rowIndex].nUsers;
    rowIndex++;
  }

  for (let i = 0; i < sampleCount; i++) {
    const sampleTs = i === sampleCount - 1 ? rangeEnd : rangeStart + stepMs * i;
    while (rowIndex < rows.length && rows[rowIndex].timeMs <= sampleTs) {
      currentValue = rows[rowIndex].nUsers;
      rowIndex++;
    }
    points.push(currentValue);
  }

  return { points, rangeStart, rangeEnd };
}

async function refreshServerSnapshot(options = {}) {
  const { force = false, silent = true } = options;
  if (!window.clientApi.getVrchatCurrentInstance || state.serverSnapshotInFlight) return activeServerSnapshot();
  const now = Date.now();
  if (!force && now - state.serverSnapshotLastFetchAt < 60_000) return activeServerSnapshot();

  state.serverSnapshotInFlight = true;
  try {
    const snapshot = rememberServerSnapshot(await window.clientApi.getVrchatCurrentInstance());
    state.serverSnapshotLastFetchAt = Date.now();
    if (snapshot && !silent) {
      setRuntimeStatus(`VRChat API: сейчас онлайн ${snapshot.nUsers}${snapshot.capacity !== null ? `/${snapshot.capacity}` : ""}`);
    }
    if (activePaneName() === "dashboard") renderWhenVisible(renderDashboard);
    return snapshot;
  } catch (error) {
    state.serverSnapshotLastFetchAt = Date.now();
    if (!silent) setRuntimeStatus(formatVrchatAuthError(error), true);
    return null;
  } finally {
    state.serverSnapshotInFlight = false;
  }
}

function buildDiscordSnapshot() {
  const worldEvents = currentWorldEvents();
  const playerStats = computePlayerStats(worldEvents);
  const serverSnapshot = activeServerSnapshot();
  const worldEvent = currentWorldEvent(worldEvents);
  const worldName = serverSnapshot?.worldName || worldEvent?.worldName || worldEvent?.worldId || worldEvent?.instance || "-";
  const onlineNow = serverSnapshot?.nUsers ?? playerStats.onlineNow;
  const peakOnline = serverSnapshot
    ? Math.max(onlineNow, ...currentServerSamples(serverSnapshot).map((sample) => sample.nUsers))
    : Math.max(playerStats.peakOnline, onlineNow);
  const watch = playerSummaries().filter((summary) => playerRecordView(summary.userId).status !== "ok");
  const online = playerStats.online.slice(-25).map((event) => `• ${displayName(event)}`).join("\n") || "нет данных";
  const watchText = watch.slice(0, 10).map((summary) => {
    const record = playerRecordView(summary.userId);
    return `• ${summary.name} — ${record.status}${record.note ? ` (${record.note})` : ""}`;
  }).join("\n") || "нет";

  return [
    "**VRChat Admin Snapshot**",
    `Мир: ${worldName}`,
    `Онлайн: ${onlineNow}${serverSnapshot ? " (VRChat API)" : ""}`,
    `Пик: ${peakOnline}`,
    `Уникальных заходов: ${playerStats.uniqueJoins.size}`,
    `Событий: ${state.events.length}`,
    "",
    "**Watchlist:**",
    watchText,
    "",
    "**Онлайн игроки:**",
    online
  ].join("\n");
}

async function copySnapshot() {
  const text = buildDiscordSnapshot();
  await window.clientApi.writeClipboardText(text);
  setRuntimeStatus("Снимок скопирован");
}

function saveCrashEventBuffer() {
  if (state.crashBufferSaveTimer) clearTimeout(state.crashBufferSaveTimer);
  state.crashBufferSaveTimer = null;
  localStorage.setItem("crashEventBuffer", JSON.stringify(state.crashEventBuffer.slice(-500)));
}

function scheduleCrashBufferSave() {
  if (state.crashBufferSaveTimer) return;
  state.crashBufferSaveTimer = setTimeout(saveCrashEventBuffer, CRASH_BUFFER_SAVE_DELAY_MS);
}

function saveCrashState() {
  localStorage.setItem("crashAnalyzerEnabled", String(state.crashAnalyzerEnabled));
  localStorage.setItem("crashIncidents", JSON.stringify(state.crashIncidents.slice(0, 20)));
  saveCrashEventBuffer();
}

function crashWorldName() {
  const worldEvent = currentWorldEvent(currentWorldEvents());
  return worldEvent?.worldName || worldEvent?.worldId || worldEvent?.instance || "-";
}

function eventTimeMs(event) {
  const value = new Date(event?.timestamp || event?.capturedAt || 0).getTime();
  return Number.isFinite(value) ? value : 0;
}

function crashActorKey(event) {
  if (event.userId) return `user:${event.userId}`;
  const name = String(event.display || event.playerName || "").trim().toLowerCase();
  return name && name !== "-" ? `name:${name}` : "";
}

function correlateCrashAvatarCandidates(events) {
  const rows = events.map((event) => ({ ...event }));
  for (const event of rows) {
    if (!event.avatarId) continue;
    if (event.correlationConfidence === "ambiguous") continue;
    const timeMs = eventTimeMs(event);
    const actorKey = crashActorKey(event);
    let matches = rows
      .filter((candidate) => candidate !== event && candidate.avatarName && !candidate.avatarId)
      .filter((candidate) => candidate.correlationConfidence !== "ambiguous")
      .map((candidate) => ({ candidate, delta: Math.abs(eventTimeMs(candidate) - timeMs), actorKey: crashActorKey(candidate) }))
      .filter((row) => row.delta <= 8_000);
    if (actorKey) {
      matches = matches.filter((row) => row.actorKey === actorKey);
    } else {
      const names = new Set(matches.map((row) => avatarNameKey(row.candidate.avatarName)).filter(Boolean));
      if (names.size > 1) continue;
    }
    const target = matches.sort((a, b) => a.delta - b.delta)[0]?.candidate;
    if (!target) continue;
    const key = crashCandidateKey(target);
    target._crashCandidateKey ||= key;
    event._crashCandidateKey ||= key;
    target.avatarId ||= event.avatarId;
    event.avatarName ||= target.avatarName;
    event.userId ||= target.userId || "";
    event.playerName ||= target.playerName || "";
    event.display ||= target.display || "";
  }
  return rows;
}

function recentCrashCandidates(windowMs = 5 * 60 * 1000, incidentTimeMs = Date.now()) {
  const cutoff = incidentTimeMs - windowMs;
  const rows = state.crashEventBuffer
    .filter((event) => {
      const timeMs = eventTimeMs(event);
      return timeMs >= cutoff && timeMs <= incidentTimeMs + 1_000;
    })
    .filter((event) => event.userId || event.playerName || event.avatarId || event.avatarName)
    .slice(-120);
  return correlateCrashAvatarCandidates(rows);
}

function crashCandidateKey(event) {
  if (event._crashCandidateKey) return event._crashCandidateKey;
  return event.userId || event.playerName || verifiedAvatarId(event) || event.avatarName || event.detail || "unknown";
}

function crashRiskLabel(score) {
  if (score >= 110) return "Высокий";
  if (score >= 65) return "Средний";
  return "Низкий";
}

function previousCrashHitCount(event) {
  const userId = event.userId || "";
  const avatarId = verifiedAvatarId(event);
  if (!userId && !avatarId) return 0;
  return state.crashIncidents.filter((incident) => {
    const candidates = incident.candidates || [];
    return candidates.some((candidate) => (
      (userId && candidate.userId === userId) ||
      (avatarId && candidate.avatarId === avatarId)
    ));
  }).length;
}

function scoreCrashEvent(event, incidentTimeMs) {
  const timeMs = eventTimeMs(event);
  const ageSec = Number.isFinite(timeMs) ? Math.max(0, Math.round((incidentTimeMs - timeMs) / 1000)) : 999;
  const reasons = [];
  let score = 0;

  if (ageSec <= 15) {
    score += 38;
    reasons.push("событие было за последние 15 секунд");
  } else if (ageSec <= 30) {
    score += 32;
    reasons.push("событие было за последние 30 секунд");
  } else if (ageSec <= 60) {
    score += 25;
    reasons.push("событие было за последнюю минуту");
  } else if (ageSec <= 120) {
    score += 16;
    reasons.push("событие было рядом по времени");
  } else if (ageSec <= 300) {
    score += 8;
    reasons.push("событие было в последние 5 минут");
  }

  if (event.type === "avatar-changed") {
    score += 42;
    reasons.push("смена аватара");
  } else if (event.type === "avatar-loading") {
    score += 20;
    reasons.push("загрузка аватара");
  } else if (event.type === "avatar-data") {
    score += 26;
    reasons.push("появился avatar ID");
  } else if (event.type === "avatar-audio") {
    score += 24;
    reasons.push("найдены аудио/particle компоненты аватара");
    if ((event.audioSources ?? 0) >= 8) {
      score += 16;
      reasons.push("много audio sources");
    }
    if ((event.particleSystems ?? 0) >= 25) {
      score += 16;
      reasons.push("много particle systems");
    }
  } else if (event.type === "player-joined") {
    score += 10;
    reasons.push("игрок недавно вошёл");
  }

  if (verifiedAvatarId(event)) {
    score += 8;
    reasons.push("есть avatar ID для проверки");
  } else if (event.avatarIdSource === "api-name") {
    reasons.push("ID найден только по названию и не подтверждён логом");
  }

  if (event.correlationConfidence === "ambiguous") {
    score = Math.min(score, 12);
    reasons.push("связь игрока и аватара не определена логом");
  } else if (event.correlationConfidence === "temporal") {
    reasons.push("связь определена только по времени");
  } else if (event.correlationConfidence === "name-only") {
    reasons.push("известно имя аватара, но не игрок");
  }

  const avatarNote = avatarNoteForEvent(event);
  if (avatarNote?.status === "crash") {
    score += 95;
    reasons.push("аватар помечен как crash");
  } else if (avatarNote?.status === "ok" && (event.avatarName || event.avatarId)) {
    score = Math.max(0, score - 35);
    reasons.push("аватар помечен как ok");
  }

  const previousHits = previousCrashHitCount(event);
  if (previousHits > 0) {
    score += Math.min(40, previousHits * 16);
    reasons.push(`уже встречалось в прошлых инцидентах: ${previousHits}`);
  }

  return { score, reasons, ageSec, avatarNote };
}

function analyzeCrashCandidates(events, incidentTimeMs) {
  const grouped = new Map();

  for (const event of events) {
    const key = crashCandidateKey(event);
    const result = scoreCrashEvent(event, incidentTimeMs);
    if (result.score <= 0) continue;

    const current = grouped.get(key) || {
      key,
      score: 0,
      risk: "Низкий",
      userId: event.userId || "",
      playerName: event.display || event.playerName || "",
      avatarId: verifiedAvatarId(event),
      avatarName: event.avatarName || "",
      avatarNoteStatus: "",
      avatarNoteText: "",
      lastSeen: event.timestamp || event.capturedAt,
      reasons: new Set(),
      events: []
    };

    current.score += result.score;
    current.userId ||= event.userId || "";
    current.playerName ||= event.display || event.playerName || "";
    current.avatarId ||= verifiedAvatarId(event);
    current.avatarName ||= event.avatarName || "";
    if (result.avatarNote?.status) current.avatarNoteStatus = result.avatarNote.status;
    if (result.avatarNote?.note) current.avatarNoteText = result.avatarNote.note;
    if (eventTimeMs(event) >= eventTimeMs({ timestamp: current.lastSeen })) {
      current.lastSeen = event.timestamp || event.capturedAt || current.lastSeen;
    }
    for (const reason of result.reasons) current.reasons.add(reason);
    current.events.push({
      time: event.timestamp || event.capturedAt,
      type: event.type,
      detail: eventDetails(event),
      ageSec: result.ageSec
    });
    grouped.set(key, current);
  }

  return [...grouped.values()]
    .map((candidate) => ({
      ...candidate,
      risk: crashRiskLabel(candidate.score),
      reasons: [...candidate.reasons].slice(0, 5),
      events: candidate.events.slice(-5)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function createCrashIncident(reason, status, options = {}) {
  const incidentTimeMs = options.incidentTimeMs || Date.now();
  const candidates = recentCrashCandidates(options.windowMs || 5 * 60 * 1000, incidentTimeMs);
  const suspects = analyzeCrashCandidates(candidates, incidentTimeMs);
  const incident = {
    id: `crash-${Date.now()}`,
    createdAt: new Date().toISOString(),
    reason,
    worldName: crashWorldName(),
    processRunning: Boolean(status?.processRunning),
    logModifiedAt: status?.logModifiedAt || null,
    manual: Boolean(options.manual),
    suspects,
    candidates: candidates.map((event) => ({
      time: event.timestamp || event.capturedAt,
      type: event.type,
      userId: event.userId || "",
      playerName: event.display || event.playerName || "",
      avatarId: verifiedAvatarId(event),
      possibleAvatarId: event.avatarIdSource === "api-name" ? event.avatarId || "" : "",
      avatarName: event.avatarName || "",
      detail: eventDetails(event)
    }))
  };
  state.crashIncidents.unshift(incident);
  state.crashIncidents = state.crashIncidents.slice(0, 20);
  saveCrashState();
  if (activePaneName() === "crash") renderWhenVisible(renderCrashAnalyzer);
  setRuntimeStatus(options.manual ? "Lag snapshot captured" : "Possible VRChat crash captured", true);
}

async function captureLagSnapshot() {
  if (!state.tailRunning) {
    throw new Error("Сначала нажмите Start, чтобы приложение собирало текущие события VRChat.");
  }
  if (state.crashEventBuffer.length === 0) {
    throw new Error("Пока нет событий для снимка. Подождите несколько секунд после входа в мир.");
  }
  const status = await window.clientApi.getCrashStatus({ filePath: state.currentFile });
  state.crashLastStatus = status;
  createCrashIncident("Админ отметил лаг вручную", status, { manual: true, windowMs: 5 * 60 * 1000 });
}

function crashReport(incident = state.crashIncidents[0]) {
  if (!incident) return "Crash Analyzer: инцидентов нет";
  const suspectRows = (incident.suspects || []).map((candidate, index) => {
    const who = candidate.playerName || candidate.userId || "неизвестно";
    const avatar = candidate.avatarName || candidate.avatarId || "аватар не определён";
    const avatarNote = candidate.avatarNoteStatus ? ` · avatar mark: ${candidate.avatarNoteStatus}` : "";
    const reasons = candidate.reasons?.join("; ") || "нет подробностей";
    return `${index + 1}. ${candidate.risk} риск · ${who} · ${avatar}${avatarNote} · score ${candidate.score}\n   Причины: ${reasons}`;
  }).join("\n") || "нет кандидатов";
  const rows = incident.candidates.slice(-20).map((event) => {
    const time = event.time ? formatTime({ timestamp: event.time }) : "-";
    const who = event.playerName || event.userId || "-";
    const detail = event.avatarName || event.avatarId || event.detail || event.userId || "-";
    return `• ${time} — ${eventKind(event)}: ${who} — ${detail}`;
  }).join("\n") || "нет данных";
  return [
    "**VRChat Crash Risk Report**",
    `Время: ${new Date(incident.createdAt).toLocaleString("ru-RU")}`,
    `Причина: ${incident.reason}`,
    `Мир: ${incident.worldName}`,
    "",
    "**Кандидаты по времени:**",
    suspectRows,
    "",
    "**Последние события перед возможным сбоем:**",
    rows,
    "",
    "_Отчёт показывает только риск по совпадениям во времени и не доказывает вину игрока._"
  ].join("\n");
}

function isEditingCrashAvatarNote() {
  const active = document.activeElement;
  if (!active || !crashIncidentList?.contains(active)) return false;
  return active.matches("[data-avatar-note-status], [data-avatar-note-text]");
}

function crashAvatarNoteControl(candidate) {
  const avatarName = candidate.avatarName || "";
  const avatarId = candidate.avatarId || "";
  const key = avatarCandidateNoteKey(avatarName, avatarId);
  if (!key) return "";
  const inherited = avatarNoteForEvent(candidate);
  const record = normalizeAvatarNote(state.avatarNotes[key], {
    avatarKey: key,
    avatarName,
    avatarId,
    status: inherited?.status || candidate.avatarNoteStatus || "ok",
    note: inherited?.note || candidate.avatarNoteText || ""
  });
  const source = key.startsWith("name:")
    ? `Название: ${avatarName}`
    : `Avatar ID: ${avatarId}`;
  return `<div class="crashAvatarNote" data-avatar-key="${escapeHtml(key)}" data-avatar-name="${escapeHtml(avatarName)}" data-avatar-id="${escapeHtml(avatarId)}">
    <div class="crashAvatarNoteHeader">
      <span>${escapeHtml(source)}</span>
      <select data-avatar-note-status>
        <option value="ok"${record.status === "ok" ? " selected" : ""}>ok</option>
        <option value="crash"${record.status === "crash" ? " selected" : ""}>crash</option>
      </select>
    </div>
    <textarea data-avatar-note-text spellcheck="false" placeholder="Заметка по аватару...">${escapeHtml(record.note)}</textarea>
  </div>`;
}

function crashSuspectHtml(candidate, index) {
  const who = candidate.playerName || candidate.userId || "неизвестно";
  const avatar = candidate.avatarName || candidate.avatarId || "аватар не определён";
  const reasons = candidate.reasons?.slice(0, 4).join(", ") || "нет подробностей";
  const key = avatarCandidateNoteKey(candidate.avatarName, candidate.avatarId);
  const status = state.avatarNotes[key]
    ? normalizeAvatarNote(state.avatarNotes[key]).status
    : avatarNoteForEvent(candidate)?.status || candidate.avatarNoteStatus || "";
  const statusBadge = status
    ? `<span class="crashAvatarBadge crashAvatarBadge--${escapeHtml(status)}">${escapeHtml(status)}</span>`
    : "";
  return `<div class="crashSuspectCard">
    <div class="crashSuspectTitle">
      <b>#${index + 1} ${escapeHtml(candidate.risk)} риск</b>
      <span>${escapeHtml(candidate.score)}</span>
    </div>
    <div class="crashSuspectWho">${candidate.userId
      ? playerProfileButton(candidate.userId, who, { label: who, className: "crashPlayerLink" })
      : escapeHtml(who)}</div>
    <div class="crashSuspectAvatar">${statusBadge}<span>${escapeHtml(avatar)}</span></div>
    <small>${escapeHtml(reasons)}</small>
    ${crashAvatarNoteControl(candidate)}
  </div>`;
}

function renderCrashAnalyzer() {
  if (!crashStatusBadge || !crashStatusText || !crashIncidentList || !crashToggleBtn) return;
  const hasIncidents = state.crashIncidents.length > 0;
  crashToggleBtn.textContent = state.crashAnalyzerEnabled ? "Disable" : "Enable";
  crashStatusBadge.textContent = state.crashAnalyzerEnabled ? "watching" : "disabled";
  crashStatusBadge.classList.toggle("crashStatusBadge--on", state.crashAnalyzerEnabled);
  if (copyCrashReportBtn) copyCrashReportBtn.disabled = !hasIncidents;
  if (clearCrashHistoryBtn) clearCrashHistoryBtn.disabled = !hasIncidents;
  const status = state.crashLastStatus;
  if (!state.crashAnalyzerEnabled) {
    crashStatusText.textContent = "Анализатор выключен.";
  } else if (status) {
    const logText = status.logModifiedAt ? `лог: ${new Date(status.logModifiedAt).toLocaleTimeString("ru-RU")}` : "лог не выбран";
    crashStatusText.textContent = state.crashFreezeReported
      ? `VRChat запущен, но лог не обновлялся более 5 минут. Это предупреждение, а не подтверждённый сбой.`
      : `VRChat: ${status.processRunning ? "запущен" : "не найден"}, ${logText}.`;
  } else {
    crashStatusText.textContent = "Ожидание первого статуса...";
  }
  if (isEditingCrashAvatarNote()) return;
  crashIncidentList.innerHTML = state.crashIncidents.slice(0, 5).map((incident) => {
    const date = new Date(incident.createdAt).toLocaleString("ru-RU");
    const candidateCount = incident.candidates?.length || 0;
    const suspects = incident.suspects || [];
    return `<div class="crashIncident">
      <strong>${escapeHtml(date)}</strong>
      <span>${escapeHtml(incident.reason)}</span>
      <div class="crashSuspectList">
        ${suspects.length ? suspects.map(crashSuspectHtml).join("") : `<div class="crashSuspectLine"><b>кандидатов нет</b></div>`}
      </div>
      <em>${escapeHtml(incident.worldName)} · событий: ${candidateCount}</em>
    </div>`;
  }).join("") || `<div class="emptyState">Инцидентов нет</div>`;
}

async function pollCrashAnalyzer() {
  if (!state.crashAnalyzerEnabled) return;
  const status = await window.clientApi.getCrashStatus({ filePath: state.currentFile });
  const previous = state.crashLastStatus;
  state.crashLastStatus = status;
  if (previous?.processRunning && !status.processRunning && state.tailRunning) {
    createCrashIncident("VRChat неожиданно закрылся во время мониторинга", status);
  }
  if (status.processRunning && state.tailRunning && status.logModifiedAt) {
    const lastLogMs = new Date(status.logModifiedAt).getTime();
    const silentMs = Date.now() - lastLogMs;
    const changed = state.crashLastLogModifiedAt !== status.logModifiedAt;
    if (changed) {
      state.crashLastLogModifiedAt = status.logModifiedAt;
      state.crashFreezeReported = false;
    } else {
      state.crashFreezeReported = silentMs > CRASH_LOG_SILENCE_WARNING_MS && state.crashEventBuffer.length > 0;
    }
  } else {
    state.crashFreezeReported = false;
  }
  if (activePaneName() === "crash") renderWhenVisible(renderCrashAnalyzer);
}

function startCrashAnalyzer() {
  if (state.crashPollTimer) return;
  state.crashPollTimer = setInterval(() => {
    pollCrashAnalyzer().catch((error) => setRuntimeStatus(`Crash Analyzer: ${error.message}`, true));
  }, 5000);
  pollCrashAnalyzer().catch((error) => setRuntimeStatus(`Crash Analyzer: ${error.message}`, true));
}

function stopCrashAnalyzer() {
  if (state.crashPollTimer) clearInterval(state.crashPollTimer);
  state.crashPollTimer = null;
  renderCrashAnalyzer();
}

// ── Форма активации ──────────────────────────────────────────────────────────

activationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runButton(activateBtn, async () => {
    setActivationStatus("Проверка ключа...");
    const settings = await window.clientApi.getSettings();
    const cookie = submittedVrchatCookie();
    const willHaveStoredCookie = cookie === undefined
      ? vrchatAuthCookie.dataset.stored === "true"
      : Boolean(cookie);
    const payload = await window.clientApi.activate({
      serverUrl: settings.serverUrl,
      licenseKey: licenseKey.value,
      authorAlias: activationAuthorAlias?.value || "",
      vrchatAuthCookie: cookie,
      rememberMe: Boolean(rememberMe?.checked)
    });
    state.license = payload.license || null;
    syncOwnerAccess();
    setStoredCookieState(willHaveStoredCookie);
    setTeamScope(state.license);
    licenseKey.value = "";
    setAuthorAliasRequested(false);
    setRuntimeStatus(`Session active until ${new Date(payload.expiresAt).toLocaleString("ru-RU")}`);
    showApp();
    startPlayerNotesPolling();
    startAvatarNotesPolling();
    startAvatarCatalogPolling();
    await loadPlayerNotes({ pushLocal: true });
    await loadGlobalPlayerNotes({ force: true, silent: true });
    await loadAvatarCatalog({ silent: true, pushLocal: true });
    await loadAvatarNotes({ silent: true, pushLocal: true });
    await loadGlobalAvatarNotes({ force: true, silent: true });
    await refreshServerSnapshot({ silent: true });
  }).catch((error) => {
    const code = activationErrorCode(error);
    if (code.startsWith("author_alias_")) {
      setAuthorAliasRequested(true);
      activationAuthorAlias?.focus();
    }
    setActivationStatus(formatActivationError(error), true);
  });
});

vrchatAuthCookie.addEventListener("input", () => {
  vrchatAuthCookie.dataset.dirty = "true";
});

checkVrchatBtn?.addEventListener("click", () => {
  runButton(checkVrchatBtn, async () => {
    const settings = await window.clientApi.getSettings();
    const saved = await window.clientApi.saveSettings({
      serverUrl: settings.serverUrl,
      vrchatAuthCookie: submittedVrchatCookie()
    });
    setStoredCookieState(Boolean(saved.hasVrchatAuthCookie));
    const user = await window.clientApi.getVrchatCurrentUser();
    const instance = await window.clientApi.getVrchatCurrentInstance().catch(() => null);
    const snapshot = rememberServerSnapshot(instance);
    const location = user.location ? `, location: ${user.location}` : "";
    const online = snapshot ? `, online: ${snapshot.nUsers}${snapshot.capacity !== null ? `/${snapshot.capacity}` : ""}` : "";
    setActivationStatus(`VRChat: ${user.displayName}${location}${online}`);
  }).catch((error) => setActivationStatus(formatVrchatAuthError(error), true));
});

// ── Основной тулбар ──────────────────────────────────────────────────────────

updateBtn.addEventListener("click", () => {
  window.clientApi.installUpdate().catch(() => {});
});

communityBtn?.addEventListener("click", () => {
  runButton(communityBtn, () => window.clientApi.openExternal("https://discord.gg/wXFuzxEbfC"))
    .catch((error) => setRuntimeStatus(error.message, true));
});

const BETA_PROMO_DISMISSED_KEY = "stableBetaPromoDismissed-1.2";
if (betaPromo && localStorage.getItem(BETA_PROMO_DISMISSED_KEY) === "true") betaPromo.hidden = true;
betaPromoButton?.addEventListener("click", () => {
  runButton(betaPromoButton, () => window.clientApi.openExternal("https://vrchatadmintools.ru/download-beta"))
    .catch((error) => setRuntimeStatus(error.message, true));
});
betaPromoDismiss?.addEventListener("click", () => {
  localStorage.setItem(BETA_PROMO_DISMISSED_KEY, "true");
  betaPromo.hidden = true;
});

async function importTodayPlayers() {
  const result = await window.clientApi.readTodayPlayers();
  let changed = 0;
  for (const player of result?.players || []) {
    if (rememberKnownPlayer(player, { cache: false })) changed += 1;
  }
  if (changed > 0) cacheKnownPlayers();
  state.adminPlayerPage = 0;
  state.ownerPlayerPage = 0;
  renderAdminTools();
  if (hasOwnerAccess()) renderOwnerTools();
  const playerCount = Array.isArray(result?.players) ? result.players.length : 0;
  const fileCount = Number(result?.fileCount || 0);
  setRuntimeStatus(`За сегодня найдено ${playerCount} игроков в ${fileCount} логах. Каталог сохранён на этом ПК.`);
  return result;
}

chooseFileBtn.addEventListener("click", () => {
  runButton(chooseFileBtn, async () => {
    const result = await window.clientApi.chooseFile();
    if (result.filePath) setFilePath(result.filePath);
  }).catch((error) => setRuntimeStatus(error.message, true));
});

analyzeCurrentBtn.addEventListener("click", () => {
  runButton(analyzeCurrentBtn, async () => {
    const options = await window.clientApi.prepareAnalyzeOptions({ filePath: state.currentFile });
    if (options?.canceled) return null;
    const payload = await window.clientApi.analyzeCurrentInstance({ ...options, filePath: options.filePath || state.currentFile });
    state.tailRunning = Boolean(payload?.followState?.running);
    if (payload?.playSessionId) {
      state.currentPlaySessionId = payload.playSessionId;
      state.currentPlaySessionStartedAt = new Date().toISOString();
      state.playSessionLastSyncAt = 0;
      syncCurrentPlaySession({ force: true }).catch(() => {});
    }
    const snapshot = rememberServerSnapshot(payload?.currentInstance);
    if (snapshot) {
      setRuntimeStatus(`Анализ завершён (${options.sourceLabel}, ${options.loadProfileLabel}). Новые события отслеживаются автоматически. VRChat API показывает онлайн ${snapshot.nUsers}${snapshot.capacity !== null ? `/${snapshot.capacity}` : ""}.`);
    } else if (options) {
      setRuntimeStatus(`Анализ завершён (${options.sourceLabel}, ${options.loadProfileLabel}). Новые события отслеживаются автоматически.`);
    }
    return payload;
  })
    .catch((error) => setRuntimeStatus(error.message, true));
});

copySnapshotBtn?.addEventListener("click", () => {
  runButton(copySnapshotBtn, copySnapshot).catch((error) => setRuntimeStatus(error.message, true));
});

copyAdminSnapshotBtn?.addEventListener("click", () => {
  runButton(copyAdminSnapshotBtn, copySnapshot).catch((error) => setRuntimeStatus(error.message, true));
});

crashToggleBtn?.addEventListener("click", () => {
  if (!state.crashAnalyzerEnabled) {
    const ok = window.confirm(
      "Crash Risk Analyzer — экспериментальная функция.\n\n" +
      "Она отслеживает состояние VRChat и последние события перед возможным сбоем. Возможны ложные срабатывания, поэтому отчёт нельзя использовать как единственное доказательство.\n\n" +
      "На слабых ПК функция может немного увеличить нагрузку.\n\n" +
      "Включить анализатор?"
    );
    if (!ok) return;
    state.crashAnalyzerEnabled = true;
    saveCrashState();
    startCrashAnalyzer();
  } else {
    state.crashAnalyzerEnabled = false;
    saveCrashState();
    stopCrashAnalyzer();
  }
  renderCrashAnalyzer();
});

copyCrashReportBtn?.addEventListener("click", () => {
  runButton(copyCrashReportBtn, async () => {
    await window.clientApi.writeClipboardText(crashReport());
    setRuntimeStatus("Отчёт скопирован");
  }).catch((error) => setRuntimeStatus(error.message, true));
});

clearCrashHistoryBtn?.addEventListener("click", () => {
  const incidentCount = state.crashIncidents.length;
  if (incidentCount === 0) {
    setRuntimeStatus("История Crash Analyzer уже пуста.");
    return;
  }
  const confirmed = window.confirm(
    `Удалить всю историю Crash Analyzer (${incidentCount})?\n\n` +
    "Метки и заметки аватаров, а также текущий буфер наблюдения останутся."
  );
  if (!confirmed) return;
  state.crashIncidents = [];
  saveCrashState();
  renderCrashAnalyzer();
  setRuntimeStatus("История Crash Analyzer очищена.");
});

captureLagBtn?.addEventListener("click", () => {
  runButton(captureLagBtn, captureLagSnapshot)
    .catch((error) => setRuntimeStatus(error.message, true));
});

startBtn.addEventListener("click", () => {
  runButton(startBtn, async () => {
    const stats = currentPlaySessionStats();
    const payload = await window.clientApi.startTail({
      filePath: state.currentFile,
      fromStart: false,
      worldName: stats.worldName
    });
    resetEvents({ clearCrashBuffer: true });
    state.currentPlaySessionId = payload?.playSessionId || "";
    state.currentPlaySessionStartedAt = new Date().toISOString();
    state.playSessionLastSyncAt = 0;
    state.tailRunning = true;
    await refreshServerSnapshot({ force: true, silent: true });
    await syncCurrentPlaySession({ force: true });
    if (state.crashAnalyzerEnabled) startCrashAnalyzer();
  })
    .catch((error) => setRuntimeStatus(error.message, true));
});

stopBtn.addEventListener("click", () => {
  runButton(stopBtn, () => window.clientApi.stopTail(currentPlaySessionStats())).then(() => {
    state.tailRunning = false;
    state.currentPlaySessionId = "";
    state.currentPlaySessionStartedAt = "";
    state.playSessionLastSyncAt = 0;
    renderCrashAnalyzer();
  }).catch((error) => setRuntimeStatus(error.message, true));
});

logoutBtn.addEventListener("click", () => {
  runButton(logoutBtn, async () => {
    await window.clientApi.logout();
    stopTeamSyncPolling();
    clearTeamScope();
    state.license = null;
    state.moderationRequests = [];
    state.groupManagementRequests = [];
    state.groupMembers = [];
    state.groupRoles = [];
    state.ownerSelectedUserId = "";
    stopModerationTimer();
    syncOwnerAccess();
    state.currentPlaySessionId = "";
    state.currentPlaySessionStartedAt = "";
    state.playSessionLastSyncAt = 0;
    showActivation();
    setActivationStatus("Сессия закрыта");
  }).catch((error) => setRuntimeStatus(error.message, true));
});

// ── Дашборд ──────────────────────────────────────────────────────────────────

const dashOnline = document.querySelector("#dashOnline");
const dashPeak = document.querySelector("#dashPeak");
const dashTotal = document.querySelector("#dashTotal");
const dashWorld = document.querySelector("#dashWorld");
const dashChart = document.querySelector("#dashChart");
const dashRecentList = document.querySelector("#dashRecentList");
const dashPeriod = document.querySelector(".dashPeriod");

function isWorldEvent(event) {
  return event.type === "world-entering" || event.type === "world-joining" || event.type === "world-joined";
}

function currentWorldEvent(events = state.events) {
  return [...events].reverse().find((event) => isWorldEvent(event)) || null;
}

function currentWorldStartIndex(events = state.events) {
  let latestWorldIndex = -1;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (!isWorldEvent(events[index])) continue;
    latestWorldIndex = index;
    break;
  }
  if (latestWorldIndex < 0) return 0;
  for (let index = latestWorldIndex; index >= 0; index -= 1) {
    if (events[index]?.type === "world-entering") return index;
    if (index < latestWorldIndex && events[index]?.type === "world-joined") break;
  }
  return latestWorldIndex;
}

function currentWorldEvents() {
  // A new world transition is a safer boundary than carrying users from the prior instance.
  return state.events.slice(currentWorldStartIndex());
}

function computePlayerStats(events) {
  const latestByUser = new Map();
  const uniqueJoins = new Map();
  let currentOnline = 0;
  let peakOnline = 0;

  for (const event of events) {
    if (!event.userId) continue;

    if (event.type === "player-joined") {
      if (!uniqueJoins.has(event.userId)) uniqueJoins.set(event.userId, event);
      if (latestByUser.get(event.userId)?.type !== "player-joined") {
        currentOnline += 1;
      }
      latestByUser.set(event.userId, event);
      peakOnline = Math.max(peakOnline, currentOnline);
    } else if (event.type === "player-left") {
      if (latestByUser.get(event.userId)?.type === "player-joined") {
        currentOnline = Math.max(0, currentOnline - 1);
      }
      latestByUser.set(event.userId, event);
    }
  }

  const online = [...latestByUser.values()].filter((event) => event.type === "player-joined");
  return { onlineNow: online.length, peakOnline, uniqueJoins, online };
}

function eventTimestampMs(event) {
  if (!event?.timestamp) return null;
  const value = new Date(event.timestamp).getTime();
  return Number.isFinite(value) ? value : null;
}

function buildOnlineSeries(events) {
  const now = Date.now();
  const emptyResult = { points: new Array(48).fill(0), rangeStart: now - 3600000, rangeEnd: now };
  const playerEvents = events
    .filter((event) => event.userId && (event.type === "player-joined" || event.type === "player-left"))
    .map((event) => ({ ...event, timeMs: eventTimestampMs(event) }))
    .filter((event) => event.timeMs !== null)
    .sort((a, b) => a.timeMs - b.timeMs);

  if (playerEvents.length === 0) return emptyResult;

  const firstTs = playerEvents[0].timeMs;
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;
  const rangeStart = Math.max(dayAgo, Math.min(firstTs, oneHourAgo));
  const rangeEnd = now;
  const sampleCount = 48;
  const stepMs = (rangeEnd - rangeStart) / (sampleCount - 1);
  const onlineUsers = new Set();
  const points = [];
  let eventIndex = 0;

  while (eventIndex < playerEvents.length && playerEvents[eventIndex].timeMs <= rangeStart) {
    const event = playerEvents[eventIndex];
    if (event.type === "player-joined") onlineUsers.add(event.userId);
    if (event.type === "player-left") onlineUsers.delete(event.userId);
    eventIndex++;
  }

  for (let i = 0; i < sampleCount; i++) {
    const sampleTs = i === sampleCount - 1 ? rangeEnd : rangeStart + stepMs * i;
    while (eventIndex < playerEvents.length && playerEvents[eventIndex].timeMs <= sampleTs) {
      const event = playerEvents[eventIndex];
      if (event.type === "player-joined") onlineUsers.add(event.userId);
      if (event.type === "player-left") onlineUsers.delete(event.userId);
      eventIndex++;
    }
    points.push(onlineUsers.size);
  }

  return { points, rangeStart, rangeEnd };
}

function drawDashChart(points, rangeStart, rangeEnd) {
  const dpr = window.devicePixelRatio || 1;
  const wrap = dashChart.parentElement;
  const rect = wrap.getBoundingClientRect();
  const W = rect.width > 0 ? Math.floor(rect.width - 24) : 600; // 24 = padding*2
  const H = 160;

  dashChart.width = Math.round(W * dpr);
  dashChart.height = Math.round(H * dpr);
  dashChart.style.width = W + "px";
  dashChart.style.height = H + "px";

  const ctx = dashChart.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // сброс + scale за один вызов
  ctx.clearRect(0, 0, W, H);

  const max = Math.max(...points, 1);
  const pad = { top: 16, right: 12, bottom: 28, left: 32 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const stepW = chartW / Math.max(points.length - 1, 1);

  // Цвета из CSS-переменных
  const style = getComputedStyle(document.documentElement);
  const accentColor = style.getPropertyValue("--accent").trim() || "#4ade80";
  const mutedColor = style.getPropertyValue("--muted").trim() || "#666";
  const borderColor = style.getPropertyValue("--border").trim() || "#333";

  // Горизонтальные линии сетки
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + chartH - (i / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillStyle = mutedColor;
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(String(Math.round((i / 4) * max)), pad.left - 4, y + 3);
  }

  const toPoint = (value, index) => ({
    x: pad.left + stepW * index,
    y: pad.top + chartH - (value / max) * chartH
  });

  if (points.length > 0) {
    const drawSteppedPath = () => {
      points.forEach((value, index) => {
        const point = toPoint(value, index);
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
          return;
        }
        const previous = toPoint(points[index - 1], index - 1);
        ctx.lineTo(point.x, previous.y);
        ctx.lineTo(point.x, point.y);
      });
    };
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, accentColor + "66");
    grad.addColorStop(1, accentColor + "08");

    ctx.beginPath();
    drawSteppedPath();
    ctx.lineTo(pad.left + chartW, pad.top + chartH);
    ctx.lineTo(pad.left, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    drawSteppedPath();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    const last = toPoint(points[points.length - 1], points.length - 1);
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let h = 0; h <= 4; h++) {
    const x = pad.left + (chartW / 4) * h;
    const labelTs = rangeStart + (h / 4) * (rangeEnd - rangeStart);
    const labelDate = new Date(labelTs);
    const label = labelDate.getHours().toString().padStart(2, "0") + ":" + labelDate.getMinutes().toString().padStart(2, "0");
    ctx.fillStyle = mutedColor;
    ctx.font = "10px sans-serif";
    ctx.textAlign = h === 0 ? "left" : h === 4 ? "right" : "center";
    ctx.fillText(label, x, H - 6);
  }
}

function setDiagnosticValue(element, text, status = "") {
  if (!element) return;
  element.textContent = text;
  if (status) element.dataset.state = status;
  else delete element.dataset.state;
}

function relativeAge(value) {
  const timestamp = new Date(value || 0).getTime();
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "Нет данных";
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 10) return "Только что";
  if (seconds < 60) return `${seconds} сек. назад`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин. назад`;
  return `${Math.floor(minutes / 60)} ч. назад`;
}

function renderDiagnostics() {
  setDiagnosticValue(diagTail, state.tailRunning ? "Активно" : "Остановлено", state.tailRunning ? "ok" : "warn");
  setDiagnosticValue(diagLastEvent, relativeAge(state.lastEventAt), state.lastEventAt ? "ok" : "warn");
  const syncReady = state.playerNotesReady && state.avatarNotesReady && state.avatarCatalogReady &&
    state.globalPlayerNotesReady && state.globalAvatarNotesReady;
  const syncText = syncReady ? `Работает · ${relativeAge(state.lastSyncAt)}` : state.lastSyncError || "Локальный кэш";
  setDiagnosticValue(diagSync, syncText, syncReady ? "ok" : "warn");
  const apiSnapshot = activeServerSnapshot();
  setDiagnosticValue(diagApi, apiSnapshot ? `Доступен · ${apiSnapshot.nUsers} онлайн` : "Нет свежих данных", apiSnapshot ? "ok" : "warn");
  setDiagnosticValue(diagMemory, `${state.events.length} / 5000`, state.events.length >= 4500 ? "warn" : "ok");
  if (diagnosticsUpdatedAt) diagnosticsUpdatedAt.textContent = `Обновлено ${new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
}

function renderDashboard() {
  refreshServerSnapshot({ silent: true }).catch(() => {});
  const worldEvents = currentWorldEvents();
  const playerStats = computePlayerStats(worldEvents);
  const serverSnapshot = activeServerSnapshot();

  const chartData = serverSnapshot
    ? buildServerOnlineSeries(currentServerSamples(serverSnapshot))
    : buildOnlineSeries(worldEvents);
  const { points, rangeStart, rangeEnd } = chartData;
  const onlineNow = serverSnapshot?.nUsers ?? playerStats.onlineNow;
  const peak = serverSnapshot
    ? Math.max(onlineNow, ...points)
    : Math.max(playerStats.peakOnline, ...points);

  // Текущий мир
  const worldEvent = currentWorldEvent(worldEvents);
  const currentWorld = serverSnapshot?.worldName || worldEvent?.worldName || worldEvent?.worldId || worldEvent?.instance || "-";

  // Обновляем карточки
  dashOnline.textContent = String(onlineNow);
  dashOnline.title = serverSnapshot ? "По VRChat API" : "По событиям лога";
  dashPeak.textContent = String(peak);
  dashTotal.textContent = String(playerStats.uniqueJoins.size);
  dashWorld.textContent = currentWorld.length > 24 ? currentWorld.slice(0, 22) + "…" : currentWorld;
  dashWorld.title = currentWorld;
  if (dashPeriod) {
    dashPeriod.textContent = serverSnapshot ? "Онлайн по VRChat API" : "Онлайн по событиям лога";
  }

  // График
  drawDashChart(points, rangeStart, rangeEnd);
  renderDiagnostics();

  // Последние 10 игроков
  const recent = [...playerStats.online].slice(-10).reverse();
  if (recent.length === 0) {
    dashRecentList.innerHTML = `<div class="emptyState">Нет игроков в текущем мире</div>`;
  } else {
    dashRecentList.innerHTML = `
      <div class="dashRecentHeader">Последние игроки</div>
      ${recent.map((e) => {
        const profile = e.userId ? state.profiles.get(e.userId) : null;
        const name = profile?.displayName || e.playerName || e.userId || "-";
        const time = e.timestamp ? new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(e.timestamp)) : "";
        return `<div class="dashRecentRow">
          <span class="dashRecentName">${escapeHtml(name)}</span>
          <span class="dashRecentTime">${escapeHtml(time)}</span>
          ${e.userId ? playerProfileButton(e.userId, name) : ""}
        </div>`;
      }).join("")}
    `;
  }
}

// История сессий

function currentPlaySessionStats() {
  const parts = partitionEvents();
  const worldEvents = currentWorldEvents();
  const playerStats = computePlayerStats(state.events);
  const worldEvent = currentWorldEvent(worldEvents);
  const players = [...playerStats.uniqueJoins.entries()].slice(0, 250).map(([userId, event]) => ({
    userId,
    displayName: displayName(event),
    status: playerRecord(userId).status
  }));
  return {
    playerCount: playerStats.uniqueJoins.size,
    avatarCount: parts.avatars.length,
    eventCount: state.events.length,
    worldName: worldEvent?.worldName || worldEvent?.worldId || worldEvent?.instance || null,
    snapshot: { players }
  };
}

async function syncCurrentPlaySession(options = {}) {
  const { force = false } = options;
  if (!state.tailRunning || !state.currentPlaySessionId || !window.clientApi.updatePlaySession) return;
  const now = Date.now();
  if (!force && now - state.playSessionLastSyncAt < 15_000) return;
  if (state.playSessionSyncInFlight) return;

  state.playSessionSyncInFlight = true;
  try {
    await window.clientApi.updatePlaySession(currentPlaySessionStats());
    state.playSessionLastSyncAt = now;
  } finally {
    state.playSessionSyncInFlight = false;
  }
}

function formatDuration(startedAt, endedAt) {
  if (!endedAt) return "в процессе";
  const ms = new Date(endedAt) - new Date(startedAt);
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} ч ${mins} мин`;
}

function sessionValue(session, snakeKey, camelKey, fallback = "") {
  return session?.[snakeKey] ?? session?.[camelKey] ?? fallback;
}

function withLiveSessionStats(sessions) {
  const list = Array.isArray(sessions) ? [...sessions] : [];
  if (!state.tailRunning || !state.currentPlaySessionStartedAt) return list;

  const stats = currentPlaySessionStats();
  const livePatch = {
    id: state.currentPlaySessionId || "local-active-session",
    started_at: state.currentPlaySessionStartedAt,
    ended_at: null,
    world_name: stats.worldName,
    player_count: stats.playerCount,
    avatar_count: stats.avatarCount,
    event_count: stats.eventCount,
    snapshot: stats.snapshot
  };
  const index = list.findIndex((session) => session.id === livePatch.id);
  if (index >= 0) {
    list[index] = { ...list[index], ...livePatch };
  } else {
    list.unshift(livePatch);
  }
  return list;
}

function sessionSnapshot(session) {
  const raw = sessionValue(session, "snapshot", "snapshot", {});
  if (raw && typeof raw === "object") return raw;
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

function localDateValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function selectedMyVrchatDays() {
  return myVrchatPeriod?.value === "all" ? null : Number(myVrchatPeriod?.value || 30);
}

function myVrchatPeriodLabel() {
  return String(myVrchatPeriod?.selectedOptions?.[0]?.textContent || "30 дней").toLowerCase();
}

function currentMyVrchatInsights() {
  return window.myVrchatInsights.buildMyVrchatInsights(
    withLiveSessionStats(state.historySessions),
    { days: selectedMyVrchatDays() }
  );
}

function renderMyVrchat() {
  if (!myVrchatContent) return;
  const insights = currentMyVrchatInsights();
  if (insights.sessionCount === 0) {
    myVrchatContent.innerHTML = `<div class="emptyState">За выбранный период сохранённых сессий нет</div>`;
    return;
  }

  const recurringPlayers = insights.topPlayers.filter((player) => player.sessions > 1).slice(0, 6);
  const recurringHtml = recurringPlayers.length > 0
    ? recurringPlayers.map((player) => `
      <button class="myVrchatEncounter" data-url="https://vrchat.com/home/user/${encodeURIComponent(player.userId)}">
        <span>${escapeHtml(player.displayName || player.userId)}</span>
        <strong>${player.sessions} ${player.sessions === 2 ? "встречи" : "встреч"}</strong>
      </button>`).join("")
    : `<div class="emptyState">Повторных встреч пока нет</div>`;
  const worldsHtml = insights.topWorlds.length > 0
    ? insights.topWorlds.map((world) => `
      <div class="myVrchatWorldRow">
        <span>${escapeHtml(world.worldName)}</span>
        <strong>${world.sessions}</strong>
      </div>`).join("")
    : `<div class="emptyState">Миры пока не записаны</div>`;

  myVrchatContent.innerHTML = `
    <div class="myVrchatStats">
      <div><strong>${insights.sessionCount}</strong><span>Сессий</span></div>
      <div><strong>${escapeHtml(window.myVrchatInsights.formatInsightDuration(insights.totalDurationMs))}</strong><span>В VRChat</span></div>
      <div><strong>${insights.worldCount}</strong><span>Миров</span></div>
      <div><strong>${insights.uniquePlayerCount}</strong><span>Уникальных игроков</span></div>
      <div><strong>${insights.recurringPlayerCount}</strong><span>Повторных встреч</span></div>
      <div><strong>${insights.totalEncounters}</strong><span>Всего встреч в сессиях</span></div>
    </div>
    <div class="myVrchatColumns">
      <section class="myVrchatCard">
        <header><h3>Чаще встречались</h3><span>Открывает профиль VRChat</span></header>
        <div class="myVrchatEncounterList">${recurringHtml}</div>
      </section>
      <section class="myVrchatCard">
        <header><h3>Чаще записанные миры</h3><span>По сохранённым сессиям</span></header>
        <div class="myVrchatWorldList">${worldsHtml}</div>
      </section>
    </div>
    <p class="myVrchatPrivacy">Статистика строится только по последним 200 сессиям этой лицензии на текущем устройстве. Она не читает друзей, голос или личные сообщения VRChat.</p>`;
}

async function loadMyVrchat() {
  if (!myVrchatContent) return;
  myVrchatContent.innerHTML = `<div class="emptyState">Собираем статистику...</div>`;
  try {
    await syncCurrentPlaySession({ force: true });
    state.historySessions = await window.clientApi.listPlaySessions();
    renderMyVrchat();
  } catch (error) {
    myVrchatContent.innerHTML = `<div class="emptyState" style="color:#ffb1a8">${escapeHtml(error.message)}</div>`;
  }
}

function filteredHistorySessions(sessions) {
  const query = state.historyFilters.search.trim().toLowerCase();
  return withLiveSessionStats(sessions).filter((session) => {
    const endedAt = sessionValue(session, "ended_at", "endedAt", null);
    if (state.historyFilters.state === "active" && endedAt) return false;
    if (state.historyFilters.state === "ended" && !endedAt) return false;
    if (state.historyFilters.date && localDateValue(sessionValue(session, "started_at", "startedAt")) !== state.historyFilters.date) return false;
    if (!query) return true;
    const snapshot = sessionSnapshot(session);
    const playerText = (Array.isArray(snapshot.players) ? snapshot.players : [])
      .map((player) => `${player.displayName || ""} ${player.userId || ""} ${player.status || ""}`)
      .join(" ");
    const world = sessionValue(session, "world_name", "worldName", "");
    return `${world} ${playerText}`.toLowerCase().includes(query);
  });
}

function historyPlayersHtml(session) {
  const players = Array.isArray(sessionSnapshot(session).players) ? sessionSnapshot(session).players : [];
  if (players.length === 0) return "";
  return `<details class="historyPlayers">
    <summary>Участники сессии: ${players.length}</summary>
    <div class="historyPlayerList">
      ${players.map((player) => {
        const name = player.displayName || player.userId || "Неизвестный игрок";
        const action = player.userId
          ? playerProfileButton(player.userId, name, { label: name, className: "historyPlayerLink" })
          : `<b>${escapeHtml(name)}</b>`;
        return `<span title="${escapeHtml(player.userId || "")}">${action}<em>${escapeHtml(player.status || "ok")}</em></span>`;
      }).join("")}
    </div>
  </details>`;
}

function renderHistory(sessions = state.historySessions) {
  const rows = filteredHistorySessions(sessions);
  if (!rows || rows.length === 0) {
    historyList.innerHTML = `<div class="emptyState">Сессии по заданным условиям не найдены</div>`;
    return;
  }
  historyList.innerHTML = rows.map((s) => {
    const startedAt = sessionValue(s, "started_at", "startedAt");
    const endedAt = sessionValue(s, "ended_at", "endedAt", null);
    const date = new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }).format(new Date(startedAt));
    const duration = formatDuration(startedAt, endedAt);
    const world = escapeHtml(sessionValue(s, "world_name", "worldName") || "Неизвестный мир");
    const playerCount = Number(sessionValue(s, "player_count", "playerCount", 0));
    const avatarCount = Number(sessionValue(s, "avatar_count", "avatarCount", 0));
    const eventCount = Number(sessionValue(s, "event_count", "eventCount", 0));
    return `
      <div class="historyRow">
        <div class="historyMain">
          <span class="historyWorld">${world}</span>
          <span class="historyDate">${escapeHtml(date)}</span>
        </div>
        <div class="historyMeta">
          <span>Длительность: ${escapeHtml(duration)}</span>
          <span>Игроки: ${playerCount}</span>
          <span>Аватары: ${avatarCount}</span>
          <span>События: ${eventCount}</span>
        </div>
        ${historyPlayersHtml(s)}
      </div>
    `;
  }).join("");
}

async function loadHistory() {
  historyList.innerHTML = `<div class="emptyState">Загрузка...</div>`;
  try {
    await syncCurrentPlaySession({ force: true });
    state.historySessions = await window.clientApi.listPlaySessions();
    renderHistory();
  } catch (error) {
    historyList.innerHTML = `<div class="emptyState" style="color:#ffb1a8">${escapeHtml(error.message)}</div>`;
  }
}

refreshHistoryBtn.addEventListener("click", () => loadHistory());

refreshMyVrchatBtn?.addEventListener("click", () => {
  runButton(refreshMyVrchatBtn, loadMyVrchat).catch((error) => setRuntimeStatus(error.message, true));
});

myVrchatPeriod?.addEventListener("change", () => renderMyVrchat());

copyMyVrchatBtn?.addEventListener("click", () => {
  runButton(copyMyVrchatBtn, async () => {
    const recap = window.myVrchatInsights.buildMyVrchatRecap(currentMyVrchatInsights(), myVrchatPeriodLabel());
    await window.clientApi.writeClipboardText(recap);
    setRuntimeStatus("Итог «Мой VRChat» скопирован");
  }).catch((error) => setRuntimeStatus(error.message, true));
});

historySearch?.addEventListener("input", () => {
  state.historyFilters.search = historySearch.value;
  renderHistory();
});

historyDate?.addEventListener("change", () => {
  state.historyFilters.date = historyDate.value;
  renderHistory();
});

historyState?.addEventListener("change", () => {
  state.historyFilters.state = historyState.value;
  renderHistory();
});

historyResetBtn?.addEventListener("click", () => {
  state.historyFilters = { search: "", date: "", state: "all" };
  historySearch.value = "";
  historyDate.value = "";
  historyState.value = "all";
  renderHistory();
});

// ── Поиск ──────────────────────────────────────────────────────────────────

document.querySelectorAll(".searchInput").forEach((input) => {
  input.addEventListener("input", () => {
    const key = input.dataset.search;
    if (key in state.search) {
      state.search[key] = input.value;
      render();
    }
  });
});

// ── Вкладки ──────────────────────────────────────────────────────────────────

let dashboardTimer = null;
let moderationTimer = null;

function startDashboardTimer() {
  if (dashboardTimer) return;
  dashboardTimer = setInterval(() => renderWhenVisible(renderDashboard), 5000);
}

function stopDashboardTimer() {
  if (dashboardTimer) clearInterval(dashboardTimer);
  dashboardTimer = null;
}

function startModerationTimer() {
  if (moderationTimer || !hasOwnerAccess()) return;
  moderationTimer = setInterval(() => {
    loadModerationRequests({ silent: true }).catch(() => {});
    loadGroupManagementRequests({ silent: true }).catch(() => {});
  }, 10000);
}

function stopModerationTimer() {
  if (moderationTimer) clearInterval(moderationTimer);
  moderationTimer = null;
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;
    tabs.forEach((item) => item.classList.toggle("active", item === tab));
    panes.forEach((pane) => pane.classList.toggle("active", pane.dataset.pane === target));
    if (target === "history") loadHistory();
    if (target === "insights") loadMyVrchat();
    if (target === "admin") {
      loadGlobalPlayerNotes({ force: true, silent: true }).catch(() => {});
      loadGlobalAvatarNotes({ force: true, silent: true }).catch(() => {});
      if (state.selectedUserId) loadPlayerNoteHistory(state.selectedUserId, { silent: true }).catch(() => {});
    }
    if (target === "owner") {
      renderOwnerTools();
      loadModerationRequests({ silent: true }).catch(() => {});
      loadGroupManagementRequests({ silent: true }).catch(() => {});
      startModerationTimer();
    } else {
      stopModerationTimer();
    }
    if (target === "dashboard") {
      renderDashboard();
      startDashboardTimer();
    } else {
      stopDashboardTimer();
      if (target !== "history") render();
    }
  });
});

builderLayout.addEventListener("change", () => {
  state.builderLayout = builderLayout.value;
  saveBuilder();
  renderBuilder(builderParts(), { force: true });
});

// ── Builder: кнопка добавления блоков ────────────────────────────────────────

function syncBuilderPickerCheckboxes() {
  builderVisPlayers.checked = state.builderVisible.includes("players");
  builderVisAvatars.checked = state.builderVisible.includes("avatars");
  builderVisPortals.checked = state.builderVisible.includes("portals");
  builderVisWorlds.checked = state.builderVisible.includes("worlds");
  builderVisAdmin.checked = state.builderVisible.includes("admin");
}

builderAddBlockBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  const isHidden = builderBlockPicker.hidden;
  builderBlockPicker.hidden = !isHidden;
  if (!isHidden) return;
  syncBuilderPickerCheckboxes();
});

function bindBuilderVisibilityToggle(input, kind) {
  input.addEventListener("change", () => {
    if (input.checked) {
      if (!state.builderVisible.includes(kind)) state.builderVisible.push(kind);
      if (!state.builderOrder.includes(kind)) state.builderOrder.push(kind);
    } else {
      state.builderVisible = state.builderVisible.filter((value) => value !== kind);
    }
    saveBuilder();
    renderBuilder(builderParts(), { force: true });
  });
}

bindBuilderVisibilityToggle(builderVisPlayers, "players");
bindBuilderVisibilityToggle(builderVisAvatars, "avatars");
bindBuilderVisibilityToggle(builderVisPortals, "portals");
bindBuilderVisibilityToggle(builderVisWorlds, "worlds");
bindBuilderVisibilityToggle(builderVisAdmin, "admin");

function syncWindowControlButtons() {
  alwaysOnTopBtn.classList.toggle("active", state.alwaysOnTop);
  alwaysOnTopBtn.setAttribute("aria-pressed", String(state.alwaysOnTop));
  alwaysOnTopBtn.title = state.alwaysOnTop ? "Открепить окно от верхнего слоя" : "Закрепить окно поверх остальных";
  windowOpacityControl.hidden = !state.alwaysOnTop;
  windowOpacityRange.disabled = !state.alwaysOnTop;
  windowOpacityRange.value = String(state.windowOpacity);
  windowOpacityValue.textContent = `${state.windowOpacity}%`;
  compactModeBtn.classList.toggle("active", state.compactMode);
  compactModeBtn.setAttribute("aria-pressed", String(state.compactMode));
  compactModeBtn.textContent = state.compactMode ? "Обычный вид" : "Компактно";
}

alwaysOnTopBtn.addEventListener("click", async () => {
  alwaysOnTopBtn.disabled = true;
  try {
    const result = await window.clientApi.setAlwaysOnTop(!state.alwaysOnTop, state.windowOpacity / 100);
    state.alwaysOnTop = Boolean(result.enabled);
    localStorage.setItem("alwaysOnTop", String(state.alwaysOnTop));
    syncWindowControlButtons();
  } finally {
    alwaysOnTopBtn.disabled = false;
  }
});

windowOpacityRange.addEventListener("input", () => {
  state.windowOpacity = normalizeWindowOpacityPercent(windowOpacityRange.value);
  localStorage.setItem("windowOpacity", String(state.windowOpacity));
  windowOpacityValue.textContent = `${state.windowOpacity}%`;
  void window.clientApi.setWindowOpacity(state.windowOpacity / 100).catch((error) => {
    setRuntimeStatus(error.message, true);
  });
});

compactModeBtn.addEventListener("click", async () => {
  compactModeBtn.disabled = true;
  const next = !state.compactMode;
  try {
    const result = await window.clientApi.setCompactMode(next);
    state.compactMode = Boolean(result.enabled);
    document.documentElement.classList.toggle("compactMode", state.compactMode);
    document.body.classList.toggle("compactMode", state.compactMode);
    syncWindowControlButtons();
    renderBuilder(builderParts(), { force: true });
  } finally {
    compactModeBtn.disabled = false;
  }
});

document.addEventListener("click", (event) => {
  if (!builderBlockPicker.hidden && !builderBlockPicker.contains(event.target) && event.target !== builderAddBlockBtn) {
    builderBlockPicker.hidden = true;
  }
});

let draggedKind = null;

builderGrid.addEventListener("dragstart", (event) => {
  const handle = event.target.closest(".builderDragHandle");
  if (!handle) return;
  const block = handle.closest(".builderBlock");
  if (!block) return;
  draggedKind = block.dataset.kind;
  block.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
});

builderGrid.addEventListener("dragend", (event) => {
  const handle = event.target.closest(".builderDragHandle");
  const block = handle ? handle.closest(".builderBlock") : event.target.closest(".builderBlock");
  block?.classList.remove("dragging");
  draggedKind = null; // Сброс состояния после завершения drag
});

builderGrid.addEventListener("dragover", (event) => {
  if (draggedKind) event.preventDefault();
});

builderGrid.addEventListener("drop", (event) => {
  event.preventDefault();
  const target = event.target.closest(".builderBlock");
  if (!target || !draggedKind || target.dataset.kind === draggedKind) return;
  const nextOrder = state.builderOrder.filter((kind) => kind !== draggedKind);
  const targetIndex = nextOrder.indexOf(target.dataset.kind);
  // Защита от некорректного индекса
  if (targetIndex === -1) {
    draggedKind = null;
    return;
  }
  nextOrder.splice(targetIndex, 0, draggedKind);
  state.builderOrder = nextOrder;
  draggedKind = null;
  saveBuilder();
  renderBuilder(builderParts(), { force: true });
});

document.addEventListener("click", (event) => {
  const playerButton = event.target.closest("button[data-player-profile-user-id]");
  if (playerButton) {
    openPlayerAction(playerButton.dataset.playerProfileUserId, playerButton.dataset.playerProfileName);
    return;
  }
  const button = event.target.closest("button[data-url]");
  if (!button) return;
  window.clientApi.openExternal(button.dataset.url);
});

playerActionCloseBtn?.addEventListener("click", closePlayerActionDialog);
playerActionDialog?.addEventListener("close", () => {
  state.playerActionTarget = null;
});
playerActionOwnerBtn?.addEventListener("click", () => {
  const target = state.playerActionTarget;
  if (!target) return;
  openPlayerInOwner(target.userId, target.displayName);
});
playerActionProfileBtn?.addEventListener("click", () => {
  const target = state.playerActionTarget;
  if (!target) return;
  window.clientApi.openExternal(playerProfileUrl(target.userId));
  closePlayerActionDialog();
});

adminPlayerSearch?.addEventListener("input", () => {
  state.adminSearch = adminPlayerSearch.value;
  state.adminPlayerPage = 0;
  renderAdminTools();
});

adminOnlineFilter?.addEventListener("change", () => {
  state.adminOnlineFilter = adminOnlineFilter.value === "online" ? "online" : "all";
  state.adminPlayerPage = 0;
  localStorage.setItem("adminOnlineFilter", state.adminOnlineFilter);
  renderAdminTools();
});

adminReadTodayPlayersBtn?.addEventListener("click", () => {
  runButton(adminReadTodayPlayersBtn, importTodayPlayers)
    .catch((error) => setRuntimeStatus(error.message, true));
});

adminPlayerList?.addEventListener("click", (event) => {
  const pageButton = event.target.closest("[data-admin-list-page]");
  if (pageButton) {
    state.adminPlayerPage += pageButton.dataset.adminListPage === "previous" ? -1 : 1;
    renderAdminTools();
    adminPlayerList.scrollTop = 0;
    return;
  }
  const item = event.target.closest("[data-user-id]");
  if (!item) return;
  state.selectedUserId = item.dataset.userId;
  renderAdminTools();
  loadPlayerNoteHistory(state.selectedUserId, { silent: true }).catch(() => {});
});

adminPlayerCard?.addEventListener("click", (event) => {
  if (!event.target.closest("[data-clear-admin-selection]")) return;
  state.selectedUserId = "";
  renderAdminTools();
});

ownerPlayerSearch?.addEventListener("input", () => {
  state.ownerSearch = ownerPlayerSearch.value;
  state.ownerPlayerPage = 0;
  renderOwnerTools();
});

ownerOnlineFilter?.addEventListener("change", () => {
  state.ownerOnlineFilter = ownerOnlineFilter.value === "online" ? "online" : "all";
  state.ownerPlayerPage = 0;
  localStorage.setItem("ownerOnlineFilter", state.ownerOnlineFilter);
  renderOwnerTools();
});

ownerReadTodayPlayersBtn?.addEventListener("click", () => {
  runButton(ownerReadTodayPlayersBtn, async () => {
    await importTodayPlayers();
    state.ownerSource = "logs";
    if (ownerSourceSelect) ownerSourceSelect.value = "logs";
    renderOwnerTools();
  }).catch((error) => setRuntimeStatus(error.message, true));
});

ownerSourceSelect?.addEventListener("change", () => {
  if (ownerSourceSelect.value === "group" && !canViewGroupMembers()) {
    ownerSourceSelect.value = "logs";
  }
  state.ownerSource = ownerSourceSelect.value === "logs" ? "logs" : "group";
  state.ownerPlayerPage = 0;
  state.ownerSelectedUserId = "";
  renderOwnerTools();
});

ownerGroupSearchBtn?.addEventListener("click", () => {
  if (!canViewGroupMembers()) return;
  state.ownerSource = "group";
  if (ownerSourceSelect) ownerSourceSelect.value = "group";
  runButton(ownerGroupSearchBtn, requestOwnerGroupMembers)
    .catch((error) => setRuntimeStatus(groupManagementError(error), true));
});

ownerPlayerSearch?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  ownerGroupSearchBtn?.click();
});

ownerPlayerList?.addEventListener("click", (event) => {
  const localPageButton = event.target.closest("[data-owner-list-page]");
  if (localPageButton) {
    state.ownerPlayerPage += localPageButton.dataset.ownerListPage === "previous" ? -1 : 1;
    renderOwnerTools();
    ownerPlayerList.scrollTop = 0;
    return;
  }
  const pageButton = event.target.closest("[data-group-page]");
  if (pageButton) {
    const direction = pageButton.dataset.groupPage === "previous" ? -1 : 1;
    const offset = Math.max(0, state.groupMembersOffset + direction * state.groupMembersLimit);
    runButton(pageButton, () => submitGroupManagement({
      action: "list_members",
      query: state.groupMembersQuery,
      offset,
      limit: state.groupMembersLimit
    }, "Страница участников добавлена в очередь."))
      .catch((error) => setRuntimeStatus(groupManagementError(error), true));
    return;
  }
  const item = event.target.closest("[data-owner-user-id]");
  if (!item) return;
  state.ownerSelectedUserId = item.dataset.ownerUserId;
  renderOwnerTools();
  loadPlayerNoteHistory(state.ownerSelectedUserId, { silent: true }).catch(() => {});
});

ownerPlayerCard?.addEventListener("click", (event) => {
  if (event.target.closest("[data-clear-owner-selection]")) {
    state.ownerSelectedUserId = "";
    renderOwnerTools();
    return;
  }
  const retryButton = event.target.closest("[data-retry-moderation]");
  if (retryButton) {
    runButton(retryButton, async () => {
      await window.clientApi.retryGroupBanRequest(retryButton.dataset.retryModeration);
      await loadModerationRequests({ silent: true });
      renderOwnerTools();
      setRuntimeStatus("Операция повторно добавлена в очередь.");
    }).catch((error) => setRuntimeStatus(moderationRequestError(error), true));
    return;
  }
  const editor = event.target.closest("[data-owner-player]");
  if (!editor) return;
  const userId = editor.dataset.ownerPlayer;
  const member = groupMemberById(userId);
  const memberName = member?.displayName || userId;
  if (event.target.closest("[data-group-member-check]")) {
    runButton(event.target.closest("[data-group-member-check]"), () => submitGroupManagement({
      action: "get_member",
      targetUserId: userId,
      targetDisplayName: memberName
    }, "Повторная проверка членства добавлена в очередь."))
      .catch((error) => setRuntimeStatus(groupManagementError(error), true));
    return;
  }
  const notesButton = event.target.closest("[data-group-member-notes-save]");
  if (notesButton) {
    const managerNotes = editor.querySelector("[data-group-manager-notes]")?.value || "";
    if (!window.confirm(`Сохранить заметки управляющих для ${memberName}?`)) return;
    runButton(notesButton, () => submitGroupManagement({
      action: "update_member",
      targetUserId: userId,
      targetDisplayName: memberName,
      managerNotes
    }, "Сохранение заметок добавлено в очередь."))
      .catch((error) => setRuntimeStatus(groupManagementError(error), true));
    return;
  }
  const addRoleButton = event.target.closest("[data-group-role-add]");
  const removeRoleButton = event.target.closest("[data-group-role-remove]");
  const roleButton = addRoleButton || removeRoleButton;
  if (roleButton) {
    const roleId = addRoleButton?.dataset.groupRoleAdd || removeRoleButton?.dataset.groupRoleRemove;
    const roleName = roleButton.dataset.groupRoleName || roleId;
    const action = addRoleButton ? "add_role" : "remove_role";
    const verb = addRoleButton ? "выдать" : "отозвать";
    if (!window.confirm(`${verb === "выдать" ? "Выдать" : "Отозвать"} роль «${roleName}» у ${memberName}? Проверьте профиль перед подтверждением.`)) {
      return;
    }
    runButton(roleButton, () => submitGroupManagement({
      action,
      targetUserId: userId,
      targetDisplayName: memberName,
      roleId,
      roleName
    }, `Операция «${verb} ${roleName}» добавлена в очередь.`))
      .catch((error) => setRuntimeStatus(groupManagementError(error), true));
    return;
  }
  const kickButton = event.target.closest("[data-group-member-kick]");
  if (kickButton) {
    if (!window.confirm(`Исключить ${memberName} из VRChat-группы? Пользователь сможет вступить снова, если настройки группы это разрешают.`)) {
      return;
    }
    runButton(kickButton, () => submitGroupManagement({
      action: "kick_member",
      targetUserId: userId,
      targetDisplayName: memberName
    }, "Исключение участника добавлено в очередь."))
      .catch((error) => setRuntimeStatus(groupManagementError(error), true));
    return;
  }
  if (event.target.closest("[data-copy-owner-incident]")) {
    window.clientApi.writeClipboardText(ownerIncidentReport(userId))
      .then(() => setRuntimeStatus("Карточка инцидента скопирована."))
      .catch((error) => setRuntimeStatus(error.message, true));
    return;
  }
  const watchButton = event.target.closest("[data-owner-watch]");
  if (watchButton) {
    runButton(watchButton, async () => {
      const record = playerRecord(userId);
      record.status = record.status === "watch" ? "ok" : "watch";
      touchPlayerRecord(record);
      await savePlayerRecord(userId);
      renderOwnerTools();
      setRuntimeStatus(record.status === "watch" ? "Игрок добавлен под наблюдение." : "Наблюдение снято.");
    }).catch((error) => setRuntimeStatus(error.message, true));
    return;
  }
  if (event.target.closest("[data-owner-ban]")) {
    openBanRequestDialog(userId, "ban");
    return;
  }
  if (event.target.closest("[data-owner-unban]")) openBanRequestDialog(userId, "unban");
});

refreshModerationBtn?.addEventListener("click", () => {
  runButton(refreshModerationBtn, async () => {
    await Promise.all([
      loadModerationRequests(),
      loadGroupManagementRequests()
    ]);
    if (state.ownerSource === "group") await requestOwnerGroupMembers();
  }).catch((error) => setRuntimeStatus(groupManagementError(error), true));
});

function renderActiveAdminPlayerCard() {
  if (activePaneName() === "owner") renderOwnerTools();
  else renderAdminPlayerCard();
}

function handleAdminPlayerCardClick(event) {
  const userId = event.target.closest("[data-player-note-editor]")?.dataset.userId;
  if (!userId) return;
  const avatarEditor = event.target.closest("[data-admin-avatar-editor]");
  const publishAvatarButton = event.target.closest("[data-publish-global-avatar-note]");
  if (publishAvatarButton && avatarEditor) {
    const confirmed = window.confirm("Опубликовать метку и заметку этого аватара для всех лицензированных команд? Автор публикации будет виден.");
    if (!confirmed) return;
    const record = avatarNoteRecord(
      avatarEditor.dataset.avatarName,
      avatarEditor.dataset.avatarId,
      avatarEditor.dataset.avatarKey
    );
    if (!record) return;
    runButton(publishAvatarButton, () => publishGlobalAvatarNote(record.avatarKey))
      .then(() => {
        renderActiveAdminPlayerCard();
        renderCrashAnalyzer();
      })
      .catch((error) => setRuntimeStatus(globalPublicationError(error), true));
    return;
  }
  const removeAvatarButton = event.target.closest("[data-remove-global-avatar-note]");
  if (removeAvatarButton && avatarEditor) {
    const confirmed = window.confirm("Убрать общую публикацию этого аватара? Командная метка останется без изменений.");
    if (!confirmed) return;
    runButton(removeAvatarButton, () => removeGlobalAvatarNote(avatarEditor.dataset.avatarId))
      .then(() => {
        renderActiveAdminPlayerCard();
        renderCrashAnalyzer();
      })
      .catch((error) => setRuntimeStatus(globalPublicationError(error), true));
    return;
  }
  const restoreButton = event.target.closest("[data-restore-note-history]");
  if (restoreButton) {
    const confirmed = window.confirm("Вернуть метку и заметку к состоянию до этого изменения?");
    if (!confirmed) return;
    runButton(restoreButton, () => restorePlayerNoteHistory(userId, restoreButton.dataset.restoreNoteHistory))
      .then(() => renderActiveAdminPlayerCard())
      .catch((error) => setRuntimeStatus(error.message, true));
    return;
  }
  const publishButton = event.target.closest("[data-publish-global-note]");
  if (publishButton) {
    const confirmed = window.confirm("Опубликовать текущую метку и заметку для всех лицензированных команд? Автор публикации будет виден.");
    if (!confirmed) return;
    runButton(publishButton, () => publishGlobalPlayerNote(userId))
      .then(() => renderActiveAdminPlayerCard())
      .catch((error) => setRuntimeStatus(globalPublicationError(error), true));
    return;
  }
  const removeButton = event.target.closest("[data-remove-global-note]");
  if (removeButton) {
    const confirmed = window.confirm("Убрать общую публикацию вашей команды? Командная заметка останется без изменений.");
    if (!confirmed) return;
    runButton(removeButton, () => removeGlobalPlayerNote(userId))
      .then(() => renderActiveAdminPlayerCard())
      .catch((error) => setRuntimeStatus(globalPublicationError(error), true));
  }
}

adminPlayerCard?.addEventListener("click", handleAdminPlayerCardClick);
ownerPlayerCard?.addEventListener("click", handleAdminPlayerCardClick);

banRequestForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const target = state.banRequestTarget;
  if (!target) return;
  const action = state.moderationRequestAction;
  const temporary = action === "ban" &&
    banRequestForm.querySelector('input[name="banDurationMode"]:checked')?.value === "temporary";
  runButton(banRequestSubmitBtn, async () => {
    const request = {
      targetUserId: target.userId,
      targetDisplayName: target.displayName,
      reason: banRequestReason.value.trim(),
      evidenceUrl: banRequestEvidence.value.trim()
    };
    if (action === "unban") {
      await window.clientApi.requestGroupUnban(request);
    } else {
      await window.clientApi.requestGroupBan({
        ...request,
        durationMinutes: temporary ? moderationDurationMinutes() : null
      });
    }
    closeBanRequestDialog();
    setRuntimeStatus(action === "unban"
      ? "Запрос на разбан передан службе модерации."
      : "Запрос на бан передан службе модерации.");
    await loadModerationRequests({ silent: true });
    renderOwnerTools();
  }).catch((error) => setRuntimeStatus(moderationRequestError(error), true));
});

banRequestForm?.querySelectorAll('input[name="banDurationMode"]').forEach((input) => {
  input.addEventListener("change", () => {
    syncModerationRequestDialog();
  });
});

banRequestDurationUnit?.addEventListener("change", syncModerationDurationLimits);

banReasonTemplate?.addEventListener("change", () => {
  const template = MODERATION_REASON_TEMPLATES[banReasonTemplate.value];
  if (!template) return;
  banRequestReason.value = template;
  banRequestReason.focus();
  banRequestReason.setSelectionRange(template.length, template.length);
});

banRequestCloseBtn?.addEventListener("click", closeBanRequestDialog);
banRequestCancelBtn?.addEventListener("click", closeBanRequestDialog);
banRequestDialog?.addEventListener("cancel", () => {
  state.banRequestTarget = null;
  state.moderationRequestAction = "ban";
});

if (notifyMarkedPlayers) {
  notifyMarkedPlayers.checked = state.notifyMarkedPlayers;
  notifyMarkedPlayers.addEventListener("change", () => {
    state.notifyMarkedPlayers = notifyMarkedPlayers.checked;
    localStorage.setItem("notifyMarkedPlayers", String(state.notifyMarkedPlayers));
  });
}

if (notifyCrashAvatars) {
  notifyCrashAvatars.checked = state.notifyCrashAvatars;
  notifyCrashAvatars.addEventListener("change", () => {
    state.notifyCrashAvatars = notifyCrashAvatars.checked;
    localStorage.setItem("notifyCrashAvatars", String(state.notifyCrashAvatars));
  });
}

builderGrid.addEventListener("change", (event) => {
  if (!event.target.matches("[data-builder-admin-user]")) return;
  state.builderAdminUserId = event.target.value;
  localStorage.setItem("builderAdminUserId", state.builderAdminUserId);
  if (state.builderAdminUserId) state.selectedUserId = state.builderAdminUserId;
  updateBuilderBlock("admin");
});

document.addEventListener("change", (event) => {
  if (!event.target.matches("[data-player-note-status]")) return;
  const userId = event.target.closest("[data-player-note-editor]")?.dataset.userId;
  if (!userId) return;
  const record = playerRecord(userId);
  record.status = event.target.value;
  touchPlayerRecord(record);
  savePlayerRecord(userId);
  if (activePaneName() === "admin") renderAdminTools();
  if (activePaneName() === "owner") renderOwnerTools();
  if (activePaneName() === "builder") updateBuilderBlock("admin");
});

function handleAdminAvatarStatusChange(event) {
  if (!event.target.matches("[data-admin-avatar-note-status]")) return;
  const wrap = event.target.closest("[data-admin-avatar-editor]");
  if (!wrap) return;
  const key = wrap.dataset.avatarKey;
  const record = avatarNoteRecord(wrap.dataset.avatarName, wrap.dataset.avatarId, key);
  if (!record || record.avatarKey !== key) return;
  record.status = event.target.value === "crash" ? "crash" : "ok";
  touchAvatarNoteRecord(record);
  saveAvatarNoteRecord(key)
    .then(() => renderCrashAnalyzer())
    .catch((error) => setRuntimeStatus(error.message, true));
}

adminPlayerCard?.addEventListener("change", handleAdminAvatarStatusChange);
ownerPlayerCard?.addEventListener("change", handleAdminAvatarStatusChange);

document.addEventListener("input", (event) => {
  if (!event.target.matches("[data-player-note-text]")) return;
  const userId = event.target.closest("[data-player-note-editor]")?.dataset.userId;
  if (!userId) return;
  const record = playerRecord(userId);
  record.note = event.target.value;
  touchPlayerRecord(record);
  state.playerNoteOutbox[userId] = true;
  cachePlayerNotes();
  cachePlayerNoteOutbox();
  if (state.noteSaveTimers.has(userId)) clearTimeout(state.noteSaveTimers.get(userId));
  state.noteSaveTimers.set(userId, setTimeout(() => {
    state.noteSaveTimers.delete(userId);
    savePlayerRecord(userId);
  }, 650));
});

function handleAdminAvatarNoteInput(event) {
  if (!event.target.matches("[data-admin-avatar-note-text]")) return;
  const wrap = event.target.closest("[data-admin-avatar-editor]");
  if (!wrap) return;
  const key = wrap.dataset.avatarKey;
  const record = avatarNoteRecord(wrap.dataset.avatarName, wrap.dataset.avatarId, key);
  if (!record || record.avatarKey !== key) return;
  record.note = event.target.value;
  touchAvatarNoteRecord(record);
  state.avatarNoteOutbox[key] = true;
  cacheAvatarNotes();
  cacheAvatarNoteOutbox();
  if (state.avatarNotesSaveTimers.has(key)) clearTimeout(state.avatarNotesSaveTimers.get(key));
  state.avatarNotesSaveTimers.set(key, setTimeout(() => {
    state.avatarNotesSaveTimers.delete(key);
    saveAvatarNoteRecord(key).catch((error) => setRuntimeStatus(error.message, true));
  }, 650));
}

adminPlayerCard?.addEventListener("input", handleAdminAvatarNoteInput);
ownerPlayerCard?.addEventListener("input", handleAdminAvatarNoteInput);

crashIncidentList?.addEventListener("change", (event) => {
  if (!event.target.matches("[data-avatar-note-status]")) return;
  const wrap = event.target.closest("[data-avatar-key]");
  if (!wrap) return;
  const key = wrap.dataset.avatarKey;
  const record = avatarNoteRecord(wrap.dataset.avatarName, wrap.dataset.avatarId, key);
  if (!record || record.avatarKey !== key) return;
  record.status = event.target.value === "crash" ? "crash" : "ok";
  touchAvatarNoteRecord(record);
  saveAvatarNoteRecord(key);
  renderCrashAnalyzer();
});

crashIncidentList?.addEventListener("input", (event) => {
  if (!event.target.matches("[data-avatar-note-text]")) return;
  const wrap = event.target.closest("[data-avatar-key]");
  if (!wrap) return;
  const key = wrap.dataset.avatarKey;
  const record = avatarNoteRecord(wrap.dataset.avatarName, wrap.dataset.avatarId, key);
  if (!record || record.avatarKey !== key) return;
  record.note = event.target.value;
  touchAvatarNoteRecord(record);
  state.avatarNoteOutbox[key] = true;
  cacheAvatarNotes();
  cacheAvatarNoteOutbox();
  if (state.avatarNotesSaveTimers.has(key)) clearTimeout(state.avatarNotesSaveTimers.get(key));
  state.avatarNotesSaveTimers.set(key, setTimeout(() => {
    state.avatarNotesSaveTimers.delete(key);
    saveAvatarNoteRecord(key);
  }, 650));
});

// ── IPC события ──────────────────────────────────────────────────────────────

window.clientApi.onLogEvent(addEvent);

window.clientApi.onAnalysisStart(() => resetEvents({ clearCrashBuffer: true }));

window.clientApi.onTailRotation?.(() => {
  // The new log continues the same visible session; existing analysis stays on screen.
});

window.clientApi.onTailStatus((status) => {
  state.tailRunning = Boolean(status.running);
  if (status.filePath) setFilePath(status.filePath);
  setRuntimeStatus(status.message || (status.running ? "Watching" : "Stopped"));
  if (activePaneName() === "crash") renderWhenVisible(renderCrashAnalyzer);
});

window.clientApi.onTailError((error) => setRuntimeStatus(error.message, true));

window.clientApi.onAuthStatus((status) => {
  if (status.license) {
    state.license = status.license;
    syncOwnerAccess();
    if (activePaneName() === "admin") renderWhenVisible(renderAdminTools);
    if (activePaneName() === "owner") renderWhenVisible(renderOwnerTools);
  }
  setRuntimeStatus(status.message, !status.ok);
});

window.clientApi.onUserResolved((profile) => {
  state.profiles.set(profile.userId, profile);
  rememberKnownPlayer({
    userId: profile.userId,
    displayName: profile.displayName,
    lastSeenAt: state.knownPlayers[profile.userId]?.lastSeenAt || new Date().toISOString()
  });
  scheduleRender();
});

window.clientApi.onUpdaterStatus((info) => {
  if (info.status === "log") {
    return;
  }
  if (info.status === "checking") {
    setRuntimeStatus("Проверяем обновления…");
  } else if (info.status === "available") {
    setRuntimeStatus(`Найдено обновление ${info.version}, скачиваю…`);
  } else if (info.status === "not-available") {
    setRuntimeStatus(`Актуальная версия (${info.currentVersion})`);
  } else if (info.status === "downloading") {
    setRuntimeStatus(`Скачивание обновления: ${info.percent}%`);
  } else if (info.status === "downloaded") {
    updateBtn.hidden = false;
    setRuntimeStatus(`Обновление ${info.version} готово к установке`);
  } else if (info.status === "error") {
    setRuntimeStatus(`Ошибка автообновления: ${info.message}`, true);
  }
});

function showRuntimeConfigNotice(config) {
  const notice = config?.notice;
  if (!notice?.message) return;
  const isError = notice.level === "error";
  if (activationView.hidden) setRuntimeStatus(notice.message, isError);
  else setActivationStatus(notice.message, isError);
}

window.clientApi.onRuntimeConfig?.(showRuntimeConfigNotice);

function scheduleResumeRefresh() {
  if (document.hidden || appView.hidden) return;
  if (state.resumeRefreshTimer || state.resumeRefreshInFlight) return;
  state.resumeRefreshTimer = setTimeout(() => {
    state.resumeRefreshTimer = null;
    state.resumeRefreshInFlight = true;
    state.renderSuspended = true;
    Promise.allSettled([
      loadPlayerNotes({ silent: true }),
      loadAvatarCatalog({ silent: true }),
      loadAvatarNotes({ silent: true }),
      refreshServerSnapshot({ silent: true })
    ]).finally(() => {
      state.resumeRefreshInFlight = false;
      state.renderSuspended = false;
      scheduleRender(0);
      if (activePaneName() === "dashboard") renderWhenVisible(renderDashboard);
    });
  }, RESUME_REFRESH_DELAY_MS);
}

window.addEventListener("focus", scheduleResumeRefresh);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) scheduleResumeRefresh();
});

window.addEventListener("beforeunload", () => {
  saveCrashEventBuffer();
  cacheKnownPlayers();
});

// Инициализация

async function init() {
  migrateBuilderState();
  if (adminOnlineFilter) adminOnlineFilter.value = state.adminOnlineFilter;
  if (ownerOnlineFilter) ownerOnlineFilter.value = state.ownerOnlineFilter;
  const runtimeConfiguration = window.clientApi.getRuntimeConfig
    ? await window.clientApi.getRuntimeConfig().catch(() => null)
    : null;
  const settings = await window.clientApi.getSettings();
  state.license = settings.license || null;
  syncOwnerAccess();
  if (settings.hasSession && state.license) {
    setTeamScope(state.license, { migrateLegacy: true });
  }
  setStoredCookieState(Boolean(settings.hasVrchatAuthCookie));
  if (rememberMe) rememberMe.checked = Boolean(settings.rememberMe);

  const latest = await window.clientApi.latestFile();
  if (latest.filePath) setFilePath(latest.filePath);

  builderLayout.value = state.builderLayout;
  syncBuilderPickerCheckboxes();
  const topResult = await window.clientApi.setAlwaysOnTop(
    state.alwaysOnTop,
    state.windowOpacity / 100
  ).catch(() => ({ enabled: false }));
  state.alwaysOnTop = Boolean(topResult.enabled);
  syncWindowControlButtons();
  renderCrashAnalyzer();
  if (state.crashAnalyzerEnabled) startCrashAnalyzer();

  if (settings.hasSession) {
    try {
      const session = await window.clientApi.validate();
      state.license = session.license || state.license;
      syncOwnerAccess();
      setTeamScope(state.license, { migrateLegacy: true });
      setRuntimeStatus(`Session active until ${new Date(session.expiresAt).toLocaleString("ru-RU")}`);
      showApp();
      startPlayerNotesPolling();
      startAvatarNotesPolling();
      startAvatarCatalogPolling();
      await loadPlayerNotes({ pushLocal: true });
      await loadGlobalPlayerNotes({ force: true, silent: true });
      await loadAvatarCatalog({ silent: true, pushLocal: true });
      await loadAvatarNotes({ silent: true, pushLocal: true });
      await loadGlobalAvatarNotes({ force: true, silent: true });
      await refreshServerSnapshot({ silent: true });
    } catch (error) {
      setActivationStatus(error.message, true);
      showActivation();
    }
  } else {
    showActivation();
  }

  showRuntimeConfigNotice(runtimeConfiguration);

  render();
}

init().catch((error) => {
  setActivationStatus(error.message, true);
  showActivation();
});
