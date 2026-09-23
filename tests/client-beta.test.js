"use strict";

const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { LocalCompanionStore } = require("../apps/client/src/local-companion-store");
const { importStableSettings } = require("../apps/client/src/stable-settings-import");
const betaAdminNotes = require("../apps/client-beta/renderer/admin-notes");
const betaSessionModel = require("../apps/client-beta/renderer/session-model");
const betaCrashModel = require("../apps/client-beta/renderer/crash-model");
const betaInsightsModel = require("../apps/client-beta/renderer/insights-model");
const betaAvatarModel = require("../apps/client-beta/renderer/avatar-model");
const betaNotificationModel = require("../apps/client-beta/renderer/notification-model");
const betaI18n = require("../apps/client-beta/renderer/i18n");

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
  assert.match(coreMain, /autoUpdater\.allowPrerelease = isPrereleaseVersion\(app\.getVersion\(\)\)/u);
  assert.match(coreMain, /autoUpdater\.allowDowngrade = false/u);
  assert.equal(packageJson.build.publish.provider, "github");
  assert.equal(packageJson.build.publish.releaseType, "prerelease");
  assert.match(coreMain, /preserveStableSession = isBetaClient\(\) && settings\.importedStableSession === true/u);
});

test("beta renderer stays shell-neutral and exposes the new navigation", () => {
  const html = read("apps/client-beta/renderer/index.html");
  const css = read("apps/client-beta/renderer/styles.css");
  const script = read("apps/client-beta/renderer/app.js");
  const coreMain = read("apps/client/src/main.js");
  const preload = read("apps/client/src/preload.js");

  assert.match(html, /Стабильная версия 2\.0/u);
  assert.match(html, /src="app-logo\.png"/u);
  assert.ok(fs.existsSync(path.join(root, "apps/client-beta/renderer/app-logo.png")));
  assert.match(html, /ваш существующий ключ/u);
  assert.match(html, /data-author-alias-field hidden/u);
  assert.doesNotMatch(html, /name="authorAlias"[^>]*required/u);
  assert.match(html, /data-import-stable/u);
  assert.match(html, /data-vrchat-login/u);
  assert.match(html, /data-view-button="session"/u);
  assert.match(html, /data-view-button="builder"/u);
  assert.match(html, /class="appTitlebar"/u);
  assert.match(html, /class="brand"[\s\S]*?class="workspaceModeSwitch"/u);
  assert.match(html, /class="topNavigation"/u);
  assert.match(html, /data-workspace-navigation="personal"/u);
  assert.match(html, /data-nav-scope="shared" data-view-button="session"/u);
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
  assert.match(html, /data-session-event-filter="joins"/u);
  assert.match(html, /data-session-event-filter="avatars"/u);
  assert.match(html, /data-session-event-filter="other"/u);
  assert.doesNotMatch(html, /class="sessionEventFilters"/u);
  assert.match(html, /class="panel eventFeedPanel"><header class="eventFeedHeader"[\s\S]*?data-session-event-filter="all"[\s\S]*?data-feed-count/u);
  assert.match(html, /data-session-section="feed"/u);
  assert.match(html, /data-session-section="friends"/u);
  assert.match(html, /data-session-section="avatars"/u);
  assert.match(html, /data-session-section="dashboard"/u);
  assert.match(html, /data-avatar-search/u);
  assert.match(html, /data-avatar-filter/u);
  assert.match(html, /data-avatar-page-size[\s\S]*?value="200"/u);
  assert.match(html, /data-avatar-page-prev/u);
  assert.match(html, /data-avatar-page-next/u);
  assert.match(script, /AVATAR_RENDER_THROTTLE_MS/u);
  assert.match(script, /if \(!force && !dataDirty && !filterDirty\) return/u);
  assert.match(script, /trimmedEvents \|\| isAvatarEvent\(event\)/u);
  assert.match(html, /data-avatar-refresh/u);
  assert.match(html, /data-avatar-online-search/u);
  assert.match(html, /data-avatar-prismic/u);
  assert.match(html, /data-avatar-online-results/u);
  assert.match(html, /data-avatar-detail/u);
  assert.match(html, /data-session-player-drawer/u);
  assert.match(html, /data-view-button="owner"/u);
  assert.match(html, /data-view-button="owner" hidden/u);
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
  assert.match(html, /data-companion-search/u);
  assert.match(html, /data-companion-search-results/u);
  assert.match(html, /data-companion-search-detail/u);
  assert.match(html, /data-workspace-mode="personal"/u);
  assert.match(html, /data-workspace-mode="team"/u);
  assert.match(html, /data-view-button="library"/u);
  assert.match(html, /data-library-tab="players"/u);
  assert.match(html, /data-library-tab="worlds"/u);
  assert.match(html, /data-library-tab="local-avatars"/u);
  assert.match(html, /data-directory-kind="player"/u);
  assert.match(html, /data-directory-kind="world"/u);
  assert.match(html, /data-directory-kind="avatar"/u);
  assert.match(html, /data-builder-layout/u);
  assert.match(html, /data-builder-blocks/u);
  assert.match(html, /data-builder-on-top/u);
  assert.match(html, /data-builder-opacity/u);
  assert.match(html, /data-builder-compact/u);
  assert.match(html, /data-builder-compact-exit/u);
  assert.match(html, /data-ui-chrome-resize[^>]*><\/div>\s*<\/div>\s*<div class="compactMenuDock"/u);
  assert.match(html, /data-view-button="history"/u);
  assert.match(html, /data-history-search/u);
  assert.match(html, /data-history-date/u);
  assert.match(html, /data-history-state/u);
  assert.match(html, /data-history-list/u);
  assert.match(html, /data-history-detail/u);
  assert.match(html, /data-settings-open/u);
  assert.match(html, /data-settings-dialog/u);
  assert.match(html, /src="i18n\.js"/u);
  assert.match(html, /name="language"/u);
  assert.match(html, /data-language-select="instant"/u);
  assert.match(html, /data-header-hide/u);
  assert.match(html, /data-header-show/u);
  assert.match(html, /data-runtime-status-title/u);
  assert.match(html, /data-status-center/u);
  assert.match(html, /data-status-unread/u);
  assert.match(html, /name="showHeader"/u);
  assert.match(html, /name="startView"/u);
  assert.match(html, /option value="owner">Owner<\/option>/u);
  assert.match(html, /name="eventLimit"/u);
  assert.match(html, /name="scale"[\s\S]*?value="200"/u);
  assert.match(html, /name="density"[\s\S]*?value="vr">VR-крупная/u);
  assert.match(html, /name="notifyMarkedPlayers"/u);
  assert.match(html, /name="notifyCrashAvatars"/u);
  assert.match(css, /@keyframes beta-view-in/u);
  assert.match(css, /@keyframes beta-dialog-in/u);
  assert.match(css, /@keyframes beta-status-center-in[\s\S]*?translate\(-50%,/u);
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
  assert.match(script, /paidStartView === "owner" && !hasOwnerAccess\(\)/u);
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
  assert.match(script, /function toggleSessionEventFilter\(/u);
  assert.match(script, /dataset\.eventUserId/u);
  assert.match(script, /dataset\.eventAvatarKey/u);
  assert.match(script, /function openAvatarFromEvent\(/u);
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
  assert.match(script, /api\.searchCompanion/u);
  assert.match(script, /api\.getCompanionDetails/u);
  assert.match(script, /function switchWorkspaceMode\(mode\)/u);
  assert.match(script, /function refreshLocalDirectory\(view = state\.view\)/u);
  assert.match(script, /api\.setAlwaysOnTop/u);
  assert.match(script, /api\.setWindowOpacity/u);
  assert.match(script, /api\.setCompactMode/u);
  assert.match(script, /state\.builderCompact\) setBuilderCompact/u);
  assert.match(script, /dataTransfer\.setData/u);
  assert.match(script, /betaBuilderOrder/u);
  assert.match(script, /filteredHistorySessions/u);
  assert.match(script, /renderVirtualRows\(historyList/u);
  assert.match(script, /copyHistorySession/u);
  assert.match(script, /api\.listAvatarCatalog/u);
  assert.match(script, /api\.saveAvatarNote/u);
  assert.match(script, /api\.findVrchatAvatarCandidates/u);
  assert.match(script, /api\.searchVrchatAvatars/u);
  assert.match(script, /api\.saveGlobalAvatarNote/u);
  assert.match(script, /normalizedUiSettings/u);
  assert.match(script, /function renderAvatarPage\(force = true\)/u);
  assert.match(script, /\["comfortable", "compact", "vr"\]/u);
  assert.match(script, /classList\.toggle\("densityVr"/u);
  assert.match(script, /density === "compact" \? 48 : state\.uiSettings\.density === "vr" \? 64 : 54/u);
  assert.match(script, /betaUiSettings/u);
  assert.match(script, /language:\s*"ru"/u);
  assert.match(script, /eventLimit/u);
  assert.match(script, /api\.showNotification/u);
  assert.match(script, /function syncNotificationMonitoring\(/u);
  assert.match(css, /\.appShell\.compactMode\s*\{\s*grid-template-rows:\s*58px\s+minmax\(0,\s*1fr\)/u);
  assert.match(css, /\.appShell\.densityVr \.sectionIntro h2\s*\{\s*font-size:\s*32px/u);
  assert.doesNotMatch(css, /\.appShell\.compactMode\s*\{\s*grid-template-rows:\s*58px\s+0\s+minmax/u);
  assert.match(css, /\.activationCard label > span > small\s*\{\s*margin-left:\s*6px/u);
  assert.match(script, /else if \(state\.builderCompact\) setBuilderCompact\(\)/u);
  assert.match(script, /function runButtonOperation\(/u);
  assert.match(script, /function selectAdminPlayer\(userId\)[\s\S]*?renderAdminList\(true\)/u);
  assert.match(script, /data-admin-reveal-selection|dataset\.adminRevealSelection/u);
  assert.match(script, /ACTION_PENDING_LABELS/u);
  assert.match(script, /api\.updatePlaySession\(currentPlaySessionStats\(\)\)/u);
  assert.match(script, /api\?\.onAnalysisStart/u);
  assert.match(script, /api\?\.onTailRotation/u);
  assert.match(script, /api\?\.onUserResolved/u);
  assert.match(script, /api\?\.onRuntimeConfig/u);
  assert.match(coreMain, /appVersion: app\.getVersion\(\)/u);
  assert.match(coreMain, /vrchat:avatar-browse/u);
  assert.match(preload, /searchVrchatAvatars/u);
  assert.doesNotMatch(script, /require\s*\(/u);
  assert.doesNotMatch(script, /ipcRenderer|electron/u);
});

test("beta keeps every user-facing Stable action reachable", () => {
  const stableHtml = read("apps/client/renderer/index.html");
  const betaHtml = read("apps/client-beta/renderer/index.html");
  const actionMap = [
    ["checkVrchatBtn", "data-vrchat-login"],
    ["activateBtn", "data-activate-submit"],
    ["updateBtn", 'data-action="update"'],
    ["chooseFileBtn", 'data-action="choose"'],
    ["analyzeCurrentBtn", 'data-action="analyze"'],
    ["copySnapshotBtn", 'data-action="snapshot"'],
    ["communityBtn", 'data-action="community"'],
    ["startBtn", 'data-action="start"'],
    ["stopBtn", 'data-action="stop"'],
    ["logoutBtn", 'data-action="logout"'],
    ["ownerTabButton", 'data-view-button="owner"'],
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
    ["banRequestCloseBtn", "data-owner-dialog-close"],
    ["banRequestCancelBtn", "data-owner-dialog-cancel"],
    ["playerActionCloseBtn", "data-session-player-close"],
    ["playerActionOwnerBtn", "data-session-player-owner"],
    ["playerActionProfileBtn", "data-session-player-profile"]
  ];

  for (const [stableId, betaMarker] of actionMap) {
    assert.match(stableHtml, new RegExp(`id="${stableId}"`, "u"), `${stableId} must still exist in Stable`);
    assert.ok(betaHtml.includes(betaMarker), `${stableId} must have a reachable Beta equivalent`);
  }

  const navigationMap = [
    ["players", 'data-view-button="session"'],
    ["avatars", 'data-session-section="avatars"'],
    ["dashboard", 'data-session-section="dashboard"'],
    ["insights", 'data-view-button="insights"'],
    ["admin", 'data-view-button="admin"'],
    ["owner", 'data-view-button="owner"'],
    ["crash", 'data-view-button="crash"'],
    ["builder", 'data-view-button="builder"'],
    ["history", 'data-view-button="history"']
  ];
  for (const [stableTab, betaMarker] of navigationMap) {
    assert.match(stableHtml, new RegExp(`data-tab="${stableTab}"`, "u"), `${stableTab} tab must still exist in Stable`);
    assert.ok(betaHtml.includes(betaMarker), `${stableTab} tab must have a reachable Beta equivalent`);
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
      ],
      avatars: [
        { avatarId: "avtr_demo", avatarName: "Night Shift", userId: "usr_beta", displayName: "Beta", seenAt: "2026-08-08T10:00:05.000Z" }
      ],
      playerEvents: [
        { type: "player-joined", userId: "usr_alpha", displayName: "Alpha", seenAt: "2026-08-08T10:00:01.000Z", worldName: "Group Public", worldId: "" },
        { type: "player-joined", userId: "usr_beta", displayName: "Beta", seenAt: "2026-08-08T10:00:02.000Z", worldName: "Group Public", worldId: "" },
        { type: "player-left", userId: "usr_alpha", displayName: "Alpha", seenAt: "2026-08-08T10:00:03.000Z", worldName: "Group Public", worldId: "" }
      ],
      worldVisits: [
        { worldName: "Group Public", worldId: "", seenAt: "2026-08-08T10:00:00.000Z" }
      ]
    }
  });
  assert.deepEqual(
    betaSessionModel.importantEvents(featureEvents, 3).map((event) => event.type),
    ["player-left", "player-joined", "player-joined"]
  );
  const linkedWorld = betaSessionModel.buildPlaySessionStats([
    { type: "world-joining", worldId: "wrld_12345678-1234-1234-1234-1234567890ab" },
    { type: "world-joined", worldName: "Linked World" }
  ]);
  assert.equal(linkedWorld.worldName, "Linked World");
  assert.equal(linkedWorld.snapshot.worldId, "wrld_12345678-1234-1234-1234-1234567890ab");

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
  const page = betaAvatarModel.paginateRows(Array.from({ length: 545 }, (_value, index) => index), 3, 50);
  assert.deepEqual({ page: page.page, pages: page.pages, total: page.total, first: page.rows[0], last: page.rows.at(-1) }, { page: 3, pages: 11, total: 545, first: 100, last: 149 });
  assert.equal(betaAvatarModel.paginateRows(rows, 999, 999).pageSize, 50);
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
      snapshot: { worldId: "wrld_12345678-1234-1234-1234-1234567890ab", players: [{ userId: "usr_alpha", displayName: "Alpha" }, { userId: "usr_beta", displayName: "Beta" }] }
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
  assert.equal(insights.sessions.find((session) => session.id === "session-one").worldId, "wrld_12345678-1234-1234-1234-1234567890ab");
  assert.equal(insights.topWorlds.find((world) => world.worldName === "Group Public").worldId, "wrld_12345678-1234-1234-1234-1234567890ab");
  assert.equal(insights.sessions.find((session) => session.id === "session-two").endedAt, nowMs);
  assert.equal(insights.sessions.some((session) => session.id === "empty-unknown"), false);
  assert.match(betaInsightsModel.recap(insights, "7 дней"), /Сессий: 2/u);
  assert.match(betaInsightsModel.recap(insights, "7 дней"), /Повторных встреч: 1/u);
  assert.match(betaInsightsModel.recap(insights, "7 days", "en"), /Sessions: 2/u);
  assert.match(betaInsightsModel.recap(insights, "7 days", "en"), /Repeat encounters: 1/u);
  assert.equal(betaInsightsModel.formatDuration(90 * 60_000, "en"), "1 h 30 min");
});

test("beta localization keeps Russian as default and translates English UI text", () => {
  const rendererSource = read("apps/client-beta/renderer/app.js");
  const i18nSource = read("apps/client-beta/renderer/i18n.js");
  const sessionForms = { enOne: "session", enMany: "sessions", ruOne: "сессия", ruFew: "сессии", ruMany: "сессий" };
  assert.equal(betaI18n.normalizeLanguage(), "ru");
  assert.equal(betaI18n.normalizeLanguage("en"), "en");
  assert.equal(betaI18n.normalizeLanguage("de"), "ru");
  assert.equal(betaI18n.translate("Настройки", "ru"), "Настройки");
  assert.equal(betaI18n.translate("Настройки", "en"), "Settings");
  assert.equal(betaI18n.translate("57 событий", "en"), "57 events");
  assert.equal(betaI18n.translate("Группа: full white", "en"), "Group: full white");
  assert.equal(betaI18n.count(1, sessionForms, "en"), "1 session");
  assert.equal(betaI18n.count(2, sessionForms, "en"), "2 sessions");
  assert.equal(betaI18n.count(1, sessionForms, "ru"), "1 сессия");
  assert.equal(betaI18n.count(2, sessionForms, "ru"), "2 сессии");
  assert.equal(betaI18n.count(5, sessionForms, "ru"), "5 сессий");
  assert.equal(betaI18n.count(11, sessionForms, "ru"), "11 сессий");
  assert.equal(betaI18n.count(21, sessionForms, "ru"), "21 сессия");
  assert.match(rendererSource, /function userTextElement\(/u);
  assert.match(rendererSource, /element\.dataset\.i18nSkip = "true"/u);
  assert.match(i18nSource, /closest\?\.\("\[data-i18n-skip\]"\)/u);
  assert.doesNotMatch(rendererSource, /function localizedText\(/u);
  assert.match(rendererSource, /english \? "\*\*Online players:\*\*" : "\*\*Онлайн игроки:\*\*"/u);
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
  assert.equal(betaAdminNotes.hasEditorChanges(normalized, payload), true);
  assert.equal(betaAdminNotes.hasEditorChanges(normalized, betaAdminNotes.editorPayload(normalized)), false);
  assert.deepEqual(betaAdminNotes.STATUS_OPTIONS.at(-1), { value: "blocked elsewhere", label: "Заблокирован" });
});

test("beta player notes save only from the explicit button and skip unchanged values", () => {
  const renderer = read("apps/client-beta/renderer/app.js");

  assert.match(renderer, /dataset\.adminNoteSave = "true"/u);
  assert.match(renderer, /save\.type = "button"/u);
  assert.match(renderer, /saveButton\.type = "button"/u);
  assert.match(renderer, /event\.target\.closest\("\[data-admin-note-save\]"\)/u);
  assert.match(renderer, /noteTools\.hasEditorChanges\(record, payload\)/u);
});

test("beta Admin Tools card derives session and avatar activity from the local log", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client-beta/renderer/app.js"), "utf8");
  const styles = fs.readFileSync(path.join(__dirname, "../apps/client-beta/renderer/styles.css"), "utf8");

  assert.match(renderer, /function playerActivity\(record\)/u);
  assert.match(renderer, /sessionModel\.eventBelongsToPlayer\(event, record\)/u);
  assert.match(renderer, /linkedPlayer = sessionStats\(\)\.players\.find/u);
  assert.match(renderer, /row\.dataset\.eventType/u);
  assert.match(renderer, /event\.type === "avatar-changed" \|\| event\.type === "avatar-data"/u);
  assert.match(renderer, /function resolveActivityAvatarFromCatalog\(avatar, record\)/u);
  assert.match(renderer, /const resolvedAvatars = avatars\.map/u);
  assert.match(renderer, /state\.playerActivityCache\.clear\(\)/u);
  assert.match(renderer, /data\.adminAvatarKey|dataset\.adminAvatarKey/u);
  assert.match(renderer, /renderPlayerActivity\(content, record\)/u);
  assert.match(styles, /\.adminPlayerActivity/u);
});

test("beta links name-only avatar events back to the matching session player", () => {
  const player = { userId: "usr_demo_kirito", displayName: "Кирито" };

  assert.equal(betaSessionModel.eventBelongsToPlayer({ type: "avatar-changed", playerName: "Кирито" }, player), true);
  assert.equal(betaSessionModel.eventBelongsToPlayer({ type: "avatar-changed", playerName: "Другой" }, player), false);
  assert.equal(betaSessionModel.eventBelongsToPlayer({ type: "avatar-changed", userId: "usr_demo_kirito", playerName: "Старое имя" }, player), true);
  assert.equal(betaSessionModel.eventBelongsToPlayer({ type: "avatar-changed", userId: "usr_other", playerName: "Кирито" }, player), false);
});

test("beta plays the supplied sound only when Rose337 is clicked", () => {
  const renderer = read("apps/client-beta/renderer/app.js");
  const sound = path.join(__dirname, "../apps/client-beta/renderer/assets/rose337-selection.ogg");

  assert.match(renderer, /function playRose337SelectionSound\(target\)/u);
  assert.match(renderer, /userIdFromInteractiveTarget\(target\) !== ROSE337_USER_ID/u);
  assert.match(renderer, /new Audio\("assets\/rose337-selection\.ogg"\)/u);
  assert.match(renderer, /playRose337SelectionSound\(event\.target\)/u);
  assert.equal(fs.statSync(sound).size > 0, true);
});

test("beta free mode keeps local companion access separate from paid administration", () => {
  const renderer = read("apps/client-beta/renderer/app.js");
  const markup = read("apps/client-beta/renderer/index.html");
  const preload = read("apps/client/src/preload.js");
  const main = read("apps/client/src/main.js");

  assert.match(markup, /data-continue-free/u);
  assert.match(markup, /Продолжить бесплатно/u);
  assert.match(preload, /continueFree: \(\) => ipcRenderer\.invoke\("client:continue-free"\)/u);
  assert.match(main, /ipcMain\.handle\("client:continue-free"/u);
  assert.match(main, /freeMode: true/u);
  assert.match(renderer, /function hasPaidAccess\(\)/u);
  assert.match(renderer, /Admin Tools доступны по платному ключу/u);
  assert.match(renderer, /if \(view === "admin" && !hasPaidAccess\(\)\) return/u);
  assert.match(renderer, /\[data-avatar-online-search\][\s\S]*?toggleAttribute\("hidden", !paid\)/u);
  assert.match(renderer, /scope\.textContent = "Локальный журнал"/u);
  assert.match(renderer, /if \(!state\.settings\.hasSession && !state\.settings\.freeMode\)/u);
});

test("beta free mode stores play-session history in local SQLite", (context) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vrchat-companion-store-"));
  const store = new LocalCompanionStore(path.join(tempRoot, "companion.sqlite"));
  let importedStore = null;
  context.after(() => {
    importedStore?.close();
    store.close();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  const sessionId = store.createSession({ worldName: "Test World", startedAt: "2026-08-12T10:00:00.000Z" });
  assert.match(sessionId, /^local-/u);
  assert.equal(store.updateSession(sessionId, {
    worldName: "Test World",
    playerCount: 2,
    avatarCount: 1,
    eventCount: 5,
    snapshot: {
      worldId: "wrld_11111111-2222-3333-4444-555555555555",
      players: [{ userId: "usr_demo", displayName: "Demo" }],
      playerEvents: [
        { type: "player-joined", userId: "usr_demo", displayName: "Old Demo", seenAt: "2026-08-12T10:01:00.000Z", worldName: "Lobby", worldId: "wrld_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" },
        { type: "player-left", userId: "usr_demo", displayName: "Demo", seenAt: "2026-08-12T10:20:00.000Z", worldName: "Test World", worldId: "wrld_11111111-2222-3333-4444-555555555555" }
      ],
      worldVisits: [
        { worldName: "Lobby", worldId: "wrld_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", seenAt: "2026-08-12T10:00:00.000Z" },
        { worldName: "Test World", worldId: "wrld_11111111-2222-3333-4444-555555555555", seenAt: "2026-08-12T10:10:00.000Z" }
      ],
      avatars: [{ avatarId: "avtr_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", avatarName: "Demo Avatar", userId: "usr_demo", displayName: "Demo" }]
    }
  }, { end: true }).ok, true);

  const [session] = store.listSessions();
  assert.equal(session.id, sessionId);
  assert.equal(session.world_name, "Test World");
  assert.equal(session.player_count, 2);
  assert.ok(session.ended_at);
  assert.equal(JSON.parse(session.snapshot).players[0].displayName, "Demo");

  const playerSearch = store.search("Demo");
  assert.equal(playerSearch.players[0].user_id, "usr_demo");
  assert.equal(Number(playerSearch.players[0].session_count), 1);
  const worldSearch = store.search("Test World");
  assert.equal(worldSearch.worlds[0].world_id, "wrld_11111111-2222-3333-4444-555555555555");
  const playerDetails = store.details("player", "usr_demo");
  assert.equal(playerDetails.entity.display_name, "Demo");
  assert.equal(playerDetails.sessions[0].id, sessionId);
  assert.equal(playerDetails.events.length, 2);
  assert.deepEqual(playerDetails.names.map((row) => row.display_name).sort(), ["Demo", "Old Demo"]);
  assert.equal(playerDetails.worlds.length, 2);
  const worldDetails = store.details("world", "wrld_11111111-2222-3333-4444-555555555555");
  assert.equal(worldDetails.entity.world_name, "Test World");
  assert.equal(worldDetails.sessions[0].id, sessionId);
  assert.equal(worldDetails.visits.length, 1);
  const avatarSearch = store.search("Demo Avatar");
  assert.equal(avatarSearch.avatars[0].avatar_id, "avtr_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
  const avatarDetails = store.details("avatar", "avtr_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
  assert.equal(avatarDetails.entity.avatar_name, "Demo Avatar");
  assert.equal(avatarDetails.sessions[0].id, sessionId);

  const savedPlayer = store.savePlayerPreference({ userId: "usr_demo", alias: "Friend", note: "Local note", status: "watch" });
  assert.equal(savedPlayer.entity.alias, "Friend");
  assert.equal(store.listWatchedPlayers()[0].user_id, "usr_demo");
  const savedWorld = store.saveWorldPreference({ worldKey: "wrld_11111111-2222-3333-4444-555555555555", favorite: true, note: "Return later" });
  assert.equal(savedWorld.entity.favorite, 1);
  const backup = store.exportData({ language: "ru", secret: undefined });
  assert.equal(backup.format, "vrchat-admin-tools-local-backup");
  importedStore = new LocalCompanionStore(path.join(tempRoot, "imported.sqlite"));
  const imported = importedStore.importData(backup);
  assert.equal(imported.importedSessions, 1);
  assert.equal(importedStore.details("player", "usr_demo").entity.note, "Local note");
  assert.equal(importedStore.details("world", "wrld_11111111-2222-3333-4444-555555555555").entity.favorite, 1);

  const salt = "test-policy-salt";
  const protectedUserHash = createHash("sha256").update(`${salt}:usr_demo`).digest("hex");
  store.applyProtectionPolicy({ salt, userIdHashes: [protectedUserHash], avatarIdHashes: [] });
  assert.equal(store.search("Demo Avatar").avatars.length, 0);
});

test("beta preload exposes local companion search without exposing SQLite", () => {
  const preload = read("apps/client/src/preload.js");
  const main = read("apps/client/src/main.js");

  assert.match(preload, /searchCompanion: \(query\) => ipcRenderer\.invoke\("companion:search", query\)/u);
  assert.match(preload, /getCompanionDetails: \(kind, key\) => ipcRenderer\.invoke\("companion:details", kind, key\)/u);
  assert.match(main, /ipcMain\.handle\("companion:search"/u);
  assert.match(main, /ipcMain\.handle\("companion:details"/u);
  assert.match(preload, /saveLocalPlayerPreference/u);
  assert.match(preload, /exportLocalData/u);
  assert.match(preload, /clearLocalDataCategory/u);
  assert.match(preload, /saveTextFile/u);
  assert.match(preload, /updateModerationAppeal/u);
  assert.match(preload, /selectVrchatAvatar/u);
  assert.match(preload, /getVrchatSocialSummary/u);
  assert.match(preload, /getVrchatUserProfile/u);
  assert.match(preload, /getVrchatGroup/u);
  assert.match(preload, /getVrchatPersonalCollection/u);
  assert.match(preload, /listLocalSocialEvents/u);
  assert.match(main, /ipcMain\.handle\("companion:export"/u);
  assert.match(main, /ipcMain\.handle\("companion:clear-category"/u);
  assert.match(main, /ipcMain\.handle\("file:save-text"/u);
  assert.match(main, /ipcMain\.handle\("moderation:update-appeal"/u);
  assert.match(main, /ipcMain\.handle\("vrchat:avatar-select"/u);
  assert.match(main, /ipcMain\.handle\("vrchat:social-summary"/u);
  assert.match(main, /ipcMain\.handle\("vrchat:user-profile"/u);
  assert.match(main, /recordSocialSnapshot/u);
});

test("beta records complete friend snapshots locally without false removals", (context) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vrchat-companion-social-"));
  const store = new LocalCompanionStore(path.join(tempRoot, "companion.sqlite"));
  context.after(() => {
    store.close();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });
  const first = store.recordSocialSnapshot({
    completeFriends: true,
    fetchedAt: "2026-08-12T10:00:00.000Z",
    friends: [{ userId: "usr_demo", displayName: "Demo", status: "active", online: true, location: "wrld_demo:1" }]
  });
  assert.equal(first.baselineCreated, true);
  assert.equal(store.listSocialEvents().length, 0);
  store.recordSocialSnapshot({
    completeFriends: false,
    fetchedAt: "2026-08-12T10:01:00.000Z",
    friends: []
  });
  assert.equal(store.listSocialEvents().length, 0);
  store.recordSocialSnapshot({
    completeFriends: true,
    fetchedAt: "2026-08-12T10:02:00.000Z",
    friends: [{ userId: "usr_demo", displayName: "Demo", status: "offline", online: false, location: "" }]
  });
  assert.equal(store.listSocialEvents()[0].event_type, "offline");
  const backup = store.exportData();
  assert.equal(backup.socialFriends.length, 1);
  assert.equal(backup.socialEvents.length, 1);
});

test("beta records realtime friend profile and avatar changes from the VRChat pipeline", (context) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vrchat-companion-pipeline-"));
  const store = new LocalCompanionStore(path.join(tempRoot, "companion.sqlite"));
  context.after(() => {
    store.close();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });
  store.recordSocialSnapshot({
    completeFriends: true,
    fetchedAt: "2026-09-19T10:00:00.000Z",
    friends: [{ userId: "usr_demo", displayName: "Demo", status: "active", statusDescription: "Old", bio: "Before", avatarId: "avtr_old", online: true }]
  });
  const result = store.recordSocialPipelineEvent({
    type: "friend-update",
    occurredAt: "2026-09-19T10:01:00.000Z",
    content: { userId: "usr_demo", user: { id: "usr_demo", displayName: "Demo", status: "active", statusDescription: "New", bio: "After", currentAvatar: "avtr_new" } }
  });
  assert.equal(result.events, 3);
  assert.deepEqual(new Set(store.listSocialEvents().map((row) => row.event_type)), new Set(["status-description", "avatar", "bio"]));
});

test("beta mirrors paid sessions locally without losing private event details", (context) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vrchat-companion-paid-mirror-"));
  const store = new LocalCompanionStore(path.join(tempRoot, "companion.sqlite"));
  context.after(() => {
    store.close();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  const sessionId = "server-session-demo";
  assert.equal(store.ensureSession(sessionId, { worldName: "Paid World", startedAt: "2026-08-12T12:00:00.000Z" }).ok, true);
  assert.equal(store.updateSession(sessionId, {
    worldName: "Paid World",
    snapshot: {
      players: [{ userId: "usr_paid", displayName: "Paid Player" }],
      playerEvents: [{ type: "player-joined", userId: "usr_paid", displayName: "Paid Player", seenAt: "2026-08-12T12:01:00.000Z", worldName: "Paid World" }]
    }
  }).ok, true);
  store.ingestSessions([{
    id: sessionId,
    started_at: "2026-08-12T12:00:00.000Z",
    world_name: "Paid World",
    snapshot: { players: [{ userId: "usr_paid", displayName: "Paid Player" }] }
  }]);

  assert.equal(store.details("player", "usr_paid").events.length, 1);
});

test("beta auto setting analyzes only the current log before following new events", () => {
  const renderer = read("apps/client-beta/renderer/app.js");
  const markup = read("apps/client-beta/renderer/index.html");

  assert.match(markup, /name="autoAnalyzeCurrentLog"/u);
  assert.match(markup, /Автоматически анализировать текущий лог/u);
  assert.doesNotMatch(markup, /name="autoStart"/u);
  assert.match(renderer, /autoAnalyzeCurrentLog: false/u);
  assert.match(renderer, /mode: "current"/u);
  assert.match(renderer, /maxFiles: 1/u);
  assert.doesNotMatch(renderer, /scope: "all"/u);
  assert.match(renderer, /analyzeCurrentLogAutomatically\(\)/u);
  assert.match(renderer, /source\.autoAnalyzeToday/u);
  assert.match(renderer, /delete next\.autoAnalyzeToday/u);
  assert.doesNotMatch(renderer, /state\.uiSettings\.autoStart/u);
});

test("beta can recover monitoring after an unexpected stop without overriding manual Stop", () => {
  const renderer = read("apps/client-beta/renderer/app.js");
  const markup = read("apps/client-beta/renderer/index.html");

  assert.match(markup, /name="protectMonitoring"/u);
  assert.match(renderer, /protectMonitoring: true/u);
  assert.match(renderer, /function scheduleMonitoringRestart\(reason/u);
  assert.match(renderer, /function restartMonitoringAfterFailure\(\)/u);
  assert.match(renderer, /state\.monitoringStopRequested = true/u);
  assert.match(renderer, /!state\.monitoringStopRequested && !state\.monitoringTransition/u);
});

test("beta analyzes the latest current log from the primary action and keeps source choices separate", () => {
  const renderer = read("apps/client-beta/renderer/app.js");
  const markup = read("apps/client-beta/renderer/index.html");

  assert.match(markup, /data-action="choose" title="Выбрать источник и глубину анализа"/u);
  assert.match(markup, /data-action="analyze" title="Проанализировать текущий лог"/u);
  assert.match(renderer, /choose: analyzeLog/u);
  assert.match(renderer, /analyze: analyzeCurrentLogAutomatically/u);
  assert.match(renderer, /const latest = await api\.latestFile\(\);\s+const filePath = latest\?\.filePath \|\| "";/u);
  assert.doesNotMatch(renderer, /async function chooseLog/u);
});

test("beta distinguishes missing VRChat cookie from license access errors", () => {
  const renderer = read("apps/client-beta/renderer/app.js");

  assert.match(renderer, /formatVrchatAuthError\(value, true\)/u);
  assert.match(renderer, /VRChat auth cookie is not configured/u);
  assert.match(renderer, /Аккаунт VRChat не подключён\. Нажмите кнопку «VRChat» и войдите в аккаунт/u);
  assert.match(renderer, /VRChat \(\?:account \)\?session is invalid/u);
  assert.match(renderer, /VRChat user profile is unavailable\|VRChat API HTTP 401/u);
  assert.match(renderer, /state\.avatarOnlineError = friendlyStatusMessage\(error\?\.message, true\)/u);
});

test("beta keeps the collapsed rail centered and shortens the visible log path", () => {
  const markup = read("apps/client-beta/renderer/index.html");
  const renderer = read("apps/client-beta/renderer/app.js");
  const styles = read("apps/client-beta/renderer/styles.css");
  assert.match(renderer, /state\.filePath\.split\(\/\[\\\\\/\]\/u\)/u);
  assert.match(styles, /\.appShell\.uiChromeCollapsed \.navItem \{[\s\S]*?margin-inline: auto/u);
  assert.match(styles, /\.appShell\.uiChromeCollapsed \.railActionsToggle \{[\s\S]*?width: 42px;[\s\S]*?min-height: 42px/u);
  assert.match(styles, /\.appShell\.uiChromeCollapsed \.windowActions button \{[^}]*width: 42px;[^}]*min-height: 42px/u);
  assert.match(styles, /\.appShell\.uiChromeCollapsed \.workspaceModeSwitch button::before,[\s\S]*?\.appShell\.uiChromeCollapsed \.navItem::before \{[\s\S]*?top: 50%;[\s\S]*?left: 50%;[\s\S]*?transform: translate\(-50%, -50%\)/u);
  assert.match(markup, /data-vrchat-account-open/u);
  assert.match(styles, /\.insightSessionsLayout \{[^}]*repeat\(2, minmax\(0, 1fr\)\)/u);
});

test("beta VRChat authentication has a dedicated dialog outside general settings", () => {
  const markup = read("apps/client-beta/renderer/index.html");
  const renderer = read("apps/client-beta/renderer/app.js");
  const settingsBlock = markup.match(/<dialog class="settingsDialog" data-settings-dialog>[\s\S]*?<\/dialog>/u)?.[0] || "";
  const authBlock = markup.match(/<dialog class="settingsDialog vrchatAuthDialog" data-vrchat-auth-dialog>[\s\S]*?<\/dialog>/u)?.[0] || "";

  assert.doesNotMatch(settingsBlock, /data-vrchat-login/u);
  assert.match(authBlock, /data-vrchat-account-connect/u);
  assert.match(authBlock, /data-vrchat-login/u);
  assert.match(renderer, /function openVrchatAuth\(\)/u);
  assert.match(renderer, /button\.dataset\.connected = hasStoredCookie/u);
});

test("beta saved worlds expose safe page and launch actions", () => {
  const renderer = read("apps/client-beta/renderer/app.js");

  assert.match(renderer, /dataset\.worldPage = safeWorldId/u);
  assert.match(renderer, /dataset\.worldLaunch = safeWorldId/u);
  assert.match(renderer, /https:\/\/vrchat\.com\/home\/world\/\$\{safeWorldId\}/u);
  assert.match(renderer, /https:\/\/vrchat\.com\/home\/launch\?worldId=\$\{safeWorldId\}/u);
  assert.match(renderer, /savedWorldActions\(session\.worldId\)/u);
});

test("beta Builder supports editable dashboards and a locked compact overlay", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client-beta/renderer/app.js"), "utf8");
  const markup = fs.readFileSync(path.join(__dirname, "../apps/client-beta/renderer/index.html"), "utf8");
  const styles = fs.readFileSync(path.join(__dirname, "../apps/client-beta/renderer/styles.css"), "utf8");

  assert.match(markup, /option value="freeform"/u);
  assert.match(markup, /option value="adaptive"/u);
  assert.match(markup, /data-builder-apply-preset/u);
  assert.match(markup, /data-builder-snap/u);
  assert.match(markup, /data-builder-overlay-toggle/u);
  assert.match(markup, /data-compact-menu/u);
  assert.match(markup, /data-compact-menu-toggle/u);
  assert.match(markup, /data-compact-menu-toggle[^>]*>[\s\S]*?<span aria-hidden="true"><\/span>/u);
  assert.match(markup, /data-compact-return-builder/u);
  assert.match(markup, /data-builder-workspace/u);
  assert.match(markup, /data-builder-inspector/u);
  assert.match(renderer, /header\.dataset\.builderMove = kind/u);
  assert.match(renderer, /for \(const corner of \["nw", "ne", "sw", "se"\]\)/u);
  assert.match(renderer, /function startBuilderInteraction\(event\)/u);
  assert.match(renderer, /function moveBuilderInteraction\(event\)/u);
  assert.match(renderer, /betaBuilderGeometry/u);
  assert.match(renderer, /betaBuilderQueries/u);
  assert.match(renderer, /betaBuilderBlockSettings/u);
  assert.match(renderer, /BUILDER_SNAP_SIZE/u);
  assert.match(renderer, /const effectiveLayout = state\.builderCompact \? "adaptive" : state\.builderLayout/u);
  assert.match(renderer, /document\.documentElement\.classList\.toggle\("compactMode", state\.builderCompact\)/u);
  assert.match(renderer, /state\.builderCompact \|\| state\.builderLayout !== "freeform"/u);
  assert.match(renderer, /dataset\.builderBlockAction = "lock"/u);
  assert.match(renderer, /dataset\.builderBlockAction = "collapse"/u);
  assert.match(renderer, /dataset\.builderBlockAction = "hide"/u);
  assert.match(renderer, /dataset\.builderBlockOpacity = kind/u);
  assert.match(renderer, /dataset\.builderBlockLimit = kind/u);
  assert.match(renderer, /function setBuilderOverlayHidden/u);
  assert.match(renderer, /builderCompactMenuOpen/u);
  assert.match(renderer, /betaBuilderCompactHintSeen/u);
  assert.match(renderer, /builderCompactHintTimer = window\.setTimeout\([\s\S]*?5000\)/u);
  assert.match(renderer, /compactMenu\?\.classList\.toggle\("hintVisible"/u);
  assert.match(styles, /\.appShell\.compactMode \.compactMenuHandle\s*\{[\s\S]*?width:\s*60px;[\s\S]*?height:\s*14px;/u);
  assert.match(styles, /\.appShell\.compactMode \.compactMenuHandle > span\s*\{[\s\S]*?rotate\(45deg\)/u);
  assert.match(styles, /@keyframes compactMenuHint/u);
  assert.match(styles, /\.compactMenuDock\.hintVisible:not\(\.menuOpen\) \.compactMenuHandle/u);
  assert.match(renderer, /selectView\("builder"\)/u);
  assert.match(renderer, /dataset\.builderFontAdjust/u);
  assert.match(renderer, /dataset\.builderAdminUser = item\.userId/u);
  assert.match(renderer, /dataset\.builderSessionUser = item\.userId/u);
  assert.match(renderer, /dataset\.builderAvatarKey = avatarModel\.key/u);
  assert.match(renderer, /function renderBuilderInspector\(\)/u);
  assert.match(renderer, /dataset\.builderInspectorKind = kind/u);
  assert.match(renderer, /data-builder-inspector-full/u);
  assert.match(renderer, /function closeBuilderInspector\(\)/u);
  assert.doesNotMatch(renderer, /const builderAdminUser[\s\S]{0,220}openPlayerInAdmin/u);
  assert.match(renderer, /function renderBuilderBlockRows\(kind\)/u);
  assert.match(styles, /\.builderResizeHandle\.se/u);
  assert.match(styles, /\.betaBuilder\.freeform/u);
  assert.match(styles, /\.betaBuilder\.adaptive/u);
  assert.match(styles, /repeat\(auto-fit, minmax\(min\(280px, 100%\), 1fr\)\)/u);
  assert.match(styles, /\.builderBlockSearch/u);
  assert.match(styles, /\.builderBlockMenuBody/u);
  assert.match(styles, /\.appShell\.compactMode \.uiChrome/u);
  assert.match(styles, /\.compactMenuDock\.menuOpen \.compactMenuPanel/u);
  assert.match(styles, /\.appShell\.compactMode\.builderOverlayHidden \.betaBuilder/u);
  assert.match(styles, /\.builderInspector/u);
  assert.match(styles, /\.appShell\.compactMode \.builderInspector/u);
});

test("beta Social exposes internal profiles, locations, friend log, and on-demand VRChat collections", () => {
  const html = read("apps/client-beta/renderer/index.html");
  const script = read("apps/client-beta/renderer/app.js");
  assert.match(html, /data-social-tab="locations"/u);
  assert.doesNotMatch(html, /data-social-tab="journal"/u);
  assert.match(html, /data-friend-activity-feed/u);
  assert.match(script, /function renderFriendActivityFeed/u);
  assert.match(html, /data-social-tab="vrchat-favorites"/u);
  assert.match(html, /data-social-detail-dialog/u);
  assert.match(script, /function openSocialProfile/u);
  assert.match(script, /function friendPortraitElement/u);
  assert.match(script, /socialGroupBanner/u);
  assert.match(script, /worldPortrait/u);
  assert.match(script, /avatarPortrait/u);
  assert.match(script, /profileImageUrl/u);
  assert.match(script, /function openSocialGroup/u);
  assert.match(script, /getVrchatPersonalCollection/u);
  assert.match(script, /socialProfileActionMenu/u);
  assert.match(script, /socialProfileColumns/u);
  assert.match(script, /function socialProfileLocation/u);
  assert.match(script, /location\.detail/u);
  assert.doesNotMatch(script, /\["Локация", profile\?\.location/u);
  assert.match(script, /primaryColumn\.append\(details\)/u);
  assert.match(script, /secondaryColumn\.append\(groups\)/u);
  assert.match(script, /dataset\.socialCopyUser = userId/u);
  assert.match(script, /dataset\.socialLocalStatus = userId/u);
  assert.match(script, /dataset\.socialAdminPlayer = userId/u);
  assert.match(script, /dataset\.socialOwnerPlayer = userId/u);
  assert.doesNotMatch(script, /data-social-profile[\s\S]{0,400}openExternal/u);
});

test("beta workspace supports multiple saved dashboards and social widgets", () => {
  const html = read("apps/client-beta/renderer/index.html");
  const script = read("apps/client-beta/renderer/app.js");
  assert.match(html, /data-builder-dashboard/u);
  assert.match(html, /value="friends"/u);
  assert.match(html, /value="friendlog"/u);
  assert.match(script, /betaBuilderDashboards/u);
  assert.match(script, /function createBuilderDashboard/u);
  assert.match(script, /function loadBuilderDashboard/u);
});

test("beta avatar catalog visibly reflects the server-enforced key scope", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client-beta/renderer/app.js"), "utf8");
  const markup = fs.readFileSync(path.join(__dirname, "../apps/client-beta/renderer/index.html"), "utf8");

  assert.match(markup, /data-avatar-catalog-scope/u);
  assert.match(renderer, /state\.settings\?\.license\?\.canViewFullAvatarCatalog/u);
  assert.match(renderer, /fullCatalog \? "Каталог команды" : "Личный каталог"/u);
});

test("beta avatar views omit redacted avatar events", () => {
  const avatarModel = require("../apps/client-beta/renderer/avatar-model");
  const sessionModel = require("../apps/client-beta/renderer/session-model");
  const redacted = {
    type: "avatar-data",
    category: "avatars",
    userId: "usr_1373af91-5e80-42c5-94c1-3d6edb05f2fc",
    avatarName: "Hidden Avatar",
    avatarId: "avtr_11111111-2222-3333-4444-555555555555",
    avatarRedacted: true
  };

  assert.deepEqual(avatarModel.buildRows([redacted], [], []), []);
  assert.equal(sessionModel.buildAvatarSummary([redacted]).events, 0);
});

test("beta Owner preserves Stable watchlist, incident copy, and moderation overview actions", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client-beta/renderer/app.js"), "utf8");
  const styles = fs.readFileSync(path.join(__dirname, "../apps/client-beta/renderer/styles.css"), "utf8");

  assert.match(renderer, /function renderOwnerOverview\(\)/u);
  assert.match(renderer, /function toggleOwnerWatch\(userId\)/u);
  assert.match(renderer, /function ownerIncidentReport\(userId\)/u);
  assert.match(renderer, /dataset\.ownerWatch = player\.userId/u);
  assert.match(renderer, /dataset\.ownerCopyIncident = player\.userId/u);
  assert.match(renderer, /Общая лента инцидентов/u);
  assert.match(renderer, /Проверка правила до включения/u);
  assert.match(renderer, /dataset\.appealSave/u);
  assert.match(styles, /\.ownerOverviewMetrics/u);
  assert.match(styles, /\.ownerWatchRow/u);
  assert.match(styles, /\.ownerPolicyControls/u);
});

test("beta exposes private cleanup, anonymized reports, and richer avatar metadata", () => {
  const markup = read("apps/client-beta/renderer/index.html");
  const renderer = read("apps/client-beta/renderer/app.js");
  const styles = read("apps/client-beta/renderer/styles.css");

  assert.match(markup, /data-local-clear="history"/u);
  assert.match(markup, /data-local-clear="all"/u);
  assert.match(renderer, /function historySessionReport\(/u);
  assert.match(renderer, /dataset\.historyHideNames/u);
  assert.match(renderer, /exportHistorySession/u);
  assert.match(renderer, /profile\.packages/u);
  assert.match(renderer, /vrchatCosmeticPreview/u);
  assert.match(styles, /\.avatarPackageCard/u);
  assert.match(styles, /\.vrchatCosmeticPreview/u);
});

test("beta player profile exposes confirmed avatar history without inventing missing ids", () => {
  const renderer = read("apps/client-beta/renderer/app.js");
  const styles = read("apps/client-beta/renderer/styles.css");

  assert.match(renderer, /function socialAvatarHistory\(/u);
  assert.match(renderer, /data\.socialAvatarToggle|dataset\.socialAvatarToggle/u);
  assert.match(renderer, /VRChat передал только изображение — Avatar ID неизвестен/u);
  assert.match(renderer, /dataset\.avatarSelect/u);
  assert.match(renderer, /api\.selectVrchatAvatar/u);
  assert.match(styles, /\.socialAvatarHistoryRow/u);
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
  assert.match(performanceCheck, /avatarCatalogTotal < 900/u);
  assert.match(performanceCheck, /avatarRows > 40/u);
  assert.match(performanceCheck, /totalDomNodes > 1200/u);
  assert.match(performanceCheck, /BETA_PREVIEW_CLICK_SELECTOR/u);
  assert.match(performanceCheck, /BETA_PREVIEW_EXPECT_TEXT/u);
  assert.match(performanceCheck, /BETA_PREVIEW_EXPECT_SELECTOR/u);
});

test("beta avoids expensive full-screen blur and virtualizes data-heavy social lists", () => {
  const css = read("apps/client-beta/renderer/styles.css");
  const script = read("apps/client-beta/renderer/app.js");

  assert.doesNotMatch(css, /settingsDialog::backdrop\s*\{[^}]*backdrop-filter/su);
  assert.doesNotMatch(css, /playerDrawerBackdrop\s*\{[^}]*backdrop-filter/su);
  assert.match(script, /function renderVirtualSocialRows\(/u);
  assert.match(script, /renderVirtualSocialRows\(friendList, sortedFriends/u);
  assert.match(script, /renderVirtualSocialRows\(list, state\.socialEvents\.slice\(0, 500\)/u);
  assert.match(script, /playerActivityCache: new Map\(\)/u);
});

test("beta settings stay accessible in small scaled windows", () => {
  const css = read("apps/client-beta/renderer/styles.css");
  const script = read("apps/client-beta/renderer/app.js");

  assert.match(script, /const unscaledViewport = 100 \/ scale/u);
  assert.match(script, /--ui-viewport-width/u);
  assert.match(script, /--ui-viewport-height/u);
  assert.match(css, /\.settingsDialog\s*\{[^}]*var\(--ui-viewport-width[^}]*var\(--ui-viewport-height/su);
  assert.match(css, /\.settingsGrid\s*\{[^}]*min-height:\s*0[^}]*overflow-y:\s*auto/su);
  assert.match(css, /\.settingsDialog footer\s*\{[^}]*flex-wrap:\s*wrap/su);
  assert.match(css, /@container settings-dialog \(max-width:\s*520px\)/u);
});
