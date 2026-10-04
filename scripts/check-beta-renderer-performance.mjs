import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const packagedPath = String(process.env.BETA_PACKAGED_EXE || "").trim();
const packagedMode = Boolean(packagedPath);
const chromeCandidates = [
  packagedPath,
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));

if (!chromePath) throw new Error("Chrome или Edge не найден. Укажите CHROME_PATH.");

const profileDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "vrchat-beta-perf-"));
const debuggingPort = 30000 + Math.floor(Math.random() * 10000);
const previewUrl = new URL(pathToFileURL(path.join(root, "apps", "client-beta", "renderer", "index.html")));
previewUrl.searchParams.set("preview", "1");
previewUrl.searchParams.set("seed", "1");
previewUrl.searchParams.set("stress", process.env.BETA_PREVIEW_STRESS || "1");
previewUrl.searchParams.set("animations", "0");
previewUrl.searchParams.set("lang", process.env.BETA_PREVIEW_LANGUAGE || "en");
if (process.env.BETA_PREVIEW_VIEW) previewUrl.searchParams.set("view", process.env.BETA_PREVIEW_VIEW);
if (process.env.BETA_PREVIEW_SECTION) previewUrl.searchParams.set("section", process.env.BETA_PREVIEW_SECTION);
if (process.env.BETA_PREVIEW_BUILDER_PRESET) previewUrl.searchParams.set("builderPreset", process.env.BETA_PREVIEW_BUILDER_PRESET);
if (process.env.BETA_PREVIEW_PLAYER) previewUrl.searchParams.set("player", process.env.BETA_PREVIEW_PLAYER);
if (process.env.BETA_PREVIEW_SCALE) previewUrl.searchParams.set("scale", process.env.BETA_PREVIEW_SCALE);
if (process.env.BETA_PREVIEW_UI) previewUrl.searchParams.set("ui", process.env.BETA_PREVIEW_UI);
if (process.env.BETA_PREVIEW_RAIL) previewUrl.searchParams.set("rail", process.env.BETA_PREVIEW_RAIL);
if (process.env.BETA_PREVIEW_AVATAR_SEARCH) {
  previewUrl.searchParams.set("avatarSearch", process.env.BETA_PREVIEW_AVATAR_SEARCH);
  previewUrl.searchParams.set("onlineAvatarSearch", "1");
}
const previewWindowSize = /^\d{3,5},\d{3,5}$/u.test(process.env.BETA_PREVIEW_WINDOW_SIZE || "")
  ? process.env.BETA_PREVIEW_WINDOW_SIZE
  : "1366,768";

const browserArguments = [
  "--headless=new",
  "--disable-background-networking",
  "--disable-extensions",
  "--disable-gpu",
  "--disable-sync",
  "--no-default-browser-check",
  "--no-first-run",
  `--remote-debugging-port=${debuggingPort}`,
  `--user-data-dir=${profileDirectory}`,
  `--window-size=${previewWindowSize}`
];
if (!packagedMode) browserArguments.push(previewUrl.href);
const browser = spawn(chromePath, browserArguments, { stdio: ["ignore", "ignore", "pipe"], windowsHide: true });

let browserError = "";
browser.stderr.setEncoding("utf8");
browser.stderr.on("data", (chunk) => { browserError += chunk; });

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForPageTarget(timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (browser.exitCode !== null) throw new Error(`Браузер завершился раньше времени. ${browserError.trim()}`);
    try {
      const targets = await fetch(`http://127.0.0.1:${debuggingPort}/json/list`).then((response) => response.json());
      const target = targets.find((entry) => entry.type === "page" && (packagedMode || entry.url.includes("apps/client-beta/renderer/index.html")));
      if (target?.webSocketDebuggerUrl) return target;
    } catch {
      // DevTools ещё запускается.
    }
    await delay(100);
  }
  throw new Error(`Не удалось подключиться к DevTools за ${timeoutMs} мс. ${browserError.trim()}`);
}

async function connectCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let messageId = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  return {
    close: () => socket.close(),
    send(method, params = {}) {
      const id = ++messageId;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    }
  };
}

