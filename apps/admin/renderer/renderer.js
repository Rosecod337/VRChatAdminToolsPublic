"use strict";

const serverUrl = document.querySelector("#serverUrl");
const adminToken = document.querySelector("#adminToken");
const saveSettingsBtn = document.querySelector("#saveSettingsBtn");
const refreshBtn = document.querySelector("#refreshBtn");
const statusText = document.querySelector("#statusText");
const createForm = document.querySelector("#createForm");
const labelInput = document.querySelector("#labelInput");
const teamInput = document.querySelector("#teamInput");
const maxDevicesInput = document.querySelector("#maxDevicesInput");
const validityDaysInput = document.querySelector("#validityDaysInput");
const bulkCountInput = document.querySelector("#bulkCountInput");
const bulkCreateBtn = document.querySelector("#bulkCreateBtn");
const generatedKey = document.querySelector("#generatedKey");
const copyKeyBtn = document.querySelector("#copyKeyBtn");
const licenseRows = document.querySelector("#licenseRows");
const licenseCount = document.querySelector("#licenseCount");
const licenseSearch = document.querySelector("#licenseSearch");
const licenseStatusFilter = document.querySelector("#licenseStatusFilter");
const licenseSort = document.querySelector("#licenseSort");

let latestKey = "";
let currentLicenses = [];

function automaticLicenseLabel(teamId, suffix = "") {
  const token = globalThis.crypto?.randomUUID?.().slice(0, 8) || Date.now().toString(36);
  const createdAt = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
  return `Ручной ${token} · ${teamId} · ${createdAt}${suffix ? ` · ${suffix}` : ""}`.slice(0, 80);
}

function createLicenseBody(label, maxDevices, suffix = "") {
  const teamId = teamInput.value.trim();
  if (!teamId) throw new Error("Укажите Team ID");
  return {
    label: label.trim() || automaticLicenseLabel(teamId, suffix),
    authorAlias: "",
    teamId,
    maxDevices,
    validityDays: validityDaysInput.value ? Number(validityDaysInput.value) : null,
    requireAuthorAliasOnActivation: true
  };
}

