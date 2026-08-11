"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const {
  isVrchatLogPath,
  normalizeTrustedServerUrl,
  requireAllowedExternalHttpsUrl
} = require("../apps/client/src/security");

const SERVER_URL = "https://service.example";

test("client always uses the trusted production server", () => {
  const retired = new Set(["https://old.example"]);
  assert.equal(normalizeTrustedServerUrl(SERVER_URL, SERVER_URL, retired), SERVER_URL);
  assert.equal(normalizeTrustedServerUrl(`${SERVER_URL}/`, SERVER_URL, retired), SERVER_URL);
  assert.equal(normalizeTrustedServerUrl("https://attacker.example", SERVER_URL, retired), SERVER_URL);
  assert.equal(normalizeTrustedServerUrl("https://old.example", SERVER_URL, retired), SERVER_URL);
});

test("external links require HTTPS and an exact allowlisted host", () => {
  const hosts = new Set(["vrchat.com", "discord.gg"]);
  assert.equal(requireAllowedExternalHttpsUrl("https://vrchat.com/home", hosts).hostname, "vrchat.com");
  assert.throws(() => requireAllowedExternalHttpsUrl("http://vrchat.com/home", hosts));
  assert.throws(() => requireAllowedExternalHttpsUrl("https://vrchat.com.attacker.example/home", hosts));
  assert.throws(() => requireAllowedExternalHttpsUrl("https://attacker.example/?next=vrchat.com", hosts));
});

test("automatic log access stays inside the VRChat log directory", () => {
  const logs = path.resolve("C:/Users/example/AppData/LocalLow/VRChat/VRChat");
  assert.equal(isVrchatLogPath(path.join(logs, "output_log_2026-07-11.txt"), logs), true);
  assert.equal(isVrchatLogPath(path.join(logs, "settings.json"), logs), false);
  assert.equal(isVrchatLogPath(path.resolve(logs, "..", "output_log_stolen.txt"), logs), false);
});

test("today player catalog uses a pathless Electron bridge and exposes online filters", () => {
  const markup = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/index.html"), "utf8");
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");
  const preload = fs.readFileSync(path.join(__dirname, "../apps/client/src/preload.js"), "utf8");
  const main = fs.readFileSync(path.join(__dirname, "../apps/client/src/main.js"), "utf8");

  assert.match(markup, /id="adminOnlineFilter"/u);
  assert.match(markup, /id="ownerOnlineFilter"/u);
  assert.match(markup, /id="adminReadTodayPlayersBtn"/u);
  assert.match(renderer, /clientApi\.readTodayPlayers\(\)/u);
  assert.match(preload, /readTodayPlayers:\s*\(\) => ipcRenderer\.invoke\("tail:read-today-players"\)/u);
  assert.match(main, /tail:read-today-players[\s\S]*?readTodayPlayers\(defaultLogDirectory\(\)/u);
});

test("Stable announces the separate Beta download without replacing Stable", () => {
  const markup = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/index.html"), "utf8");
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");
  const main = fs.readFileSync(path.join(__dirname, "../apps/client/src/main.js"), "utf8");

  assert.match(markup, /id="betaPromo"/u);
  assert.match(markup, /Stable останется отдельным приложением/u);
  assert.match(renderer, /https:\/\/vrchatadmintools\.ru\/download-beta/u);
  assert.match(renderer, /stableBetaPromoDismissed-1\.2/u);
  assert.match(main, /"vrchatadmintools\.ru"/u);
});

test("large historical player catalogs are paged and cached before rendering", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");

  assert.match(renderer, /PLAYER_LIST_PAGE_SIZE = 100/u);
  assert.match(renderer, /BUILDER_PLAYER_LIMIT = 250/u);
  assert.match(renderer, /paged\.rows\.map\(\(summary\) =>/u);
  assert.match(renderer, /historicalPlayerSummaryList\(\)[\s\S]*?mergePlayerSummaries/u);
  assert.match(renderer, /rememberKnownPlayer\(event, \{ invalidateHistory: false \}\)/u);
});

test("renderer copies text through the Electron bridge", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");
  const preload = fs.readFileSync(path.join(__dirname, "../apps/client/src/preload.js"), "utf8");
  const main = fs.readFileSync(path.join(__dirname, "../apps/client/src/main.js"), "utf8");

  assert.doesNotMatch(renderer, /navigator\.clipboard/u);
  assert.match(renderer, /clientApi\.writeClipboardText/u);
  assert.match(preload, /clipboard:write-text/u);
  assert.match(main, /clipboard\.writeText/u);
});

test("renderer requests Windows notifications through the Electron bridge", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");
  const preload = fs.readFileSync(path.join(__dirname, "../apps/client/src/preload.js"), "utf8");
  const main = fs.readFileSync(path.join(__dirname, "../apps/client/src/main.js"), "utf8");

  assert.doesNotMatch(renderer, /new Notification/u);
  assert.match(renderer, /clientApi\.showNotification/u);
  assert.match(preload, /notification:show/u);
  assert.match(main, /Notification\.isSupported/u);
});

