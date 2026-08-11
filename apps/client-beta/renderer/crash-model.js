(function initCrashModel(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.betaCrashModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCrashModel() {
  "use strict";

  const MAX_INCIDENTS = 20;
  const WINDOW_MS = 5 * 60 * 1000;

  function clip(value, limit = 280) {
    return String(value ?? "").slice(0, limit);
  }

  function timeMs(event) {
    const value = new Date(event?.timestamp || event?.capturedAt || event?.time || 0).getTime();
    return Number.isFinite(value) ? value : 0;
  }

  function displayName(event) {
    return clip(event?.display || event?.displayName || event?.playerName || event?.userId || "неизвестно", 120);
  }

  function verifiedAvatarId(event) {
    const value = String(event?.avatarId || "");
    return /^avtr_[0-9a-f-]{8,}$/iu.test(value) ? value : "";
  }

  function eventDetail(event) {
    return clip(event?.avatarName || verifiedAvatarId(event) || event?.worldName || event?.detail || event?.raw || event?.userId || "—");
  }

  function eventLabel(type) {
    return ({
      "player-joined": "игрок вошёл",
      "player-left": "игрок вышел",
      "avatar-changed": "смена аватара",
      "avatar-loading": "загрузка аватара",
      "avatar-data": "получен Avatar ID",
      "avatar-audio": "компоненты аватара",
      "world-entering": "переход в мир",
      "world-joining": "подключение к миру",
      "world-joined": "мир загружен"
    })[type] || String(type || "событие");
  }

  function actorKey(event) {
    if (event?.userId) return `user:${event.userId}`;
    if (verifiedAvatarId(event)) return `avatar:${verifiedAvatarId(event)}`;
    const name = displayName(event).trim().toLocaleLowerCase("ru-RU");
    if (name && name !== "неизвестно") return `name:${name}`;
    const avatar = String(event?.avatarName || "").trim().toLocaleLowerCase("ru-RU");
    return avatar ? `avatar-name:${avatar}` : "";
  }

  function scoreEvent(event, incidentTimeMs) {
    const ageSec = Math.max(0, Math.round((incidentTimeMs - timeMs(event)) / 1000));
    const reasons = [];
    let score = ageSec <= 15 ? 38 : ageSec <= 30 ? 32 : ageSec <= 60 ? 25 : ageSec <= 120 ? 16 : ageSec <= 300 ? 8 : 0;
    if (score) reasons.push(ageSec <= 60 ? "событие было в последнюю минуту" : "событие было рядом по времени");
    const weights = {
      "avatar-changed": [42, "смена аватара"],
      "avatar-loading": [20, "загрузка аватара"],
      "avatar-data": [26, "появился Avatar ID"],
      "avatar-audio": [24, "обнаружены компоненты аватара"],
      "player-joined": [10, "игрок недавно вошёл"]
    };
    const weighted = weights[event?.type];
    if (weighted) {
      score += weighted[0];
      reasons.push(weighted[1]);
    }
    if (verifiedAvatarId(event)) {
      score += 8;
      reasons.push("есть Avatar ID для проверки");
    }
    if (event?.correlationConfidence === "ambiguous") {
      score = Math.min(score, 12);
      reasons.push("связь игрока и аватара неоднозначна");
    }
    return { score, ageSec, reasons };
  }

  function riskLabel(score) {
    if (score >= 110) return "Высокий";
    if (score >= 65) return "Средний";
    return "Низкий";
  }

  function recentEvents(events, incidentTimeMs, windowMs = WINDOW_MS) {
    const cutoff = incidentTimeMs - windowMs;
    return (events || [])
      .filter((event) => timeMs(event) >= cutoff && timeMs(event) <= incidentTimeMs + 1000)
      .slice(-120);
  }

  function analyzeCandidates(events, incidentTimeMs) {
    const groups = new Map();
    for (const event of events) {
      const key = actorKey(event);
      if (!key) continue;
      const scored = scoreEvent(event, incidentTimeMs);
      if (scored.score <= 0) continue;
      const current = groups.get(key) || {
        key,
        score: 0,
        risk: "Низкий",
        userId: event.userId || "",
        playerName: displayName(event),
        avatarId: verifiedAvatarId(event),
        avatarName: event.avatarName || "",
        reasons: new Set(),
        events: []
      };
      current.score += scored.score;
      current.userId ||= event.userId || "";
      current.avatarId ||= verifiedAvatarId(event);
      current.avatarName ||= event.avatarName || "";
      for (const reason of scored.reasons) current.reasons.add(reason);
      current.events.push({ time: event.timestamp || event.capturedAt, type: event.type, detail: eventDetail(event), ageSec: scored.ageSec });
      groups.set(key, current);
    }
    return [...groups.values()]
      .map((candidate) => ({ ...candidate, risk: riskLabel(candidate.score), reasons: [...candidate.reasons].slice(0, 5), events: candidate.events.slice(-5) }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);
  }

  function currentWorld(events) {
    const world = [...(events || [])].reverse().find((event) => event?.worldName || event?.worldId || event?.instance);
    return String(world?.worldName || world?.worldId || world?.instance || "—");
  }

  function buildIncident(events, status, options = {}) {
    const incidentTimeMs = Number(options.incidentTimeMs || Date.now());
    const recent = recentEvents(events, incidentTimeMs, options.windowMs || WINDOW_MS);
    return {
      id: String(options.id || `crash-${incidentTimeMs}`),
      createdAt: new Date(incidentTimeMs).toISOString(),
      reason: clip(options.reason || "Возможный сбой VRChat", 180),
      worldName: clip(currentWorld(events), 160),
      processRunning: Boolean(status?.processRunning),
      logModifiedAt: status?.logModifiedAt || null,
      manual: Boolean(options.manual),
      suspects: analyzeCandidates(recent, incidentTimeMs),
      candidates: recent.map((event) => ({
        time: event.timestamp || event.capturedAt,
        type: event.type,
        userId: event.userId || "",
        playerName: displayName(event),
        avatarId: verifiedAvatarId(event),
        avatarName: event.avatarName || "",
        detail: eventDetail(event)
      }))
    };
  }

  function normalizeIncidents(value) {
    if (!Array.isArray(value)) return [];
    return value.filter((incident) => incident && incident.id && incident.createdAt).slice(0, MAX_INCIDENTS);
  }

  function report(incident, language = "ru") {
    if (!incident) return "Crash Analyzer: инцидентов нет";
    const suspects = (incident.suspects || []).map((candidate, index) => {
      const who = candidate.playerName || candidate.userId || "неизвестно";
      const avatar = candidate.avatarName || candidate.avatarId || "аватар не определён";
      return `${index + 1}. ${candidate.risk} риск · ${who} · ${avatar} · score ${candidate.score}\n   Причины: ${(candidate.reasons || []).join("; ") || "нет подробностей"}`;
    }).join("\n") || "нет кандидатов";
    const rows = (incident.candidates || []).slice(-20).map((event) => {
      const date = new Date(event.time);
      const stamp = Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      return `• ${stamp} — ${eventLabel(event.type)}: ${event.playerName || event.userId || "—"} — ${event.avatarName || event.avatarId || event.detail || "—"}`;
    }).join("\n") || "нет данных";
    return [
      "**VRChat Crash Risk Report**",
      `Время: ${new Date(incident.createdAt).toLocaleString(language === "en" ? "en-US" : "ru-RU")}`,
      `Причина: ${incident.reason}`,
      `Мир: ${incident.worldName}`,
      "",
      "**Кандидаты по времени:**",
      suspects,
      "",
      "**Последние события перед возможным сбоем:**",
      rows,
      "",
      "_Отчёт показывает только совпадения по времени и не доказывает вину игрока или аватара._"
    ].join("\n");
  }

  return { MAX_INCIDENTS, WINDOW_MS, timeMs, eventLabel, eventDetail, riskLabel, recentEvents, analyzeCandidates, buildIncident, normalizeIncidents, report };
});
