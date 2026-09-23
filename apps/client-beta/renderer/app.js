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
const miniGames = window.betaMiniGames;
const api = window.clientApi || (previewMode ? createPreviewApi() : null);
const activationView = document.querySelector("[data-activation-view]");
const activationForm = document.querySelector("[data-activation-form]");
const activationStatus = document.querySelector("[data-activation-status]");
const authorAliasField = document.querySelector("[data-author-alias-field]");
const authorAliasInput = activationForm?.elements.namedItem("authorAlias");
const vrchatAuthCookieInput = activationForm?.elements.namedItem("vrchatAuthCookie");
const importStableButton = document.querySelector("[data-import-stable]");
const continueFreeButton = document.querySelector("[data-continue-free]");
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
const friendActivityFeed = document.querySelector("[data-friend-activity-feed]");
const friendActivityCount = document.querySelector("[data-friend-activity-count]");
const friendPipelineStatus = document.querySelector("[data-friend-pipeline-status]");
const playerList = document.querySelector("[data-player-list]");
const playerCount = document.querySelector("[data-player-count]");
const playerSearch = document.querySelector("[data-session-player-search]");
const onlineBadge = document.querySelector("[data-online-badge]");
const updateButton = document.querySelector('[data-action="update"]');
const avatarSessionList = document.querySelector("[data-avatar-session-list]");
const avatarDetail = document.querySelector("[data-avatar-detail]");
const avatarSearch = document.querySelector("[data-avatar-search]");
const avatarFilter = document.querySelector("[data-avatar-filter]");
const avatarPageSize = document.querySelector("[data-avatar-page-size]");
const avatarPageStatus = document.querySelector("[data-avatar-page-status]");
const avatarPagePrev = document.querySelector("[data-avatar-page-prev]");
const avatarPageNext = document.querySelector("[data-avatar-page-next]");
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
let rose337SelectionSound = null;
const ROSE337_USER_ID = "usr_3d586656-15eb-4702-9ab2-759a70b2f543";
const ownerDialog = document.querySelector("[data-owner-dialog]");
const ownerModerationForm = document.querySelector("[data-owner-moderation-form]");
const crashList = document.querySelector("[data-crash-list]");
const crashDetail = document.querySelector("[data-crash-detail]");
const insightsPeriod = document.querySelector("[data-insights-period]");
const insightSessionList = document.querySelector("[data-session-list]");
const insightSessionDetail = document.querySelector("[data-insight-session-detail]");
const companionSearch = document.querySelector("[data-companion-search]");
const companionSearchLayout = document.querySelector("[data-companion-search-layout]");
const companionSearchResults = document.querySelector("[data-companion-search-results]");
const companionSearchCount = document.querySelector("[data-companion-search-count]");
const companionSearchDetail = document.querySelector("[data-companion-search-detail]");
const directoryPanels = [...document.querySelectorAll("[data-directory-kind]")];
const socialSummary = document.querySelector("[data-social-summary]");
const socialStatus = document.querySelector("[data-social-status]");
const socialDetailDialog = document.querySelector("[data-social-detail-dialog]");
const socialDetailBody = document.querySelector("[data-social-detail-body]");
const socialDetailTitle = document.querySelector("[data-social-detail-title]");
const builderGrid = document.querySelector("[data-builder]");
const builderWorkspace = document.querySelector("[data-builder-workspace]");
const builderInspector = document.querySelector("[data-builder-inspector]");
const builderLayout = document.querySelector("[data-builder-layout]");
const builderPreset = document.querySelector("[data-builder-preset]");
const builderOpacity = document.querySelector("[data-builder-opacity]");
const builderDashboard = document.querySelector("[data-builder-dashboard]");
const builderDashboardName = document.querySelector("[data-builder-dashboard-name]");
const gamesPanel = document.querySelector("[data-games-card]");
const gameState = { mode: "recent", rows: [], round: 0, roundLimit: 0, score: 0, question: null, answered: false, loading: false, error: false, usedKeys: [], requestId: 0 };
const historyList = document.querySelector("[data-history-list]");
const historyDetail = document.querySelector("[data-history-detail]");
const historySearch = document.querySelector("[data-history-search]");
const historyDate = document.querySelector("[data-history-date]");
const historyState = document.querySelector("[data-history-state]");
const settingsDialog = document.querySelector("[data-settings-dialog]");
const settingsForm = document.querySelector("[data-settings-form]");
const vrchatAuthDialog = document.querySelector("[data-vrchat-auth-dialog]");
const uiChromeResize = document.querySelector("[data-ui-chrome-resize]");
const railActionsToggle = document.querySelector("[data-rail-actions-toggle]");
let settingsReturnFocus = null;
let vrchatAuthReturnFocus = null;
let ownerDialogReturnFocus = null;
let playerDrawerReturnFocus = null;
const BUILDER_KINDS = Object.freeze(["players", "avatars", "portals", "worlds", "instance", "friends", "friendlog", "admin"]);
const BUILDER_LAYOUTS = Object.freeze(["grid", "adaptive", "rows", "freeform"]);
const BUILDER_MIN_WIDTH = 260;
const BUILDER_MIN_HEIGHT = 150;
const BUILDER_SNAP_SIZE = 12;
const BUILDER_ROW_LIMITS = Object.freeze([5, 10, 20, 40, 60, 80]);
const SESSION_EVENT_FILTERS = Object.freeze(["joins", "leaves", "avatars", "worlds", "other"]);
const AVATAR_PAGE_SIZES = Object.freeze([25, 50, 100, 200]);
const AVATAR_RENDER_THROTTLE_MS = 180;
const PROFILE_RENDER_CACHE_LIMIT = 1_000;
const UI_SIDEBAR_COLLAPSED_WIDTH = 84;
const UI_SIDEBAR_MIN_WIDTH = 220;
const UI_SIDEBAR_MAX_WIDTH = 360;
const UI_SIDEBAR_SNAP_WIDTH = 150;
const WORLD_ID_RE = /^wrld_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const AVATAR_ID_RE = /^avtr_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

document.querySelectorAll("[data-ui-chrome] button").forEach((button) => {
  const label = button.textContent.trim();
  if (label && !button.title) button.title = label;
  if (label && !button.getAttribute("aria-label")) button.setAttribute("aria-label", label);
});
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
  uiPlacement: "top",
  uiSidebarWidth: 272,
  startView: "session",
  density: "comfortable",
  scale: 100,
  animations: true,
  showHeader: true,
  showToolbar: true,
  sessionPlayerMode: "online-first",
  eventLimit: 2500,
  autoAnalyzeCurrentLog: false,
  protectMonitoring: true,
  rememberSelection: true,
  notifyMarkedPlayers: false,
  notifyCrashAvatars: false,
  clearOnLogout: true
});

function normalizedUiSettings(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const next = { ...DEFAULT_UI_SETTINGS, ...source };
  if (source.autoAnalyzeCurrentLog === undefined && source.autoAnalyzeToday !== undefined) {
    next.autoAnalyzeCurrentLog = Boolean(source.autoAnalyzeToday);
  }
  delete next.autoStart;
  delete next.autoAnalyzeToday;
  if (!["ru", "en"].includes(next.language)) next.language = "ru";
  if (!["top", "left"].includes(next.uiPlacement)) next.uiPlacement = "top";
  next.uiSidebarWidth = Math.min(UI_SIDEBAR_MAX_WIDTH, Math.max(UI_SIDEBAR_COLLAPSED_WIDTH, Number(next.uiSidebarWidth) || 272));
  if (["players", "worlds", "local-avatars"].includes(next.startView)) next.startView = "library";
  if (!["session", "insights", "library", "social", "admin", "owner", "crash", "history", "builder"].includes(next.startView)) next.startView = "session";
  if (!["comfortable", "compact", "vr"].includes(next.density)) next.density = "comfortable";
  next.scale = [100, 125, 150, 175, 200].includes(Number(next.scale)) ? Number(next.scale) : 100;
  next.eventLimit = [1000, 2500, 5000].includes(Number(next.eventLimit)) ? Number(next.eventLimit) : 2500;
  if (!["online-first", "online-only", "all"].includes(next.sessionPlayerMode)) next.sessionPlayerMode = "online-first";
  for (const key of ["animations", "showHeader", "showToolbar", "autoAnalyzeCurrentLog", "protectMonitoring", "rememberSelection", "notifyMarkedPlayers", "notifyCrashAvatars", "clearOnLogout"]) next[key] = Boolean(next[key]);
  return next;
}

const state = {
  settings: null,
  events: [],
  sessionStatsCache: null,
  playerActivityCache: new Map(),
  filePath: "",
  running: false,
  monitoringStopRequested: false,
  monitoringTransition: false,
  monitoringRestartTimer: 0,
  monitoringRestartAttempt: 0,
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
  workspaceMode: localStorage.getItem("betaWorkspaceMode") === "team" ? "team" : "personal",
  workspaceLastView: loadLocalJson("betaWorkspaceLastView", { personal: "session", team: "admin" }),
  libraryTab: ["players", "worlds", "local-avatars"].includes(localStorage.getItem("betaLibraryTab")) ? localStorage.getItem("betaLibraryTab") : "players",
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
  avatarPageRows: [],
  avatarSummary: null,
  avatarDataDirty: true,
  avatarFilterDirty: true,
  avatarLastBuildAt: 0,
  avatarRenderTimer: 0,
  avatarPage: 1,
  avatarPageSize: AVATAR_PAGE_SIZES.includes(Number(localStorage.getItem("betaAvatarPageSize"))) ? Number(localStorage.getItem("betaAvatarPageSize")) : 50,
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
  ownerPolicyThreshold: 3,
  ownerPolicyDays: 30,
  ownerPolicyExcluded: "",
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
  companionQuery: "",
  companionFavoritesOnly: false,
  companionResults: { players: [], worlds: [] },
  companionSelectedKind: "",
  companionSelectedKey: "",
  companionDetails: null,
  companionLoading: false,
  companionError: "",
  companionRequestId: 0,
  companionSearchTimer: 0,
  directoryQueries: { player: "", world: "", avatar: "" },
  directoryResults: { player: [], world: [], avatar: [] },
  directorySelected: { player: "", world: "", avatar: "" },
  directoryDetails: { player: null, world: null, avatar: null },
  directoryAvatarProfile: null,
  directoryLoading: { player: false, world: false, avatar: false },
  directoryRequestId: { player: 0, world: 0, avatar: 0 },
  directorySearchTimers: { player: 0, world: 0, avatar: 0 },
  social: null,
  socialTab: localStorage.getItem("betaSocialTab") || "overview",
  socialQuery: "",
  socialInventoryType: "",
  socialNotificationFilter: "",
  socialEvents: [],
  socialPreferences: [],
  socialCollections: {},
  socialGeneration: 0,
  socialLoading: false,
  socialError: "",
  currentVrchatUser: null,
  currentVrchatInstance: null,
  builderOrder: loadLocalJson("betaBuilderOrder", BUILDER_KINDS),
  builderVisible: loadLocalJson("betaBuilderVisible", BUILDER_KINDS),
  builderLayout: BUILDER_LAYOUTS.includes(localStorage.getItem("betaBuilderLayout")) ? localStorage.getItem("betaBuilderLayout") : "grid",
  builderGeometry: loadLocalJson("betaBuilderGeometry", {}),
  builderQueries: loadLocalJson("betaBuilderQueries", {}),
  builderBlockSettings: loadLocalJson("betaBuilderBlockSettings", {}),
  builderSnap: localStorage.getItem("betaBuilderSnap") !== "false",
  builderAlwaysOnTop: localStorage.getItem("betaBuilderAlwaysOnTop") === "true",
  builderOpacity: Math.min(100, Math.max(40, Number(localStorage.getItem("betaBuilderOpacity")) || 100)),
  builderCompact: localStorage.getItem("betaBuilderCompact") === "true",
  builderCompactMenuOpen: false,
  builderCompactHintVisible: false,
  builderCompactHintTimer: 0,
  builderOverlayHidden: false,
  builderInspector: null,
  builderDashboards: loadLocalJson("betaBuilderDashboards", []),
  builderDashboardId: localStorage.getItem("betaBuilderDashboardId") || "",
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
  historyHideNames: false,
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

if (!["overview", "locations", "favorites", "groups", "vrchat-favorites", "notifications", "prints", "inventory"].includes(state.socialTab)) state.socialTab = "overview";
state.builderDashboards = (Array.isArray(state.builderDashboards) ? state.builderDashboards : []).filter((dashboard) => dashboard && typeof dashboard === "object" && dashboard.id).slice(0, 12);
if (!state.builderDashboards.length) {
  state.builderDashboards = [{
    id: "default",
    name: "Основной",
    order: state.builderOrder,
    visible: state.builderVisible,
    layout: state.builderLayout,
    geometry: state.builderGeometry,
    queries: state.builderQueries,
    blockSettings: state.builderBlockSettings,
    snap: state.builderSnap
  }];
}
if (!state.builderDashboards.some((dashboard) => dashboard.id === state.builderDashboardId)) state.builderDashboardId = state.builderDashboards[0].id;
const initialDashboard = state.builderDashboards.find((dashboard) => dashboard.id === state.builderDashboardId);
if (initialDashboard) {
  state.builderOrder = initialDashboard.order || state.builderOrder;
  state.builderVisible = initialDashboard.visible || state.builderVisible;
  state.builderLayout = BUILDER_LAYOUTS.includes(initialDashboard.layout) ? initialDashboard.layout : state.builderLayout;
  state.builderGeometry = initialDashboard.geometry || state.builderGeometry;
  state.builderQueries = initialDashboard.queries || state.builderQueries;
  state.builderBlockSettings = initialDashboard.blockSettings || state.builderBlockSettings;
  state.builderSnap = initialDashboard.snap !== false;
}
state.builderOrder = [...new Set((Array.isArray(state.builderOrder) ? state.builderOrder : []).filter((kind) => BUILDER_KINDS.includes(kind)))];
for (const kind of BUILDER_KINDS) if (!state.builderOrder.includes(kind)) state.builderOrder.push(kind);
state.builderVisible = [...new Set((Array.isArray(state.builderVisible) ? state.builderVisible : []).filter((kind) => BUILDER_KINDS.includes(kind)))];
state.builderQueries = Object.fromEntries(BUILDER_KINDS.map((kind) => [kind, String(state.builderQueries?.[kind] || "").slice(0, 120)]));
state.builderBlockSettings = normalizedBuilderBlockSettings(state.builderBlockSettings);
state.sessionEventFilters = [...new Set((Array.isArray(state.sessionEventFilters) ? state.sessionEventFilters : []).filter((kind) => kind === "all" || SESSION_EVENT_FILTERS.includes(kind)))];
if (!state.sessionEventFilters.length || state.sessionEventFilters.includes("all")) state.sessionEventFilters = ["all"];

const savedPlayerMode = localStorage.getItem("betaSessionPlayerMode");
if (["online-first", "online-only", "all"].includes(savedPlayerMode)) state.sessionPlayerMode = savedPlayerMode;
else state.sessionPlayerMode = state.uiSettings.sessionPlayerMode;
const savedSessionSection = localStorage.getItem("betaSessionSection");
if (["feed", "friends", "avatars", "dashboard"].includes(savedSessionSection)) state.sessionSection = savedSessionSection;
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
  library: "Библиотека",
  games: "Мини-игры",
  social: "Друзья",
  admin: "Admin Tools",
  owner: "Owner",
  crash: "Crash Analyzer",
  builder: "Builder",
  history: "История сессий"
};

const viewEyebrows = {
  session: "Текущая сессия",
  insights: "Личная статистика",
  library: "Локальные игроки, миры и аватары",
  games: "По платному ключу",
  social: "Друзья и группы VRChat",
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
  const vrchatAuthMessage = formatVrchatAuthError(value, true);
  if (vrchatAuthMessage) return vrchatAuthMessage;
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
  appView.classList.toggle("densityVr", state.uiSettings.density === "vr");
  appView.classList.toggle("animationsOff", !state.uiSettings.animations);
  appView.classList.toggle("headerHidden", !state.uiSettings.showHeader);
  appView.classList.toggle("toolbarHidden", !state.uiSettings.showToolbar && !state.builderCompact);
  const sideNavigation = state.uiSettings.uiPlacement === "left" && !state.builderCompact;
  const collapsedSideNavigation = sideNavigation && state.uiSettings.uiSidebarWidth < UI_SIDEBAR_SNAP_WIDTH;
  appView.classList.toggle("uiChromeLeft", sideNavigation);
  appView.classList.toggle("uiChromeCollapsed", collapsedSideNavigation);
  if (!collapsedSideNavigation) appView.classList.remove("railActionsOpen");
  railActionsToggle?.setAttribute("aria-expanded", String(collapsedSideNavigation && appView.classList.contains("railActionsOpen")));
  appView.style.setProperty("--ui-chrome-width", `${state.uiSettings.uiSidebarWidth}px`);
  if (uiChromeResize) {
    uiChromeResize.setAttribute("aria-valuemin", String(UI_SIDEBAR_COLLAPSED_WIDTH));
    uiChromeResize.setAttribute("aria-valuemax", String(UI_SIDEBAR_MAX_WIDTH));
    uiChromeResize.setAttribute("aria-valuenow", String(Math.round(state.uiSettings.uiSidebarWidth)));
  }
  const scale = state.uiSettings.scale / 100;
  const unscaledViewport = 100 / scale;
  appView.style.zoom = String(scale);
  appView.style.setProperty("--ui-viewport-width", `${unscaledViewport}vw`);
  appView.style.setProperty("--ui-viewport-height", `${unscaledViewport}vh`);
  appView.style.width = "";
  appView.style.height = `${unscaledViewport}vh`;
}

function fillSettingsForm(settings = state.uiSettings) {
  if (!settingsForm) return;
  const value = normalizedUiSettings(settings);
  const adminStartOption = settingsForm.elements.startView.querySelector('option[value="admin"]');
  if (adminStartOption) {
    adminStartOption.disabled = !hasPaidAccess();
    adminStartOption.title = adminStartOption.disabled ? "Доступно по платному ключу" : "";
  }
  const ownerStartOption = settingsForm.elements.startView.querySelector('option[value="owner"]');
  if (ownerStartOption) {
    ownerStartOption.disabled = !hasOwnerAccess();
    ownerStartOption.title = ownerStartOption.disabled ? "Недоступно для текущего ключа" : "";
  }
  const paidStartView = value.startView === "admin" && !hasPaidAccess() ? "session" : value.startView;
  const safeStartView = paidStartView === "owner" && !hasOwnerAccess() ? "session" : paidStartView;
  settingsForm.elements.language.value = value.language;
  settingsForm.elements.startView.value = safeStartView;
  for (const name of ["uiPlacement", "density", "scale", "sessionPlayerMode", "eventLimit"]) settingsForm.elements[name].value = String(value[name]);
  for (const name of ["animations", "showHeader", "showToolbar", "autoAnalyzeCurrentLog", "protectMonitoring", "rememberSelection", "notifyMarkedPlayers", "notifyCrashAvatars", "clearOnLogout"]) settingsForm.elements[name].checked = value[name];
  const cookieInput = settingsForm.elements.vrchatAuthCookie;
  if (cookieInput) {
    cookieInput.value = "";
    cookieInput.dataset.dirty = "false";
    cookieInput.placeholder = state.settings?.hasVrchatAuthCookie ? "Cookie сохранён безопасно" : "auth=...";
  }
  setStoredCookieState(Boolean(state.settings?.hasVrchatAuthCookie));
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
  void refreshLocalStorageSettings();
}

