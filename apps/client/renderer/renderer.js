"use strict";

const shell = document.querySelector(".shell");
const activationView = document.querySelector("#activationView");
const appView = document.querySelector("#appView");
const activationForm = document.querySelector("#activationForm");
const activationStatus = document.querySelector("#activationStatus");
const licenseKey = document.querySelector("#licenseKey");
const vrchatAuthCookie = document.querySelector("#vrchatAuthCookie");
const rememberMe = document.querySelector("#rememberMe");
const checkVrchatBtn = document.querySelector("#checkVrchatBtn");
const activateBtn = document.querySelector("#activateBtn");
const runtimeStatus = document.querySelector("#runtimeStatus");
const updateBtn = document.querySelector("#updateBtn");
const communityBtn = document.querySelector("#communityBtn");
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
const adminPlayerSearch = document.querySelector("#adminPlayerSearch");
const adminPlayerList = document.querySelector("#adminPlayerList");
const adminPlayerCard = document.querySelector("#adminPlayerCard");
const copyAdminSnapshotBtn = document.querySelector("#copyAdminSnapshotBtn");
const adminSyncStatus = document.querySelector("#adminSyncStatus");
const crashStatusBadge = document.querySelector("#crashStatusBadge");
const crashToggleBtn = document.querySelector("#crashToggleBtn");
const captureLagBtn = document.querySelector("#captureLagBtn");
const copyCrashReportBtn = document.querySelector("#copyCrashReportBtn");
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
const savedBuilderSearch = loadJson("builderSearch", {});

const state = {
  currentFile: null,
  events: [],
  eventIds: new Set(),
  playerEventIndex: null,
  renderTimer: null,
  profiles: new Map(),
  search: { players: "", avatars: "" },
  adminSearch: "",
  selectedUserId: "",
  license: null,
  teamId: "",
  teamScopeVersion: 0,
  playerNotesReady: false,
  playerNotes: {},
  noteSaveTimers: new Map(),
  notePollTimer: null,
  noteSyncInFlight: false,
  playerNoteOutbox: {},
  playerNoteFlushInFlight: false,
  globalPlayerNotes: loadJson("globalPlayerNotes", {}),
  globalPlayerNotesReady: false,
  globalPlayerNotesInFlight: false,
  globalPlayerNotesLastFetchAt: 0,
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
  compactMode: false
};

function setActivationStatus(text, isError = false) {
  activationStatus.textContent = text;
  activationStatus.style.color = isError ? "#ffb1a8" : "";
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
  for (const event of state.events) {
    let userId = event.userId || "";
    if (!userId) {
      const owners = ownersByName.get(normalizedPlayerName(event.playerName));
      if (owners?.size === 1) userId = owners.values().next().value;
    }
    if (userId && byUserId.has(userId)) byUserId.get(userId).push(event);
  }

  state.playerEventIndex = { byUserId, userIds };
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

function currentAdminIdentity() {
  const license = state.license || {};
  const key = String(license.keyPrefix || license.id || "").trim();
  const label = String(license.label || key || "").trim();
  return {
    key: key.slice(0, 80),
    label: label.slice(0, 120)
  };
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

  clearPendingTeamSaveTimers();
  state.teamScopeVersion += 1;
  state.teamId = teamId;
  state.avatarNameResolveInFlight.clear();
  state.avatarCandidateResults.clear();
  state.playerNotes = loadTeamJson("playerNotes", {});
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
  clearPendingTeamSaveTimers();
  state.teamScopeVersion += 1;
  state.teamId = "";
  state.avatarNameResolveInFlight.clear();
  state.avatarCandidateResults.clear();
  state.playerNotes = {};
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
  for (const row of notes || []) {
    const userId = row.user_id || row.userId;
    if (!userId) continue;
    if (state.noteSaveTimers.has(userId) || state.playerNoteOutbox[userId] || isEditingAdminPlayer(userId)) continue;
    next[userId] = normalizePlayerNote(row, next[userId]);
  }
  state.playerNotes = next;
  state.playerNotesReady = true;
  cachePlayerNotes();
  if (activePaneName() === "admin") renderAdminTools();
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
  if (activePaneName() === "admin" && !isEditingAdminPlayer()) renderAdminPlayerCard();
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
  }
}

