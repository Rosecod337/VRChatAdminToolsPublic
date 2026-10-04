"use strict";

(function installArcade(root) {
  const SYMBOLS = ["◆", "●", "▲", "★", "☀", "☾", "✦", "⬟"];
  function shuffled(values, random = Math.random) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const other = Math.min(index, Math.max(0, Math.floor(random() * (index + 1))));
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  }
  class MemoryRound {
    constructor(random) { this.deck = shuffled([...SYMBOLS, ...SYMBOLS], random); this.open = []; this.matched = new Set(); this.moves = 0; }
    choose(index) {
      if (!Number.isInteger(index) || index < 0 || index >= 16 || this.open.length === 2 || this.open.includes(index) || this.matched.has(index)) return "ignored";
      this.open.push(index); if (this.open.length < 2) return "first";
      this.moves += 1;
      if (this.deck[this.open[0]] === this.deck[this.open[1]]) { this.open.forEach(value => this.matched.add(value)); this.open = []; return this.matched.size === 16 ? "complete" : "match"; }
      return "miss";
    }
    hide() { this.open = []; }
  }
  class ReactionRound {
    constructor() { this.phase = "idle"; this.readyAt = null; this.scores = []; }
    wait() { this.phase = "waiting"; this.readyAt = null; }
    ready(now) { if (this.phase === "waiting") { this.phase = "ready"; this.readyAt = now; } }
    press(now) {
      if (this.phase === "waiting") { this.phase = "early"; return null; }
      if (this.phase !== "ready") return null;
      const value = Math.max(0, now - this.readyAt); this.scores.push(value); this.phase = this.scores.length >= 5 ? "complete" : "result"; return value;
    }
  }
  const model = { MemoryRound, ReactionRound, shuffled };
  if (typeof module === "object" && module.exports) module.exports = model;
  if (!root.document) return;
  const document = root.document, panel = document.querySelector("[data-arcade-panel]");
  let paid = false, mode = "memory", memory = new MemoryRound(), reaction = new ReactionRound(), timer = null;
  let records = {}; try { records = JSON.parse(root.localStorage.getItem("betaArcadeRecordsV1") || "{}"); } catch { records = {}; }
  const text = value => root.betaI18n.translate(value, root.betaI18n.language());
  const node = (tag, label = "", className = "") => { const element = document.createElement(tag); element.textContent = text(label); element.className = className; return element; };
  const cancel = () => { if (timer) root.clearTimeout(timer); timer = null; };
  function saveRecord(key, value) {
    if (!Number.isFinite(records[key]) || value < records[key]) records[key] = value;
    root.localStorage.setItem("betaArcadeRecordsV1", JSON.stringify({ memory: records.memory, reaction: records.reaction }));
  }
  function button(label, action, attribute) { const value = node("button", label); value.type = "button"; if (attribute) value.setAttribute(attribute, ""); value.addEventListener("click", action); return value; }
  function render() {
    if (!panel) return;
    document.querySelectorAll("[data-arcade-mode]").forEach(value => { value.classList.toggle("active", value.dataset.arcadeMode === mode); value.setAttribute("aria-pressed", String(value.dataset.arcadeMode === mode)); });
    panel.replaceChildren();
    if (!paid) { panel.append(node("p", "Нужен активный платный ключ.")); return; }
    if (mode === "memory") {
      panel.append(node("h3", "Найдите одинаковые пары"), node("p", "Откройте две карточки. Совпавшие пары остаются открытыми.", "mutedText"));
      const stats = node("div", "", "arcadeStats"); stats.append(node("span", `${text("Ходов")}: ${memory.moves}`), node("span", `${text("Пар")}: ${memory.matched.size / 2}/8`), node("span", `${text("Личный рекорд")}: ${Number.isFinite(records.memory) ? records.memory : "—"}`)); panel.append(stats);
      const grid = node("div", "", "memoryGrid"); grid.setAttribute("aria-label", text("Карточки памяти"));
      for (let index = 0; index < 16; index += 1) {
        const visible = memory.open.includes(index) || memory.matched.has(index);
        const card = button(visible ? memory.deck[index] : "?", () => {
          if (!paid) return;
          const result = memory.choose(index); if (result === "complete") saveRecord("memory", memory.moves); render();
          if (result === "miss") timer = root.setTimeout(() => { timer = null; memory.hide(); render(); }, 750);
        }); card.dataset.memoryCard = String(index); card.className = "memoryCard";
        card.classList.toggle("revealed", visible); card.classList.toggle("matched", memory.matched.has(index));
        card.disabled = memory.matched.has(index) || memory.open.length === 2; card.setAttribute("aria-label", visible ? memory.deck[index] : `${text("Закрытая карточка")} ${index + 1}`); grid.append(card);
      }
      panel.append(grid, node("p", memory.matched.size === 16 ? "Все пары найдены. Отличный повод сделать ещё один перерыв!" : "", "arcadeResult"), button("Новая игра", () => { cancel(); memory = new MemoryRound(); render(); }, "data-memory-new"));
    } else {
      panel.append(node("h3", "Пять попыток на реакцию"), node("p", "Нажмите на поле или пробел, когда появится зелёный сигнал. Ранний клик не учитывается.", "mutedText"));
      const labels = { idle: "Начать попытку", waiting: "Ждите зелёный…", ready: "Сейчас!", early: "Рано! Попробовать снова", result: "Следующая попытка", complete: "Начать заново" };
      const target = button(labels[reaction.phase], () => {
        if (!paid) return;
        if (["idle", "early", "result", "complete"].includes(reaction.phase)) {
          if (reaction.phase === "complete") reaction = new ReactionRound();
          cancel(); reaction.wait(); render();
          timer = root.setTimeout(() => { timer = null; reaction.ready(root.performance.now()); render(); panel.querySelector("[data-reaction-target]")?.focus(); }, 1200 + Math.random() * 2400);
        } else { cancel(); const value = reaction.press(root.performance.now()); if (value !== null) saveRecord("reaction", value); render(); }
      }, "data-reaction-target"); target.className = `reactionTarget ${reaction.phase}`;
      target.addEventListener("keydown", event => { if (event.code === "Space") { event.preventDefault(); target.click(); } }); panel.append(target);
      const average = reaction.scores.length ? reaction.scores.reduce((sum, value) => sum + value, 0) / reaction.scores.length : null;
      panel.append(node("p", `${text("Попыток")}: ${reaction.scores.length}/5 · ${text("Среднее")}: ${average === null ? "—" : Math.round(average)} ms · ${text("Личный рекорд")}: ${Number.isFinite(records.reaction) ? Math.round(records.reaction) : "—"} ms`, "arcadeStats"));
      if (reaction.scores.length) panel.append(node("p", `${text("Последний результат")}: ${Math.round(reaction.scores.at(-1))} ms`, "arcadeResult"));
    }
  }
  function pause() { cancel(); memory.hide(); if (["waiting", "ready"].includes(reaction.phase)) reaction.phase = "idle"; render(); }
  document.querySelectorAll("[data-arcade-mode]").forEach(value => value.addEventListener("click", () => { if (!paid) return; pause(); mode = value.dataset.arcadeMode; render(); }));
  document.addEventListener("visibilitychange", () => { if (document.hidden) { pause(); render(); } });
  root.betaArcade = { setAccess(value) { const changed = paid !== value; paid = value; if (!paid) pause(); if (changed || !panel?.children.length) render(); }, pause, getState: () => ({ mode, memory, reaction, timerActive: Boolean(timer) }) };
})(typeof window === "object" ? window : globalThis);
