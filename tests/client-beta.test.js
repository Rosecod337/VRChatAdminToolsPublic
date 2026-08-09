"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { importStableSettings } = require("../apps/client/src/stable-settings-import");
const betaAdminNotes = require("../apps/client-beta/renderer/admin-notes");
const betaSessionModel = require("../apps/client-beta/renderer/session-model");
const betaCrashModel = require("../apps/client-beta/renderer/crash-model");
const betaInsightsModel = require("../apps/client-beta/renderer/insights-model");
const betaAvatarModel = require("../apps/client-beta/renderer/avatar-model");
const betaNotificationModel = require("../apps/client-beta/renderer/notification-model");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("beta client is a separate product that reuses the trusted core", () => {
  const packageJson = JSON.parse(read("apps/client-beta/package.json"));
  const launcher = read("apps/client-beta/src/main.js");
  const coreMain = read("apps/client/src/main.js");

  assert.equal(packageJson.build.appId, "com.vrchatadmintools.beta");
  assert.match(packageJson.productName, /Beta/u);
  assert.match(launcher, /VRCHAT_CLIENT_VARIANT = "beta"/u);
  assert.match(launcher, /client\/src\/main\.js/u);
  assert.match(coreMain, /!app\.isPackaged && developmentOverride/u);
  assert.match(coreMain, /!app\.isPackaged \|\| isBetaClient\(\)/u);
  assert.match(coreMain, /preserveStableSession = isBetaClient\(\) && settings\.importedStableSession === true/u);
});

