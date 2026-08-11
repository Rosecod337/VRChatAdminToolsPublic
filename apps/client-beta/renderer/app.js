"use strict";

const previewMode = new URLSearchParams(window.location.search).get("preview") === "1";
const stressPreviewMode = previewMode && new URLSearchParams(window.location.search).get("stress") === "1";
const activationPreviewMode = previewMode && new URLSearchParams(window.location.search).get("activation") === "1";
const lockedOwnerPreviewMode = previewMode && new URLSearchParams(window.location.search).get("ownerLocked") === "1";
const noteTools = window.betaAdminNotes;
const sessionModel = window.betaSessionModel;
const crashModel = window.betaCrashModel;
const insightsModel = window.betaInsightsModel;
const avatarModel = window.betaAvatarModel;
const notificationModel = window.betaNotificationModel;
const i18n = window.betaI18n;
const api = window.clientApi || (previewMode ? createPreviewApi() : null);
const activationView = document.querySelector("[data-activation-view]");
const activationForm = document.querySelector("[data-activation-form]");
const activationStatus = document.querySelector("[data-activation-status]");
const authorAliasField = document.querySelector("[data-author-alias-field]");
const authorAliasInput = activationForm?.elements.namedItem("authorAlias");
const vrchatAuthCookieInput = activationForm?.elements.namedItem("vrchatAuthCookie");
const checkVrchatButton = document.querySelector("[data-check-vrchat]");
const importStableButton = document.querySelector("[data-import-stable]");
const appView = document.querySelector("[data-app-view]");
const runtimeState = document.querySelector(".runtimeState");
const runtimeStatus = document.querySelector("[data-runtime-status]");
const runtimeStatusTitle = document.querySelector("[data-runtime-status-title]");
const statusCenter = document.querySelector("[data-status-center]");
const statusList = document.querySelector("[data-status-list]");
const statusUnread = document.querySelector("[data-status-unread]");
const statusCenterToggle = document.querySelector("[data-status-center-toggle]");
const filePathLabel = document.querySelector("[data-file-path]");
const eventCount = document.querySelector("[data-event-count]");
const eventFeed = document.querySelector("[data-event-feed]");
const playerList = document.querySelector("[data-player-list]");
const playerCount = document.querySelector("[data-player-count]");
const playerSearch = document.querySelector("[data-session-player-search]");
const onlineBadge = document.querySelector("[data-online-badge]");
const updateButton = document.querySelector('[data-action="update"]');
const avatarSessionList = document.querySelector("[data-avatar-session-list]");
const avatarDetail = document.querySelector("[data-avatar-detail]");
const avatarSearch = document.querySelector("[data-avatar-search]");
const avatarFilter = document.querySelector("[data-avatar-filter]");
const avatarOnlineResults = document.querySelector("[data-avatar-online-results]");
const dashboardBars = document.querySelector("[data-dashboard-bars]");
const dashboardRecent = document.querySelector("[data-dashboard-recent]");
const dashboardDuration = document.querySelector("[data-dashboard-duration]");
const dashboardTotal = document.querySelector("[data-dashboard-total]");
const playerDrawer = document.querySelector("[data-session-player-drawer]");
const pageEyebrow = document.querySelector("[data-page-eyebrow]");
const pageTitle = document.querySelector("[data-page-title]");
const appVersionLabel = document.querySelector("[data-app-version]");
const noteList = document.querySelector("[data-note-list]");
const noteCount = document.querySelector("[data-note-count]");
const adminCard = document.querySelector("[data-admin-card]");
const adminSearch = document.querySelector("[data-admin-search]");
const ownerNavButton = document.querySelector('[data-view-button="owner"]');
const ownerList = document.querySelector("[data-owner-list]");
const ownerCard = document.querySelector("[data-owner-card]");
const ownerSearch = document.querySelector("[data-owner-search]");
const ownerDialog = document.querySelector("[data-owner-dialog]");
const ownerModerationForm = document.querySelector("[data-owner-moderation-form]");
const crashList = document.querySelector("[data-crash-list]");
const crashDetail = document.querySelector("[data-crash-detail]");
const insightsPeriod = document.querySelector("[data-insights-period]");
const insightSessionList = document.querySelector("[data-session-list]");
const insightSessionDetail = document.querySelector("[data-insight-session-detail]");
const builderGrid = document.querySelector("[data-builder]");
const builderLayout = document.querySelector("[data-builder-layout]");
const builderPreset = document.querySelector("[data-builder-preset]");
const builderOpacity = document.querySelector("[data-builder-opacity]");
const historyList = document.querySelector("[data-history-list]");
const historyDetail = document.querySelector("[data-history-detail]");
const historySearch = document.querySelector("[data-history-search]");
const historyDate = document.querySelector("[data-history-date]");
const historyState = document.querySelector("[data-history-state]");
const settingsDialog = document.querySelector("[data-settings-dialog]");
const settingsForm = document.querySelector("[data-settings-form]");
let settingsReturnFocus = null;
let ownerDialogReturnFocus = null;
let playerDrawerReturnFocus = null;
const BUILDER_KINDS = Object.freeze(["players", "avatars", "portals", "worlds", "admin"]);
const BUILDER_MIN_WIDTH = 260;
const BUILDER_MIN_HEIGHT = 150;
const SESSION_EVENT_FILTERS = Object.freeze(["joins", "leaves", "avatars", "worlds", "other"]);
const ACTION_PENDING_LABELS = Object.freeze({
  choose: "Выбираем…",
  analyze: "Анализируем…",
  snapshot: "Копируем…",
  community: "Открываем…",
  start: "Запускаем…",
  stop: "Останавливаем…",
  update: "Устанавливаем…",
  "refresh-insights": "Обновляем…",
  "refresh-admin": "Обновляем…",
  "refresh-owner": "Обновляем…",
  "refresh-crash": "Проверяем…",
  "refresh-history": "Обновляем…",
  logout: "Выходим…"
});

function t(value) {
  return i18n?.translate?.(value, i18n.language()) ?? String(value ?? "");
}

function uiLocale() {
  return i18n?.language?.() === "en" ? "en-US" : "ru-RU";
}

function loadLocalJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

const DEFAULT_UI_SETTINGS = Object.freeze({
  language: "ru",
  startView: "session",
  density: "comfortable",
  scale: 100,
  animations: true,
  showHeader: true,
  showToolbar: true,
  sessionPlayerMode: "online-first",
  eventLimit: 2500,
  autoAnalyzeToday: false,
  rememberSelection: true,
  notifyMarkedPlayers: false,
  notifyCrashAvatars: false,
  clearOnLogout: true
});

function normalizedUiSettings(value = {}) {
  const next = { ...DEFAULT_UI_SETTINGS, ...(value && typeof value === "object" ? value : {}) };
  delete next.autoStart;
  if (!["ru", "en"].includes(next.language)) next.language = "ru";
  if (!["session", "admin", "owner", "crash", "insights", "history", "builder"].includes(next.startView)) next.startView = "session";
  if (!["comfortable", "compact"].includes(next.density)) next.density = "comfortable";
  next.scale = [100, 125, 150, 175, 200].includes(Number(next.scale)) ? Number(next.scale) : 100;
  next.eventLimit = [1000, 2500, 5000].includes(Number(next.eventLimit)) ? Number(next.eventLimit) : 2500;
  if (!["online-first", "online-only", "all"].includes(next.sessionPlayerMode)) next.sessionPlayerMode = "online-first";
  for (const key of ["animations", "showHeader", "showToolbar", "autoAnalyzeToday", "rememberSelection", "notifyMarkedPlayers", "notifyCrashAvatars", "clearOnLogout"]) next[key] = Boolean(next[key]);
  return next;
}

const state = {
  settings: null,
  events: [],
  filePath: "",
  running: false,
  startedAt: null,
  stoppedAt: null,
  currentPlaySessionId: "",
  playSessionLastSyncAt: 0,
  playSessionSyncPromise: null,
  playSessionSyncTimer: 0,
  playSessionDirty: false,
  playSessionSyncWarning: "",
  profiles: new Map(),
  runtimeConfig: null,
  dashboardClockTimer: 0,
  statusResetTimer: 0,
  statusHistory: [],
  statusUnread: 0,
  statusCenterOpen: false,
  view: "session",
  sessionPlayerMode: "online-first",
  sessionPlayerQuery: "",
  sessionEventFilters: loadLocalJson("betaSessionEventFilters", ["all"]),
  sessionSection: "feed",
  selectedSessionUserId: "",
  sessionVisibleEvents: [],
  sessionVisiblePlayers: [],
  sessionAvatarRows: [],
  avatarCatalog: [],
  avatarNotes: [],
  globalAvatarNotes: [],
  avatarRows: [],
  avatarVisibleRows: [],
  selectedAvatarKey: "",
  avatarCandidates: [],
  avatarQuery: "",
  avatarFilter: "all",
  avatarOnlineRows: [],
  avatarOnlineQuery: "",
  avatarOnlineLoading: false,
  avatarOnlineError: "",
  avatarLoading: false,
  avatarSaving: false,
  avatarError: "",
  avatarRequestId: 0,
  avatarSearchTimer: 0,
  sessionRenderFrame: 0,
  sessionSearchTimer: 0,
  adminNotes: [],
  globalPlayerNotes: [],
  globalPlayerNotesError: "",
  adminCatalog: [],
  adminVisiblePlayers: [],
  adminPlayerMode: "online-first",
  adminQuery: "",
  adminSearchTimer: 0,
  adminRenderFrame: 0,
  adminDraftPlayer: null,
  selectedAdminUserId: "",
  adminHistory: [],
  adminLoading: false,
  adminSaving: false,
  adminHistoryLoading: false,
  adminListError: "",
  adminError: "",
  adminListRequestId: 0,
  adminHistoryRequestId: 0,
  ownerCatalog: [],
  ownerSource: "logs",
  ownerVisiblePlayers: [],
  ownerSelectedUserId: "",
  ownerPlayerMode: "online-first",
  ownerQuery: "",
  ownerRequests: [],
  ownerLoading: false,
  ownerError: "",
  ownerDialogUserId: "",
  ownerSearchTimer: 0,
  ownerRenderFrame: 0,
  groupManagementRequests: [],
  groupMembers: [],
  groupRoles: [],
  groupMembersTotal: 0,
  groupMembersOffset: 0,
  groupMembersLimit: 100,
  groupMembersHasMore: false,
  groupManagementLoading: false,
  ownerPollTimer: 0,
  crashEnabled: localStorage.getItem("betaCrashEnabled") === "true",
  crashLastStatus: null,
  crashLastLogModifiedAt: "",
  crashFreezeReported: false,
  crashPollTimer: 0,
  crashRenderFrame: 0,
  crashIncidents: crashModel?.normalizeIncidents(loadLocalJson("betaCrashIncidents", [])) || [],
  selectedCrashIncidentId: "",
  insightSessions: [],
  insights: null,
  insightsLoading: false,
  insightsError: "",
  insightsRequestId: 0,
  insightsPeriod: localStorage.getItem("betaInsightsPeriod") || "30",
  selectedInsightSessionKey: "",
  currentVrchatUser: null,
  currentVrchatInstance: null,
  builderOrder: loadLocalJson("betaBuilderOrder", BUILDER_KINDS),
  builderVisible: loadLocalJson("betaBuilderVisible", BUILDER_KINDS),
  builderLayout: ["rows", "freeform"].includes(localStorage.getItem("betaBuilderLayout")) ? localStorage.getItem("betaBuilderLayout") : "grid",
  builderGeometry: loadLocalJson("betaBuilderGeometry", {}),
  builderQueries: loadLocalJson("betaBuilderQueries", {}),
  builderAlwaysOnTop: localStorage.getItem("betaBuilderAlwaysOnTop") === "true",
  builderOpacity: Math.min(100, Math.max(40, Number(localStorage.getItem("betaBuilderOpacity")) || 100)),
  builderCompact: localStorage.getItem("betaBuilderCompact") === "true",
  builderDraggedKind: "",
  builderInteraction: null,
  builderRenderFrame: 0,
  builderOpacityTimer: 0,
  historySessions: [],
  historyVisibleSessions: [],
  historyQuery: "",
  historyDate: "",
  historyStatus: "all",
  historySelectedKey: "",
  historyLoading: false,
  historyError: "",
  historyRequestId: 0,
  historySearchTimer: 0,
  notificationPlayerNotes: [],
  notificationAvatarNotes: [],
  notificationRefreshTimer: 0,
  notificationRequestId: 0,
  notificationWarning: "",
  uiSettings: normalizedUiSettings(loadLocalJson("betaUiSettings", DEFAULT_UI_SETTINGS))
};

state.builderOrder = [...new Set((Array.isArray(state.builderOrder) ? state.builderOrder : []).filter((kind) => BUILDER_KINDS.includes(kind)))];
for (const kind of BUILDER_KINDS) if (!state.builderOrder.includes(kind)) state.builderOrder.push(kind);
state.builderVisible = [...new Set((Array.isArray(state.builderVisible) ? state.builderVisible : []).filter((kind) => BUILDER_KINDS.includes(kind)))];
state.builderQueries = Object.fromEntries(BUILDER_KINDS.map((kind) => [kind, String(state.builderQueries?.[kind] || "").slice(0, 120)]));
state.sessionEventFilters = [...new Set((Array.isArray(state.sessionEventFilters) ? state.sessionEventFilters : []).filter((kind) => kind === "all" || SESSION_EVENT_FILTERS.includes(kind)))];
if (!state.sessionEventFilters.length || state.sessionEventFilters.includes("all")) state.sessionEventFilters = ["all"];

const savedPlayerMode = localStorage.getItem("betaSessionPlayerMode");
if (["online-first", "online-only", "all"].includes(savedPlayerMode)) state.sessionPlayerMode = savedPlayerMode;
else state.sessionPlayerMode = state.uiSettings.sessionPlayerMode;
const savedSessionSection = localStorage.getItem("betaSessionSection");
if (["feed", "avatars", "dashboard"].includes(savedSessionSection)) state.sessionSection = savedSessionSection;
const savedOwnerMode = localStorage.getItem("betaOwnerPlayerMode");
if (["online-first", "online-only", "all"].includes(savedOwnerMode)) state.ownerPlayerMode = savedOwnerMode;
const savedAdminMode = localStorage.getItem("betaAdminPlayerMode");
if (["online-first", "online-only", "all"].includes(savedAdminMode)) state.adminPlayerMode = savedAdminMode;

if (state.uiSettings.rememberSelection) {
  const remembered = loadLocalJson("betaRememberedSelections", {});
  state.selectedSessionUserId = String(remembered.session || "");
  state.selectedAdminUserId = String(remembered.admin || "");
  state.ownerSelectedUserId = String(remembered.owner || "");
  state.selectedAvatarKey = String(remembered.avatar || "");
  state.historySelectedKey = String(remembered.history || "");
}

function rememberSelections() {
  if (!state.uiSettings.rememberSelection) return;
  localStorage.setItem("betaRememberedSelections", JSON.stringify({
    session: state.selectedSessionUserId,
    admin: state.selectedAdminUserId,
    owner: state.ownerSelectedUserId,
    avatar: state.selectedAvatarKey,
    history: state.historySelectedKey
  }));
}

const viewTitles = {
  session: "Живая сессия",
  insights: "Мой VRChat",
  admin: "Admin Tools",
  owner: "Owner",
  crash: "Crash Analyzer",
  builder: "Builder Beta",
  history: "История сессий"
};

const viewEyebrows = {
  session: "Текущая сессия",
  insights: "Личная статистика",
  admin: "Командная работа",
  owner: "Управление VRChat-группой",
  crash: "Диагностика",
  builder: "Новый конструктор",
  history: "Архив"
};

function baselineStatus() {
  return state.running
    ? { title: "Мониторинг", message: "Чтение лога активно", kind: "activity" }
    : { title: "Состояние", message: "Мониторинг остановлен", kind: "idle" };
}

function friendlyStatusMessage(message, error = false) {
  const value = String(message || "").trim();
  if (!error) return value || "Готово";
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network/iu.test(value)) {
    return "Не удалось связаться с сервером. Проверьте интернет и повторите действие.";
  }
  if (/HTTP (401|403)|unauthorized|forbidden/iu.test(value)) {
    return "Нет доступа. Проверьте лицензию и права этого ключа.";
  }
  if (/HTTP 5\d\d/iu.test(value)) {
    return "Сервер временно не отвечает. Повторите действие немного позже.";
  }
  return value.length > 180 ? `${value.slice(0, 177)}…` : value || "Операцию выполнить не удалось.";
}

function inferStatusKind(message, error = false) {
  if (error) return "error";
  const value = String(message || "");
  if (/актив|запущ|чтение/iu.test(value)) return "activity";
  if (/сохран|скоп|готов|обновлен|опублик|открыт|найден/iu.test(value)) return "success";
  if (/вниман|ожида|отмен|останов/iu.test(value)) return "warning";
  return "info";
}

const STATUS_TITLES = Object.freeze({
  idle: "Состояние",
  info: "Уведомление",
  success: "Готово",
  activity: "Мониторинг",
  warning: "Внимание",
  error: "Ошибка"
});

function renderStatusCenter() {
  if (!statusCenter || !statusList || !statusUnread || !statusCenterToggle) return;
  statusCenter.hidden = !state.statusCenterOpen;
  statusCenterToggle.setAttribute("aria-expanded", state.statusCenterOpen ? "true" : "false");
  statusUnread.hidden = state.statusUnread === 0;
  statusUnread.textContent = String(Math.min(99, state.statusUnread));
  statusList.replaceChildren();
  for (const notice of state.statusHistory) {
    const row = adminElement("article", "statusNotice");
    row.dataset.kind = notice.kind;
    const copy = adminElement("div");
    copy.append(
      adminElement("strong", "", STATUS_TITLES[notice.kind] || "Уведомление"),
      adminElement("span", "", notice.message)
    );
    const time = adminElement("time", "", new Date(notice.createdAt).toLocaleTimeString(uiLocale(), { hour: "2-digit", minute: "2-digit" }));
    row.append(adminElement("i"), copy, time);
    statusList.append(row);
  }
  if (!state.statusHistory.length) statusList.append(emptyMessage("Новых уведомлений нет."));
}

function recordStatusNotice(message, kind) {
  const latest = state.statusHistory[0];
  if (latest?.message === message && latest?.kind === kind) return;
  state.statusHistory.unshift({ message, kind, createdAt: Date.now() });
  state.statusHistory = state.statusHistory.slice(0, 20);
  if (!state.statusCenterOpen) state.statusUnread = Math.min(99, state.statusUnread + 1);
  renderStatusCenter();
}

function setStatusCenter(open) {
  state.statusCenterOpen = Boolean(open);
  if (state.statusCenterOpen) state.statusUnread = 0;
  renderStatusCenter();
}

function clearStatusCenter() {
  state.statusHistory = [];
  state.statusUnread = 0;
  renderStatusCenter();
}

function setStatus(message, error = false, options = {}) {
  if (!runtimeStatus || !runtimeState) return;
  const kind = options.kind || inferStatusKind(message, error);
  runtimeState.dataset.statusKind = kind;
  runtimeStatusTitle.textContent = options.title || STATUS_TITLES[kind] || "Уведомление";
  runtimeStatus.textContent = friendlyStatusMessage(message, error);
  runtimeStatus.title = runtimeStatus.textContent;
  if (state.statusResetTimer) window.clearTimeout(state.statusResetTimer);
  state.statusResetTimer = 0;
  const baseline = baselineStatus();
  const isBaseline = runtimeStatus.textContent === baseline.message && kind === baseline.kind;
  if (options.record !== false && !isBaseline) recordStatusNotice(runtimeStatus.textContent, kind);
  if (!options.sticky && !isBaseline) {
    state.statusResetTimer = window.setTimeout(() => {
      state.statusResetTimer = 0;
      setStatus(baselineStatus().message, false, { ...baselineStatus(), sticky: true, record: false });
    }, error ? 12_000 : 6_500);
  }
}

async function runButtonOperation(button, operation, pendingText = "Выполняем…") {
  if (!button || button.dataset.busy === "true") return undefined;
  const originalText = button.textContent;
  const originalDisabled = button.disabled;
  button.dataset.busy = "true";
  button.setAttribute("aria-busy", "true");
  button.disabled = true;
  if (pendingText) button.textContent = pendingText;
  try {
    return await operation();
  } finally {
    button.textContent = originalText;
    button.removeAttribute("aria-busy");
    delete button.dataset.busy;
    const action = button.dataset.action;
    if (action === "start") button.disabled = state.running;
    else if (action === "stop") button.disabled = !state.running;
    else button.disabled = originalDisabled;
  }
}

function applyUiSettings({ persist = false } = {}) {
  state.uiSettings = normalizedUiSettings(state.uiSettings);
  if (persist) localStorage.setItem("betaUiSettings", JSON.stringify(state.uiSettings));
  document.documentElement.lang = state.uiSettings.language;
  appView.classList.toggle("densityCompact", state.uiSettings.density === "compact");
  appView.classList.toggle("animationsOff", !state.uiSettings.animations);
  appView.classList.toggle("headerHidden", !state.uiSettings.showHeader);
  appView.classList.toggle("toolbarHidden", !state.uiSettings.showToolbar && !state.builderCompact);
  const scale = state.uiSettings.scale / 100;
  appView.style.zoom = String(scale);
  appView.style.width = "";
  appView.style.height = `${100 / scale}vh`;
}

function fillSettingsForm(settings = state.uiSettings) {
  if (!settingsForm) return;
  const value = normalizedUiSettings(settings);
  const ownerStartOption = settingsForm.elements.startView.querySelector('option[value="owner"]');
  if (ownerStartOption) {
    ownerStartOption.disabled = !hasOwnerAccess();
    ownerStartOption.title = ownerStartOption.disabled ? "Недоступно для текущего ключа" : "";
  }
  const safeStartView = value.startView === "owner" && !hasOwnerAccess() ? "session" : value.startView;
  settingsForm.elements.language.value = value.language;
  settingsForm.elements.startView.value = safeStartView;
  for (const name of ["density", "scale", "sessionPlayerMode", "eventLimit"]) settingsForm.elements[name].value = String(value[name]);
  for (const name of ["animations", "showHeader", "showToolbar", "autoAnalyzeToday", "rememberSelection", "notifyMarkedPlayers", "notifyCrashAvatars", "clearOnLogout"]) settingsForm.elements[name].checked = value[name];
  const status = settingsForm.querySelector("[data-settings-status]");
  if (status) status.textContent = "";
}

function focusedElement() {
  const element = document.activeElement;
  return element instanceof HTMLElement && element !== document.body ? element : null;
}

function restoreFocus(element) {
  if (!element) return;
  requestAnimationFrame(() => {
    if (element.isConnected && !element.disabled) element.focus({ preventScroll: true });
  });
}

function focusableElements(container) {
  if (!container) return [];
  return [...container.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden && element.getClientRects().length > 0);
}

function trapFocus(event, container) {
  if (event.key !== "Tab") return false;
  const focusable = focusableElements(container);
  if (!focusable.length) return false;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
    return true;
  }
  if (!event.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
    event.preventDefault();
    first.focus();
    return true;
  }
  return false;
}

function moveTabFocus(event) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return false;
  const current = event.target.closest?.('[role="tab"]');
  const tablist = current?.closest('[role="tablist"]');
  if (!current || !tablist) return false;
  const tabs = [...tablist.querySelectorAll('[role="tab"]')]
    .filter((tab) => tab.closest('[role="tablist"]') === tablist && !tab.disabled && !tab.hidden);
  const currentIndex = tabs.indexOf(current);
  if (currentIndex < 0 || tabs.length < 2) return false;
  let nextIndex = currentIndex;
  if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = tabs.length - 1;
  else nextIndex = (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  event.preventDefault();
  tabs[nextIndex].focus();
  tabs[nextIndex].click();
  return true;
}

function openSettings() {
  settingsReturnFocus = focusedElement();
  fillSettingsForm();
  settingsDialog.showModal();
  settingsForm.elements.startView.focus();
}

function closeSettings() {
  const returnFocus = settingsReturnFocus;
  settingsReturnFocus = null;
  if (settingsDialog?.open) settingsDialog.close();
  restoreFocus(returnFocus);
}

function readSettingsForm() {
  return normalizedUiSettings({
    language: settingsForm.elements.language.value,
    startView: settingsForm.elements.startView.value,
    density: settingsForm.elements.density.value,
    scale: Number(settingsForm.elements.scale.value),
    animations: settingsForm.elements.animations.checked,
    showHeader: settingsForm.elements.showHeader.checked,
    showToolbar: settingsForm.elements.showToolbar.checked,
    sessionPlayerMode: settingsForm.elements.sessionPlayerMode.value,
    eventLimit: Number(settingsForm.elements.eventLimit.value),
    autoAnalyzeToday: settingsForm.elements.autoAnalyzeToday.checked,
    rememberSelection: settingsForm.elements.rememberSelection.checked,
    notifyMarkedPlayers: settingsForm.elements.notifyMarkedPlayers.checked,
    notifyCrashAvatars: settingsForm.elements.notifyCrashAvatars.checked,
    clearOnLogout: settingsForm.elements.clearOnLogout.checked
  });
}

function stopNotificationMonitoring({ clearCache = false } = {}) {
  if (state.notificationRefreshTimer) window.clearInterval(state.notificationRefreshTimer);
  state.notificationRefreshTimer = 0;
  state.notificationRequestId += 1;
  if (clearCache) {
    state.notificationPlayerNotes = [];
    state.notificationAvatarNotes = [];
  }
}

async function refreshNotificationReferences({ announceError = false } = {}) {
  const requests = [];
  if (state.uiSettings.notifyMarkedPlayers) {
    requests.push({
      kind: "players",
      promise: Promise.resolve().then(() => api.listPlayerNotes())
    });
  }
  if (state.uiSettings.notifyCrashAvatars) {
    requests.push({
      kind: "avatars",
      promise: Promise.resolve().then(() => api.listAvatarNotes())
    });
  }
  if (!requests.length) return { ok: true, loaded: 0 };
  const requestId = ++state.notificationRequestId;
  const results = await Promise.allSettled(requests.map((entry) => entry.promise));
  if (requestId !== state.notificationRequestId) return { ok: false, stale: true };
  let loaded = 0;
  let failed = 0;
  results.forEach((result, index) => {
    const kind = requests[index].kind;
    if (result.status === "rejected") {
      failed += 1;
      return;
    }
    loaded += 1;
    if (kind === "players") {
      state.notificationPlayerNotes = (result.value || []).map(noteTools.normalizeNote).filter((row) => row.userId);
    } else {
      state.notificationAvatarNotes = (result.value || []).map((row) => avatarModel.normalizeNote(row)).filter((row) => row.avatarKey);
    }
  });
  if (failed && announceError) {
    setStatus("Не удалось загрузить часть отметок для системных уведомлений. Повторим автоматически.", true);
  }
  return { ok: failed === 0, loaded, failed };
}

async function syncNotificationMonitoring({ refreshNow = false, announceError = false } = {}) {
  stopNotificationMonitoring();
  const enabled = state.uiSettings.notifyMarkedPlayers || state.uiSettings.notifyCrashAvatars;
  if (!enabled) {
    state.notificationPlayerNotes = [];
    state.notificationAvatarNotes = [];
    return;
  }
  state.notificationRefreshTimer = window.setInterval(() => {
    if (!document.hidden) void refreshNotificationReferences();
  }, 60_000);
  if (refreshNow) await refreshNotificationReferences({ announceError });
}

function deliverSystemNotification(payload) {
  if (!api?.showNotification || !payload) return;
  void api.showNotification({ ...payload, title: t(payload.title), body: t(payload.body) }).then((result) => {
    if (result?.unsupported && state.notificationWarning !== "unsupported") {
      state.notificationWarning = "unsupported";
      setStatus("Системные уведомления недоступны в этой версии Windows.", false, { kind: "warning" });
    }
  }).catch(() => {
    if (state.notificationWarning === "failed") return;
    state.notificationWarning = "failed";
    setStatus("Windows не смогла показать системное уведомление.", true);
  });
}