async function copyIssuedKeys(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function setStatus(text, isError = false) {
  statusText.textContent = text;
  statusText.style.color = isError ? "#ffaaa2" : "";
}

function errorMessage(error) {
  if (error?.message === "author_alias_taken") {
    return "Это имя автора уже используется другим ключом";
  }
  return error?.message || "Неизвестная ошибка";
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatLicenseTerm(license) {
  if (license.expiresAt) return formatDate(license.expiresAt);
  if (license.validityDays) return `Ждёт активации · ${license.validityDays} дн.`;
  return "Бессрочно";
}

function licenseStatusInfo(license) {
  if (!license.active) return { key: "blocked", label: "выключен", className: "blocked" };
  if (!license.activatedAt) return { key: "waiting", label: "ожидает", className: "waiting" };
  if (license.expiresAt) {
    const remainingMs = new Date(license.expiresAt).valueOf() - Date.now();
    if (remainingMs <= 0) return { key: "expired", label: "истёк", className: "blocked" };
    if (remainingMs <= 7 * 24 * 60 * 60 * 1000) return { key: "warning", label: "истекает", className: "warn" };
  }
  return { key: "active", label: "активен", className: "ok" };
}

function licensePermissionSummary(license) {
  const permissions = [];
  if (license.canRequestGroupBan || license.ownerAccess) permissions.push("баны");
  if (license.canViewGroupMembers) permissions.push("просмотр группы");
  if (license.canManageGroupRoles) permissions.push("роли");
  if (license.canKickGroupMembers) permissions.push("исключение");
  if (license.canPublishGlobalNotes) permissions.push("общие публикации");
  return permissions.length > 0 ? `Особые: ${permissions.join(", ")}` : "Без Owner";
}

function filteredLicenses(licenses) {
  const query = String(licenseSearch?.value || "").trim().toLowerCase();
  const filter = licenseStatusFilter?.value || "all";
  const sortMode = licenseSort?.value || "newest";
  const priorities = { expired: 0, blocked: 1, warning: 2, waiting: 3, active: 4 };
  return [...licenses].filter((license) => {
    const status = licenseStatusInfo(license);
    const matchesStatus = filter === "all"
      || (filter === "attention" && ["expired", "blocked", "warning"].includes(status.key))
      || filter === status.key;
    if (!matchesStatus) return false;
    if (!query) return true;
    return [license.keyPrefix, license.label, license.authorAlias, license.teamId]
      .some((value) => String(value || "").toLowerCase().includes(query));
  }).sort((left, right) => {
    const newestFirst = new Date(right.createdAt || 0).valueOf()
      - new Date(left.createdAt || 0).valueOf();
    if (sortMode === "oldest") return -newestFirst;
    if (sortMode === "attention") {
      const priority = priorities[licenseStatusInfo(left).key] - priorities[licenseStatusInfo(right).key];
      if (priority !== 0) return priority;
    }
    return newestFirst;
  });
}

async function runBusy(button, task) {
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

async function loadSettings() {
  const settings = await window.adminApi.getSettings();
  serverUrl.value = settings.serverUrl;
  adminToken.value = settings.adminToken;
}

async function saveSettings() {
  await window.adminApi.saveSettings({
    serverUrl: serverUrl.value,
    adminToken: adminToken.value
  });
  setStatus("Настройки сохранены");
}

async function refreshLicenses() {
  setStatus("Загрузка лицензий...");
  const payload = await window.adminApi.listLicenses();
  renderLicenses(payload.licenses || []);
  setStatus("Список обновлен");
}

async function refreshAll() {
  setStatus("Загрузка данных...");
  const licensesPayload = await window.adminApi.listLicenses();
  renderLicenses(licensesPayload.licenses || []);
  setStatus("Данные обновлены");
}

function renderLicenses(licenses) {
  currentLicenses = Array.isArray(licenses) ? licenses : currentLicenses;
  const visibleLicenses = filteredLicenses(currentLicenses);
  licenseCount.textContent = visibleLicenses.length === currentLicenses.length
    ? String(currentLicenses.length)
    : `${visibleLicenses.length} / ${currentLicenses.length}`;
  licenseRows.innerHTML = "";

  if (visibleLicenses.length === 0) {
    licenseRows.innerHTML = '<tr><td class="licenseEmpty" colspan="9">Лицензии по фильтру не найдены</td></tr>';
    return;
  }

  for (const license of visibleLicenses) {
    const tr = document.createElement("tr");
    const status = licenseStatusInfo(license);
    const permissions = licensePermissionSummary(license);
    tr.innerHTML = `
      <td><code>${escapeHtml(license.keyPrefix)}...</code></td>
      <td>
        <details class="licenseIdentityCell">
          <summary>
            <strong>${escapeHtml(license.label || "Без метки")}</strong>
            <span>${escapeHtml(license.authorAlias || (license.authorAliasRequired ? "Имя выберет пользователь" : "Без имени автора"))}</span>
          </summary>
          <div class="licenseIdentityEditor">
            <label>
              <span>Метка</span>
              <input data-license-label="${escapeHtml(license.id)}" type="text" maxlength="80" value="${escapeHtml(license.label || "")}">
            </label>
            <label>
              <span>Автор</span>
              <input data-author-alias="${escapeHtml(license.id)}" type="text" minlength="3" maxlength="24" placeholder="Rose337" value="${escapeHtml(license.authorAlias || "")}">
            </label>
            <button data-save-identity="${escapeHtml(license.id)}">Сохранить метку и автора</button>
          </div>
        </details>
      </td>
      <td>
        <div class="teamCell">
          <input class="teamInput" data-team="${escapeHtml(license.id)}" type="text" maxlength="80" value="${escapeHtml(license.teamId || license.id)}">
          <button data-save-team="${escapeHtml(license.id)}">Сохранить</button>
        </div>
      </td>
      <td>
        <details class="licensePermissionDetails">
          <summary title="${escapeHtml(permissions)}">${escapeHtml(permissions)}</summary>
          <div class="ownerCell">
          <label class="ownerToggle">
            <input
              data-owner-ban-access="${escapeHtml(license.id)}"
              type="checkbox"
              ${license.ownerAccess || license.canRequestGroupBan ? "checked" : ""}
            >
            <span>Owner-баны</span>
          </label>
          <div class="ownerGroupRow">
            <input
              class="groupInput"
              data-moderation-group="${escapeHtml(license.id)}"
              type="text"
              maxlength="80"
              placeholder="grp_..."
              value="${escapeHtml(license.moderationGroupId || "")}"
            >
            <button title="Сохранить Owner-баны" data-save-owner="${escapeHtml(license.id)}">Сохранить</button>
          </div>
          <div class="groupAccessCard">
            <strong>VRChat-группа</strong>
            <div class="groupPermissionChoices">
              <label>
                <input data-group-view="${escapeHtml(license.id)}" type="checkbox" ${license.canViewGroupMembers ? "checked" : ""}>
                <span>Просмотр / заметки</span>
              </label>
              <label>
                <input data-group-roles="${escapeHtml(license.id)}" type="checkbox" ${license.canManageGroupRoles ? "checked" : ""}>
                <span>Роли</span>
              </label>
              <label>
                <input data-group-kick="${escapeHtml(license.id)}" type="checkbox" ${license.canKickGroupMembers ? "checked" : ""}>
                <span>Исключение</span>
              </label>
            </div>
            <button class="danger groupAccessButton" data-save-group-access="${escapeHtml(license.id)}">Сохранить права</button>
          </div>
          <div class="groupAccessCard">
            <strong>Общие публикации</strong>
            <label class="ownerToggle">
              <input
                data-global-publish-access="${escapeHtml(license.id)}"
                type="checkbox"
                ${license.canPublishGlobalNotes ? "checked" : ""}
              >
              <span>Заметки об игроках и аватарах</span>
            </label>
            <button class="danger groupAccessButton" data-save-global-publish="${escapeHtml(license.id)}">Сохранить право</button>
          </div>
          </div>
        </details>
      </td>
      <td><span class="badge ${status.className}">${status.label}</span></td>
      <td>${license.devicesUsed}/${license.maxDevices}</td>
      <td>${formatLicenseTerm(license)}</td>
      <td>${formatDate(license.lastSeenAt)}</td>
      <td>
        <div class="licenseActions">
          <button class="${license.active ? "danger" : ""}" title="${license.active ? "Заблокировать ключ" : "Включить ключ"}" data-toggle-active="${escapeHtml(license.id)}" data-next-active="${license.active ? "false" : "true"}">${license.active ? "Блокировать" : "Включить"}</button>
          <details class="licenseSupportDetails">
            <summary>Поддержка</summary>
            <div>
              <button title="Сбросить привязанные устройства" data-reset-devices="${escapeHtml(license.id)}" ${license.devicesUsed > 0 ? "" : "disabled"}>Сбросить</button>
              <button title="Продлить лицензию на 30 дней" data-extend-license="${escapeHtml(license.id)}" ${license.validityDays ? "" : "disabled"}>+30 дней</button>
              <button class="danger" title="Перевыпустить ключ" data-reissue-license="${escapeHtml(license.id)}">Новый ключ</button>
            </div>
          </details>
        </div>
      </td>
    `;
    licenseRows.appendChild(tr);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;");
}

saveSettingsBtn.addEventListener("click", () =>
  runBusy(saveSettingsBtn, async () => {
    await saveSettings();
    await refreshAll();
  }).catch((error) => setStatus(error.message, true))
);

refreshBtn.addEventListener("click", () =>
  runBusy(refreshBtn, refreshAll).catch((error) => setStatus(error.message, true))
);

createForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runBusy(createForm.querySelector("button.primary"), async () => {
    await saveSettings();
    const payload = await window.adminApi.createLicense(createLicenseBody(labelInput.value, Number(maxDevicesInput.value || 1)));
    latestKey = payload.licenseKey;
    generatedKey.textContent = latestKey;
    labelInput.value = "";
    const copied = await copyIssuedKeys(latestKey);
    setStatus(copied ? "Ключ создан и скопирован" : "Ключ создан — скопируйте его вручную");
    await refreshLicenses();
  }).catch((error) => setStatus(errorMessage(error), true));
});

bulkCreateBtn.addEventListener("click", () =>
  runBusy(bulkCreateBtn, async () => {
    await saveSettings();
    const count = Math.min(Math.max(Number(bulkCountInput.value || 1), 1), 100);
    const labelBase = labelInput.value.trim();
    const keys = [];
    for (let index = 1; index <= count; index += 1) {
      const label = labelBase ? `${labelBase} ${index}` : "";
      const payload = await window.adminApi.createLicense(createLicenseBody(label, 1, `${index}/${count}`));
      keys.push(payload.licenseKey);
      setStatus(`Создано ключей: ${index}/${count}`);
    }
    latestKey = keys.join("\n");
    generatedKey.textContent = latestKey;
    const copied = await copyIssuedKeys(latestKey);
    setStatus(`Создано ${count} ключей по 1 устройству${copied ? " · список скопирован" : ""}`);
    await refreshLicenses();
  }).catch((error) => setStatus(error.message, true))
);

copyKeyBtn.addEventListener("click", async () => {
  if (!latestKey) return;
  await navigator.clipboard.writeText(latestKey);
  setStatus("Ключ скопирован");
});

licenseSearch?.addEventListener("input", () => renderLicenses(currentLicenses));
licenseStatusFilter?.addEventListener("change", () => renderLicenses(currentLicenses));
licenseSort?.addEventListener("change", () => renderLicenses(currentLicenses));

licenseRows.addEventListener("click", (event) => {
  const popoverSummary = event.target.closest(
    ".licensePermissionDetails > summary, .licenseSupportDetails > summary"
  );
  if (popoverSummary) {
    const currentDetails = popoverSummary.parentElement;
    licenseRows.querySelectorAll(
      ".licensePermissionDetails[open], .licenseSupportDetails[open]"
    ).forEach((details) => {
      if (details !== currentDetails) details.removeAttribute("open");
    });
    return;
  }

  const ownerButton = event.target.closest("button[data-save-owner]");
  if (ownerButton) {
    const licenseId = ownerButton.dataset.saveOwner;
    const access = licenseRows.querySelector(`input[data-owner-ban-access="${CSS.escape(licenseId)}"]`);
    const group = licenseRows.querySelector(`input[data-moderation-group="${CSS.escape(licenseId)}"]`);
    const enabled = Boolean(access?.checked);
    if (enabled && !String(group?.value || "").trim()) {
      setStatus("Для управления банами укажите VRChat Group ID", true);
      group?.focus();
      return;
    }
    const prompt = enabled
      ? "Выдать этому ключу доступ Owner к управлению банами? Управление участниками и ролями настраивается отдельно."
      : "Отозвать у этого ключа доступ к управлению банами и отменить его незавершённые операции?";
    if (!window.confirm(prompt)) return;
    runBusy(ownerButton, async () => {
      await window.adminApi.updateLicense(licenseId, {
        canRequestGroupBan: enabled,
        moderationGroupId: group?.value || ""
      });
      setStatus(enabled ? "Доступ Owner к банам сохранён для ключа" : "Доступ к банам отключён");
      await refreshLicenses();
    }).catch((error) => setStatus(errorMessage(error), true));
    return;
  }

  const groupAccessButton = event.target.closest("button[data-save-group-access]");
  if (groupAccessButton) {
    const licenseId = groupAccessButton.dataset.saveGroupAccess;
    const group = licenseRows.querySelector(`input[data-moderation-group="${CSS.escape(licenseId)}"]`);
    const view = licenseRows.querySelector(`input[data-group-view="${CSS.escape(licenseId)}"]`);
    const roles = licenseRows.querySelector(`input[data-group-roles="${CSS.escape(licenseId)}"]`);
    const kick = licenseRows.querySelector(`input[data-group-kick="${CSS.escape(licenseId)}"]`);
    const canManageGroupRoles = Boolean(roles?.checked);
    const canKickGroupMembers = Boolean(kick?.checked);
    const canViewGroupMembers = Boolean(view?.checked) || canManageGroupRoles || canKickGroupMembers;
    const enabled = canViewGroupMembers || canManageGroupRoles || canKickGroupMembers;
    if (enabled && !String(group?.value || "").trim()) {
      setStatus("Для управления группой укажите VRChat Group ID", true);
      group?.focus();
      return;
    }
    const granted = [
      canViewGroupMembers ? "просмотр и заметки" : "",
      canManageGroupRoles ? "роли" : "",
      canKickGroupMembers ? "исключение" : ""
    ].filter(Boolean).join(", ");
    const prompt = enabled
      ? `Выдать этому ключу управление VRChat-группой: ${granted}?`
      : "Отозвать у этого ключа всё управление VRChat-группой и отменить незавершённые операции?";
    if (!window.confirm(prompt)) return;
    runBusy(groupAccessButton, async () => {
      await window.adminApi.updateLicense(licenseId, {
        canViewGroupMembers,
        canManageGroupRoles,
        canKickGroupMembers,
        moderationGroupId: group?.value || ""
      });
      setStatus(enabled ? `Управление группой сохранено: ${granted}` : "Управление группой отключено");
      await refreshLicenses();
    }).catch((error) => setStatus(error.message, true));
    return;
  }

  const globalPublishButton = event.target.closest("button[data-save-global-publish]");
  if (globalPublishButton) {
    const licenseId = globalPublishButton.dataset.saveGlobalPublish;
    const access = licenseRows.querySelector(
      `input[data-global-publish-access="${CSS.escape(licenseId)}"]`
    );
    const enabled = Boolean(access?.checked);
    const prompt = enabled
      ? "Выдать этому ключу отдельное право на общие публикации? Действия ограничиваются сервером и сохраняются в приватном журнале."
      : "Отозвать у этого ключа право на общие публикации?";
    if (!window.confirm(prompt)) return;
    runBusy(globalPublishButton, async () => {
      const payload = await window.adminApi.updateLicense(licenseId, {
        canPublishGlobalNotes: enabled
      });
      if (
        typeof payload?.license?.canPublishGlobalNotes !== "boolean"
        || payload.license.canPublishGlobalNotes !== enabled
      ) {
        throw new Error("API сервера не сохранил право публикации. Обновите сервер и повторите попытку.");
      }
      setStatus(enabled ? "Отдельное право публикации выдано" : "Право публикации отозвано");
      await refreshLicenses();
    }).catch((error) => setStatus(error.message, true));
    return;
  }

  const identityButton = event.target.closest("button[data-save-identity]");
  if (identityButton) {
    runBusy(identityButton, async () => {
      const licenseId = identityButton.dataset.saveIdentity;
      const label = licenseRows.querySelector(`input[data-license-label="${CSS.escape(licenseId)}"]`);
      const authorAlias = licenseRows.querySelector(`input[data-author-alias="${CSS.escape(licenseId)}"]`);
      await window.adminApi.updateLicense(licenseId, {
        label: label?.value || "",
        authorAlias: authorAlias?.value || ""
      });
      setStatus("Метка и имя автора сохранены");
      await refreshLicenses();
    }).catch((error) => setStatus(errorMessage(error), true));
    return;
  }

  const teamButton = event.target.closest("button[data-save-team]");
  if (teamButton) {
    runBusy(teamButton, async () => {
      const selector = `input[data-team="${CSS.escape(teamButton.dataset.saveTeam)}"]`;
      const input = licenseRows.querySelector(selector);
      await window.adminApi.updateLicense(teamButton.dataset.saveTeam, { teamId: input?.value || "" });
      setStatus("Team ID сохранён");
      await refreshLicenses();
    }).catch((error) => setStatus(error.message, true));
    return;
  }

  const activeButton = event.target.closest("button[data-toggle-active]");
  if (activeButton) {
    const enabled = activeButton.dataset.nextActive === "true";
    if (!enabled && !window.confirm("Заблокировать ключ и завершить его активные сессии?")) return;
    runBusy(activeButton, async () => {
      if (enabled) {
        await window.adminApi.updateLicense(activeButton.dataset.toggleActive, { active: true });
      } else {
        await window.adminApi.revokeLicense(activeButton.dataset.toggleActive);
      }
      setStatus(enabled ? "Ключ включён" : "Ключ заблокирован");
      await refreshLicenses();
    }).catch((error) => setStatus(error.message, true));
    return;
  }

  const resetButton = event.target.closest("button[data-reset-devices]");
  if (resetButton) {
    if (!window.confirm("Сбросить все устройства ключа и завершить его активные сессии? Срок лицензии не изменится.")) return;
    runBusy(resetButton, async () => {
      await window.adminApi.resetLicenseDevices(resetButton.dataset.resetDevices);
      setStatus("Устройства сброшены");
      await refreshLicenses();
    }).catch((error) => setStatus(error.message, true));
    return;
  }

  const extendButton = event.target.closest("button[data-extend-license]");
  if (extendButton) {
    runBusy(extendButton, async () => {
      await window.adminApi.extendLicense(extendButton.dataset.extendLicense, 30);
      setStatus("К лицензии добавлено 30 дней");
      await refreshLicenses();
    }).catch((error) => setStatus(error.message, true));
    return;
  }

  const reissueButton = event.target.closest("button[data-reissue-license]");
  if (!reissueButton) return;
  if (!window.confirm("Перевыпустить ключ? Старый ключ и активные сессии перестанут работать, но текущий срок сохранится.")) return;
  runBusy(reissueButton, async () => {
    const payload = await window.adminApi.reissueLicense(reissueButton.dataset.reissueLicense);
    latestKey = payload.licenseKey;
    generatedKey.textContent = latestKey;
    const copied = await copyIssuedKeys(latestKey);
    setStatus(copied ? "Новый ключ создан и скопирован" : "Новый ключ создан — скопируйте его вручную");
    await refreshLicenses();
  }).catch((error) => setStatus(error.message, true));
});

loadSettings()
  .then(refreshAll)
  .catch((error) => setStatus(error.message, true));