test("beta renderer stays shell-neutral and exposes the new navigation", () => {
  const html = read("apps/client-beta/renderer/index.html");
  const css = read("apps/client-beta/renderer/styles.css");
  const script = read("apps/client-beta/renderer/app.js");
  const coreMain = read("apps/client/src/main.js");

  assert.match(html, /Отдельное приложение · Beta/u);
  assert.match(html, /src="app-logo\.png"/u);
  assert.ok(fs.existsSync(path.join(root, "apps/client-beta/renderer/app-logo.png")));
  assert.match(html, /тот же, что в Stable/u);
  assert.match(html, /data-author-alias-field hidden/u);
  assert.doesNotMatch(html, /name="authorAlias"[^>]*required/u);
  assert.match(html, /data-import-stable/u);
  assert.match(html, /data-check-vrchat/u);
  assert.match(html, /data-view-button="session"/u);
  assert.match(html, /data-view-button="builder"/u);
  assert.match(html, /class="appTitlebar"/u);
  assert.match(html, /class="topNavigation"/u);
  assert.match(html, /class="topNavigation" role="tablist"/u);
  assert.match(html, /role="tab" aria-selected="true" aria-controls="viewPanelSession"/u);
  assert.match(html, /role="tabpanel" aria-labelledby="viewTabSession"/u);
  assert.doesNotMatch(html, /class="sidebar"/u);
  assert.match(html, /data-action="analyze"/u);
  assert.match(html, /data-action="snapshot"/u);
  assert.match(html, /data-action="community"/u);
  assert.match(html, /data-action="update"/u);
  assert.match(html, /data-session-player-mode="online-first"/u);
  assert.match(html, /data-session-player-mode="online-only"/u);
  assert.match(html, /data-session-player-search/u);
  assert.match(html, /data-session-section="feed"/u);
  assert.match(html, /data-session-section="avatars"/u);
  assert.match(html, /data-session-section="dashboard"/u);
  assert.match(html, /data-avatar-search/u);
  assert.match(html, /data-avatar-filter/u);
  assert.match(html, /data-avatar-refresh/u);
  assert.match(html, /data-avatar-detail/u);
  assert.match(html, /data-session-player-drawer/u);
  assert.match(html, /data-view-button="owner"/u);
  assert.doesNotMatch(html, /data-view-button="owner" hidden/u);
  assert.match(html, /data-owner-list/u);
  assert.match(html, /data-owner-moderation-form/u);
  assert.match(html, /data-owner-source="group"/u);
  assert.match(html, /data-owner-group-load/u);
  assert.match(html, /admin-notes\.js/u);
  assert.match(html, /session-model\.js/u);
  assert.match(html, /crash-model\.js/u);
  assert.match(html, /insights-model\.js/u);
  assert.match(html, /avatar-model\.js/u);
  assert.match(html, /notification-model\.js/u);
  assert.match(html, /data-admin-card/u);
  assert.match(html, /data-admin-search/u);
  assert.match(html, /data-admin-mode="online-only"/u);
  assert.match(html, /data-admin-today/u);
  assert.match(html, /data-admin-copy/u);
  assert.match(html, /data-crash-lag/u);
  assert.match(html, /data-crash-copy/u);
  assert.match(html, /data-crash-clear/u);
  assert.match(html, /data-crash-detail/u);
  assert.match(html, /data-insights-period/u);
  assert.match(html, /data-insights-copy/u);
  assert.match(html, /data-insight-current-user/u);
  assert.match(html, /data-insight-session-detail/u);
  assert.match(html, /data-builder-layout/u);
  assert.match(html, /data-builder-blocks/u);
  assert.match(html, /data-builder-on-top/u);
  assert.match(html, /data-builder-opacity/u);
  assert.match(html, /data-builder-compact/u);
  assert.match(html, /data-view-button="history"/u);
  assert.match(html, /data-history-search/u);
  assert.match(html, /data-history-date/u);
  assert.match(html, /data-history-state/u);
  assert.match(html, /data-history-list/u);
  assert.match(html, /data-history-detail/u);
  assert.match(html, /data-settings-open/u);
  assert.match(html, /data-settings-dialog/u);
  assert.match(html, /data-header-hide/u);
  assert.match(html, /data-header-show/u);
  assert.match(html, /data-runtime-status-title/u);
  assert.match(html, /data-status-center/u);
  assert.match(html, /data-status-unread/u);
  assert.match(html, /name="showHeader"/u);
  assert.match(html, /name="startView"/u);
  assert.match(html, /option value="owner">Owner<\/option>/u);
  assert.match(html, /name="eventLimit"/u);
  assert.match(html, /name="notifyMarkedPlayers"/u);
  assert.match(html, /name="notifyCrashAvatars"/u);
  assert.match(css, /@keyframes beta-view-in/u);
  assert.match(css, /@keyframes beta-dialog-in/u);
  assert.match(css, /prefers-reduced-motion/u);
  assert.match(css, /\.animationsOff/u);
  assert.match(css, /data-status-kind="error"/u);
  assert.match(css, /button\[aria-busy="true"\]/u);
  assert.match(css, /@keyframes beta-spin/u);
  assert.match(css, /input:focus-visible/u);
  assert.match(css, /\.statusNotice\[data-kind="error"\]/u);
  assert.match(css, /data-locked="true"/u);
  assert.match(html, /data-app-version/u);
  assert.match(script, /api\.saveSettings\(/u);
  assert.match(script, /api\.getVrchatCurrentUser\(\)/u);
  assert.match(script, /ownerNavButton\.disabled = !enabled/u);
  assert.match(script, /function playerMarker\(/u);
  assert.match(css, /\.playerMarker::before/u);
  assert.match(script, /state\.statusResetTimer = window\.setTimeout/u);
  assert.match(script, /function recordStatusNotice\(/u);
  assert.match(script, /function clearStatusCenter\(/u);
  assert.match(script, /Чтение лога активно/u);
  assert.match(html, />Запустить</u);
  assert.match(html, />Остановить</u);
  assert.doesNotMatch(html, />Start</u);
  assert.doesNotMatch(html, />Stop</u);
  assert.match(script, /window\.clientApi/u);
  assert.match(script, /function moveTabFocus\(event\)/u);
  assert.match(script, /state\.uiSettings\.startView === "owner" && !hasOwnerAccess\(\)/u);
  assert.match(script, /data\.adminOwner|dataset\.adminOwner/u);
  assert.match(script, /dataset\.historyOwner/u);
  assert.match(script, /dataset\.crashOwner/u);
  assert.match(script, /function trapFocus\(event, container\)/u);
  assert.match(script, /restoreFocus\(returnFocus\)/u);
  assert.match(script, /author_alias_required/u);
  assert.match(script, /setAuthorAliasRequested\(true\)/u);
  assert.match(script, /api\.importStableSettings\(\)/u);
  assert.match(script, /api\.savePlayerNote\(payload\)/u);
  assert.match(script, /api\.listPlayerNoteHistory\(userId\)/u);
  assert.match(script, /adminStatusLabel\(row\.status\)/u);
  assert.match(script, /renderVirtualRows\(noteList/u);
  assert.match(script, /api\.readTodayPlayers\(\)/u);
  assert.match(script, /api\.listGlobalPlayerNotes/u);
  assert.match(script, /api\.saveGlobalPlayerNote/u);
  assert.match(script, /restoreAdminHistory/u);
  assert.match(script, /api\.prepareAnalyzeOptions/u);
  assert.match(script, /api\.analyzeCurrentInstance/u);
  assert.match(script, /api\.writeClipboardText\(buildSessionSnapshot\(\)\)/u);
  assert.match(script, /api\.installUpdate\(\)/u);
  assert.match(script, /visibleSessionPlayers/u);
  assert.match(script, /requestAnimationFrame/u);
  assert.match(script, /renderVirtualRows/u);
  assert.match(script, /openSessionPlayerProfile/u);
  assert.match(script, /openSessionPlayerAdmin/u);
  assert.match(script, /openSessionPlayerOwner/u);
  assert.match(script, /api\.requestGroupBan/u);
  assert.match(script, /api\.requestGroupUnban/u);
  assert.match(script, /api\.listGroupBanRequests/u);
  assert.match(script, /renderVirtualRows\(ownerList/u);
  assert.match(script, /minutes < 5 \|\| minutes > 43200/u);
  assert.match(script, /api\.requestGroupManagement/u);
  assert.match(script, /api\.listGroupManagementRequests/u);
  assert.match(script, /groupRoleAdd/u);
  assert.match(script, /action: "kick_member"/u);
  assert.match(script, /captureLagSnapshot/u);
  assert.match(script, /pollCrashAnalyzer/u);
  assert.match(script, /crashModel\.report/u);
  assert.match(script, /insightsModel\.buildInsights/u);
  assert.match(script, /copyInsightsRecap/u);
  assert.match(script, /api\.setAlwaysOnTop/u);
  assert.match(script, /api\.setWindowOpacity/u);
  assert.match(script, /api\.setCompactMode/u);
  assert.match(script, /dataTransfer\.setData/u);
  assert.match(script, /betaBuilderOrder/u);
  assert.match(script, /filteredHistorySessions/u);
  assert.match(script, /renderVirtualRows\(historyList/u);
  assert.match(script, /copyHistorySession/u);
  assert.match(script, /api\.listAvatarCatalog/u);
  assert.match(script, /api\.saveAvatarNote/u);
  assert.match(script, /api\.findVrchatAvatarCandidates/u);
  assert.match(script, /api\.saveGlobalAvatarNote/u);
  assert.match(script, /normalizedUiSettings/u);
  assert.match(script, /betaUiSettings/u);
  assert.match(script, /eventLimit/u);
  assert.match(script, /api\.showNotification/u);
  assert.match(script, /function syncNotificationMonitoring\(/u);
  assert.match(script, /function runButtonOperation\(/u);
  assert.match(script, /ACTION_PENDING_LABELS/u);
  assert.match(script, /api\.updatePlaySession\(currentPlaySessionStats\(\)\)/u);
  assert.match(script, /api\?\.onAnalysisStart/u);
  assert.match(script, /api\?\.onTailRotation/u);
  assert.match(script, /api\?\.onUserResolved/u);
  assert.match(script, /api\?\.onRuntimeConfig/u);
  assert.match(coreMain, /appVersion: app\.getVersion\(\)/u);
  assert.doesNotMatch(script, /require\s*\(/u);
  assert.doesNotMatch(script, /ipcRenderer|electron/u);
});

test("beta keeps every user-facing Stable action reachable", () => {
  const stableHtml = read("apps/client/renderer/index.html");
  const betaHtml = read("apps/client-beta/renderer/index.html");
  const actionMap = [
    ["checkVrchatBtn", "data-check-vrchat"],
    ["updateBtn", 'data-action="update"'],
    ["chooseFileBtn", 'data-action="choose"'],
    ["analyzeCurrentBtn", 'data-action="analyze"'],
    ["copySnapshotBtn", 'data-action="snapshot"'],
    ["communityBtn", 'data-action="community"'],
    ["startBtn", 'data-action="start"'],
    ["stopBtn", 'data-action="stop"'],
    ["logoutBtn", 'data-action="logout"'],
    ["refreshMyVrchatBtn", 'data-action="refresh-insights"'],
    ["copyMyVrchatBtn", "data-insights-copy"],
    ["adminReadTodayPlayersBtn", "data-admin-today"],
    ["copyAdminSnapshotBtn", "data-admin-copy"],
    ["ownerGroupSearchBtn", "data-owner-group-load"],
    ["ownerReadTodayPlayersBtn", "data-owner-today"],
    ["refreshModerationBtn", 'data-action="refresh-owner"'],
    ["crashToggleBtn", "data-crash-toggle"],
    ["captureLagBtn", "data-crash-lag"],
    ["copyCrashReportBtn", "data-crash-copy"],
    ["clearCrashHistoryBtn", "data-crash-clear"],
    ["builderAddBlockBtn", "data-builder-blocks"],
    ["alwaysOnTopBtn", "data-builder-on-top"],
    ["compactModeBtn", "data-builder-compact"],
    ["refreshHistoryBtn", 'data-action="refresh-history"'],
    ["historyResetBtn", "data-history-reset"],
    ["banRequestSubmitBtn", "data-owner-dialog-submit"],
    ["playerActionOwnerBtn", "data-session-player-owner"],
    ["playerActionProfileBtn", "data-session-player-profile"]
  ];

  for (const [stableId, betaMarker] of actionMap) {
    assert.match(stableHtml, new RegExp(`id="${stableId}"`, "u"), `${stableId} must still exist in Stable`);
    assert.ok(betaHtml.includes(betaMarker), `${stableId} must have a reachable Beta equivalent`);
  }
});

test("beta session model keeps player state correct and virtualizes large lists", () => {
  const events = [
    { type: "world-joined", worldName: "Group Public", timestamp: "2026-08-08T10:00:00.000Z" },
    { type: "player-joined", userId: "usr_alpha", display: "Alpha", timestamp: "2026-08-08T10:00:01.000Z" },
    { type: "player-joined", userId: "usr_beta", display: "Beta", timestamp: "2026-08-08T10:00:02.000Z" },
    { type: "player-left", userId: "usr_alpha", timestamp: "2026-08-08T10:00:03.000Z" }
  ];
  const stats = betaSessionModel.buildSessionStats(events);
  assert.equal(stats.world, "Group Public");
  assert.equal(stats.online, 1);
  assert.equal(stats.peak, 2);
  assert.equal(stats.unique, 2);
  assert.equal(stats.players.find((row) => row.userId === "usr_alpha").display, "Alpha");
  assert.equal(stats.players.find((row) => row.userId === "usr_alpha").online, false);

  const onlineFirst = betaSessionModel.filterPlayers(stats.players, "online-first", "");
  assert.deepEqual(onlineFirst.map((row) => row.userId), ["usr_beta", "usr_alpha"]);
  assert.deepEqual(betaSessionModel.filterPlayers(stats.players, "online-only", "").map((row) => row.userId), ["usr_beta"]);
  assert.deepEqual(betaSessionModel.filterPlayers(stats.players, "all", "USR_ALPHA").map((row) => row.userId), ["usr_alpha"]);

  const featureEvents = [
    ...events,
    { type: "avatar-changed", userId: "usr_beta", playerName: "Beta", avatarName: "Night Shift", timestamp: "2026-08-08T10:00:04.000Z" },
    { type: "avatar-data", userId: "usr_beta", playerName: "Beta", avatarName: "Night Shift", avatarId: "avtr_demo", timestamp: "2026-08-08T10:00:05.000Z" }
  ];
  const avatarSummary = betaSessionModel.buildAvatarSummary(featureEvents);
  assert.equal(avatarSummary.events, 2);
  assert.equal(avatarSummary.unique, 1);
  assert.equal(avatarSummary.resolved, 1);
  assert.equal(avatarSummary.players, 1);
  assert.deepEqual(betaSessionModel.buildDashboard(featureEvents), { joins: 2, leaves: 1, avatars: 2, worlds: 1, other: 0 });
  assert.deepEqual(betaSessionModel.buildPlaySessionStats(featureEvents, [{ user_id: "usr_beta", status: "watch" }]), {
    playerCount: 2,
    avatarCount: 2,
    eventCount: 6,
    worldName: "Group Public",
    snapshot: {
      players: [
        { userId: "usr_alpha", displayName: "Alpha", status: "ok" },
        { userId: "usr_beta", displayName: "Beta", status: "watch" }
      ]
    }
  });
  assert.deepEqual(
    betaSessionModel.importantEvents(featureEvents, 3).map((event) => event.type),
    ["player-left", "player-joined", "player-joined"]
  );

  const window = betaSessionModel.virtualWindow({ total: 1000, scrollTop: 5800, viewportHeight: 580, rowHeight: 58, overscan: 5 });
  assert.deepEqual(window, { start: 95, end: 115, offset: 5510, totalHeight: 58000 });
  assert.ok(window.end - window.start <= 20);
});

test("beta avatar model merges name-only events into confirmed IDs and filters risky rows", () => {
  const rows = betaAvatarModel.buildRows([
    { type: "avatar-changed", avatarName: "Night Shift", playerName: "Mira", userId: "usr_mira", timestamp: "2026-08-09T10:00:00.000Z" },
    { type: "avatar-data", avatarName: "Night Shift", avatarId: "avtr_night", playerName: "Mira", userId: "usr_mira", timestamp: "2026-08-09T10:00:01.000Z" }
  ], [
    { avatar_name: "Sunrise", avatar_id: "avtr_sunrise", seen_count: 4 }
  ], [
    { avatar_key: "id:avtr_night", avatar_name: "Night Shift", avatar_id: "avtr_night", status: "crash", note: "Проверить FPS" }
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].avatarId, "avtr_night");
  assert.equal(rows[0].status, "crash");
  assert.equal(betaAvatarModel.filterRows(rows, "mira", "all").length, 1);
  assert.deepEqual(betaAvatarModel.filterRows(rows, "", "crash").map((row) => row.avatarId), ["avtr_night"]);
  assert.equal(betaAvatarModel.filterRows(rows, "", "unresolved").length, 0);
});

test("beta notifications use current marked data and ignore replayed log history", () => {
  const now = Date.parse("2026-08-09T10:01:00.000Z");
  const join = { type: "player-joined", userId: "usr_watch", playerName: "Watch", timestamp: "2026-08-09T10:00:30.000Z" };
  assert.equal(betaNotificationModel.isRecentLiveEvent(join, now), true);
  assert.equal(betaNotificationModel.isRecentLiveEvent({ ...join, timestamp: "2026-08-09T09:30:00.000Z" }, now), false);
  assert.equal(betaNotificationModel.isRecentLiveEvent({ ...join, timestamp: "" }, now), false);
  assert.equal(betaNotificationModel.markedPlayer(join, [{ user_id: "usr_watch", status: "watch" }]).status, "watch");
  assert.equal(betaNotificationModel.markedPlayer(join, [{ user_id: "usr_watch", status: "ok" }]), null);

  const avatarEvent = { type: "avatar-changed", avatarId: "avtr_exact", avatarName: "Night Shift", timestamp: "2026-08-09T10:00:40.000Z" };
  const exact = betaNotificationModel.crashAvatar(avatarEvent, [
    { avatar_key: "id:avtr_other", avatar_name: "Night Shift", status: "crash" },
    { avatar_key: "id:avtr_exact", avatar_name: "Another Name", status: "crash" }
  ]);
  assert.equal(exact.avatar_key, "id:avtr_exact");
  assert.equal(betaNotificationModel.crashAvatar({ ...avatarEvent, avatarId: "" }, [{ avatar_key: "name:night shift", status: "crash" }]).avatar_key, "name:night shift");
  assert.equal(betaNotificationModel.crashAvatar(avatarEvent, [{ avatar_key: "id:avtr_exact", status: "ok" }]), null);
});

test("beta crash model captures a bounded evidence timeline without claiming guilt", () => {
  const incidentTimeMs = Date.parse("2026-08-08T10:05:00.000Z");
  const events = [
    { type: "world-joined", worldName: "Group Public", timestamp: "2026-08-08T10:00:00.000Z" },
    { type: "player-joined", userId: "usr_alpha", playerName: "Alpha", timestamp: "2026-08-08T10:04:20.000Z" },
    { type: "avatar-changed", userId: "usr_alpha", playerName: "Alpha", avatarName: "Night Shift", timestamp: "2026-08-08T10:04:45.000Z" },
    { type: "avatar-data", userId: "usr_alpha", playerName: "Alpha", avatarName: "Night Shift", avatarId: "avtr_12345678", timestamp: "2026-08-08T10:04:49.000Z" }
  ];
  const incident = betaCrashModel.buildIncident(events, { processRunning: false, logModifiedAt: "2026-08-08T10:04:50.000Z" }, {
    incidentTimeMs,
    reason: "VRChat неожиданно закрылся",
    manual: false
  });
  assert.equal(incident.worldName, "Group Public");
  assert.equal(incident.candidates.length, 4);
  assert.equal(incident.suspects[0].userId, "usr_alpha");
  assert.equal(incident.suspects[0].avatarId, "avtr_12345678");
  assert.ok(incident.suspects[0].score >= 65);
  const report = betaCrashModel.report(incident);
  assert.match(report, /VRChat Crash Risk Report/u);
  assert.match(report, /не доказывает вину игрока или аватара/u);
  assert.equal(betaCrashModel.eventDetail({ raw: "x".repeat(1000) }).length, 280);
  assert.equal(betaCrashModel.normalizeIncidents(Array.from({ length: 30 }, (_, index) => ({ id: `i-${index}`, createdAt: new Date(incidentTimeMs + index).toISOString() }))).length, 20);
});

test("beta insights dedupe saved sessions and bound active-session duration", () => {
  const nowMs = Date.parse("2026-08-09T12:00:00.000Z");
  const sessions = [
    {
      id: "session-one",
      started_at: "2026-08-09T09:00:00.000Z",
      snapshot: JSON.stringify({ players: [{ userId: "usr_alpha", displayName: "Alpha" }] })
    },
    {
      id: "session-one",
      started_at: "2026-08-09T09:00:00.000Z",
      ended_at: "2026-08-09T10:00:00.000Z",
      world_name: "Group Public",
      snapshot: { players: [{ userId: "usr_alpha", displayName: "Alpha" }, { userId: "usr_beta", displayName: "Beta" }] }
    },
    {
      id: "session-two",
      started_at: "2026-08-09T11:30:00.000Z",
      world_name: "Friends+",
      snapshot: { players: [{ userId: "usr_alpha", displayName: "Alpha" }, { userId: "usr_alpha", displayName: "duplicate" }] }
    },
    {
      id: "empty-unknown",
      started_at: "2026-08-09T10:30:00.000Z",
      ended_at: "2026-08-09T11:00:00.000Z",
      player_count: 0,
      avatar_count: 0,
      event_count: 0,
      snapshot: { players: [] }
    },
    { id: "future", started_at: "2026-08-10T00:00:00.000Z", world_name: "Future" }
  ];
  const insights = betaInsightsModel.buildInsights(sessions, { days: 7, nowMs });
  assert.equal(insights.sessionCount, 2);
  assert.equal(insights.totalDurationMs, 90 * 60_000);
  assert.equal(insights.uniquePlayerCount, 2);
  assert.equal(insights.recurringPlayerCount, 1);
  assert.equal(insights.totalEncounters, 3);
  assert.equal(insights.sessions.find((session) => session.id === "session-one").complete, true);
  assert.equal(insights.sessions.find((session) => session.id === "session-two").endedAt, nowMs);
  assert.equal(insights.sessions.some((session) => session.id === "empty-unknown"), false);
  assert.match(betaInsightsModel.recap(insights, "7 дней"), /Сессий: 2/u);
  assert.match(betaInsightsModel.recap(insights, "7 дней"), /Повторных встреч: 1/u);
});

test("beta player-note helpers normalize server rows and keep one saved record", () => {
  const normalized = betaAdminNotes.normalizeNote({
    user_id: " usr_demo_nova ",
    display_name: " Nova ",
    status: "watch",
    note: "  Проверить позже  ",
    updated_at: "2026-08-01T20:35:00.000Z",
    updated_by_key: "VRC-PREVIEW",
    updated_by_label: "Beta Preview"
  });

  assert.deepEqual(normalized, {
    userId: "usr_demo_nova",
    displayName: "Nova",
    status: "watch",
    note: "Проверить позже",
    updatedAt: "2026-08-01T20:35:00.000Z",
    updatedByKey: "VRC-PREVIEW",
    updatedByLabel: "Beta Preview"
  });

  const payload = betaAdminNotes.editorPayload(normalized, { status: "warned", note: "  Новая заметка  " });
  assert.deepEqual(payload, {
    userId: "usr_demo_nova",
    displayName: "Nova",
    status: "warned",
    note: "Новая заметка"
  });

  const merged = betaAdminNotes.mergeSavedNote([
    normalized,
    { userId: "usr_demo_mira", displayName: "Mira", status: "ok", note: "" }
  ], { ...payload, updated_at: "2026-08-01T21:00:00.000Z" }, normalized);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].userId, "usr_demo_nova");
  assert.equal(merged[0].status, "warned");
  assert.equal(merged[1].userId, "usr_demo_mira");
});

test("beta imports a private copy of the Stable session without changing Stable", async (context) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vrchat-beta-import-"));
  context.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));
  const stableDirectory = path.join(tempRoot, "VRChat Log Analyzer");
  const betaSettingsPath = path.join(tempRoot, "VRChat Admin Tools Beta", "settings.json");
  const stableSettingsPath = path.join(stableDirectory, "settings.json");
  const stableSettings = {
    serverUrl: "https://api.example.invalid",
    sessionToken: "",
    protected: { sessionToken: "encrypted-session" },
    license: { authorAlias: "Tester" }
  };
  fs.mkdirSync(stableDirectory, { recursive: true });
  fs.writeFileSync(stableSettingsPath, JSON.stringify(stableSettings), "utf8");

  const result = await importStableSettings({
    appDataPath: tempRoot,
    targetSettingsPath: betaSettingsPath
  });

  assert.deepEqual(result, { imported: true, reason: "stable_settings_imported" });
  assert.deepEqual(JSON.parse(fs.readFileSync(betaSettingsPath, "utf8")), {
    ...stableSettings,
    importedStableSession: true
  });
  assert.deepEqual(JSON.parse(fs.readFileSync(stableSettingsPath, "utf8")), stableSettings);

  const secondResult = await importStableSettings({
    appDataPath: tempRoot,
    targetSettingsPath: betaSettingsPath
  });
  assert.deepEqual(secondResult, { imported: false, reason: "beta_settings_exist" });
});

test("build pipeline can stage the beta installer independently", () => {
  const rootPackage = JSON.parse(read("package.json"));
  const buildScript = read("scripts/build-electron.mjs");

  assert.equal(rootPackage.scripts["client-beta:dev"], "electron apps/client-beta");
  assert.equal(rootPackage.scripts["build:client-beta"], "node scripts/build-electron.mjs client-beta");
  assert.match(buildScript, /appName === "client-beta"/u);
  assert.match(buildScript, /apps", "client-beta", "renderer/u);
  assert.doesNotMatch(buildScript, /packageJson\.dependencies\s*=\s*\{\}/u);
  assert.match(buildScript, /verifyPackagedClientDependencies/u);
});

test("beta has a real renderer performance smoke check", () => {
  const rootPackage = JSON.parse(read("package.json"));
  const performanceCheck = read("scripts/check-beta-renderer-performance.mjs");
  assert.equal(rootPackage.scripts["check:client-beta:performance"], "node scripts/check-beta-renderer-performance.mjs");
  assert.match(performanceCheck, /playerTotal !== 1000/u);
  assert.match(performanceCheck, /eventTotal !== 2000/u);
  assert.match(performanceCheck, /playerRows > 40/u);
  assert.match(performanceCheck, /totalDomNodes > 1200/u);
});