function notifyForEvent(event) {
  if (!notificationModel?.isRecentLiveEvent(event)) return;
  if (state.uiSettings.notifyMarkedPlayers) {
    const note = notificationModel.markedPlayer(event, state.notificationPlayerNotes);
    if (note) {
      deliverSystemNotification({
        key: `player:${event.userId}`,
        title: "Отмеченный игрок вошёл",
        body: `${eventName(event)} · ${adminStatusLabel(note.status)}`
      });
    }
  }
  if (state.uiSettings.notifyCrashAvatars) {
    const note = notificationModel.crashAvatar(event, state.notificationAvatarNotes);
    if (note) {
      deliverSystemNotification({
        key: `avatar:${note.avatarKey || event.avatarId || event.avatarName}`,
        title: "Обнаружен отмеченный аватар",
        body: `${event.avatarName || note.avatarName || event.avatarId || "Неизвестный аватар"} · ${eventName(event)}`
      });
    }
  }
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

function formatVrchatAuthError(error) {
  const message = String(error?.message || error || "");
  if (/VRChat API HTTP 401|HTTP 401/u.test(message)) {
    return "VRChat cookie не подошёл или устарел. Вставьте его в формате auth=authcookie_...";
  }
  if (/not configured|session is invalid/u.test(message)) {
    return "VRChat cookie не указан или недействителен. Скопируйте auth через Cookie-Editor.";
  }
  return message || "Не удалось проверить VRChat аккаунт.";
}

function submittedVrchatCookie() {
  return vrchatAuthCookieInput?.dataset.dirty === "true" ? vrchatAuthCookieInput.value : undefined;
}

function setStoredCookieState(hasStoredCookie) {
  if (!vrchatAuthCookieInput) return;
  vrchatAuthCookieInput.value = "";
  vrchatAuthCookieInput.dataset.dirty = "false";
  vrchatAuthCookieInput.dataset.stored = hasStoredCookie ? "true" : "false";
  vrchatAuthCookieInput.placeholder = hasStoredCookie ? "Cookie сохранён безопасно" : "auth=...";
}

function setAuthorAliasRequested(requested) {
  if (!authorAliasField || !authorAliasInput) return;
  authorAliasField.hidden = !requested;
  authorAliasInput.required = requested;
  if (!requested) authorAliasInput.value = "";
}

function showActivation(message = "Введите данные лицензии.", error = false) {
  stopNotificationMonitoring({ clearCache: true });
  appView.hidden = true;
  activationView.hidden = false;
  setAuthorAliasRequested(false);
  setStoredCookieState(Boolean(state.settings?.hasVrchatAuthCookie));
  setActivationStatus(message, error);
}

function showRuntimeConfigNotice(config) {
  state.runtimeConfig = config && typeof config === "object" ? config : null;
  const notice = state.runtimeConfig?.notice;
  if (!notice?.message) return;
  const isError = notice.level === "error";
  if (appView.hidden) setActivationStatus(String(notice.message), isError);
  else setStatus(String(notice.message), isError, { kind: isError ? "error" : "warning", sticky: true });
}

function ownerLicense() {
  return state.settings?.license || {};
}

function currentTeamId() {
  const license = ownerLicense();
  return String(license.teamId || license.team_id || license.id || "").trim();
}

function canPublishGlobalNotes() {
  return Boolean(ownerLicense().canPublishGlobalNotes);
}

function canRequestOwnerBans() {
  return Boolean(ownerLicense().canRequestGroupBan);
}

function canViewGroupMembers() {
  return Boolean(ownerLicense().canViewGroupMembers);
}

function canManageGroupRoles() {
  return Boolean(ownerLicense().canManageGroupRoles);
}

function canKickGroupMembers() {
  return Boolean(ownerLicense().canKickGroupMembers);
}

function hasOwnerAccess() {
  const license = ownerLicense();
  const hasPermission = canRequestOwnerBans()
    || canViewGroupMembers()
    || canManageGroupRoles()
    || canKickGroupMembers();
  return hasPermission && Boolean(license.moderationGroupId);
}

function syncOwnerAccess() {
  const enabled = hasOwnerAccess();
  if (ownerNavButton) {
    ownerNavButton.hidden = false;
    ownerNavButton.disabled = !enabled;
    ownerNavButton.dataset.locked = enabled ? "false" : "true";
    ownerNavButton.setAttribute("aria-disabled", enabled ? "false" : "true");
    ownerNavButton.title = enabled ? "Управление VRChat-группой" : "Owner недоступен: у этого ключа нет прав владельца";
  }
  const drawerButton = playerDrawer?.querySelector("[data-session-player-owner]");
  if (drawerButton) drawerButton.hidden = !enabled;
  const groupSourceButton = document.querySelector('[data-owner-source="group"]');
  if (groupSourceButton) groupSourceButton.disabled = !canViewGroupMembers();
  const group = document.querySelector("[data-owner-group]");
  if (group) group.textContent = enabled ? `Группа: ${ownerLicense().moderationGroupId}` : "VRChat-группа не настроена";
  if (!enabled && state.view === "owner") selectView("session");
}

async function showApp() {
  activationView.hidden = true;
  appView.hidden = false;
  if (appVersionLabel) {
    appVersionLabel.textContent = state.settings?.appVersion ? `Beta · ${state.settings.appVersion}` : "Beta";
  }
  const latest = await api.latestFile().catch(() => ({ filePath: "" }));
  if (latest.filePath) setFilePath(latest.filePath);
  syncOwnerAccess();
  renderCrash();
  syncBuilderControls();
  if (!state.dashboardClockTimer) {
    state.dashboardClockTimer = window.setInterval(() => {
      if (state.view === "session" && state.sessionSection === "dashboard") updateDashboardClock();
    }, 1000);
  }
  applyUiSettings();
  await api.setCompactMode?.(state.builderCompact).catch(() => {});
  if (state.builderAlwaysOnTop) await api.setAlwaysOnTop?.(true, state.builderOpacity / 100).catch(() => {});
  if (state.builderCompact) selectView("builder");
  else selectView(state.uiSettings.startView === "owner" && !hasOwnerAccess() ? "session" : state.uiSettings.startView);
  if (state.crashEnabled) startCrashAnalyzer();
  setStatus(previewMode ? "Безопасный Chrome preview · вымышленные данные" : "Готово к запуску", false, { record: false });
  showRuntimeConfigNotice(state.runtimeConfig);
  await syncNotificationMonitoring({ refreshNow: true, announceError: true });
  requestAnimationFrame(() => renderSession());
  if (state.uiSettings.autoAnalyzeToday && !previewMode && !state.running) {
    analyzeTodayLogs().catch((error) => setStatus(error.message || "Автоматический анализ логов за сегодня не выполнен.", true));
  }
  if (previewMode) {
    const previewParams = new URLSearchParams(window.location.search);
    const previewScale = Number(previewParams.get("scale"));
    if ([100, 125, 150, 175, 200].includes(previewScale)) state.uiSettings.scale = previewScale;
    if (previewParams.get("header") === "0") state.uiSettings.showHeader = false;
    if (previewParams.get("toolbar") === "0") state.uiSettings.showToolbar = false;
    if (previewParams.get("animations") === "0") state.uiSettings.animations = false;
    applyUiSettings();
    if (previewParams.get("compact") === "1") {
      state.builderCompact = true;
      syncBuilderControls();
    }
    if (["feed", "avatars", "dashboard"].includes(previewParams.get("section"))) state.sessionSection = previewParams.get("section");
    if (previewParams.get("seed") === "1") await startTail();
    const previewView = previewParams.get("view");
    if (previewView === "owner" && previewParams.get("source") === "group") state.ownerSource = "group";
    if (previewView && viewTitles[previewView]) selectView(previewView);
    if (previewView === "builder" && ["columns", "vr", "feed"].includes(previewParams.get("builderPreset"))) {
      if (builderPreset) builderPreset.value = previewParams.get("builderPreset");
      applyBuilderPreset(previewParams.get("builderPreset"));
    }
    if (previewParams.get("status") === "error") setStatus("API HTTP 503", true, { sticky: true });
    if (previewParams.get("notifications") === "1") {
      setStatus("Снимок сессии скопирован.", false, { kind: "success", sticky: true });
      setStatus("Проверка обновления займёт немного времени.", false, { kind: "warning", sticky: true });
      setStatus("API HTTP 503", true, { sticky: true });
      setStatusCenter(true);
    }
    const previewBusyAction = previewParams.get("busy");
    if (ACTION_PENDING_LABELS[previewBusyAction]) {
      const previewBusyButton = [...document.querySelectorAll("[data-action]")].find((button) => button.dataset.action === previewBusyAction);
      if (previewBusyButton) void runButtonOperation(previewBusyButton, () => new Promise(() => {}), ACTION_PENDING_LABELS[previewBusyAction]);
    }
    if (previewParams.get("settings") === "1") setTimeout(() => openSettings(), 200);
    if (previewView === "session" && state.sessionSection === "avatars") await refreshAvatars();
    if (previewView === "session" && state.sessionSection === "avatars" && previewParams.get("onlineAvatarSearch") === "1") {
      avatarSearch.value = previewParams.get("avatarSearch") || "Night";
      state.avatarQuery = avatarSearch.value;
      await searchOnlineAvatars();
    }
    const previewAvatar = previewParams.get("avatar");
    if (previewView === "session" && state.sessionSection === "avatars" && previewAvatar) {
      state.selectedAvatarKey = previewAvatar;
      renderAvatarSession();
    }
    if (previewView === "owner" && state.ownerSource === "group") await requestOwnerGroupMembers();
    const previewPlayer = previewParams.get("player");
    if (previewView === "admin" && previewPlayer) {
      state.selectedAdminUserId = previewPlayer;
      setTimeout(() => {
        renderAdminList(true);
        renderAdminCard();
        if (adminNote(previewPlayer)) void loadAdminHistory(previewPlayer);
      }, 500);
    }
    if (previewView === "owner" && previewPlayer) {
      state.ownerSelectedUserId = previewPlayer;
      setTimeout(() => {
        renderOwner(true);
        const moderation = previewParams.get("moderation");
        if (moderation && ownerPlayer(previewPlayer)) openOwnerModerationDialog(moderation);
      }, 500);
    }
    if (previewView === "crash" && previewParams.get("incident") === "1") {
      state.crashEnabled = true;
      startCrashAnalyzer();
      renderCrash();
      setTimeout(() => captureLagSnapshot().catch(() => {}), 500);
    }
  }
}

function createPreviewApi() {
  const handlers = { log: [], status: [], error: [], analysis: [], rotation: [], user: [], runtime: [] };
  let previewHasVrchatAuthCookie = false;
  let previewNotes = [
    { userId: "usr_demo_nova", displayName: "Nova", status: "watch", note: "Вежливо напомнить правила", updatedAt: "2026-08-01T20:35:00.000Z", updatedByKey: "VRC-PREVIEW", updatedByLabel: "Beta Preview" },
    { userId: "usr_demo_mira", displayName: "Mira", status: "ok", note: "Проверенный участник", updatedAt: "2026-08-01T20:20:00.000Z", updatedByKey: "VRC-PREVIEW", updatedByLabel: "Beta Preview" }
  ];
  let previewGlobalNotes = [
    { sourceTeamId: "team_preview_other", userId: "usr_demo_nova", displayName: "Nova", status: "watch", note: "Замечен на нескольких мероприятиях", updatedAt: "2026-08-01T19:30:00.000Z", updatedByLabel: "Другая команда" }
  ];
  let previewAvatarCatalog = [
    { avatarName: "Night Shift", avatarId: "avtr_12345678", seenCount: 3, updatedAt: "2026-08-01T21:40:00.000Z" },
    { avatarName: "Sunrise Lounge", avatarId: "avtr_87654321", seenCount: 1, updatedAt: "2026-08-01T18:20:00.000Z" }
  ];
  let previewAvatarNotes = [
    { avatarKey: "id:avtr_12345678", avatarName: "Night Shift", avatarId: "avtr_12345678", status: "crash", note: "Проверить производительность", updatedAt: "2026-08-01T21:41:00.000Z", updatedByLabel: "Beta Preview" }
  ];
  let previewGlobalAvatarNotes = [
    { sourceTeamId: "team_preview_other", avatarKey: "id:avtr_12345678", avatarName: "Night Shift", avatarId: "avtr_12345678", status: "crash", note: "Зафиксированы сильные просадки FPS", updatedAt: "2026-08-01T20:10:00.000Z", updatedByLabel: "Другая команда" }
  ];
  const previewHistory = {
    usr_demo_nova: [
      { id: "preview-history-1", visibility: "team", previousStatus: "ok", previousNote: "", status: "watch", note: "Вежливо напомнить правила", updatedAt: "2026-08-01T20:35:00.000Z", updatedByKey: "VRC-PREVIEW", updatedByLabel: "Beta Preview" }
    ],
    usr_demo_mira: []
  };
  const previewGroupRoles = [
    { id: "grol_member", name: "Member", isManagementRole: false },
    { id: "grol_trusted", name: "Trusted", isManagementRole: false },
    { id: "grol_moderator", name: "Moderator", isManagementRole: true }
  ];
  let previewGroupMembers = [
    { userId: "usr_demo_mira", displayName: "Mira", membershipStatus: "member", roleIds: ["grol_member", "grol_trusted"], managerNotes: "Проверена на общем ивенте." },
    { userId: "usr_demo_nova", displayName: "Nova", membershipStatus: "member", roleIds: ["grol_member"], managerNotes: "" }
  ];
  let previewGroupRequests = [];
  const previewNow = Date.now();
  const regularSampleEvents = [
    { type: "world-joined", worldName: "Group Public", timestamp: new Date(previewNow - 75_000).toISOString() },
    { type: "player-joined", playerName: "Nova", userId: "usr_demo_nova", timestamp: new Date(previewNow - 50_000).toISOString() },
    { type: "player-joined", playerName: "Mira", userId: "usr_demo_mira", timestamp: new Date(previewNow - 32_000).toISOString() },
    { type: "avatar-changed", playerName: "Mira", avatarName: "Night Shift", timestamp: new Date(previewNow - 12_000).toISOString() },
    { type: "avatar-data", playerName: "Mira", avatarName: "Night Shift", avatarId: "avtr_12345678", timestamp: new Date(previewNow - 8_000).toISOString() }
  ];
  const stressPlayers = Array.from({ length: 1000 }, (_, index) => ({
    type: "player-joined",
    playerName: `Preview Player ${String(index + 1).padStart(4, "0")}`,
    userId: `usr_preview_${String(index + 1).padStart(4, "0")}`,
    timestamp: new Date(Date.parse("2026-08-01T21:42:00.000Z") + index * 1000).toISOString()
  }));
  const sampleEvents = stressPreviewMode
    ? [{ type: "world-joined", worldName: "Stress Preview", timestamp: "2026-08-01T21:41:00.000Z" }, ...stressPlayers, ...stressPlayers.map((player, index) => ({ ...player, type: "avatar-changed", avatarName: `Avatar ${index + 1}` }))].slice(0, 2000)
    : regularSampleEvents;
  function emitSampleEvents() {
    if (stressPreviewMode) {
      setTimeout(() => sampleEvents.forEach((event) => handlers.log.forEach((handler) => handler(event))), 0);
      return;
    }
    sampleEvents.forEach((event, index) => setTimeout(() => handlers.log.forEach((handler) => handler(event)), index * 80));
  }
  return {
    getSettings: async () => ({
      appVersion: "1.2.0-beta.5",
      hasSession: !activationPreviewMode,
      hasVrchatAuthCookie: previewHasVrchatAuthCookie,
      serverUrl: "https://api.vrchatadmintools.ru",
      license: {
        teamId: "team_preview_beta",
        authorAlias: "Beta Preview",
        canPublishGlobalNotes: true,
        canViewFullAvatarCatalog: true,
        moderationGroupId: lockedOwnerPreviewMode ? "" : "grp_preview_full_white",
        canRequestGroupBan: !lockedOwnerPreviewMode,
        canViewGroupMembers: !lockedOwnerPreviewMode,
        canManageGroupRoles: !lockedOwnerPreviewMode,
        canKickGroupMembers: !lockedOwnerPreviewMode
      }
    }),
    getRuntimeConfig: async () => ({ revision: 1, notice: null, source: "preview" }),
    importStableSettings: async () => ({ imported: true, reason: "stable_settings_imported" }),
    saveSettings: async (settings = {}) => {
      if (settings.vrchatAuthCookie !== undefined) previewHasVrchatAuthCookie = Boolean(settings.vrchatAuthCookie);
      return { hasVrchatAuthCookie: previewHasVrchatAuthCookie };
    },
    validate: async () => ({ ok: true }),
    activate: async () => ({ ok: true }),
    logout: async () => ({ ok: true }),
    getVrchatCurrentUser: async () => ({ id: "usr_demo_current", displayName: "Rose337" }),
    getVrchatCurrentInstance: async () => ({ worldName: "Group Public", nUsers: 5, capacity: 40 }),
    latestFile: async () => ({ filePath: "C:\\VRChat\\output_log_preview.txt" }),
    chooseFile: async () => ({ filePath: "C:\\VRChat\\output_log_preview.txt" }),
    prepareAnalyzeOptions: async ({ filePath }) => ({ filePath, sourceLabel: "текущий лог", loadProfileLabel: "быстро", canceled: false }),
    analyzeCurrentInstance: async ({ filePath }) => {
      handlers.analysis.forEach((handler) => handler({}));
      handlers.status.forEach((handler) => handler({ running: true, filePath }));
      emitSampleEvents();
      return { followState: { running: true }, currentInstance: { worldName: "Group Public", nUsers: 3, capacity: 40 }, playSessionId: "preview-analyze" };
    },
    writeClipboardText: async () => ({ ok: true }),
    showNotification: async () => ({ ok: true }),
    installUpdate: async () => ({ ok: true }),
    setAlwaysOnTop: async (enabled, opacity) => ({ enabled, opacity }),
    setWindowOpacity: async (opacity) => ({ opacity }),
    setCompactMode: async (enabled) => ({ enabled }),
    startTail: async () => {
      handlers.status.forEach((handler) => handler({ running: true, filePath: "C:\\VRChat\\output_log_preview.txt" }));
      emitSampleEvents();
      return { filePath: "C:\\VRChat\\output_log_preview.txt", playSessionId: "preview" };
    },
    updatePlaySession: async (stats) => ({ ok: true, stats }),
    stopTail: async () => {
      handlers.status.forEach((handler) => handler({ running: false }));
      return { ok: true };
    },
    listPlaySessions: async () => [
      { id: "preview-session-1", startedAt: "2026-08-08T20:30:00.000Z", endedAt: "2026-08-08T22:00:00.000Z", worldName: "Group Public", snapshot: JSON.stringify({ players: [{ userId: "usr_demo_nova", displayName: "Nova" }, { userId: "usr_demo_mira", displayName: "Mira" }] }) },
      { id: "preview-session-1", startedAt: "2026-08-08T20:30:00.000Z", endedAt: "2026-08-08T21:15:00.000Z", worldName: "Group Public", snapshot: JSON.stringify({ players: [{ userId: "usr_demo_nova", displayName: "Nova" }] }) },
      { id: "preview-session-2", startedAt: "2026-08-07T18:00:00.000Z", endedAt: "2026-08-07T19:15:00.000Z", worldName: "The Great Pug", snapshot: JSON.stringify({ players: [{ userId: "usr_demo_nova", displayName: "Nova" }, { userId: "usr_demo_alex", displayName: "Alex" }] }) },
      { id: "preview-session-3", startedAt: "2026-08-05T21:10:00.000Z", endedAt: "2026-08-05T22:00:00.000Z", worldName: "Midnight Rooftop", snapshot: JSON.stringify({ players: [{ userId: "usr_demo_mira", displayName: "Mira" }] }) }
    ],
    listPlayerNotes: async () => previewNotes.map((row) => ({ ...row })),
    listGlobalPlayerNotes: async () => previewGlobalNotes.map((row) => ({ ...row })),
    saveGlobalPlayerNote: async (payload) => {
      const saved = { ...payload, sourceTeamId: "team_preview_beta", updatedAt: new Date().toISOString(), updatedByKey: "VRC-PREVIEW", updatedByLabel: "Beta Preview" };
      previewGlobalNotes = [saved, ...previewGlobalNotes.filter((row) => row.userId !== payload.userId || row.sourceTeamId !== saved.sourceTeamId)];
      return { ...saved };
    },
    removeGlobalPlayerNote: async (userId) => {
      previewGlobalNotes = previewGlobalNotes.filter((row) => row.userId !== userId || row.sourceTeamId !== "team_preview_beta");
      return { ok: true };
    },
    listAvatarCatalog: async () => previewAvatarCatalog.map((row) => ({ ...row })),
    saveAvatarCatalog: async (entry) => {
      const saved = { ...entry, seenCount: 1, updatedAt: new Date().toISOString() };
      previewAvatarCatalog = [saved, ...previewAvatarCatalog.filter((row) => row.avatarId !== saved.avatarId)];
      return { avatar: { ...saved } };
    },
    listAvatarNotes: async () => previewAvatarNotes.map((row) => ({ ...row })),
    saveAvatarNote: async (note) => {
      const saved = { ...note, updatedAt: new Date().toISOString(), updatedByKey: "VRC-PREVIEW", updatedByLabel: "Beta Preview" };
      previewAvatarNotes = [saved, ...previewAvatarNotes.filter((row) => row.avatarKey !== saved.avatarKey)];
      return { ...saved };
    },
    listGlobalAvatarNotes: async () => previewGlobalAvatarNotes.map((row) => ({ ...row })),
    saveGlobalAvatarNote: async (note) => {
      const saved = { ...note, avatarKey: `id:${note.avatarId}`, sourceTeamId: "team_preview_beta", updatedAt: new Date().toISOString(), updatedByLabel: "Beta Preview" };
      previewGlobalAvatarNotes = [saved, ...previewGlobalAvatarNotes.filter((row) => row.avatarId !== note.avatarId || row.sourceTeamId !== saved.sourceTeamId)];
      return { ...saved };
    },
    removeGlobalAvatarNote: async (avatarId) => {
      previewGlobalAvatarNotes = previewGlobalAvatarNotes.filter((row) => row.avatarId !== avatarId || row.sourceTeamId !== "team_preview_beta");
      return { ok: true };
    },
    resolveVrchatAvatar: async (avatarId) => ({ avatarId, avatarName: previewAvatarCatalog.find((row) => row.avatarId === avatarId)?.avatarName || "Resolved Avatar" }),
    findVrchatAvatarCandidates: async (avatarName) => ({ candidates: [{ avatarName, avatarId: "avtr_candidate_1" }, { avatarName, avatarId: "avtr_candidate_2" }] }),
    searchVrchatAvatars: async (query) => ({
      query,
      scope: ["favorite", "own", "licensed"],
      candidates: [
        { avatarName: `${query} Night`, avatarId: "avtr_preview_search_1", authorName: "Preview Author", releaseStatus: "public", canFavorite: true, sources: ["favorite"] },
        { avatarName: `${query} Studio`, avatarId: "avtr_preview_search_2", authorName: "Demo Creator", releaseStatus: "private", canFavorite: false, sources: ["own"] }
      ]
    }),
    favoriteVrchatAvatar: async (avatarId) => ({ avatarId, favoriteGroup: "avatars1", alreadyFavorite: false }),
    readTodayPlayers: async () => ({
      fileCount: 3,
      players: [
        { userId: "usr_demo_nova", displayName: "Nova", lastSeenAt: "2026-08-01T21:42:00.000Z" },
        { userId: "usr_demo_mira", displayName: "Mira", lastSeenAt: "2026-08-01T21:43:00.000Z" },
        { userId: "usr_demo_alex", displayName: "Alex", lastSeenAt: "2026-08-01T18:15:00.000Z" }
      ]
    }),
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
    requestGroupBan: async (request) => ({ id: `preview-ban-${Date.now()}`, action: "ban", status: "pending", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...request }),
    requestGroupUnban: async (request) => ({ id: `preview-unban-${Date.now()}`, action: "unban", status: "pending", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...request }),
    listGroupBanRequests: async () => [],
    retryGroupBanRequest: async (requestId) => ({ id: requestId, action: "ban", status: "pending", updatedAt: new Date().toISOString() }),
    requestGroupManagement: async (request) => {
      let result = { roles: previewGroupRoles };
      if (request.action === "list_members") {
        const query = String(request.query || "").toLocaleLowerCase(uiLocale());
        const members = previewGroupMembers.filter((member) => !query || member.displayName.toLocaleLowerCase(uiLocale()).includes(query) || member.userId.includes(query));
        result = { members, roles: previewGroupRoles, total: members.length, offset: 0, limit: 100, query, hasMore: false };
      } else {
        const member = previewGroupMembers.find((row) => row.userId === request.targetUserId);
        if (request.action === "get_member") result = { member, roles: previewGroupRoles };
        if (member && request.action === "add_role" && !member.roleIds.includes(request.roleId)) member.roleIds.push(request.roleId);
        if (member && request.action === "remove_role") member.roleIds = member.roleIds.filter((id) => id !== request.roleId);
        if (member && request.action === "update_manager_notes") member.managerNotes = String(request.managerNotes || "");
        if (request.action === "kick_member") previewGroupMembers = previewGroupMembers.filter((row) => row.userId !== request.targetUserId);
        result = { member: request.action === "kick_member" ? null : member, roles: previewGroupRoles };
      }
      const queued = { id: `preview-group-${Date.now()}-${previewGroupRequests.length}`, status: "succeeded", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...request, result };
      previewGroupRequests = [queued, ...previewGroupRequests];
      return { ...queued };
    },
    listGroupManagementRequests: async () => previewGroupRequests.map((request) => ({ ...request })),
    openExternal: async () => ({ ok: true }),
    getCrashStatus: async () => ({ processRunning: true, filePath: "C:\\VRChat\\output_log_preview.txt", logModifiedAt: new Date().toISOString() }),
    onLogEvent: (handler) => handlers.log.push(handler),
    onTailStatus: (handler) => handlers.status.push(handler),
    onTailRotation: (handler) => handlers.rotation.push(handler),
    onTailError: (handler) => handlers.error.push(handler),
    onAnalysisStart: (handler) => handlers.analysis.push(handler),
    onUserResolved: (handler) => handlers.user.push(handler),
    onUpdaterStatus: () => {},
    onRuntimeConfig: (handler) => handlers.runtime.push(handler)
  };
}

function setFilePath(filePath) {
  state.filePath = String(filePath || "");
  filePathLabel.textContent = state.filePath || "Лог ещё не выбран";
  filePathLabel.title = state.filePath;
}

function eventTime(event) {
  const date = new Date(event.timestamp || event.capturedAt || Date.now());
  return Number.isNaN(date.getTime()) ? "--:--" : date.toLocaleTimeString(uiLocale(), { hour: "2-digit", minute: "2-digit" });
}

function eventName(event) {
  const profile = event?.userId ? state.profiles.get(String(event.userId)) : null;
  return String(profile?.displayName || event.display || event.playerName || event.worldName || event.avatarName || "Событие");
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

function eventFilterKind(event) {
  const type = String(event?.type || "");
  if (type === "player-joined") return "joins";
  if (type === "player-left") return "leaves";
  if (type === "avatar-changed" || type === "avatar-data") return "avatars";
  if (type.startsWith("world-") || type.includes("portal")) return "worlds";
  return "other";
}

function visibleSessionEvents(events = state.events) {
  const filters = state.sessionEventFilters;
  const rows = filters.includes("all")
    ? events
    : events.filter((event) => filters.includes(eventFilterKind(event)));
  return [...rows].reverse();
}

function syncSessionEventFilters() {
  document.querySelectorAll("[data-session-event-filter]").forEach((button) => {
    const filter = button.dataset.sessionEventFilter;
    const active = state.sessionEventFilters.includes("all") ? filter === "all" : state.sessionEventFilters.includes(filter);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function toggleSessionEventFilter(filter) {
  if (filter === "all") {
    state.sessionEventFilters = ["all"];
  } else if (SESSION_EVENT_FILTERS.includes(filter)) {
    const selected = state.sessionEventFilters.filter((value) => value !== "all");
    state.sessionEventFilters = selected.includes(filter)
      ? selected.filter((value) => value !== filter)
      : [...selected, filter];
    if (!state.sessionEventFilters.length) state.sessionEventFilters = ["all"];
  } else {
    return;
  }
  localStorage.setItem("betaSessionEventFilters", JSON.stringify(state.sessionEventFilters));
  renderSession();
}

function eventTimestampMs(event) {
  const value = new Date(event?.timestamp || event?.capturedAt || "").getTime();
  return Number.isFinite(value) ? value : 0;
}

function dashboardDurationMs(now = Date.now()) {
  let firstEventAt = 0;
  let lastEventAt = 0;
  for (const event of state.events) {
    const timestamp = eventTimestampMs(event);
    if (!timestamp) continue;
    if (!firstEventAt || timestamp < firstEventAt) firstEventAt = timestamp;
    if (timestamp > lastEventAt) lastEventAt = timestamp;
  }
  const startedAt = firstEventAt || state.startedAt || 0;
  if (!startedAt) return 0;
  const endedAt = state.running ? now : state.stoppedAt || lastEventAt || startedAt;
  return Math.max(0, endedAt - startedAt);
}

function updateDashboardClock() {
  if (dashboardDuration) dashboardDuration.textContent = formatDuration(dashboardDurationMs());
}

function sessionStats() {
  return sessionModel.buildSessionStats(state.events);
}

function currentPlaySessionStats() {
  const notes = [...state.notificationPlayerNotes, ...state.adminNotes];
  const stats = sessionModel.buildPlaySessionStats(state.events, notes);
  stats.snapshot.players = stats.snapshot.players.map((player) => ({
    ...player,
    displayName: state.profiles.get(player.userId)?.displayName || player.displayName
  }));
  return stats;
}

function schedulePlaySessionSync(delayMs) {
  if (state.playSessionSyncTimer || !state.running) return;
  state.playSessionSyncTimer = window.setTimeout(() => {
    state.playSessionSyncTimer = 0;
    void syncCurrentPlaySession();
  }, Math.max(250, Number(delayMs) || 15_000));
}

async function syncCurrentPlaySession({ force = false, announceError = false } = {}) {
  if (!state.running || !api?.updatePlaySession) return true;
  if (force && state.playSessionSyncTimer) {
    window.clearTimeout(state.playSessionSyncTimer);
    state.playSessionSyncTimer = 0;
  }
  const elapsed = Date.now() - state.playSessionLastSyncAt;
  if (!force && elapsed < 15_000) {
    schedulePlaySessionSync(15_000 - elapsed);
    return true;
  }
  if (state.playSessionSyncPromise) return force ? state.playSessionSyncPromise : true;
  state.playSessionDirty = false;
  const operation = (async () => {
    try {
      const result = await api.updatePlaySession(currentPlaySessionStats());
      state.playSessionLastSyncAt = Date.now();
      if (result?.playSessionId) state.currentPlaySessionId = String(result.playSessionId);
      if (result?.ok === false) {
        state.playSessionDirty = true;
        schedulePlaySessionSync(60_000);
        if (announceError && state.playSessionSyncWarning !== "failed") {
          state.playSessionSyncWarning = "failed";
          setStatus("Текущая сессия пока не синхронизирована. Локальный мониторинг продолжает работать.", true);
        }
        return false;
      }
      state.playSessionSyncWarning = "";
      return true;
    } catch {
      state.playSessionLastSyncAt = Date.now();
      state.playSessionDirty = true;
      schedulePlaySessionSync(60_000);
      if (announceError && state.playSessionSyncWarning !== "failed") {
        state.playSessionSyncWarning = "failed";
        setStatus("Не удалось обновить текущую сессию на сервере. Повторим при следующем обновлении.", true);
      }
      return false;
    }
  })();
  state.playSessionSyncPromise = operation;
  try {
    return await operation;
  } finally {
    if (state.playSessionSyncPromise === operation) state.playSessionSyncPromise = null;
    if (state.playSessionDirty) schedulePlaySessionSync(15_000);
  }
}

function visibleSessionPlayers(players) {
  return sessionModel.filterPlayers(players, state.sessionPlayerMode, state.sessionPlayerQuery);
}

function eventRowElement(event) {
  const row = document.createElement("div");
  row.className = `eventRow${event.type === "player-left" ? " left" : event.type?.startsWith("world-") ? " world" : ""}`;
  row.dataset.eventType = String(event.type || "unknown");
  const time = document.createElement("time");
  time.textContent = eventTime(event);
  const dot = document.createElement("i");
  const name = document.createElement("div");
  name.className = "eventIdentity";
  const playerName = eventName(event);
  const linkedPlayer = sessionStats().players.find((player) => sessionModel.eventBelongsToPlayer(event, player));
  if (linkedPlayer?.userId) {
    const player = document.createElement("button");
    player.type = "button";
    player.className = "eventTextLink eventPlayerLink";
    player.dataset.eventUserId = String(linkedPlayer.userId);
    player.dataset.eventUserName = playerName;
    setUserText(player, playerName);
    player.title = `Открыть ${playerName} в Admin Tools`;
    name.append(player);
  } else {
    name.append(userTextElement("strong", "eventName", playerName));
  }
  name.append(document.createTextNode(" · "), adminElement("strong", "eventKind", eventKind(event)));
  let detail = document.createElement("span");
  const detailText = eventDetail(event);
  const avatarKey = (event.type === "avatar-changed" || event.type === "avatar-data")
    ? avatarModel.key(event.avatarName, event.avatarId)
    : "";
  if (avatarKey) {
    detail = document.createElement("button");
    detail.type = "button";
    detail.className = "eventTextLink eventAvatarLink";
    detail.dataset.eventAvatarKey = avatarKey;
    detail.title = "Открыть аватар в каталоге";
  }
  if (detailText !== "—") setUserText(detail, detailText);
  else detail.textContent = detailText;
  row.append(time, dot, name, detail);
  return row;
}

function playerMarker(online = false, large = false) {
  const marker = document.createElement("span");
  marker.className = `${large ? "profileAvatar" : "playerAvatar"} playerMarker`;
  marker.dataset.online = online ? "true" : "false";
  marker.setAttribute("aria-hidden", "true");
  return marker;
}

function playerRowElement(event) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = `playerRow sessionPlayerButton${event.online ? "" : " offline"}`;
  row.dataset.sessionPlayerId = event.userId;
  row.setAttribute("aria-label", `Открыть игрока ${eventName(event)}`);
  const avatar = playerMarker(Boolean(event.online));
  const copy = document.createElement("div");
  const name = document.createElement("strong");
  setUserText(name, eventName(event));
  const id = document.createElement("span");
  id.textContent = event.userId || "ID не найден";
  copy.append(name, id);
  const badge = document.createElement("em");
  badge.textContent = event.online ? "онлайн" : "не в сети";
  row.append(avatar, copy, badge);
  return row;
}

function renderVirtualRows(container, items, rowHeight, createRow, emptyText, force = false) {
  if (!items.length) {
    container.replaceChildren(emptyMessage(emptyText));
    delete container.dataset.virtualStart;
    delete container.dataset.virtualEnd;
    delete container.dataset.virtualTotal;
    return;
  }
  const range = sessionModel.virtualWindow({
    total: items.length,
    scrollTop: container.scrollTop,
    viewportHeight: container.clientHeight,
    rowHeight,
    overscan: 5
  });
  if (!force
    && container.dataset.virtualStart === String(range.start)
    && container.dataset.virtualEnd === String(range.end)
    && container.dataset.virtualTotal === String(items.length)) return;

  const scrollTop = container.scrollTop;
  const spacer = document.createElement("div");
  spacer.className = "virtualListSpacer";
  spacer.style.height = `${range.totalHeight}px`;
  const windowElement = document.createElement("div");
  windowElement.className = "virtualListWindow";
  windowElement.style.transform = `translateY(${range.offset}px)`;
  const fragment = document.createDocumentFragment();
  for (let index = range.start; index < range.end; index += 1) fragment.append(createRow(items[index]));
  windowElement.append(fragment);
  spacer.append(windowElement);
  container.replaceChildren(spacer);
  container.scrollTop = scrollTop;
  container.dataset.virtualStart = String(range.start);
  container.dataset.virtualEnd = String(range.end);
  container.dataset.virtualTotal = String(items.length);
}

function renderVirtualEventRows(force = false) {
  const emptyText = state.events.length
    ? "Событий выбранных типов пока нет."
    : "Запустите чтение лога — новые события появятся здесь.";
  renderVirtualRows(eventFeed, state.sessionVisibleEvents, 54, eventRowElement, emptyText, force);
}

function renderVirtualPlayerRows(force = false) {
  const emptyText = state.sessionPlayerQuery ? "По этому запросу игроки не найдены." : "Пока никого нет.";
  renderVirtualRows(playerList, state.sessionVisiblePlayers, 58, playerRowElement, emptyText, force);
}

function scheduleSessionRender() {
  if (state.sessionRenderFrame) return;
  state.sessionRenderFrame = requestAnimationFrame(() => {
    state.sessionRenderFrame = 0;
    renderSession();
  });
}

function scheduleAdminRender() {
  if (state.adminRenderFrame) return;
  state.adminRenderFrame = requestAnimationFrame(() => {
    state.adminRenderFrame = 0;
    renderAdminList();
  });
}

function setSessionSection(section) {
  if (!["feed", "avatars", "dashboard"].includes(section)) return;
  state.sessionSection = section;
  localStorage.setItem("betaSessionSection", section);
  renderSession();
  if (section === "avatars") void refreshAvatars();
  if (section === "feed") requestAnimationFrame(() => {
    renderVirtualEventRows(true);
    renderVirtualPlayerRows(true);
  });
}

function openAvatarFromEvent(avatarKey) {
  const key = String(avatarKey || "");
  if (!key) return;
  state.avatarQuery = "";
  state.avatarFilter = "all";
  state.selectedAvatarKey = key;
  state.avatarCandidates = [];
  state.avatarError = "";
  if (avatarSearch) avatarSearch.value = "";
  if (avatarFilter) avatarFilter.value = "all";
  rememberSelections();
  selectView("session");
  setSessionSection("avatars");
}

function avatarRowElement(row) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = `avatarSessionRow${row.status === "crash" ? " crash" : ""}`;
  element.dataset.avatarKey = row.avatarKey;
  element.classList.toggle("active", row.avatarKey === state.selectedAvatarKey);
  const avatar = document.createElement("span");
  avatar.className = "playerAvatar";
  setUserText(avatar, row.avatarName.slice(0, 1).toUpperCase() || "A");
  const copy = document.createElement("div");
  const name = document.createElement("strong");
  setUserText(name, row.avatarName);
  const meta = document.createElement("span");
  appendSeparated(meta, [
    row.playerName ? { text: row.playerName, user: true } : { text: "Каталог" },
    row.avatarId ? { text: row.avatarId, user: true } : { text: "ID не найден" },
    row.note ? { text: row.note, user: true } : null
  ]);
  copy.append(name, meta);
  const time = document.createElement("time");
  time.textContent = row.status === "crash" ? "crash" : (row.timestamp ? eventTime(row) : `${Number(row.seenCount || 1)}×`);
  element.append(avatar, copy, time);
  return element;
}

function renderAvatarRows(force = false) {
  renderVirtualRows(avatarSessionList, state.avatarVisibleRows, 68, avatarRowElement, state.avatarQuery ? "Аватары по запросу не найдены." : "Событий аватаров пока нет.", force);
}

function renderAvatarSession() {
  const summary = sessionModel.buildAvatarSummary(state.events);
  state.avatarRows = avatarModel.buildRows(state.events, state.avatarCatalog, state.avatarNotes);
  state.avatarVisibleRows = avatarModel.filterRows(state.avatarRows, state.avatarQuery, state.avatarFilter);
  state.sessionAvatarRows = state.avatarVisibleRows;
  for (const [key, value] of Object.entries({ events: summary.events, unique: summary.unique, resolved: summary.resolved, players: summary.players })) {
    const target = document.querySelector(`[data-avatar-metric="${key}"]`);
    if (target) target.textContent = String(value);
  }
  const count = document.querySelector("[data-avatar-count]");
  if (count) count.textContent = state.avatarLoading ? "загрузка…" : `${state.avatarVisibleRows.length} записей`;
  const scope = document.querySelector("[data-avatar-catalog-scope]");
  if (scope) {
    const fullCatalog = Boolean(state.settings?.license?.canViewFullAvatarCatalog);
    scope.textContent = fullCatalog ? "Каталог команды" : "Личный каталог";
    scope.classList.toggle("full", fullCatalog);
    scope.title = fullCatalog
      ? "Ключу разрешено видеть весь каталог команды"
      : "Показаны записи, созданные этим ключом";
  }
  renderAvatarRows(true);
  renderAvatarDetail();
  renderAvatarOnlineResults();
}

function avatarSourceLabel(sources = []) {
  const labels = { favorite: "избранное", own: "ваши", licensed: "лицензированные" };
  return [...new Set(sources)].map((source) => labels[source] || source).join(" · ") || "VRChat";
}

function renderAvatarOnlineResults() {
  if (!avatarOnlineResults) return;
  const visible = state.avatarOnlineLoading || state.avatarOnlineError || state.avatarOnlineQuery;
  avatarOnlineResults.hidden = !visible;
  avatarOnlineResults.replaceChildren();
  if (!visible) return;

  const header = adminElement("header");
  const heading = adminElement("div");
  heading.append(
    adminElement("span", "eyebrow", "Расширенный поиск VRChat"),
    adminElement("h3", "", state.avatarOnlineQuery ? `Результаты для «${state.avatarOnlineQuery}»` : "Результаты")
  );
  header.append(heading, adminElement("span", "", state.avatarOnlineLoading ? "поиск…" : `${state.avatarOnlineRows.length} найдено`));
  avatarOnlineResults.append(header);

  if (state.avatarOnlineLoading) {
    avatarOnlineResults.append(emptyMessage("Ищем среди ваших, избранных и лицензированных аватаров…"));
    return;
  }
  if (state.avatarOnlineError) {
    avatarOnlineResults.append(adminElement("p", "adminError", state.avatarOnlineError));
    return;
  }
  if (!state.avatarOnlineRows.length) {
    avatarOnlineResults.append(emptyMessage("Совпадений в доступных источниках VRChat не найдено."));
    return;
  }

  const list = adminElement("div", "avatarOnlineList");
  for (const row of state.avatarOnlineRows) {
    const item = adminElement("article", "avatarOnlineRow");
    const copy = adminElement("div");
    copy.append(
      userTextElement("strong", "", row.avatarName || row.avatarId),
      userTextElement("span", "", row.authorName || "Автор не указан"),
      adminElement("em", "", avatarSourceLabel(row.sources))
    );
    const copyability = adminElement("span", `avatarCopyability ${row.canFavorite ? "available" : "unknown"}`, row.canFavorite ? "публичный" : "доступ не подтверждён");
    const actions = adminElement("div", "avatarOnlineActions");
    const add = adminElement("button", "", "В каталог");
    add.type = "button";
    add.dataset.avatarOnlineAdd = row.avatarId;
    const open = adminElement("button", "", "Страница");
    open.type = "button";
    open.dataset.avatarOpen = row.avatarId;
    actions.append(add);
    if (row.canFavorite && api.favoriteVrchatAvatar) {
      const favorite = adminElement("button", "primaryButton", "В избранное");
      favorite.type = "button";
      favorite.dataset.avatarOnlineFavorite = row.avatarId;
      actions.append(favorite);
    }
    actions.append(open);
    item.append(copy, copyability, actions);
    list.append(item);
  }
  avatarOnlineResults.append(list);
}

async function searchOnlineAvatars() {
  const query = String(avatarSearch?.value || "").trim();
  if (query.length < 2) throw new Error("Для расширенного поиска введите хотя бы 2 символа.");
  if (!api.searchVrchatAvatars) throw new Error("Расширенный поиск недоступен в этой сборке.");
  state.avatarOnlineQuery = query;
  state.avatarOnlineRows = [];
  state.avatarOnlineError = "";
  state.avatarOnlineLoading = true;
  renderAvatarOnlineResults();
  try {
    const result = await api.searchVrchatAvatars(query);
    state.avatarOnlineRows = Array.isArray(result?.candidates) ? result.candidates : [];
    setStatus(`Расширенный поиск завершён: ${state.avatarOnlineRows.length} результатов.`, false, { kind: "success" });
  } catch (error) {
    state.avatarOnlineError = error.message || "Расширенный поиск аватаров недоступен.";
    throw error;
  } finally {
    state.avatarOnlineLoading = false;
    renderAvatarOnlineResults();
  }
}

async function addOnlineAvatarToCatalog(avatarId) {
  const row = state.avatarOnlineRows.find((candidate) => candidate.avatarId === avatarId);
  if (!row) throw new Error("Результат поиска больше недоступен.");
  await api.saveAvatarCatalog({ avatarName: row.avatarName || row.avatarId, avatarId: row.avatarId });
  state.selectedAvatarKey = avatarModel.idKey(row.avatarId);
  state.avatarQuery = "";
  if (avatarSearch) avatarSearch.value = "";
  rememberSelections();
  await refreshAvatars();
  setStatus("Аватар сохранён в каталог программы.", false, { kind: "success" });
}

async function favoriteOnlineAvatar(avatarId) {
  const row = state.avatarOnlineRows.find((candidate) => candidate.avatarId === avatarId);
  if (!row) throw new Error("Результат поиска больше недоступен.");
  if (!row.canFavorite) throw new Error("Добавить в избранное можно только подтверждённый публичный аватар.");
  await api.saveAvatarCatalog({ avatarName: row.avatarName || row.avatarId, avatarId: row.avatarId });
  const result = await api.favoriteVrchatAvatar(row.avatarId);
  state.selectedAvatarKey = avatarModel.idKey(row.avatarId);
  rememberSelections();
  await refreshAvatars();
  setStatus(
    result?.alreadyFavorite
      ? "Аватар уже был в избранном VRChat; каталог программы обновлён."
      : "Аватар сохранён в каталог и избранное VRChat.",
    false,
    { kind: "success" }
  );
}

function selectedAvatar() {
  return state.avatarRows.find((row) => row.avatarKey === state.selectedAvatarKey) || null;
}

function globalAvatarReports(avatarId) {
  return state.globalAvatarNotes.filter((row) => row.avatarId === avatarId).sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));
}

function ownGlobalAvatarReport(avatarId) {
  const teamId = currentTeamId();
  return teamId ? globalAvatarReports(avatarId).find((row) => row.sourceTeamId === teamId) || null : null;
}

function renderAvatarDetail() {
  if (!avatarDetail) return;
  avatarDetail.replaceChildren();
  const record = selectedAvatar();
  if (!record) {
    avatarDetail.classList.add("adminPreviewEmpty");
    avatarDetail.append(adminElement("span", "profileAvatar", "A"), adminElement("h2", "", "Выберите аватар"), adminElement("p", "", "Avatar ID, командная метка и общие публикации появятся здесь."));
    return;
  }
  avatarDetail.classList.remove("adminPreviewEmpty");
  const content = adminElement("div", "avatarDetailContent");
  const header = adminElement("header", "avatarDetailHeader");
  const identity = adminElement("div");
  identity.append(adminElement("span", "eyebrow", record.status === "crash" ? "Требует внимания" : "Каталог аватаров"), userOrUiElement("h2", "", record.avatarName, "Неизвестный аватар"), userOrUiElement("code", "", record.avatarId, "Avatar ID не подтверждён"));
  const actions = adminElement("div", "avatarDetailActions");
  if (record.avatarId) {
    const open = adminElement("button", "", "Страница аватара");
    open.type = "button";
    open.dataset.avatarOpen = record.avatarId;
    actions.append(open);
  }
  const resolve = adminElement("button", "", record.avatarId ? "Проверить ID" : "Найти Avatar ID");
  resolve.type = "button";
  resolve.dataset.avatarResolve = record.avatarKey;
  actions.append(resolve);
  header.append(identity, actions);
  content.append(header);
  if (state.avatarError) content.append(adminElement("p", "adminError", state.avatarError));

  const form = adminElement("form", "adminNoteForm");
  form.dataset.avatarNoteForm = record.avatarKey;
  const statusField = adminElement("label", "adminField");
  statusField.append(adminElement("span", "", "Метка команды"));
  const select = adminElement("select");
  select.name = "status";
  for (const [value, label] of [["ok", "Без отметки"], ["crash", "Crash / сильные лаги"]]) {
    const option = adminElement("option", "", label);
    option.value = value;
    option.selected = record.status === value;
    select.append(option);
  }
  statusField.append(select);
  const noteField = adminElement("label", "adminField");
  noteField.append(adminElement("span", "", "Заметка об аватаре"));
  const textarea = adminElement("textarea");
  textarea.name = "note";
  textarea.maxLength = 2000;
  textarea.rows = 5;
  textarea.value = record.note || "";
  textarea.placeholder = "Что заметила команда…";
  noteField.append(textarea);
  const saveBar = adminElement("div", "adminSaveBar");
  saveBar.append(adminElement("span", "", state.avatarSaving ? "Сохраняем…" : "До 2000 символов"));
  const save = adminElement("button", "primaryButton", state.avatarSaving ? "Сохранение…" : "Сохранить");
  save.type = "submit";
  save.disabled = state.avatarSaving;
  saveBar.append(save);
  form.append(statusField, noteField, saveBar);
  content.append(form);

  if (state.avatarCandidates.length) {
    const candidates = adminElement("section", "avatarCandidates");
    candidates.append(adminElement("h3", "", `Возможные совпадения · ${state.avatarCandidates.length}`));
    for (const candidate of state.avatarCandidates.slice(0, 10)) {
      const button = adminElement("button", "avatarCandidate");
      button.type = "button";
      button.dataset.avatarCandidateId = candidate.avatarId;
      button.append(userTextElement("strong", "", candidate.avatarName || record.avatarName), userTextElement("span", "", candidate.avatarId), adminElement("em", "", "Выбрать"));
      candidates.append(button);
    }
    content.append(candidates);
  }

  const global = adminElement("section", "avatarGlobalReports");
  const globalHeader = adminElement("header");
  globalHeader.append(adminElement("h3", "", "Общие публикации"));
  if (record.avatarId && canPublishGlobalNotes()) {
    const publish = adminElement("button", "", ownGlobalAvatarReport(record.avatarId) ? "Обновить общую" : "Опубликовать всем");
    publish.type = "button";
    publish.dataset.avatarGlobalPublish = record.avatarKey;
    globalHeader.append(publish);
  }
  global.append(globalHeader);
  const reports = record.avatarId ? globalAvatarReports(record.avatarId) : [];
  for (const report of reports.slice(0, 8)) {
    const item = adminElement("article", "adminGlobalReport");
    const itemHeader = adminElement("header");
    itemHeader.append(adminElement("strong", "", report.updatedByLabel || "Команда"), adminElement("span", "adminNoteBadge", report.status === "crash" ? "Crash" : "Без отметки"));
    itemHeader.lastElementChild.dataset.status = report.status;
    item.append(itemHeader, report.note ? userTextElement("p", "", report.note) : adminElement("p", "", "Без текста"), adminElement("time", "", adminDate(report.updatedAt)));
    if (report.sourceTeamId === currentTeamId()) {
      const remove = adminElement("button", "dangerAction", "Убрать нашу публикацию");
      remove.type = "button";
      remove.dataset.avatarGlobalRemove = record.avatarId;
      item.append(remove);
    }
    global.append(item);
  }
  if (!reports.length) global.append(emptyMessage(record.avatarId ? "Общих публикаций пока нет." : "Для общей публикации сначала подтвердите Avatar ID."));
  content.append(global);
  avatarDetail.append(content);
}

async function refreshAvatars() {
  const requestId = ++state.avatarRequestId;
  state.avatarLoading = true;
  state.avatarError = "";
  renderAvatarSession();
  const results = await Promise.allSettled([api.listAvatarCatalog(), api.listAvatarNotes(), api.listGlobalAvatarNotes()]);
  if (requestId !== state.avatarRequestId) return;
  if (results[0].status === "fulfilled") state.avatarCatalog = results[0].value || [];
  if (results[1].status === "fulfilled") {
    state.avatarNotes = (results[1].value || []).map((row) => avatarModel.normalizeNote(row));
    if (state.uiSettings.notifyCrashAvatars) state.notificationAvatarNotes = [...state.avatarNotes];
  }
  if (results[2].status === "fulfilled") state.globalAvatarNotes = (results[2].value || []).map((row) => avatarModel.normalizeGlobal(row));
  const failed = results.find((result) => result.status === "rejected");
  state.avatarError = failed ? (failed.reason?.message || "Часть данных аватаров недоступна.") : "";
  state.avatarLoading = false;
  renderAvatarSession();
}

async function saveAvatarNote(form) {
  const record = state.avatarRows.find((row) => row.avatarKey === form.dataset.avatarNoteForm);
  if (!record || state.avatarSaving) return;
  const values = new FormData(form);
  const payload = avatarModel.normalizeNote({ ...record, status: values.get("status"), note: values.get("note") });
  state.avatarSaving = true;
  state.avatarError = "";
  renderAvatarDetail();
  try {
    const saved = avatarModel.normalizeNote(await api.saveAvatarNote(payload), payload);
    state.avatarNotes = [saved, ...state.avatarNotes.filter((row) => row.avatarKey !== saved.avatarKey)];
    if (state.uiSettings.notifyCrashAvatars) state.notificationAvatarNotes = [saved, ...state.notificationAvatarNotes.filter((row) => row.avatarKey !== saved.avatarKey)];
    setStatus("Заметка об аватаре сохранена.");
  } catch (error) {
    state.avatarError = error.message || "Не удалось сохранить заметку об аватаре.";
    setStatus(state.avatarError, true);
  } finally {
    state.avatarSaving = false;
    renderAvatarSession();
  }
}

async function resolveSelectedAvatar() {
  const record = selectedAvatar();
  if (!record) return;
  state.avatarError = "";
  state.avatarCandidates = [];
  if (record.avatarId) {
    const resolved = await api.resolveVrchatAvatar(record.avatarId);
    const avatarName = resolved?.avatarName || resolved?.name || record.avatarName;
    const payload = await api.saveAvatarCatalog({ avatarName, avatarId: record.avatarId });
    state.avatarCatalog = [payload?.avatar || payload || { avatarName, avatarId: record.avatarId }, ...state.avatarCatalog.filter((row) => (row.avatar_id || row.avatarId) !== record.avatarId)];
    setStatus("Avatar ID проверен и каталог обновлён.");
  } else {
    const result = await api.findVrchatAvatarCandidates(record.avatarName);
    state.avatarCandidates = (result?.candidates || []).filter((candidate) => candidate?.avatarId).slice(0, 10);
    if (!state.avatarCandidates.length) setStatus("Точных кандидатов по названию не найдено.", true);
  }
  renderAvatarSession();
}

async function confirmAvatarCandidate(avatarId) {
  const record = selectedAvatar();
  if (!record || !avatarId) return;
  const payload = await api.saveAvatarCatalog({ avatarName: record.avatarName, avatarId });
  state.avatarCatalog = [payload?.avatar || payload || { avatarName: record.avatarName, avatarId }, ...state.avatarCatalog.filter((row) => (row.avatar_id || row.avatarId) !== avatarId)];
  state.events = state.events.map((event) => (!event.avatarId && event.avatarName === record.avatarName ? { ...event, avatarId } : event));
  state.selectedAvatarKey = avatarModel.idKey(avatarId);
  state.avatarCandidates = [];
  setStatus("Avatar ID подтверждён и сохранён в каталоге.");
  renderAvatarSession();
}

async function publishGlobalAvatar(record) {
  if (!record?.avatarId) throw new Error("Для общей публикации нужен подтверждённый Avatar ID.");
  if (!canPublishGlobalNotes()) throw new Error("У этого ключа нет права на общую публикацию.");
  const saved = avatarModel.normalizeGlobal(await api.saveGlobalAvatarNote({ avatarName: record.avatarName, avatarId: record.avatarId, status: record.status, note: record.note }));
  state.globalAvatarNotes = [saved, ...state.globalAvatarNotes.filter((row) => row.avatarId !== record.avatarId || row.sourceTeamId !== saved.sourceTeamId)];
  setStatus("Отметка аватара опубликована для всех команд.");
  renderAvatarDetail();
}

function renderDashboard(stats) {
  const counts = sessionModel.buildDashboard(state.events);
  for (const [key, value] of Object.entries(counts)) {
    const target = document.querySelector(`[data-dashboard-metric="${key}"]`);
    if (target) target.textContent = String(value);
  }
  if (dashboardTotal) dashboardTotal.textContent = String(state.events.length);
  updateDashboardClock();
  dashboardBars.replaceChildren();
  const rows = [
    ["Входы", counts.joins, "var(--green)"],
    ["Выходы", counts.leaves, "var(--red)"],
    ["Аватары", counts.avatars, "var(--cyan)"],
    ["Миры", counts.worlds, "var(--amber)"],
    ["Остальное", counts.other, "#71889a"]
  ];
  const maximum = Math.max(1, ...rows.map((row) => row[1]));
  for (const [label, value, color] of rows) {
    const row = document.createElement("div");
    row.className = "dashboardBarRow";
    const title = document.createElement("span");
    title.textContent = label;
    const track = document.createElement("i");
    const fill = document.createElement("b");
    fill.style.width = `${Math.max(value ? 4 : 0, (value / maximum) * 100)}%`;
    fill.style.background = color;
    track.append(fill);
    const count = document.createElement("strong");
    count.textContent = String(value);
    row.append(title, track, count);
    dashboardBars.append(row);
  }

  dashboardRecent.replaceChildren();
  const recent = sessionModel.importantEvents(state.events, 8);
  for (const event of recent) dashboardRecent.append(dashboardEventElement(event));
  if (!recent.length) dashboardRecent.append(emptyMessage("Важных событий пока нет."));
}

function dashboardEventElement(event) {
  const row = adminElement("div", "dashboardEventRow");
  row.dataset.type = String(event?.type || "event");
  const dot = adminElement("i");
  const copy = adminElement("div");
  copy.append(
    appendSeparated(adminElement("strong"), [{ text: eventName(event), user: true }, { text: eventKind(event) }]),
    eventDetail(event) === "—" ? adminElement("span", "", "—") : userTextElement("span", "", eventDetail(event))
  );
  row.append(dot, copy, adminElement("time", "", eventTime(event)));
  return row;
}

function selectedSessionPlayer() {
  return sessionStats().players.find((player) => player.userId === state.selectedSessionUserId) || null;
}

function renderPlayerDrawer() {
  if (!playerDrawer) return;
  const player = selectedSessionPlayer();
  playerDrawer.hidden = !player;
  if (!player) return;
  playerDrawer.querySelector("[data-session-player-avatar]").dataset.online = player.online ? "true" : "false";
  setUserText(playerDrawer.querySelector("[data-session-player-name]"), eventName(player));
  playerDrawer.querySelector("[data-session-player-id]").textContent = player.userId;
  const status = playerDrawer.querySelector("[data-session-player-status]");
  status.textContent = player.online ? "в сети сейчас" : "не в сети";
  status.dataset.online = player.online ? "true" : "false";
  playerDrawer.querySelector("[data-session-player-event]").textContent = eventKind(player);
  playerDrawer.querySelector("[data-session-player-time]").textContent = eventTime(player);
}

function openSessionPlayer(userId) {
  if (playerDrawer?.hidden) playerDrawerReturnFocus = focusedElement();
  state.selectedSessionUserId = String(userId || "");
  rememberSelections();
  renderPlayerDrawer();
  playerDrawer?.querySelector("[data-session-player-close]")?.focus();
}

function closeSessionPlayer() {
  const returnFocus = playerDrawerReturnFocus;
  playerDrawerReturnFocus = null;
  state.selectedSessionUserId = "";
  rememberSelections();
  renderPlayerDrawer();
  restoreFocus(returnFocus);
}

async function openSessionPlayerProfile() {
  const player = selectedSessionPlayer();
  if (!player?.userId) throw new Error("Для игрока не найден User ID.");
  await api.openExternal(`https://vrchat.com/home/user/${encodeURIComponent(player.userId)}`);
}

function openPlayerInAdmin(player) {
  const userId = String(player?.userId || "");
  if (!userId) throw new Error("Для игрока не найден User ID.");
  state.adminDraftPlayer = noteTools.normalizeNote({
    userId,
    displayName: player.displayName || player.playerName || player.display || eventName(player),
    online: Boolean(player.online),
    status: "ok",
    note: ""
  });
  state.selectedAdminUserId = userId;
  state.adminHistory = [];
  rememberSelections();
  selectView("admin");
  renderAdminList(true);
  renderAdminCard();
}

async function openSessionPlayerAdmin() {
  const player = selectedSessionPlayer();
  closeSessionPlayer();
  openPlayerInAdmin(player);
}

function openSessionPlayerOwner() {
  const player = selectedSessionPlayer();
  if (!player?.userId) throw new Error("Для игрока не найден User ID.");
  openPlayerInOwner(player);
}

function scheduleOwnerRender() {
  if (state.ownerRenderFrame || state.view !== "owner") return;
  state.ownerRenderFrame = requestAnimationFrame(() => {
    state.ownerRenderFrame = 0;
    renderOwner();
  });
}

function scheduleCrashRender() {
  if (state.crashRenderFrame || state.view !== "crash") return;
  state.crashRenderFrame = requestAnimationFrame(() => {
    state.crashRenderFrame = 0;
    renderCrash();
  });
}

function renderSession() {
  const stats = sessionStats();
  document.querySelectorAll("[data-session-section]").forEach((button) => {
    const active = button.dataset.sessionSection === state.sessionSection;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
    button.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll("[data-session-pane]").forEach((pane) => {
    const active = pane.dataset.sessionPane === state.sessionSection;
    pane.classList.toggle("active", active);
    pane.hidden = !active;
  });
  for (const [key, value] of Object.entries({ online: stats.online, peak: stats.peak, unique: stats.unique, world: stats.world })) {
    const target = document.querySelector(`[data-metric="${key}"]`);
    if (target) target.textContent = String(value);
  }
  if (onlineBadge) onlineBadge.textContent = String(stats.online);
  document.querySelectorAll("[data-session-player-mode]").forEach((button) => {
    const active = button.dataset.sessionPlayerMode === state.sessionPlayerMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  syncSessionEventFilters();

  eventCount.textContent = `${state.events.length} событий`;
  state.sessionVisibleEvents = visibleSessionEvents();
  const feedCount = document.querySelector("[data-feed-count]");
  if (feedCount) feedCount.textContent = state.sessionVisibleEvents.length === state.events.length
    ? `${state.events.length} записей`
    : `${state.sessionVisibleEvents.length} из ${state.events.length}`;
  state.sessionVisiblePlayers = visibleSessionPlayers(stats.players);
  if (playerCount) playerCount.textContent = `${state.sessionVisiblePlayers.length} игроков`;
  if (state.sessionSection === "feed") {
    renderVirtualEventRows(true);
    renderVirtualPlayerRows(true);
  } else if (state.sessionSection === "avatars") {
    renderAvatarSession();
  } else if (state.sessionSection === "dashboard") {
    renderDashboard(stats);
  }
  if (state.selectedSessionUserId) renderPlayerDrawer();
}

const BUILDER_DEFINITIONS = Object.freeze({
  players: { title: "Игроки", icon: "↕", empty: "Заходов и выходов пока нет." },
  avatars: { title: "Аватары", icon: "◇", empty: "Смен аватаров пока нет." },
  portals: { title: "Порталы", icon: "◌", empty: "Событий порталов пока нет." },
  worlds: { title: "Миры", icon: "◎", empty: "Переходов между мирами пока нет." },
  admin: { title: "Admin Tools", icon: "A", empty: "Игроков и заметок пока нет." }
});

function builderRows(kind) {
  const query = String(state.builderQueries[kind] || "").trim().toLocaleLowerCase(uiLocale());
  if (kind === "admin") {
    return adminPlayers().filter((player) => !query || `${player.displayName || ""} ${player.userId || ""} ${adminStatusLabel(player.status)} ${player.note || ""}`.toLocaleLowerCase(uiLocale()).includes(query)).slice(0, 60);
  }
  const matches = {
    players: (event) => event.type === "player-joined" || event.type === "player-left",
    avatars: (event) => event.type === "avatar-changed" || event.type === "avatar-data",
    portals: (event) => String(event.type || "").includes("portal"),
    worlds: (event) => String(event.type || "").startsWith("world-")
  }[kind];
  return [...state.events].reverse().filter(matches || (() => false)).filter((event) => (
    !query || `${eventName(event)} ${eventDetail(event)} ${event.type || ""}`.toLocaleLowerCase(uiLocale()).includes(query)
  )).slice(0, 60);
}

function builderRowElement(kind, item) {
  const actionable = (kind === "admin" && item.userId)
    || (kind === "players" && item.userId)
    || kind === "avatars";
  const row = adminElement(actionable ? "button" : "div", "builderRow");
  if (actionable) row.type = "button";
  if (kind === "admin") {
    row.dataset.online = String(Boolean(item.online));
    row.dataset.builderAdminUser = item.userId;
    row.title = `Открыть ${item.displayName || item.userId} в Admin Tools`;
    row.append(
      userTextElement("strong", "", item.displayName || item.userId),
      appendSeparated(adminElement("span"), [{ text: adminStatusLabel(item.status) }, { text: item.note, user: true }]),
      adminElement("time", "", item.online ? "онлайн" : "не в сети")
    );
    return row;
  }
  if (kind === "players" && item.userId) {
    row.dataset.builderSessionUser = item.userId;
    row.title = `Открыть карточку ${eventName(item)}`;
  }
  if (kind === "avatars") {
    row.dataset.builderAvatarKey = avatarModel.key(item.avatarName, item.avatarId);
    row.title = "Открыть аватар в каталоге";
  }
  const title = kind === "worlds" ? (item.worldName || eventName(item)) : eventName(item);
  row.append(
    userTextElement("strong", "", title),
    userTextElement("span", "", kind === "avatars" ? (item.avatarName || eventDetail(item)) : eventDetail(item)),
    adminElement("time", "", eventTime(item))
  );
  return row;
}

function defaultBuilderGeometry(kind, boardWidth = 1000, preset = "columns") {
  const safeWidth = Math.max(320, Number(boardWidth) || 1000);
  const index = Math.max(0, BUILDER_KINDS.indexOf(kind));
  if (preset === "vr") {
    return { x: 0, y: index * 300, width: safeWidth, height: 282, fontScale: 145 };
  }
  if (preset === "feed") {
    return { x: 0, y: index * 218, width: safeWidth, height: 202, fontScale: 112 };
  }
  const columns = safeWidth >= 720 ? 2 : 1;
  const gap = 14;
  const width = columns === 2 ? Math.floor((safeWidth - gap) / 2) : safeWidth;
  return {
    x: columns === 2 ? (index % 2) * (width + gap) : 0,
    y: Math.floor(index / columns) * 286,
    width,
    height: 270,
    fontScale: 100
  };
}

function normalizedBuilderGeometry(kind, boardWidth = builderGrid?.clientWidth || appView?.clientWidth || 1000) {
  const defaults = defaultBuilderGeometry(kind, boardWidth);
  const stored = state.builderGeometry?.[kind] || {};
  const finiteOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const widthLimit = Math.max(BUILDER_MIN_WIDTH, Number(boardWidth) || defaults.width);
  const width = Math.min(widthLimit, Math.max(BUILDER_MIN_WIDTH, finiteOr(stored.width, defaults.width)));
  const height = Math.max(BUILDER_MIN_HEIGHT, finiteOr(stored.height, defaults.height));
  const x = Math.max(0, Math.min(finiteOr(stored.x, defaults.x), Math.max(0, widthLimit - width)));
  const y = Math.max(0, finiteOr(stored.y, defaults.y));
  const fontScale = Math.min(180, Math.max(80, finiteOr(stored.fontScale, defaults.fontScale)));
  return { x, y, width, height, fontScale };
}

function applyBuilderBlockFont(block, geometry) {
  block.style.setProperty("--builder-font-scale", String(geometry.fontScale / 100));
  block.style.setProperty("--builder-title-font", `${14 * geometry.fontScale / 100}px`);
  block.style.setProperty("--builder-row-font", `${11 * geometry.fontScale / 100}px`);
  block.style.setProperty("--builder-meta-font", `${9 * geometry.fontScale / 100}px`);
  block.dataset.fontScale = String(geometry.fontScale);
}

function applyBuilderBlockGeometry(block, geometry) {
  block.style.left = `${Math.round(geometry.x)}px`;
  block.style.top = `${Math.round(geometry.y)}px`;
  block.style.width = `${Math.round(geometry.width)}px`;
  block.style.height = `${Math.round(geometry.height)}px`;
  applyBuilderBlockFont(block, geometry);
}

function updateBuilderBoardHeight() {
  if (!builderGrid || state.builderLayout !== "freeform") return;
  const bottom = BUILDER_KINDS
    .filter((kind) => state.builderVisible.includes(kind))
    .reduce((maximum, kind) => {
      const geometry = normalizedBuilderGeometry(kind);
      return Math.max(maximum, geometry.y + geometry.height);
    }, 0);
  builderGrid.style.minHeight = `${Math.max(620, Math.ceil(bottom + 24))}px`;
}

function builderBlock(kind) {
  const definition = BUILDER_DEFINITIONS[kind];
  const rows = builderRows(kind);
  const geometry = normalizedBuilderGeometry(kind);
  const block = adminElement("article", "panel builderBlock");
  block.dataset.builderKind = kind;
  applyBuilderBlockFont(block, geometry);
  const header = adminElement("header");
  header.dataset.builderMove = kind;
  header.draggable = state.builderLayout !== "freeform";
  if (header.draggable) header.dataset.builderOrderHandle = kind;
  const title = adminElement("div", "builderBlockTitle");
  title.append(adminElement("span", "builderBlockIcon", definition.icon), adminElement("h2", "", definition.title));
  const tools = adminElement("div", "builderBlockTools");
  const fontDown = adminElement("button", "builderFontButton", "−");
  fontDown.type = "button";
  fontDown.dataset.builderFontAdjust = "-10";
  fontDown.title = "Уменьшить шрифт блока";
  const fontValue = adminElement("span", "builderFontValue", `${geometry.fontScale}%`);
  const fontUp = adminElement("button", "builderFontButton", "+");
  fontUp.type = "button";
  fontUp.dataset.builderFontAdjust = "10";
  fontUp.title = "Увеличить шрифт блока";
  tools.append(fontDown, fontValue, fontUp, adminElement("span", "builderBlockCount", `${rows.length}`));
  header.append(title, tools);
  const search = document.createElement("input");
  search.className = "builderBlockSearch";
  search.type = "search";
  search.maxLength = 120;
  search.placeholder = "Поиск в блоке…";
  search.value = state.builderQueries[kind] || "";
  search.dataset.builderSearch = kind;
  search.setAttribute("aria-label", `Поиск: ${definition.title}`);
  const content = adminElement("div", "builderRows");
  content.dataset.builderRows = kind;
  for (const row of rows) content.append(builderRowElement(kind, row));
  if (!rows.length) content.append(adminElement("p", "builderEmpty", definition.empty));
  block.append(header, search, content);
  if (state.builderLayout === "freeform") {
    state.builderGeometry[kind] = geometry;
    applyBuilderBlockGeometry(block, geometry);
    for (const corner of ["nw", "ne", "sw", "se"]) {
      const handle = adminElement("span", `builderResizeHandle ${corner}`);
      handle.dataset.builderResize = corner;
      handle.setAttribute("aria-hidden", "true");
      block.append(handle);
    }
  }
  return block;
}

function renderBuilderBlockRows(kind) {
  const block = builderGrid?.querySelector(`[data-builder-kind="${CSS.escape(kind)}"]`);
  const content = block?.querySelector("[data-builder-rows]");
  if (!block || !content) return;
  const rows = builderRows(kind);
  const fragment = document.createDocumentFragment();
  for (const row of rows) fragment.append(builderRowElement(kind, row));
  if (!rows.length) fragment.append(adminElement("p", "builderEmpty", BUILDER_DEFINITIONS[kind].empty));
  content.replaceChildren(fragment);
  const count = block.querySelector(".builderBlockCount");
  if (count) count.textContent = String(rows.length);
}

function persistBuilderSettings() {
  localStorage.setItem("betaBuilderOrder", JSON.stringify(state.builderOrder));
  localStorage.setItem("betaBuilderVisible", JSON.stringify(state.builderVisible));
  localStorage.setItem("betaBuilderLayout", state.builderLayout);
  localStorage.setItem("betaBuilderGeometry", JSON.stringify(state.builderGeometry));
  localStorage.setItem("betaBuilderQueries", JSON.stringify(state.builderQueries));
  localStorage.setItem("betaBuilderAlwaysOnTop", String(state.builderAlwaysOnTop));
  localStorage.setItem("betaBuilderOpacity", String(state.builderOpacity));
  localStorage.setItem("betaBuilderCompact", String(state.builderCompact));
}

function syncBuilderControls() {
  if (!builderGrid) return;
  builderGrid.classList.toggle("rows", state.builderLayout === "rows");
  builderGrid.classList.toggle("freeform", state.builderLayout === "freeform");
  if (state.builderLayout !== "freeform") builderGrid.style.removeProperty("min-height");
  builderLayout.value = state.builderLayout;
  document.querySelectorAll("[data-builder-blocks] input").forEach((input) => {
    input.checked = state.builderVisible.includes(input.value);
  });
  const onTop = document.querySelector("[data-builder-on-top]");
  onTop.classList.toggle("active", state.builderAlwaysOnTop);
  onTop.setAttribute("aria-pressed", String(state.builderAlwaysOnTop));
  onTop.textContent = state.builderAlwaysOnTop ? "Открепить" : "Поверх окон";
  const compact = document.querySelector("[data-builder-compact]");
  compact.classList.toggle("active", state.builderCompact);
  compact.setAttribute("aria-pressed", String(state.builderCompact));
  compact.textContent = state.builderCompact ? "Обычный вид" : "Компактно";
  builderOpacity.disabled = !state.builderAlwaysOnTop;
  builderOpacity.value = String(state.builderOpacity);
  document.querySelector("[data-builder-opacity-output]").textContent = `${state.builderOpacity}%`;
  appView.classList.toggle("compactMode", state.builderCompact);
  appView.classList.toggle("toolbarHidden", !state.uiSettings.showToolbar && !state.builderCompact);
}

function renderBuilder() {
  if (!builderGrid) return;
  syncBuilderControls();
  const fragment = document.createDocumentFragment();
  for (const kind of state.builderOrder) if (state.builderVisible.includes(kind)) fragment.append(builderBlock(kind));
  builderGrid.replaceChildren(fragment);
  if (!builderGrid.children.length) builderGrid.append(adminElement("p", "panel builderEmpty", "Включите хотя бы один блок в настройках выше."));
  updateBuilderBoardHeight();
}

function scheduleBuilderRender() {
  if (state.builderRenderFrame || state.builderInteraction) return;
  state.builderRenderFrame = requestAnimationFrame(() => {
    state.builderRenderFrame = 0;
    renderBuilder();
  });
}

async function setBuilderAlwaysOnTop() {
  const next = !state.builderAlwaysOnTop;
  await api.setAlwaysOnTop(next, state.builderOpacity / 100);
  state.builderAlwaysOnTop = next;
  persistBuilderSettings();
  syncBuilderControls();
  setStatus(next ? "Окно закреплено поверх остальных." : "Окно откреплено.");
}

async function setBuilderCompact() {
  const next = !state.builderCompact;
  await api.setCompactMode(next);
  state.builderCompact = next;
  persistBuilderSettings();
  syncBuilderControls();
  setStatus(next ? "Компактный режим включён." : "Обычный размер восстановлен.");
}

function applyBuilderPreset(name) {
  const preset = ["vr", "feed"].includes(name) ? name : "columns";
  const width = builderGrid?.clientWidth || appView?.clientWidth || 1000;
  state.builderLayout = "freeform";
  state.builderGeometry = Object.fromEntries(BUILDER_KINDS.map((kind) => [kind, defaultBuilderGeometry(kind, width, preset)]));
  persistBuilderSettings();
  renderBuilder();
  setStatus(`Пресет Builder применён: ${preset === "vr" ? "VR крупно" : preset === "feed" ? "Лента" : "Две колонки"}.`);
}

function adjustBuilderFont(kind, delta) {
  if (!BUILDER_KINDS.includes(kind)) return;
  const geometry = normalizedBuilderGeometry(kind);
  geometry.fontScale = Math.min(180, Math.max(80, geometry.fontScale + Number(delta || 0)));
  state.builderGeometry[kind] = geometry;
  persistBuilderSettings();
  const block = builderGrid?.querySelector(`[data-builder-kind="${CSS.escape(kind)}"]`);
  if (block) {
    if (state.builderLayout === "freeform") applyBuilderBlockGeometry(block, geometry);
    else applyBuilderBlockFont(block, geometry);
    const output = block.querySelector(".builderFontValue");
    if (output) output.textContent = `${geometry.fontScale}%`;
  }
}

function startBuilderInteraction(event) {
  if (state.builderLayout !== "freeform" || event.button !== 0) return;
  const resize = event.target.closest("[data-builder-resize]");
  const move = event.target.closest("[data-builder-move]");
  if (!resize && (!move || event.target.closest("button"))) return;
  const block = event.target.closest("[data-builder-kind]");
  if (!block) return;
  const kind = block.dataset.builderKind;
  const geometry = normalizedBuilderGeometry(kind);
  state.builderGeometry[kind] = geometry;
  state.builderInteraction = {
    kind,
    mode: resize ? "resize" : "move",
    corner: resize?.dataset.builderResize || "",
    startX: event.clientX,
    startY: event.clientY,
    initial: { ...geometry },
    block
  };
  block.classList.add("interacting");
  event.preventDefault();
}

function moveBuilderInteraction(event) {
  const interaction = state.builderInteraction;
  if (!interaction) return;
  const boardWidth = Math.max(BUILDER_MIN_WIDTH, builderGrid?.clientWidth || interaction.initial.width);
  const dx = event.clientX - interaction.startX;
  const dy = event.clientY - interaction.startY;
  const initial = interaction.initial;
  const next = { ...initial };
  if (interaction.mode === "move") {
    next.x = Math.max(0, Math.min(initial.x + dx, Math.max(0, boardWidth - initial.width)));
    next.y = Math.max(0, initial.y + dy);
  } else {
    const west = interaction.corner.includes("w");
    const north = interaction.corner.includes("n");
    if (west) {
      next.x = Math.max(0, Math.min(initial.x + dx, initial.x + initial.width - BUILDER_MIN_WIDTH));
      next.width = initial.width + initial.x - next.x;
    } else {
      next.width = Math.min(boardWidth - initial.x, Math.max(BUILDER_MIN_WIDTH, initial.width + dx));
    }
    if (north) {
      next.y = Math.max(0, Math.min(initial.y + dy, initial.y + initial.height - BUILDER_MIN_HEIGHT));
      next.height = initial.height + initial.y - next.y;
    } else {
      next.height = Math.max(BUILDER_MIN_HEIGHT, initial.height + dy);
    }
  }
  state.builderGeometry[interaction.kind] = next;
  applyBuilderBlockGeometry(interaction.block, next);
  updateBuilderBoardHeight();
  event.preventDefault();
}

function finishBuilderInteraction() {
  const interaction = state.builderInteraction;
  if (!interaction) return;
  interaction.block?.classList.remove("interacting");
  state.builderInteraction = null;
  persistBuilderSettings();
  renderBuilder();
}

async function resetBuilder() {
  state.builderOrder = [...BUILDER_KINDS];
  state.builderVisible = [...BUILDER_KINDS];
  state.builderLayout = "grid";
  state.builderGeometry = {};
  state.builderQueries = Object.fromEntries(BUILDER_KINDS.map((kind) => [kind, ""]));
  state.builderOpacity = 100;
  state.builderCompact = false;
  if (state.builderAlwaysOnTop) await api.setAlwaysOnTop(false, 1);
  await api.setCompactMode(false);
  state.builderAlwaysOnTop = false;
  persistBuilderSettings();
  renderBuilder();
  setStatus("Настройки Builder сброшены.");
}

function addEvent(event) {
  if (!event || typeof event !== "object") return;
  if (event.type === "user-authenticated") {
    state.currentVrchatUser = {
      id: String(event.userId || ""),
      userId: String(event.userId || ""),
      displayName: String(event.playerName || event.displayName || "").trim(),
      source: "log"
    };
  } else if (event.type === "local-player") {
    const displayName = String(event.playerName || event.displayName || "").trim();
    const matchedPlayer = sessionStats().players.find((player) => String(player.displayName || player.playerName || "").trim() === displayName);
    state.currentVrchatUser = {
      ...(state.currentVrchatUser || {}),
      id: state.currentVrchatUser?.id || matchedPlayer?.userId || "",
      userId: state.currentVrchatUser?.userId || matchedPlayer?.userId || "",
      displayName: displayName || state.currentVrchatUser?.displayName || "",
      source: "log"
    };
  }
  if (!state.startedAt) state.startedAt = eventTimestampMs(event) || Date.now();
  state.events.push(event);
  notifyForEvent(event);
  state.playSessionDirty = true;
  void syncCurrentPlaySession();
  const eventLimit = Math.min(sessionModel.MAX_BUFFERED_EVENTS, state.uiSettings.eventLimit);
  if (state.events.length > eventLimit) {
    state.events.splice(0, state.events.length - eventLimit);
  }
  eventCount.textContent = `${state.events.length} событий`;
  if (state.view === "session") scheduleSessionRender();
  if (state.view === "admin") scheduleAdminRender();
  if (state.view === "owner") scheduleOwnerRender();
  if (state.view === "crash") scheduleCrashRender();
  if (state.view === "builder") scheduleBuilderRender();
}

function selectView(view) {
  if (!viewTitles[view]) return;
  if (view === "owner" && !hasOwnerAccess()) return;
  state.view = view;
  syncOwnerPolling();
  pageEyebrow.textContent = viewEyebrows[view];
  pageTitle.textContent = viewTitles[view];
  document.querySelectorAll("[data-view-button]").forEach((button) => {
    const active = button.dataset.viewButton === view;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
    button.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll("[data-view]").forEach((panel) => {
    const active = panel.dataset.view === view;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });
  if (view === "insights") void refreshInsights();
  if (view === "history") void refreshHistory();
  if (view === "admin") void refreshAdmin();
  if (view === "owner") void refreshOwner({ silent: true });
  if (view === "crash") void refreshCrash();
  if (view === "builder") requestAnimationFrame(() => renderBuilder());
  if (view === "session") requestAnimationFrame(() => renderSession());
}

function formatDuration(milliseconds) {
  return insightsModel.formatDuration(milliseconds, i18n.language());
}

function localizedCount(value, forms) {
  return i18n.count(value, forms, i18n.language());
}

function sessionCountText(value) {
  return localizedCount(value, { enOne: "session", enMany: "sessions", ruOne: "сессия", ruFew: "сессии", ruMany: "сессий" });
}

function encounterCountText(value) {
  return localizedCount(value, { enOne: "encounter", enMany: "encounters", ruOne: "встреча", ruFew: "встречи", ruMany: "встреч" });
}

function insightSessionKey(session) {
  return session.id ? `id:${session.id}` : `start:${session.startedAt}|world:${session.worldName}`;
}

function currentInsights() {
  const days = state.insightsPeriod === "all" ? null : Number(state.insightsPeriod || 30);
  state.insights = insightsModel.buildInsights(state.insightSessions, { days });
  return state.insights;
}

function renderInsightsRuntime() {
  const user = state.currentVrchatUser;
  const instance = state.currentVrchatInstance;
  const stats = sessionStats();
  const currentUser = document.querySelector("[data-insight-current-user]");
  const currentUserText = user?.displayName || user?.username || user?.id;
  if (currentUserText) setUserText(currentUser, currentUserText);
  else {
    currentUser.removeAttribute("data-i18n-skip");
    currentUser.textContent = "Не найден в текущем логе";
  }
  const worldName = instance?.worldName || instance?.world?.name || instance?.worldId || (stats.world !== "—" ? stats.world : "Мир ещё не найден в логе");
  const online = Number.isFinite(Number(instance?.nUsers))
    ? ` · ${Number(instance.nUsers)}${Number.isFinite(Number(instance?.capacity)) ? `/${Number(instance.capacity)}` : ""}`
    : (stats.online ? ` · ${stats.online} в логе` : "");
  const currentInstance = document.querySelector("[data-insight-current-instance]");
  currentInstance.replaceChildren();
  if (worldName === "Мир ещё не найден в логе") currentInstance.append(document.createTextNode(worldName));
  else currentInstance.append(userTextElement("span", "", worldName));
  if (online) currentInstance.append(document.createTextNode(online));
}

function renderInsightSessionDetail(insights) {
  insightSessionDetail.replaceChildren();
  let selected = insights.sessions.find((session) => insightSessionKey(session) === state.selectedInsightSessionKey) || insights.sessions[0] || null;
  if (selected && !state.selectedInsightSessionKey) state.selectedInsightSessionKey = insightSessionKey(selected);
  if (!selected) {
    insightSessionDetail.classList.add("adminPreviewEmpty");
    insightSessionDetail.append(adminElement("span", "profileAvatar", "S"), adminElement("h2", "", "Выберите сессию"), adminElement("p", "", "Мир, длительность и сохранённые встречи появятся здесь."));
    return;
  }
  insightSessionDetail.classList.remove("adminPreviewEmpty");
  const content = adminElement("div", "insightSessionContent");
  const header = adminElement("header");
  header.append(adminElement("span", "eyebrow", adminDate(selected.startedAt)), userOrUiElement("h2", "", selected.worldName, "Неизвестный мир"), adminElement("p", "", `${formatDuration(selected.endedAt - selected.startedAt)} · ${selected.complete ? "завершена" : "идёт сейчас"}`));
  content.append(header);
  const players = adminElement("section", "insightSessionPlayers");
  players.append(adminElement("h3", "", `Сохранённые встречи · ${selected.players.length}`));
  for (const player of selected.players.slice(0, 50)) {
    const row = adminElement("div", "insightSessionPlayer");
    row.append(userTextElement("span", "", player.displayName || player.userId));
    const profile = adminElement("button", "", "Профиль");
    profile.type = "button";
    profile.dataset.insightProfile = player.userId;
    row.append(profile);
    players.append(row);
  }
  if (!selected.players.length) players.append(emptyMessage("Игроки в снимке этой сессии не сохранены."));
  content.append(players);
  insightSessionDetail.append(content);
}

function renderInsights() {
  if (insightsPeriod) insightsPeriod.value = state.insightsPeriod;
  const insights = currentInsights();
  for (const [key, value] of Object.entries({
    sessions: insights.sessionCount,
    duration: formatDuration(insights.totalDurationMs),
    worlds: insights.worldCount,
    players: insights.uniquePlayerCount,
    recurring: insights.recurringPlayerCount,
    encounters: insights.totalEncounters
  })) document.querySelector(`[data-insight="${key}"]`).textContent = String(value);
  renderInsightsRuntime();

  const playerRows = document.querySelector("[data-insight-players]");
  playerRows.replaceChildren();
  const recurring = insights.topPlayers.filter((player) => player.sessions > 1).slice(0, 10);
  for (const player of recurring) {
    const row = adminElement("button", "insightRow");
    row.type = "button";
    row.dataset.insightProfile = player.userId;
    row.append(userTextElement("strong", "", player.displayName || player.userId), adminElement("span", "", `Последняя встреча: ${adminDate(player.lastSeenAt)}`), adminElement("em", "", sessionCountText(player.sessions)));
    playerRows.append(row);
  }
  if (!recurring.length) playerRows.append(emptyMessage("За выбранный период повторных встреч нет."));

  const worldRows = document.querySelector("[data-insight-worlds]");
  worldRows.replaceChildren();
  for (const world of insights.topWorlds) {
    const row = adminElement("div", "insightRow");
    row.append(userTextElement("strong", "", world.worldName), adminElement("span", "", `Последний раз: ${adminDate(world.lastSeenAt)}`), adminElement("em", "", sessionCountText(world.sessions)));
    worldRows.append(row);
  }
  if (!insights.topWorlds.length) worldRows.append(emptyMessage("Миры ещё не сохранены."));

  insightSessionList.replaceChildren();
  for (const session of insights.sessions.slice(0, 100)) {
    const row = adminElement("button", "dataRow insightSessionRow");
    row.type = "button";
    row.dataset.insightSession = insightSessionKey(session);
    row.classList.toggle("active", row.dataset.insightSession === state.selectedInsightSessionKey);
    const avatar = adminElement("span", "playerAvatar", "W");
    const copy = adminElement("div");
    copy.append(userOrUiElement("strong", "", session.worldName, "Неизвестный мир"), adminElement("span", "", `${adminDate(session.startedAt)} · ${encounterCountText(session.players.length)}`));
    row.append(avatar, copy, adminElement("span", "", formatDuration(session.endedAt - session.startedAt)));
    insightSessionList.append(row);
  }
  if (state.insightsError) insightSessionList.prepend(adminElement("p", "adminError", state.insightsError));
  if (!insights.sessions.length && !state.insightsError) insightSessionList.append(emptyMessage(state.insightsLoading ? "Собираем статистику…" : "Сохранённых сессий пока нет."));
  document.querySelector("[data-insight-session-count]").textContent = state.insightsLoading ? "загрузка…" : `${insights.sessionCount} записей`;
  renderInsightSessionDetail(insights);
}

async function refreshInsights() {
  const requestId = ++state.insightsRequestId;
  state.insightsLoading = true;
  state.insightsError = "";
  renderInsights();
  await syncCurrentPlaySession({ force: true, announceError: true });
  const [sessions, currentUser, currentInstance] = await Promise.allSettled([
    api.listPlaySessions(),
    api.getVrchatCurrentUser(),
    api.getVrchatCurrentInstance()
  ]);
  if (requestId !== state.insightsRequestId) return;
  if (sessions.status === "fulfilled") state.insightSessions = sessions.value || [];
  else state.insightsError = sessions.reason?.message || "Не удалось загрузить сохранённые сессии.";
  if (currentUser.status === "fulfilled" && currentUser.value) state.currentVrchatUser = currentUser.value;
  if (currentInstance.status === "fulfilled" && currentInstance.value) state.currentVrchatInstance = currentInstance.value;
  state.insightsLoading = false;
  renderInsights();
}

async function copyInsightsRecap() {
  const label = insightsPeriod?.selectedOptions?.[0]?.textContent || "30 дней";
  await api.writeClipboardText(insightsModel.recap(currentInsights(), label.toLocaleLowerCase(uiLocale()), i18n.language()));
  setStatus("Итог «Мой VRChat» скопирован.");
}

function localDateKey(timestampMs) {
  const date = new Date(timestampMs);
  if (Number.isNaN(date.valueOf())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function filteredHistorySessions() {
  const query = state.historyQuery.trim().toLocaleLowerCase(uiLocale());
  return insightsModel.dedupeSessions(state.historySessions).filter((session) => {
    if (state.historyStatus === "active" && session.complete) return false;
    if (state.historyStatus === "ended" && !session.complete) return false;
    if (state.historyDate && localDateKey(session.startedAt) !== state.historyDate) return false;
    if (!query) return true;
    const players = session.players.map((player) => `${player.displayName} ${player.userId} ${player.status || ""}`).join(" ");
    return `${session.worldName} ${players}`.toLocaleLowerCase(uiLocale()).includes(query);
  });
}

function historySessionRow(session) {
  const row = adminElement("button", "dataRow historySessionRow");
  row.type = "button";
  row.dataset.historySession = insightSessionKey(session);
  row.classList.toggle("active", row.dataset.historySession === state.historySelectedKey);
  const avatar = adminElement("span", "playerAvatar", "H");
  const copy = adminElement("div");
  copy.append(
    userOrUiElement("strong", "", session.worldName, "Неизвестный мир"),
    adminElement("span", "", `${adminDate(session.startedAt)} · ${session.players.length} игроков · ${session.complete ? "завершена" : "в процессе"}`)
  );
  row.append(avatar, copy, adminElement("span", "", formatDuration(session.endedAt - session.startedAt)));
  return row;
}

function selectedHistorySession() {
  return state.historyVisibleSessions.find((session) => insightSessionKey(session) === state.historySelectedKey) || state.historyVisibleSessions[0] || null;
}

function renderHistoryDetail() {
  historyDetail.replaceChildren();
  const session = selectedHistorySession();
  if (!session) {
    historyDetail.classList.add("adminPreviewEmpty");
    historyDetail.append(adminElement("span", "profileAvatar", "H"), adminElement("h2", "", "Выберите сессию"), adminElement("p", "", "Мир, длительность и участники появятся здесь."));
    return;
  }
  if (!state.historySelectedKey) state.historySelectedKey = insightSessionKey(session);
  historyDetail.classList.remove("adminPreviewEmpty");
  const content = adminElement("div", "historyDetailContent");
  const header = adminElement("header");
  const title = adminElement("div");
  title.append(adminElement("span", "eyebrow", session.complete ? "Завершённая сессия" : "Сессия в процессе"), userOrUiElement("h2", "", session.worldName, "Неизвестный мир"), adminElement("p", "", adminDate(session.startedAt)));
  const copyButton = adminElement("button", "", "Копировать");
  copyButton.type = "button";
  copyButton.dataset.historyCopy = insightSessionKey(session);
  header.append(title, copyButton);
  content.append(header);
  const source = session.source || {};
  const stats = adminElement("div", "historyStats");
  for (const [label, value] of [
    ["Длительность", formatDuration(session.endedAt - session.startedAt)],
    ["Игроки", String(Number(source.player_count ?? source.playerCount ?? session.players.length) || session.players.length)],
    ["События", String(Number(source.event_count ?? source.eventCount ?? 0))]
  ]) {
    const item = adminElement("div");
    item.append(adminElement("span", "", label), adminElement("strong", "", value));
    stats.append(item);
  }
  content.append(stats);
  const players = adminElement("section", "historyPlayers");
  players.append(adminElement("h3", "", `Участники · ${session.players.length}`));
  for (const player of session.players.slice(0, 100)) {
    const item = adminElement("div", "historyPlayer");
    const identity = adminElement("div");
    identity.append(userTextElement("strong", "", player.displayName || player.userId), userTextElement("span", "", player.userId));
    const actions = adminElement("div", "historyPlayerActions");
    const profile = adminElement("button", "", "Профиль");
    profile.type = "button";
    profile.dataset.historyProfile = player.userId;
    actions.append(profile);
    if (hasOwnerAccess()) {
      const owner = adminElement("button", "ownerActionButton", "Owner");
      owner.type = "button";
      owner.dataset.historyOwner = player.userId;
      owner.dataset.historyOwnerName = player.displayName || player.userId;
      actions.append(owner);
    }
    item.append(identity, actions);
    players.append(item);
  }
  if (!session.players.length) players.append(emptyMessage("Список участников для этой сессии не сохранён."));
  content.append(players);
  historyDetail.append(content);
}

function renderHistory(force = false) {
  state.historyVisibleSessions = filteredHistorySessions();
  document.querySelector("[data-history-count]").textContent = state.historyLoading ? "загрузка…" : `${state.historyVisibleSessions.length} записей`;
  if (state.historyLoading && !state.historyVisibleSessions.length) {
    historyList.replaceChildren(emptyMessage("Загружаем историю…"));
  } else if (state.historyError && !state.historyVisibleSessions.length) {
    historyList.replaceChildren(emptyMessage(state.historyError));
  } else {
    renderVirtualRows(historyList, state.historyVisibleSessions, 66, historySessionRow, "Сессии по заданным условиям не найдены.", force);
  }
  if (state.historySelectedKey && !state.historyVisibleSessions.some((session) => insightSessionKey(session) === state.historySelectedKey)) state.historySelectedKey = "";
  renderHistoryDetail();
}

async function refreshHistory() {
  const requestId = ++state.historyRequestId;
  state.historyLoading = true;
  state.historyError = "";
  renderHistory(true);
  try {
    await syncCurrentPlaySession({ force: true, announceError: true });
    const sessions = await api.listPlaySessions();
    if (requestId !== state.historyRequestId) return;
    state.historySessions = sessions || [];
    state.insightSessions = sessions || [];
  } catch (error) {
    if (requestId !== state.historyRequestId) return;
    state.historyError = error.message || "Не удалось загрузить историю сессий.";
  } finally {
    if (requestId === state.historyRequestId) {
      state.historyLoading = false;
      renderHistory(true);
    }
  }
}

async function copyHistorySession(sessionKey) {
  const session = state.historyVisibleSessions.find((row) => insightSessionKey(row) === sessionKey);
  if (!session) throw new Error("Сессия не найдена.");
  const english = i18n?.language?.() === "en";
  const world = session.worldName || (english ? "Unknown world" : "Неизвестный мир");
  const lines = [
    `${english ? "VRChat history" : "История VRChat"} · ${world}`,
    `${english ? "Started" : "Начало"}: ${adminDate(session.startedAt)}`,
    `${english ? "Duration" : "Длительность"}: ${formatDuration(session.endedAt - session.startedAt)}`,
    `${english ? "State" : "Состояние"}: ${session.complete ? (english ? "completed" : "завершена") : (english ? "in progress" : "в процессе")}`,
    `${english ? "Participants" : "Участники"}: ${session.players.length}`,
    ...session.players.slice(0, 100).map((player) => `- ${player.displayName || player.userId} · ${player.userId}`)
  ];
  await api.writeClipboardText(lines.join("\n"));
  setStatus("Сессия из истории скопирована.");
}

function adminElement(tag, className = "", text = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== "") element.textContent = text;
  return element;
}

function userTextElement(tag, className = "", text = "") {
  const element = adminElement(tag, className, text);
  element.dataset.i18nSkip = "true";
  return element;
}

function userOrUiElement(tag, className, value, fallback) {
  return value ? userTextElement(tag, className, value) : adminElement(tag, className, fallback);
}

function setUserText(element, text) {
  if (!element) return element;
  element.textContent = text;
  element.dataset.i18nSkip = "true";
  return element;
}

function appendSeparated(element, parts) {
  element.replaceChildren();
  parts.filter((part) => part?.text !== undefined && part.text !== "").forEach((part, index) => {
    if (index) element.append(document.createTextNode(" · "));
    element.append(part.user ? userTextElement("span", "", part.text) : document.createTextNode(part.text));
  });
  return element;
}

function labeledUserElement(tag, className, label, value, fallback = "—") {
  const element = adminElement(tag, className);
  element.append(document.createTextNode(`${label}: `));
  if (value) element.append(userTextElement("span", "", value));
  else element.append(document.createTextNode(fallback));
  return element;
}

function adminNote(userId) {
  const saved = state.adminNotes.find((row) => row.userId === userId);
  if (saved) return saved;
  if (state.adminDraftPlayer?.userId === userId) return state.adminDraftPlayer;
  const player = [...state.adminCatalog, ...sessionStats().players].find((row) => String(row?.userId || row?.id || "").trim() === userId);
  return player ? noteTools.normalizeNote({ userId, displayName: eventName(player), status: "ok", note: "" }) : null;
}

function adminStatusLabel(status) {
  return noteTools.STATUS_OPTIONS.find((option) => option.value === status)?.label || status || "Без отметки";
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

function globalReportsForPlayer(userId) {
  return state.globalPlayerNotes.filter((row) => row.userId === userId).sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));
}

function ownGlobalPlayerReport(userId) {
  const teamId = currentTeamId();
  return teamId ? globalReportsForPlayer(userId).find((row) => row.sourceTeamId === teamId) || null : null;
}

function adminDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : date.toLocaleString(uiLocale());
}

function adminAuthor(record) {
  return record?.updatedByLabel || record?.updatedByKey || "—";
}

function adminPlayers() {
  const rows = new Map();
  const mergePlayer = (source) => {
    const userId = String(source?.userId || source?.id || "").trim();
    if (!userId) return;
    const previous = rows.get(userId) || { userId, displayName: userId, playerName: userId, status: "ok", note: "", online: false, lastEventAt: "" };
    const displayName = String(source?.displayName || source?.playerName || source?.display || source?.name || previous.displayName || userId);
    rows.set(userId, {
      ...previous,
      ...source,
      userId,
      displayName,
      playerName: displayName,
      online: Boolean(source?.online ?? previous.online),
      lastEventAt: source?.lastEventAt || source?.timestamp || source?.lastSeenAt || previous.lastEventAt || ""
    });
  };
  for (const player of state.adminCatalog) mergePlayer(player);
  for (const player of sessionStats().players) mergePlayer(player);
  for (const note of state.adminNotes) mergePlayer(note);
  if (state.adminDraftPlayer) mergePlayer(state.adminDraftPlayer);
  const query = state.adminQuery.trim().toLocaleLowerCase(uiLocale());
  return sessionModel.filterPlayers([...rows.values()], state.adminPlayerMode, "").filter((row) => !query || `${row.displayName} ${row.userId} ${row.note || ""} ${adminStatusLabel(row.status)}`.toLocaleLowerCase(uiLocale()).includes(query));
}

function adminRowElement(note) {
  const row = adminElement("button", `dataRow adminNoteRow ${note.online ? "online" : "offline"}`);
  row.type = "button";
  row.dataset.adminUserId = note.userId;
  row.classList.toggle("active", note.userId === state.selectedAdminUserId);
  row.setAttribute("aria-pressed", note.userId === state.selectedAdminUserId ? "true" : "false");
  const avatar = playerMarker(Boolean(note.online));
  const copy = adminElement("div");
  copy.append(
    adminElement("strong", "", note.displayName || note.userId || "Игрок"),
    adminElement("span", "", `${note.online ? "● онлайн" : "● не в сети"} · ${note.note || "без заметки"}`)
  );
  const status = adminElement("span", "adminNoteBadge", adminStatusLabel(note.status));
  status.dataset.status = note.status;
  row.append(avatar, copy, status);
  return row;
}

function renderAdminList(force = false) {
  state.adminVisiblePlayers = adminPlayers();
  noteCount.textContent = state.adminLoading ? "загрузка…" : `${state.adminVisiblePlayers.length} игроков`;
  document.querySelectorAll("[data-admin-mode]").forEach((button) => {
    const active = button.dataset.adminMode === state.adminPlayerMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  if (state.adminLoading && state.adminVisiblePlayers.length === 0) {
    noteList.replaceChildren(emptyMessage("Загружаем командные заметки…"));
    return;
  }
  if (state.adminListError && state.adminVisiblePlayers.length === 0) {
    noteList.replaceChildren(emptyMessage(state.adminListError));
    return;
  }
  const emptyText = state.adminQuery ? "По этому запросу игроки не найдены." : "Игроков пока нет. Запустите лог или загрузите игроков за сегодня.";
  renderVirtualRows(noteList, state.adminVisiblePlayers, 64, adminRowElement, emptyText, force);
}

function appendAdminMeta(container, label, value) {
  const item = adminElement("div");
  item.append(adminElement("span", "", label), adminElement("strong", "", value || "—"));
  container.append(item);
}

function playerActivity(record) {
  let currentWorldName = "";
  let worldName = "";
  let joinedAt = "";
  let leftAt = "";
  let online = false;
  const avatars = [];
  for (const event of state.events) {
    if (String(event?.type || "").startsWith("world-") && (event.worldName || event.worldId)) {
      currentWorldName = String(event.worldName || event.worldId);
    }
    if (!sessionModel.eventBelongsToPlayer(event, record)) continue;
    if (currentWorldName) worldName = currentWorldName;
    if (event.type === "player-joined") {
      joinedAt = event.timestamp || event.capturedAt || "";
      leftAt = "";
      online = true;
    } else if (event.type === "player-left") {
      leftAt = event.timestamp || event.capturedAt || "";
      online = false;
    } else if (event.type === "avatar-changed" || event.type === "avatar-data") {
      const avatarName = String(event.avatarName || "").trim();
      const avatarId = String(event.avatarId || "").trim();
      if (!avatarName && !avatarId) continue;
      const key = avatarModel.key(avatarName, avatarId);
      const previous = avatars.at(-1);
      if (previous?.key === key) {
        previous.avatarId = avatarId || previous.avatarId;
        previous.timestamp = event.timestamp || event.capturedAt || previous.timestamp;
      } else {
        avatars.push({ key, avatarName: avatarName || avatarId, avatarId, timestamp: event.timestamp || event.capturedAt || "" });
      }
    }
  }
  return { online, joinedAt, leftAt, worldName, avatars, currentAvatar: avatars.at(-1) || null };
}

function renderPlayerActivity(container, record) {
  const activity = playerActivity(record);
  const section = adminElement("section", "adminPlayerActivity");
  const header = adminElement("header");
  const title = adminElement("div");
  title.append(adminElement("span", "eyebrow", "Текущая сессия"), adminElement("h3", "", "Карточка игрока"));
  const status = adminElement("span", `adminActivityStatus ${activity.online ? "online" : "offline"}`, activity.online ? "В сети" : "Не в сети");
  header.append(title, status);
  section.append(header);

  const metrics = adminElement("div", "adminActivityGrid");
  appendAdminMeta(metrics, "Вошёл", adminDate(activity.joinedAt));
  appendAdminMeta(metrics, "Мир", activity.worldName || "Не определён");
  appendAdminMeta(metrics, "Текущий аватар", activity.currentAvatar?.avatarName || "Нет данных");
  appendAdminMeta(metrics, "Смен аватара", String(activity.avatars.length));
  section.append(metrics);

  if (activity.currentAvatar) {
    const current = adminElement("button", "adminCurrentAvatar");
    current.type = "button";
    current.dataset.adminAvatarKey = activity.currentAvatar.key;
    const copy = adminElement("div");
    copy.append(
      userTextElement("strong", "", activity.currentAvatar.avatarName),
      userOrUiElement("span", "", activity.currentAvatar.avatarId, "Avatar ID не подтверждён")
    );
    current.append(copy, adminElement("em", "", "Открыть в аватарах"));
    section.append(current);
  }

  if (activity.avatars.length > 1) {
    const history = adminElement("div", "adminAvatarTrail");
    history.append(adminElement("strong", "", "Последние смены"));
    for (const avatar of [...activity.avatars].reverse().slice(0, 5)) {
      const button = adminElement("button");
      button.type = "button";
      button.dataset.adminAvatarKey = avatar.key;
      button.append(userTextElement("span", "", avatar.avatarName), adminElement("time", "", eventTime(avatar)));
      history.append(button);
    }
    section.append(history);
  }
  container.append(section);
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
          labeledUserElement("p", "", "Было", row.previousNote, "без заметки"),
          labeledUserElement("p", "", "Стало", row.note, "без заметки")
        );
      }
      if (row.visibility === "team" && row.id) {
        const restore = adminElement("button", "", "Восстановить предыдущее");
        restore.type = "button";
        restore.dataset.adminHistoryRestore = row.id;
        item.append(restore);
      }
      section.append(item);
    }
  }
  container.append(section);
}

async function restoreAdminHistory(historyId) {
  const record = adminNote(state.selectedAdminUserId);
  const history = state.adminHistory.find((row) => String(row.id) === String(historyId));
  if (!record || !history || history.visibility !== "team") throw new Error("Запись истории недоступна для восстановления.");
  const payload = noteTools.editorPayload(record, { status: history.previousStatus || "ok", note: history.previousNote || "" });
  const saved = await api.savePlayerNote(payload);
  state.adminNotes = noteTools.mergeSavedNote(state.adminNotes, saved || payload, payload);
  if (state.uiSettings.notifyMarkedPlayers) state.notificationPlayerNotes = noteTools.mergeSavedNote(state.notificationPlayerNotes, saved || payload, payload);
  setStatus("Предыдущее значение заметки восстановлено.");
  await loadAdminHistory(record.userId);
  renderAdminList(true);
  renderAdminCard();
}

function renderGlobalPlayerReports(container, record) {
  const section = adminElement("section", "adminGlobalReports");
  const header = adminElement("header");
  header.append(adminElement("div"));
  header.firstElementChild.append(adminElement("h3", "", "Общие публикации"), adminElement("span", "", "Видны всем командам с доступом"));
  if (canPublishGlobalNotes()) {
    const publish = adminElement("button", "", ownGlobalPlayerReport(record.userId) ? "Обновить общую" : "Опубликовать всем");
    publish.type = "button";
    publish.dataset.adminGlobalPublish = record.userId;
    header.append(publish);
  }
  section.append(header);
  if (state.globalPlayerNotesError) section.append(adminElement("p", "adminError", state.globalPlayerNotesError));
  const reports = globalReportsForPlayer(record.userId);
  if (!reports.length) {
    section.append(emptyMessage("Общих публикаций об этом игроке пока нет."));
  } else {
    for (const report of reports.slice(0, 8)) {
      const item = adminElement("article", "adminGlobalReport");
      const itemHeader = adminElement("header");
      itemHeader.append(adminElement("strong", "", report.updatedByLabel || "Команда"), adminElement("span", "adminNoteBadge", adminStatusLabel(report.status)));
      itemHeader.lastElementChild.dataset.status = report.status;
      item.append(itemHeader, report.note ? userTextElement("p", "", report.note) : adminElement("p", "", "Без текста"), adminElement("time", "", adminDate(report.updatedAt)));
      if (report.sourceTeamId && report.sourceTeamId === currentTeamId()) {
        const remove = adminElement("button", "dangerAction", "Убрать нашу публикацию");
        remove.type = "button";
        remove.dataset.adminGlobalRemove = record.userId;
        item.append(remove);
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
      playerMarker(false, true),
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
    playerMarker(Boolean(record.online), true),
    adminElement("div", "", "")
  );
  identity.lastElementChild.append(
    userOrUiElement("h2", "", record.displayName || record.userId, "Игрок"),
    userTextElement("code", "", record.userId)
  );
  const actions = adminElement("div", "adminCardActions");
  const profileButton = adminElement("button", "", "Профиль");
  profileButton.type = "button";
  profileButton.dataset.adminProfile = `https://vrchat.com/home/user/${encodeURIComponent(record.userId)}`;
  if (hasOwnerAccess()) {
    const ownerButton = adminElement("button", "ownerActionButton", "Owner");
    ownerButton.type = "button";
    ownerButton.dataset.adminOwner = record.userId;
    actions.append(ownerButton);
  }
  const closeButton = adminElement("button", "adminCardClose", "×");
  closeButton.type = "button";
  closeButton.dataset.adminClear = "true";
  closeButton.title = "Убрать выбранного игрока";
  actions.append(profileButton, closeButton);
  header.append(identity, actions);
  content.append(header);

  if (!state.adminVisiblePlayers.some((player) => player.userId === record.userId)) {
    const hiddenNotice = adminElement("div", "selectionHiddenNotice");
    const message = adminElement("div");
    message.append(adminElement("strong", "", "Карточка остаётся открытой"), adminElement("span", "", "Игрок скрыт текущим поиском или фильтром списка."));
    const reveal = adminElement("button", "", "Показать в списке");
    reveal.type = "button";
    reveal.dataset.adminRevealSelection = "true";
    hiddenNotice.append(message, reveal);
    content.append(hiddenNotice);
  }

  renderPlayerActivity(content, record);

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
  renderGlobalPlayerReports(content, record);
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
  rememberSelections();
  state.adminError = "";
  state.adminHistory = [];
  renderAdminList(true);
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
    if (state.uiSettings.notifyMarkedPlayers) state.notificationPlayerNotes = noteTools.mergeSavedNote(state.notificationPlayerNotes, saved || payload, payload);
    if (state.adminDraftPlayer?.userId === payload.userId) state.adminDraftPlayer = null;
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

async function publishGlobalAdminNote(userId) {
  if (!canPublishGlobalNotes()) throw new Error("У этого ключа нет права на общую публикацию.");
  const record = adminNote(userId);
  if (!record) throw new Error("Игрок не найден.");
  const saved = normalizeGlobalPlayerNote(await api.saveGlobalPlayerNote({
    userId,
    displayName: record.displayName || userId,
    status: record.status,
    note: record.note
  }));
  state.globalPlayerNotes = [saved, ...state.globalPlayerNotes.filter((row) => row.userId !== userId || row.sourceTeamId !== saved.sourceTeamId)];
  state.globalPlayerNotesError = "";
  setStatus("Заметка опубликована для всех команд.");
  await loadAdminHistory(userId);
  renderAdminCard();
}

async function removeGlobalAdminNote(userId) {
  if (!canPublishGlobalNotes()) throw new Error("У этого ключа нет права на общую публикацию.");
  await api.removeGlobalPlayerNote(userId);
  const teamId = currentTeamId();
  state.globalPlayerNotes = state.globalPlayerNotes.filter((row) => row.userId !== userId || row.sourceTeamId !== teamId);
  setStatus("Общая публикация команды удалена.");
  await loadAdminHistory(userId);
  renderAdminCard();
}

async function refreshAdmin() {
  const requestId = ++state.adminListRequestId;
  state.adminLoading = true;
  state.adminListError = "";
  renderAdminList();
  try {
    const [notes, globals] = await Promise.all([
      api.listPlayerNotes(),
      api.listGlobalPlayerNotes?.().then((rows) => ({ rows, error: "" })).catch((error) => ({ rows: [], error: error.message || "Общие публикации недоступны." })) || Promise.resolve({ rows: [], error: "" })
    ]);
    if (requestId !== state.adminListRequestId) return;
    state.adminNotes = (notes || []).map(noteTools.normalizeNote).filter((row) => row.userId);
    if (state.uiSettings.notifyMarkedPlayers) state.notificationPlayerNotes = [...state.adminNotes];
    state.globalPlayerNotes = (globals.rows || []).map(normalizeGlobalPlayerNote).filter((row) => row.userId && row.sourceTeamId);
    state.globalPlayerNotesError = globals.error;
    if (state.adminDraftPlayer && state.adminNotes.some((row) => row.userId === state.adminDraftPlayer.userId)) state.adminDraftPlayer = null;
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
      renderAdminList(true);
      renderAdminCard();
      if (state.selectedAdminUserId) void loadAdminHistory(state.selectedAdminUserId);
    }
  }
}

async function readTodayAdminPlayers() {
  state.adminLoading = true;
  renderAdminList(true);
  try {
    const result = await api.readTodayPlayers();
    const merged = new Map(state.adminCatalog.map((player) => [String(player.userId || player.id || ""), player]));
    const rows = (result?.players || []).map(normalizeOwnerPlayer).filter(Boolean);
    for (const player of rows) merged.set(player.userId, { ...(merged.get(player.userId) || {}), ...player });
    state.adminCatalog = [...merged.values()];
    setStatus(`За сегодня найдено ${rows.length} игроков в ${Number(result?.fileCount || 0)} логах.`);
  } finally {
    state.adminLoading = false;
    renderAdminList(true);
    renderAdminCard();
  }
}

async function copyAdminSnapshot() {
  const rows = adminPlayers();
  const online = rows.filter((row) => row.online).length;
  const marked = rows.filter((row) => row.status && row.status !== "ok").length;
  const english = i18n?.language?.() === "en";
  const lines = [
    `Admin Tools · ${new Date().toLocaleString(uiLocale())}`,
    english ? `Players: ${rows.length} · online: ${online} · marked: ${marked}` : `Игроков: ${rows.length} · онлайн: ${online} · с отметкой: ${marked}`,
    ...rows.slice(0, 100).map((row) => `${row.online ? "●" : "○"} ${row.displayName || row.userId} · ${english ? t(adminStatusLabel(row.status)) : adminStatusLabel(row.status)}${row.note ? ` · ${row.note}` : ""}`)
  ];
  if (rows.length > 100) lines.push(english ? `…and ${rows.length - 100} more` : `…и ещё ${rows.length - 100}`);
  await api.writeClipboardText(lines.join("\n"));
  setStatus("Снимок Admin Tools скопирован.");
}

function normalizeOwnerPlayer(player) {
  const userId = String(player?.userId || player?.id || "").trim();
  if (!userId) return null;
  return {
    ...player,
    userId,
    playerName: String(player?.displayName || player?.playerName || player?.name || userId),
    online: Boolean(player?.online),
    timestamp: player?.timestamp || player?.lastSeenAt || player?.seenAt || ""
  };
}

function ownerPlayers() {
  const rows = new Map();
  for (const player of state.ownerCatalog) {
    const normalized = normalizeOwnerPlayer(player);
    if (normalized) rows.set(normalized.userId, normalized);
  }
  for (const player of sessionStats().players) {
    const normalized = normalizeOwnerPlayer(player);
    if (!normalized) continue;
    rows.set(normalized.userId, { ...(rows.get(normalized.userId) || {}), ...normalized });
  }
  for (const note of state.adminNotes) {
    const normalized = normalizeOwnerPlayer(note);
    if (!normalized) continue;
    rows.set(normalized.userId, { ...(rows.get(normalized.userId) || {}), ...normalized, online: Boolean(rows.get(normalized.userId)?.online) });
  }
  return [...rows.values()];
}

function groupPlayers() {
  const sessionById = new Map(sessionStats().players.map((player) => [player.userId, player]));
  return state.groupMembers.map((member) => normalizeOwnerPlayer({
    ...member,
    ...(sessionById.get(member.userId) || {}),
    displayName: member.displayName || sessionById.get(member.userId)?.playerName
  })).filter(Boolean);
}

function groupMember(userId) {
  return state.groupMembers.find((member) => member.userId === userId) || null;
}

function ownerPlayer(userId) {
  return [...groupPlayers(), ...ownerPlayers()].find((player) => player.userId === userId) || null;
}

function ownerRowElement(player) {
  const row = playerRowElement(player);
  row.classList.remove("sessionPlayerButton");
  row.classList.add("ownerPlayerRow");
  delete row.dataset.sessionPlayerId;
  row.dataset.ownerUserId = player.userId;
  row.classList.toggle("active", player.userId === state.ownerSelectedUserId);
  row.setAttribute("aria-label", `Открыть ${eventName(player)} в Owner`);
  return row;
}

function renderOwnerList(force = false) {
  if (!ownerList) return;
  document.querySelectorAll("[data-owner-source]").forEach((button) => {
    const active = button.dataset.ownerSource === state.ownerSource;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  const todayButton = document.querySelector("[data-owner-today]");
  const groupLoadButton = document.querySelector("[data-owner-group-load]");
  if (todayButton) todayButton.hidden = state.ownerSource !== "logs";
  if (groupLoadButton) groupLoadButton.hidden = state.ownerSource !== "group";
  const sourcePlayers = state.ownerSource === "group" ? groupPlayers() : ownerPlayers();
  state.ownerVisiblePlayers = sessionModel.filterPlayers(sourcePlayers, state.ownerPlayerMode, state.ownerQuery);
  document.querySelectorAll("[data-owner-mode]").forEach((button) => {
    const active = button.dataset.ownerMode === state.ownerPlayerMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  const count = document.querySelector("[data-owner-count]");
  if (count) count.textContent = state.ownerLoading ? "загрузка…" : `${state.ownerVisiblePlayers.length} игроков`;
  const emptyText = state.ownerQuery
    ? "По этому запросу игроки не найдены."
    : state.ownerSource === "group"
      ? "Нажмите «Найти в группе», чтобы загрузить участников."
      : "Запустите чтение лога или загрузите игроков за сегодня.";
  renderVirtualRows(ownerList, state.ownerVisiblePlayers, 64, ownerRowElement, emptyText, force);
}

function moderationActionLabel(request) {
  return request?.action === "unban" ? "Разбан" : "Бан";
}

function moderationStatusLabel(status) {
  return ({ pending: "в очереди", processing: "выполняется", succeeded: "выполнено", failed: "ошибка" })[status] || String(status || "неизвестно");
}

function applyGroupManagementResults() {
  const succeeded = state.groupManagementRequests
    .filter((request) => request.status === "succeeded")
    .slice()
    .reverse();
  const latestList = [...succeeded].reverse().find((request) => request.action === "list_members");
  let members = latestList?.result?.members ? latestList.result.members.slice() : state.groupMembers.slice();
  const latestListTime = latestList ? new Date(latestList.createdAt).valueOf() : 0;
  for (const request of succeeded.filter((item) => new Date(item.createdAt).valueOf() >= latestListTime)) {
    const member = request.result?.member;
    if (request.action === "kick_member") members = members.filter((item) => item.userId !== request.targetUserId);
    else if (member?.userId) {
      const index = members.findIndex((item) => item.userId === member.userId);
      if (index < 0) members.push(member);
      else members[index] = member;
    }
  }
  const withRoles = [...succeeded].reverse().find((request) => Array.isArray(request.result?.roles));
  state.groupMembers = members;
  state.groupRoles = withRoles?.result?.roles || state.groupRoles;
  state.groupMembersTotal = Number(latestList?.result?.total ?? state.groupMembersTotal);
  state.groupMembersOffset = Number(latestList?.result?.offset ?? state.groupMembersOffset);
  state.groupMembersLimit = Number(latestList?.result?.limit ?? state.groupMembersLimit);
  state.groupMembersHasMore = Boolean(latestList?.result?.hasMore);
}

async function loadGroupManagementRequests({ silent = false } = {}) {
  if (!canViewGroupMembers() || state.groupManagementLoading) return;
  state.groupManagementLoading = true;
  try {
    state.groupManagementRequests = await api.listGroupManagementRequests();
    applyGroupManagementResults();
  } catch (error) {
    if (!silent) setStatus(error.message || "Не удалось загрузить операции группы.", true);
  } finally {
    state.groupManagementLoading = false;
    if (state.view === "owner") renderOwner(true);
  }
}

async function submitGroupManagement(request, successMessage) {
  const queued = await api.requestGroupManagement(request);
  state.groupManagementRequests = [queued, ...state.groupManagementRequests.filter((item) => item.id !== queued.id)];
  applyGroupManagementResults();
  renderOwner(true);
  setStatus(queued.deduplicated ? "Такая операция уже выполняется." : successMessage || "Операция добавлена в очередь.");
  if (queued.status !== "succeeded") setTimeout(() => loadGroupManagementRequests({ silent: true }), 1800);
  return queued;
}

async function requestOwnerGroupMembers() {
  if (!canViewGroupMembers()) throw new Error("У этого ключа нет доступа к списку группы.");
  const value = String(ownerSearch?.value || "").trim();
  const match = value.match(/usr_[0-9a-z-]+/iu);
  if (match) {
    state.ownerSelectedUserId = match[0];
    await submitGroupManagement({ action: "get_member", targetUserId: match[0], targetDisplayName: match[0] }, "Проверка участника добавлена в очередь.");
    return;
  }
  if (value && value.length < 3) throw new Error("Для поиска по имени введите не менее трёх символов.");
  await submitGroupManagement({ action: "list_members", query: value, offset: 0, limit: state.groupMembersLimit }, value ? "Поиск участников добавлен в очередь." : "Загрузка участников добавлена в очередь.");
}

function renderOwnerGroupPanel(container, player) {
  if (!canViewGroupMembers()) return;
  const section = adminElement("section", "ownerGroupPanel");
  section.append(adminElement("h3", "", "Участник VRChat-группы"));
  const member = groupMember(player.userId);
  if (!member) {
    section.append(adminElement("p", "ownerAccessNotice", "Членство ещё не проверено или игрок не найден в загруженном списке."));
    const check = adminElement("button", "", "Проверить членство");
    check.type = "button";
    check.dataset.groupMemberCheck = "true";
    section.append(check);
    container.append(section);
    return;
  }

  section.append(appendSeparated(adminElement("p"), [{ text: member.displayName || member.userId, user: true }, { text: member.membershipStatus || "member" }]));
  const assignedIds = new Set(member.roleIds || []);
  const columns = adminElement("div", "ownerRoleColumns");
  for (const [title, roles, action] of [
    ["Доступные роли", state.groupRoles.filter((role) => !assignedIds.has(role.id)), "add"],
    ["Назначенные роли", state.groupRoles.filter((role) => assignedIds.has(role.id)), "remove"]
  ]) {
    const column = adminElement("div");
    column.append(adminElement("h4", "", title));
    const list = adminElement("div", "ownerRoleList");
    for (const role of roles) {
      const button = adminElement("button", `ownerRoleButton${action === "remove" ? " assigned" : ""}`);
      button.type = "button";
      button.disabled = !canManageGroupRoles();
      button.dataset[action === "add" ? "groupRoleAdd" : "groupRoleRemove"] = role.id;
      button.dataset.groupRoleName = role.name || role.id;
      button.append(adminElement("strong", "", role.name || role.id), adminElement("span", "", role.isManagementRole ? "Управляющая роль" : "Роль группы"));
      list.append(button);
    }
    if (!roles.length) list.append(emptyMessage("Нет ролей"));
    column.append(list);
    columns.append(column);
  }
  section.append(columns);

  const notes = adminElement("label", "ownerManagerNotes");
  notes.append(adminElement("span", "", "Заметки управляющих VRChat-группы"));
  const textarea = adminElement("textarea");
  textarea.dataset.groupManagerNotes = "true";
  textarea.maxLength = 1000;
  textarea.value = member.managerNotes || "";
  notes.append(textarea);
  section.append(notes);
  const actions = adminElement("div", "ownerGroupActions");
  const save = adminElement("button", "", "Сохранить заметки");
  save.type = "button";
  save.dataset.groupMemberNotesSave = "true";
  actions.append(save);
  if (canKickGroupMembers()) {
    const kick = adminElement("button", "dangerAction", "Исключить из группы");
    kick.type = "button";
    kick.dataset.groupMemberKick = "true";
    actions.append(kick);
  }
  section.append(actions);
  container.append(section);
}

function renderOwnerRequests(container, userId) {
  const section = adminElement("section", "ownerRequestList");
  section.append(adminElement("h3", "", "История запросов"));
  const requests = state.ownerRequests.filter((request) => request.targetUserId === userId).slice(0, 20);
  if (!requests.length) {
    section.append(emptyMessage(state.ownerLoading ? "Загружаем запросы…" : "Запросов по игроку пока нет."));
  } else {
    for (const request of requests) {
      const row = adminElement("article", "ownerRequestRow");
      row.append(
        appendSeparated(adminElement("strong"), [{ text: moderationActionLabel(request) }, request.reason ? { text: request.reason, user: true } : { text: "причина не указана" }]),
        adminElement("span", "ownerRequestStatus", moderationStatusLabel(request.status)),
        adminElement("time", "", adminDate(request.updatedAt || request.createdAt))
      );
      row.querySelector(".ownerRequestStatus").dataset.status = request.status || "";
      if (request.status === "failed" && request.id) {
        const retry = adminElement("button", "", "Повторить");
        retry.type = "button";
        retry.dataset.ownerRetry = request.id;
        row.append(retry);
      }
      section.append(row);
    }
  }
  container.append(section);
}

function ownerWatchPlayers() {
  const playersById = new Map([...ownerPlayers(), ...groupPlayers()].map((player) => [player.userId, player]));
  return state.adminNotes
    .filter((note) => note.status === "watch" && note.userId)
    .map((note) => {
      const player = playersById.get(note.userId) || normalizeOwnerPlayer(note);
      return { ...player, ...note, online: Boolean(player?.online) };
    })
    .filter((player) => player?.userId)
    .sort((left, right) => String(left.displayName || left.userId).localeCompare(String(right.displayName || right.userId), uiLocale()));
}

function ownerActiveTemporaryBans() {
  const now = Date.now();
  return state.ownerRequests.filter((request) => (
    request.action === "ban"
    && request.status === "succeeded"
    && request.banExpiresAt
    && new Date(request.banExpiresAt).valueOf() > now
  ));
}

function renderOwnerOverview() {
  ownerCard.classList.remove("adminPreviewEmpty");
  const content = adminElement("div", "adminCardContent ownerOverview");
  const header = adminElement("header", "adminCardHeader");
  const heading = adminElement("div");
  heading.append(adminElement("span", "eyebrow", "Центр Owner"), adminElement("h2", "", "Сводка модерации"), adminElement("p", "", "Очередь действий, временные баны и игроки под наблюдением."));
  header.append(heading);
  content.append(header);

  const watchPlayers = ownerWatchPlayers();
  const activeTemporaryBans = ownerActiveTemporaryBans();
  const metrics = adminElement("div", "ownerOverviewMetrics");
  for (const [value, label] of [
    [state.ownerRequests.filter((request) => request.status === "pending" || request.status === "processing").length, "В очереди"],
    [activeTemporaryBans.length, "Временные баны"],
    [watchPlayers.length, "Под наблюдением"],
    [state.ownerRequests.filter((request) => request.status === "failed").length, "Требуют внимания"]
  ]) {
    const metric = adminElement("div");
    metric.append(adminElement("strong", "", String(value)), adminElement("span", "", label));
    metrics.append(metric);
  }
  content.append(metrics);

  const watchSection = adminElement("section", "ownerOverviewSection");
  watchSection.append(adminElement("h3", "", "Наблюдение"));
  const watchList = adminElement("div", "ownerOverviewWatchList");
  for (const player of watchPlayers.slice(0, 20)) {
    const button = adminElement("button", "ownerWatchRow");
    button.type = "button";
    button.dataset.ownerUserId = player.userId;
    const copy = adminElement("div");
    copy.append(userTextElement("strong", "", player.displayName || player.userId), userTextElement("span", "", player.note || "Без заметки"));
    button.append(playerMarker(Boolean(player.online)), copy, adminElement("em", "", player.online ? "онлайн" : "карточка"));
    watchList.append(button);
  }
  if (!watchPlayers.length) watchList.append(emptyMessage("Список наблюдения пуст."));
  watchSection.append(watchList);
  content.append(watchSection);

  const attention = state.ownerRequests.filter((request) => ["pending", "processing", "failed"].includes(request.status)).slice(0, 8);
  const requestSection = adminElement("section", "ownerOverviewSection");
  requestSection.append(adminElement("h3", "", "Последние операции"));
  const requestList = adminElement("div", "ownerOverviewRequests");
  for (const request of attention) {
    const row = adminElement("article", "ownerRequestRow");
    row.append(
      userTextElement("strong", "", request.targetDisplayName || request.targetUserId || moderationActionLabel(request)),
      adminElement("span", "ownerRequestStatus", moderationStatusLabel(request.status)),
      adminElement("time", "", adminDate(request.updatedAt || request.createdAt))
    );
    row.querySelector(".ownerRequestStatus").dataset.status = request.status || "";
    if (request.status === "failed" && request.id) {
      const retry = adminElement("button", "", "Повторить");
      retry.type = "button";
      retry.dataset.ownerRetry = request.id;
      row.append(retry);
    }
    requestList.append(row);
  }
  if (!attention.length) requestList.append(emptyMessage("Активных или ошибочных операций нет."));
  requestSection.append(requestList);
  content.append(requestSection);

  const temporarySection = adminElement("section", "ownerOverviewSection");
  temporarySection.append(adminElement("h3", "", "Активные временные баны"));
  const temporaryList = adminElement("div", "ownerOverviewRequests");
  for (const request of activeTemporaryBans.slice(0, 12)) {
    const row = adminElement("article", "ownerRequestRow");
    row.append(
      userTextElement("strong", "", request.targetDisplayName || request.targetUserId || "Игрок"),
      adminElement("span", "ownerRequestStatus", "до " + adminDate(request.banExpiresAt)),
      userTextElement("span", "", request.reason || "Причина не указана")
    );
    row.querySelector(".ownerRequestStatus").dataset.status = "succeeded";
    temporaryList.append(row);
  }
  if (!activeTemporaryBans.length) temporaryList.append(emptyMessage("Активных временных банов нет."));
  temporarySection.append(temporaryList);
  content.append(temporarySection);

  const moderationSection = adminElement("section", "ownerOverviewSection");
  moderationSection.append(adminElement("h3", "", "Журнал модерации команды"));
  const moderationList = adminElement("div", "ownerOverviewRequests");
  for (const request of state.ownerRequests.slice(0, 20)) {
    const row = adminElement("article", "ownerRequestRow");
    row.append(
      userTextElement("strong", "", request.targetDisplayName || request.targetUserId || moderationActionLabel(request)),
      adminElement("span", "ownerRequestStatus", `${moderationActionLabel(request)} · ${moderationStatusLabel(request.status)}`),
      adminElement("time", "", adminDate(request.updatedAt || request.createdAt))
    );
    row.querySelector(".ownerRequestStatus").dataset.status = request.status || "";
    if (request.status === "failed" && request.id) {
      const retry = adminElement("button", "", "Повторить");
      retry.type = "button";
      retry.dataset.ownerRetry = request.id;
      row.append(retry);
    }
    moderationList.append(row);
  }
  if (!state.ownerRequests.length) moderationList.append(emptyMessage("Операций пока нет."));
  moderationSection.append(moderationList);
  content.append(moderationSection);

  if (canViewGroupMembers() || canManageGroupRoles() || canKickGroupMembers()) {
    const actionLabels = {
      list_members: "Список участников",
      get_member: "Проверка участника",
      add_role: "Выдача роли",
      remove_role: "Отзыв роли",
      update_manager_notes: "Заметки управляющих",
      kick_member: "Исключение участника"
    };
    const groupSection = adminElement("section", "ownerOverviewSection");
    groupSection.append(adminElement("h3", "", "Операции управления VRChat-группой"));
    const groupList = adminElement("div", "ownerOverviewRequests");
    for (const request of state.groupManagementRequests.slice(0, 20)) {
      const row = adminElement("article", "ownerRequestRow");
      row.append(
        userTextElement("strong", "", request.targetDisplayName || request.query || request.roleName || actionLabels[request.action] || request.action),
        adminElement("span", "ownerRequestStatus", actionLabels[request.action] || request.action || "Операция"),
        adminElement("time", "", `${moderationStatusLabel(request.status)} · ${adminDate(request.updatedAt || request.createdAt)}`)
      );
      row.querySelector(".ownerRequestStatus").dataset.status = request.status || "";
      groupList.append(row);
    }
    if (!state.groupManagementRequests.length) groupList.append(emptyMessage("Операций с группой пока нет."));
    groupSection.append(groupList);
    content.append(groupSection);
  }
  ownerCard.append(content);
}

async function toggleOwnerWatch(userId) {
  const player = ownerPlayer(userId);
  if (!player) throw new Error("Игрок не найден.");
  const current = adminNote(userId) || noteTools.normalizeNote({ userId, displayName: eventName(player), status: "ok", note: "" });
  const payload = noteTools.editorPayload(current, { status: current.status === "watch" ? "ok" : "watch" });
  const saved = await api.savePlayerNote(payload);
  state.adminNotes = noteTools.mergeSavedNote(state.adminNotes, saved || payload, payload);
  if (state.uiSettings.notifyMarkedPlayers) state.notificationPlayerNotes = noteTools.mergeSavedNote(state.notificationPlayerNotes, saved || payload, payload);
  setStatus(payload.status === "watch" ? "Игрок добавлен под наблюдение." : "Наблюдение снято.");
  renderOwner(true);
}

function ownerIncidentReport(userId) {
  const player = ownerPlayer(userId);
  if (!player) throw new Error("Игрок не найден.");
  const note = adminNote(userId) || { status: "ok", note: "" };
  const activity = playerActivity(userId);
  const requests = state.ownerRequests.filter((request) => request.targetUserId === userId);
  const recentEvents = state.events.filter((event) => String(event?.userId || "") === userId).slice(-8).reverse();
  const recentAvatars = activity.avatars.slice(-5).reverse();
  const english = i18n?.language?.() === "en";
  return [
    english ? "VRChat Admin Tools · incident card" : "VRChat Admin Tools · карточка инцидента",
    `${english ? "Player" : "Игрок"}: ${eventName(player)}`,
    `User ID: ${userId}`,
    `${english ? "World" : "Мир"}: ${activity.worldName || "—"}`,
    `${english ? "Status" : "Статус"}: ${adminStatusLabel(note.status)}`,
    `${english ? "Note" : "Заметка"}: ${note.note || (english ? "none" : "нет")}`,
    `${english ? "Confirmed operations" : "Подтверждённых операций"}: ${requests.filter((request) => request.status === "succeeded").length}`,
    "",
    english ? "Recent avatars:" : "Последние аватары:",
    ...(recentAvatars.length ? recentAvatars.map((avatar) => `- ${avatar.avatarName || avatar.avatarId || "—"}${avatar.avatarId ? ` · ${avatar.avatarId}` : ""}`) : [english ? "- no data" : "- нет данных"]),
    "",
    english ? "Recent events:" : "Последние события:",
    ...(recentEvents.length ? recentEvents.map((event) => `- ${eventTime(event)} · ${eventKind(event)} · ${eventDetail(event)}`) : [english ? "- no events" : "- нет событий"])
  ].join("\n");
}

function renderOwnerCard() {
  if (!ownerCard) return;
  ownerCard.replaceChildren();
  const player = ownerPlayer(state.ownerSelectedUserId);
  if (!player) {
    renderOwnerOverview();
    return;
  }
  ownerCard.classList.remove("adminPreviewEmpty");
  const content = adminElement("div", "adminCardContent");
  const header = adminElement("header", "adminCardHeader");
  const identity = adminElement("div", "adminIdentity");
  identity.append(playerMarker(Boolean(player.online), true), adminElement("div"));
  identity.lastElementChild.append(userTextElement("h2", "", eventName(player)), userTextElement("code", "", player.userId));
  const close = adminElement("button", "adminCardClose", "×");
  close.type = "button";
  close.dataset.ownerClear = "true";
  close.title = "Убрать выбранного игрока";
  header.append(identity, close);
  content.append(header);

  const meta = adminElement("div", "adminMetaGrid");
  appendAdminMeta(meta, "Статус", player.online ? "в сети" : "не в сети");
  appendAdminMeta(meta, "Последнее событие", eventKind(player));
  appendAdminMeta(meta, "Время", player.timestamp ? adminDate(player.timestamp) : "—");
  content.append(meta);
  renderPlayerActivity(content, { ...player, displayName: eventName(player) });

  const note = adminNote(player.userId);
  const noteBlock = note
    ? appendSeparated(adminElement("p", "ownerAccessNotice"), [{ text: adminStatusLabel(note.status) }, note.note ? { text: note.note, user: true } : { text: "без заметки" }])
    : adminElement("p", "ownerAccessNotice", "Командной заметки пока нет.");
  content.append(noteBlock);

  const actions = adminElement("div", "ownerCardActions");
  const profile = adminElement("button", "", "Профиль VRChat");
  profile.type = "button";
  profile.dataset.ownerProfile = player.userId;
  const admin = adminElement("button", "", "Открыть в Admin Tools");
  admin.type = "button";
  admin.dataset.ownerAdmin = player.userId;
  const watching = adminNote(player.userId)?.status === "watch";
  const watch = adminElement("button", watching ? "active" : "", watching ? "Снять наблюдение" : "Наблюдать");
  watch.type = "button";
  watch.dataset.ownerWatch = player.userId;
  const copyIncident = adminElement("button", "", "Копировать карточку");
  copyIncident.type = "button";
  copyIncident.dataset.ownerCopyIncident = player.userId;
  actions.append(profile, admin, watch, copyIncident);
  if (canRequestOwnerBans()) {
    const ban = adminElement("button", "dangerAction", "Забанить");
    ban.type = "button";
    ban.dataset.ownerModeration = "ban";
    const unban = adminElement("button", "", "Разбанить");
    unban.type = "button";
    unban.dataset.ownerModeration = "unban";
    actions.append(ban, unban);
  }
  content.append(actions);
  if (!canRequestOwnerBans()) content.append(adminElement("p", "ownerAccessNotice", "У этого ключа нет права отправлять запросы бан/разбан."));
  if (state.ownerError) content.append(adminElement("p", "adminError", state.ownerError));
  if (state.ownerSource === "group") renderOwnerGroupPanel(content, player);
  renderOwnerRequests(content, player.userId);
  ownerCard.append(content);
}

function renderOwner(force = false) {
  if (!hasOwnerAccess()) return;
  renderOwnerList(force);
  renderOwnerCard();
}

async function refreshOwner({ silent = false } = {}) {
  if (!hasOwnerAccess() || state.ownerLoading) return;
  state.ownerLoading = true;
  state.ownerError = "";
  renderOwner();
  try {
    const [requests, notes, groupRequests] = await Promise.all([
      canRequestOwnerBans() ? api.listGroupBanRequests() : Promise.resolve([]),
      api.listPlayerNotes(),
      canViewGroupMembers() ? api.listGroupManagementRequests() : Promise.resolve([])
    ]);
    state.ownerRequests = requests || [];
    state.adminNotes = (notes || []).map(noteTools.normalizeNote).filter((row) => row.userId);
    state.groupManagementRequests = groupRequests || [];
    applyGroupManagementResults();
  } catch (error) {
    state.ownerError = error.message || "Не удалось загрузить Owner.";
    if (!silent) setStatus(state.ownerError, true);
  } finally {
    state.ownerLoading = false;
    renderOwner(true);
  }
}

function syncOwnerPolling() {
  if (state.ownerPollTimer) clearInterval(state.ownerPollTimer);
  state.ownerPollTimer = 0;
  if (state.view !== "owner" || !hasOwnerAccess()) return;
  state.ownerPollTimer = setInterval(async () => {
    if (state.ownerLoading) return;
    try {
      const [requests, groupRequests] = await Promise.all([
        canRequestOwnerBans() ? api.listGroupBanRequests() : Promise.resolve([]),
        canViewGroupMembers() ? api.listGroupManagementRequests() : Promise.resolve([])
      ]);
      state.ownerRequests = requests || [];
      state.groupManagementRequests = groupRequests || [];
      applyGroupManagementResults();
      renderOwner(true);
    } catch {
      // Фоновое обновление не должно перекрывать рабочий экран ошибкой сети.
    }
  }, 5000);
}

async function readTodayOwnerPlayers() {
  state.ownerLoading = true;
  renderOwner();
  try {
    const result = await api.readTodayPlayers();
    const rows = (result?.players || []).map(normalizeOwnerPlayer).filter(Boolean);
    const merged = new Map(state.ownerCatalog.map((player) => [player.userId, player]));
    for (const player of rows) merged.set(player.userId, { ...(merged.get(player.userId) || {}), ...player });
    state.ownerCatalog = [...merged.values()];
    setStatus(`За сегодня найдено ${rows.length} игроков в ${Number(result?.fileCount || 0)} логах.`);
  } finally {
    state.ownerLoading = false;
    renderOwner(true);
  }
}

function openPlayerInOwner(player) {
  const normalized = normalizeOwnerPlayer(player);
  if (!hasOwnerAccess() || !normalized) throw new Error("Owner недоступен для этого ключа.");
  const index = state.ownerCatalog.findIndex((row) => row.userId === normalized.userId);
  if (index >= 0) state.ownerCatalog[index] = { ...state.ownerCatalog[index], ...normalized };
  else state.ownerCatalog.unshift(normalized);
  state.ownerSelectedUserId = normalized.userId;
  closeSessionPlayer();
  selectView("owner");
  renderOwner(true);
}

function openOwnerModerationDialog(action) {
  const player = ownerPlayer(state.ownerSelectedUserId);
  if (!player || !canRequestOwnerBans()) return;
  state.ownerDialogUserId = player.userId;
  ownerDialogReturnFocus = focusedElement();
  ownerModerationForm.reset();
  ownerModerationForm.elements.action.value = action === "unban" ? "unban" : "ban";
  setUserText(ownerDialog.querySelector("[data-owner-dialog-target]"), `${eventName(player)} · ${player.userId}`);
  syncOwnerModerationFields();
  ownerDialog.showModal();
  ownerModerationForm.elements.reason.focus();
}

function closeOwnerDialog() {
  const returnFocus = ownerDialogReturnFocus;
  ownerDialogReturnFocus = null;
  state.ownerDialogUserId = "";
  if (ownerDialog?.open) ownerDialog.close();
  restoreFocus(returnFocus);
}

function syncOwnerModerationFields() {
  if (!ownerModerationForm) return;
  const action = ownerModerationForm.elements.action.value;
  const temporary = action === "ban" && ownerModerationForm.elements.durationMode.value === "temporary";
  document.querySelector("[data-owner-duration-mode]").hidden = action === "unban";
  document.querySelector("[data-owner-duration]").hidden = !temporary;
  document.querySelector("[data-owner-dialog-submit]").textContent = action === "unban" ? "Отправить разбан" : "Отправить бан";
}

function ownerDurationMinutes(form) {
  if (form.elements.durationMode.value !== "temporary") return null;
  const value = Number(form.elements.duration.value);
  const multiplier = ({ minutes: 1, hours: 60, days: 1440 })[form.elements.durationUnit.value] || 1;
  const minutes = Math.round(value * multiplier);
  if (!Number.isFinite(minutes) || minutes < 5 || minutes > 43200) throw new Error("Временный бан должен быть от 5 минут до 30 дней.");
  return minutes;
}

async function submitOwnerModeration(form) {
  const player = ownerPlayer(state.ownerDialogUserId);
  if (!player) throw new Error("Игрок не найден.");
  const action = form.elements.action.value === "unban" ? "unban" : "ban";
  const request = {
    targetUserId: player.userId,
    targetDisplayName: eventName(player),
    reason: String(form.elements.reason.value || "").trim(),
    evidenceUrl: String(form.elements.evidenceUrl.value || "").trim()
  };
  if (!request.reason) throw new Error("Укажите причину действия.");
  const queued = action === "unban"
    ? await api.requestGroupUnban(request)
    : await api.requestGroupBan({ ...request, durationMinutes: ownerDurationMinutes(form) });
  state.ownerRequests = [queued, ...state.ownerRequests.filter((row) => row.id !== queued.id)];
  closeOwnerDialog();
  setStatus(action === "unban" ? "Запрос на разбан отправлен." : "Запрос на бан отправлен.");
  renderOwnerCard();
}

function saveCrashState() {
  localStorage.setItem("betaCrashEnabled", String(state.crashEnabled));
  localStorage.setItem("betaCrashIncidents", JSON.stringify(state.crashIncidents.slice(0, crashModel.MAX_INCIDENTS)));
}

function selectedCrashIncident() {
  return state.crashIncidents.find((incident) => incident.id === state.selectedCrashIncidentId) || state.crashIncidents[0] || null;
}

function crashIncidentRow(incident) {
  const button = adminElement("button", "crashIncidentButton");
  button.type = "button";
  button.dataset.crashIncidentId = incident.id;
  button.classList.toggle("active", incident.id === selectedCrashIncident()?.id);
  const header = adminElement("header");
  header.append(adminElement("strong", "", incident.reason), adminElement("time", "", adminDate(incident.createdAt)));
  const candidateCount = (incident.suspects || []).length;
  button.append(header, userOrUiElement("span", "", incident.worldName, "Мир не определён"), adminElement("em", "", `${candidateCount} кандидатов · ${(incident.candidates || []).length} событий`));
  return button;
}

function renderCrashList() {
  if (!crashList) return;
  crashList.replaceChildren();
  for (const incident of state.crashIncidents) crashList.append(crashIncidentRow(incident));
  if (!state.crashIncidents.length) crashList.append(emptyMessage("Инцидентов пока нет."));
  const count = document.querySelector("[data-crash-count]");
  if (count) count.textContent = `${state.crashIncidents.length} записей`;
}

function crashSuspectCard(candidate, index) {
  const card = adminElement("article", "crashSuspectCard");
  const risk = adminElement("span", "crashRiskBadge", `${candidate.risk} · ${candidate.score}`);
  risk.dataset.risk = candidate.risk;
  const copy = adminElement("div", "crashSuspectCopy");
  const candidateName = candidate.playerName || candidate.userId;
  const candidateAvatar = candidate.avatarName || candidate.avatarId;
  copy.append(
    candidateName ? userTextElement("strong", "", `#${index + 1} ${candidateName}`) : adminElement("strong", "", `#${index + 1} Неизвестный игрок`),
    userOrUiElement("span", "", candidateAvatar, "Аватар не определён")
  );
  const actions = adminElement("div", "crashSuspectActions");
  if (candidate.userId) {
    const profile = adminElement("button", "", "Профиль");
    profile.type = "button";
    profile.dataset.crashProfile = candidate.userId;
    const admin = adminElement("button", "", "Admin");
    admin.type = "button";
    admin.dataset.crashAdmin = candidate.userId;
    admin.dataset.crashName = candidate.playerName || candidate.userId;
    actions.append(profile, admin);
    if (hasOwnerAccess()) {
      const owner = adminElement("button", "ownerActionButton", "Owner");
      owner.type = "button";
      owner.dataset.crashOwner = candidate.userId;
      owner.dataset.crashOwnerName = candidate.playerName || candidate.userId;
      actions.append(owner);
    }
  }
  if (candidate.avatarId) {
    const avatar = adminElement("button", "", "Аватар");
    avatar.type = "button";
    avatar.dataset.crashAvatar = candidate.avatarId;
    actions.append(avatar);
  }
  card.append(risk, copy, actions, adminElement("p", "crashSuspectReasons", (candidate.reasons || []).join(" · ") || "Нет подробностей для оценки."));
  return card;
}

function renderCrashDetail() {
  if (!crashDetail) return;
  crashDetail.replaceChildren();
  const incident = selectedCrashIncident();
  if (!incident) {
    crashDetail.classList.add("adminPreviewEmpty");
    crashDetail.append(adminElement("span", "profileAvatar", "C"), adminElement("h2", "", "Выберите инцидент"), adminElement("p", "", "Здесь появятся кандидаты по времени и последовательность последних событий."));
    return;
  }
  crashDetail.classList.remove("adminPreviewEmpty");
  const content = adminElement("div", "crashDetailContent");
  const header = adminElement("header", "crashDetailHeader");
  const title = adminElement("div");
  title.append(adminElement("span", "eyebrow", incident.manual ? "Ручной снимок" : "Автоматический инцидент"), adminElement("h2", "", incident.reason), labeledUserElement("p", "", "Мир", incident.worldName));
  header.append(title, adminElement("time", "", adminDate(incident.createdAt)));
  content.append(header);

  const suspects = adminElement("section", "crashSuspects");
  suspects.append(adminElement("h3", "", "Кандидаты только по времени"));
  for (const [index, candidate] of (incident.suspects || []).entries()) suspects.append(crashSuspectCard(candidate, index));
  if (!(incident.suspects || []).length) suspects.append(emptyMessage("Подходящих кандидатов нет."));
  content.append(suspects);

  const timeline = adminElement("section", "crashTimeline");
  timeline.append(adminElement("h3", "", "Последние события перед сбоем"));
  for (const event of (incident.candidates || []).slice(-30).reverse()) {
    const row = adminElement("div", "crashTimelineRow");
    row.append(adminElement("time", "", eventTime({ timestamp: event.time })), adminElement("i"));
    const copy = adminElement("div");
    copy.append(
      appendSeparated(adminElement("strong"), [{ text: event.playerName || event.userId, user: true }, { text: crashModel.eventLabel(event.type) }]),
      userOrUiElement("span", "", event.avatarName || event.avatarId || event.detail, "—")
    );
    row.append(copy);
    timeline.append(row);
  }
  if (!(incident.candidates || []).length) timeline.append(emptyMessage("Событий перед инцидентом не сохранено."));
  content.append(timeline);
  crashDetail.append(content);
}

function renderCrash() {
  const status = state.crashLastStatus;
  document.querySelector('[data-crash="enabled"]').textContent = state.crashEnabled ? "включено" : "выключено";
  document.querySelector('[data-crash="process"]').textContent = status ? (status.processRunning ? "запущен" : "не найден") : "—";
  document.querySelector('[data-crash="log"]').textContent = status ? (status.filePath ? "найден" : "не найден") : "—";
  document.querySelector('[data-crash="updated"]').textContent = status?.logModifiedAt ? new Date(status.logModifiedAt).toLocaleString(uiLocale()) : "—";
  const statusText = document.querySelector("[data-crash-status-text]");
  if (!state.crashEnabled) statusText.textContent = "Анализатор выключен.";
  else if (!status) statusText.textContent = "Ожидание первого статуса…";
  else if (state.crashFreezeReported) statusText.textContent = "VRChat запущен, но лог не обновлялся больше 5 минут. Это предупреждение, а не подтверждённый сбой.";
  else statusText.textContent = `VRChat: ${status.processRunning ? "запущен" : "не найден"}; ${status.logModifiedAt ? "лог обновляется" : "лог не выбран"}.`;
  const toggle = document.querySelector("[data-crash-toggle]");
  if (toggle) toggle.textContent = state.crashEnabled ? "Выключить" : "Включить";
  const hasIncidents = state.crashIncidents.length > 0;
  document.querySelector("[data-crash-copy]").disabled = !hasIncidents;
  document.querySelector("[data-crash-clear]").disabled = !hasIncidents;
  document.querySelector("[data-crash-lag]").disabled = !state.running || state.events.length === 0;
  if (!state.selectedCrashIncidentId && hasIncidents) state.selectedCrashIncidentId = state.crashIncidents[0].id;
  renderCrashList();
  renderCrashDetail();
}

function addCrashIncident(reason, status, options = {}) {
  const incident = crashModel.buildIncident(state.events, status, { reason, ...options });
  state.crashIncidents = [incident, ...state.crashIncidents.filter((row) => row.id !== incident.id)].slice(0, crashModel.MAX_INCIDENTS);
  state.selectedCrashIncidentId = incident.id;
  saveCrashState();
  renderCrash();
  setStatus(
    options.manual ? "Снимок лага сохранён." : "Возможный сбой VRChat сохранён.",
    false,
    { kind: options.manual ? "success" : "warning" }
  );
  return incident;
}

async function captureLagSnapshot() {
  if (!state.running) throw new Error("Сначала запустите чтение лога.");
  if (!state.events.length) throw new Error("Пока нет событий для снимка. Подождите после входа в мир.");
  const status = await api.getCrashStatus({ filePath: state.filePath });
  state.crashLastStatus = status;
  addCrashIncident("Администратор отметил лаг вручную", status, { manual: true });
}

async function pollCrashAnalyzer() {
  if (!state.crashEnabled) return;
  const status = await api.getCrashStatus({ filePath: state.filePath });
  const previous = state.crashLastStatus;
  state.crashLastStatus = status;
  if (previous?.processRunning && !status.processRunning && state.running) {
    addCrashIncident("VRChat неожиданно закрылся во время мониторинга", status);
  }
  if (status.processRunning && state.running && status.logModifiedAt) {
    const changed = state.crashLastLogModifiedAt !== status.logModifiedAt;
    state.crashFreezeReported = !changed && Date.now() - new Date(status.logModifiedAt).getTime() > 5 * 60 * 1000 && state.events.length > 0;
    if (changed) state.crashLastLogModifiedAt = status.logModifiedAt;
  } else {
    state.crashFreezeReported = false;
  }
  if (state.view === "crash") renderCrash();
}

function startCrashAnalyzer() {
  if (state.crashPollTimer) return;
  state.crashPollTimer = setInterval(() => pollCrashAnalyzer().catch((error) => setStatus(`Crash Analyzer: ${error.message}`, true)), 5000);
  void pollCrashAnalyzer().catch((error) => setStatus(`Crash Analyzer: ${error.message}`, true));
}

function stopCrashAnalyzer() {
  if (state.crashPollTimer) clearInterval(state.crashPollTimer);
  state.crashPollTimer = 0;
  renderCrash();
}

function toggleCrashAnalyzer() {
  if (!state.crashEnabled) {
    const confirmed = window.confirm(t("Crash Analyzer отслеживает состояние VRChat и последние события перед возможным сбоем. Возможны ложные совпадения. Включить анализатор?"));
    if (!confirmed) return;
    state.crashEnabled = true;
    startCrashAnalyzer();
  } else {
    state.crashEnabled = false;
    stopCrashAnalyzer();
  }
  saveCrashState();
  renderCrash();
}

async function copyCrashReport() {
  await api.writeClipboardText(crashModel.report(selectedCrashIncident(), i18n.language()));
  setStatus("Отчёт Crash Analyzer скопирован.");
}

function clearCrashHistory() {
  if (!state.crashIncidents.length) return;
  if (!window.confirm(t(`Удалить всю историю Crash Analyzer (${state.crashIncidents.length})?`))) return;
  state.crashIncidents = [];
  state.selectedCrashIncidentId = "";
  saveCrashState();
  renderCrash();
  setStatus("История Crash Analyzer очищена.");
}

async function refreshCrash() {
  try {
    state.crashLastStatus = await api.getCrashStatus({ filePath: state.filePath });
    renderCrash();
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
  if (result.filePath) {
    setFilePath(result.filePath);
    setStatus("Лог выбран. Можно запускать чтение или анализ.");
  } else {
    setStatus("Выбор лога отменён.", false, { kind: "info" });
  }
}

async function analyzeLog() {
  setStatus("Подготавливаем анализ текущего инстанса…");
  const options = await api.prepareAnalyzeOptions({ filePath: state.filePath });
  if (options?.canceled) {
    setStatus("Анализ отменён");
    return;
  }
  const payload = await api.analyzeCurrentInstance({ ...options, filePath: options?.filePath || state.filePath, deferPlaySession: true });
  if (options?.filePath) setFilePath(options.filePath);
  state.running = Boolean(payload?.followState?.running);
  state.currentPlaySessionId = String(payload?.playSessionId || state.currentPlaySessionId || "");
  if (payload?.currentUser) state.currentVrchatUser = payload.currentUser;
  if (payload?.currentInstance) state.currentVrchatInstance = payload.currentInstance;
  state.playSessionLastSyncAt = 0;
  if (state.running) {
    if (!state.startedAt) state.startedAt = Date.now();
    state.stoppedAt = null;
  }
  document.querySelector('[data-action="start"]').disabled = state.running;
  document.querySelector('[data-action="stop"]').disabled = !state.running;
  if (state.view === "crash") renderCrash();
  const instance = payload?.currentInstance;
  const hasCapacity = instance?.capacity !== null && instance?.capacity !== undefined && Number.isFinite(Number(instance.capacity));
  const online = instance?.nUsers !== null && instance?.nUsers !== undefined && Number.isFinite(Number(instance.nUsers))
    ? ` · онлайн ${Number(instance.nUsers)}${hasCapacity ? `/${Number(instance.capacity)}` : ""}`
    : "";
  const synced = await syncCurrentPlaySession({ force: true, announceError: true });
  setStatus(
    `Анализ завершён${online}. Новые события отслеживаются автоматически.${synced ? "" : " Сессия будет синхронизирована позднее."}`,
    false,
    { kind: synced ? "success" : "warning" }
  );
}

async function analyzeTodayLogs() {
  setStatus("Анализируем логи за текущий день…", false, { kind: "info" });
  let filePath = state.filePath;
  if (!filePath) {
    const latest = await api.latestFile();
    filePath = latest?.filePath || "";
  }
  if (!filePath) throw new Error("Логи VRChat за сегодня не найдены.");
  const payload = await api.analyzeCurrentInstance({
    filePath,
    mode: "today",
    scope: "all",
    maxFiles: 60,
    maxLines: 100000,
    maxBytesPerFile: 12 * 1024 * 1024,
    deferPlaySession: true
  });
  setFilePath(payload?.followState?.filePath || filePath);
  state.running = Boolean(payload?.followState?.running);
  state.currentPlaySessionId = String(payload?.playSessionId || state.currentPlaySessionId || "");
  if (payload?.currentUser) state.currentVrchatUser = payload.currentUser;
  if (payload?.currentInstance) state.currentVrchatInstance = payload.currentInstance;
  state.playSessionLastSyncAt = 0;
  document.querySelector('[data-action="start"]').disabled = state.running;
  document.querySelector('[data-action="stop"]').disabled = !state.running;
  setStatus("Логи за текущий день проанализированы. Новые события отслеживаются автоматически.", false, { kind: "success" });
}

function buildSessionSnapshot() {
  const stats = sessionStats();
  const onlinePlayers = stats.players.filter((player) => player.online).slice(0, 25);
  const english = i18n?.language?.() === "en";
  return [
    "**VRChat Admin Snapshot · Beta**",
    `${english ? "World" : "Мир"}: ${stats.world}`,
    `${english ? "Online" : "Онлайн"}: ${stats.online}`,
    `${english ? "Peak" : "Пик"}: ${stats.peak}`,
    `${english ? "Unique players" : "Уникальных игроков"}: ${stats.unique}`,
    `${english ? "Events" : "Событий"}: ${state.events.length}`,
    "",
    english ? "**Online players:**" : "**Онлайн игроки:**",
    onlinePlayers.length ? onlinePlayers.map((player) => `• ${eventName(player)}`).join("\n") : (english ? "no data" : "нет данных")
  ].join("\n");
}

async function copySnapshot() {
  await api.writeClipboardText(buildSessionSnapshot());
  setStatus("Снимок текущей сессии скопирован");
}

async function openCommunity() {
  await api.openExternal("https://discord.gg/wXFuzxEbfC");
  setStatus("Сообщество открыто в браузере");
}

async function installUpdate() {
  await api.installUpdate();
  setStatus("Установка обновления запущена");
}

async function startTail() {
  const stats = sessionStats();
  const payload = await api.startTail({ filePath: state.filePath, fromStart: false, worldName: stats.world === "—" ? "" : stats.world, deferPlaySession: true });
  if (state.playSessionSyncTimer) window.clearTimeout(state.playSessionSyncTimer);
  state.playSessionSyncTimer = 0;
  state.running = true;
  state.currentPlaySessionId = String(payload?.playSessionId || "");
  state.playSessionLastSyncAt = 0;
  state.startedAt = Date.now();
  state.stoppedAt = null;
  state.events = [];
  renderSession();
  document.querySelector('[data-action="start"]').disabled = true;
  document.querySelector('[data-action="stop"]').disabled = false;
  if (state.view === "crash") renderCrash();
  const synced = await syncCurrentPlaySession({ force: true, announceError: true });
  setStatus(
    `${payload?.filePath ? "Чтение лога запущено" : "Мониторинг запущен"}${synced ? "" : ". Сессия будет синхронизирована позднее"}`,
    false,
    { kind: synced ? "success" : "warning" }
  );
}

async function stopTail() {
  const stoppedAt = Date.now();
  if (state.playSessionSyncTimer) window.clearTimeout(state.playSessionSyncTimer);
  state.playSessionSyncTimer = 0;
  if (state.playSessionSyncPromise) await state.playSessionSyncPromise;
  await api.stopTail(currentPlaySessionStats());
  state.running = false;
  state.currentPlaySessionId = "";
  state.playSessionLastSyncAt = 0;
  state.playSessionDirty = false;
  state.stoppedAt = stoppedAt;
  updateDashboardClock();
  document.querySelector('[data-action="start"]').disabled = false;
  document.querySelector('[data-action="stop"]').disabled = true;
  if (state.view === "crash") renderCrash();
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
      vrchatAuthCookie: submittedVrchatCookie(),
      rememberMe: form.get("rememberMe") === "on"
    });
    state.settings = await api.getSettings();
    setStoredCookieState(Boolean(state.settings.hasVrchatAuthCookie));
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

vrchatAuthCookieInput?.addEventListener("input", () => {
  vrchatAuthCookieInput.dataset.dirty = "true";
});

checkVrchatButton?.addEventListener("click", async () => {
  checkVrchatButton.disabled = true;
  setActivationStatus("Проверяем VRChat аккаунт…");
  try {
    const saved = await api.saveSettings({
      serverUrl: state.settings?.serverUrl,
      vrchatAuthCookie: submittedVrchatCookie()
    });
    const hasStoredCookie = Boolean(saved?.hasVrchatAuthCookie);
    if (state.settings) state.settings.hasVrchatAuthCookie = hasStoredCookie;
    setStoredCookieState(hasStoredCookie);
    const user = await api.getVrchatCurrentUser();
    const instance = await api.getVrchatCurrentInstance().catch(() => null);
    const location = user?.location ? ` · ${user.location}` : "";
    const online = Number.isFinite(Number(instance?.nUsers))
      ? ` · онлайн ${Number(instance.nUsers)}${Number.isFinite(Number(instance?.capacity)) ? `/${Number(instance.capacity)}` : ""}`
      : "";
    setActivationStatus(`VRChat: ${user?.displayName || user?.id || "аккаунт найден"}${location}${online}`);
  } catch (error) {
    setActivationStatus(formatVrchatAuthError(error), true);
  } finally {
    checkVrchatButton.disabled = false;
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

settingsForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const previousLanguage = state.uiSettings.language;
  state.uiSettings = readSettingsForm();
  if (!state.uiSettings.rememberSelection) localStorage.removeItem("betaRememberedSelections");
  state.sessionPlayerMode = state.uiSettings.sessionPlayerMode;
  localStorage.setItem("betaSessionPlayerMode", state.sessionPlayerMode);
  if (state.events.length > state.uiSettings.eventLimit) state.events.splice(0, state.events.length - state.uiSettings.eventLimit);
  applyUiSettings({ persist: true });
  if (state.uiSettings.language !== previousLanguage) {
    window.location.reload();
    return;
  }
  renderSession();
  closeSettings();
  setStatus("Настройки Beta сохранены.");
  void syncNotificationMonitoring({ refreshNow: true, announceError: true });
});

document.addEventListener("submit", (event) => {
  const avatarForm = event.target.closest("[data-avatar-note-form]");
  if (avatarForm) {
    event.preventDefault();
    saveAvatarNote(avatarForm).catch((error) => setStatus(error.message || "Не удалось сохранить заметку об аватаре.", true));
    return;
  }
  const form = event.target.closest("[data-player-note-form]");
  if (!form) return;
  event.preventDefault();
  saveAdminNote(form).catch((error) => {
    state.adminError = error.message || "Не удалось сохранить заметку.";
    setStatus(state.adminError, true);
    renderAdminCard();
  });
});

ownerModerationForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const submit = ownerModerationForm.querySelector("[data-owner-dialog-submit]");
  submit.disabled = true;
  submitOwnerModeration(ownerModerationForm)
    .catch((error) => {
      state.ownerError = error.message || "Не удалось отправить запрос.";
      setStatus(state.ownerError, true);
      renderOwnerCard();
    })
    .finally(() => { submit.disabled = false; });
});

ownerModerationForm?.addEventListener("change", syncOwnerModerationFields);

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-status-center-toggle]")) {
    setStatusCenter(!state.statusCenterOpen);
    return;
  }

  if (event.target.closest("[data-status-clear]")) {
    clearStatusCenter();
    return;
  }

  if (state.statusCenterOpen && !event.target.closest("[data-status-center]")) setStatusCenter(false);

  if (event.target.closest("[data-header-hide]")) {
    state.uiSettings.showHeader = false;
    applyUiSettings({ persist: true });
    setStatus("Верхняя панель скрыта. Вернуть её можно стрелкой справа сверху.");
    return;
  }

  if (event.target.closest("[data-header-show]")) {
    state.uiSettings.showHeader = true;
    applyUiSettings({ persist: true });
    setStatus("Верхняя панель показана.");
    return;
  }

  if (event.target.closest("[data-settings-open]")) {
    openSettings();
    return;
  }

  if (event.target.closest("[data-settings-close]") || event.target.closest("[data-settings-cancel]")) {
    closeSettings();
    return;
  }

  if (event.target.closest("[data-settings-reset]")) {
    fillSettingsForm(DEFAULT_UI_SETTINGS);
    const status = settingsForm.querySelector("[data-settings-status]");
    if (status) status.textContent = "Значения сброшены в форме. Нажмите «Сохранить», чтобы применить.";
    return;
  }

  const viewButton = event.target.closest("[data-view-button]");
  if (viewButton) {
    selectView(viewButton.dataset.viewButton);
    return;
  }

  const sessionSection = event.target.closest("[data-session-section]")?.dataset.sessionSection;
  if (sessionSection) {
    setSessionSection(sessionSection);
    return;
  }

  const eventUserButton = event.target.closest("[data-event-user-id]");
  if (eventUserButton) {
    try {
      openPlayerInAdmin({
        userId: eventUserButton.dataset.eventUserId,
        displayName: eventUserButton.dataset.eventUserName || eventUserButton.textContent
      });
    } catch (error) {
      setStatus(error.message || "Не удалось открыть игрока в Admin Tools.", true);
    }
    return;
  }

  const eventAvatarKey = event.target.closest("[data-event-avatar-key]")?.dataset.eventAvatarKey;
  if (eventAvatarKey) {
    openAvatarFromEvent(eventAvatarKey);
    return;
  }

  const avatarKey = event.target.closest("[data-avatar-key]")?.dataset.avatarKey;
  if (avatarKey) {
    state.selectedAvatarKey = avatarKey;
    rememberSelections();
    state.avatarCandidates = [];
    state.avatarError = "";
    renderAvatarSession();
    return;
  }

  const avatarRefreshButton = event.target.closest("[data-avatar-refresh]");
  if (avatarRefreshButton) {
    runButtonOperation(avatarRefreshButton, refreshAvatars, "Обновляем…")
      .catch((error) => setStatus(error.message || "Не удалось обновить каталог аватаров.", true));
    return;
  }

  const avatarOnlineSearchButton = event.target.closest("[data-avatar-online-search]");
  if (avatarOnlineSearchButton) {
    runButtonOperation(avatarOnlineSearchButton, searchOnlineAvatars, "Ищем…")
      .catch((error) => setStatus(error.message || "Расширенный поиск аватаров недоступен.", true));
    return;
  }

  if (event.target.closest("[data-avatar-prismic]")) {
    api.openExternal("https://vrchat.com/home/launch?worldId=wrld_90abd1bf-ec04-4ec1-9e9e-a1da2344599e")
      .catch((error) => setStatus(error.message || "Не удалось открыть мир Prismic’s Avatar Search.", true));
    return;
  }

  const onlineAvatarAddButton = event.target.closest("[data-avatar-online-add]");
  const onlineAvatarId = onlineAvatarAddButton?.dataset.avatarOnlineAdd;
  if (onlineAvatarId) {
    runButtonOperation(onlineAvatarAddButton, () => addOnlineAvatarToCatalog(onlineAvatarId), "Сохраняем…")
      .catch((error) => setStatus(error.message || "Не удалось сохранить аватар в каталог.", true));
    return;
  }

  const onlineAvatarFavoriteButton = event.target.closest("[data-avatar-online-favorite]");
  const favoriteAvatarId = onlineAvatarFavoriteButton?.dataset.avatarOnlineFavorite;
  if (favoriteAvatarId) {
    runButtonOperation(onlineAvatarFavoriteButton, () => favoriteOnlineAvatar(favoriteAvatarId), "Добавляем…")
      .catch((error) => setStatus(error.message || "Не удалось добавить аватар в избранное VRChat.", true));
    return;
  }

  const avatarOpen = event.target.closest("[data-avatar-open]")?.dataset.avatarOpen;
  if (avatarOpen) {
    api.openExternal(`https://vrchat.com/home/avatar/${encodeURIComponent(avatarOpen)}`)
      .catch((error) => setStatus(error.message || "Не удалось открыть страницу аватара.", true));
    return;
  }

  const avatarResolveButton = event.target.closest("[data-avatar-resolve]");
  if (avatarResolveButton) {
    runButtonOperation(avatarResolveButton, resolveSelectedAvatar, "Проверяем…").catch((error) => {
      state.avatarError = error.message || "Не удалось проверить Avatar ID.";
      setStatus(state.avatarError, true);
      renderAvatarDetail();
    });
    return;
  }

  const avatarCandidateButton = event.target.closest("[data-avatar-candidate-id]");
  const avatarCandidateId = avatarCandidateButton?.dataset.avatarCandidateId;
  if (avatarCandidateId) {
    runButtonOperation(avatarCandidateButton, () => confirmAvatarCandidate(avatarCandidateId), "Сохраняем…")
      .catch((error) => setStatus(error.message || "Не удалось сохранить Avatar ID.", true));
    return;
  }

  const avatarPublishButton = event.target.closest("[data-avatar-global-publish]");
  if (avatarPublishButton) {
    const record = selectedAvatar();
    if (!record || !window.confirm(t("Опубликовать текущую отметку аватара для всех команд?"))) return;
    runButtonOperation(avatarPublishButton, () => publishGlobalAvatar(record), "Публикуем…")
      .catch((error) => setStatus(error.message || "Не удалось опубликовать отметку аватара.", true));
    return;
  }

  const removeGlobalAvatarButton = event.target.closest("[data-avatar-global-remove]");
  const removeGlobalAvatarId = removeGlobalAvatarButton?.dataset.avatarGlobalRemove;
  if (removeGlobalAvatarId) {
    if (!window.confirm(t("Убрать общую публикацию вашей команды об этом аватаре?"))) return;
    runButtonOperation(removeGlobalAvatarButton, async () => {
      await api.removeGlobalAvatarNote(removeGlobalAvatarId);
      state.globalAvatarNotes = state.globalAvatarNotes.filter((row) => row.avatarId !== removeGlobalAvatarId || row.sourceTeamId !== currentTeamId());
      setStatus("Общая отметка аватара удалена.");
      renderAvatarDetail();
    }, "Удаляем…").catch((error) => setStatus(error.message || "Не удалось удалить общую отметку.", true));
    return;
  }

  const sessionPlayerButton = event.target.closest("[data-session-player-id]");
  if (sessionPlayerButton) {
    const player = sessionStats().players.find((entry) => entry.userId === sessionPlayerButton.dataset.sessionPlayerId);
    if (player) openPlayerInAdmin(player);
    else openSessionPlayer(sessionPlayerButton.dataset.sessionPlayerId);
    return;
  }

  if (event.target.closest("[data-session-player-close]") || event.target === playerDrawer) {
    closeSessionPlayer();
    return;
  }

  if (event.target.closest("[data-session-player-profile]")) {
    openSessionPlayerProfile().catch((error) => setStatus(error.message || "Не удалось открыть профиль.", true));
    return;
  }

  if (event.target.closest("[data-session-player-admin]")) {
    openSessionPlayerAdmin().catch((error) => setStatus(error.message || "Не удалось открыть Admin Tools.", true));
    return;
  }

  if (event.target.closest("[data-session-player-owner]")) {
    try {
      openSessionPlayerOwner();
    } catch (error) {
      setStatus(error.message || "Не удалось открыть Owner.", true);
    }
    return;
  }

  const playerMode = event.target.closest("[data-session-player-mode]")?.dataset.sessionPlayerMode;
  if (playerMode && ["online-first", "online-only", "all"].includes(playerMode)) {
    state.sessionPlayerMode = playerMode;
    localStorage.setItem("betaSessionPlayerMode", playerMode);
    renderSession();
    return;
  }

  const eventFilter = event.target.closest("[data-session-event-filter]")?.dataset.sessionEventFilter;
  if (eventFilter) {
    toggleSessionEventFilter(eventFilter);
    return;
  }

  const layout = event.target.closest("[data-layout]")?.dataset.layout;
  if (layout) {
    document.querySelectorAll("[data-layout]").forEach((button) => button.classList.toggle("active", button.dataset.layout === layout));
    document.querySelector("[data-builder]").classList.toggle("rows", layout === "rows");
  }

  const builderAdminUser = event.target.closest("[data-builder-admin-user]")?.dataset.builderAdminUser;
  if (builderAdminUser) {
    const player = adminPlayers().find((row) => row.userId === builderAdminUser) || { userId: builderAdminUser, displayName: builderAdminUser };
    openPlayerInAdmin(player);
    return;
  }

  const builderSessionUser = event.target.closest("[data-builder-session-user]")?.dataset.builderSessionUser;
  if (builderSessionUser) {
    state.sessionSection = "feed";
    localStorage.setItem("betaSessionSection", "feed");
    selectView("session");
    renderSession();
    openSessionPlayer(builderSessionUser);
    return;
  }

  const builderAvatarKey = event.target.closest("[data-builder-avatar-key]")?.dataset.builderAvatarKey;
  if (builderAvatarKey) {
    openAvatarFromEvent(builderAvatarKey);
    return;
  }

  if (event.target.closest("[data-builder-on-top]")) {
    setBuilderAlwaysOnTop().catch((error) => setStatus(error.message || "Не удалось закрепить окно.", true));
    return;
  }

  if (event.target.closest("[data-builder-compact]")) {
    setBuilderCompact().catch((error) => setStatus(error.message || "Не удалось изменить размер окна.", true));
    return;
  }

  if (event.target.closest("[data-builder-compact-exit]")) {
    if (state.builderCompact) setBuilderCompact().catch((error) => setStatus(error.message || "Не удалось изменить размер окна.", true));
    return;
  }

  if (event.target.closest("[data-builder-apply-preset]")) {
    applyBuilderPreset(builderPreset?.value || "columns");
    return;
  }

  const builderFontButton = event.target.closest("[data-builder-font-adjust]");
  if (builderFontButton) {
    const block = builderFontButton.closest("[data-builder-kind]");
    adjustBuilderFont(block?.dataset.builderKind, builderFontButton.dataset.builderFontAdjust);
    return;
  }

  if (event.target.closest("[data-builder-reset]")) {
    if (!window.confirm(t("Сбросить расположение блоков и настройки окна Builder?"))) return;
    resetBuilder().catch((error) => setStatus(error.message || "Не удалось сбросить Builder.", true));
    return;
  }

  const adminUserButton = event.target.closest("[data-admin-user-id]");
  if (adminUserButton) {
    selectAdminPlayer(adminUserButton.dataset.adminUserId);
    return;
  }

  if (event.target.closest("[data-admin-reveal-selection]")) {
    state.adminQuery = "";
    state.adminPlayerMode = "all";
    if (adminSearch) adminSearch.value = "";
    renderAdminList(true);
    renderAdminCard();
    return;
  }

  const adminMode = event.target.closest("[data-admin-mode]")?.dataset.adminMode;
  if (adminMode && ["online-first", "online-only", "all"].includes(adminMode)) {
    state.adminPlayerMode = adminMode;
    localStorage.setItem("betaAdminPlayerMode", adminMode);
    renderAdminList(true);
    renderAdminCard();
    return;
  }

  const adminTodayButton = event.target.closest("[data-admin-today]");
  if (adminTodayButton) {
    runButtonOperation(adminTodayButton, readTodayAdminPlayers, "Читаем логи…")
      .catch((error) => setStatus(error.message || "Не удалось прочитать логи за сегодня.", true));
    return;
  }

  const adminCopyButton = event.target.closest("[data-admin-copy]");
  if (adminCopyButton) {
    runButtonOperation(adminCopyButton, copyAdminSnapshot, "Копируем…")
      .catch((error) => setStatus(error.message || "Не удалось скопировать снимок.", true));
    return;
  }

  const publishGlobalButton = event.target.closest("[data-admin-global-publish]");
  const publishGlobalUserId = publishGlobalButton?.dataset.adminGlobalPublish;
  if (publishGlobalUserId) {
    if (!window.confirm(t("Опубликовать текущую метку и заметку для всех команд?"))) return;
    runButtonOperation(publishGlobalButton, () => publishGlobalAdminNote(publishGlobalUserId), "Публикуем…")
      .catch((error) => setStatus(error.message || "Не удалось опубликовать заметку.", true));
    return;
  }

  const removeGlobalButton = event.target.closest("[data-admin-global-remove]");
  const removeGlobalUserId = removeGlobalButton?.dataset.adminGlobalRemove;
  if (removeGlobalUserId) {
    if (!window.confirm(t("Убрать общую публикацию вашей команды? Командная заметка останется."))) return;
    runButtonOperation(removeGlobalButton, () => removeGlobalAdminNote(removeGlobalUserId), "Удаляем…")
      .catch((error) => setStatus(error.message || "Не удалось удалить общую публикацию.", true));
    return;
  }

  const restoreHistoryButton = event.target.closest("[data-admin-history-restore]");
  const restoreHistoryId = restoreHistoryButton?.dataset.adminHistoryRestore;
  if (restoreHistoryId) {
    if (!window.confirm(t("Восстановить предыдущее значение командной заметки?"))) return;
    runButtonOperation(restoreHistoryButton, () => restoreAdminHistory(restoreHistoryId), "Восстанавливаем…")
      .catch((error) => setStatus(error.message || "Не удалось восстановить заметку.", true));
    return;
  }

  const profileButton = event.target.closest("[data-admin-profile]");
  if (profileButton) {
    api.openExternal(profileButton.dataset.adminProfile).catch((error) => setStatus(error.message || "Не удалось открыть профиль.", true));
    return;
  }

  const adminOwner = event.target.closest("[data-admin-owner]")?.dataset.adminOwner;
  if (adminOwner) {
    try {
      openPlayerInOwner(adminNote(adminOwner) || { userId: adminOwner, displayName: adminOwner });
    } catch (error) {
      setStatus(error.message || "Не удалось открыть игрока в Owner.", true);
    }
    return;
  }

  const adminAvatarKey = event.target.closest("[data-admin-avatar-key]")?.dataset.adminAvatarKey;
  if (adminAvatarKey) {
    openAvatarFromEvent(adminAvatarKey);
    return;
  }

  if (event.target.closest("[data-admin-clear]")) {
    if (state.adminDraftPlayer?.userId === state.selectedAdminUserId) state.adminDraftPlayer = null;
    state.selectedAdminUserId = "";
    rememberSelections();
    state.adminHistoryRequestId += 1;
    state.adminHistory = [];
    state.adminError = "";
    renderAdminList(true);
    renderAdminCard();
    return;
  }

  const ownerMode = event.target.closest("[data-owner-mode]")?.dataset.ownerMode;
  if (ownerMode && ["online-first", "online-only", "all"].includes(ownerMode)) {
    state.ownerPlayerMode = ownerMode;
    localStorage.setItem("betaOwnerPlayerMode", ownerMode);
    renderOwner(true);
    return;
  }

  const ownerSource = event.target.closest("[data-owner-source]")?.dataset.ownerSource;
  if (ownerSource) {
    if (ownerSource === "group" && !canViewGroupMembers()) return;
    state.ownerSource = ownerSource === "group" ? "group" : "logs";
    state.ownerSelectedUserId = "";
    renderOwner(true);
    if (state.ownerSource === "group" && !state.groupMembers.length) {
      requestOwnerGroupMembers().catch((error) => setStatus(error.message || "Не удалось загрузить участников группы.", true));
    }
    return;
  }

  const ownerUserButton = event.target.closest("[data-owner-user-id]");
  if (ownerUserButton) {
    state.ownerSelectedUserId = ownerUserButton.dataset.ownerUserId;
    rememberSelections();
    state.ownerError = "";
    renderOwner(true);
    return;
  }

  const ownerWatchButton = event.target.closest("[data-owner-watch]");
  if (ownerWatchButton) {
    runButtonOperation(ownerWatchButton, () => toggleOwnerWatch(ownerWatchButton.dataset.ownerWatch), "Сохраняем…")
      .catch((error) => setStatus(error.message || "Не удалось изменить наблюдение.", true));
    return;
  }

  const ownerCopyIncidentButton = event.target.closest("[data-owner-copy-incident]");
  if (ownerCopyIncidentButton) {
    runButtonOperation(ownerCopyIncidentButton, async () => {
      await api.writeClipboardText(ownerIncidentReport(ownerCopyIncidentButton.dataset.ownerCopyIncident));
      setStatus("Карточка инцидента скопирована.");
    }, "Копируем…").catch((error) => setStatus(error.message || "Не удалось скопировать карточку инцидента.", true));
    return;
  }

  if (event.target.closest("[data-owner-clear]")) {
    state.ownerSelectedUserId = "";
    rememberSelections();
    state.ownerError = "";
    renderOwner(true);
    return;
  }

  const ownerProfile = event.target.closest("[data-owner-profile]")?.dataset.ownerProfile;
  if (ownerProfile) {
    api.openExternal(`https://vrchat.com/home/user/${encodeURIComponent(ownerProfile)}`)
      .catch((error) => setStatus(error.message || "Не удалось открыть профиль.", true));
    return;
  }

  const ownerAdmin = event.target.closest("[data-owner-admin]")?.dataset.ownerAdmin;
  if (ownerAdmin) {
    const player = ownerPlayer(ownerAdmin);
    state.adminDraftPlayer = noteTools.normalizeNote({
      userId: ownerAdmin,
      displayName: player ? eventName(player) : ownerAdmin,
      status: adminNote(ownerAdmin)?.status || "ok",
      note: adminNote(ownerAdmin)?.note || ""
    });
    state.selectedAdminUserId = ownerAdmin;
    state.adminHistory = [];
    selectView("admin");
    renderAdminList(true);
    renderAdminCard();
    return;
  }

  const ownerModeration = event.target.closest("[data-owner-moderation]")?.dataset.ownerModeration;
  if (ownerModeration) {
    openOwnerModerationDialog(ownerModeration);
    return;
  }

  const retryRequestButton = event.target.closest("[data-owner-retry]");
  const retryRequestId = retryRequestButton?.dataset.ownerRetry;
  if (retryRequestId) {
    runButtonOperation(retryRequestButton, async () => {
      const request = await api.retryGroupBanRequest(retryRequestId);
        state.ownerRequests = [request, ...state.ownerRequests.filter((row) => row.id !== request.id)];
        setStatus("Запрос повторно добавлен в очередь.");
        renderOwnerCard();
      }, "Повторяем…")
      .catch((error) => setStatus(error.message || "Не удалось повторить запрос.", true));
    return;
  }

  const ownerTodayButton = event.target.closest("[data-owner-today]");
  if (ownerTodayButton) {
    runButtonOperation(ownerTodayButton, readTodayOwnerPlayers, "Читаем логи…")
      .catch((error) => setStatus(error.message || "Не удалось прочитать логи за сегодня.", true));
    return;
  }

  const ownerGroupLoadButton = event.target.closest("[data-owner-group-load]");
  if (ownerGroupLoadButton) {
    runButtonOperation(ownerGroupLoadButton, requestOwnerGroupMembers, "Ищем…")
      .catch((error) => setStatus(error.message || "Не удалось загрузить участников группы.", true));
    return;
  }

  const memberCheckButton = event.target.closest("[data-group-member-check]");
  if (memberCheckButton) {
    const player = ownerPlayer(state.ownerSelectedUserId);
    if (!player) return;
    runButtonOperation(memberCheckButton, () => submitGroupManagement({ action: "get_member", targetUserId: player.userId, targetDisplayName: eventName(player) }, "Проверка участника добавлена в очередь."), "Проверяем…")
      .catch((error) => setStatus(error.message || "Не удалось проверить участника.", true));
    return;
  }

  const addRole = event.target.closest("[data-group-role-add]");
  const removeRole = event.target.closest("[data-group-role-remove]");
  const roleButton = addRole || removeRole;
  if (roleButton) {
    const player = ownerPlayer(state.ownerSelectedUserId);
    if (!player) return;
    const roleId = addRole?.dataset.groupRoleAdd || removeRole.dataset.groupRoleRemove;
    const roleName = roleButton.dataset.groupRoleName || roleId;
    const action = addRole ? "add_role" : "remove_role";
    const verb = addRole ? "Выдать" : "Отозвать";
    if (!window.confirm(t(`${verb} роль «${roleName}» для ${eventName(player)}?`))) return;
    runButtonOperation(roleButton, () => submitGroupManagement({ action, targetUserId: player.userId, targetDisplayName: eventName(player), roleId, roleName }, `${verb} роль: операция добавлена в очередь.`), "Отправляем…")
      .catch((error) => setStatus(error.message || "Не удалось изменить роль.", true));
    return;
  }

  const managerNotesButton = event.target.closest("[data-group-member-notes-save]");
  if (managerNotesButton) {
    const player = ownerPlayer(state.ownerSelectedUserId);
    const managerNotes = ownerCard.querySelector("[data-group-manager-notes]")?.value || "";
    if (!player) return;
    runButtonOperation(managerNotesButton, () => submitGroupManagement({ action: "update_manager_notes", targetUserId: player.userId, targetDisplayName: eventName(player), managerNotes }, "Заметки управляющих добавлены в очередь на сохранение."), "Сохраняем…")
      .catch((error) => setStatus(error.message || "Не удалось сохранить заметки.", true));
    return;
  }

  const memberKickButton = event.target.closest("[data-group-member-kick]");
  if (memberKickButton) {
    const player = ownerPlayer(state.ownerSelectedUserId);
    if (!player || !window.confirm(t(`Исключить ${eventName(player)} из VRChat-группы?`))) return;
    runButtonOperation(memberKickButton, () => submitGroupManagement({ action: "kick_member", targetUserId: player.userId, targetDisplayName: eventName(player) }, "Исключение участника добавлено в очередь."), "Отправляем…")
      .catch((error) => setStatus(error.message || "Не удалось исключить участника.", true));
    return;
  }

  if (event.target.closest("[data-owner-dialog-close]") || event.target.closest("[data-owner-dialog-cancel]")) {
    closeOwnerDialog();
    return;
  }

  const crashIncidentId = event.target.closest("[data-crash-incident-id]")?.dataset.crashIncidentId;
  if (crashIncidentId) {
    state.selectedCrashIncidentId = crashIncidentId;
    renderCrash();
    return;
  }

  if (event.target.closest("[data-crash-toggle]")) {
    toggleCrashAnalyzer();
    return;
  }

  const crashLagButton = event.target.closest("[data-crash-lag]");
  if (crashLagButton) {
    runButtonOperation(crashLagButton, captureLagSnapshot, "Сохраняем…")
      .catch((error) => setStatus(error.message || "Не удалось сохранить снимок лага.", true));
    return;
  }

  const crashCopyButton = event.target.closest("[data-crash-copy]");
  if (crashCopyButton) {
    runButtonOperation(crashCopyButton, copyCrashReport, "Копируем…")
      .catch((error) => setStatus(error.message || "Не удалось скопировать отчёт.", true));
    return;
  }

  if (event.target.closest("[data-crash-clear]")) {
    clearCrashHistory();
    return;
  }

  const insightsCopyButton = event.target.closest("[data-insights-copy]");
  if (insightsCopyButton) {
    runButtonOperation(insightsCopyButton, copyInsightsRecap, "Копируем…")
      .catch((error) => setStatus(error.message || "Не удалось скопировать итог.", true));
    return;
  }

  const insightProfile = event.target.closest("[data-insight-profile]")?.dataset.insightProfile;
  if (insightProfile) {
    api.openExternal(`https://vrchat.com/home/user/${encodeURIComponent(insightProfile)}`)
      .catch((error) => setStatus(error.message || "Не удалось открыть профиль.", true));
    return;
  }

  const insightSession = event.target.closest("[data-insight-session]")?.dataset.insightSession;
  if (insightSession) {
    state.selectedInsightSessionKey = insightSession;
    renderInsights();
    return;
  }

  const historySession = event.target.closest("[data-history-session]")?.dataset.historySession;
  if (historySession) {
    state.historySelectedKey = historySession;
    rememberSelections();
    renderHistory(true);
    return;
  }

  const historyCopyButton = event.target.closest("[data-history-copy]");
  const historyCopy = historyCopyButton?.dataset.historyCopy;
  if (historyCopy) {
    runButtonOperation(historyCopyButton, () => copyHistorySession(historyCopy), "Копируем…")
      .catch((error) => setStatus(error.message || "Не удалось скопировать сессию.", true));
    return;
  }

  const historyProfile = event.target.closest("[data-history-profile]")?.dataset.historyProfile;
  if (historyProfile) {
    api.openExternal(`https://vrchat.com/home/user/${encodeURIComponent(historyProfile)}`)
      .catch((error) => setStatus(error.message || "Не удалось открыть профиль.", true));
    return;
  }

  const historyOwnerButton = event.target.closest("[data-history-owner]");
  if (historyOwnerButton) {
    try {
      openPlayerInOwner({
        userId: historyOwnerButton.dataset.historyOwner,
        displayName: historyOwnerButton.dataset.historyOwnerName
      });
    } catch (error) {
      setStatus(error.message || "Не удалось открыть игрока в Owner.", true);
    }
    return;
  }

  if (event.target.closest("[data-history-reset]")) {
    state.historyQuery = "";
    state.historyDate = "";
    state.historyStatus = "all";
    state.historySelectedKey = "";
    historySearch.value = "";
    historyDate.value = "";
    historyState.value = "all";
    renderHistory(true);
    return;
  }

  const crashProfile = event.target.closest("[data-crash-profile]")?.dataset.crashProfile;
  if (crashProfile) {
    api.openExternal(`https://vrchat.com/home/user/${encodeURIComponent(crashProfile)}`)
      .catch((error) => setStatus(error.message || "Не удалось открыть профиль.", true));
    return;
  }

  const crashOwnerButton = event.target.closest("[data-crash-owner]");
  if (crashOwnerButton) {
    try {
      openPlayerInOwner({
        userId: crashOwnerButton.dataset.crashOwner,
        displayName: crashOwnerButton.dataset.crashOwnerName
      });
    } catch (error) {
      setStatus(error.message || "Не удалось открыть игрока в Owner.", true);
    }
    return;
  }

  const crashAvatar = event.target.closest("[data-crash-avatar]")?.dataset.crashAvatar;
  if (crashAvatar) {
    api.openExternal(`https://vrchat.com/home/avatar/${encodeURIComponent(crashAvatar)}`)
      .catch((error) => setStatus(error.message || "Не удалось открыть аватар.", true));
    return;
  }

  const crashAdmin = event.target.closest("[data-crash-admin]");
  if (crashAdmin) {
    const userId = crashAdmin.dataset.crashAdmin;
    state.adminDraftPlayer = noteTools.normalizeNote({ userId, displayName: crashAdmin.dataset.crashName || userId, status: adminNote(userId)?.status || "ok", note: adminNote(userId)?.note || "" });
    state.selectedAdminUserId = userId;
    state.adminHistory = [];
    selectView("admin");
    renderAdminList(true);
    renderAdminCard();
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  const action = actionButton?.dataset.action;
  if (!action) return;
  const operations = {
    choose: chooseLog,
    analyze: analyzeLog,
    snapshot: copySnapshot,
    community: openCommunity,
    start: startTail,
    stop: stopTail,
    update: installUpdate,
    "refresh-insights": refreshInsights,
    "refresh-admin": refreshAdmin,
    "refresh-owner": refreshOwner,
    "refresh-crash": refreshCrash,
    "refresh-history": refreshHistory,
    logout: async () => {
      if (state.uiSettings.clearOnLogout) {
        state.sessionPlayerQuery = "";
        state.adminQuery = "";
        state.ownerQuery = "";
        state.avatarQuery = "";
        state.historyQuery = "";
        state.selectedSessionUserId = "";
        state.selectedAdminUserId = "";
        state.ownerSelectedUserId = "";
        state.selectedAvatarKey = "";
        state.historySelectedKey = "";
        localStorage.removeItem("betaRememberedSelections");
      }
      await api.logout();
      showActivation("Сессия завершена.");
    }
  };
  const operation = operations[action];
  if (operation) {
    runButtonOperation(actionButton, operation, ACTION_PENDING_LABELS[action])
      .catch((error) => setStatus(error.message || "Операция не выполнена.", true));
  }
});

playerSearch?.addEventListener("input", () => {
  clearTimeout(state.sessionSearchTimer);
  state.sessionSearchTimer = setTimeout(() => {
    state.sessionSearchTimer = 0;
    state.sessionPlayerQuery = playerSearch.value;
    renderSession();
  }, 120);
});

avatarSearch?.addEventListener("input", () => {
  clearTimeout(state.avatarSearchTimer);
  state.avatarOnlineQuery = "";
  state.avatarOnlineRows = [];
  state.avatarOnlineError = "";
  renderAvatarOnlineResults();
  state.avatarSearchTimer = setTimeout(() => {
    state.avatarSearchTimer = 0;
    state.avatarQuery = avatarSearch.value;
    state.selectedAvatarKey = "";
    renderAvatarSession();
  }, 120);
});

avatarFilter?.addEventListener("change", () => {
  state.avatarFilter = ["crash", "unresolved"].includes(avatarFilter.value) ? avatarFilter.value : "all";
  state.selectedAvatarKey = "";
  renderAvatarSession();
});

ownerSearch?.addEventListener("input", () => {
  clearTimeout(state.ownerSearchTimer);
  state.ownerSearchTimer = setTimeout(() => {
    state.ownerSearchTimer = 0;
    state.ownerQuery = ownerSearch.value;
    renderOwner(true);
  }, 120);
});

adminSearch?.addEventListener("input", () => {
  clearTimeout(state.adminSearchTimer);
  state.adminSearchTimer = setTimeout(() => {
    state.adminSearchTimer = 0;
    state.adminQuery = adminSearch.value;
    renderAdminList(true);
    renderAdminCard();
  }, 120);
});

historySearch?.addEventListener("input", () => {
  clearTimeout(state.historySearchTimer);
  state.historySearchTimer = setTimeout(() => {
    state.historySearchTimer = 0;
    state.historyQuery = historySearch.value;
    state.historySelectedKey = "";
    renderHistory(true);
  }, 120);
});

historyDate?.addEventListener("change", () => {
  state.historyDate = historyDate.value;
  state.historySelectedKey = "";
  renderHistory(true);
});

historyState?.addEventListener("change", () => {
  state.historyStatus = ["active", "ended"].includes(historyState.value) ? historyState.value : "all";
  state.historySelectedKey = "";
  renderHistory(true);
});

insightsPeriod?.addEventListener("change", () => {
  state.insightsPeriod = insightsPeriod.value;
  state.selectedInsightSessionKey = "";
  localStorage.setItem("betaInsightsPeriod", state.insightsPeriod);
  renderInsights();
});

builderLayout?.addEventListener("change", () => {
  state.builderLayout = ["rows", "freeform"].includes(builderLayout.value) ? builderLayout.value : "grid";
  persistBuilderSettings();
  renderBuilder();
});

document.querySelector("[data-builder-blocks]")?.addEventListener("change", (event) => {
  const input = event.target.closest("input[type=checkbox]");
  if (!input || !BUILDER_KINDS.includes(input.value)) return;
  state.builderVisible = input.checked
    ? [...new Set([...state.builderVisible, input.value])]
    : state.builderVisible.filter((kind) => kind !== input.value);
  persistBuilderSettings();
  renderBuilder();
});

builderGrid?.addEventListener("input", (event) => {
  const search = event.target.closest("[data-builder-search]");
  const kind = search?.dataset.builderSearch;
  if (!kind || !BUILDER_KINDS.includes(kind)) return;
  state.builderQueries[kind] = String(search.value || "").slice(0, 120);
  persistBuilderSettings();
  renderBuilderBlockRows(kind);
});

builderOpacity?.addEventListener("input", () => {
  state.builderOpacity = Math.min(100, Math.max(40, Number(builderOpacity.value) || 100));
  document.querySelector("[data-builder-opacity-output]").textContent = `${state.builderOpacity}%`;
  persistBuilderSettings();
  clearTimeout(state.builderOpacityTimer);
  state.builderOpacityTimer = setTimeout(() => {
    state.builderOpacityTimer = 0;
    if (state.builderAlwaysOnTop) api.setWindowOpacity(state.builderOpacity / 100).catch((error) => setStatus(error.message || "Не удалось изменить прозрачность.", true));
  }, 120);
});

builderGrid?.addEventListener("dragstart", (event) => {
  if (!event.target.closest("[data-builder-order-handle]") || state.builderLayout === "freeform") {
    event.preventDefault();
    return;
  }
  const block = event.target.closest("[data-builder-kind]");
  if (!block) return;
  state.builderDraggedKind = block.dataset.builderKind;
  block.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", state.builderDraggedKind);
});

builderGrid?.addEventListener("dragover", (event) => {
  const target = event.target.closest("[data-builder-kind]");
  if (!target || target.dataset.builderKind === state.builderDraggedKind) return;
  event.preventDefault();
  builderGrid.querySelectorAll(".dragTarget").forEach((block) => block.classList.remove("dragTarget"));
  target.classList.add("dragTarget");
});

builderGrid?.addEventListener("drop", (event) => {
  const target = event.target.closest("[data-builder-kind]");
  const dragged = state.builderDraggedKind || event.dataTransfer.getData("text/plain");
  if (!target || !BUILDER_KINDS.includes(dragged) || dragged === target.dataset.builderKind) return;
  event.preventDefault();
  const order = state.builderOrder.filter((kind) => kind !== dragged);
  order.splice(order.indexOf(target.dataset.builderKind), 0, dragged);
  state.builderOrder = order;
  persistBuilderSettings();
  renderBuilder();
});

builderGrid?.addEventListener("dragend", () => {
  state.builderDraggedKind = "";
  builderGrid.querySelectorAll(".dragging, .dragTarget").forEach((block) => block.classList.remove("dragging", "dragTarget"));
});

builderGrid?.addEventListener("pointerdown", startBuilderInteraction);
document.addEventListener("pointermove", moveBuilderInteraction);
document.addEventListener("pointerup", finishBuilderInteraction);
document.addEventListener("pointercancel", finishBuilderInteraction);
window.addEventListener("resize", () => {
  if (state.view === "builder") scheduleBuilderRender();
});

eventFeed?.addEventListener("scroll", () => renderVirtualEventRows(), { passive: true });
playerList?.addEventListener("scroll", () => renderVirtualPlayerRows(), { passive: true });
avatarSessionList?.addEventListener("scroll", () => renderAvatarRows(), { passive: true });
ownerList?.addEventListener("scroll", () => renderOwnerList(), { passive: true });
noteList?.addEventListener("scroll", () => renderAdminList(), { passive: true });
historyList?.addEventListener("scroll", () => renderHistory(), { passive: true });
document.addEventListener("keydown", (event) => {
  if (moveTabFocus(event)) return;
  if (!playerDrawer?.hidden && trapFocus(event, playerDrawer.querySelector('[role="dialog"]'))) return;
  if (event.key !== "Escape") return;
  event.preventDefault();
  if (state.statusCenterOpen) setStatusCenter(false);
  else if (settingsDialog?.open) closeSettings();
  else if (ownerDialog?.open) closeOwnerDialog();
  else if (!playerDrawer?.hidden) closeSessionPlayer();
  else if (state.builderCompact) setBuilderCompact().catch((error) => setStatus(error.message || "Не удалось изменить размер окна.", true));
});

function resetAnalysisEvents() {
  state.events = [];
  state.startedAt = null;
  state.stoppedAt = null;
  state.selectedSessionUserId = "";
  eventCount.textContent = "0 событий";
  renderSession();
  if (state.view === "admin") scheduleAdminRender();
  if (state.view === "owner") scheduleOwnerRender();
  if (state.view === "crash") scheduleCrashRender();
  if (state.view === "builder") scheduleBuilderRender();
}

api?.onLogEvent(addEvent);
api?.onAnalysisStart?.(() => {
  resetAnalysisEvents();
  setStatus("Читаем выбранный лог заново…", false, { kind: "info" });
});
api?.onTailRotation?.((payload) => {
  if (payload?.filePath) setFilePath(payload.filePath);
  setStatus(payload?.reason === "truncated" ? "Лог был перезаписан. Чтение продолжено с начала файла." : "VRChat создал новый лог. Чтение продолжено автоматически.");
});
api?.onUserResolved?.((profile) => {
  const userId = String(profile?.userId || profile?.id || "").trim();
  if (!userId) return;
  state.profiles.set(userId, { ...profile, userId, displayName: String(profile?.displayName || userId) });
  if (state.view === "session") scheduleSessionRender();
  if (state.view === "admin") scheduleAdminRender();
  if (state.view === "owner") scheduleOwnerRender();
  if (state.view === "builder") scheduleBuilderRender();
});
api?.onTailStatus((status) => {
  const wasRunning = state.running;
  state.running = Boolean(status.running);
  if (state.running) {
    if (!state.startedAt) state.startedAt = Date.now();
    state.stoppedAt = null;
  } else if (wasRunning && !state.stoppedAt) {
    state.stoppedAt = Date.now();
  }
  if (status.filePath) setFilePath(status.filePath);
  document.querySelector('[data-action="start"]').disabled = state.running;
  document.querySelector('[data-action="stop"]').disabled = !state.running;
  if (state.view === "crash") renderCrash();
  const currentStatus = baselineStatus();
  setStatus(currentStatus.message, false, { ...currentStatus, sticky: true, record: false });
});
window.addEventListener("beforeunload", () => {
  if (state.dashboardClockTimer) window.clearInterval(state.dashboardClockTimer);
  if (state.statusResetTimer) window.clearTimeout(state.statusResetTimer);
  if (state.playSessionSyncTimer) window.clearTimeout(state.playSessionSyncTimer);
  stopNotificationMonitoring();
});
api?.onTailError((error) => setStatus(error?.message || "Ошибка чтения лога", true));
api?.onAuthStatus?.((payload) => {
  if (!payload?.license) return;
  state.settings = { ...(state.settings || {}), license: payload.license };
  syncOwnerAccess();
});
api?.onUpdaterStatus?.((info) => {
  if (!info || info.status === "log") return;
  if (info.status === "checking") setStatus("Проверяем обновления…", false, { record: false });
  if (info.status === "available") setStatus(`Найдено обновление ${info.version || ""}. Скачиваем…`);
  if (info.status === "not-available") setStatus(`Установлена актуальная версия${info.currentVersion ? ` · ${info.currentVersion}` : ""}`, false, { record: false });
  if (info.status === "downloading") setStatus(`Скачивание обновления: ${Math.round(Number(info.percent) || 0)}%`, false, { record: false });
  if (info.status === "downloaded") {
    if (updateButton) updateButton.hidden = false;
    setStatus(`Обновление ${info.version || ""} готово к установке`);
  }
  if (info.status === "error") setStatus(`Ошибка автообновления: ${info.message || "неизвестная ошибка"}`, true);
});
api?.onRuntimeConfig?.(showRuntimeConfigNotice);

async function initialize() {
  if (!api || !noteTools || !sessionModel || !crashModel || !insightsModel || !avatarModel || !notificationModel || !i18n) {
    showActivation("Безопасный мост приложения недоступен.", true);
    return;
  }
  try {
    const [settings, runtimeConfiguration] = await Promise.all([
      api.getSettings(),
      typeof api.getRuntimeConfig === "function" ? api.getRuntimeConfig().catch(() => null) : Promise.resolve(null)
    ]);
    state.settings = settings;
    state.runtimeConfig = runtimeConfiguration;
    if (!state.settings.hasSession) {
      showActivation();
      showRuntimeConfigNotice(state.runtimeConfig);
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
