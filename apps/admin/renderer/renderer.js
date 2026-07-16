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
const expiresInput = document.querySelector("#expiresInput");
const bulkCountInput = document.querySelector("#bulkCountInput");
const bulkCreateBtn = document.querySelector("#bulkCreateBtn");
const generatedKey = document.querySelector("#generatedKey");
const copyKeyBtn = document.querySelector("#copyKeyBtn");
const licenseRows = document.querySelector("#licenseRows");
const licenseCount = document.querySelector("#licenseCount");

let latestKey = "";

function createLicenseBody(label, maxDevices) {
  return {
    label,
    teamId: teamInput.value,
    maxDevices,
    expiresAt: expiresInput.value ? new Date(expiresInput.value).toISOString() : null
  };
}

function setStatus(text, isError = false) {
  statusText.textContent = text;
  statusText.style.color = isError ? "#ffaaa2" : "";
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
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

function renderLicenses(licenses) {
  licenseCount.textContent = String(licenses.length);
  licenseRows.innerHTML = "";

  for (const license of licenses) {
    const tr = document.createElement("tr");
    const status = license.active ? "active" : "blocked";
    tr.innerHTML = `
      <td><code>${escapeHtml(license.keyPrefix)}...</code></td>
      <td>${escapeHtml(license.label || "-")}</td>
      <td>
        <div class="teamCell">
          <input class="teamInput" data-team="${escapeHtml(license.id)}" type="text" maxlength="80" value="${escapeHtml(license.teamId || license.id)}">
          <button data-save-team="${escapeHtml(license.id)}">Save</button>
        </div>
      </td>
      <td><span class="badge ${license.active ? "ok" : "blocked"}">${status}</span></td>
      <td>${license.devicesUsed}/${license.maxDevices}</td>
      <td>${formatDate(license.expiresAt)}</td>
      <td>${formatDate(license.lastSeenAt)}</td>
      <td><button class="danger" data-revoke="${escapeHtml(license.id)}" ${license.active ? "" : "disabled"}>Block</button></td>
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
    await refreshLicenses();
  }).catch((error) => setStatus(error.message, true))
);

refreshBtn.addEventListener("click", () =>
  runBusy(refreshBtn, refreshLicenses).catch((error) => setStatus(error.message, true))
);

createForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runBusy(createForm.querySelector("button.primary"), async () => {
    await saveSettings();
    const payload = await window.adminApi.createLicense(createLicenseBody(labelInput.value, Number(maxDevicesInput.value || 1)));
    latestKey = payload.licenseKey;
    generatedKey.textContent = latestKey;
    labelInput.value = "";
    teamInput.value = "";
    setStatus("Ключ создан");
    await refreshLicenses();
  }).catch((error) => setStatus(error.message, true));
});

bulkCreateBtn.addEventListener("click", () =>
  runBusy(bulkCreateBtn, async () => {
    await saveSettings();
    const count = Math.min(Math.max(Number(bulkCountInput.value || 1), 1), 100);
    const labelBase = labelInput.value.trim() || "admin";
    const keys = [];
    for (let index = 1; index <= count; index += 1) {
      const payload = await window.adminApi.createLicense(createLicenseBody(`${labelBase} ${index}`, 1));
      keys.push(payload.licenseKey);
      setStatus(`Создано ключей: ${index}/${count}`);
    }
    latestKey = keys.join("\n");
    generatedKey.textContent = latestKey;
    setStatus(`Создано ${count} ключей по 1 устройству`);
    await refreshLicenses();
  }).catch((error) => setStatus(error.message, true))
);

copyKeyBtn.addEventListener("click", async () => {
  if (!latestKey) return;
  await navigator.clipboard.writeText(latestKey);
  setStatus("Ключ скопирован");
});

licenseRows.addEventListener("click", (event) => {
  const teamButton = event.target.closest("button[data-save-team]");
  if (teamButton) {
    runBusy(teamButton, async () => {
      const selector = `input[data-team="${CSS.escape(teamButton.dataset.saveTeam)}"]`;
      const input = licenseRows.querySelector(selector);
      await window.adminApi.updateLicense(teamButton.dataset.saveTeam, { teamId: input?.value || "" });
      setStatus("Team ID saved");
      await refreshLicenses();
    }).catch((error) => setStatus(error.message, true));
    return;
  }

  const button = event.target.closest("button[data-revoke]");
  if (!button) return;
  runBusy(button, async () => {
    await window.adminApi.revokeLicense(button.dataset.revoke);
    setStatus("Ключ заблокирован");
    await refreshLicenses();
  }).catch((error) => setStatus(error.message, true));
});

loadSettings()
  .then(refreshLicenses)
  .catch((error) => setStatus(error.message, true));