async function refreshLocalStorageSettings() {
  const label = settingsForm?.querySelector("[data-local-storage-stats]");
  const retention = settingsForm?.querySelector("[data-local-retention]");
  if (!label || !api.getLocalStorageStats) return;
  try {
    const stats = await api.getLocalStorageStats();
    const bytes = Number(stats.fileBytes) || 0;
    const size = bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} МиБ` : `${Math.ceil(bytes / 1024)} КиБ`;
    label.textContent = `${size} · ${stats.sessions} сессий · ${stats.players} игроков · ${stats.worlds} миров · ${stats.avatars} аватаров · ${stats.socialEvents || 0} событий друзей`;
    if (retention) retention.value = String(stats.retentionDays || 0);
  } catch {
    label.textContent = "Локальное хранилище недоступно.";
  }
}

function exportableUiSettings() {
  return {
    uiSettings: state.uiSettings,
    workspaceMode: state.workspaceMode,
    workspaceLastView: state.workspaceLastView,
    sessionEventFilters: state.sessionEventFilters
  };
}

function applyImportedUiSettings(value = {}) {
  if (!value || typeof value !== "object") return;
  if (value.uiSettings) state.uiSettings = normalizedUiSettings(value.uiSettings);
  if (["personal", "team"].includes(value.workspaceMode)) state.workspaceMode = value.workspaceMode;
  if (value.workspaceLastView && typeof value.workspaceLastView === "object") state.workspaceLastView = value.workspaceLastView;
  if (Array.isArray(value.sessionEventFilters)) state.sessionEventFilters = value.sessionEventFilters;
  localStorage.setItem("betaWorkspaceMode", state.workspaceMode);
  localStorage.setItem("betaWorkspaceLastView", JSON.stringify(state.workspaceLastView));
  localStorage.setItem("betaSessionEventFilters", JSON.stringify(state.sessionEventFilters));
  applyUiSettings({ persist: true });
  syncWorkspaceNavigation();
}

function closeSettings() {
  const returnFocus = settingsReturnFocus;
  settingsReturnFocus = null;
  if (settingsDialog?.open) settingsDialog.close();
  restoreFocus(returnFocus);
}

function openVrchatAuth() {
  vrchatAuthReturnFocus = focusedElement();
  setStoredCookieState(Boolean(state.settings?.hasVrchatAuthCookie));
  vrchatAuthDialog?.showModal();
  const panel = vrchatAuthDialog?.querySelector("[data-vrchat-account-connect]");
  const target = panel?.dataset.connected === "true"
    ? panel.querySelector("[data-vrchat-disconnect]")
    : panel?.querySelector("[data-vrchat-username]");
  target?.focus();
}

function closeVrchatAuth() {
  const returnFocus = vrchatAuthReturnFocus;
  vrchatAuthReturnFocus = null;
  if (vrchatAuthDialog?.open) vrchatAuthDialog.close();
  restoreFocus(returnFocus);
}

function readSettingsForm() {
  return normalizedUiSettings({
    language: settingsForm.elements.language.value,
    uiPlacement: settingsForm.elements.uiPlacement.value,
    uiSidebarWidth: state.uiSettings.uiSidebarWidth,
    startView: settingsForm.elements.startView.value,
    density: settingsForm.elements.density.value,
    scale: Number(settingsForm.elements.scale.value),
    animations: settingsForm.elements.animations.checked,
    showHeader: settingsForm.elements.showHeader.checked,
    showToolbar: settingsForm.elements.showToolbar.checked,
    sessionPlayerMode: settingsForm.elements.sessionPlayerMode.value,
    eventLimit: Number(settingsForm.elements.eventLimit.value),
    autoAnalyzeCurrentLog: settingsForm.elements.autoAnalyzeCurrentLog.checked,
    protectMonitoring: settingsForm.elements.protectMonitoring.checked,
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
  state.notificationPlayerNotes = [];
  state.notificationAvatarNotes = [];
  if (state.uiSettings.notifyMarkedPlayers) {
    if (api.listLocalWatchedPlayers) requests.push({ kind: "players", promise: Promise.resolve().then(() => api.listLocalWatchedPlayers()) });
    if (hasPaidAccess()) requests.push({ kind: "players", promise: Promise.resolve().then(() => api.listPlayerNotes()) });
  }
  if (state.uiSettings.notifyCrashAvatars && hasPaidAccess()) {
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
      const incoming = (result.value || []).map(noteTools.normalizeNote).filter((row) => row.userId);
      const merged = new Map(state.notificationPlayerNotes.map((row) => [row.userId, row]));
      for (const row of incoming) merged.set(row.userId, row);
      state.notificationPlayerNotes = [...merged.values()];
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
    author_alias_taken: "Это имя уже используется другим ключом.",
    too_many_activation_attempts: "Слишком много неудачных попыток активации с этого подключения. Подождите до 15 минут и попробуйте снова."
});

function activationErrorCode(error) {
  const message = String(error?.message || error || "");
  return Object.keys(ACTIVATION_ERROR_MESSAGES).find((code) => message.includes(code)) || message;
}

function formatActivationError(error) {
  const code = activationErrorCode(error);
  return ACTIVATION_ERROR_MESSAGES[code] || code || "Не удалось активировать лицензию.";
}

function formatVrchatAuthError(error, matchOnly = false) {
  const message = String(error?.message || error || "");
  const known = {
    vrchat_login_username_required: "Введите логин или почту VRChat.",
    vrchat_login_password_required: "Введите пароль VRChat.",
    vrchat_login_invalid_credentials: "VRChat не принял логин или пароль.",
    vrchat_login_rate_limited: "VRChat временно ограничил попытки входа. Не повторяйте вход сразу и попробуйте позже.",
    vrchat_login_session_missing: "VRChat не выдал сессию. Повторите вход позже.",
    vrchat_login_not_pending: "Запрос входа истёк. Введите логин и пароль заново.",
    vrchat_login_2fa_method_invalid: "Выберите доступный способ подтверждения.",
    vrchat_login_2fa_code_required: "Введите код подтверждения VRChat.",
    vrchat_login_2fa_invalid: "VRChat не принял код подтверждения. Проверьте код и повторите попытку."
  };
  for (const [code, friendly] of Object.entries(known)) if (message.includes(code)) return friendly;
  if (/VRChat auth cookie is not configured/iu.test(message)) {
    return "Аккаунт VRChat не подключён. Нажмите кнопку «VRChat» и войдите в аккаунт.";
  }
  if (/VRChat (?:account )?session is invalid/iu.test(message)) {
    return "Сессия VRChat истекла. Нажмите кнопку «VRChat» и войдите заново.";
  }
  if (/VRChat user profile is unavailable|VRChat API HTTP 401/iu.test(message)) {
    return "VRChat не открыл запрошенные данные. Ваша сессия сохранена.";
  }
  if (/VRChat API HTTP 403/iu.test(message)) {
    return "VRChat API не разрешил это действие для текущего аккаунта.";
  }
  if (matchOnly) return "";
  return message || "Не удалось проверить VRChat аккаунт.";
}

function submittedVrchatCookie() {
  return vrchatAuthCookieInput?.dataset.dirty === "true" ? vrchatAuthCookieInput.value : undefined;
}

function setStoredCookieState(hasStoredCookie) {
  if (vrchatAuthCookieInput) {
    vrchatAuthCookieInput.value = "";
    vrchatAuthCookieInput.dataset.dirty = "false";
    vrchatAuthCookieInput.dataset.stored = hasStoredCookie ? "true" : "false";
    vrchatAuthCookieInput.placeholder = hasStoredCookie ? "Сессия сохранена безопасно" : "auth=...";
  }
  document.querySelectorAll("[data-vrchat-account-connect]").forEach((panel) => {
    const disconnect = panel.querySelector("[data-vrchat-disconnect]");
    const status = panel.querySelector("[data-vrchat-account-status]");
    if (disconnect) disconnect.hidden = !hasStoredCookie;
    panel.dataset.connected = hasStoredCookie ? "true" : "false";
    if (hasStoredCookie && !status?.dataset.busy) hideVrchatTwoFactor(panel);
    if (status && !status.dataset.busy) status.textContent = hasStoredCookie ? "Аккаунт VRChat подключён." : "";
  });
  document.querySelectorAll("[data-vrchat-account-open]").forEach((button) => {
    button.dataset.connected = hasStoredCookie ? "true" : "false";
    button.title = hasStoredCookie ? "Аккаунт VRChat подключён" : "Войти в VRChat";
    button.setAttribute("aria-label", button.title);
  });
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

function hasPaidAccess() {
  return state.settings?.accessMode === "paid" && Boolean(state.settings?.license);
}

function syncPaidAccess() {
  const paid = hasPaidAccess();
  const gamesNavButton = document.querySelector('[data-view-button="games"]');
  if (gamesNavButton) gamesNavButton.hidden = !paid || state.workspaceMode !== "personal";
  const adminNavButton = document.querySelector('[data-view-button="admin"]');
  if (adminNavButton) {
    adminNavButton.disabled = !paid;
    adminNavButton.dataset.locked = paid ? "false" : "true";
    adminNavButton.setAttribute("aria-disabled", paid ? "false" : "true");
    adminNavButton.title = paid ? "Командные инструменты" : "Admin Tools доступны по платному ключу";
  }
  playerDrawer?.querySelector("[data-session-player-admin]")?.toggleAttribute("hidden", !paid);
  const builderAdminToggle = document.querySelector('[data-builder-blocks] input[value="admin"]');
  if (builderAdminToggle) {
    builderAdminToggle.disabled = !paid;
    if (!paid && state.builderVisible.includes("admin")) {
      state.builderVisible = state.builderVisible.filter((kind) => kind !== "admin");
      persistBuilderSettings();
    }
  }
  if (!paid && (state.view === "admin" || state.view === "games")) selectView("session");
  for (const selector of ["[data-avatar-online-search]", "[data-avatar-prismic]", "[data-avatar-refresh]"]) {
    document.querySelector(selector)?.toggleAttribute("hidden", !paid);
  }
  if (!paid && avatarOnlineResults) {
    state.avatarOnlineRows = [];
    state.avatarOnlineQuery = "";
    state.avatarOnlineError = "";
    state.avatarOnlineLoading = false;
    avatarOnlineResults.hidden = true;
    avatarOnlineResults.replaceChildren();
  }
  const teamModeButton = document.querySelector('[data-workspace-mode="team"]');
  if (teamModeButton) {
    teamModeButton.dataset.locked = paid ? "false" : "true";
    teamModeButton.setAttribute("aria-disabled", paid ? "false" : "true");
    teamModeButton.title = paid ? "Открыть командные инструменты" : "Командный режим доступен по платному ключу";
  }
  if (!paid && state.workspaceMode === "team") state.workspaceMode = "personal";
  syncWorkspaceNavigation();
}

function syncOwnerAccess() {
  const enabled = hasOwnerAccess();
  if (ownerNavButton) {
    ownerNavButton.hidden = state.workspaceMode !== "team";
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
  if (!enabled && state.view === "owner") selectView(hasPaidAccess() ? "admin" : "session");
  syncWorkspaceNavigation();
}

function viewWorkspaceMode(view) {
  if (view === "admin" || view === "owner") return "team";
  if (view === "library" || view === "social" || view === "games") return "personal";
  return "shared";
}

function syncWorkspaceNavigation() {
  const mode = state.workspaceMode === "team" && hasPaidAccess() ? "team" : "personal";
  state.workspaceMode = mode;
  document.querySelectorAll("[data-workspace-mode]").forEach((button) => {
    const active = button.dataset.workspaceMode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  document.querySelectorAll("[data-nav-scope]").forEach((button) => {
    const scope = button.dataset.navScope;
    button.hidden = (scope !== "shared" && scope !== mode) || (button.dataset.viewButton === "games" && !hasPaidAccess());
  });
  document.querySelector(".topNavigation")?.setAttribute("data-workspace-navigation", mode);
  localStorage.setItem("betaWorkspaceMode", mode);
}

function switchWorkspaceMode(mode) {
  if (mode === "team" && !hasPaidAccess()) {
    setStatus("Командный режим доступен по платному ключу.", false, { kind: "warning" });
    return;
  }
  const safeMode = mode === "team" ? "team" : "personal";
  state.workspaceMode = safeMode;
  syncWorkspaceNavigation();
  let nextView = state.workspaceLastView[safeMode];
  const nextScope = viewWorkspaceMode(nextView);
  if (!viewTitles[nextView] || (nextScope !== "shared" && nextScope !== safeMode)) nextView = safeMode === "team" ? "admin" : "session";
  if (nextView === "owner" && !hasOwnerAccess()) nextView = "admin";
  selectView(nextView);
}

async function showApp() {
  activationView.hidden = true;
  appView.hidden = false;
  if (appVersionLabel) {
    const version = String(state.settings?.appVersion || "").trim();
    appVersionLabel.textContent = version ? `Stable · ${version}` : "Stable · 2.0";
  }
  const latest = await api.latestFile().catch(() => ({ filePath: "" }));
  if (latest.filePath) setFilePath(latest.filePath);
  syncOwnerAccess();
  syncPaidAccess();
  syncWorkspaceNavigation();
  renderCrash();
  syncBuilderControls();
  if (state.builderCompact && !previewMode) startBuilderCompactHint();
  if (!state.dashboardClockTimer) {
    state.dashboardClockTimer = window.setInterval(() => {
      if (state.view === "session" && state.sessionSection === "dashboard") updateDashboardClock();
    }, 1000);
  }
  applyUiSettings();
  await api.setCompactMode?.(state.builderCompact).catch(() => {});
  if (state.builderAlwaysOnTop) await api.setAlwaysOnTop?.(true, state.builderOpacity / 100).catch(() => {});
  if (state.builderCompact) selectView("builder");
  else {
    const configuredView = state.uiSettings.startView;
    const modeView = state.workspaceLastView[state.workspaceMode];
    const configuredScope = viewWorkspaceMode(configuredView);
    const requestedView = configuredScope === "shared" || configuredScope === state.workspaceMode
      ? configuredView
      : (viewTitles[modeView] ? modeView : (state.workspaceMode === "team" ? "admin" : "session"));
    const paidStartView = requestedView === "admin" && !hasPaidAccess() ? "session" : requestedView;
    selectView(paidStartView === "owner" && !hasOwnerAccess() ? (hasPaidAccess() ? "admin" : "session") : paidStartView);
  }
  if (state.crashEnabled) startCrashAnalyzer();
  setStatus(previewMode ? "Безопасный Chrome preview · вымышленные данные" : (hasPaidAccess() ? "Платный доступ активен" : "Бесплатный локальный режим"), false, { record: false });
  showRuntimeConfigNotice(state.runtimeConfig);
  await syncNotificationMonitoring({ refreshNow: true, announceError: true });
  requestAnimationFrame(() => renderSession());
  if (state.uiSettings.autoAnalyzeCurrentLog && !previewMode && !state.running) {
    analyzeCurrentLogAutomatically().catch((error) => setStatus(error.message || "Автоматический анализ текущего лога не выполнен.", true));
  }
  if (previewMode) {
    const previewParams = new URLSearchParams(window.location.search);
    const previewScale = Number(previewParams.get("scale"));
    if ([100, 125, 150, 175, 200].includes(previewScale)) state.uiSettings.scale = previewScale;
    if (["top", "left"].includes(previewParams.get("ui"))) state.uiSettings.uiPlacement = previewParams.get("ui");
    if (previewParams.get("rail") === "collapsed") state.uiSettings.uiSidebarWidth = UI_SIDEBAR_COLLAPSED_WIDTH;
    if (previewParams.get("rail") === "expanded") state.uiSettings.uiSidebarWidth = 272;
    if (previewParams.get("header") === "0") state.uiSettings.showHeader = false;
    if (previewParams.get("toolbar") === "0") state.uiSettings.showToolbar = false;
    if (previewParams.get("animations") === "0") state.uiSettings.animations = false;
    applyUiSettings();
    if (previewParams.get("compact") === "1") {
      state.builderCompact = true;
      syncBuilderControls();
    }
    if (["feed", "friends", "avatars", "dashboard"].includes(previewParams.get("section"))) state.sessionSection = previewParams.get("section");
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
      renderAvatarSession({ force: true });
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
      appVersion: "2.0.0-beta",
      hasSession: !activationPreviewMode,
      hasVrchatAuthCookie: previewHasVrchatAuthCookie,
      serverUrl: "https://api.vrchatadmintools.ru",
      accessMode: "paid",
      freeMode: false,
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
    continueFree: async () => ({ ok: true, accessMode: "free" }),
    importStableSettings: async () => ({ imported: true, reason: "stable_settings_imported" }),
    saveSettings: async (settings = {}) => {
      if (settings.vrchatAuthCookie !== undefined) previewHasVrchatAuthCookie = Boolean(settings.vrchatAuthCookie);
      return { hasVrchatAuthCookie: previewHasVrchatAuthCookie };
    },
    loginVrchatAccount: async () => {
      previewHasVrchatAuthCookie = true;
      return { authenticated: true, requiresTwoFactorAuth: [], user: { userId: "usr_demo_current", displayName: "Rose337" } };
    },
    verifyVrchatAccount: async () => ({ authenticated: true, requiresTwoFactorAuth: [], user: { userId: "usr_demo_current", displayName: "Rose337" } }),
    cancelVrchatAccountLogin: async () => ({ ok: true }),
    disconnectVrchatAccount: async () => {
      previewHasVrchatAuthCookie = false;
      return { ok: true, hasVrchatAuthCookie: false };
    },
    validate: async () => ({ ok: true }),
    activate: async () => ({ ok: true }),
    logout: async () => ({ ok: true }),
    getVrchatCurrentUser: async () => ({ id: "usr_demo_current", displayName: "Rose337" }),
    getVrchatCurrentInstance: async () => ({ worldName: "Group Public", nUsers: 5, capacity: 40 }),
    getVrchatSocialSummary: async () => ({
      user: { userId: "usr_demo_current", displayName: "Rose337" },
      friends: [
        { userId: "usr_demo_nova", displayName: "Nova", status: "active", statusDescription: "В VRChat", platform: "standalonewindows", online: true, location: "wrld_preview:123", worldId: "wrld_preview" },
        { userId: "usr_demo_mira", displayName: "Mira", status: "offline", statusDescription: "", platform: "android", online: false }
      ],
      groups: [{ groupId: "grp_preview_full_white", name: "full white", shortCode: "FULL", memberCount: 300, isRepresenting: true }],
      fetchedAt: new Date().toISOString(),
      truncatedFriends: false
    }),
    getVrchatUserProfile: async (userId) => ({ userId, displayName: userId === "usr_demo_nova" ? "Nova" : "Mira", bio: "Публичное описание профиля", status: "active", statusDescription: "В VRChat", platform: "standalonewindows", location: "wrld_preview:123", worldId: "", isFriend: true, allowAvatarCopying: true, dateJoined: "2024-01-01", groups: [{ groupId: "grp_preview_full_white", name: "full white", shortCode: "FULL" }] }),
    getVrchatGroup: async (groupId) => ({ groupId, name: "full white", shortCode: "FULL", description: "Публичное описание группы", memberCount: 300, onlineMemberCount: 25, privacy: "default", joinState: "open", announcement: { title: "Новости группы", text: "Публичное объявление сообщества." }, instances: [{ worldId: "wrld_preview", instanceId: "123", location: "wrld_preview:123", worldName: "Group Public", memberCount: 12 }], rules: [{ title: "Уважение", text: "Соблюдайте правила сообщества." }] }),
    getVrchatPersonalCollection: async (kind) => ({ kind, rows: {
      "favorite-worlds": [{ worldId: "wrld_preview", worldName: "Group Public", authorName: "Preview", occupants: 12, capacity: 40 }],
      "favorite-avatars": [{ avatarId: "avtr_preview", avatarName: "Preview Avatar", authorName: "Preview", releaseStatus: "public" }],
      notifications: [{ id: "not_preview", type: "invite", message: "Приглашение в инстанс", senderUserId: "usr_demo_nova", senderUsername: "Nova", createdAt: new Date().toISOString(), seen: false }],
      prints: [{ id: "prnt_preview", name: "Вечер с друзьями", authorName: "Preview", worldName: "Group Public", createdAt: new Date().toISOString() }],
      inventory: [{ id: "inv_preview", name: "Neon frame", itemType: "iconFrame", equipSlot: "iconFrame", description: "Рамка профиля" }]
    }[kind] || [], truncated: false }),
    listLocalSocialEvents: async () => [{ id: 1, event_type: "online", user_id: "usr_demo_nova", display_name: "Nova", occurred_at: new Date().toISOString(), current_value: "online" }],
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
    searchCompanion: async (query) => {
      const normalized = String(query || "").toLocaleLowerCase("ru-RU");
      const players = [
        { user_id: "usr_demo_nova", display_name: "Nova", first_seen_at: "2026-08-01T18:00:00.000Z", last_seen_at: "2026-08-08T22:00:00.000Z", session_count: 3 },
        { user_id: "usr_demo_mira", display_name: "Mira", first_seen_at: "2026-08-05T21:10:00.000Z", last_seen_at: "2026-08-08T22:00:00.000Z", session_count: 2 }
      ].filter((row) => `${row.display_name} ${row.user_id}`.toLocaleLowerCase("ru-RU").includes(normalized));
      const worlds = [
        { world_key: "wrld_preview", world_id: "", world_name: "Group Public", first_seen_at: "2026-08-08T20:30:00.000Z", last_seen_at: "2026-08-08T22:00:00.000Z", session_count: 2 },
        { world_key: "wrld_preview_pug", world_id: "", world_name: "The Great Pug", first_seen_at: "2026-08-07T18:00:00.000Z", last_seen_at: "2026-08-07T19:15:00.000Z", session_count: 1 },
        { world_key: "wrld_preview_rooftop", world_id: "", world_name: "Midnight Rooftop", first_seen_at: "2026-08-05T21:10:00.000Z", last_seen_at: "2026-08-05T22:00:00.000Z", session_count: 3 }
      ].filter((row) => `${row.world_name} ${row.world_id}`.toLocaleLowerCase("ru-RU").includes(normalized));
      const avatars = [
        { avatar_key: "name:preview avatar", avatar_id: "", avatar_name: "Preview Avatar", first_seen_at: "2026-08-08T20:30:00.000Z", last_seen_at: "2026-08-08T22:00:00.000Z", session_count: 2, observation_count: 3 }
      ].filter((row) => `${row.avatar_name} ${row.avatar_id}`.toLocaleLowerCase("ru-RU").includes(normalized));
      return { players, worlds, avatars };
    },
    getCompanionDetails: async (kind, key) => {
      const sessions = [
        { id: "preview-session-1", startedAt: "2026-08-08T20:30:00.000Z", endedAt: "2026-08-08T22:00:00.000Z", worldName: "Group Public", snapshot: JSON.stringify({ players: [{ userId: "usr_demo_nova", displayName: "Nova" }, { userId: "usr_demo_mira", displayName: "Mira" }] }) },
        { id: "preview-session-2", startedAt: "2026-08-07T18:00:00.000Z", endedAt: "2026-08-07T19:15:00.000Z", worldName: "The Great Pug", snapshot: JSON.stringify({ players: [{ userId: "usr_demo_nova", displayName: "Nova" }] }) }
      ];
      if (kind === "player") return { kind, entity: { user_id: key, display_name: key === "usr_demo_nova" ? "Nova" : "Mira", first_seen_at: "2026-08-01T18:00:00.000Z", last_seen_at: "2026-08-08T22:00:00.000Z", session_count: 2 }, sessions };
      if (kind === "world") return { kind, entity: { world_key: key, world_id: "", world_name: "Group Public", first_seen_at: "2026-08-08T20:30:00.000Z", last_seen_at: "2026-08-08T22:00:00.000Z", session_count: 2 }, sessions };
      return { kind, entity: { avatar_key: key, avatar_id: "", avatar_name: "Preview Avatar", first_seen_at: "2026-08-08T20:30:00.000Z", last_seen_at: "2026-08-08T22:00:00.000Z", session_count: 2, observation_count: 3 }, sessions, users: [{ user_id: "usr_demo_nova", display_name: "Nova", last_seen_at: "2026-08-08T22:00:00.000Z" }] };
    },
    saveLocalPlayerPreference: async (preference) => ({ kind: "player", entity: { user_id: preference.userId, display_name: "Nova", ...preference, first_seen_at: "2026-08-01T18:00:00.000Z", last_seen_at: new Date().toISOString(), session_count: 2 }, sessions: [], names: [], events: [], worlds: [] }),
    listLocalWatchedPlayers: async () => [],
    saveLocalWorldPreference: async (preference) => ({ kind: "world", entity: { world_key: preference.worldKey, world_name: "Group Public", ...preference, first_seen_at: "2026-08-01T18:00:00.000Z", last_seen_at: new Date().toISOString(), session_count: 2 }, sessions: [] }),
    getLocalStorageStats: async () => ({ sessions: 2, players: 2, worlds: 2, avatars: 1, socialEvents: 3, fileBytes: 245760, retentionDays: 0 }),
    clearLocalDataCategory: async (category) => ({ ok: true, category }),
    setLocalRetention: async (retentionDays) => ({ ok: true, retentionDays, removed: 0 }),
    exportLocalData: async () => ({ ok: true, filePath: "C:\\VRChat-Admin-Tools-backup.json" }),
    importLocalData: async () => ({ ok: true, importedSessions: 2, uiSettings: {} }),
    saveTextFile: async () => ({ ok: true, filePath: "C:\\VRChat-session.txt" }),
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
    selectVrchatAvatar: async (avatarId) => ({ avatarId, avatarName: "Preview Avatar", selected: true }),
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
    updateModerationAppeal: async (request) => ({ id: request.requestId, appealStatus: request.appealStatus, appealNote: request.appealNote }),
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
  const fileName = state.filePath.split(/[\\/]/u).filter(Boolean).pop() || "";
  filePathLabel.textContent = fileName || "Лог ещё не выбран";
  filePathLabel.title = state.filePath;
}

function eventTime(event) {
  const date = new Date(event.timestamp || event.capturedAt || Date.now());
  return Number.isNaN(date.getTime()) ? "--:--" : date.toLocaleTimeString(uiLocale(), { hour: "2-digit", minute: "2-digit" });
}

function eventName(event) {
  const profile = event?.userId ? state.profiles.get(String(event.userId)) : null;
  return String(profile?.displayName || event.display || event.playerName || event.worldName || event.avatarName || (event.avatarProtected ? "Игрок" : "Событие"));
}

function eventKind(event) {
  if (event?.avatarProtected) return "сменил защищённый аватар";
  if (event?.avatarRedacted) return "сменил аватар";
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
  if (event?.avatarProtected) return "Данные скрыты настройками владельца";
  if (event?.avatarRedacted) return "Данные аватара скрыты: источник не подтверждён";
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
  if (!state.sessionStatsCache) state.sessionStatsCache = sessionModel.buildSessionStats(state.events);
  return state.sessionStatsCache;
}

function isAvatarEvent(event) {
  return event?.type === "avatar-changed" || event?.type === "avatar-data";
}

function invalidateAvatarData() {
  state.avatarDataDirty = true;
  state.avatarFilterDirty = true;
  state.playerActivityCache.clear();
}

function invalidateAvatarFilter() {
  state.avatarFilterDirty = true;
}

function invalidateSessionData({ avatars = false } = {}) {
  state.sessionStatsCache = null;
  state.playerActivityCache.clear();
  if (avatars) invalidateAvatarData();
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

function userIdFromInteractiveTarget(target) {
  const button = target?.closest?.([
    "[data-session-player-id]",
    "[data-event-user-id]",
    "[data-admin-user-id]",
    "[data-owner-user-id]",
    "[data-builder-admin-user]",
    "[data-builder-session-user]",
    "[data-insight-profile]",
    "[data-history-profile]",
    "[data-history-owner]",
    "[data-admin-owner]",
    "[data-owner-profile]",
    "[data-owner-admin]",
    "[data-owner-watch]",
    "[data-owner-copy-incident]",
    "[data-crash-profile]",
    "[data-crash-admin]",
    "[data-crash-owner]"
  ].join(", "));
  if (!button) return "";
  return String(
    button.dataset.sessionPlayerId
    || button.dataset.eventUserId
    || button.dataset.adminUserId
    || button.dataset.ownerUserId
    || button.dataset.builderAdminUser
    || button.dataset.builderSessionUser
    || button.dataset.insightProfile
    || button.dataset.historyProfile
    || button.dataset.historyOwner
    || button.dataset.adminOwner
    || button.dataset.ownerProfile
    || button.dataset.ownerAdmin
    || button.dataset.ownerWatch
    || button.dataset.ownerCopyIncident
    || button.dataset.crashProfile
    || button.dataset.crashAdmin
    || button.dataset.crashOwner
    || ""
  );
}

function playRose337SelectionSound(target) {
  if (userIdFromInteractiveTarget(target) !== ROSE337_USER_ID) return;
  rose337SelectionSound ??= new Audio("assets/rose337-selection.ogg");
  rose337SelectionSound.currentTime = 0;
  rose337SelectionSound.play().catch(() => {});
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
  const rowHeight = state.uiSettings.density === "compact" ? 48 : state.uiSettings.density === "vr" ? 64 : 54;
  renderVirtualRows(eventFeed, state.sessionVisibleEvents, rowHeight, eventRowElement, emptyText, force);
}

function renderVirtualPlayerRows(force = false) {
  const emptyText = state.sessionPlayerQuery ? "По этому запросу игроки не найдены." : "Пока никого нет.";
  const rowHeight = state.uiSettings.density === "compact" ? 50 : state.uiSettings.density === "vr" ? 68 : 58;
  renderVirtualRows(playerList, state.sessionVisiblePlayers, rowHeight, playerRowElement, emptyText, force);
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
  if (!["feed", "friends", "avatars", "dashboard"].includes(section)) return;
  state.sessionSection = section;
  localStorage.setItem("betaSessionSection", section);
  renderSession();
  if (section === "avatars") void refreshAvatars();
  if (section === "friends") void refreshFriendActivity();
  if (section === "feed") requestAnimationFrame(() => {
    renderVirtualEventRows(true);
    renderVirtualPlayerRows(true);
  });
}

const FRIEND_ACTIVITY_LABELS = Object.freeze({
  "friend-added": "Добавлен в друзья",
  "friend-removed": "Удалён из друзей",
  online: "Появился онлайн",
  offline: "Ушёл офлайн",
  location: "Сменил локацию",
  renamed: "Сменил имя",
  status: "Сменил статус",
  "status-description": "Изменил текст статуса",
  avatar: "Сменил аватар",
  bio: "Изменил профиль"
});

const VRCHAT_IMAGE_HOSTS = new Set(["api.vrchat.cloud", "files.vrchat.cloud", "file-variants.vrchat.cloud"]);

function safeVrchatImageUrl(...values) {
  for (const value of values) {
    try {
      const url = new URL(String(value || ""));
      if (url.protocol === "https:" && !url.username && !url.password && VRCHAT_IMAGE_HOSTS.has(url.hostname.toLowerCase())) return url.href;
    } catch { /* Missing or malformed image URL falls back to an initial. */ }
  }
  return "";
}

function vrchatImageElement(value, className = "") {
  const imageUrl = safeVrchatImageUrl(value);
  if (!imageUrl) return null;
  const image = document.createElement("img");
  image.className = className;
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.referrerPolicy = "no-referrer";
  image.src = imageUrl;
  return image;
}

function friendPortraitElement(source = {}, extraClass = "") {
  const displayName = String(source.displayName || source.display_name || source.userId || source.user_id || "?");
  const portrait = adminElement("div", `friendPortrait${extraClass ? ` ${extraClass}` : ""}`);
  portrait.setAttribute("aria-hidden", "true");
  portrait.append(userTextElement("span", "friendPortraitFallback", Array.from(displayName.trim())[0]?.toUpperCase() || "?"));
  const imageUrl = safeVrchatImageUrl(source.profileImageUrl, source.profilePicOverride, source.userIcon, source.iconUrl, source.imageUrl, source.thumbnailImageUrl, source.avatarImageUrl, source.bannerUrl);
  if (!imageUrl) return portrait;
  const image = document.createElement("img");
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.referrerPolicy = "no-referrer";
  image.addEventListener("load", () => portrait.classList.add("hasImage"), { once: true });
  image.addEventListener("error", () => image.remove(), { once: true });
  image.src = imageUrl;
  portrait.append(image);
  return portrait;
}

function renderFriendActivityFeed() {
  if (!friendActivityFeed) return;
  const rows = state.socialEvents.slice(0, 500);
  if (friendActivityCount) friendActivityCount.textContent = `${rows.length} записей`;
  if (!rows.length) {
    friendActivityFeed.replaceChildren(emptyMessage("Подключите аккаунт VRChat. Новые события появятся, пока приложение запущено."));
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const entry of rows) {
    const tone = entry.event_type === "offline" || entry.event_type === "friend-removed"
      ? " left"
      : entry.event_type === "location" ? " world" : "";
    const row = adminElement("button", `eventRow friendActivityRow${tone}`);
    row.type = "button";
    row.dataset.socialProfile = entry.user_id;
    const time = adminElement("time", "", eventTime({ timestamp: entry.occurred_at }));
    const dot = adminElement("i");
    const friend = (state.social?.friends || []).find((item) => item.userId === entry.user_id);
    const portrait = friendPortraitElement({ ...entry.snapshot, ...friend, displayName: entry.display_name, userId: entry.user_id });
    const identity = adminElement("div", "eventIdentity");
    identity.append(
      userTextElement("strong", "eventName", entry.display_name || entry.user_id),
      document.createTextNode(" · "),
      adminElement("strong", "eventKind", FRIEND_ACTIVITY_LABELS[entry.event_type] || entry.event_type || "Событие")
    );
    const detail = userTextElement("span", "", entry.current_value || entry.previous_value || "—");
    row.append(time, dot, portrait, identity, detail);
    fragment.append(row);
  }
  friendActivityFeed.replaceChildren(fragment);
}

function renderFriendPipelineStatus(pipeline = {}) {
  if (!friendPipelineStatus) return;
  const status = String(pipeline.status || "disconnected");
  const labels = {
    connected: "Realtime работает",
    connecting: "Подключение…",
    reconnecting: pipeline.reason === "session" ? "Нужно переподключить аккаунт" : "Переподключение…",
    error: pipeline.reason === "session" ? "Нужно переподключить аккаунт" : "Ошибка realtime",
    disconnected: pipeline.reason === "no-session" ? "Аккаунт не подключён" : "Realtime отключён"
  };
  friendPipelineStatus.dataset.status = status;
  friendPipelineStatus.textContent = labels[status] || labels.disconnected;
}

async function refreshFriendActivity(force = false) {
  if (!api.listLocalSocialEvents) return;
  try {
    if (force && api.refreshFriendFeed) {
      const result = await api.refreshFriendFeed();
      state.socialEvents = result?.events || [];
      renderFriendPipelineStatus(result?.pipeline);
    } else {
      const [events, pipeline] = await Promise.all([
        api.listLocalSocialEvents(500),
        api.getFriendPipelineStatus ? api.getFriendPipelineStatus() : null
      ]);
      state.socialEvents = events || [];
      if (pipeline) renderFriendPipelineStatus(pipeline);
    }
  }
  catch { state.socialEvents = []; }
  if (state.sessionSection === "friends") renderFriendActivityFeed();
}

function openAvatarFromEvent(avatarKey) {
  const key = String(avatarKey || "");
  if (!key) return;
  state.avatarQuery = "";
  state.avatarFilter = "all";
  invalidateAvatarFilter();
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
  renderVirtualRows(avatarSessionList, state.avatarPageRows, 68, avatarRowElement, state.avatarQuery ? "Аватары по запросу не найдены." : "Событий аватаров пока нет.", force);
}

function renderAvatarPage(force = true) {
  const pagination = avatarModel.paginateRows(state.avatarVisibleRows, state.avatarPage, state.avatarPageSize);
  state.avatarPage = pagination.page;
  state.avatarPageSize = pagination.pageSize;
  state.avatarPageRows = pagination.rows;
  state.sessionAvatarRows = pagination.rows;
  if (avatarPageSize) avatarPageSize.value = String(pagination.pageSize);
  if (avatarPageStatus) avatarPageStatus.textContent = `${pagination.page} / ${pagination.pages}`;
  if (avatarPagePrev) avatarPagePrev.disabled = pagination.page <= 1;
  if (avatarPageNext) avatarPageNext.disabled = pagination.page >= pagination.pages;
  renderAvatarRows(force);
}

function scheduleAvatarRender(delayMs) {
  if (state.avatarRenderTimer) return;
  state.avatarRenderTimer = window.setTimeout(() => {
    state.avatarRenderTimer = 0;
    if (state.view === "session" && state.sessionSection === "avatars") renderAvatarSession({ force: true });
  }, Math.max(0, Number(delayMs) || 0));
}

function renderAvatarSession({ force = false } = {}) {
  const dataDirty = state.avatarDataDirty;
  const filterDirty = state.avatarFilterDirty;
  if (!force && !dataDirty && !filterDirty) return;

  const now = Date.now();
  const elapsed = now - state.avatarLastBuildAt;
  if (!force && dataDirty && state.avatarLastBuildAt && elapsed < AVATAR_RENDER_THROTTLE_MS) {
    scheduleAvatarRender(AVATAR_RENDER_THROTTLE_MS - elapsed);
    return;
  }
  if (force && state.avatarRenderTimer) {
    window.clearTimeout(state.avatarRenderTimer);
    state.avatarRenderTimer = 0;
  }

  if (dataDirty) {
    state.avatarSummary = sessionModel.buildAvatarSummary(state.events);
    state.avatarRows = avatarModel.buildRows(state.events, state.avatarCatalog, state.avatarNotes);
    state.avatarDataDirty = false;
    state.avatarFilterDirty = true;
    state.avatarLastBuildAt = now;
  }
  if (state.avatarFilterDirty) {
    state.avatarVisibleRows = avatarModel.filterRows(state.avatarRows, state.avatarQuery, state.avatarFilter);
    state.avatarFilterDirty = false;
  }
  const summary = state.avatarSummary || { events: 0, unique: 0, resolved: 0, players: 0 };
  for (const [key, value] of Object.entries({ events: summary.events, unique: summary.unique, resolved: summary.resolved, players: summary.players })) {
    const target = document.querySelector(`[data-avatar-metric="${key}"]`);
    if (target) target.textContent = String(value);
  }
  const count = document.querySelector("[data-avatar-count]");
  if (count) count.textContent = state.avatarLoading ? "загрузка…" : `${state.avatarVisibleRows.length} записей`;
  const scope = document.querySelector("[data-avatar-catalog-scope]");
  if (scope) {
    if (!hasPaidAccess()) {
      scope.textContent = "Локальный журнал";
      scope.classList.remove("full");
      scope.title = "Аватары обнаружены только в локальных логах этого устройства";
    } else {
      const fullCatalog = Boolean(state.settings?.license?.canViewFullAvatarCatalog);
      scope.textContent = fullCatalog ? "Каталог команды" : "Личный каталог";
      scope.classList.toggle("full", fullCatalog);
      scope.title = fullCatalog
        ? "Ключу разрешено видеть весь каталог команды"
        : "Показаны записи, созданные этим ключом";
    }
  }
  renderAvatarPage(true);
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
    state.avatarOnlineError = friendlyStatusMessage(error?.message, true);
    throw new Error(state.avatarOnlineError || "Расширенный поиск аватаров недоступен.");
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
  if (hasPaidAccess()) {
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
  }
  header.append(identity, actions);
  content.append(header);
  if (state.avatarError) content.append(adminElement("p", "adminError", state.avatarError));

  if (!hasPaidAccess()) {
    content.append(adminElement("p", "ownerAccessNotice", "Бесплатный режим показывает только данные локального лога. Проверка Avatar ID, каталог и командные заметки доступны по платному ключу."));
    avatarDetail.append(content);
    return;
  }

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
  save.type = "button";
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
  renderAvatarSession({ force: true });
  if (!hasPaidAccess()) {
    state.avatarCatalog = [];
    state.avatarNotes = [];
    state.globalAvatarNotes = [];
    state.avatarLoading = false;
    invalidateAvatarData();
    renderAvatarSession({ force: true });
    return;
  }
  const results = await Promise.allSettled([api.listAvatarCatalog(), api.listAvatarNotes(), api.listGlobalAvatarNotes()]);
  if (requestId !== state.avatarRequestId) return;
  let derivedChanged = false;
  if (results[0].status === "fulfilled") {
    state.avatarCatalog = results[0].value || [];
    derivedChanged = true;
  }
  if (results[1].status === "fulfilled") {
    state.avatarNotes = (results[1].value || []).map((row) => avatarModel.normalizeNote(row));
    derivedChanged = true;
    if (state.uiSettings.notifyCrashAvatars) state.notificationAvatarNotes = [...state.avatarNotes];
  }
  if (results[2].status === "fulfilled") state.globalAvatarNotes = (results[2].value || []).map((row) => avatarModel.normalizeGlobal(row));
  const failed = results.find((result) => result.status === "rejected");
  state.avatarError = failed ? (failed.reason?.message || "Часть данных аватаров недоступна.") : "";
  state.avatarLoading = false;
  if (derivedChanged) invalidateAvatarData();
  renderAvatarSession({ force: true });
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
    invalidateAvatarData();
    if (state.uiSettings.notifyCrashAvatars) state.notificationAvatarNotes = [saved, ...state.notificationAvatarNotes.filter((row) => row.avatarKey !== saved.avatarKey)];
    setStatus("Заметка об аватаре сохранена.");
  } catch (error) {
    state.avatarError = error.message || "Не удалось сохранить заметку об аватаре.";
    setStatus(state.avatarError, true);
  } finally {
    state.avatarSaving = false;
    renderAvatarSession({ force: true });
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
    const payload = await api.saveAvatarCatalog({ avatarName, avatarId: record.avatarId, sourceUserId: record.userId });
    state.avatarCatalog = [payload?.avatar || payload || { avatarName, avatarId: record.avatarId }, ...state.avatarCatalog.filter((row) => (row.avatar_id || row.avatarId) !== record.avatarId)];
    invalidateAvatarData();
    setStatus("Avatar ID проверен и каталог обновлён.");
  } else {
    const result = await api.findVrchatAvatarCandidates(record.avatarName);
    state.avatarCandidates = (result?.candidates || []).filter((candidate) => candidate?.avatarId).slice(0, 10);
    if (!state.avatarCandidates.length) setStatus("Точных кандидатов по названию не найдено.", true);
  }
  renderAvatarSession({ force: true });
}

async function confirmAvatarCandidate(avatarId) {
  const record = selectedAvatar();
  if (!record || !avatarId) return;
  const payload = await api.saveAvatarCatalog({ avatarName: record.avatarName, avatarId, sourceUserId: record.userId });
  state.avatarCatalog = [payload?.avatar || payload || { avatarName: record.avatarName, avatarId }, ...state.avatarCatalog.filter((row) => (row.avatar_id || row.avatarId) !== avatarId)];
  state.events = state.events.map((event) => (!event.avatarId && event.avatarName === record.avatarName ? { ...event, avatarId } : event));
  invalidateSessionData({ avatars: true });
  state.selectedAvatarKey = avatarModel.idKey(avatarId);
  state.avatarCandidates = [];
  setStatus("Avatar ID подтверждён и сохранён в каталоге.");
  renderAvatarSession({ force: true });
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
  if (!hasPaidAccess()) throw new Error("Admin Tools доступны по платному ключу.");
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
  eventCount.textContent = `${state.events.length} событий`;
  if (state.sessionSection === "feed") {
    document.querySelectorAll("[data-session-player-mode]").forEach((button) => {
      const active = button.dataset.sessionPlayerMode === state.sessionPlayerMode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    syncSessionEventFilters();
    state.sessionVisibleEvents = visibleSessionEvents();
    const feedCount = document.querySelector("[data-feed-count]");
    if (feedCount) feedCount.textContent = state.sessionVisibleEvents.length === state.events.length
      ? `${state.events.length} записей`
      : `${state.sessionVisibleEvents.length} из ${state.events.length}`;
    state.sessionVisiblePlayers = visibleSessionPlayers(stats.players);
    if (playerCount) playerCount.textContent = `${state.sessionVisiblePlayers.length} игроков`;
    renderVirtualEventRows(true);
    renderVirtualPlayerRows(true);
  } else if (state.sessionSection === "friends") {
    renderFriendActivityFeed();
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
  instance: { title: "Текущий инстанс", icon: "I", empty: "Данные инстанса пока не загружены." },
  friends: { title: "Друзья", icon: "F", empty: "Откройте раздел «Социальное», чтобы загрузить друзей." },
  friendlog: { title: "Журнал друзей", icon: "J", empty: "Изменений друзей пока нет." },
  admin: { title: "Admin Tools", icon: "A", empty: "Игроков и заметок пока нет." }
});

function defaultBuilderBlockSetting(kind) {
  return {
    collapsed: false,
    locked: false,
    opacity: 100,
    rowLimit: kind === "instance" ? 5 : 20
  };
}

function normalizedBuilderBlockSetting(kind, value = {}) {
  const defaults = defaultBuilderBlockSetting(kind);
  const requestedLimit = Number(value?.rowLimit);
  const rowLimit = BUILDER_ROW_LIMITS.includes(requestedLimit) ? requestedLimit : defaults.rowLimit;
  return {
    collapsed: value?.collapsed === true,
    locked: value?.locked === true,
    opacity: Math.min(100, Math.max(40, Number(value?.opacity) || defaults.opacity)),
    rowLimit
  };
}

function normalizedBuilderBlockSettings(value = {}) {
  return Object.fromEntries(BUILDER_KINDS.map((kind) => [kind, normalizedBuilderBlockSetting(kind, value?.[kind])]));
}

function builderBlockSetting(kind) {
  const setting = normalizedBuilderBlockSetting(kind, state.builderBlockSettings?.[kind]);
  state.builderBlockSettings[kind] = setting;
  return setting;
}

function builderRowLimit(kind) {
  return builderBlockSetting(kind).rowLimit;
}

function builderRows(kind) {
  const query = String(state.builderQueries[kind] || "").trim().toLocaleLowerCase(uiLocale());
  const limit = builderRowLimit(kind);
  if (kind === "admin") {
    return adminPlayers().filter((player) => !query || `${player.displayName || ""} ${player.userId || ""} ${adminStatusLabel(player.status)} ${player.note || ""}`.toLocaleLowerCase(uiLocale()).includes(query)).slice(0, limit);
  }
  if (kind === "instance") {
    const instance = state.currentVrchatInstance;
    if (!instance) return [];
    return [{ title: instance.worldName || instance.worldId || "Текущий мир", detail: `${instance.nUsers ?? "—"}/${instance.capacity ?? "—"}`, timestamp: instance.fetchedAt, worldId: instance.worldId }];
  }
  if (kind === "friends") {
    return (state.social?.friends || []).filter((friend) => !query || `${friend.displayName || ""} ${friend.userId || ""} ${friend.statusDescription || ""}`.toLocaleLowerCase(uiLocale()).includes(query)).sort((a, b) => Number(socialFriendOnline(b)) - Number(socialFriendOnline(a)) || a.displayName.localeCompare(b.displayName, uiLocale())).slice(0, limit);
  }
  if (kind === "friendlog") {
    return state.socialEvents.filter((entry) => !query || `${entry.display_name || ""} ${entry.user_id || ""} ${entry.event_type || ""}`.toLocaleLowerCase(uiLocale()).includes(query)).slice(0, limit);
  }
  const matches = {
    players: (event) => event.type === "player-joined" || event.type === "player-left",
    avatars: (event) => event.type === "avatar-changed" || event.type === "avatar-data",
    portals: (event) => String(event.type || "").includes("portal"),
    worlds: (event) => String(event.type || "").startsWith("world-")
  }[kind];
  return [...state.events].reverse().filter(matches || (() => false)).filter((event) => (
    !query || `${eventName(event)} ${eventDetail(event)} ${event.type || ""}`.toLocaleLowerCase(uiLocale()).includes(query)
  )).slice(0, limit);
}

function builderItemKey(kind, item) {
  if (kind === "admin" || kind === "players" || kind === "friends") return String(item?.userId || "");
  if (kind === "friendlog") return String(item?.user_id || "");
  if (kind === "avatars") return item?.avatarRedacted || item?.avatarProtected ? "" : avatarModel.key(item?.avatarName, item?.avatarId);
  return String(item?.worldId || item?.timestamp || item?.capturedAt || item?.title || item?.type || "");
}

function builderInspectorRecord() {
  const selection = state.builderInspector;
  if (!selection) return null;
  if (selection.kind === "admin") return adminPlayers().find((row) => row.userId === selection.key) || selection.item;
  if (selection.kind === "players") return sessionStats().players.find((row) => row.userId === selection.key) || selection.item;
  if (selection.kind === "friends") return (state.social?.friends || []).find((row) => row.userId === selection.key) || selection.item;
  if (selection.kind === "friendlog") return state.socialEvents.find((row) => row.user_id === selection.key) || selection.item;
  if (selection.kind === "avatars") return state.avatarRows.find((row) => row.avatarKey === selection.key) || selection.item;
  return selection.item;
}

function builderInspectorAction(label, dataName, value = "true", className = "") {
  const button = adminElement("button", className, label);
  button.type = "button";
  button.dataset[dataName] = value;
  return button;
}

function builderInspectorAdminForm(userId) {
  const record = adminNote(userId);
  if (!record || !hasPaidAccess()) return null;
  const form = adminElement("form", "adminNoteForm builderInspectorNoteForm");
  form.dataset.playerNoteForm = "true";
  form.dataset.userId = record.userId;
  const statusField = adminElement("label", "adminField");
  statusField.append(adminElement("span", "", "Метка"));
  const select = adminElement("select");
  select.name = "status";
  const options = noteTools.STATUS_OPTIONS.some((option) => option.value === record.status)
    ? noteTools.STATUS_OPTIONS
    : [...noteTools.STATUS_OPTIONS, { value: record.status, label: record.status }];
  for (const option of options) {
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
  textarea.rows = 4;
  textarea.value = record.note || "";
  textarea.placeholder = "Заметка для вашей команды…";
  noteField.append(textarea);
  const save = adminElement("button", "primaryButton", state.adminSaving ? "Сохранение…" : "Сохранить");
  save.type = "submit";
  save.dataset.adminNoteSave = "true";
  save.disabled = state.adminSaving;
  form.append(statusField, noteField, save);
  return form;
}

function renderBuilderInspector() {
  if (!builderInspector) return;
  const selection = state.builderInspector;
  const record = builderInspectorRecord();
  const open = Boolean(selection && record);
  builderInspector.hidden = !open;
  builderWorkspace?.classList.toggle("inspectorOpen", open);
  builderInspector.replaceChildren();
  if (!open) return;

  const definition = BUILDER_DEFINITIONS[selection.kind] || { title: "Рабочее место", icon: "•" };
  const header = adminElement("header", "builderInspectorHeader");
  const identity = adminElement("div", "builderInspectorIdentity");
  identity.append(adminElement("span", "builderBlockIcon", definition.icon));
  const heading = adminElement("div");
  heading.append(adminElement("span", "eyebrow", "Инспектор рабочего места"));
  const close = builderInspectorAction("×", "builderInspectorClose", "true", "adminCardClose");
  close.setAttribute("aria-label", "Закрыть карточку");
  close.title = "Закрыть карточку";

  const userId = String(record.userId || record.user_id || "").trim();
  const userKind = ["admin", "players", "friends", "friendlog"].includes(selection.kind);
  const actions = adminElement("div", "builderInspectorActions");
  const body = adminElement("div", "builderInspectorBody");

  if (userKind) {
    const displayName = String(record.displayName || record.display_name || record.display || record.playerName || userId || "Игрок");
    heading.append(userTextElement("h2", "", displayName), userOrUiElement("code", "", userId, "User ID не найден"));
    if (userId) {
      actions.append(builderInspectorAction("Профиль VRChat", "builderInspectorProfile", userId));
      if (selection.kind === "friends" || selection.kind === "friendlog") actions.append(builderInspectorAction("Карточка профиля", "builderInspectorFull", "social"));
      if (hasPaidAccess()) actions.append(builderInspectorAction("Admin Tools", "builderInspectorFull", "admin"));
      else if (selection.kind === "players") actions.append(builderInspectorAction("Сессия", "builderInspectorFull", "session"));
      if (hasOwnerAccess()) actions.append(builderInspectorAction("Owner", "builderInspectorOwner", userId, "ownerActionButton"));
    }
    const metrics = adminElement("div", "builderInspectorMetrics");
    appendAdminMeta(metrics, "Статус", record.online || socialFriendOnline(record) ? "В сети" : "Не в сети");
    appendAdminMeta(metrics, "Источник", definition.title);
    if (selection.kind === "friendlog") {
      appendAdminMeta(metrics, "Событие", record.event_type || "—");
      appendAdminMeta(metrics, "Время", adminDate(record.occurred_at));
    } else if (selection.kind === "friends") {
      appendAdminMeta(metrics, "Платформа", record.platform || "—");
      appendAdminMeta(metrics, "Состояние", record.statusDescription || record.status || "—");
    } else {
      const activity = playerActivity(record);
      appendAdminMeta(metrics, "Мир", activity.worldName || "Не определён");
      appendAdminMeta(metrics, "Текущий аватар", activity.currentAvatar?.avatarName || "Нет данных");
      appendAdminMeta(metrics, "Последнее событие", eventKind(record));
      appendAdminMeta(metrics, "Время", eventTime(record));
    }
    body.append(metrics);
    const noteForm = builderInspectorAdminForm(userId);
    if (noteForm) body.append(noteForm);
  } else if (selection.kind === "avatars") {
    const avatarName = String(record.avatarName || "Неизвестный аватар");
    const safeAvatarId = !record.avatarRedacted && !record.avatarProtected && AVATAR_ID_RE.test(String(record.avatarId || "")) ? String(record.avatarId) : "";
    heading.append(userTextElement("h2", "", avatarName), userOrUiElement("code", "", safeAvatarId, "Avatar ID не подтверждён"));
    actions.append(builderInspectorAction("Открыть полностью", "builderInspectorFull", "avatar"));
    if (safeAvatarId && hasPaidAccess()) {
      const page = builderInspectorAction("Страница аватара", "avatarOpen", safeAvatarId);
      actions.prepend(page);
    }
    const metrics = adminElement("div", "builderInspectorMetrics");
    appendAdminMeta(metrics, "Игрок", record.playerName || record.display || "—");
    appendAdminMeta(metrics, "Метка", record.status === "crash" ? "Crash / сильные лаги" : "Без отметки");
    appendAdminMeta(metrics, "Время", record.timestamp ? adminDate(record.timestamp) : eventTime(record));
    appendAdminMeta(metrics, "Avatar ID", safeAvatarId || "Не подтверждён");
    body.append(metrics);
    if (record.note) body.append(userTextElement("p", "builderInspectorNote", record.note));
  } else {
    const worldName = String(record.worldName || record.title || eventName(record) || "Событие");
    const worldId = normalizedWorldId(record.worldId);
    heading.append(userTextElement("h2", "", worldName), userOrUiElement("code", "", worldId, "World ID не подтверждён"));
    const worldActions = savedWorldActions(worldId);
    if (worldActions) actions.append(worldActions);
    const metrics = adminElement("div", "builderInspectorMetrics");
    appendAdminMeta(metrics, "Тип", eventKind(record));
    appendAdminMeta(metrics, "Время", record.timestamp ? adminDate(record.timestamp) : "—");
    appendAdminMeta(metrics, "Детали", record.detail || eventDetail(record));
    body.append(metrics);
    if (!worldId) body.append(adminElement("p", "builderInspectorNotice", "В событии нет подтверждённого World ID."));
  }

  identity.append(heading);
  header.append(identity, close);
  builderInspector.append(header, actions, body);
}

function openBuilderInspector(kind, key) {
  if (!BUILDER_KINDS.includes(kind) || !key) return;
  const item = builderRows(kind).find((row) => builderItemKey(kind, row) === key);
  if (!item) return;
  state.builderInspector = { kind, key, item };
  builderGrid?.querySelectorAll("[data-builder-inspector-kind]").forEach((row) => {
    const selected = row.dataset.builderInspectorKind === kind && row.dataset.builderInspectorKey === key;
    row.classList.toggle("active", selected);
    row.setAttribute("aria-pressed", String(selected));
  });
  renderBuilderInspector();
  builderInspector?.querySelector("[data-builder-inspector-close]")?.focus();
}

function closeBuilderInspector() {
  state.builderInspector = null;
  builderGrid?.querySelectorAll("[data-builder-inspector-kind]").forEach((row) => {
    row.classList.remove("active");
    row.setAttribute("aria-pressed", "false");
  });
  renderBuilderInspector();
}

function builderRowElement(kind, item) {
  const inspectorKey = builderItemKey(kind, item);
  const actionable = Boolean(inspectorKey);
  const row = adminElement(actionable ? "button" : "div", "builderRow");
  if (actionable) {
    row.type = "button";
    row.dataset.builderInspectorKind = kind;
    row.dataset.builderInspectorKey = inspectorKey;
    const selected = state.builderInspector?.kind === kind && state.builderInspector?.key === inspectorKey;
    row.classList.toggle("active", selected);
    row.setAttribute("aria-pressed", String(selected));
  }
  if (kind === "admin") {
    row.dataset.online = String(Boolean(item.online));
    row.dataset.builderAdminUser = item.userId;
    row.title = `${t("Показать карточку")}: ${item.displayName || item.userId}`;
    row.append(
      userTextElement("strong", "", item.displayName || item.userId),
      appendSeparated(adminElement("span"), [{ text: adminStatusLabel(item.status) }, { text: item.note, user: true }]),
      adminElement("time", "", item.online ? "онлайн" : "не в сети")
    );
    return row;
  }
  if (kind === "friends") {
    row.append(userTextElement("strong", "", item.displayName || item.userId), userTextElement("span", "", item.statusDescription || item.platform || item.userId), adminElement("time", "", socialFriendOnline(item) ? "онлайн" : "офлайн"));
    return row;
  }
  if (kind === "friendlog") {
    row.append(userTextElement("strong", "", item.display_name || item.user_id), adminElement("span", "", item.event_type || "событие"), adminElement("time", "", adminDate(item.occurred_at)));
    return row;
  }
  if (kind === "instance") {
    row.append(userTextElement("strong", "", item.title), userTextElement("span", "", item.detail), adminElement("time", "", item.timestamp ? adminDate(item.timestamp) : "сейчас"));
    return row;
  }
  if (kind === "players" && item.userId) {
    row.dataset.builderSessionUser = item.userId;
    row.title = `${t("Показать карточку")}: ${eventName(item)}`;
  }
  if (kind === "avatars") {
    row.dataset.builderAvatarKey = avatarModel.key(item.avatarName, item.avatarId);
    row.title = t("Показать карточку аватара");
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
  if (!builderGrid || state.builderCompact || state.builderLayout !== "freeform") return;
  const bottom = BUILDER_KINDS
    .filter((kind) => state.builderVisible.includes(kind))
    .reduce((maximum, kind) => {
      const geometry = normalizedBuilderGeometry(kind);
      const height = builderBlockSetting(kind).collapsed ? 50 : geometry.height;
      return Math.max(maximum, geometry.y + height);
    }, 0);
  builderGrid.style.minHeight = `${Math.max(620, Math.ceil(bottom + 24))}px`;
}

function builderBlock(kind) {
  const definition = BUILDER_DEFINITIONS[kind];
  const rows = builderRows(kind);
  const geometry = normalizedBuilderGeometry(kind);
  const setting = builderBlockSetting(kind);
  const block = adminElement("article", "panel builderBlock");
  block.dataset.builderKind = kind;
  block.dataset.builderLocked = String(setting.locked);
  block.classList.toggle("collapsed", setting.collapsed);
  block.classList.toggle("locked", setting.locked);
  block.style.setProperty("--builder-block-opacity", String(setting.opacity / 100));
  applyBuilderBlockFont(block, geometry);
  const header = adminElement("header");
  if (!setting.locked && !state.builderCompact) header.dataset.builderMove = kind;
  header.draggable = state.builderLayout !== "freeform" && !setting.locked && !state.builderCompact;
  if (header.draggable) header.dataset.builderOrderHandle = kind;
  const title = adminElement("div", "builderBlockTitle");
  title.append(adminElement("span", "builderBlockIcon", definition.icon), adminElement("h2", "", definition.title));
  const tools = adminElement("div", "builderBlockTools");
  tools.append(adminElement("span", "builderBlockCount", `${rows.length}`));
  if (!state.builderCompact) {
    const editorTools = adminElement("div", "builderEditorTools");
    const fontDown = adminElement("button", "builderFontButton", "−");
    fontDown.type = "button";
    fontDown.dataset.builderFontAdjust = "-10";
    fontDown.title = "Уменьшить шрифт блока";
    const fontValue = adminElement("span", "builderFontValue", `${geometry.fontScale}%`);
    const fontUp = adminElement("button", "builderFontButton", "+");
    fontUp.type = "button";
    fontUp.dataset.builderFontAdjust = "10";
    fontUp.title = "Увеличить шрифт блока";

    const menu = adminElement("details", "builderBlockMenu");
    const summary = adminElement("summary", "builderMenuButton", "•••");
    summary.title = "Настройки блока";
    summary.setAttribute("aria-label", "Настройки блока");
    const menuBody = adminElement("div", "builderBlockMenuBody");
    const opacityLabel = adminElement("label", "builderBlockOption");
    const opacityCopy = adminElement("span", "", "Прозрачность блока");
    const opacityOutput = adminElement("output", "", `${setting.opacity}%`);
    opacityOutput.dataset.builderBlockOpacityOutput = kind;
    opacityCopy.append(" ", opacityOutput);
    const opacity = document.createElement("input");
    opacity.type = "range";
    opacity.min = "40";
    opacity.max = "100";
    opacity.step = "5";
    opacity.value = String(setting.opacity);
    opacity.dataset.builderBlockOpacity = kind;
    opacityLabel.append(opacityCopy, opacity);
    const limitLabel = adminElement("label", "builderBlockOption");
    limitLabel.append(adminElement("span", "", "Строк в блоке"));
    const limit = document.createElement("select");
    limit.dataset.builderBlockLimit = kind;
    for (const value of BUILDER_ROW_LIMITS) {
      const option = adminElement("option", "", String(value));
      option.value = String(value);
      option.selected = value === setting.rowLimit;
      limit.append(option);
    }
    limitLabel.append(limit);
    const actions = adminElement("div", "builderBlockMenuActions");
    const collapse = adminElement("button", "", setting.collapsed ? "Развернуть" : "Свернуть");
    collapse.type = "button";
    collapse.dataset.builderBlockAction = "collapse";
    const lock = adminElement("button", "", setting.locked ? "Открепить блок" : "Закрепить блок");
    lock.type = "button";
    lock.dataset.builderBlockAction = "lock";
    const hide = adminElement("button", "dangerAction", "Скрыть блок");
    hide.type = "button";
    hide.dataset.builderBlockAction = "hide";
    actions.append(collapse, lock, hide);
    menuBody.append(opacityLabel, limitLabel, actions);
    menu.append(summary, menuBody);
    editorTools.append(fontDown, fontValue, fontUp, menu);
    tools.append(editorTools);
  }
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
  if (state.builderLayout === "freeform" && !state.builderCompact) {
    state.builderGeometry[kind] = geometry;
    applyBuilderBlockGeometry(block, geometry);
    if (setting.collapsed) block.style.height = "50px";
    if (!state.builderCompact && !setting.locked && !setting.collapsed) {
      for (const corner of ["nw", "ne", "sw", "se"]) {
        const handle = adminElement("span", `builderResizeHandle ${corner}`);
        handle.dataset.builderResize = corner;
        handle.setAttribute("aria-hidden", "true");
        block.append(handle);
      }
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
  localStorage.setItem("betaBuilderBlockSettings", JSON.stringify(state.builderBlockSettings));
  localStorage.setItem("betaBuilderSnap", String(state.builderSnap));
  localStorage.setItem("betaBuilderAlwaysOnTop", String(state.builderAlwaysOnTop));
  localStorage.setItem("betaBuilderOpacity", String(state.builderOpacity));
  localStorage.setItem("betaBuilderCompact", String(state.builderCompact));
  const selected = state.builderDashboards.find((dashboard) => dashboard.id === state.builderDashboardId);
  if (selected) Object.assign(selected, currentBuilderDashboardSnapshot());
  localStorage.setItem("betaBuilderDashboards", JSON.stringify(state.builderDashboards));
  localStorage.setItem("betaBuilderDashboardId", state.builderDashboardId);
}

function currentBuilderDashboardSnapshot() {
  return {
    order: [...state.builderOrder],
    visible: [...state.builderVisible],
    layout: state.builderLayout,
    geometry: structuredClone(state.builderGeometry || {}),
    queries: { ...state.builderQueries },
    blockSettings: structuredClone(state.builderBlockSettings || {}),
    snap: state.builderSnap
  };
}

function syncBuilderDashboardControls() {
  if (!builderDashboard) return;
  builderDashboard.replaceChildren();
  for (const dashboard of state.builderDashboards) {
    const option = adminElement("option", "", dashboard.name || "Дашборд");
    option.value = dashboard.id;
    option.selected = dashboard.id === state.builderDashboardId;
    builderDashboard.append(option);
  }
  const selected = state.builderDashboards.find((dashboard) => dashboard.id === state.builderDashboardId);
  if (builderDashboardName) builderDashboardName.value = selected?.name || "";
  const remove = document.querySelector("[data-builder-dashboard-delete]");
  if (remove) remove.disabled = state.builderDashboards.length <= 1;
}

function loadBuilderDashboard(id) {
  const dashboard = state.builderDashboards.find((row) => row.id === id);
  if (!dashboard) return;
  state.builderDashboardId = dashboard.id;
  state.builderOrder = [...new Set((dashboard.order || BUILDER_KINDS).filter((kind) => BUILDER_KINDS.includes(kind)))];
  for (const kind of BUILDER_KINDS) if (!state.builderOrder.includes(kind)) state.builderOrder.push(kind);
  state.builderVisible = [...new Set((dashboard.visible || []).filter((kind) => BUILDER_KINDS.includes(kind)))];
  state.builderLayout = BUILDER_LAYOUTS.includes(dashboard.layout) ? dashboard.layout : "grid";
  state.builderGeometry = structuredClone(dashboard.geometry || {});
  state.builderQueries = Object.fromEntries(BUILDER_KINDS.map((kind) => [kind, String(dashboard.queries?.[kind] || "").slice(0, 120)]));
  state.builderBlockSettings = normalizedBuilderBlockSettings(dashboard.blockSettings || {});
  state.builderSnap = dashboard.snap !== false;
  localStorage.setItem("betaBuilderDashboardId", state.builderDashboardId);
  renderBuilder();
  void refreshBuilderSources();
}

function saveBuilderDashboard() {
  const selected = state.builderDashboards.find((dashboard) => dashboard.id === state.builderDashboardId);
  if (!selected) return;
  selected.name = String(builderDashboardName?.value || selected.name || "Дашборд").trim().slice(0, 60) || "Дашборд";
  Object.assign(selected, currentBuilderDashboardSnapshot());
  persistBuilderSettings();
  syncBuilderDashboardControls();
  setStatus("Дашборд сохранён.");
}

function createBuilderDashboard() {
  if (state.builderDashboards.length >= 12) throw new Error("Можно сохранить не более 12 дашбордов.");
  const id = `dashboard-${Date.now()}`;
  state.builderDashboards.push({ id, name: `Дашборд ${state.builderDashboards.length + 1}`, ...currentBuilderDashboardSnapshot() });
  state.builderDashboardId = id;
  persistBuilderSettings();
  syncBuilderDashboardControls();
}

function deleteBuilderDashboard() {
  if (state.builderDashboards.length <= 1) return;
  state.builderDashboards = state.builderDashboards.filter((dashboard) => dashboard.id !== state.builderDashboardId);
  loadBuilderDashboard(state.builderDashboards[0].id);
  persistBuilderSettings();
}

function syncBuilderControls() {
  if (!builderGrid) return;
  syncBuilderDashboardControls();
  const effectiveLayout = state.builderCompact ? "adaptive" : state.builderLayout;
  builderGrid.classList.toggle("adaptive", effectiveLayout === "adaptive");
  builderGrid.classList.toggle("rows", effectiveLayout === "rows");
  builderGrid.classList.toggle("freeform", effectiveLayout === "freeform");
  if (effectiveLayout !== "freeform") builderGrid.style.removeProperty("min-height");
  builderLayout.value = state.builderLayout;
  document.querySelectorAll("[data-builder-blocks] input").forEach((input) => {
    input.checked = state.builderVisible.includes(input.value);
  });
  const snap = document.querySelector("[data-builder-snap]");
  if (snap) snap.checked = state.builderSnap;
  document.querySelectorAll("[data-builder-on-top]").forEach((onTop) => {
    onTop.classList.toggle("active", state.builderAlwaysOnTop);
    onTop.setAttribute("aria-pressed", String(state.builderAlwaysOnTop));
    onTop.textContent = t(state.builderAlwaysOnTop ? "Открепить" : "Поверх окон");
  });
  const compact = document.querySelector("[data-builder-compact]");
  compact.classList.toggle("active", state.builderCompact);
  compact.setAttribute("aria-pressed", String(state.builderCompact));
  compact.textContent = t(state.builderCompact ? "Обычный вид" : "Компактно");
  builderOpacity.disabled = !state.builderAlwaysOnTop;
  builderOpacity.value = String(state.builderOpacity);
  document.querySelector("[data-builder-opacity-output]").textContent = `${state.builderOpacity}%`;
  appView.classList.toggle("compactMode", state.builderCompact);
  document.documentElement.classList.toggle("compactMode", state.builderCompact);
  document.body.classList.toggle("compactMode", state.builderCompact);
  appView.classList.toggle("builderOverlayHidden", state.builderCompact && state.builderOverlayHidden);
  appView.classList.toggle("toolbarHidden", !state.uiSettings.showToolbar && !state.builderCompact);
  const compactMenu = document.querySelector("[data-compact-menu]");
  const compactMenuToggle = document.querySelector("[data-compact-menu-toggle]");
  const compactMenuPanel = document.querySelector("#compactMenuPanel");
  const compactMenuOpen = state.builderCompact && state.builderCompactMenuOpen;
  compactMenu?.classList.toggle("menuOpen", compactMenuOpen);
  compactMenu?.classList.toggle("hintVisible", state.builderCompact && state.builderCompactHintVisible);
  compactMenuToggle?.setAttribute("aria-expanded", String(compactMenuOpen));
  compactMenuToggle?.setAttribute("aria-label", t(compactMenuOpen ? "Скрыть компактное меню" : "Показать компактное меню"));
  compactMenuToggle?.setAttribute("title", t(compactMenuOpen ? "Скрыть компактное меню" : "Показать компактное меню"));
  compactMenuPanel?.setAttribute("aria-hidden", String(!compactMenuOpen));
  const overlayToggle = document.querySelector("[data-builder-overlay-toggle]");
  if (overlayToggle) {
    overlayToggle.setAttribute("aria-pressed", String(state.builderOverlayHidden));
    overlayToggle.textContent = t(state.builderOverlayHidden ? "Показать · Ctrl+Shift+B" : "Скрыть · Ctrl+Shift+B");
  }
}

function renderBuilder() {
  if (!builderGrid) return;
  syncBuilderControls();
  const fragment = document.createDocumentFragment();
  for (const kind of state.builderOrder) if (state.builderVisible.includes(kind)) fragment.append(builderBlock(kind));
  builderGrid.replaceChildren(fragment);
  if (!builderGrid.children.length) builderGrid.append(adminElement("p", "panel builderEmpty", "Включите хотя бы один блок в настройках выше."));
  updateBuilderBoardHeight();
  renderBuilderInspector();
}

async function refreshBuilderSources() {
  const visible = new Set(state.builderVisible || []);
  const tasks = [];
  if (visible.has("friendlog") && api.listLocalSocialEvents) {
    tasks.push(api.listLocalSocialEvents(500).then((rows) => { state.socialEvents = rows || []; }));
  }
  const canLoadVrchat = previewMode || state.settings?.hasVrchatAuthCookie;
  if (canLoadVrchat && visible.has("instance") && api.getVrchatCurrentInstance) {
    tasks.push(api.getVrchatCurrentInstance().then((instance) => { state.currentVrchatInstance = instance || null; }));
  }
  if (canLoadVrchat && visible.has("friends") && api.getVrchatSocialSummary) {
    tasks.push(refreshSocial(false));
  }
  await Promise.allSettled(tasks);
  if (state.view === "builder") renderBuilder();
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

function dismissBuilderCompactHint() {
  if (state.builderCompactHintTimer) window.clearTimeout(state.builderCompactHintTimer);
  state.builderCompactHintTimer = 0;
  state.builderCompactHintVisible = false;
}

function startBuilderCompactHint() {
  if (!state.builderCompact || localStorage.getItem("betaBuilderCompactHintSeen") === "true") return;
  localStorage.setItem("betaBuilderCompactHintSeen", "true");
  dismissBuilderCompactHint();
  state.builderCompactHintVisible = true;
  state.builderCompactHintTimer = window.setTimeout(() => {
    state.builderCompactHintTimer = 0;
    state.builderCompactHintVisible = false;
    syncBuilderControls();
  }, 5000);
  syncBuilderControls();
}

async function setBuilderCompact() {
  const next = !state.builderCompact;
  await api.setCompactMode(next);
  state.builderCompact = next;
  state.builderCompactMenuOpen = false;
  if (!next) dismissBuilderCompactHint();
  state.builderOverlayHidden = false;
  persistBuilderSettings();
  renderBuilder();
  if (next) startBuilderCompactHint();
  setStatus(next ? "Компактный режим включён." : "Обычный размер восстановлен.");
}

function setBuilderOverlayHidden(hidden = !state.builderOverlayHidden) {
  if (!state.builderCompact) return;
  state.builderOverlayHidden = hidden === true;
  syncBuilderControls();
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
  if (state.builderLayout !== "freeform" || state.builderCompact || event.button !== 0) return;
  const resize = event.target.closest("[data-builder-resize]");
  const move = event.target.closest("[data-builder-move]");
  if (!resize && (!move || event.target.closest("button, input, select, label, summary, details"))) return;
  const block = event.target.closest("[data-builder-kind]");
  if (!block) return;
  const kind = block.dataset.builderKind;
  const setting = builderBlockSetting(kind);
  if (setting.locked || setting.collapsed) return;
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
    if (state.builderSnap) {
      next.x = Math.round(next.x / BUILDER_SNAP_SIZE) * BUILDER_SNAP_SIZE;
      next.y = Math.round(next.y / BUILDER_SNAP_SIZE) * BUILDER_SNAP_SIZE;
      if (Math.abs(next.x) <= BUILDER_SNAP_SIZE) next.x = 0;
      if (Math.abs(boardWidth - (next.x + initial.width)) <= BUILDER_SNAP_SIZE) next.x = boardWidth - initial.width;
    }
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
    if (state.builderSnap) {
      if (west) {
        const right = initial.x + initial.width;
        next.x = Math.round(next.x / BUILDER_SNAP_SIZE) * BUILDER_SNAP_SIZE;
        if (Math.abs(next.x) <= BUILDER_SNAP_SIZE) next.x = 0;
        next.width = right - next.x;
      } else {
        next.width = Math.round(next.width / BUILDER_SNAP_SIZE) * BUILDER_SNAP_SIZE;
        if (Math.abs(boardWidth - (initial.x + next.width)) <= BUILDER_SNAP_SIZE) next.width = boardWidth - initial.x;
      }
      if (north) {
        const bottom = initial.y + initial.height;
        next.y = Math.round(next.y / BUILDER_SNAP_SIZE) * BUILDER_SNAP_SIZE;
        if (Math.abs(next.y) <= BUILDER_SNAP_SIZE) next.y = 0;
        next.height = bottom - next.y;
      } else {
        next.height = Math.round(next.height / BUILDER_SNAP_SIZE) * BUILDER_SNAP_SIZE;
      }
      next.width = Math.max(BUILDER_MIN_WIDTH, Math.min(next.width, boardWidth - next.x));
      next.height = Math.max(BUILDER_MIN_HEIGHT, next.height);
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
  state.builderBlockSettings = normalizedBuilderBlockSettings({});
  state.builderSnap = true;
  state.builderOpacity = 100;
  state.builderCompact = false;
  state.builderOverlayHidden = false;
  if (state.builderAlwaysOnTop) await api.setAlwaysOnTop(false, 1);
  await api.setCompactMode(false);
  state.builderAlwaysOnTop = false;
  persistBuilderSettings();
  renderBuilder();
  setStatus("Настройки Builder сброшены.");
}

function addEvent(event) {
  if (!event || typeof event !== "object") return;
  if (event.avatarRedacted || event.avatarProtected) event = { ...event, avatarName: "", avatarId: "", raw: "" };
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
  let trimmedEvents = false;
  if (state.events.length > eventLimit) {
    state.events.splice(0, state.events.length - eventLimit);
    trimmedEvents = true;
  }
  invalidateSessionData({ avatars: trimmedEvents || isAvatarEvent(event) });
  eventCount.textContent = `${state.events.length} событий`;
  if (state.view === "session") scheduleSessionRender();
  if (state.view === "admin") scheduleAdminRender();
  if (state.view === "owner") scheduleOwnerRender();
  if (state.view === "crash") scheduleCrashRender();
  if (state.view === "builder") scheduleBuilderRender();
}

function selectView(view) {
  if (["players", "worlds", "local-avatars"].includes(view)) {
    selectLibraryTab(view);
    view = "library";
  }
  if (!viewTitles[view]) return;
  if (view === "games" && !hasPaidAccess()) return;
  if (view === "admin" && !hasPaidAccess()) return;
  if (view === "owner" && !hasOwnerAccess()) return;
  const mode = viewWorkspaceMode(view);
  if (mode === "team" && !hasPaidAccess()) return;
  if (!state.builderCompact && mode !== "shared" && state.workspaceMode !== mode) {
    state.workspaceMode = mode;
    syncWorkspaceNavigation();
  }
  state.view = view;
  state.workspaceLastView[state.workspaceMode] = view;
  localStorage.setItem("betaWorkspaceLastView", JSON.stringify(state.workspaceLastView));
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
  if (view === "social") void refreshSocial();
  if (view === "library") {
    syncLibraryTabs();
    void refreshLocalDirectory(state.libraryTab);
  }
  if (view === "games") void startMiniGame(gameState.mode);
  if (view === "history") void refreshHistory();
  if (view === "admin") void refreshAdmin();
  if (view === "owner") void refreshOwner({ silent: true });
  if (view === "crash") void refreshCrash();
  if (view === "builder") {
    requestAnimationFrame(() => renderBuilder());
    void refreshBuilderSources();
  }
  if (view === "session") requestAnimationFrame(() => renderSession());
}

function renderMiniGame() {
  if (!gamesPanel) return;
  document.querySelectorAll("[data-game-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.gameMode === gameState.mode);
    button.setAttribute("aria-pressed", String(button.dataset.gameMode === gameState.mode));
  });
  const questionLabel = gamesPanel.querySelector("[data-game-question]");
  const status = gamesPanel.querySelector("[data-game-status]");
  const options = gamesPanel.querySelector("[data-game-options]");
  const next = gamesPanel.querySelector("[data-game-next]");
  gamesPanel.querySelector("[data-game-progress]").textContent = `${gameState.round} / ${gameState.roundLimit}`;
  gamesPanel.querySelector("[data-game-score]").textContent = `${gameState.score} ${t("очков")}`;
  options.replaceChildren();
  next.hidden = !gameState.answered;
  if (gameState.loading) {
    questionLabel.textContent = t("Загружаем историю миров…");
    status.textContent = "";
    return;
  }
  const question = gameState.question;
  if (!question) {
    questionLabel.textContent = t(gameState.error ? "Не удалось загрузить историю миров" : "Пока не хватает истории миров");
    status.textContent = t(gameState.error ? "Попробуйте открыть игры ещё раз." : gameState.mode === "recent"
      ? "Для этой игры нужны хотя бы два мира с разным временем посещения."
      : "Для этой игры нужен мир с сохранёнными сессиями.");
    return;
  }
  questionLabel.textContent = question.mode === "visits"
    ? `${t("Сколько сохранённых сессий связано с миром")} «${gameState.rows.find((row) => row.world_key === question.sourceKey)?.world_name || ""}»?`
    : t(question.prompt);
  status.textContent = gameState.answered
    ? (gameState.selectedAnswer === question.answer ? t("Верно!") : t("Не угадал."))
    : t("Выбери один вариант.");
  for (const option of question.options) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.gameAnswer = option.value;
    button.textContent = option.label;
    if (gameState.answered) {
      button.disabled = true;
      if (option.value === question.answer) button.dataset.result = "correct";
      else if (option.value === gameState.selectedAnswer) button.dataset.result = "wrong";
    }
    options.append(button);
  }
  next.textContent = gameState.round >= gameState.roundLimit ? t("Сыграть ещё") : t("Следующий вопрос");
}

async function startMiniGame(mode) {
  if (!hasPaidAccess() || !miniGames || !["recent", "visits"].includes(mode)) return;
  const requestId = ++gameState.requestId;
  gameState.mode = mode;
  gameState.round = 0;
  gameState.roundLimit = 0;
  gameState.score = 0;
  gameState.question = null;
  gameState.answered = false;
  gameState.loading = true;
  gameState.error = false;
  gameState.usedKeys = [];
  renderMiniGame();
  try {
    const result = await api.searchCompanion("");
    if (requestId !== gameState.requestId || !hasPaidAccess() || state.view !== "games" || gameState.mode !== mode) return;
    gameState.rows = result?.worlds || [];
    const worlds = miniGames.normalizeWorlds(gameState.rows);
    gameState.roundLimit = Math.min(5, mode === "recent"
      ? Math.max(0, new Set(worlds.map((world) => world.lastSeen)).size - 1)
      : worlds.filter((world) => world.sessions > 0).length);
    gameState.question = miniGames.createQuestion(gameState.rows, mode);
    gameState.round = gameState.question ? 1 : 0;
  } catch {
    if (requestId === gameState.requestId) {
      gameState.rows = [];
      gameState.question = null;
      gameState.error = true;
    }
  } finally {
    if (requestId === gameState.requestId) {
      gameState.loading = false;
      renderMiniGame();
    }
  }
}

function answerMiniGame(value) {
  if (!hasPaidAccess() || !gameState.question || gameState.answered) return;
  if (!gameState.question.options.some((option) => option.value === value)) return;
  gameState.selectedAnswer = value;
  gameState.answered = true;
  if (value === gameState.question.answer) gameState.score += 1;
  renderMiniGame();
}

function nextMiniGame() {
  if (!hasPaidAccess() || !gameState.answered) return;
  if (gameState.round >= gameState.roundLimit) {
    void startMiniGame(gameState.mode);
    return;
  }
  gameState.usedKeys.push(gameState.question.sourceKey);
  gameState.question = miniGames.createQuestion(gameState.rows, gameState.mode, Math.random, gameState.usedKeys);
  if (!gameState.question) gameState.question = miniGames.createQuestion(gameState.rows, gameState.mode);
  gameState.round += 1;
  gameState.answered = false;
  renderMiniGame();
}

function syncLibraryTabs() {
  document.querySelectorAll("[data-library-tab]").forEach((button) => {
    const active = button.dataset.libraryTab === state.libraryTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
    button.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll("[data-library-pane]").forEach((pane) => {
    const active = pane.dataset.libraryPane === state.libraryTab;
    pane.classList.toggle("active", active);
    pane.hidden = !active;
  });
}

function selectLibraryTab(tab) {
  if (!["players", "worlds", "local-avatars"].includes(tab)) return;
  state.libraryTab = tab;
  localStorage.setItem("betaLibraryTab", tab);
  syncLibraryTabs();
  if (state.view === "library") void refreshLocalDirectory(tab);
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

function companionResultRows() {
  const players = (state.companionResults.players || []).map((entity) => ({
    kind: "player",
    key: entity.user_id,
    title: entity.alias || entity.display_name || entity.user_id,
    subtitle: entity.user_id,
    sessions: Number(entity.session_count) || 0,
    favorite: entity.status === "favorite"
  }));
  const worlds = (state.companionResults.worlds || []).map((entity) => ({
    kind: "world",
    key: entity.world_key,
    title: entity.world_name || entity.world_id,
    subtitle: entity.world_id || "World ID не сохранён",
    sessions: Number(entity.session_count) || 0,
    favorite: Boolean(entity.favorite)
  }));
  const avatars = (state.companionResults.avatars || []).map((entity) => ({
    kind: "avatar",
    key: entity.avatar_key,
    title: entity.avatar_name || entity.avatar_id,
    subtitle: entity.avatar_id || "Avatar ID не сохранён",
    sessions: Number(entity.session_count) || 0
  }));
  return [...players, ...worlds, ...avatars]
    .filter((row) => !state.companionFavoritesOnly || row.favorite)
    .sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)));
}

function renderCompanionDetails() {
  if (!companionSearchDetail) return;
  companionSearchDetail.replaceChildren();
  if (state.companionLoading && state.companionSelectedKey) {
    companionSearchDetail.classList.add("adminPreviewEmpty");
    companionSearchDetail.append(adminElement("span", "profileAvatar", "…"), adminElement("h2", "", "Загружаем карточку"));
    return;
  }
  const details = state.companionDetails;
  if (!details?.entity) {
    companionSearchDetail.classList.add("adminPreviewEmpty");
    companionSearchDetail.append(adminElement("span", "profileAvatar", "⌕"), adminElement("h2", "", "Выберите результат"), adminElement("p", "", "Здесь появятся встречи, посещения и быстрые действия."));
    return;
  }
  companionSearchDetail.classList.remove("adminPreviewEmpty");
  const entity = details.entity;
  const player = details.kind === "player";
  const avatar = details.kind === "avatar";
  const key = player ? entity.user_id : (avatar ? entity.avatar_key : entity.world_key);
  const titleText = player ? (entity.display_name || entity.user_id) : (avatar ? (entity.avatar_name || entity.avatar_id) : (entity.world_name || entity.world_id));
  const subtitleText = player ? entity.user_id : (avatar ? (entity.avatar_id || "Avatar ID не сохранён") : (entity.world_id || "World ID не сохранён"));
  const content = adminElement("div", "companionDetailContent");
  const header = adminElement("header");
  const identity = adminElement("div");
  identity.append(adminElement("span", "eyebrow", player ? "Игрок из локальной истории" : (avatar ? "Аватар из локальной истории" : "Мир из локальной истории")), userTextElement("h2", "", titleText), userTextElement("p", "", subtitleText));
  header.append(identity);
  if (player) {
    const profile = adminElement("button", "", "Профиль VRChat");
    profile.type = "button";
    profile.dataset.insightProfile = entity.user_id;
    header.append(profile);
  } else if (!avatar) {
    const actions = savedWorldActions(entity.world_id);
    if (actions) header.append(actions);
  }
  content.append(header);
  const metrics = adminElement("div", "companionDetailMetrics");
  for (const [label, value] of [
    [player ? "Встреч" : (avatar ? "Сессий" : "Посещений"), String(Number(entity.session_count) || 0)],
    ["Впервые", adminDate(entity.first_seen_at)],
    ["Последний раз", adminDate(entity.last_seen_at)]
  ]) {
    const metric = adminElement("article");
    metric.append(adminElement("span", "", label), adminElement("strong", "", value));
    metrics.append(metric);
  }
  content.append(metrics);
  const sessions = insightsModel.dedupeSessions(details.sessions || []);
  const list = adminElement("section", "companionDetailSessions");
  list.append(adminElement("h3", "", player ? "Последние встречи" : (avatar ? "Последние наблюдения" : "Последние посещения")));
  for (const session of sessions.slice(0, 20)) {
    const row = adminElement("div", "companionDetailSession");
    row.append(userOrUiElement("strong", "", session.worldName, "Неизвестный мир"), adminElement("span", "", `${session.players.length} участников`), adminElement("time", "", adminDate(session.startedAt)));
    list.append(row);
  }
  if (!sessions.length) list.append(emptyMessage("Связанные сессии не найдены."));
  content.append(list);
  companionSearchDetail.append(content);
  if (key !== state.companionSelectedKey) state.companionSelectedKey = key;
}

function renderCompanionSearch() {
  if (!companionSearchLayout || !companionSearchResults) return;
  const active = state.companionQuery.trim().length >= 2;
  companionSearchLayout.hidden = !active;
  if (!active) return;
  const rows = companionResultRows();
  companionSearchResults.replaceChildren();
  companionSearchCount.textContent = state.companionLoading ? "поиск…" : `${rows.length} найдено`;
  for (const result of rows) {
    const row = adminElement("button", "companionSearchRow");
    row.type = "button";
    row.dataset.companionResultKind = result.kind;
    row.dataset.companionResultKey = result.key;
    row.classList.toggle("active", result.kind === state.companionSelectedKind && result.key === state.companionSelectedKey);
    const copy = adminElement("div");
    copy.append(userTextElement("strong", "", result.title), userTextElement("small", "", result.subtitle));
    row.append(adminElement("span", "companionSearchIcon", result.favorite ? "★" : result.kind === "player" ? "P" : (result.kind === "avatar" ? "A" : "W")), copy, adminElement("em", "", sessionCountText(result.sessions)));
    companionSearchResults.append(row);
  }
  if (!rows.length && !state.companionLoading) companionSearchResults.append(emptyMessage(state.companionError || "В локальной истории ничего не найдено."));
  renderCompanionDetails();
}

async function runCompanionSearch() {
  const query = state.companionQuery.trim();
  const requestId = ++state.companionRequestId;
  state.companionError = "";
  state.companionResults = { players: [], worlds: [], avatars: [] };
  state.companionSelectedKind = "";
  state.companionSelectedKey = "";
  state.companionDetails = null;
  if (query.length < 2) {
    state.companionLoading = false;
    renderCompanionSearch();
    return;
  }
  state.companionLoading = true;
  renderCompanionSearch();
  try {
    const result = await api.searchCompanion(query);
    if (requestId !== state.companionRequestId) return;
    state.companionResults = { players: result?.players || [], worlds: result?.worlds || [], avatars: result?.avatars || [] };
  } catch (error) {
    if (requestId !== state.companionRequestId) return;
    state.companionError = error.message || "Локальный поиск недоступен.";
  } finally {
    if (requestId === state.companionRequestId) {
      state.companionLoading = false;
      renderCompanionSearch();
    }
  }
}

async function selectCompanionResult(kind, key) {
  state.companionSelectedKind = kind;
  state.companionSelectedKey = key;
  state.companionDetails = null;
  state.companionLoading = true;
  renderCompanionSearch();
  try {
    state.companionDetails = await api.getCompanionDetails(kind, key);
  } catch (error) {
    state.companionError = error.message || "Не удалось загрузить локальную карточку.";
  } finally {
    state.companionLoading = false;
    renderCompanionSearch();
  }
}

function directoryKindForView(view) {
  if (view === "players") return "player";
  if (view === "worlds") return "world";
  if (view === "local-avatars") return "avatar";
  return "";
}

function directoryViewForKind(kind) {
  if (kind === "player") return "players";
  if (kind === "world") return "worlds";
  if (kind === "avatar") return "local-avatars";
  return "";
}

function directoryEntities(result, kind) {
  if (kind === "player") return result?.players || [];
  if (kind === "world") return result?.worlds || [];
  return result?.avatars || [];
}

function directoryEntityKey(entity, kind) {
  if (kind === "player") return String(entity?.user_id || "");
  if (kind === "world") return String(entity?.world_key || "");
  return String(entity?.avatar_key || "");
}

function directoryEntityTitle(entity, kind) {
  if (kind === "player") return entity?.alias || entity?.display_name || entity?.user_id;
  if (kind === "world") return entity?.world_name || entity?.world_id;
  return entity?.avatar_name || entity?.avatar_id;
}

function directoryEntitySubtitle(entity, kind) {
  if (kind === "player") return entity?.user_id;
  if (kind === "world") return entity?.world_id || "World ID не сохранён";
  return entity?.avatar_id || "Avatar ID не сохранён";
}

function renderLocalDirectory(kind) {
  const panel = directoryPanels.find((item) => item.dataset.directoryKind === kind);
  if (!panel) return;
  const list = panel.querySelector("[data-directory-list]");
  const count = panel.querySelector("[data-directory-count]");
  const detail = panel.querySelector("[data-directory-detail]");
  const rows = state.directoryResults[kind] || [];
  count.textContent = state.directoryLoading[kind] ? "загрузка…" : `${rows.length} записей`;
  list.replaceChildren();
  for (const entity of rows) {
    const key = directoryEntityKey(entity, kind);
    const row = adminElement("button", "companionSearchRow");
    row.type = "button";
    row.dataset.directoryResultKind = kind;
    row.dataset.directoryResultKey = key;
    row.classList.toggle("active", state.directorySelected[kind] === key);
    const copy = adminElement("div");
    copy.append(userTextElement("strong", "", directoryEntityTitle(entity, kind)), userTextElement("small", "", directoryEntitySubtitle(entity, kind)));
    const suffix = kind === "world" && Number(entity.favorite) ? `★ · ${sessionCountText(Number(entity.session_count) || 0)}`
      : (kind === "player" && entity.status !== "none" ? `${entity.status === "watch" ? "Наблюдение" : "Избранное"} · ${sessionCountText(Number(entity.session_count) || 0)}` : sessionCountText(Number(entity.session_count) || 0));
    row.append(adminElement("span", "companionSearchIcon", kind === "player" ? "P" : (kind === "world" ? "W" : "A")), copy, adminElement("em", "", suffix));
    list.append(row);
  }
  if (!rows.length && !state.directoryLoading[kind]) list.append(emptyMessage(kind === "player" ? "История игроков пока пуста." : (kind === "world" ? "История миров пока пуста." : "Локальных наблюдений пока нет.")));

  const details = state.directoryDetails[kind];
  detail.replaceChildren();
  if (!details?.entity) {
    detail.classList.add("adminPreviewEmpty");
    detail.append(adminElement("span", "profileAvatar", kind === "player" ? "P" : (kind === "world" ? "W" : "A")), adminElement("h2", "", kind === "player" ? "Выберите игрока" : (kind === "world" ? "Выберите мир" : "Выберите аватар")), adminElement("p", "", kind === "player" ? "История встреч появится здесь." : (kind === "world" ? "История посещений появится здесь." : "Локальная история наблюдений появится здесь.")));
    return;
  }
  detail.classList.remove("adminPreviewEmpty");
  const entity = details.entity;
  const title = directoryEntityTitle(entity, kind);
  const content = adminElement("div", "companionDetailContent");
  const header = adminElement("header");
  const identity = adminElement("div");
  identity.append(adminElement("span", "eyebrow", kind === "player" ? "Игрок из локальной истории" : (kind === "world" ? "Мир из локальной истории" : "Аватар из локальной истории")), userTextElement("h2", "", title), userTextElement("p", "", directoryEntitySubtitle(entity, kind)));
  header.append(identity);
  if (kind === "player") {
    const profile = adminElement("button", "", "Профиль VRChat");
    profile.type = "button";
    profile.dataset.insightProfile = entity.user_id;
    header.append(profile);
  } else if (kind === "world") {
    const actions = savedWorldActions(entity.world_id);
    if (actions) header.append(actions);
  } else if (kind === "avatar" && entity.avatar_id) {
    const actions = adminElement("div", "socialDetailActions");
    const verify = adminElement("button", "", state.directoryAvatarProfile?.avatarId === entity.avatar_id ? "Обновить данные VRChat" : "Загрузить данные VRChat");
    verify.type = "button";
    verify.dataset.localAvatarProfile = entity.avatar_id;
    const open = adminElement("button", "", "Страница аватара");
    open.type = "button";
    open.dataset.avatarOpen = entity.avatar_id;
    actions.append(verify, open);
    header.append(actions);
  }
  content.append(header);
  const metrics = adminElement("div", "companionDetailMetrics");
  for (const [label, value] of [[kind === "player" ? "Встреч" : (kind === "world" ? "Посещений" : "Наблюдений"), String(Number(kind === "avatar" ? entity.observation_count : entity.session_count) || 0)], ["Впервые", adminDate(entity.first_seen_at)], ["Последний раз", adminDate(entity.last_seen_at)]]) {
    const metric = adminElement("article");
    metric.append(adminElement("span", "", label), adminElement("strong", "", value));
    metrics.append(metric);
  }
  content.append(metrics);
  if (kind === "avatar" && state.directoryAvatarProfile?.avatarId === entity.avatar_id) {
    const profile = state.directoryAvatarProfile;
    const vrchat = adminElement("section", "socialDetailSection socialFacts");
    vrchat.append(adminElement("h3", "", "Подтверждено VRChat API"));
    const performance = Object.entries(profile.performance || {}).map(([platform, rating]) => `${platform}: ${rating}`).join(" · ");
    for (const [label, value] of [["Автор", profile.authorName || profile.authorId || "—"], ["Статус", profile.releaseStatus || "—"], ["Версия", profile.version === null ? "—" : String(profile.version)], ["Платформы", profile.platforms?.join(", ") || "—"], ["Производительность", performance || "—"], ["Создан", adminDate(profile.createdAt)], ["Обновлён", adminDate(profile.updatedAt)]]) {
      const row = adminElement("div", "socialFact");
      row.append(adminElement("span", "", label), userTextElement("strong", "", value));
      vrchat.append(row);
    }
    if (profile.description) vrchat.append(userTextElement("p", "", profile.description));
    if (profile.packages?.length) {
      const packages = adminElement("div", "avatarPackageGrid");
      for (const item of profile.packages) {
        const size = Number(item.fileSize) > 0 ? ` · ${(Number(item.fileSize) / (1024 * 1024)).toFixed(1)} МиБ` : "";
        const card = adminElement("article", "avatarPackageCard");
        card.append(
          userTextElement("strong", "", item.platform || "Неизвестная платформа"),
          userTextElement("span", "", `${item.performanceRating || "Без оценки"}${item.variant ? ` · ${item.variant}` : ""}`),
          userTextElement("small", "", `${item.unityVersion || "Unity не указан"}${item.assetVersion === null ? "" : ` · asset ${item.assetVersion}`}${size}`)
        );
        packages.append(card);
      }
      vrchat.append(packages);
    }
    if (profile.tags?.length) {
      const tags = adminElement("div", "avatarTagList");
      profile.tags.forEach((tag) => tags.append(userTextElement("span", "", tag)));
      vrchat.append(tags);
    }
    content.append(vrchat);
  }
  if (kind === "player") {
    const form = adminElement("form", "companionPreferenceForm");
    form.dataset.localPlayerPreference = entity.user_id;
    const alias = adminElement("input");
    alias.name = "alias";
    alias.placeholder = "Локальное имя или пометка";
    alias.maxLength = 160;
    alias.value = entity.alias || "";
    const status = adminElement("select");
    status.name = "status";
    for (const [value, label] of [["none", "Без отметки"], ["watch", "Наблюдение и уведомления"], ["favorite", "Избранный игрок и уведомления"]]) {
      const option = adminElement("option", "", label);
      option.value = value;
      option.selected = value === entity.status;
      status.append(option);
    }
    const note = adminElement("textarea");
    note.name = "note";
    note.maxLength = 4000;
    note.placeholder = "Личная заметка — хранится только на этом ПК";
    note.value = entity.note || "";
    const save = adminElement("button", "primaryButton", "Сохранить локально");
    save.type = "submit";
    form.append(adminElement("h3", "", "Личная карточка"), alias, status, note, save);
    content.append(form);
    const names = adminElement("section", "companionDetailSessions");
    names.append(adminElement("h3", "", "История ников"));
    for (const entry of details.names || []) {
      const row = adminElement("div", "companionDetailSession");
      row.append(userTextElement("strong", "", entry.display_name), adminElement("span", "", adminDate(entry.first_seen_at)), adminElement("time", "", adminDate(entry.last_seen_at)));
      names.append(row);
    }
    if (!details.names?.length) names.append(emptyMessage("Смена ника пока не зафиксирована."));
    content.append(names);
    const encounters = adminElement("section", "companionDetailSessions");
    encounters.append(adminElement("h3", "", "Входы и выходы"));
    for (const entry of details.events || []) {
      const row = adminElement("div", "companionDetailSession");
      row.append(adminElement("strong", "", entry.event_type === "player-joined" ? "Вошёл" : "Вышел"), userOrUiElement("span", "", entry.world_name, "Мир не определён"), adminElement("time", "", adminDate(entry.occurred_at)));
      encounters.append(row);
    }
    if (!details.events?.length) encounters.append(emptyMessage("Подробные входы и выходы появятся после новой записи лога."));
    content.append(encounters);
    const sharedWorlds = adminElement("section", "companionDetailSessions");
    sharedWorlds.append(adminElement("h3", "", "Общие миры"));
    for (const world of details.worlds || []) {
      const row = adminElement("button", "companionDetailSession");
      row.type = "button";
      row.dataset.localWorldKey = world.world_key;
      row.append(userOrUiElement("strong", "", world.world_name, "Неизвестный мир"), adminElement("span", "", sessionCountText(world.session_count)), adminElement("time", "", adminDate(world.last_seen_at)));
      sharedWorlds.append(row);
    }
    if (!details.worlds?.length) sharedWorlds.append(emptyMessage("Общие миры пока не определены."));
    content.append(sharedWorlds);
    const recentAvatars = adminElement("section", "companionDetailSessions");
    recentAvatars.append(adminElement("h3", "", "Последние аватары"));
    for (const avatar of details.avatars || []) {
      const row = adminElement("button", "companionDetailSession");
      row.type = "button";
      row.dataset.localAvatarKey = avatar.avatar_key;
      row.append(userOrUiElement("strong", "", avatar.avatar_name, "Неизвестный аватар"), userTextElement("span", "", avatar.avatar_id || "Avatar ID не сохранён"), adminElement("time", "", adminDate(avatar.last_seen_at)));
      recentAvatars.append(row);
    }
    if (!details.avatars?.length) recentAvatars.append(emptyMessage("Аватары этого игрока пока не зафиксированы."));
    content.append(recentAvatars);
  } else if (kind === "world") {
    const form = adminElement("form", "companionPreferenceForm");
    form.dataset.localWorldPreference = entity.world_key;
    const favoriteLabel = adminElement("label", "checkRow");
    const favorite = adminElement("input");
    favorite.type = "checkbox";
    favorite.name = "favorite";
    favorite.checked = Boolean(Number(entity.favorite));
    favoriteLabel.append(favorite, adminElement("span", "", "Добавить мир в избранное"));
    const note = adminElement("textarea");
    note.name = "note";
    note.maxLength = 4000;
    note.placeholder = "Личная заметка о мире";
    note.value = entity.note || "";
    const save = adminElement("button", "primaryButton", "Сохранить локально");
    save.type = "submit";
    form.append(adminElement("h3", "", "Избранный мир"), favoriteLabel, note, save);
    content.append(form);
  }
  const sessions = insightsModel.dedupeSessions(details.sessions || []);
  const sessionList = adminElement("section", "companionDetailSessions");
  sessionList.append(adminElement("h3", "", kind === "player" ? "Последние встречи" : (kind === "world" ? "История посещений" : "Последние наблюдения")));
  if (kind === "world" && details.visits?.length) {
    for (const visit of details.visits.slice(0, 30)) {
      const row = adminElement("div", "companionDetailSession");
      row.append(adminElement("strong", "", "Посещение"), userTextElement("span", "", visit.session_id), adminElement("time", "", adminDate(visit.seen_at)));
      sessionList.append(row);
    }
  } else {
    for (const session of sessions.slice(0, 30)) {
      const row = adminElement("div", "companionDetailSession");
      row.append(userOrUiElement("strong", "", session.worldName, "Неизвестный мир"), adminElement("span", "", `${session.players.length} участников`), adminElement("time", "", adminDate(session.startedAt)));
      sessionList.append(row);
    }
  }
  if (!(kind === "world" && details.visits?.length) && !sessions.length) sessionList.append(emptyMessage("Связанные сессии не найдены."));
  content.append(sessionList);
  detail.append(content);
}

async function refreshLocalDirectory(view = state.view) {
  const kind = directoryKindForView(view);
  if (!kind) return;
  const requestId = ++state.directoryRequestId[kind];
  state.directoryLoading[kind] = true;
  renderLocalDirectory(kind);
  try {
    const result = await api.searchCompanion(state.directoryQueries[kind]);
    if (requestId !== state.directoryRequestId[kind]) return;
    state.directoryResults[kind] = directoryEntities(result, kind);
    const selectedKey = state.directorySelected[kind];
    if (selectedKey && !state.directoryResults[kind].some((entity) => directoryEntityKey(entity, kind) === selectedKey)) {
      state.directorySelected[kind] = "";
      state.directoryDetails[kind] = null;
    }
  } catch {
    if (requestId === state.directoryRequestId[kind]) state.directoryResults[kind] = [];
  } finally {
    if (requestId === state.directoryRequestId[kind]) {
      state.directoryLoading[kind] = false;
      renderLocalDirectory(kind);
    }
  }
}

async function selectDirectoryResult(kind, key) {
  state.directorySelected[kind] = key;
  state.directoryDetails[kind] = null;
  if (kind === "avatar") state.directoryAvatarProfile = null;
  state.directoryLoading[kind] = true;
  renderLocalDirectory(kind);
  try {
    state.directoryDetails[kind] = await api.getCompanionDetails(kind, key);
  } finally {
    state.directoryLoading[kind] = false;
    renderLocalDirectory(kind);
  }
}

async function openLocalPlayerCard(userId) {
  const safeUserId = String(userId || "").trim();
  if (!safeUserId) return;
  selectView("players");
  await selectDirectoryResult("player", safeUserId);
}

async function openLocalWorldCard(worldKey) {
  const safeWorldKey = String(worldKey || "").trim();
  if (!safeWorldKey) return;
  selectView("worlds");
  await selectDirectoryResult("world", safeWorldKey);
}

function renderSocial() {
  if (!socialSummary) return;
  document.querySelectorAll("[data-social-tab]").forEach((button) => button.classList.toggle("active", button.dataset.socialTab === state.socialTab));
  const inventoryType = document.querySelector("[data-social-inventory-type]");
  const notificationFilter = document.querySelector("[data-social-notification-filter]");
  if (inventoryType) {
    inventoryType.hidden = state.socialTab !== "inventory";
    const types = [...new Set((state.socialCollections.inventory?.rows || []).map((row) => row.itemType).filter(Boolean))].sort();
    inventoryType.replaceChildren(...["", ...types].map((type) => {
      const option = document.createElement("option"); option.value = type; option.textContent = type || "Все типы";
      if (type) option.dataset.i18nSkip = "true"; return option;
    }));
    inventoryType.value = state.socialInventoryType;
  }
  if (notificationFilter) notificationFilter.hidden = state.socialTab !== "notifications";
  socialSummary.replaceChildren();
  if (socialStatus) socialStatus.textContent = state.socialLoading ? "Загружаем данные VRChat…" : state.socialError;
  if (state.socialLoading && !state.social) {
    socialSummary.append(emptyMessage("Подключаемся к VRChat…"));
    return;
  }
  if (!state.social) {
    const empty = adminElement("article", "panel adminPreviewEmpty");
    empty.append(adminElement("h2", "", state.settings?.hasVrchatAuthCookie ? "Данные пока не загружены" : "Подключите аккаунт VRChat"), adminElement("p", "", state.socialError || "Нажмите отдельную кнопку «VRChat» в панели приложения."));
    socialSummary.append(empty);
    return;
  }
  const friends = Array.isArray(state.social.friends) ? state.social.friends : [];
  const matches = (row) => !state.socialQuery.trim() || ["displayName", "userId", "worldName", "worldId", "avatarName", "avatarId", "name", "groupId", "shortCode", "message", "senderUsername", "senderUserId", "type", "id", "itemType", "description", "authorName"]
    .some((key) => String(row[key] || "").toLowerCase().includes(state.socialQuery.trim().toLowerCase()));
  const groups = (Array.isArray(state.social.groups) ? state.social.groups : []).filter(matches);
  const online = friends.filter((friend) => typeof friend.online === "boolean" ? friend.online : (friend.status && friend.status !== "offline")).length;
  const metrics = adminElement("div", "companionDetailMetrics socialMetrics");
  for (const [label, value] of [["Аккаунт", state.social.user?.displayName || state.social.user?.userId || "—"], ["Друзья", String(friends.length)], ["Не офлайн", String(online)], ["Публичные группы", String(groups.length)]]) {
    const metric = adminElement("article");
    metric.append(adminElement("span", "", label), userTextElement("strong", "", value));
    metrics.append(metric);
  }
  socialSummary.append(metrics);
  if (state.social.truncatedFriends) {
    const warning = adminElement("p", "socialWarning", "Список достиг безопасного лимита. Журнал не будет считать отсутствующих друзей удалёнными.");
    socialSummary.append(warning);
  }
  const favoriteIds = new Set((state.socialPreferences || []).filter((row) => row.status === "favorite").map((row) => row.user_id || row.userId));
  const sortedFriends = friends.filter(matches).sort((a, b) => Number(socialFriendOnline(b)) - Number(socialFriendOnline(a)) || a.displayName.localeCompare(b.displayName, uiLocale()));
  if (state.socialTab === "journal") {
    const panel = socialPanel("Локально", "Журнал друзей", String(state.socialEvents.length));
    const list = adminElement("div", "socialList socialJournal");
    renderVirtualSocialRows(list, state.socialEvents.slice(0, 500), (entry) => {
      const row = adminElement("button", "socialRow socialEventRow");
      row.type = "button";
      row.dataset.socialProfile = entry.user_id;
      const friend = friends.find((item) => item.userId === entry.user_id);
      const portrait = friendPortraitElement({ ...entry.snapshot, ...friend, displayName: entry.display_name, userId: entry.user_id });
      const copy = adminElement("span");
      copy.append(userTextElement("strong", "", entry.display_name || entry.user_id), userTextElement("small", "", FRIEND_ACTIVITY_LABELS[entry.event_type] || entry.event_type));
      row.append(portrait, copy, adminElement("em", "", adminDate(entry.occurred_at)));
      return row;
    }, "Лента начнёт заполняться после подключения аккаунта VRChat. Приложение должно быть запущено.");
    panel.append(list);
    socialSummary.append(panel);
    return;
  }
  if (state.socialTab === "locations") {
    const byLocation = new Map();
    for (const friend of sortedFriends.filter((row) => socialFriendOnline(row))) {
      const key = friend.location || "private";
      if (!byLocation.has(key)) byLocation.set(key, []);
      byLocation.get(key).push(friend);
    }
    const grid = adminElement("div", "socialLocationGrid");
    for (const [location, rows] of byLocation) {
      const title = socialLocationLabel(location, rows[0]);
      const panel = socialPanel("Сейчас", title, `${rows.length}`);
      const heading = panel.querySelector("h2");
      if (heading && location && location !== title) heading.title = location;
      const list = adminElement("div", "socialList");
      renderVirtualSocialRows(list, rows, (friend) => socialFriendRow(friend, favoriteIds), "Друзей в этой локации нет.");
      panel.append(list);
      grid.append(panel);
    }
    if (!byLocation.size) grid.append(emptyMessage("Друзей в доступных локациях сейчас нет."));
    socialSummary.append(grid);
    return;
  }
  if (state.socialTab === "favorites") {
    const favorites = sortedFriends.filter((friend) => favoriteIds.has(friend.userId));
    const panel = socialPanel("Локальная отметка", "Избранные друзья", String(favorites.length));
    const list = adminElement("div", "socialList");
    renderVirtualSocialRows(list, favorites, (friend) => socialFriendRow(friend, favoriteIds), "Добавьте игрока в избранное через его локальную карточку.");
    panel.append(list);
    socialSummary.append(panel);
    return;
  }
  if (state.socialTab === "groups") {
    const panel = socialPanel("VRChat", "Группы", String(groups.length));
    const list = adminElement("div", "socialList");
    renderVirtualSocialRows(list, groups, socialGroupRow, "Публичные группы не найдены.");
    panel.append(list);
    socialSummary.append(panel);
    return;
  }
  if (state.socialTab === "vrchat-favorites") {
    const columns = adminElement("div", "socialColumns");
    const worlds = (state.socialCollections["favorite-worlds"]?.rows || []).filter(matches);
    const avatars = (state.socialCollections["favorite-avatars"]?.rows || []).filter(matches);
    const worldPanel = socialPanel("Ваш аккаунт", "Избранные миры", String(worlds.length));
    const worldList = adminElement("div", "socialList");
    renderVirtualSocialRows(worldList, worlds, (world) => {
      const row = adminElement("button", "socialRow");
      row.type = "button";
      row.dataset.socialWorld = world.worldId;
      const copy = adminElement("span");
      copy.append(userTextElement("strong", "", world.worldName || world.worldId), userTextElement("small", "", world.authorName || world.worldId));
      row.append(friendPortraitElement({ displayName: world.worldName, imageUrl: world.imageUrl }, "worldPortrait"), copy, adminElement("em", "", world.occupants === null ? "" : `${world.occupants} онлайн`));
      return row;
    }, "Избранные миры не загружены или список пуст.");
    worldPanel.append(worldList);
    const avatarPanel = socialPanel("Ваш аккаунт", "Избранные аватары", String(avatars.length));
    const avatarList = adminElement("div", "socialList");
    renderVirtualSocialRows(avatarList, avatars, (avatar) => {
      const row = adminElement("button", "socialRow");
      row.type = "button";
      row.dataset.avatarOpen = avatar.avatarId;
      const copy = adminElement("span");
      copy.append(userTextElement("strong", "", avatar.avatarName || avatar.avatarId), userTextElement("small", "", avatar.authorName || avatar.avatarId));
      row.append(friendPortraitElement({ displayName: avatar.avatarName, imageUrl: avatar.imageUrl }, "avatarPortrait"), copy, adminElement("em", "", avatar.releaseStatus || ""));
      return row;
    }, "Избранные аватары не загружены или список пуст.");
    avatarPanel.append(avatarList);
    columns.append(worldPanel, avatarPanel);
    socialSummary.append(columns);
    return;
  }
  if (state.socialTab === "notifications") {
    const notifications = (state.socialCollections.notifications?.rows || []).filter(matches).filter((row) =>
      !state.socialNotificationFilter || /group.*event|event.*group/iu.test(row.type));
    const panel = socialPanel("Ваш аккаунт", "Уведомления VRChat", String(notifications.length));
    const list = adminElement("div", "socialList");
    renderVirtualSocialRows(list, notifications, (notification) => {
      const row = adminElement(notification.senderUserId ? "button" : "div", "socialRow socialEventRow");
      if (notification.senderUserId) {
        row.type = "button";
        row.dataset.socialProfile = notification.senderUserId;
      }
      const copy = adminElement("span");
      copy.append(userTextElement("strong", "", notification.senderUsername || notification.type), userTextElement("small", "", notification.message || notification.type));
      row.append(copy, adminElement("em", "", adminDate(notification.createdAt)));
      if (!notification.seen) row.classList.add("unread");
      return row;
    }, "Уведомлений VRChat нет.");
    panel.append(list);
    socialSummary.append(panel);
    return;
  }
  if (state.socialTab === "prints" || state.socialTab === "inventory") {
    const collection = state.socialCollections[state.socialTab];
    const rows = (collection?.rows || []).filter(matches).filter((row) => state.socialTab !== "inventory" || !state.socialInventoryType || row.itemType === state.socialInventoryType);
    const panel = socialPanel("Ваш аккаунт · только чтение", state.socialTab === "prints" ? "Prints" : "Инвентарь", `${rows.length}${collection?.truncated ? "+" : ""}`);
    if (collection?.truncated) panel.append(adminElement("p", "socialWarning", "Поиск работает по первым 100 загруженным предметам. Остальные не скрыты и не удалены."));
    const list = adminElement("div", "socialList");
    renderVirtualSocialRows(list, rows, (item) => {
      const row = adminElement("div", "socialRow");
      const copy = adminElement("span");
      copy.append(userTextElement("strong", "", item.name), userTextElement("small", "", item.worldName || item.description || item.id));
      row.title = [item.id, item.itemType, item.equipSlot, item.description].filter(Boolean).join("\n");
      row.append(copy, userTextElement("em", "", item.itemType || adminDate(item.createdAt)));
      return row;
    }, "Данные пока не загружены или список пуст.");
    panel.append(list); socialSummary.append(panel); return;
  }
  const columns = adminElement("div", "socialColumns");
  const friendPanel = socialPanel("VRChat", "Друзья", `${friends.length}${state.social.truncatedFriends ? "+" : ""}`);
  const friendList = adminElement("div", "socialList");
  renderVirtualSocialRows(friendList, sortedFriends, (friend) => socialFriendRow(friend, favoriteIds), "Список друзей пуст или недоступен.");
  friendPanel.append(friendList);
  const groupPanel = socialPanel("Публичные данные", "Группы", String(groups.length));
  const groupList = adminElement("div", "socialList");
  renderVirtualSocialRows(groupList, groups, socialGroupRow, "Публичные группы не найдены.");
  groupPanel.append(groupList);
  columns.append(friendPanel, groupPanel);
  socialSummary.append(columns);
}

function socialPanel(eyebrow, title, count = "") {
  const panel = adminElement("article", "panel socialPanel");
  const header = adminElement("header");
  const copy = adminElement("div");
  copy.append(adminElement("span", "eyebrow", eyebrow), adminElement("h2", "", title));
  header.append(copy, adminElement("span", "", count));
  panel.append(header);
  return panel;
}

function renderVirtualSocialRows(container, rows, createRow, emptyText) {
  const items = Array.isArray(rows) ? rows : [];
  const render = (force = false) => renderVirtualRows(container, items, 58, createRow, emptyText, force);
  container.addEventListener("scroll", () => render(), { passive: true });
  render(true);
  requestAnimationFrame(() => render(true));
}

function socialFriendRow(friend, favoriteIds = new Set()) {
  const row = adminElement("button", "socialRow");
  row.type = "button";
  row.dataset.socialProfile = friend.userId;
  const copy = adminElement("span");
  const title = favoriteIds.has(friend.userId) ? `★ ${friend.displayName || friend.userId}` : (friend.displayName || friend.userId);
  const location = socialFriendOnline(friend) && friend.worldId ? friend.worldId : "";
  copy.append(userTextElement("strong", "", title), userTextElement("small", "", friend.statusDescription || location || friend.platform || friend.userId));
  const portrait = friendPortraitElement(friend);
  const online = socialFriendOnline(friend);
  const badge = adminElement("em", "", online ? (friend.status || "онлайн") : "офлайн");
  badge.dataset.online = String(Boolean(online));
  row.append(portrait, copy, badge);
  return row;
}

function socialFriendOnline(friend) {
  return typeof friend?.online === "boolean" ? friend.online : Boolean(friend?.status && friend.status !== "offline");
}

function socialLocationLabel(location, friend = null) {
  const value = String(location || "").trim();
  if (!value || value === "private") return "Приватная локация";
  if (value === "traveling") return "Переходит между мирами";
  if (value === "offline") return "Не в сети";
  const worldId = String(friend?.worldId || value.match(/wrld_[0-9a-f-]+/iu)?.[0] || "");
  if (!worldId) return value;
  const shortId = worldId.replace(/^wrld_/iu, "").slice(0, 8);
  return `Мир · ${shortId}${worldId.length > 13 ? "…" : ""}`;
}

function socialProfileLocation(profile, friend = null, local = null) {
  const raw = String(profile?.location || friend?.location || "").trim();
  if (!raw) {
    return { title: i18n?.language?.() === "en" ? "Unavailable" : "недоступна", detail: "", raw };
  }
  if (["private", "traveling", "offline"].includes(raw)) {
    return { title: socialLocationLabel(raw, friend), detail: "", raw };
  }
  const worldId = String(profile?.worldId || friend?.worldId || raw.match(/wrld_[0-9a-f-]+/iu)?.[0] || "");
  const localWorld = (local?.worlds || []).find((world) => world?.world_id === worldId || world?.world_key === worldId);
  const currentWorld = state.currentVrchatInstance?.worldId === worldId ? state.currentVrchatInstance : null;
  const english = i18n?.language?.() === "en";
  const title = String(profile?.worldName || friend?.worldName || localWorld?.world_name || currentWorld?.worldName || "").trim()
    || (worldId ? (english ? "VRChat world" : "Мир VRChat") : socialLocationLabel(raw, friend));
  const context = [];
  const groupAccess = raw.match(/~groupAccessType\(([^)]+)\)/iu)?.[1]?.toLowerCase();
  if (groupAccess === "public") context.push(english ? "group public" : "групповой публичный");
  else if (groupAccess === "plus") context.push(english ? "group+" : "групповой+");
  else if (groupAccess === "members") context.push(english ? "group members" : "для участников группы");
  else if (/~group\(/iu.test(raw)) context.push(english ? "group instance" : "групповой инстанс");
  else if (/~hidden\(/iu.test(raw)) context.push("Friends+");
  else if (/~friends\(/iu.test(raw)) context.push(english ? "friends only" : "только друзья");
  else if (/~private\(/iu.test(raw)) context.push(english ? "invite only" : "по приглашению");
  else if (worldId) context.push(english ? "public instance" : "публичный инстанс");
  const region = raw.match(/~region\(([^)]+)\)/iu)?.[1]?.trim().toUpperCase();
  if (region) context.push(region);
  return { title, detail: context.join(" · "), raw };
}

function socialGroupRow(group) {
  const row = adminElement("button", "socialRow");
  row.type = "button";
  row.dataset.socialGroup = group.groupId;
  const copy = adminElement("span");
  copy.append(userTextElement("strong", "", group.name || group.groupId), userTextElement("small", "", group.shortCode || group.groupId));
  row.append(friendPortraitElement({ displayName: group.name, imageUrl: group.iconUrl || group.bannerUrl }, "groupPortrait"), copy, adminElement("em", "", group.isRepresenting ? "представляется" : (group.memberCount == null ? "" : `${group.memberCount} участников`)));
  return row;
}

function resetSocialAccount() {
  state.socialGeneration += 1;
  state.social = null;
  state.socialCollections = {};
  state.socialEvents = [];
  state.socialPreferences = [];
  state.socialLoading = false;
  state.socialError = "";
  socialDetailDialog?.close();
  socialDetailBody?.replaceChildren();
}

async function refreshSocial(force = false) {
  if (!api.getVrchatSocialSummary) return;
  const generation = state.socialGeneration;
  state.socialLoading = true;
  state.socialError = "";
  renderSocial();
  try {
    const [social, events, preferences] = await Promise.all([
      api.getVrchatSocialSummary(force),
      api.listLocalSocialEvents ? api.listLocalSocialEvents(500).catch(() => []) : [],
      api.listLocalWatchedPlayers ? api.listLocalWatchedPlayers().catch(() => []) : []
    ]);
    if (generation !== state.socialGeneration) return;
    if (state.social?.user?.userId && state.social.user.userId !== social?.user?.userId) state.socialCollections = {};
    state.social = social;
    state.socialEvents = events || [];
    state.socialPreferences = preferences || [];
  } catch (error) {
    if (generation === state.socialGeneration) state.socialError = formatVrchatAuthError(error);
  } finally {
    if (generation === state.socialGeneration) { state.socialLoading = false; renderSocial(); }
  }
  if (generation !== state.socialGeneration) return;
  if (["vrchat-favorites", "notifications", "prints", "inventory"].includes(state.socialTab) && state.social) await loadSocialCollection(state.socialTab, force);
}

async function loadSocialCollection(tab, force = false) {
  if (!api.getVrchatPersonalCollection) return;
  const generation = state.socialGeneration;
  const kinds = tab === "vrchat-favorites" ? ["favorite-worlds", "favorite-avatars"] : ["notifications", "prints", "inventory"].includes(tab) ? [tab] : [];
  if (!kinds.length) return;
  state.socialLoading = true;
  state.socialError = "";
  renderSocial();
  const results = await Promise.allSettled(kinds.map((kind) => api.getVrchatPersonalCollection(kind, force)));
  if (generation !== state.socialGeneration) return;
  for (let index = 0; index < kinds.length; index += 1) {
    if (results[index].status === "fulfilled") state.socialCollections[kinds[index]] = results[index].value;
    else { delete state.socialCollections[kinds[index]]; state.socialError = formatVrchatAuthError(results[index].reason); }
  }
  state.socialLoading = false;
  renderSocial();
}

function socialAvatarHistory(userId, profile = null) {
  const rows = [];
  const seen = new Set();
  const add = ({ avatarId = "", imageUrl = "", occurredAt = "", current = false } = {}) => {
    const confirmedId = AVATAR_ID_RE.test(String(avatarId || "").trim()) ? String(avatarId).trim() : "";
    const safeImageUrl = /^https:\/\/api\.vrchat\.cloud\//iu.test(String(imageUrl || "").trim()) ? String(imageUrl).trim() : "";
    const key = confirmedId || safeImageUrl;
    if (!key || seen.has(key)) return;
    seen.add(key);
    rows.push({ avatarId: confirmedId, imageUrl: safeImageUrl, occurredAt, current });
  };
  add({ avatarId: profile?.avatarId, imageUrl: profile?.avatarImageUrl, occurredAt: profile?.lastActivity, current: true });
  for (const event of state.socialEvents) {
    if (event?.event_type !== "avatar" || event?.user_id !== userId) continue;
    const value = String(event.current_value || "").trim();
    add({
      avatarId: AVATAR_ID_RE.test(value) ? value : "",
      imageUrl: value,
      occurredAt: event.occurred_at
    });
  }
  return rows.slice(0, 20);
}

async function openSocialProfile(userId) {
  if (!socialDetailDialog || !api.getVrchatUserProfile) return;
  const generation = state.socialGeneration;
  const friend = state.social?.friends?.find((row) => row.userId === userId);
  socialDetailTitle.textContent = friend?.displayName || userId;
  socialDetailBody.replaceChildren(emptyMessage("Загружаем профиль и локальную историю…"));
  if (!socialDetailDialog.open) socialDetailDialog.showModal();
  const [profileResult, localResult] = await Promise.allSettled([
    api.getVrchatUserProfile(userId),
    api.getCompanionDetails ? api.getCompanionDetails("player", userId) : Promise.resolve(null)
  ]);
  if (generation !== state.socialGeneration || !socialDetailDialog.open) return;
  const profile = profileResult.status === "fulfilled" ? profileResult.value : null;
  const local = localResult.status === "fulfilled" ? localResult.value : null;
  if (!profile && !local && !friend) {
    socialDetailBody.replaceChildren(emptyMessage(formatVrchatAuthError(profileResult.reason || "Профиль недоступен")));
    return;
  }
  socialDetailTitle.textContent = profile?.displayName || local?.entity?.display_name || friend?.displayName || userId;
  const content = adminElement("div", "socialProfileContent");
  const identity = adminElement("section", "socialIdentityHero");
  const identityCopy = adminElement("div");
  identityCopy.append(
    userTextElement("strong", "", profile?.displayName || friend?.displayName || local?.entity?.display_name || userId),
    userTextElement("small", "", profile?.statusDescription || profile?.status || friend?.statusDescription || userId)
  );
  identity.append(friendPortraitElement({ ...friend, ...profile, displayName: profile?.displayName || friend?.displayName || userId }, "detailPortrait"), identityCopy);
  content.append(identity);
  const actions = adminElement("div", "socialDetailActions");
  const avatarHistory = socialAvatarHistory(userId, profile);
  const site = adminElement("button", "", "Профиль VRChat");
  site.type = "button";
  site.dataset.socialExternalProfile = userId;
  actions.append(site);
  const avatarsButton = adminElement("button", "", `Аватары · ${avatarHistory.length}`);
  avatarsButton.type = "button";
  avatarsButton.dataset.socialAvatarToggle = userId;
  actions.append(avatarsButton);
  if (profile?.worldId) {
    const launch = adminElement("button", "primaryButton", "Запустить текущий мир");
    launch.type = "button";
    launch.dataset.worldLaunch = profile.worldId;
    actions.append(launch);
  }
  const actionMenu = adminElement("details", "socialProfileActionMenu");
  const actionMenuToggle = adminElement("summary", "", "⋯");
  actionMenuToggle.setAttribute("aria-label", "Действия с игроком");
  actionMenuToggle.title = "Действия с игроком";
  const actionMenuPanel = adminElement("div", "socialProfileActionMenuPanel");
  const refreshProfile = adminElement("button", "", "Обновить профиль");
  refreshProfile.type = "button";
  refreshProfile.dataset.socialRefreshProfile = userId;
  const copyUserId = adminElement("button", "", "Скопировать User ID");
  copyUserId.type = "button";
  copyUserId.dataset.socialCopyUser = userId;
  const localCard = adminElement("button", "", "Открыть локальную карточку");
  localCard.type = "button";
  localCard.dataset.socialLocalPlayer = userId;
  const currentLocalStatus = String(local?.entity?.status || "none");
  const watchLocal = adminElement("button", currentLocalStatus === "watch" ? "active" : "", currentLocalStatus === "watch" ? "Снять локальное наблюдение" : "Наблюдать локально");
  watchLocal.type = "button";
  watchLocal.dataset.socialLocalStatus = userId;
  watchLocal.dataset.localStatus = currentLocalStatus === "watch" ? "none" : "watch";
  actionMenuPanel.append(refreshProfile, copyUserId, localCard, watchLocal);
  if (profile?.worldId) {
    const page = adminElement("button", "", "Открыть страницу текущего мира");
    page.type = "button";
    page.dataset.worldPage = profile.worldId;
    actionMenuPanel.append(page);
  }
  if (hasPaidAccess()) {
    const adminTools = adminElement("button", "", "Открыть в Admin Tools");
    adminTools.type = "button";
    adminTools.dataset.socialAdminPlayer = userId;
    actionMenuPanel.append(adminTools);
  }
  if (hasOwnerAccess()) {
    const owner = adminElement("button", "ownerActionButton", "Открыть в Owner");
    owner.type = "button";
    owner.dataset.socialOwnerPlayer = userId;
    actionMenuPanel.append(owner);
  }
  actionMenu.append(actionMenuToggle, actionMenuPanel);
  actions.append(actionMenu);
  content.append(actions);
  const avatarHistorySection = adminElement("section", "socialDetailSection socialAvatarHistory");
  avatarHistorySection.dataset.socialAvatarHistory = userId;
  avatarHistorySection.hidden = true;
  avatarHistorySection.append(adminElement("h3", "", "Аватары игрока"));
  if (!avatarHistory.length) {
    avatarHistorySection.append(emptyMessage("VRChat пока не передал сведения об аватарах этого игрока."));
  } else {
    for (const avatar of avatarHistory) {
      const row = adminElement("article", "socialAvatarHistoryRow");
      const preview = vrchatImageElement(avatar.imageUrl, "socialAvatarHistoryImage");
      const copy = adminElement("div", "socialAvatarHistoryCopy");
      copy.append(
        adminElement("strong", "", avatar.current ? "Текущий аватар" : "Смена аватара"),
        userOrUiElement("small", "", avatar.avatarId, "VRChat передал только изображение — Avatar ID неизвестен"),
        adminElement("time", "", adminDate(avatar.occurredAt))
      );
      if (preview) row.append(preview);
      row.append(copy);
      if (avatar.avatarId) {
        const rowActions = adminElement("div", "socialAvatarHistoryActions");
        const page = adminElement("button", "", "Страница");
        page.type = "button";
        page.dataset.avatarOpen = avatar.avatarId;
        rowActions.append(page);
        if (api.selectVrchatAvatar) {
          const select = adminElement("button", "primaryButton", "Надеть");
          select.type = "button";
          select.dataset.avatarSelect = avatar.avatarId;
          rowActions.append(select);
        }
        row.append(rowActions);
      }
      avatarHistorySection.append(row);
    }
  }
  content.append(avatarHistorySection);
  if (!profile && profileResult.status === "rejected") {
    const warning = adminElement("div", "socialInlineWarning");
    warning.append(
      adminElement("strong", "", "Публичные данные VRChat временно недоступны"),
      adminElement("span", "", formatVrchatAuthError(profileResult.reason || "Профиль недоступен"))
    );
    content.append(warning);
  }
  const metrics = adminElement("div", "companionDetailMetrics socialProfileMetrics");
  const metricRows = [
    ["Состояние", profile?.statusDescription || profile?.status || (friend?.online ? "онлайн" : "офлайн")],
    ["Платформа", profile?.platform || friend?.platform || "—"],
    ["Встреч", String(Number(local?.entity?.session_count) || 0)],
    ["Клонирование", profile?.allowAvatarCopying ? "разрешено" : "не подтверждено"]
  ];
  for (const [label, value] of metricRows) {
    const metric = adminElement("article");
    metric.append(adminElement("span", "", label), userTextElement("strong", "", value));
    metrics.append(metric);
  }
  content.append(metrics);
  const profileColumns = adminElement("div", "socialProfileColumns");
  const primaryColumn = adminElement("div", "socialProfileColumn");
  const secondaryColumn = adminElement("div", "socialProfileColumn");
  profileColumns.append(primaryColumn, secondaryColumn);
  content.append(profileColumns);
  if (profile?.cosmetics && Object.values(profile.cosmetics).some(Boolean)) {
    const cosmetics = adminElement("section", "socialDetailSection");
    cosmetics.append(adminElement("h3", "", "Оформление профиля VRChat"));
    const cosmeticPreview = adminElement("div", "vrchatCosmeticPreview");
    cosmeticPreview.style.setProperty("--profile-button", profile.cosmetics.themeButtonColor || "#4dd4e8");
    cosmeticPreview.style.setProperty("--profile-icon", profile.cosmetics.themeIconColor || "#ffffff");
    cosmeticPreview.style.setProperty("--profile-subtext", profile.cosmetics.themeSubtextColor || "#9eb2c4");
    cosmeticPreview.append(
      adminElement("span", "vrchatCosmeticIcon", profile.cosmetics.iconFrame ? "◎" : "○"),
      userTextElement("strong", "", profile.displayName || friend?.displayName || userId),
      userTextElement("small", "", profile.cosmetics.pronouns || profile.statusDescription || "VRChat profile")
    );
    cosmetics.append(cosmeticPreview);
    const labels = { iconFrame: "Рамка", profileEffect: "Эффект профиля", nameplateEffect: "Эффект имени", backgroundType: "Фон", backgroundTextureId: "Текстура", bannerType: "Баннер", bannerColor: "Цвет баннера", themeId: "Тема", themeButtonColor: "Цвет кнопок", themeIconColor: "Цвет иконок", themeSubtextColor: "Вторичный текст", pronouns: "Местоимения" };
    for (const [key, value] of Object.entries(profile.cosmetics)) {
      if (!value) continue;
      const row = adminElement("div", "cosmeticFact");
      row.append(adminElement("span", "", labels[key] || key), userTextElement("strong", "", value));
      if (/Color$/u.test(key)) {
        const swatch = adminElement("i", "cosmeticSwatch");
        swatch.style.backgroundColor = value;
        row.append(swatch);
      }
      cosmetics.append(row);
    }
    secondaryColumn.append(cosmetics);
  }
  if (profile?.bio) {
    const bio = adminElement("section", "socialDetailSection socialProfileBio");
    bio.append(adminElement("h3", "", "Описание"), userTextElement("p", "", profile.bio));
    primaryColumn.append(bio);
  }
  if (profile?.badges?.length) {
    const badges = adminElement("section", "socialDetailSection socialProfileBadges socialProfileScrollable");
    badges.append(adminElement("h3", "", "Значки профиля"));
    for (const badge of profile.badges) {
      const row = adminElement("div", "socialRule");
      row.append(userTextElement("strong", "", badge.name), userTextElement("p", "", badge.description || ""));
      badges.append(row);
    }
    secondaryColumn.append(badges);
  }
  const location = socialProfileLocation(profile, friend, local);
  const details = adminElement("section", "socialDetailSection socialFacts");
  details.append(adminElement("h3", "", "Доступные данные"));
  for (const [label, value] of [["User ID", userId], ["Последняя активность", adminDate(profile?.lastActivity || friend?.lastActivity)], ["Дата регистрации", profile?.dateJoined || "—"]]) {
    const row = adminElement("div", "socialFact");
    row.append(adminElement("span", "", label), userTextElement("strong", "", value));
    details.append(row);
  }
  const locationRow = adminElement("div", "socialFact");
  const locationValue = adminElement("span", "socialLocationValue");
  locationValue.append(userTextElement("strong", "", location.title || "недоступна"));
  if (location.detail) locationValue.append(userTextElement("small", "", location.detail));
  if (location.raw) locationValue.title = location.raw;
  locationRow.append(adminElement("span", "", "Мир"), locationValue);
  details.insertBefore(locationRow, details.children[2] || null);
  primaryColumn.append(details);
  if (profile?.groups?.length) {
    const groups = adminElement("section", "socialDetailSection socialProfileGroups");
    const groupList = adminElement("div", "socialList socialProfileVirtualList");
    groups.append(adminElement("h3", "", `Группы · ${profile.groups.length}`), groupList);
    renderVirtualSocialRows(groupList, profile.groups, socialGroupRow, "Группы не найдены.");
    secondaryColumn.append(groups);
  }
  if (profile?.mutualFriends?.length) {
    const mutuals = adminElement("section", "socialDetailSection socialProfileMutuals");
    const mutualList = adminElement("div", "socialList socialProfileVirtualList");
    mutuals.append(adminElement("h3", "", `Общие друзья · ${profile.mutualFriends.length}`), mutualList);
    renderVirtualSocialRows(mutualList, profile.mutualFriends, socialFriendRow, "Общих друзей не найдено.");
    primaryColumn.append(mutuals);
  }
  if (local?.avatars?.length) {
    const avatars = adminElement("section", "socialDetailSection socialProfileAvatars socialProfileScrollable");
    avatars.append(adminElement("h3", "", "Недавно замеченные аватары"));
    for (const avatar of local.avatars.slice(0, 12)) {
      const row = adminElement("button", "socialRow");
      row.type = "button";
      row.dataset.localAvatarKey = avatar.avatar_key;
      const copy = adminElement("span");
      copy.append(userTextElement("strong", "", avatar.avatar_name || avatar.avatar_id || "Аватар"), userOrUiElement("small", "", avatar.avatar_id, "Avatar ID не подтверждён"));
      row.append(copy, adminElement("em", "", adminDate(avatar.last_seen_at)));
      avatars.append(row);
    }
    primaryColumn.append(avatars);
  }
  if (local?.worlds?.length) {
    const worlds = adminElement("section", "socialDetailSection socialProfileWorlds socialProfileScrollable");
    worlds.append(adminElement("h3", "", "Миры из локальной истории"));
    for (const world of local.worlds.slice(0, 12)) {
      const row = adminElement("button", "socialRow");
      row.type = "button";
      row.dataset.localWorldKey = world.world_key;
      const copy = adminElement("span");
      copy.append(userTextElement("strong", "", world.world_name || world.world_id || "Мир"), userOrUiElement("small", "", world.world_id, "World ID не сохранён"));
      row.append(copy, adminElement("em", "", sessionCountText(Number(world.session_count) || 0)));
      worlds.append(row);
    }
    secondaryColumn.append(worlds);
  }
  if (!secondaryColumn.childElementCount) profileColumns.classList.add("single");
  socialDetailBody.replaceChildren(content);
}

async function openSocialGroup(groupId) {
  if (!socialDetailDialog || !api.getVrchatGroup) return;
  const generation = state.socialGeneration;
  const summary = state.social?.groups?.find((row) => row.groupId === groupId);
  socialDetailTitle.textContent = summary?.name || groupId;
  socialDetailBody.replaceChildren(emptyMessage("Загружаем публичные данные группы…"));
  if (!socialDetailDialog.open) socialDetailDialog.showModal();
  try {
    const group = await api.getVrchatGroup(groupId);
    if (generation !== state.socialGeneration || !socialDetailDialog.open) return;
    socialDetailTitle.textContent = group.name || groupId;
    const content = adminElement("div", "socialProfileContent");
    const banner = vrchatImageElement(group.bannerUrl, "socialGroupBanner");
    if (banner) content.append(banner);
    const identity = adminElement("section", "socialIdentityHero socialGroupIdentity");
    const identityCopy = adminElement("div");
    identityCopy.append(userTextElement("strong", "", group.name || groupId), userTextElement("small", "", group.shortCode || group.groupId));
    identity.append(friendPortraitElement({ displayName: group.name, imageUrl: group.iconUrl || group.bannerUrl }, "detailPortrait groupPortrait"), identityCopy);
    content.append(identity);
    const actions = adminElement("div", "socialDetailActions");
    const site = adminElement("button", "primaryButton", "Открыть группу на сайте");
    site.type = "button";
    site.dataset.socialExternalGroup = groupId;
    actions.append(site);
    content.append(actions);
    const metrics = adminElement("div", "companionDetailMetrics socialProfileMetrics");
    for (const [label, value] of [["Код", group.shortCode || "—"], ["Участников", group.memberCount === null ? "—" : String(group.memberCount)], ["Онлайн", group.onlineMemberCount === null ? "—" : String(group.onlineMemberCount)], ["Вступление", group.joinState || "—"]]) {
      const metric = adminElement("article");
      metric.append(adminElement("span", "", label), userTextElement("strong", "", value));
      metrics.append(metric);
    }
    content.append(metrics);
    if (group.description) {
      const description = adminElement("section", "socialDetailSection");
      description.append(adminElement("h3", "", "Описание"), userTextElement("p", "", group.description));
      content.append(description);
    }
    if (group.announcement?.text || group.announcement?.title) {
      const announcement = adminElement("section", "socialDetailSection");
      announcement.append(adminElement("h3", "", group.announcement.title || "Объявление"), userTextElement("p", "", group.announcement.text || ""));
      content.append(announcement);
    }
    if (group.instances?.length) {
      const instances = adminElement("section", "socialDetailSection");
      instances.append(adminElement("h3", "", `Активные инстансы · ${group.instances.length}`));
      for (const instance of group.instances) {
        const row = adminElement(instance.worldId ? "button" : "div", "socialRow");
        if (instance.worldId) {
          row.type = "button";
          row.dataset.socialWorld = instance.worldId;
        }
        const copy = adminElement("span");
        copy.append(userTextElement("strong", "", instance.worldName || instance.worldId || "Инстанс группы"), userTextElement("small", "", instance.location || instance.instanceId || ""));
        row.append(copy, adminElement("em", "", `${Number(instance.memberCount) || 0} онлайн`));
        instances.append(row);
      }
      content.append(instances);
    }
    const events = adminElement("section", "socialDetailSection");
    events.append(adminElement("h3", "", "События группы"));
    const eventSearch = adminElement("input"); eventSearch.type = "search"; eventSearch.placeholder = "Название, категория или ID…";
    const eventList = adminElement("div", "socialList");
    const renderEvents = () => renderVirtualSocialRows(eventList, (group.events || []).filter((event) =>
      [event.title, event.description, event.category, event.id].some((value) => String(value).toLowerCase().includes(eventSearch.value.trim().toLowerCase()))), (event) => {
      const row = adminElement("div", "socialRow"); const copy = adminElement("span");
      copy.append(userTextElement("strong", "", event.title), userTextElement("small", "", event.description || event.category));
      row.title = `${event.id}\n${event.startsAt} — ${event.endsAt}`;
      row.append(copy, userTextElement("em", "", adminDate(event.startsAt))); return row;
    }, group.eventsUnavailable ? "События недоступны для этого аккаунта." : "Событий в загруженном списке нет.");
    eventSearch.addEventListener("input", renderEvents); renderEvents();
    events.append(eventSearch, eventList);
    if (group.eventsTruncated) events.append(adminElement("p", "socialWarning", "Показаны первые 100 событий."));
    content.append(events);
    if (group.rules?.length) {
      const rules = adminElement("section", "socialDetailSection");
      rules.append(adminElement("h3", "", "Правила"));
      for (const rule of group.rules) {
        const row = adminElement("div", "socialRule");
        row.append(userTextElement("strong", "", rule.title || "Правило"), userTextElement("p", "", rule.text || ""));
        rules.append(row);
      }
      content.append(rules);
    }
    socialDetailBody.replaceChildren(content);
  } catch (error) {
    if (generation === state.socialGeneration) socialDetailBody.replaceChildren(emptyMessage(formatVrchatAuthError(error)));
  }
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
  const title = adminElement("div");
  title.append(adminElement("span", "eyebrow", adminDate(selected.startedAt)), userOrUiElement("h2", "", selected.worldName, "Неизвестный мир"), adminElement("p", "", `${formatDuration(selected.endedAt - selected.startedAt)} · ${selected.complete ? "завершена" : "идёт сейчас"}`));
  header.append(title);
  const worldActions = savedWorldActions(selected.worldId);
  if (worldActions) header.append(worldActions);
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
  renderCompanionSearch();

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
    const row = adminElement("div", "insightRow insightWorldRow");
    row.append(userTextElement("strong", "", world.worldName), adminElement("span", "", `Последний раз: ${adminDate(world.lastSeenAt)}`), adminElement("em", "", sessionCountText(world.sessions)));
    const actions = savedWorldActions(world.worldId, true);
    if (actions) row.append(actions);
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
  const exportButton = adminElement("button", "", "Экспорт .txt");
  exportButton.type = "button";
  exportButton.dataset.historyExport = insightSessionKey(session);
  const hideNames = adminElement("label", "checkRow historyPrivacyToggle");
  const hideNamesInput = adminElement("input");
  hideNamesInput.type = "checkbox";
  hideNamesInput.checked = state.historyHideNames;
  hideNamesInput.dataset.historyHideNames = "true";
  hideNames.append(hideNamesInput, adminElement("span", "", "Скрыть имена в отчёте"));
  const headerActions = adminElement("div", "worldActions historyHeaderActions");
  const worldActions = savedWorldActions(session.worldId);
  if (worldActions) headerActions.append(...Array.from(worldActions.children));
  headerActions.append(hideNames, copyButton, exportButton);
  header.append(title, headerActions);
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

function historySessionReport(session) {
  const english = i18n?.language?.() === "en";
  const world = session.worldName || (english ? "Unknown world" : "Неизвестный мир");
  return [
    `${english ? "VRChat history" : "История VRChat"} · ${world}`,
    `${english ? "Started" : "Начало"}: ${adminDate(session.startedAt)}`,
    `${english ? "Duration" : "Длительность"}: ${formatDuration(session.endedAt - session.startedAt)}`,
    `${english ? "State" : "Состояние"}: ${session.complete ? (english ? "completed" : "завершена") : (english ? "in progress" : "в процессе")}`,
    `${english ? "Participants" : "Участники"}: ${session.players.length}`,
    ...session.players.slice(0, 100).map((player, index) => state.historyHideNames
      ? `- ${english ? "Participant" : "Участник"} ${index + 1}`
      : `- ${player.displayName || player.userId} · ${player.userId}`)
  ].join("\n");
}

async function copyHistorySession(sessionKey) {
  const session = state.historyVisibleSessions.find((row) => insightSessionKey(row) === sessionKey);
  if (!session) throw new Error("Сессия не найдена.");
  await api.writeClipboardText(historySessionReport(session));
  setStatus("Сессия из истории скопирована.");
}

async function exportHistorySession(sessionKey) {
  const session = state.historyVisibleSessions.find((row) => insightSessionKey(row) === sessionKey);
  if (!session) throw new Error("Сессия не найдена.");
  const stamp = new Date(session.startedAt || Date.now()).toISOString().slice(0, 10);
  const result = await api.saveTextFile({ suggestedName: `VRChat-session-${stamp}.txt`, text: historySessionReport(session) });
  if (result?.ok) setStatus("Отчёт о сессии сохранён.");
  return result;
}

function normalizedWorldId(value) {
  const worldId = String(value || "").trim();
  return WORLD_ID_RE.test(worldId) ? worldId : "";
}

function savedWorldActions(worldId, compact = false) {
  const safeWorldId = normalizedWorldId(worldId);
  if (!safeWorldId) return null;
  const actions = adminElement("div", `worldActions${compact ? " compact" : ""}`);
  const page = adminElement("button", "", "Страница");
  page.type = "button";
  page.dataset.worldPage = safeWorldId;
  page.title = "Открыть страницу мира на сайте VRChat";
  const launch = adminElement("button", "primaryButton", "Запустить");
  launch.type = "button";
  launch.dataset.worldLaunch = safeWorldId;
  launch.title = "Открыть мир через VRChat Launch";
  actions.append(page, launch);
  return actions;
}

async function openSavedWorld(worldId, launch = false) {
  const safeWorldId = normalizedWorldId(worldId);
  if (!safeWorldId) throw new Error("World ID для этой записи не сохранён.");
  const url = launch
    ? `https://vrchat.com/home/launch?worldId=${safeWorldId}`
    : `https://vrchat.com/home/world/${safeWorldId}`;
  await api.openExternal(url);
  setStatus(launch ? "Открываем мир через VRChat." : "Страница мира открыта.", false, { kind: "success" });
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
  const cacheKey = String(record?.userId || record?.user_id || record?.id || record?.displayName || record?.playerName || "").trim().toLocaleLowerCase("ru-RU");
  if (cacheKey && state.playerActivityCache.has(cacheKey)) return state.playerActivityCache.get(cacheKey);
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
    } else if ((event.type === "avatar-changed" || event.type === "avatar-data") && !event.avatarRedacted && !event.avatarProtected) {
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
  const resolvedAvatars = avatars.map((avatar) => resolveActivityAvatarFromCatalog(avatar, record));
  const activity = { online, joinedAt, leftAt, worldName, avatars: resolvedAvatars, currentAvatar: resolvedAvatars.at(-1) || null };
  if (cacheKey) state.playerActivityCache.set(cacheKey, activity);
  return activity;
}