test("always-on-top opacity stays behind IPC and resets when unpinned", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");
  const preload = fs.readFileSync(path.join(__dirname, "../apps/client/src/preload.js"), "utf8");
  const main = fs.readFileSync(path.join(__dirname, "../apps/client/src/main.js"), "utf8");

  assert.match(renderer, /clientApi\.setWindowOpacity/u);
  assert.match(preload, /window:set-opacity/u);
  assert.match(main, /MIN_WINDOW_OPACITY = 0\.4/u);
  assert.match(main, /setOpacity\(alwaysOnTopEnabled \? preferredWindowOpacity : 1\)/u);
});

test("background log events are coalesced until the window is visible", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");
  const main = fs.readFileSync(path.join(__dirname, "../apps/client/src/main.js"), "utf8");

  assert.match(main, /backgroundThrottling:\s*false/u);
  assert.match(renderer, /if \(document\.hidden \|\| state\.renderSuspended\) \{\s*state\.renderDeferred = true;/u);
  assert.match(renderer, /function scheduleResumeRefresh\(\)/u);
  assert.match(renderer, /Promise\.allSettled\(\[/u);
  assert.match(renderer, /CRASH_BUFFER_SAVE_DELAY_MS = 500/u);
  assert.equal((renderer.match(/localStorage\.setItem\("crashEventBuffer"/gu) || []).length, 1);
});

test("silent VRChat logs produce a five minute warning instead of a crash incident", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");

  assert.match(renderer, /CRASH_LOG_SILENCE_WARNING_MS = 5 \* 60 \* 1000/u);
  assert.doesNotMatch(renderer, /createCrashIncident\("Возможный фриз/u);
});

test("renderer can clear crash history without deleting the live event buffer", () => {
  const html = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/index.html"), "utf8");
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");
  const clearHandlerStart = renderer.indexOf('clearCrashHistoryBtn?.addEventListener("click"');
  const clearHandlerEnd = renderer.indexOf("\n});", clearHandlerStart);

  assert.match(html, /id="clearCrashHistoryBtn"/u);
  assert.notEqual(clearHandlerStart, -1);
  assert.notEqual(clearHandlerEnd, -1);

  const clearHandler = renderer.slice(clearHandlerStart, clearHandlerEnd + 4);
  assert.match(clearHandler, /state\.crashIncidents = \[\];\s*saveCrashState\(\);\s*renderCrashAnalyzer\(\);/u);
  assert.doesNotMatch(clearHandler, /state\.crashEventBuffer = \[\]/u);
});

test("admin and owner cards expose explicit player deselection controls", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");

  assert.match(renderer, /data-clear-admin-selection/u);
  assert.match(renderer, /state\.selectedUserId = "";\s*renderAdminTools\(\);/u);
  assert.match(renderer, /data-clear-owner-selection/u);
  assert.match(renderer, /state\.ownerSelectedUserId = "";\s*renderOwnerTools\(\);/u);
});

test("global avatar notes use the Electron bridge and require a confirmed avatar id", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");
  const preload = fs.readFileSync(path.join(__dirname, "../apps/client/src/preload.js"), "utf8");
  const main = fs.readFileSync(path.join(__dirname, "../apps/client/src/main.js"), "utf8");

  assert.match(renderer, /clientApi\.saveGlobalAvatarNote/u);
  assert.match(renderer, /Для общей публикации нужен подтверждённый Avatar ID/u);
  assert.match(preload, /global-avatar-notes:save/u);
  assert.match(preload, /global-avatar-notes:remove/u);
  assert.match(main, /\/global-avatar-notes\/\$\{encodeURIComponent\(avatarId\)\}/u);
});

test("owner tools refresh shared notes and show non-default player marks", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");

  assert.match(
    renderer,
    /activePaneName\(\) === "owner" && !isEditingAdminPlayer\(state\.ownerSelectedUserId\)[\s\S]*?renderWhenVisible\(renderOwnerTools\)/u
  );
  assert.match(
    renderer,
    /data-owner-user-id[\s\S]*?\$\{status\}/u
  );
  assert.match(renderer, /if \(activePaneName\(\) === "owner"\) renderOwnerTools\(\);/u);
});

test("owner moderation dashboard uses IPC for retries, reports, and watch state", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");
  const preload = fs.readFileSync(path.join(__dirname, "../apps/client/src/preload.js"), "utf8");
  const main = fs.readFileSync(path.join(__dirname, "../apps/client/src/main.js"), "utf8");

  assert.match(renderer, /function ownerOverviewHtml\(\)/u);
  assert.match(renderer, /function ownerIncidentReport\(userId\)/u);
  assert.match(renderer, /data-owner-watch/u);
  assert.match(renderer, /MODERATION_REASON_TEMPLATES/u);
  assert.match(renderer, /function moderationDurationMinutes\(\)/u);
  assert.match(renderer, /minutes < 5 \|\| minutes > 30 \* 24 \* 60/u);
  assert.match(renderer, /data-owner-unban/u);
  assert.match(renderer, /eventAction--success/u);
  assert.match(renderer, /moderationRequestAction:\s*"ban"/u);
  assert.match(renderer, /requestGroupUnban/u);
  assert.match(renderer, /revoked: "Разбанен"/u);
  assert.match(renderer, /moderationAction\(request\) === "ban"[\s\S]*?request\.status === "succeeded"/u);
  assert.match(renderer, /retryGroupBanRequest/u);
  assert.match(preload, /requestGroupUnban:[\s\S]*?moderation:request-group-unban/u);
  assert.match(preload, /moderation:retry-group-ban-request/u);
  assert.match(main, /moderation:request-group-unban[\s\S]*?\/moderation\/unban-requests/u);
  assert.match(main, /\/moderation\/ban-requests\/\$\{encodeURIComponent\(safeRequestId\)\}\/retry/u);
});