let cdp = null;
try {
  const target = await waitForPageTarget();
  cdp = await connectCdp(target.webSocketDebuggerUrl);
  await cdp.send("Runtime.enable");
  const readyDeadline = Date.now() + 12000;
  let rendererReady = false;
  while (Date.now() < readyDeadline) {
    try {
      const ready = await cdp.send("Runtime.evaluate", {
        expression: packagedMode
          ? "document.readyState === 'complete' && Boolean(window.betaI18n && window.clientApi)"
          : "document.readyState === 'complete' && Boolean(window.betaUiCustomizer && window.betaI18n) && typeof appView !== 'undefined' && !appView.hidden",
        returnByValue: true
      });
      if (ready.result?.value === true) { rendererReady = true; break; }
    } catch { if (browser.exitCode !== null) throw new Error("Preview browser closed before the renderer was ready"); }
    await delay(100);
  }
  if (!rendererReady) throw new Error("Preview renderer did not become ready");
  await delay(650);
  if (process.env.BETA_PREVIEW_CLICK_SELECTOR) {
    const selector = JSON.stringify(process.env.BETA_PREVIEW_CLICK_SELECTOR);
    const clicked = await cdp.send("Runtime.evaluate", {
      expression: `(() => { const element = document.querySelector(${selector}); if (!element) return false; element.click(); return true; })()`,
      returnByValue: true
    });
    if (!clicked.result.value) throw new Error(`Не найден элемент для QA-клика: ${process.env.BETA_PREVIEW_CLICK_SELECTOR}`);
    await cdp.send("Runtime.evaluate", {
      expression: "new Promise((resolve) => setTimeout(resolve, 650))",
      awaitPromise: true
    });
  }
  if (process.env.BETA_PREVIEW_CUSTOMIZER_QA === "1") {
    const result = await cdp.send("Runtime.evaluate", {
      expression: `(async () => {
        const assert = (value, message) => { if (!value) throw new Error(message); };
        const panel = document.querySelector('.uiCustomPanel');
        assert(document.querySelector('.uiCustomLauncher'), 'customizer missing: ' + JSON.stringify({ module: Boolean(window.betaUiCustomizer), sheet: Boolean(document.querySelector('link[data-ui-custom-styles]')?.sheet) }));
        document.querySelector('.uiCustomLauncher').click();
        assert(panel && !panel.hidden, 'customizer panel did not open');
        const button = (action) => panel.querySelector('[data-ui-action="' + action + '"]');
        const field = (key) => panel.querySelector('[data-ui-' + (key === 'accent' ? 'theme' : 'element') + '="' + key + '"]');
        const change = (input, value) => { input.value = value; input.dispatchEvent(new Event('change', { bubbles: true })); };
        const heading = [...document.querySelectorAll('h2')].find((item) => !item.children.length && !item.closest('.uiCustomPanel,dialog'));
        const captionTarget = document.querySelector('[data-action="snapshot"]');
        assert(heading && captionTarget, 'safe customization targets missing');
        const caption = captionTarget.textContent;
        change(field('accent'), '#bb66ff');
        assert(getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim() === '#bb66ff', 'palette not applied under CSP');
        const font = panel.querySelector('[data-ui-theme="font"]');
        assert(font && font.options.length === Object.keys(window.betaUiCustomizer.FONTS).length, 'font choices missing');
        change(font, 'verdana');
        assert(getComputedStyle(captionTarget).fontFamily.includes('Verdana'), 'chosen font did not reach controls');
        button('pick').click(); heading.click();
        assert(field('text').disabled, 'structural heading must not be relabelled');
        button('pick').click(); captionTarget.click();
        assert(!field('text').disabled, 'safe static label not editable');
        change(field('text'), '<img src=x onerror=alert(1)>');
        assert(!captionTarget.children.length && captionTarget.textContent.startsWith('<img'), 'caption became markup');
        change(field('text'), 'Мой VRChat');
        captionTarget.textContent = 'System translation';
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        assert(captionTarget.textContent === 'Мой VRChat', 'dynamic translation lost custom label');
        button('reset-element').click();
        assert(captionTarget.textContent === 'System translation', 'reset lost new system translation');
        captionTarget.textContent = caption;
        change(field('text'), 'Мой VRChat');
        button('new').click();
        assert(JSON.parse(localStorage.getItem('betaInterfaceProfilesV1')).profiles.length === 2, 'profile clone not saved');
        return { caption, status: 'ok' };
      })()`,
      awaitPromise: true, returnByValue: true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    await cdp.send("Page.reload");
    await delay(2000);
    const persisted = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const assert = (value, message) => { if (!value) throw new Error(message); };
        const panel = document.querySelector('.uiCustomPanel');
        document.querySelector('.uiCustomLauncher').click();
        assert(getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim() === '#bb66ff', 'palette did not survive reload');
        assert(panel.querySelector('[data-ui-theme="font"]').value === 'verdana' && getComputedStyle(document.documentElement).fontFamily.includes('Verdana'), 'font did not survive reload');
        assert([...document.querySelectorAll('[data-ui-relabelled]')].some((item) => item.textContent === 'Мой VRChat'), 'caption did not survive reload');
        panel.querySelector('[data-ui-action="reset-profile"]').click();
        assert(!document.querySelector('[data-ui-relabelled]'), 'profile reset left custom captions');
        assert(getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim() === '#58d6e7', 'profile reset left palette');
        assert(!getComputedStyle(document.documentElement).fontFamily.includes('Verdana'), 'profile reset left font');
        return { customizer: 'ok', savedProfiles: JSON.parse(localStorage.getItem('betaInterfaceProfilesV1')).profiles.length };
      })()`, returnByValue: true
    });
    if (persisted.exceptionDetails) throw new Error(persisted.exceptionDetails.exception?.description || persisted.exceptionDetails.text);
    console.log(JSON.stringify(persisted.result.value));
  }
  if (process.env.BETA_PREVIEW_APPEARANCE_PRESET) {
    const presetKey = JSON.stringify(process.env.BETA_PREVIEW_APPEARANCE_PRESET);
    const result = await cdp.send("Runtime.evaluate", {
      expression: `(async () => {
        const key = ${presetKey};
        const preset = window.betaUiCustomizer?.PRESETS[key];
        if (!preset) throw new Error('Unknown appearance preset: ' + key);
        document.querySelector('.uiCustomLauncher').click();
        const select = document.querySelector('.uiCustomPreset select');
        const create = document.querySelector('.uiCustomPreset button');
        if (!select || !create) throw new Error('Appearance preset controls are missing');
        select.value = key;
        create.click();
        document.querySelector('.uiCustomHeading button').click();
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim();
        if (accent !== preset.theme.accent) throw new Error('Appearance preset was not applied: ' + accent);
        const rgb = (hex) => 'rgb(' + hex.slice(1).match(/../g).map((value) => parseInt(value, 16)).join(', ') + ')';
        const cardColor = getComputedStyle(document.querySelector('.metricGrid article')).backgroundColor;
        const filterColor = getComputedStyle(document.querySelector('.sessionFilters')).backgroundColor;
        const expectedCard = preset.theme.shell === 'gamesense' ? preset.theme.surface : preset.theme.secondary;
        if (cardColor !== rgb(expectedCard) || filterColor !== rgb(preset.theme.surface)) throw new Error('Preset did not recolor primary cards');
        return { preset: key, accent, cardColor, font: getComputedStyle(document.documentElement).fontFamily };
      })()`,
      returnByValue: true,
      awaitPromise: true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    console.log(JSON.stringify(result.result.value));
  }
  if (process.env.BETA_PREVIEW_ALL_PRESETS_QA === "1") {
    const result = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        document.querySelector('.uiCustomLauncher').click();
        const select = document.querySelector('.uiCustomPreset select');
        const create = document.querySelector('.uiCustomPreset button');
        const keys = Object.keys(window.betaUiCustomizer.PRESETS);
        for (const key of keys) { select.value = key; create.click(); }
        const saved = JSON.parse(localStorage.getItem('betaInterfaceProfilesV1'));
        if (saved.profiles.length !== keys.length + 1 || saved.profiles.at(-1).name !== window.betaUiCustomizer.PRESETS[keys.at(-1)].name) {
          throw new Error('Not all ready-made themes can be saved');
        }
        return { readyThemes: keys.length, savedProfiles: saved.profiles.length };
      })()`,
      returnByValue: true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    console.log(JSON.stringify(result.result.value));
  }
  if (process.env.BETA_PREVIEW_STUDIO_QA === "1") {
    const result = await cdp.send("Runtime.evaluate", {
      expression: `(async () => {
        const assert = (value, message) => { if (!value) throw new Error(message); };
        const wait = () => new Promise((resolve) => setTimeout(resolve, 200));
        assert(appView.classList.contains('uiStudio') && !appView.classList.contains('uiChromeCollapsed'), 'Studio did not activate a labelled sidebar');
        state.uiSettings.uiPlacement = 'top';
        const originalWidth = state.uiSettings.uiSidebarWidth;
        applyUiSettings();
        assert(appView.classList.contains('uiChromeLeft'), 'Studio did not own its layout');
        assert(document.querySelectorAll('.studioNavGroup:not([hidden])').length === 3, 'sidebar groups missing');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
        const dialog = document.querySelector('[data-studio-command-dialog]');
        const input = document.querySelector('[data-studio-command-input]');
        assert(dialog.open && document.activeElement === input, 'Ctrl+K did not focus commands');
        input.value = 'Настройки'; input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        assert(settingsDialog.open && !dialog.open, 'command did not open real settings');
        assert(settingsForm.elements.uiPlacement.disabled, 'fixed Studio placement remained editable');
        const checkbox = settingsForm.elements.animations;
        const before = checkbox.checked; checkbox.click();
        assert(checkbox.checked !== before, 'styled switch stopped working');
        closeSettings();
        switchWorkspaceMode('team'); await wait();
        studioShell.open(); input.value = 'Admin'; input.dispatchEvent(new Event('input', { bubbles: true }));
        assert(dialog.querySelectorAll('[data-studio-command]').length === 1, 'team navigation command missing');
        dialog.querySelector('[data-studio-command]').click(); await wait();
        assert(state.view === 'admin', 'command did not navigate to Admin Tools');
        state.settings = { ...state.settings, freeMode: true, accessMode: 'free', license: null };
        syncPaidAccess(); syncWorkspaceNavigation(); selectView('session');
        studioShell.open();
        const labels = [...dialog.querySelectorAll('.studioCommandRow strong')].map((row) => row.textContent);
        assert(!labels.some((label) => ['Admin Tools', 'Owner', 'Мини-игры'].includes(label)), 'paid commands visible in free mode');
        input.value = 'раздел-которого-нет'; input.dispatchEvent(new Event('input', { bubbles: true }));
        assert(!dialog.querySelector('[data-studio-command]') && dialog.textContent.includes('Ничего не найдено.'), 'unknown command created a result');
        dialog.close();
        selectView('builder'); await wait();
        await setBuilderCompact();
        assert(appView.classList.contains('compactMode') && !appView.classList.contains('uiStudio') && document.querySelector('.studioTopbar').hidden, 'Studio overrode compact Builder');
        await setBuilderCompact();
        assert(!appView.classList.contains('compactMode') && appView.classList.contains('uiStudio'), 'Studio was not restored after compact Builder');
        appView.querySelector('[data-view-button="history"]').click(); await wait();
        assert(state.view === 'history', 'labelled sidebar did not navigate');
        document.querySelector('.uiCustomLauncher').click();
        const profiles = document.querySelector('.uiCustomPanel > select');
        const studioProfile = profiles.value;
        profiles.value = '0'; profiles.dispatchEvent(new Event('change', { bubbles: true }));
        assert(!appView.classList.contains('uiStudio') && !appView.classList.contains('uiChromeLeft') && state.uiSettings.uiSidebarWidth === originalWidth, 'previous layout was not restored');
        profiles.value = studioProfile; profiles.dispatchEvent(new Event('change', { bubbles: true }));
        document.querySelector('.uiCustomHeading button').click();
        selectView('session');
        const trigger = document.querySelector('[data-studio-search-open]');
        assert(trigger.getBoundingClientRect().width > 0 && getComputedStyle(trigger).visibility !== 'hidden', 'search button is not visible');
        trigger.click(); assert(dialog.open, 'search button did not open commands'); dialog.close();
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const overflowing = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
        assert(!overflowing, 'Studio overflows the window horizontally: ' + JSON.stringify({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, appWidth: appView.getBoundingClientRect().width, bodyWidth: document.body.getBoundingClientRect().width, bodyMin: getComputedStyle(document.body).minWidth, zoom: appView.style.zoom, wide: [...document.body.querySelectorAll('*')].filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1).slice(0, 5).map((element) => ({ tag: element.tagName, class: String(element.className), right: Math.round(element.getBoundingClientRect().right) })) }));
        return { studioNavigation: 'ok', keyboardCommands: 'ok', realSettings: 'ok', freeGate: 'ok', compactBuilder: 'ok', previousLayout: 'ok', horizontalOverflow: false };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    console.log(JSON.stringify(result.result.value));
  }
  if (process.env.BETA_PREVIEW_STUDIO_QA === "1") {
    await cdp.send("Page.reload");
    await delay(2000);
    const persisted = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const saved = JSON.parse(localStorage.getItem('betaInterfaceProfilesV1'));
        if (!appView.classList.contains('uiStudio') || saved.profiles[saved.active].theme.shell !== 'studio' || document.querySelector('.studioTopbar').hidden) throw new Error('Studio layout did not survive reload');
        return { studioPersistence: 'ok' };
      })()`,
      returnByValue: true
    });
    if (persisted.exceptionDetails) throw new Error(persisted.exceptionDetails.exception?.description || persisted.exceptionDetails.text);
    console.log(JSON.stringify(persisted.result.value));
  }
  if (process.env.BETA_PREVIEW_SOCIAL_QA === "1") {
    const result = await cdp.send("Runtime.evaluate", {
      expression: `(async () => {
        const assert = (value, message) => { if (!value) throw new Error(message); };
        const wait = () => new Promise((resolve) => setTimeout(resolve, 150));
        const tab = (name) => document.querySelector('[data-social-tab="' + name + '"]').click();
        await refreshSocial(true);
        tab('inventory'); await wait();
        assert(document.querySelector('[data-social-summary]').textContent.includes('Neon frame'), 'inventory did not load');
        const query = document.querySelector('[data-social-search]');
        query.value = 'does-not-exist'; query.dispatchEvent(new Event('input', { bubbles: true }));
        assert(!document.querySelector('[data-social-summary]').textContent.includes('Neon frame'), 'inventory search not applied');
        query.value = 'Neon'; query.dispatchEvent(new Event('input', { bubbles: true }));
        assert(document.querySelector('[data-social-summary]').textContent.includes('Neon frame'), 'inventory match missing');
        const type = document.querySelector('[data-social-inventory-type]');
        assert([...type.options].some((option) => option.value === 'iconFrame'), 'inventory types missing');
        query.value = ''; query.dispatchEvent(new Event('input', { bubbles: true }));
        tab('prints'); await wait();
        assert(document.querySelector('[data-social-summary]').textContent.includes('Group Public'), 'prints did not load');
        const original = api.getVrchatPersonalCollection;
        let complete;
        api.getVrchatPersonalCollection = () => new Promise((resolve) => { complete = resolve; });
        const pending = loadSocialCollection('inventory', true);
        resetSocialAccount();
        complete({ rows: [{ name: 'Previous account secret', id: 'old' }] });
        await pending;
        assert(!state.socialCollections.inventory, 'old account result survived reset');
        api.getVrchatPersonalCollection = original;
        await refreshSocial(true);
        tab('inventory'); await wait();
        return { social: 'ok', accountSwitch: 'ok' };
      })()`, awaitPromise: true, returnByValue: true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    console.log(JSON.stringify(result.result.value));
  }
  if (process.env.BETA_PREVIEW_UNIFIED_SEARCH_QA === "1") {
    const result = await cdp.send("Runtime.evaluate", {
      expression: `(async () => {
        const assert = (value, message) => { if (!value) throw new Error(message); };
        window.betaStudioShell && document.querySelector('.studioQuickSearch').click();
        const dialog = document.querySelector('[data-studio-command-dialog]');
        const input = dialog.querySelector('input');
        const query = (value) => { input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); };
        query('Mira'); query('Nova');
        const deadline = Date.now() + 4000;
        while (Date.now() < deadline && ![...dialog.querySelectorAll('.studioCommandRow strong')].some((item) => item.textContent === 'Nova')) await new Promise((resolve) => setTimeout(resolve, 50));
        const names = [...dialog.querySelectorAll('.studioCommandRow strong')].map((item) => item.textContent);
        assert(names.includes('Nova') && !names.includes('Mira'), 'stale entity search results');
        dialog.querySelector('.studioCommandRow').click();
        assert(!dialog.open, 'entity navigation did not close search');
        await new Promise((resolve) => setTimeout(resolve, 50));
        assert(state.directorySelected.player === 'usr_demo_nova' && state.view === 'library', 'entity did not open in real library');
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
        assert(dialog.open, 'global Ctrl+K did not open');
        const id = 'avtr_12345678-1234-1234-1234-123456789abc';
        query('https://vrchat.com/home/avatar/' + id);
        const idDeadline = Date.now() + 4000;
        while (Date.now() < idDeadline && ![...dialog.querySelectorAll('.studioCommandRow strong')].some((item) => item.textContent === id)) await new Promise((resolve) => setTimeout(resolve, 50));
        assert([...dialog.querySelectorAll('.studioCommandRow strong')].some((item) => item.textContent === id), 'known ID link did not resolve');
        dialog.close();
        selectView('session');
        return { unifiedSearch: 'ok', staleQuery: 'ok', actualLibraryNavigation: 'ok', knownLink: 'ok' };
      })()`, returnByValue: true, awaitPromise: true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    console.log(JSON.stringify(result.result.value));
  }
  if (process.env.BETA_PREVIEW_EXPECT_TEXT) {
    const expected = JSON.stringify(process.env.BETA_PREVIEW_EXPECT_TEXT);
    const found = await cdp.send("Runtime.evaluate", {
      expression: `document.body.innerText.includes(${expected})`,
      returnByValue: true
    });
    if (!found.result.value) throw new Error(`После QA-действия не найден ожидаемый текст: ${process.env.BETA_PREVIEW_EXPECT_TEXT}`);
  }
  if (process.env.BETA_PREVIEW_EXPECT_SELECTOR) {
    const expectedSelector = JSON.stringify(process.env.BETA_PREVIEW_EXPECT_SELECTOR);
    const found = await cdp.send("Runtime.evaluate", {
      expression: `Boolean(document.querySelector(${expectedSelector}))`,
      returnByValue: true
    });
    if (!found.result.value) throw new Error(`После QA-действия не найден ожидаемый элемент: ${process.env.BETA_PREVIEW_EXPECT_SELECTOR}`);
  }
  if (process.env.BETA_PREVIEW_GAMES_QA === "1") {
    const result = await cdp.send("Runtime.evaluate", {
      expression: `(async () => {
        const assert = (value, message) => { if (!value) throw new Error(message); };
        selectView('games');
        await new Promise((resolve) => setTimeout(resolve, 250));
        assert(state.view === 'games', 'paid key could not open games');
        assert(document.querySelectorAll('[data-game-answer]').length >= 2, 'world question did not render');
        document.querySelector('[data-game-answer]').click();
        assert(document.querySelector('[data-game-next]').hidden === false, 'answered question did not advance');
        document.querySelector('[data-game-next]').click();
        assert(gameState.round === 2, 'second round did not start');
        state.settings = { ...state.settings, accessMode: 'free', license: null };
        syncPaidAccess();
        assert(document.querySelector('[data-view-button="games"]').hidden, 'games visible in free mode');
        assert(state.view !== 'games', 'free mode kept games open');
        selectView('games');
        assert(state.view !== 'games', 'free mode reopened games');
        return { paidPlay: 'ok', freeGate: 'ok' };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    console.log(JSON.stringify(result.result.value));
  }
  if (process.env.BETA_PREVIEW_FRIEND_FEED_QA === "1") {
    const result = await cdp.send("Runtime.evaluate", {
      expression: `(async () => {
        const assert = (value, message) => { if (!value) throw new Error(message); };
        selectView('session');
        setSessionSection('friends');
        await new Promise((resolve) => setTimeout(resolve, 250));
        state.socialEvents = Array.from({ length: 500 }, (_, index) => ({ id: index + 1, event_type: 'status-description', user_id: 'usr_demo_' + index, display_name: 'Friend ' + index, current_value: 'Status ' + index, occurred_at: new Date().toISOString(), snapshot: {} }));
        renderFriendActivityFeed(true);
        const list = document.querySelector('[data-friend-activity-feed]');
        const initialRows = list.querySelectorAll('.friendActivityRow').length;
        assert(list.dataset.virtualTotal === '500' && initialRows > 0 && initialRows < 40, 'friend feed rendered too many rows: ' + initialRows);
        list.scrollTop = list.scrollHeight - list.clientHeight;
        list.dispatchEvent(new Event('scroll'));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        assert(Number(list.dataset.virtualStart) > 400 && list.querySelector('.friendActivityRow')?.textContent.includes('Friend 4'), 'friend feed did not render the bottom window');
        return { totalEvents: 500, initialDomRows: initialRows, scrolledStart: Number(list.dataset.virtualStart) };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    console.log(JSON.stringify(result.result.value));
  }
  if (process.env.BETA_PREVIEW_NOTICES_QA === "1") {
    const result = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const message = 'Длинное уведомление о состоянии приложения: ' + 'Подробности проверки подключения и действия пользователя. '.repeat(24) + 'https://example.org/' + 'very-long-segment'.repeat(12);
        setStatus(message, true, { sticky: true });
        setStatusCenter(true);
        const row = document.querySelector('.statusNotice');
        const copy = row?.querySelector('span');
        const panel = document.querySelector('.statusCenter');
        const list = document.querySelector('.statusCenterList');
        if (!row || !copy || !panel || !list || copy.textContent !== message || getComputedStyle(copy).whiteSpace === 'nowrap' || row.scrollHeight <= 66 || panel.scrollWidth > panel.clientWidth || list.scrollHeight <= list.clientHeight) {
          throw new Error('Long notification is clipped: ' + JSON.stringify({ rowHeight: row?.scrollHeight, textLength: copy?.textContent.length, whiteSpace: copy && getComputedStyle(copy).whiteSpace, overflow: panel?.scrollWidth - panel?.clientWidth }));
        }
        return { fullText: true, rowHeight: row.scrollHeight, textLength: copy.textContent.length, scrollable: true };
      })()`,
      returnByValue: true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    console.log(JSON.stringify(result.result.value));
  }
  if (process.env.BETA_PERF_SCREENSHOT) {
    await cdp.send("Page.enable");
    const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
    const screenshotPath = path.resolve(process.env.BETA_PERF_SCREENSHOT);
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, "base64"));
  }
  const evaluation = await cdp.send("Runtime.evaluate", {
    expression: packagedMode ? `(() => ({
      title: document.title,
      activationPresent: Boolean(document.querySelector('[data-activation-view]')),
      rendererReady: Boolean(window.betaI18n && window.betaSessionModel && window.betaCrashModel),
      bridgeReady: Boolean(window.clientApi && typeof window.clientApi.getSettings === 'function' && typeof window.clientApi.analyzeCurrentInstance === 'function'),
      totalDomNodes: document.querySelectorAll('*').length,
      usedJsHeapBytes: Number(performance.memory?.usedJSHeapSize || 0)
    }))()` : `(() => {
      const eventList = document.querySelector('[data-event-feed]');
      const playerList = document.querySelector('[data-player-list]');
      const avatarList = document.querySelector('[data-avatar-session-list]');
      const avatarCountText = document.querySelector('[data-avatar-count]')?.textContent || '';
      const virtualWindows = [...document.querySelectorAll('.virtualListWindow')];
      const virtualDomNodes = virtualWindows.reduce((count, element) => count + element.querySelectorAll('*').length, 0);
      return {
        eventTotal: Number(eventList?.dataset.virtualTotal || 0),
        eventRows: eventList?.querySelectorAll('.eventRow').length || 0,
        minimumVisibleEvents: Math.min(Number(eventList?.dataset.virtualTotal || 0), Math.ceil((eventList?.clientHeight || 0) / (eventList?.querySelector('.eventRow')?.offsetHeight || 54))),
        playerTotal: Number(playerList?.dataset.virtualTotal || 0),
        playerRows: playerList?.querySelectorAll('.sessionPlayerButton').length || 0,
        minimumVisiblePlayers: Math.min(Number(playerList?.dataset.virtualTotal || 0), Math.ceil((playerList?.clientHeight || 0) / (playerList?.querySelector('.sessionPlayerButton')?.offsetHeight || 58))),
        avatarPageTotal: Number(avatarList?.dataset.virtualTotal || 0),
        avatarRows: avatarList?.querySelectorAll('.avatarSessionRow').length || 0,
        avatarCatalogTotal: Number(avatarCountText.match(/\\d+/u)?.[0] || 0),
        totalDomNodes: document.querySelectorAll('*').length,
        fixedDomNodes: document.querySelectorAll('*').length - virtualDomNodes,
        maximumVirtualRows: Math.max(0, ...virtualWindows.map((element) => element.children.length)),
        usedJsHeapBytes: Number(performance.memory?.usedJSHeapSize || 0)
      };
    })()`,
    returnByValue: true
  });
  const metrics = evaluation.result.value;
  const failures = [];
  if (packagedMode) {
    if (!metrics.activationPresent) failures.push("экран активации не загрузился");
    if (!metrics.rendererReady) failures.push("renderer Beta не инициализирован");
    if (!metrics.bridgeReady) failures.push("Electron IPC bridge не готов");
    if (failures.length) throw new Error(failures.join("; "));
    console.log(JSON.stringify({ ...metrics, usedJsHeapMb: Number((metrics.usedJsHeapBytes / 1024 / 1024).toFixed(1)), status: "ok" }, null, 2));
    process.exitCode = 0;
  } else {
  const stressMode = (process.env.BETA_PREVIEW_STRESS || "1") === "1";
  const avatarSection = process.env.BETA_PREVIEW_SECTION === "avatars";
  if (stressMode && avatarSection && metrics.avatarCatalogTotal < 900) failures.push(`ожидалось не меньше 900 аватаров, получено ${metrics.avatarCatalogTotal}`);
  if (stressMode && !avatarSection && metrics.playerTotal !== 1000) failures.push(`ожидалось 1000 игроков, получено ${metrics.playerTotal}`);
  if (stressMode && !avatarSection && metrics.eventTotal !== 2000) failures.push(`ожидалось 2000 событий, получено ${metrics.eventTotal}`);
  if (!avatarSection && metrics.playerRows > 40) failures.push(`создано слишком много строк игроков: ${metrics.playerRows}`);
  if (!avatarSection && metrics.eventRows > 40) failures.push(`создано слишком много строк событий: ${metrics.eventRows}`);
  if (!avatarSection && metrics.eventRows < metrics.minimumVisibleEvents) failures.push(`Видимая область ленты заполнена не полностью: ${metrics.eventRows}/${metrics.minimumVisibleEvents}`);
  if (!avatarSection && metrics.playerRows < metrics.minimumVisiblePlayers) failures.push(`Видимая область игроков заполнена не полностью: ${metrics.playerRows}/${metrics.minimumVisiblePlayers}`);
  if (avatarSection && metrics.avatarRows > 40) failures.push(`создано слишком много строк аватаров: ${metrics.avatarRows}`);
  // Fixed controls have their own budget. Virtual rows scale with viewport height,
  // and are capped independently so a larger monitor is not mistaken for a leak.
  if (metrics.fixedDomNodes > 1300) failures.push(`Постоянный DOM разросся до ${metrics.fixedDomNodes} узлов`);
  if (metrics.maximumVirtualRows > 40) failures.push(`В виртуальном списке создано ${metrics.maximumVirtualRows} строк`);
  if (failures.length) throw new Error(failures.join("; "));
  console.log(JSON.stringify({
    ...metrics,
    usedJsHeapMb: Number((metrics.usedJsHeapBytes / 1024 / 1024).toFixed(1)),
    status: "ok"
  }, null, 2));
  }
} finally {
  cdp?.close();
  if (browser.exitCode === null) browser.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => browser.once("exit", resolve)),
    delay(3000)
  ]);
  if (browser.exitCode === null) browser.kill("SIGKILL");
  fs.rmSync(profileDirectory, { recursive: true, force: true });
}