function resolveActivityAvatarFromCatalog(avatar, record) {
  const existingId = String(avatar?.avatarId || "").trim();
  if (AVATAR_ID_RE.test(existingId)) return { ...avatar, avatarId: existingId, key: avatarModel.idKey(existingId) };
  const avatarName = String(avatar?.avatarName || "").trim();
  if (!avatarName) return avatar;
  const normalizedName = avatarName.toLocaleLowerCase("ru-RU");
  const userId = String(record?.userId || record?.user_id || record?.id || "").trim();
  const matches = [...state.avatarRows, ...state.avatarCatalog]
    .map((row) => ({
      avatarId: String(row?.avatarId || row?.avatar_id || "").trim(),
      avatarName: String(row?.avatarName || row?.avatar_name || "").trim(),
      userId: String(row?.userId || row?.user_id || "").trim()
    }))
    .filter((row) => AVATAR_ID_RE.test(row.avatarId) && row.avatarName.toLocaleLowerCase("ru-RU") === normalizedName);
  const playerMatches = userId ? matches.filter((row) => row.userId === userId) : [];
  const candidates = playerMatches.length ? playerMatches : matches;
  const unique = [...new Map(candidates.map((row) => [row.avatarId, row])).values()];
  if (unique.length !== 1) return avatar;
  return { ...avatar, avatarId: unique[0].avatarId, key: avatarModel.idKey(unique[0].avatarId) };
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
  saveButton.type = "button";
  saveButton.dataset.adminNoteSave = "true";
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
  if (!noteTools.hasEditorChanges(record, payload)) {
    setStatus("Изменений для сохранения нет.", false, { kind: "info" });
    return;
  }
  state.adminNotes = noteTools.mergeSavedNote(state.adminNotes, payload, record);
  state.adminSaving = true;
  state.adminError = "";
  renderAdminList();
  renderAdminCard();
  if (state.builderInspector) renderBuilderInspector();
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
    if (state.builderInspector) renderBuilderInspector();
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
    if (state.uiSettings.notifyMarkedPlayers) {
      const merged = new Map(state.notificationPlayerNotes.map((row) => [row.userId, row]));
      for (const row of state.adminNotes) merged.set(row.userId, row);
      state.notificationPlayerNotes = [...merged.values()];
    }
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
  textarea.title = member.managerNotes || "";
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
      const meta = adminElement("div", "ownerIncidentMeta");
      if (request.keyLabel) meta.append(userTextElement("span", "", `Ответственный: ${request.keyLabel}`));
      if (request.banExpiresAt) meta.append(adminElement("span", "", `Срок: ${adminDate(request.banExpiresAt)}`));
      if (request.evidenceUrl) {
        const evidence = adminElement("button", "", "Открыть доказательство");
        evidence.type = "button";
        evidence.dataset.ownerEvidence = request.evidenceUrl;
        meta.append(evidence);
      }
      if (meta.childElementCount) row.append(meta);
      const appeal = adminElement("div", "ownerAppealEditor");
      const appealStatus = adminElement("select");
      appealStatus.dataset.appealStatus = request.id;
      for (const [value, label] of [["none", "Без апелляции"], ["open", "Апелляция открыта"], ["reviewing", "На рассмотрении"], ["accepted", "Принята"], ["rejected", "Отклонена"]]) {
        const option = adminElement("option", "", label);
        option.value = value;
        option.selected = value === (request.appealStatus || "none");
        appealStatus.append(option);
      }
      const appealNote = adminElement("input");
      appealNote.maxLength = 2000;
      appealNote.placeholder = "Комментарий к апелляции";
      appealNote.value = request.appealNote || "";
      appealNote.dataset.appealNote = request.id;
      const appealSave = adminElement("button", "", "Сохранить апелляцию");
      appealSave.type = "button";
      appealSave.dataset.appealSave = request.id;
      appeal.append(appealStatus, appealNote, appealSave);
      row.append(appeal);
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

function ownerPolicyCandidates() {
  const threshold = Math.min(Math.max(Number(state.ownerPolicyThreshold) || 1, 1), 10);
  const days = Math.min(Math.max(Number(state.ownerPolicyDays) || 1, 1), 365);
  const cutoff = Date.now() - days * 86_400_000;
  const excluded = new Set(String(state.ownerPolicyExcluded || "").match(/usr_[0-9a-z-]+/giu) || []);
  const grouped = new Map();
  for (const request of state.ownerRequests) {
    const occurredAt = new Date(request.completedAt || request.updatedAt || request.createdAt || 0).valueOf();
    if (request.action !== "ban" || !["succeeded", "expired", "revoked"].includes(request.status) || occurredAt < cutoff) continue;
    const userId = String(request.targetUserId || "");
    if (!userId) continue;
    const current = grouped.get(userId) || { userId, displayName: request.targetDisplayName || userId, count: 0, excluded: excluded.has(userId), reasons: [] };
    current.count += 1;
    if (request.reason && current.reasons.length < 3) current.reasons.push(request.reason);
    grouped.set(userId, current);
  }
  return [...grouped.values()].filter((row) => row.count >= threshold).sort((left, right) => right.count - left.count || left.displayName.localeCompare(right.displayName, uiLocale()));
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

  const timelineSection = adminElement("section", "ownerOverviewSection ownerIncidentTimeline");
  timelineSection.append(adminElement("h3", "", "Общая лента инцидентов"));
  const timeline = adminElement("div", "ownerOverviewRequests");
  for (const request of state.ownerRequests.slice(0, 30)) {
    const row = adminElement("article", "ownerRequestRow");
    row.append(
      userTextElement("strong", "", request.targetDisplayName || request.targetUserId || "Игрок"),
      userTextElement("span", "", request.reason || "Причина не указана"),
      adminElement("span", "ownerRequestStatus", `${moderationActionLabel(request)} · ${moderationStatusLabel(request.status)}`),
      adminElement("time", "", adminDate(request.updatedAt || request.createdAt))
    );
    const details = [];
    if (request.keyLabel) details.push(`Ответственный: ${request.keyLabel}`);
    if (request.appealStatus && request.appealStatus !== "none") details.push(`Апелляция: ${request.appealStatus}`);
    if (request.banExpiresAt) details.push(`До: ${adminDate(request.banExpiresAt)}`);
    if (details.length) row.append(userTextElement("small", "", details.join(" · ")));
    timeline.append(row);
  }
  if (!state.ownerRequests.length) timeline.append(emptyMessage("Инцидентов пока нет."));
  timelineSection.append(timeline);
  content.append(timelineSection);

  const policySection = adminElement("section", "ownerOverviewSection ownerPolicySimulator");
  policySection.append(
    adminElement("h3", "", "Проверка правила до включения"),
    adminElement("p", "", "Симуляция ничего не применяет. Она использует только завершённые бан-действия из общей истории команды.")
  );
  const policyControls = adminElement("div", "ownerPolicyControls");
  const threshold = adminElement("input");
  threshold.type = "number";
  threshold.min = "1";
  threshold.max = "10";
  threshold.value = String(state.ownerPolicyThreshold);
  threshold.dataset.ownerPolicyThreshold = "true";
  const days = adminElement("input");
  days.type = "number";
  days.min = "1";
  days.max = "365";
  days.value = String(state.ownerPolicyDays);
  days.dataset.ownerPolicyDays = "true";
  const exclusions = adminElement("input");
  exclusions.placeholder = "Исключения: usr_… через пробел";
  exclusions.value = state.ownerPolicyExcluded;
  exclusions.dataset.ownerPolicyExcluded = "true";
  const thresholdLabel = adminElement("label");
  thresholdLabel.append(adminElement("span", "", "Инцидентов"), threshold);
  const daysLabel = adminElement("label");
  daysLabel.append(adminElement("span", "", "За дней"), days);
  policyControls.append(thresholdLabel, daysLabel, exclusions);
  policySection.append(policyControls);
  const candidates = adminElement("div", "ownerPolicyResults");
  const rows = ownerPolicyCandidates();
  for (const candidate of rows) {
    const row = adminElement("article", `ownerRequestRow${candidate.excluded ? " excluded" : ""}`);
    row.append(
      userTextElement("strong", "", candidate.displayName),
      userTextElement("span", "", candidate.userId),
      adminElement("em", "", candidate.excluded ? "Исключён — действие не применяется" : `${candidate.count} подходящих инцидента`)
    );
    if (candidate.reasons.length) row.append(userTextElement("small", "", candidate.reasons.join(" · ")));
    candidates.append(row);
  }
  if (!rows.length) candidates.append(emptyMessage("По выбранному правилу совпадений нет."));
  policySection.append(candidates);
  content.append(policySection);

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
      actions.append(profile);
      if (hasPaidAccess()) {
        const admin = adminElement("button", "", "Admin");
        admin.type = "button";
        admin.dataset.crashAdmin = candidate.userId;
        admin.dataset.crashName = candidate.playerName || candidate.userId;
        actions.append(admin);
      }
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

async function analyzeLog() {
  const wasRunning = state.running;
  clearMonitoringRestart();
  state.monitoringStopRequested = false;
  state.monitoringTransition = true;
  setStatus("Подготавливаем анализ текущего инстанса…");
  try {
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
  } catch (error) {
    state.monitoringTransition = false;
    if (wasRunning) scheduleMonitoringRestart("анализ был прерван");
    throw error;
  } finally {
    state.monitoringTransition = false;
  }
}

async function analyzeCurrentLogAutomatically() {
  const wasRunning = state.running;
  clearMonitoringRestart();
  state.monitoringStopRequested = false;
  state.monitoringTransition = true;
  setStatus("Анализируем текущий лог…", false, { kind: "info" });
  try {
    const latest = await api.latestFile();
    const filePath = latest?.filePath || "";
    if (!filePath) throw new Error("Текущий лог VRChat не найден.");
    const payload = await api.analyzeCurrentInstance({
      filePath,
      mode: "current",
      maxFiles: 1,
      maxLines: 30000,
      maxBytesPerFile: 4 * 1024 * 1024,
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
    setStatus("Текущий лог проанализирован. Новые события отслеживаются автоматически.", false, { kind: "success" });
  } catch (error) {
    state.monitoringTransition = false;
    if (wasRunning) scheduleMonitoringRestart("анализ текущего лога был прерван");
    throw error;
  } finally {
    state.monitoringTransition = false;
  }
}

function buildSessionSnapshot() {
  const stats = sessionStats();
  const onlinePlayers = stats.players.filter((player) => player.online).slice(0, 25);
  const english = i18n?.language?.() === "en";
  return [
    "**VRChat Admin Snapshot · 2.0**",
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
  clearMonitoringRestart();
  state.monitoringStopRequested = false;
  state.monitoringTransition = true;
  const stats = sessionStats();
  let payload;
  try {
    payload = await api.startTail({ filePath: state.filePath, fromStart: false, worldName: stats.world === "—" ? "" : stats.world, deferPlaySession: true });
  } finally {
    state.monitoringTransition = false;
  }
  if (state.playSessionSyncTimer) window.clearTimeout(state.playSessionSyncTimer);
  state.playSessionSyncTimer = 0;
  state.running = true;
  state.currentPlaySessionId = String(payload?.playSessionId || "");
  state.playSessionLastSyncAt = 0;
  state.startedAt = Date.now();
  state.stoppedAt = null;
  state.events = [];
  invalidateSessionData({ avatars: true });
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
  clearMonitoringRestart();
  state.monitoringStopRequested = true;
  state.monitoringTransition = true;
  if (state.playSessionSyncTimer) window.clearTimeout(state.playSessionSyncTimer);
  state.playSessionSyncTimer = 0;
  if (state.playSessionSyncPromise) await state.playSessionSyncPromise;
  try {
    await api.stopTail(currentPlaySessionStats());
  } finally {
    state.monitoringTransition = false;
  }
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

function clearMonitoringRestart() {
  if (state.monitoringRestartTimer) window.clearTimeout(state.monitoringRestartTimer);
  state.monitoringRestartTimer = 0;
}

function scheduleMonitoringRestart(reason = "мониторинг остановился") {
  if (!state.uiSettings.protectMonitoring || state.monitoringStopRequested || state.monitoringTransition || state.monitoringRestartTimer) return;
  state.monitoringRestartAttempt += 1;
  const attempt = state.monitoringRestartAttempt;
  const delay = Math.min(30_000, 1000 * (2 ** Math.min(attempt - 1, 5)));
  setStatus(`Мониторинг прерван: ${reason}. Восстанавливаем…`, false, { kind: "warning", sticky: true });
  state.monitoringRestartTimer = window.setTimeout(() => {
    state.monitoringRestartTimer = 0;
    void restartMonitoringAfterFailure();
  }, delay);
}

async function restartMonitoringAfterFailure() {
  if (!state.uiSettings.protectMonitoring || state.monitoringStopRequested || state.monitoringTransition) return;
  state.monitoringTransition = true;
  try {
    const stats = sessionStats();
    const payload = await api.startTail({
      filePath: state.filePath,
      fromStart: false,
      worldName: stats.world === "—" ? "" : stats.world,
      deferPlaySession: true
    });
    if (payload?.filePath) setFilePath(payload.filePath);
    state.running = true;
    state.stoppedAt = null;
    state.monitoringRestartAttempt = 0;
    document.querySelector('[data-action="start"]').disabled = true;
    document.querySelector('[data-action="stop"]').disabled = false;
    setStatus("Мониторинг автоматически восстановлен.", false, { kind: "success" });
  } catch (error) {
    state.running = false;
    state.monitoringTransition = false;
    scheduleMonitoringRestart(error?.message || "повторный запуск не удался");
    return;
  }
  state.monitoringTransition = false;
}

const VRCHAT_TWO_FACTOR_LABELS = Object.freeze({
  totp: "Код из приложения-аутентификатора",
  emailOtp: "Код из письма",
  otp: "Recovery-код"
});

function setVrchatAccountStatus(panel, message, error = false) {
  const status = panel?.querySelector("[data-vrchat-account-status]");
  if (!status) return;
  status.textContent = t(message);
  status.classList.toggle("error", Boolean(error));
}

function hideVrchatTwoFactor(panel) {
  const container = panel?.querySelector("[data-vrchat-two-factor]");
  if (container) container.hidden = true;
  const code = panel?.querySelector("[data-vrchat-two-factor-code]");
  if (code) code.value = "";
}

function showVrchatTwoFactor(panel, methods) {
  const container = panel?.querySelector("[data-vrchat-two-factor]");
  const select = panel?.querySelector("[data-vrchat-two-factor-method]");
  const code = panel?.querySelector("[data-vrchat-two-factor-code]");
  if (!container || !select) return;
  const available = [...new Set((Array.isArray(methods) ? methods : []).filter((method) => VRCHAT_TWO_FACTOR_LABELS[method]))];
  if (available.includes("totp") && !available.includes("otp")) available.push("otp");
  select.replaceChildren(...available.map((method) => {
    const option = document.createElement("option");
    option.value = method;
    option.textContent = t(VRCHAT_TWO_FACTOR_LABELS[method]);
    return option;
  }));
  container.hidden = false;
  code?.focus();
}

async function finishVrchatAccountLogin(panel, result) {
  state.settings = await api.getSettings();
  state.currentVrchatUser = result?.user || state.currentVrchatUser;
  state.currentVrchatInstance = null;
  resetSocialAccount();
  setStoredCookieState(Boolean(state.settings?.hasVrchatAuthCookie));
  hideVrchatTwoFactor(panel);
  setVrchatAccountStatus(panel, `Выполнен вход в VRChat: ${result?.user?.displayName || result?.user?.userId || "аккаунт подключён"}.`);
  setStatus("Аккаунт VRChat подключён.", false, { kind: "success" });
  if (state.view === "social") void refreshSocial(true);
}

function bindVrchatAccountPanel(panel) {
  const username = panel.querySelector("[data-vrchat-username]");
  const password = panel.querySelector("[data-vrchat-password]");
  const login = panel.querySelector("[data-vrchat-login]");
  const verify = panel.querySelector("[data-vrchat-verify]");
  const cancel = panel.querySelector("[data-vrchat-login-cancel]");
  const disconnect = panel.querySelector("[data-vrchat-disconnect]");
  const code = panel.querySelector("[data-vrchat-two-factor-code]");

  login?.addEventListener("click", () => {
    runButtonOperation(login, async () => {
      const status = panel.querySelector("[data-vrchat-account-status]");
      if (status) status.dataset.busy = "true";
      setVrchatAccountStatus(panel, "Входим в аккаунт VRChat…");
      try {
        const result = await api.loginVrchatAccount({ username: username?.value || "", password: password?.value || "" });
        if (password) password.value = "";
        if (result?.authenticated) await finishVrchatAccountLogin(panel, result);
        else {
          showVrchatTwoFactor(panel, result?.requiresTwoFactorAuth);
          setVrchatAccountStatus(panel, "VRChat запросил подтверждение входа.");
        }
      } catch (error) {
        if (password) password.value = "";
        setVrchatAccountStatus(panel, formatVrchatAuthError(error), true);
      } finally {
        if (status) delete status.dataset.busy;
      }
    }, "Входим…");
  });

  verify?.addEventListener("click", () => {
    runButtonOperation(verify, async () => {
      const status = panel.querySelector("[data-vrchat-account-status]");
      if (status) status.dataset.busy = "true";
      setVrchatAccountStatus(panel, "Проверяем код…");
      try {
        const result = await api.verifyVrchatAccount({
          method: panel.querySelector("[data-vrchat-two-factor-method]")?.value || "",
          code: code?.value || ""
        });
        await finishVrchatAccountLogin(panel, result);
      } catch (error) {
        setVrchatAccountStatus(panel, formatVrchatAuthError(error), true);
        code?.select();
      } finally {
        if (status) delete status.dataset.busy;
      }
    }, "Проверяем…");
  });

  cancel?.addEventListener("click", async () => {
    await api.cancelVrchatAccountLogin();
    hideVrchatTwoFactor(panel);
    setVrchatAccountStatus(panel, "Подтверждение входа отменено.");
  });

  disconnect?.addEventListener("click", () => {
    runButtonOperation(disconnect, async () => {
      await api.disconnectVrchatAccount();
      if (state.settings) state.settings.hasVrchatAuthCookie = false;
      state.currentVrchatUser = null;
      state.currentVrchatInstance = null;
      resetSocialAccount();
      setStoredCookieState(false);
      hideVrchatTwoFactor(panel);
      setVrchatAccountStatus(panel, "Аккаунт VRChat отключён на этом устройстве.");
      setStatus("Аккаунт VRChat отключён.");
      if (state.view === "social") renderSocial();
    }, "Отключаем…").catch((error) => setVrchatAccountStatus(panel, formatVrchatAuthError(error), true));
  });

  panel.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    if (event.target === code) {
      event.preventDefault();
      verify?.click();
    } else if (event.target === username || event.target === password) {
      event.preventDefault();
      login?.click();
    }
  });
}

document.querySelectorAll("[data-vrchat-account-connect]").forEach(bindVrchatAccountPanel);

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

continueFreeButton?.addEventListener("click", async () => {
  continueFreeButton.disabled = true;
  setActivationStatus("Запускаем бесплатный локальный режим…");
  try {
    await api.continueFree();
    state.settings = await api.getSettings();
    await showApp();
  } catch (error) {
    setActivationStatus(error?.message || "Не удалось запустить бесплатный режим.", true);
  } finally {
    continueFreeButton.disabled = false;
  }
});

vrchatAuthCookieInput?.addEventListener("input", () => {
  vrchatAuthCookieInput.dataset.dirty = "true";
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
  if (!state.uiSettings.protectMonitoring) {
    clearMonitoringRestart();
    state.monitoringRestartAttempt = 0;
  }
  const cookieInput = settingsForm.elements.vrchatAuthCookie;
  if (cookieInput?.dataset.dirty === "true") {
    void api.saveSettings({ serverUrl: state.settings?.serverUrl, vrchatAuthCookie: cookieInput.value })
      .then((saved) => { resetSocialAccount(); if (state.settings) state.settings.hasVrchatAuthCookie = Boolean(saved?.hasVrchatAuthCookie); })
      .catch((error) => setStatus(formatVrchatAuthError(error), true));
  }
  if (!state.uiSettings.rememberSelection) localStorage.removeItem("betaRememberedSelections");
  state.sessionPlayerMode = state.uiSettings.sessionPlayerMode;
  localStorage.setItem("betaSessionPlayerMode", state.sessionPlayerMode);
  if (state.events.length > state.uiSettings.eventLimit) {
    state.events.splice(0, state.events.length - state.uiSettings.eventLimit);
    invalidateSessionData({ avatars: true });
  }
  applyUiSettings({ persist: true });
  if (state.uiSettings.language !== previousLanguage) {
    window.location.reload();
    return;
  }
  renderSession();
  closeSettings();
  setStatus("Настройки сохранены.");
  void syncNotificationMonitoring({ refreshNow: true, announceError: true });
});

settingsForm?.querySelector("[data-local-retention]")?.addEventListener("change", (event) => {
  const days = Number(event.currentTarget.value) || 0;
  api.setLocalRetention(days)
    .then((result) => {
      setStatus(result.removed ? `Удалено старых сессий: ${result.removed}.` : "Срок хранения сохранён.");
      void refreshLocalStorageSettings();
      if (["players", "worlds", "local-avatars"].includes(state.view)) void refreshLocalDirectory();
    })
    .catch((error) => setStatus(error.message || "Не удалось изменить срок хранения.", true));
});

settingsForm?.elements.vrchatAuthCookie?.addEventListener("input", (event) => {
  event.currentTarget.dataset.dirty = "true";
});

settingsForm?.querySelector("[data-settings-check-vrchat]")?.addEventListener("click", (event) => {
  runButtonOperation(event.currentTarget, async () => {
    const input = settingsForm.elements.vrchatAuthCookie;
    const saved = await api.saveSettings({
      serverUrl: state.settings?.serverUrl,
      vrchatAuthCookie: input.dataset.dirty === "true" ? input.value : undefined
    });
    if (state.settings) state.settings.hasVrchatAuthCookie = Boolean(saved?.hasVrchatAuthCookie);
    resetSocialAccount();
    const user = await api.getVrchatCurrentUser();
    input.value = "";
    input.dataset.dirty = "false";
    input.placeholder = "Cookie сохранён безопасно";
    setStatus(`VRChat аккаунт: ${user.displayName || user.userId}.`);
  }, "Проверяем…").catch((error) => setStatus(formatVrchatAuthError(error), true));
});

settingsForm?.querySelector("[data-settings-remove-vrchat]")?.addEventListener("click", (event) => {
  runButtonOperation(event.currentTarget, async () => {
    await api.saveSettings({ serverUrl: state.settings?.serverUrl, vrchatAuthCookie: "" });
    if (state.settings) state.settings.hasVrchatAuthCookie = false;
    const input = settingsForm.elements.vrchatAuthCookie;
    input.value = "";
    input.dataset.dirty = "false";
    input.placeholder = "auth=...";
    resetSocialAccount();
    setStatus("VRChat cookie удалён с этого устройства.");
  }, "Удаляем…").catch((error) => setStatus(error.message || "Не удалось удалить cookie.", true));
});

settingsForm?.querySelector("[data-local-export]")?.addEventListener("click", (event) => {
  runButtonOperation(event.currentTarget, () => api.exportLocalData(exportableUiSettings()), "Экспортируем…")
    .then((result) => { if (result?.ok) setStatus("Локальная резервная копия сохранена."); })
    .catch((error) => setStatus(error.message || "Не удалось экспортировать данные.", true));
});

settingsForm?.querySelector("[data-local-import]")?.addEventListener("click", (event) => {
  runButtonOperation(event.currentTarget, async () => {
    const result = await api.importLocalData();
    if (!result?.ok) return result;
    applyImportedUiSettings(result.uiSettings);
    await refreshLocalStorageSettings();
    await refreshInsights();
    if (["players", "worlds", "local-avatars"].includes(state.view)) await refreshLocalDirectory();
    setStatus(`Импортировано сессий: ${result.importedSessions}.`);
    return result;
  }, "Импортируем…").catch((error) => setStatus(error.message || "Не удалось импортировать данные.", true));
});

settingsForm?.querySelectorAll("[data-local-clear]").forEach((button) => {
  button.addEventListener("click", () => {
    const category = button.dataset.localClear;
    const labels = { history: "историю сессий", social: "ленту и список друзей", preferences: "локальные заметки и избранное", all: "все локальные данные" };
    if (!window.confirm(t(`Удалить ${labels[category] || "выбранные данные"}? Перед очисткой можно сделать экспорт.`))) return;
    runButtonOperation(button, async () => {
      const result = await api.clearLocalDataCategory(category);
      await refreshLocalStorageSettings();
      if (category === "history" || category === "all") {
        state.historySessions = [];
        state.historySelectedKey = "";
        renderHistory(true);
        await refreshInsights();
      }
      if (category === "social" || category === "all") {
        state.socialEvents = [];
        renderFriendActivityFeed();
      }
      if (["history", "preferences", "all"].includes(category) && ["players", "worlds", "local-avatars"].includes(state.view)) await refreshLocalDirectory();
      setStatus("Выбранные локальные данные удалены.");
      return result;
    }, "Очищаем…").catch((error) => setStatus(error.message || "Не удалось очистить данные.", true));
  });
});

document.addEventListener("submit", (event) => {
  const localPlayerForm = event.target.closest("[data-local-player-preference]");
  if (localPlayerForm) {
    event.preventDefault();
    const submit = localPlayerForm.querySelector('button[type="submit"]');
    runButtonOperation(submit, async () => {
      state.directoryDetails.player = await api.saveLocalPlayerPreference({
        userId: localPlayerForm.dataset.localPlayerPreference,
        alias: localPlayerForm.elements.alias.value,
        note: localPlayerForm.elements.note.value,
        status: localPlayerForm.elements.status.value
      });
      await refreshLocalDirectory("players");
      if (state.uiSettings.notifyMarkedPlayers) await refreshNotificationReferences();
      setStatus("Личная карточка игрока сохранена.");
    }, "Сохраняем…").catch((error) => setStatus(error.message || "Не удалось сохранить личную карточку.", true));
    return;
  }
  const localWorldForm = event.target.closest("[data-local-world-preference]");
  if (localWorldForm) {
    event.preventDefault();
    const submit = localWorldForm.querySelector('button[type="submit"]');
    runButtonOperation(submit, async () => {
      state.directoryDetails.world = await api.saveLocalWorldPreference({
        worldKey: localWorldForm.dataset.localWorldPreference,
        favorite: localWorldForm.elements.favorite.checked,
        note: localWorldForm.elements.note.value
      });
      await refreshLocalDirectory("worlds");
      setStatus("Мир сохранён в локальном каталоге.");
    }, "Сохраняем…").catch((error) => setStatus(error.message || "Не удалось сохранить мир.", true));
    return;
  }
  const avatarForm = event.target.closest("[data-avatar-note-form]");
  if (avatarForm) {
    event.preventDefault();
    saveAvatarNote(avatarForm).catch((error) => setStatus(error.message || "Не удалось сохранить заметку об аватаре.", true));
    return;
  }
  const form = event.target.closest("[data-player-note-form]");
  if (!form) return;
  event.preventDefault();
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
  playRose337SelectionSound(event.target);
  const gameModeButton = event.target.closest("[data-game-mode]");
  if (gameModeButton) {
    if (hasPaidAccess()) void startMiniGame(gameModeButton.dataset.gameMode);
    return;
  }
  const gameAnswerButton = event.target.closest("[data-game-answer]");
  if (gameAnswerButton) {
    answerMiniGame(gameAnswerButton.dataset.gameAnswer);
    return;
  }
  if (event.target.closest("[data-game-next]")) {
    nextMiniGame();
    return;
  }
  const adminNoteSave = event.target.closest("[data-admin-note-save]");
  if (adminNoteSave) {
    const form = adminNoteSave.closest("[data-player-note-form]");
    if (!form) return;
    saveAdminNote(form).catch((error) => {
      state.adminError = error.message || "Не удалось сохранить заметку.";
      setStatus(state.adminError, true);
      renderAdminCard();
      if (state.builderInspector) renderBuilderInspector();
    });
    return;
  }
  if (state.builderCompactMenuOpen && !event.target.closest("[data-compact-menu]")) {
    state.builderCompactMenuOpen = false;
    syncBuilderControls();
  }
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
    state.builderCompactMenuOpen = false;
    syncBuilderControls();
    openSettings();
    return;
  }

  if (event.target.closest("[data-vrchat-account-open]")) {
    openVrchatAuth();
    return;
  }

  if (event.target.closest("[data-vrchat-auth-close]")) {
    closeVrchatAuth();
    return;
  }

  if (event.target.closest("[data-compact-menu-toggle]")) {
    dismissBuilderCompactHint();
    state.builderCompactMenuOpen = !state.builderCompactMenuOpen;
    syncBuilderControls();
    return;
  }

  if (event.target.closest("[data-compact-return-builder]")) {
    state.builderCompactMenuOpen = false;
    selectView("builder");
    syncBuilderControls();
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

  const libraryTab = event.target.closest("[data-library-tab]")?.dataset.libraryTab;
  if (libraryTab) {
    selectLibraryTab(libraryTab);
    return;
  }

  const workspaceModeButton = event.target.closest("[data-workspace-mode]");
  if (workspaceModeButton) {
    switchWorkspaceMode(workspaceModeButton.dataset.workspaceMode);
    return;
  }

  if (event.target.closest("[data-social-refresh]")) {
    void refreshSocial(true);
    return;
  }

  if (event.target.closest("[data-friend-activity-refresh]")) {
    void refreshFriendActivity(true);
    return;
  }

  const socialTab = event.target.closest("[data-social-tab]")?.dataset.socialTab;
  if (socialTab && ["overview", "locations", "favorites", "journal", "groups", "vrchat-favorites", "notifications", "prints", "inventory"].includes(socialTab)) {
    state.socialTab = socialTab;
    localStorage.setItem("betaSocialTab", socialTab);
    renderSocial();
    if (["vrchat-favorites", "notifications", "prints", "inventory"].includes(socialTab) && !state.socialLoading) void loadSocialCollection(socialTab);
    return;
  }

  if (event.target.closest("[data-social-detail-close]")) {
    socialDetailDialog?.close();
    return;
  }

  const refreshSocialProfile = event.target.closest("[data-social-refresh-profile]")?.dataset.socialRefreshProfile;
  if (refreshSocialProfile) {
    void openSocialProfile(refreshSocialProfile).catch((error) => setStatus(formatVrchatAuthError(error), true));
    return;
  }

  const copySocialUserButton = event.target.closest("[data-social-copy-user]");
  if (copySocialUserButton) {
    runButtonOperation(copySocialUserButton, async () => {
      await api.writeClipboardText(copySocialUserButton.dataset.socialCopyUser);
      setStatus("User ID скопирован.");
    }, "Копируем…").catch((error) => setStatus(error.message || "Не удалось скопировать User ID.", true));
    return;
  }

  const localSocialPlayer = event.target.closest("[data-social-local-player]")?.dataset.socialLocalPlayer;
  if (localSocialPlayer) {
    socialDetailDialog?.close();
    void openLocalPlayerCard(localSocialPlayer).catch((error) => setStatus(error.message || "Не удалось открыть локальную карточку игрока.", true));
    return;
  }

  const localSocialStatusButton = event.target.closest("[data-social-local-status]");
  if (localSocialStatusButton) {
    runButtonOperation(localSocialStatusButton, async () => {
      const userId = localSocialStatusButton.dataset.socialLocalStatus;
      const details = await api.getCompanionDetails("player", userId);
      const entity = details?.entity || {};
      await api.saveLocalPlayerPreference({
        userId,
        alias: entity.alias || "",
        note: entity.note || "",
        status: localSocialStatusButton.dataset.localStatus || "none"
      });
      if (state.uiSettings.notifyMarkedPlayers) await refreshNotificationReferences();
      setStatus(localSocialStatusButton.dataset.localStatus === "watch" ? "Игрок добавлен под локальное наблюдение." : "Локальное наблюдение снято.");
      await openSocialProfile(userId);
    }, "Сохраняем…").catch((error) => setStatus(error.message || "Не удалось изменить локальное наблюдение.", true));
    return;
  }

  const socialAdminPlayer = event.target.closest("[data-social-admin-player]")?.dataset.socialAdminPlayer;
  if (socialAdminPlayer) {
    const displayName = socialDetailTitle?.textContent || socialAdminPlayer;
    socialDetailDialog?.close();
    openPlayerInAdmin({ userId: socialAdminPlayer, displayName });
    return;
  }

  const socialOwnerPlayer = event.target.closest("[data-social-owner-player]")?.dataset.socialOwnerPlayer;
  if (socialOwnerPlayer) {
    const displayName = socialDetailTitle?.textContent || socialOwnerPlayer;
    socialDetailDialog?.close();
    openPlayerInOwner({ userId: socialOwnerPlayer, displayName });
    return;
  }

  const socialAvatarToggle = event.target.closest("[data-social-avatar-toggle]");
  if (socialAvatarToggle) {
    const userId = socialAvatarToggle.dataset.socialAvatarToggle;
    const section = socialDetailBody?.querySelector(`[data-social-avatar-history="${CSS.escape(userId)}"]`);
    if (section) {
      section.hidden = !section.hidden;
      socialAvatarToggle.textContent = section.hidden ? `Аватары · ${section.querySelectorAll(".socialAvatarHistoryRow").length}` : "Скрыть аватары";
      if (!section.hidden) section.scrollIntoView({ block: "nearest" });
    }
    return;
  }

  const avatarSelectButton = event.target.closest("[data-avatar-select]");
  if (avatarSelectButton) {
    const avatarId = avatarSelectButton.dataset.avatarSelect;
    if (!window.confirm("Выбрать этот аватар для вашего VRChat-аккаунта? VRChat применит его как текущий аватар.")) return;
    runButtonOperation(avatarSelectButton, async () => {
      const result = await api.selectVrchatAvatar(avatarId);
      setStatus(`Аватар выбран: ${result.avatarName || result.avatarId}.`);
    }, "Надеваем…").catch((error) => setStatus(formatVrchatAuthError(error), true));
    return;
  }

  const externalSocialProfile = event.target.closest("[data-social-external-profile]")?.dataset.socialExternalProfile;
  if (externalSocialProfile) {
    api.openExternal(`https://vrchat.com/home/user/${encodeURIComponent(externalSocialProfile)}`).catch((error) => setStatus(error.message || "Не удалось открыть профиль.", true));
    return;
  }

  const externalSocialGroup = event.target.closest("[data-social-external-group]")?.dataset.socialExternalGroup;
  if (externalSocialGroup) {
    api.openExternal(`https://vrchat.com/home/group/${encodeURIComponent(externalSocialGroup)}`).catch((error) => setStatus(error.message || "Не удалось открыть группу.", true));
    return;
  }

  const socialWorld = event.target.closest("[data-social-world]")?.dataset.socialWorld;
  if (socialWorld) {
    api.openExternal(`https://vrchat.com/home/world/${encodeURIComponent(socialWorld)}`).catch((error) => setStatus(error.message || "Не удалось открыть мир.", true));
    return;
  }

  const localAvatarProfile = event.target.closest("[data-local-avatar-profile]")?.dataset.localAvatarProfile;
  if (localAvatarProfile) {
    void runButtonOperation(event.target.closest("button"), async () => {
      state.directoryAvatarProfile = await api.resolveVrchatAvatar(localAvatarProfile);
      renderLocalDirectory("avatar");
      setStatus("Доступные данные аватара загружены из VRChat.");
    }, "Загружаем…").catch((error) => setStatus(formatVrchatAuthError(error), true));
    return;
  }

  const socialProfile = event.target.closest("[data-social-profile]")?.dataset.socialProfile;
  if (socialProfile) {
    void openSocialProfile(socialProfile).catch((error) => setStatus(formatVrchatAuthError(error), true));
    return;
  }

  const socialGroup = event.target.closest("[data-social-group]")?.dataset.socialGroup;
  if (socialGroup) {
    void openSocialGroup(socialGroup).catch((error) => setStatus(formatVrchatAuthError(error), true));
    return;
  }

  const localAvatarKey = event.target.closest("[data-local-avatar-key]")?.dataset.localAvatarKey;
  if (localAvatarKey) {
    if (socialDetailDialog?.open) socialDetailDialog.close();
    selectView("local-avatars");
    void selectDirectoryResult("avatar", localAvatarKey).catch((error) => setStatus(error.message || "Не удалось открыть локальную карточку.", true));
    return;
  }

  const localWorldKey = event.target.closest("[data-local-world-key]")?.dataset.localWorldKey;
  if (localWorldKey) {
    if (socialDetailDialog?.open) socialDetailDialog.close();
    void openLocalWorldCard(localWorldKey).catch((error) => setStatus(error.message || "Не удалось открыть локальную карточку мира.", true));
    return;
  }

  const directoryResult = event.target.closest("[data-directory-result-key]");
  if (directoryResult) {
    void selectDirectoryResult(directoryResult.dataset.directoryResultKind, directoryResult.dataset.directoryResultKey)
      .catch((error) => setStatus(error.message || "Не удалось открыть локальную карточку.", true));
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
      const userId = eventUserButton.dataset.eventUserId;
      if (state.workspaceMode === "personal") {
        void openLocalPlayerCard(userId).catch((error) => setStatus(error.message || "Не удалось открыть локальную карточку.", true));
      } else if (hasPaidAccess()) {
        openPlayerInAdmin({
          userId,
          displayName: eventUserButton.dataset.eventUserName || eventUserButton.textContent
        });
      } else {
        openSessionPlayer(userId);
      }
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
    renderAvatarSession({ force: true });
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
    if (state.workspaceMode === "personal") void openLocalPlayerCard(sessionPlayerButton.dataset.sessionPlayerId);
    else if (player && hasPaidAccess()) openPlayerInAdmin(player);
    else openSessionPlayer(sessionPlayerButton.dataset.sessionPlayerId);
    return;
  }

  const localWorldButton = event.target.closest("[data-local-world-key]");
  if (localWorldButton) {
    void openLocalWorldCard(localWorldButton.dataset.localWorldKey);
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

  if (event.target.closest("[data-builder-inspector-close]")) {
    closeBuilderInspector();
    return;
  }

  const builderInspectorProfile = event.target.closest("[data-builder-inspector-profile]")?.dataset.builderInspectorProfile;
  if (builderInspectorProfile) {
    api.openExternal(`https://vrchat.com/home/user/${encodeURIComponent(builderInspectorProfile)}`)
      .catch((error) => setStatus(error.message || "Не удалось открыть профиль VRChat.", true));
    return;
  }

  const builderInspectorOwner = event.target.closest("[data-builder-inspector-owner]")?.dataset.builderInspectorOwner;
  if (builderInspectorOwner) {
    try {
      const player = adminPlayers().find((row) => row.userId === builderInspectorOwner) || builderInspectorRecord();
      openPlayerInOwner(player);
    } catch (error) {
      setStatus(error.message || "Не удалось открыть Owner.", true);
    }
    return;
  }

  const builderInspectorFull = event.target.closest("[data-builder-inspector-full]")?.dataset.builderInspectorFull;
  if (builderInspectorFull) {
    const selection = state.builderInspector;
    const record = builderInspectorRecord();
    try {
      if (builderInspectorFull === "admin") openPlayerInAdmin(record);
      else if (builderInspectorFull === "session") {
        state.sessionSection = "feed";
        localStorage.setItem("betaSessionSection", "feed");
        selectView("session");
        renderSession();
        openSessionPlayer(record?.userId || record?.user_id);
      } else if (builderInspectorFull === "avatar") openAvatarFromEvent(selection?.key);
      else if (builderInspectorFull === "social") openSocialProfile(record?.userId || record?.user_id)
        .catch((error) => setStatus(error.message || "Не удалось открыть профиль VRChat.", true));
    } catch (error) {
      setStatus(error.message || "Не удалось открыть полный раздел.", true);
    }
    return;
  }

  const builderInspectorRow = event.target.closest("[data-builder-inspector-kind]");
  if (builderInspectorRow) {
    openBuilderInspector(builderInspectorRow.dataset.builderInspectorKind, builderInspectorRow.dataset.builderInspectorKey);
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

  if (event.target.closest("[data-builder-overlay-toggle]")) {
    setBuilderOverlayHidden();
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

  const builderBlockAction = event.target.closest("[data-builder-block-action]");
  if (builderBlockAction) {
    const kind = builderBlockAction.closest("[data-builder-kind]")?.dataset.builderKind;
    if (!BUILDER_KINDS.includes(kind)) return;
    const setting = builderBlockSetting(kind);
    if (builderBlockAction.dataset.builderBlockAction === "collapse") setting.collapsed = !setting.collapsed;
    if (builderBlockAction.dataset.builderBlockAction === "lock") setting.locked = !setting.locked;
    if (builderBlockAction.dataset.builderBlockAction === "hide") state.builderVisible = state.builderVisible.filter((value) => value !== kind);
    persistBuilderSettings();
    renderBuilder();
    return;
  }

  if (event.target.closest("[data-builder-reset]")) {
    if (!window.confirm(t("Сбросить расположение блоков и настройки окна Builder?"))) return;
    resetBuilder().catch((error) => setStatus(error.message || "Не удалось сбросить Builder.", true));
    return;
  }

  if (event.target.closest("[data-builder-dashboard-new]")) {
    try { createBuilderDashboard(); renderBuilder(); } catch (error) { setStatus(error.message, true); }
    return;
  }

  if (event.target.closest("[data-builder-dashboard-save]")) {
    saveBuilderDashboard();
    return;
  }

  if (event.target.closest("[data-builder-dashboard-delete]")) {
    if (window.confirm(t("Удалить выбранный локальный дашборд?"))) deleteBuilderDashboard();
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

  const evidenceButton = event.target.closest("[data-owner-evidence]");
  if (evidenceButton) {
    api.openExternal(evidenceButton.dataset.ownerEvidence)
      .catch((error) => setStatus(error.message || "Не удалось открыть доказательство.", true));
    return;
  }

  const appealButton = event.target.closest("[data-appeal-save]");
  const appealRequestId = appealButton?.dataset.appealSave;
  if (appealRequestId) {
    const editor = appealButton.closest(".ownerAppealEditor");
    runButtonOperation(appealButton, async () => {
      const request = await api.updateModerationAppeal({
        requestId: appealRequestId,
        appealStatus: editor.querySelector("[data-appeal-status]").value,
        appealNote: editor.querySelector("[data-appeal-note]").value
      });
      state.ownerRequests = [request, ...state.ownerRequests.filter((row) => row.id !== request.id)];
      renderOwnerCard();
      setStatus("Апелляция сохранена.");
      return request;
    }, "Сохраняем…").catch((error) => setStatus(error.message || "Не удалось сохранить апелляцию.", true));
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

  const companionResult = event.target.closest("[data-companion-result-key]");
  if (companionResult) {
    void selectCompanionResult(companionResult.dataset.companionResultKind, companionResult.dataset.companionResultKey);
    return;
  }

  const insightProfile = event.target.closest("[data-insight-profile]")?.dataset.insightProfile;
  if (insightProfile) {
    api.openExternal(`https://vrchat.com/home/user/${encodeURIComponent(insightProfile)}`)
      .catch((error) => setStatus(error.message || "Не удалось открыть профиль.", true));
    return;
  }

  const worldPageButton = event.target.closest("[data-world-page]");
  if (worldPageButton) {
    runButtonOperation(worldPageButton, () => openSavedWorld(worldPageButton.dataset.worldPage), "Открываем…")
      .catch((error) => setStatus(error.message || "Не удалось открыть страницу мира.", true));
    return;
  }

  const worldLaunchButton = event.target.closest("[data-world-launch]");
  if (worldLaunchButton) {
    runButtonOperation(worldLaunchButton, () => openSavedWorld(worldLaunchButton.dataset.worldLaunch, true), "Запускаем…")
      .catch((error) => setStatus(error.message || "Не удалось запустить мир через VRChat.", true));
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

  const historyExportButton = event.target.closest("[data-history-export]");
  const historyExport = historyExportButton?.dataset.historyExport;
  if (historyExport) {
    runButtonOperation(historyExportButton, () => exportHistorySession(historyExport), "Экспортируем…")
      .catch((error) => setStatus(error.message || "Не удалось экспортировать сессию.", true));
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
    choose: analyzeLog,
    analyze: analyzeCurrentLogAutomatically,
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
      resetSocialAccount();
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
    invalidateAvatarFilter();
    state.avatarPage = 1;
    state.selectedAvatarKey = "";
    renderAvatarSession();
  }, 120);
});

avatarFilter?.addEventListener("change", () => {
  state.avatarFilter = ["crash", "unresolved"].includes(avatarFilter.value) ? avatarFilter.value : "all";
  invalidateAvatarFilter();
  state.avatarPage = 1;
  state.selectedAvatarKey = "";
  renderAvatarSession();
});

avatarPageSize?.addEventListener("change", () => {
  const nextSize = Number(avatarPageSize.value);
  state.avatarPageSize = AVATAR_PAGE_SIZES.includes(nextSize) ? nextSize : 50;
  state.avatarPage = 1;
  localStorage.setItem("betaAvatarPageSize", String(state.avatarPageSize));
  if (avatarSessionList) avatarSessionList.scrollTop = 0;
  renderAvatarPage(true);
});

avatarPagePrev?.addEventListener("click", () => {
  state.avatarPage = Math.max(1, state.avatarPage - 1);
  if (avatarSessionList) avatarSessionList.scrollTop = 0;
  renderAvatarPage(true);
});

avatarPageNext?.addEventListener("click", () => {
  state.avatarPage += 1;
  if (avatarSessionList) avatarSessionList.scrollTop = 0;
  renderAvatarPage(true);
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

document.querySelector("[data-social-search]")?.addEventListener("input", (event) => {
  state.socialQuery = event.target.value.slice(0, 200); renderSocial();
});
document.querySelector("[data-social-inventory-type]")?.addEventListener("change", (event) => {
  state.socialInventoryType = event.target.value; renderSocial();
});
document.querySelector("[data-social-notification-filter]")?.addEventListener("change", (event) => {
  state.socialNotificationFilter = event.target.value; renderSocial();
});

document.querySelector("[data-companion-favorites-only]")?.addEventListener("change", (event) => {
  state.companionFavoritesOnly = event.target.checked;
  renderCompanionSearch();
});

companionSearch?.addEventListener("input", () => {
  clearTimeout(state.companionSearchTimer);
  state.companionQuery = companionSearch.value;
  state.companionSearchTimer = setTimeout(() => {
    state.companionSearchTimer = 0;
    void runCompanionSearch();
  }, 180);
});

for (const panel of directoryPanels) {
  const kind = panel.dataset.directoryKind;
  panel.querySelector("[data-directory-search]")?.addEventListener("input", (event) => {
    clearTimeout(state.directorySearchTimers[kind]);
    state.directoryQueries[kind] = event.currentTarget.value;
    state.directorySearchTimers[kind] = setTimeout(() => {
      state.directorySearchTimers[kind] = 0;
      state.directorySelected[kind] = "";
      state.directoryDetails[kind] = null;
      void refreshLocalDirectory(directoryViewForKind(kind));
    }, 180);
  });
}

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

historyDetail?.addEventListener("change", (event) => {
  if (!event.target.matches("[data-history-hide-names]")) return;
  state.historyHideNames = Boolean(event.target.checked);
});

ownerCard?.addEventListener("change", (event) => {
  if (event.target.matches("[data-owner-policy-threshold]")) state.ownerPolicyThreshold = Number(event.target.value) || 1;
  else if (event.target.matches("[data-owner-policy-days]")) state.ownerPolicyDays = Number(event.target.value) || 1;
  else if (event.target.matches("[data-owner-policy-excluded]")) state.ownerPolicyExcluded = event.target.value;
  else return;
  renderOwnerCard();
});

insightsPeriod?.addEventListener("change", () => {
  state.insightsPeriod = insightsPeriod.value;
  state.selectedInsightSessionKey = "";
  localStorage.setItem("betaInsightsPeriod", state.insightsPeriod);
  renderInsights();
});

builderLayout?.addEventListener("change", () => {
  state.builderLayout = BUILDER_LAYOUTS.includes(builderLayout.value) ? builderLayout.value : "grid";
  persistBuilderSettings();
  renderBuilder();
});

builderDashboard?.addEventListener("change", () => loadBuilderDashboard(builderDashboard.value));

document.querySelector("[data-builder-blocks]")?.addEventListener("change", (event) => {
  const input = event.target.closest("input[type=checkbox]");
  if (!input || !BUILDER_KINDS.includes(input.value)) return;
  state.builderVisible = input.checked
    ? [...new Set([...state.builderVisible, input.value])]
    : state.builderVisible.filter((kind) => kind !== input.value);
  persistBuilderSettings();
  renderBuilder();
  if (input.checked) void refreshBuilderSources();
});

document.querySelector("[data-builder-snap]")?.addEventListener("change", (event) => {
  state.builderSnap = event.target.checked === true;
  persistBuilderSettings();
});

builderGrid?.addEventListener("input", (event) => {
  const search = event.target.closest("[data-builder-search]");
  const searchKind = search?.dataset.builderSearch;
  if (searchKind && BUILDER_KINDS.includes(searchKind)) {
    state.builderQueries[searchKind] = String(search.value || "").slice(0, 120);
    persistBuilderSettings();
    renderBuilderBlockRows(searchKind);
    return;
  }
  const opacity = event.target.closest("[data-builder-block-opacity]");
  const opacityKind = opacity?.dataset.builderBlockOpacity;
  if (!opacityKind || !BUILDER_KINDS.includes(opacityKind)) return;
  const setting = builderBlockSetting(opacityKind);
  setting.opacity = Math.min(100, Math.max(40, Number(opacity.value) || 100));
  const block = opacity.closest("[data-builder-kind]");
  block?.style.setProperty("--builder-block-opacity", String(setting.opacity / 100));
  const output = block?.querySelector("[data-builder-block-opacity-output]");
  if (output) output.textContent = `${setting.opacity}%`;
  persistBuilderSettings();
});

builderGrid?.addEventListener("change", (event) => {
  const limit = event.target.closest("[data-builder-block-limit]");
  const kind = limit?.dataset.builderBlockLimit;
  const value = Number(limit?.value);
  if (!kind || !BUILDER_KINDS.includes(kind) || !BUILDER_ROW_LIMITS.includes(value)) return;
  builderBlockSetting(kind).rowLimit = value;
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

let uiSidebarDrag = null;

function clampUiSidebarWidth(value) {
  return Math.min(UI_SIDEBAR_MAX_WIDTH, Math.max(UI_SIDEBAR_COLLAPSED_WIDTH, Number(value) || UI_SIDEBAR_COLLAPSED_WIDTH));
}

function setUiSidebarWidth(width, persist = false) {
  state.uiSettings.uiSidebarWidth = clampUiSidebarWidth(width);
  applyUiSettings({ persist });
}

uiChromeResize?.addEventListener("pointerdown", (event) => {
  if (state.uiSettings.uiPlacement !== "left" || event.button !== 0) return;
  event.preventDefault();
  appView.classList.remove("railActionsOpen");
  railActionsToggle?.setAttribute("aria-expanded", "false");
  uiSidebarDrag = { pointerId: event.pointerId, startX: event.clientX, startWidth: state.uiSettings.uiSidebarWidth };
  uiChromeResize.setPointerCapture?.(event.pointerId);
  document.body.classList.add("uiChromeResizing");
});

document.addEventListener("pointermove", (event) => {
  if (!uiSidebarDrag || event.pointerId !== uiSidebarDrag.pointerId) return;
  event.preventDefault();
  setUiSidebarWidth(uiSidebarDrag.startWidth + event.clientX - uiSidebarDrag.startX);
});

function finishUiSidebarResize(event) {
  if (!uiSidebarDrag || event.pointerId !== uiSidebarDrag.pointerId) return;
  const currentWidth = state.uiSettings.uiSidebarWidth;
  uiSidebarDrag = null;
  document.body.classList.remove("uiChromeResizing");
  setUiSidebarWidth(currentWidth < UI_SIDEBAR_SNAP_WIDTH ? UI_SIDEBAR_COLLAPSED_WIDTH : Math.max(UI_SIDEBAR_MIN_WIDTH, currentWidth), true);
}

document.addEventListener("pointerup", finishUiSidebarResize);
document.addEventListener("pointercancel", finishUiSidebarResize);

uiChromeResize?.addEventListener("keydown", (event) => {
  if (state.uiSettings.uiPlacement !== "left" || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const current = state.uiSettings.uiSidebarWidth;
  const next = event.key === "Home"
    ? UI_SIDEBAR_COLLAPSED_WIDTH
    : event.key === "End"
      ? UI_SIDEBAR_MAX_WIDTH
      : event.key === "ArrowLeft"
        ? (current <= UI_SIDEBAR_MIN_WIDTH ? UI_SIDEBAR_COLLAPSED_WIDTH : current - 24)
        : (current < UI_SIDEBAR_MIN_WIDTH ? 272 : current + 24);
  setUiSidebarWidth(next, true);
});

railActionsToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  const open = !appView.classList.contains("railActionsOpen");
  appView.classList.toggle("railActionsOpen", open);
  railActionsToggle.setAttribute("aria-expanded", String(open));
});

document.addEventListener("click", (event) => {
  if (!appView.classList.contains("railActionsOpen")) return;
  if (event.target.closest("#railQuickActions, [data-rail-actions-toggle]")) return;
  appView.classList.remove("railActionsOpen");
  railActionsToggle?.setAttribute("aria-expanded", "false");
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !appView.classList.contains("railActionsOpen")) return;
  appView.classList.remove("railActionsOpen");
  railActionsToggle?.setAttribute("aria-expanded", "false");
  railActionsToggle?.focus();
});

document.querySelector("#railQuickActions")?.addEventListener("click", (event) => {
  if (!event.target.closest("button")) return;
  appView.classList.remove("railActionsOpen");
  railActionsToggle?.setAttribute("aria-expanded", "false");
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
  if (state.builderCompact && event.ctrlKey && event.shiftKey && event.key.toLocaleLowerCase() === "b") {
    event.preventDefault();
    setBuilderOverlayHidden();
    return;
  }
  if (moveTabFocus(event)) return;
  if (!playerDrawer?.hidden && trapFocus(event, playerDrawer.querySelector('[role="dialog"]'))) return;
  if (event.key !== "Escape") return;
  event.preventDefault();
  if (state.statusCenterOpen) setStatusCenter(false);
  else if (vrchatAuthDialog?.open) closeVrchatAuth();
  else if (settingsDialog?.open) closeSettings();
  else if (ownerDialog?.open) closeOwnerDialog();
  else if (!playerDrawer?.hidden) closeSessionPlayer();
  else if (state.builderInspector) closeBuilderInspector();
  else if (state.builderCompactMenuOpen) {
    state.builderCompactMenuOpen = false;
    syncBuilderControls();
  }
  else if (state.builderCompact) setBuilderCompact().catch((error) => setStatus(error.message || "Не удалось изменить размер окна.", true));
});

function resetAnalysisEvents() {
  state.events = [];
  state.profiles.clear();
  invalidateSessionData({ avatars: true });
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
api?.onSocialActivity?.(() => {
  api.listLocalSocialEvents(500).then((events) => {
    state.socialEvents = Array.isArray(events) ? events : [];
    if (state.view === "social" && state.socialTab === "journal") renderSocial();
    if (state.view === "session" && state.sessionSection === "friends") renderFriendActivityFeed();
  }).catch(() => {});
});
api?.onFriendPipelineStatus?.((status) => renderFriendPipelineStatus(status));
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
  state.profiles.delete(userId);
  state.profiles.set(userId, { ...profile, userId, displayName: String(profile?.displayName || userId) });
  while (state.profiles.size > PROFILE_RENDER_CACHE_LIMIT) state.profiles.delete(state.profiles.keys().next().value);
  if (state.view === "session") scheduleSessionRender();
  if (state.view === "admin") scheduleAdminRender();
  if (state.view === "owner") scheduleOwnerRender();
  if (state.view === "builder") scheduleBuilderRender();
});
api?.onTailStatus((status) => {
  const wasRunning = state.running;
  state.running = Boolean(status.running);
  if (state.running) {
    clearMonitoringRestart();
    state.monitoringRestartAttempt = 0;
    state.monitoringStopRequested = false;
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
  if (!state.running && wasRunning && !state.monitoringStopRequested && !state.monitoringTransition) {
    scheduleMonitoringRestart(status?.message || "чтение лога остановилось");
  }
});
window.addEventListener("beforeunload", () => {
  if (state.dashboardClockTimer) window.clearInterval(state.dashboardClockTimer);
  if (state.statusResetTimer) window.clearTimeout(state.statusResetTimer);
  if (state.playSessionSyncTimer) window.clearTimeout(state.playSessionSyncTimer);
  clearMonitoringRestart();
  dismissBuilderCompactHint();
  stopNotificationMonitoring();
});
api?.onTailError((error) => {
  const message = error?.message || "Ошибка чтения лога";
  setStatus(message, true);
  if (state.running) scheduleMonitoringRestart(message);
});
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
  if (!api || !noteTools || !sessionModel || !crashModel || !insightsModel || !avatarModel || !notificationModel || !i18n || !miniGames) {
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
    if (!state.settings.hasSession && !state.settings.freeMode) {
      showActivation();
      showRuntimeConfigNotice(state.runtimeConfig);
      return;
    }
    if (state.settings.hasSession || state.settings.freeMode) await api.validate();
    await showApp();
  } catch (error) {
    showActivation(error.message || "Сохранённая сессия недействительна.", true);
  }
}

renderSession();
renderAdminList();
renderAdminCard();
initialize();