async function publishGlobalPlayerNote(userId) {
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
  await window.clientApi.removeGlobalPlayerNote(userId);
  state.globalPlayerNotes[userId] = globalReportsForPlayer(userId)
    .filter((row) => row.sourceTeamId !== state.teamId);
  localStorage.setItem("globalPlayerNotes", JSON.stringify(state.globalPlayerNotes));
  delete state.playerNoteHistory[userId];
  await loadPlayerNoteHistory(userId, { force: true, silent: true });
  setRuntimeStatus("Общая заметка удалена");
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
  if (activePaneName() === "crash") renderCrashAnalyzer();
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
    flushAvatarNotes({ silent: true }).catch(() => {});
  }, 10_000);
}

function avatarNoteRecord(avatarName = "", avatarId = "", forcedKey = "") {
  const key = forcedKey || avatarNoteKey(avatarName, avatarId);
  if (!key) return null;
  const fallback = { avatarKey: key, avatarName, avatarId, status: "ok", note: "" };
  state.avatarNotes[key] = normalizeAvatarNote(state.avatarNotes[key], fallback);
  if (!state.avatarNotes[key].avatarName && avatarName) state.avatarNotes[key].avatarName = avatarName;
  if (!state.avatarNotes[key].avatarId && avatarId) state.avatarNotes[key].avatarId = avatarId;
  return state.avatarNotes[key];
}

function avatarNoteForEvent(event) {
  if (!event) return null;
  const avatarId = verifiedAvatarId(event);
  const byId = avatarId ? state.avatarNotes[avatarIdNoteKey(avatarId)] : null;
  if (byId) return { ...normalizeAvatarNote(byId), match: "id" };
  const byName = event.avatarName ? state.avatarNotes[avatarNameNoteKey(event.avatarName)] : null;
  return byName ? { ...normalizeAvatarNote(byName), match: "name" } : null;
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
  const playerEvents = events.filter((event) => event.type === "player-joined" || event.type === "player-left");
  const joins = playerEvents.filter((event) => event.type === "player-joined");
  const leaves = playerEvents.filter((event) => event.type === "player-left");
  const avatars = events.filter((event) => (
    event.category === "avatars" &&
    event.type !== "avatar-loading" &&
    (event.avatarName || event.avatarId)
  ));
  const last = playerEvents[playerEvents.length - 1];
  const firstJoin = joins[0];
  return {
    userId,
    name: playerLabel(userId, firstJoin?.playerName || last?.playerName),
    joins,
    leaves,
    avatars,
    firstJoin,
    last,
    online: last?.type === "player-joined"
  };
}

function isEditingAdminPlayer(userId = state.selectedUserId) {
  const active = document.activeElement;
  if (!active?.matches?.("[data-player-note-status], [data-player-note-text]")) return false;
  return active.closest("[data-player-note-editor]")?.dataset.userId === userId;
}