test("owner group management stays behind IPC and requires explicit confirmations", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");
  const preload = fs.readFileSync(path.join(__dirname, "../apps/client/src/preload.js"), "utf8");
  const main = fs.readFileSync(path.join(__dirname, "../apps/client/src/main.js"), "utf8");
  const styles = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/styles.css"), "utf8");
  const markup = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/index.html"), "utf8");

  assert.match(renderer, /requestGroupManagement/u);
  assert.match(renderer, /data-group-role-add/u);
  assert.match(renderer, /data-group-role-remove/u);
  assert.match(renderer, /data-group-member-notes-save/u);
  assert.match(renderer, /data-group-member-kick/u);
  assert.match(renderer, /window\.confirm\(`Исключить/u);
  assert.match(preload, /group-management:request/u);
  assert.match(preload, /group-management:list-requests/u);
  assert.match(main, /\/group-management\/requests/u);
  assert.match(styles, /\.ownerPane \.paneHeader\s*\{[^}]*height:\s*auto/isu);
  assert.match(styles, /\.ownerPane \.adminHeaderActions\s*\{[^}]*grid-template-columns:/isu);
  assert.match(renderer, /ownerSource:\s*"logs"/u);
  assert.match(markup, /<option value="logs" selected>Игроки из логов<\/option>/u);
  assert.doesNotMatch(renderer, /api\.vrchat\.cloud/u);
});

test("license admin separates bans from granular group management permissions", () => {
  const markup = fs.readFileSync(path.join(__dirname, "../apps/admin/renderer/index.html"), "utf8");
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/admin/renderer/renderer.js"), "utf8");
  const styles = fs.readFileSync(path.join(__dirname, "../apps/admin/renderer/styles.css"), "utf8");

  assert.match(renderer, /data-owner-ban-access/u);
  assert.match(renderer, /data-group-view/u);
  assert.match(renderer, /data-group-roles/u);
  assert.match(renderer, /data-group-kick/u);
  assert.match(renderer, /data-save-group-access/u);
  assert.match(renderer, /canViewGroupMembers/u);
  assert.match(renderer, /canManageGroupRoles/u);
  assert.match(renderer, /canKickGroupMembers/u);
  assert.match(markup, /id="licenseSearch"/u);
  assert.match(markup, /value="attention"/u);
  assert.match(markup, /id="licenseSort"[\s\S]*value="newest"[\s\S]*value="oldest"/u);
  assert.match(renderer, /const sortMode = licenseSort\?\.value \|\| "newest"/u);
  assert.match(renderer, /sortMode === "attention"/u);
  assert.match(renderer, /sortMode === "oldest"/u);
  assert.match(renderer, /class="licensePermissionDetails"/u);
  assert.match(renderer, /class="licenseSupportDetails"/u);
  assert.match(renderer, /popoverSummary/u);
  assert.match(styles, /\.ownerCell\s*\{[^}]*position:\s*absolute/isu);
  assert.match(styles, /\.ownerCell\s*\{[^}]*grid-template-columns:\s*repeat\(2/isu);
  assert.match(styles, /\.licenseSupportDetails\s*>\s*div\s*\{[^}]*position:\s*absolute/isu);
  assert.match(styles, /\.groupAccessCard\s*\{[^}]*border:[^}]*217,\s*83,\s*79/isu);
  assert.match(styles, /\.groupAccessButton/isu);
});

test("ordinary licensed users get personal VRChat insights without Owner access", () => {
  const markup = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/index.html"), "utf8");
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");
  const insights = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/my-vrchat-insights.js"), "utf8");

  assert.match(markup, /data-tab="insights"[^>]*>Мой VRChat</u);
  assert.match(markup, /data-pane="insights"/u);
  assert.match(markup, /my-vrchat-insights\.js/u);
  assert.match(renderer, /window\.myVrchatInsights\.buildMyVrchatInsights/u);
  assert.match(renderer, /window\.clientApi\.listPlaySessions/u);
  assert.match(renderer, /const playerStats = computePlayerStats\(state\.events\);/u);
  assert.match(insights, /recurringPlayerCount/u);
});

test("public client does not expose an internal moderation bot name", () => {
  const renderer = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/renderer.js"), "utf8");
  const markup = fs.readFileSync(path.join(__dirname, "../apps/client/renderer/index.html"), "utf8");

  assert.doesNotMatch(renderer, /whitecore/iu);
  assert.doesNotMatch(markup, /whitecore/iu);
});