function profileButton(event) {
  if (!event.userId) return "<span></span>";
  const profile = state.profiles.get(event.userId);
  const url = profile?.profileUrl || `https://vrchat.com/home/user/${encodeURIComponent(event.userId)}`;
  return `<button class="eventAction" data-url="${escapeHtml(url)}">Профиль</button>`;
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

function adminAvatarRow(event) {
  const avatarName = event.avatarName || event.avatarId || "-";
  const avatarId = event.avatarId || "";
  const source = event.avatarIdSource === "catalog"
    ? " · из каталога"
    : event.avatarIdSource === "api-name"
      ? " · возможный ID по имени"
      : "";
  const action = event.avatarId ? avatarMiniAction(event) : avatarCandidateActions(event, true) || `<span class="adminMiniMuted">Без ссылки</span>`;
  return `<div class="adminMiniRow adminMiniRow--avatar">
    <span>${escapeHtml(formatTime(event))}</span>
    <div class="adminAvatarInfo">
      <strong>${escapeHtml(avatarName)}</strong>
      ${avatarId ? `<small>${escapeHtml(avatarId + source)}</small>` : `<small>avtr_... не найден в логе</small>`}
    </div>
    ${action}
  </div>`;
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
    ? `<span class="eventAvatarBadge eventAvatarBadge--${escapeHtml(avatarNote.status)}">${escapeHtml(avatarNote.status)}</span>`
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
  if (activePane === "crash") renderCrashAnalyzer();
}

function scheduleRender(delayMs = 75) {
  if (state.renderTimer) return;
  state.renderTimer = setTimeout(() => {
    state.renderTimer = null;
    render();
  }, delayMs);
}

function playerSummaries() {
  return [...playerEventIndex().userIds].map(buildPlayerSummary).sort((a, b) => {
    const aWatch = playerRecord(a.userId).status !== "ok" ? 1 : 0;
    const bWatch = playerRecord(b.userId).status !== "ok" ? 1 : 0;
    if (aWatch !== bWatch) return bWatch - aWatch;
    return a.name.localeCompare(b.name, "ru");
  });
}

function renderAdminTools() {
  if (!adminPlayerList || !adminPlayerCard) return;
  if (adminSyncStatus) {
    adminSyncStatus.textContent = state.playerNotesReady ? "Общие данные" : "Локальный кэш";
    adminSyncStatus.title = state.playerNotesReady
      ? "Метки и заметки синхронизируются каждые 5 секунд."
      : "Нет связи с сервисом. Используются данные, сохранённые на этом устройстве.";
    adminSyncStatus.classList.toggle("adminSyncStatus--synced", state.playerNotesReady);
  }
  const q = state.adminSearch.toLowerCase();
  const summaries = playerSummaries().filter((summary) => {
    if (!q) return true;
    return summary.name.toLowerCase().includes(q) || summary.userId.toLowerCase().includes(q);
  });

  const playerListHtml = summaries.map((summary) => {
    const record = playerRecord(summary.userId);
    const active = summary.userId === state.selectedUserId ? " active" : "";
    const statusClass = summary.online ? "adminStatus adminStatus--online" : "adminStatus adminStatus--offline";
    const status = record.status !== "ok" ? `<span class="adminBadge">${escapeHtml(record.status)}</span>` : "";
    return `<button class="adminPlayerItem${active}" data-user-id="${escapeHtml(summary.userId)}">
      <span>${escapeHtml(summary.name)}</span>
      <small><span class="${statusClass}">${summary.online ? "в сети" : "не в сети"}</span> · ${summary.joins.length} заходов</small>
      ${status}
    </button>`;
  }).join("") || `<div class="emptyState">Нет игроков</div>`;
  if (adminPlayerList._renderedHtml !== playerListHtml) {
    const previousScrollTop = adminPlayerList.scrollTop;
    adminPlayerList.innerHTML = playerListHtml;
    adminPlayerList._renderedHtml = playerListHtml;
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
      <strong>${escapeHtml(report.updatedByLabel || "Неизвестный администратор")}</strong>
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
        <strong>${escapeHtml(row.updated_by_label || row.updatedByLabel || "Неизвестный администратор")}</strong>
        <span>${escapeHtml(formatDateTime(row.updated_at || row.updatedAt))}${canRestore ? ` · <button type="button" data-restore-note-history="${escapeHtml(String(row.id))}">Вернуть</button>` : ""}</span>
      </header>
      <span>${escapeHtml(visibility)} · ${escapeHtml(oldStatus)} → ${escapeHtml(nextStatus)}</span>
      ${previousNote !== note ? `<p><b>Было:</b> ${escapeHtml(previousNote || "без заметки")}<br><b>Стало:</b> ${escapeHtml(note || "без заметки")}</p>` : ""}
    </article>`;
  }).join("");
}

function adminPlayerCardHtml(userId) {
  if (!userId) return `<div class="emptyState">Выберите игрока</div>`;

  const summary = buildPlayerSummary(userId);
  const record = playerRecord(userId);
  const profile = state.profiles.get(userId);
  const profileUrl = profile?.profileUrl || `https://vrchat.com/home/user/${encodeURIComponent(userId)}`;
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
      <button class="eventAction" data-url="${escapeHtml(profileUrl)}">Профиль</button>
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
    <div class="adminShareActions">
      <p>Общая публикация видна всем командам. Автор и время изменения сохраняются.</p>
      <button type="button" data-publish-global-note>${ownReport ? "Обновить общую" : "Опубликовать всем"}</button>
      ${ownReport ? `<button type="button" data-remove-global-note>Убрать общую</button>` : ""}
    </div>
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
  const nextHtml = adminPlayerCardHtml(state.selectedUserId);
  if (adminPlayerCard._renderedHtml === nextHtml) return;
  adminPlayerCard.innerHTML = nextHtml;
  adminPlayerCard._renderedHtml = nextHtml;
  adminPlayerCard.scrollTop = previousScrollTop;
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

function builderParts(parts = partitionEvents()) {
  if (!state.builderVisible.includes("admin")) return parts;
  return { ...parts, admin: playerSummaries() };
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
    const record = playerRecord(summary.userId);
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
  const events = sourceEvents || (kind === "admin" ? playerSummaries() : partitionEvents()[kind]);
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
  localStorage.setItem("crashEventBuffer", JSON.stringify(state.crashEventBuffer));
}

function resetEvents(options = {}) {
  const { clearCrashBuffer = false } = options;
  state.events = [];
  state.lastEventAt = "";
  state.eventIds.clear();
  invalidatePlayerEventIndex();
  if (state.renderTimer) clearTimeout(state.renderTimer);
  state.renderTimer = null;
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
    const activePane = document.querySelector(".tabPane.active");
    if (activePane?.dataset.pane === "dashboard") renderDashboard();
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
  const watch = playerSummaries().filter((summary) => playerRecord(summary.userId).status !== "ok");
  const online = playerStats.online.slice(-25).map((event) => `• ${displayName(event)}`).join("\n") || "нет данных";
  const watchText = watch.slice(0, 10).map((summary) => {
    const record = playerRecord(summary.userId);
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

function saveCrashState() {
  localStorage.setItem("crashAnalyzerEnabled", String(state.crashAnalyzerEnabled));
  localStorage.setItem("crashIncidents", JSON.stringify(state.crashIncidents.slice(0, 20)));
  localStorage.setItem("crashEventBuffer", JSON.stringify(state.crashEventBuffer.slice(-500)));
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
  renderCrashAnalyzer();
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
    <div class="crashSuspectWho">${escapeHtml(who)}</div>
    <div class="crashSuspectAvatar">${statusBadge}<span>${escapeHtml(avatar)}</span></div>
    <small>${escapeHtml(reasons)}</small>
    ${crashAvatarNoteControl(candidate)}
  </div>`;
}

function renderCrashAnalyzer() {
  if (!crashStatusBadge || !crashStatusText || !crashIncidentList || !crashToggleBtn) return;
  crashToggleBtn.textContent = state.crashAnalyzerEnabled ? "Disable" : "Enable";
  crashStatusBadge.textContent = state.crashAnalyzerEnabled ? "watching" : "disabled";
  crashStatusBadge.classList.toggle("crashStatusBadge--on", state.crashAnalyzerEnabled);
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
  renderCrashAnalyzer();
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
      vrchatAuthCookie: cookie,
      rememberMe: Boolean(rememberMe?.checked)
    });
    state.license = payload.license || null;
    setStoredCookieState(willHaveStoredCookie);
    setTeamScope(state.license);
    licenseKey.value = "";
    setRuntimeStatus(`Session active until ${new Date(payload.expiresAt).toLocaleString("ru-RU")}`);
    showApp();
    startPlayerNotesPolling();
    startAvatarNotesPolling();
    startAvatarCatalogPolling();
    await loadPlayerNotes({ pushLocal: true });
    await loadGlobalPlayerNotes({ force: true, silent: true });
    await loadAvatarCatalog({ silent: true, pushLocal: true });
    await loadAvatarNotes({ silent: true, pushLocal: true });
    await refreshServerSnapshot({ silent: true });
  }).catch((error) => setActivationStatus(error.message, true));
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

function currentWorldEvents() {
  // A new world transition is a safer boundary than carrying users from the prior instance.
  const world = currentWorldEvent();
  const worldIdx = world ? state.events.indexOf(world) : 0;
  return state.events.slice(worldIdx);
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
  const syncReady = state.playerNotesReady && state.avatarNotesReady && state.avatarCatalogReady && state.globalPlayerNotesReady;
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
        const url = profile?.profileUrl || (e.userId ? `https://vrchat.com/home/user/${encodeURIComponent(e.userId)}` : null);
        return `<div class="dashRecentRow">
          <span class="dashRecentName">${escapeHtml(name)}</span>
          <span class="dashRecentTime">${escapeHtml(time)}</span>
          ${url ? `<button class="eventAction" data-url="${escapeHtml(url)}">Profile</button>` : ""}
        </div>`;
      }).join("")}
    `;
  }
}

// История сессий

function currentPlaySessionStats() {
  const parts = partitionEvents();
  const worldEvents = currentWorldEvents();
  const playerStats = computePlayerStats(worldEvents);
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
      ${players.map((player) => `<span><b title="${escapeHtml(player.userId || "")}">${escapeHtml(player.displayName || player.userId || "Неизвестный игрок")}</b><em>${escapeHtml(player.status || "ok")}</em></span>`).join("")}
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

function startDashboardTimer() {
  if (dashboardTimer) return;
  dashboardTimer = setInterval(() => renderDashboard(), 5000);
}

function stopDashboardTimer() {
  if (dashboardTimer) clearInterval(dashboardTimer);
  dashboardTimer = null;
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;
    tabs.forEach((item) => item.classList.toggle("active", item === tab));
    panes.forEach((pane) => pane.classList.toggle("active", pane.dataset.pane === target));
    if (target === "history") loadHistory();
    if (target === "admin") {
      loadGlobalPlayerNotes({ force: true, silent: true }).catch(() => {});
      if (state.selectedUserId) loadPlayerNoteHistory(state.selectedUserId, { silent: true }).catch(() => {});
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
  compactModeBtn.classList.toggle("active", state.compactMode);
  compactModeBtn.setAttribute("aria-pressed", String(state.compactMode));
  compactModeBtn.textContent = state.compactMode ? "Обычный вид" : "Компактно";
}

alwaysOnTopBtn.addEventListener("click", async () => {
  alwaysOnTopBtn.disabled = true;
  try {
    const result = await window.clientApi.setAlwaysOnTop(!state.alwaysOnTop);
    state.alwaysOnTop = Boolean(result.enabled);
    localStorage.setItem("alwaysOnTop", String(state.alwaysOnTop));
    syncWindowControlButtons();
  } finally {
    alwaysOnTopBtn.disabled = false;
  }
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
  const button = event.target.closest("button[data-url]");
  if (!button) return;
  window.clientApi.openExternal(button.dataset.url);
});

adminPlayerSearch?.addEventListener("input", () => {
  state.adminSearch = adminPlayerSearch.value;
  renderAdminTools();
});

adminPlayerList?.addEventListener("click", (event) => {
  const item = event.target.closest("[data-user-id]");
  if (!item) return;
  state.selectedUserId = item.dataset.userId;
  renderAdminTools();
  loadPlayerNoteHistory(state.selectedUserId, { silent: true }).catch(() => {});
});

adminPlayerCard?.addEventListener("click", (event) => {
  const userId = event.target.closest("[data-player-note-editor]")?.dataset.userId;
  if (!userId) return;
  const restoreButton = event.target.closest("[data-restore-note-history]");
  if (restoreButton) {
    const confirmed = window.confirm("Вернуть метку и заметку к состоянию до этого изменения?");
    if (!confirmed) return;
    runButton(restoreButton, () => restorePlayerNoteHistory(userId, restoreButton.dataset.restoreNoteHistory))
      .then(() => renderAdminPlayerCard())
      .catch((error) => setRuntimeStatus(error.message, true));
    return;
  }
  const publishButton = event.target.closest("[data-publish-global-note]");
  if (publishButton) {
    const confirmed = window.confirm("Опубликовать текущую метку и заметку для всех лицензированных команд? Автор публикации будет виден.");
    if (!confirmed) return;
    runButton(publishButton, () => publishGlobalPlayerNote(userId))
      .then(() => renderAdminPlayerCard())
      .catch((error) => setRuntimeStatus(error.message, true));
    return;
  }
  const removeButton = event.target.closest("[data-remove-global-note]");
  if (removeButton) {
    const confirmed = window.confirm("Убрать общую публикацию вашей команды? Командная заметка останется без изменений.");
    if (!confirmed) return;
    runButton(removeButton, () => removeGlobalPlayerNote(userId))
      .then(() => renderAdminPlayerCard())
      .catch((error) => setRuntimeStatus(error.message, true));
  }
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
  if (activePaneName() === "builder") updateBuilderBlock("admin");
});

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
  renderCrashAnalyzer();
});

window.clientApi.onTailError((error) => setRuntimeStatus(error.message, true));

window.clientApi.onAuthStatus((status) => setRuntimeStatus(status.message, !status.ok));

window.clientApi.onUserResolved((profile) => {
  state.profiles.set(profile.userId, profile);
  scheduleRender();
  const activePane = document.querySelector(".tabPane.active");
  if (activePane?.dataset.pane === "dashboard") renderDashboard();
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

window.addEventListener("focus", () => {
  if (!appView.hidden) loadPlayerNotes({ silent: true }).catch(() => {});
  if (!appView.hidden) loadAvatarCatalog({ silent: true }).catch(() => {});
  if (!appView.hidden) loadAvatarNotes({ silent: true }).catch(() => {});
  if (!appView.hidden) refreshServerSnapshot({ silent: true }).catch(() => {});
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !appView.hidden) loadPlayerNotes({ silent: true }).catch(() => {});
  if (!document.hidden && !appView.hidden) loadAvatarCatalog({ silent: true }).catch(() => {});
  if (!document.hidden && !appView.hidden) loadAvatarNotes({ silent: true }).catch(() => {});
  if (!document.hidden && !appView.hidden) refreshServerSnapshot({ silent: true }).catch(() => {});
});

// Инициализация

async function init() {
  migrateBuilderState();
  const settings = await window.clientApi.getSettings();
  state.license = settings.license || null;
  if (settings.hasSession && state.license) {
    setTeamScope(state.license, { migrateLegacy: true });
  }
  setStoredCookieState(Boolean(settings.hasVrchatAuthCookie));
  if (rememberMe) rememberMe.checked = Boolean(settings.rememberMe);

  const latest = await window.clientApi.latestFile();
  if (latest.filePath) setFilePath(latest.filePath);

  builderLayout.value = state.builderLayout;
  syncBuilderPickerCheckboxes();
  const topResult = await window.clientApi.setAlwaysOnTop(state.alwaysOnTop).catch(() => ({ enabled: false }));
  state.alwaysOnTop = Boolean(topResult.enabled);
  syncWindowControlButtons();
  renderCrashAnalyzer();
  if (state.crashAnalyzerEnabled) startCrashAnalyzer();

  if (settings.hasSession) {
    try {
      const session = await window.clientApi.validate();
      state.license = session.license || state.license;
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
      await refreshServerSnapshot({ silent: true });
    } catch (error) {
      setActivationStatus(error.message, true);
      showActivation();
    }
  } else {
    showActivation();
  }

  render();
}

init().catch((error) => {
  setActivationStatus(error.message, true);
  showActivation();
});
