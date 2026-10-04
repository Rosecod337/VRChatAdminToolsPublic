"use strict";

(function installDiagnosticRecorder(root) {
  let selected = "", comparison = "";
  root.betaPersonalTools.register("diagnostics", async (body, helpers) => {
    const { call, make, button, field, message, text, refresh } = helpers;
    const state = await call("diagnostic-state");
    if (root.betaPersonalTools.getTab() !== "diagnostics") return;
    selected = state.runs.some((run) => run.id === selected) ? selected : state.runs[0]?.id || "";
    const panel = make("section", "panel personalPlanEditor"); panel.append(make("h3", "", "Диагностический регистратор"));
    const live = make("p", "mutedText", state.running ? "Запись идёт. Показатели обновляются автоматически." : "Запись остановлена."); live.dataset.diagnosticLive = ""; panel.append(live);
    root.betaPersonalTools.registerAutoRefresh("diagnostics", async () => {
      const fresh = await call("diagnostic-state");
      const node = document.querySelector("[data-diagnostic-live]");
      if (node) node.textContent = text(fresh.running ? "Запись идёт. Показатели обновляются автоматически." : "Запись остановлена.");
      if (fresh.running && selected === fresh.current && results.children.length) await renderDetail();
    });
    let name = "";
    panel.append(field("Название записи", name, (value) => { name = value; }, { maximum: 100 }));
    panel.append(make("p", "mutedText", "Запись включается только вами. Сохраняются ресурсы процессов, состояние лога и типы событий. Память и содержимое игры не читаются. Одна запись ограничена 1200 отсчётами; хранится до 20 записей."));
    const actions = make("div", "personalPlanActions");
    const start = button("Начать запись", async () => {
      if (!root.confirm(text("Включить запись показателей приложения и процесса VRChat? Личные идентификаторы и содержимое игры не записываются."))) return;
      await call("diagnostic-start", { name }); await refresh();
    }, "data-diagnostic-start"); start.disabled = state.running;
    const stop = button("Остановить запись", async () => { await call("diagnostic-stop"); await refresh(); }, "data-diagnostic-stop"); stop.disabled = !state.running;
    const mark = button("Отметить лаг", async () => { await call("diagnostic-mark", { label: "manual-lag" }); message("Маркер сохранён."); }, "data-diagnostic-mark"); mark.disabled = !state.running;
    actions.append(start, stop, mark, button("Обновить", refresh)); panel.append(actions);
    const choices = make("div", "personalStepFields");
    for (const [label, current, setter] of [["Запись", selected, (value) => { selected = value; }], ["Сравнить с записью", comparison, (value) => { comparison = value; }]]) {
      const wrapper = make("label", "adminField"); wrapper.append(make("span", "", label));
      const select = document.createElement("select"); select.add(new Option(text("Выберите"), "")); for (const run of state.runs) select.add(new Option(`${run.name} · ${run.started_at}`, run.id));
      select.value = current; select.addEventListener("change", () => setter(select.value)); wrapper.append(select); choices.append(wrapper);
    }
    panel.append(choices);
    const results = make("div", "diagnosticDetails"); results.dataset.diagnosticDetails = "";
    const renderDetail = async () => {
      if (!selected) return;
      const detail = await call("diagnostic-detail", { id: selected });
      results.replaceChildren(make("p", "", `${text("Отсчётов")}: ${detail.samples.length} · ${text("Маркеров")}: ${detail.marks.length}`));
      if (detail.run.interrupted) results.append(make("p", "mutedText", "Запись прервана при закрытии приложения. Конец указан по последнему измерению."));
      const chartArea = make("div"), samplesArea = make("div", "diagnosticSampleRows");
      const metric = document.createElement("select");
      const metrics = [["cpuPercent","CPU приложения","%"],["memoryMiB","Память приложения","МиБ"],["eventLoopMs","Задержка главного процесса","ms"],["gameCpu","CPU VRChat","%"],["gameMemory","Память VRChat","МиБ"]];
      for (const [key, label] of metrics) metric.add(new Option(text(label), key));
      const draw = () => {
        const [, label, unit] = metrics.find(([key]) => key === metric.value);
        const values = detail.samples.map((row) => metric.value === "gameCpu" ? row.game?.cpuPercent ?? null : metric.value === "gameMemory" ? row.game?.memoryMiB ?? null : row[metric.value]);
        const known = values.filter((value) => value !== null && Number.isFinite(value)), maximum = Math.max(1, ...known);
        const chart = document.createElementNS("http://www.w3.org/2000/svg", "svg"); chart.setAttribute("viewBox", "0 0 600 160"); chart.classList.add("diagnosticChart"); chart.setAttribute("role", "img"); chart.setAttribute("aria-label", text(label));
        let segment = false, shape = "";
        for (const [index, value] of values.entries()) {
          if (value === null || !Number.isFinite(value)) { segment = false; continue; }
          shape += `${segment ? "L" : "M"}${index / Math.max(1, values.length - 1) * 590 + 5},${150 - Math.max(0, value) / maximum * 140} `; segment = true;
        }
        const line = document.createElementNS(chart.namespaceURI, "path"); line.setAttribute("d", shape); chart.append(line);
        chartArea.replaceChildren(make("p", "mutedText", `${text(label)} · 0–${maximum.toFixed(1)} ${text(unit)} · ${known.length}/${values.length}`), chart, make("p", "mutedText", `${detail.samples[0]?.at || "—"} — ${detail.samples.at(-1)?.at || "—"}`));
      };
      metric.addEventListener("change", draw); results.append(metric, chartArea); draw();
      const format = (value, unit = "") => value === null || value === undefined ? text("Неизвестно") : `${value.toFixed(1)}${unit}`;
      const rows = (samples) => {
        samplesArea.replaceChildren(make("p", "mutedText", `${text("Последние измерения")}: ${Math.min(samples.length, 60)}/${samples.length}`));
        for (const row of samples.slice(-60)) samplesArea.append(make("p", "personalRouteStep", `${row.at} · ${text("Приложение")}: ${format(row.cpuPercent,"%")}, ${format(row.memoryMiB, ` ${text("МиБ")}`)} · VRChat: ${format(row.game?.cpuPercent,"%")}, ${format(row.game?.memoryMiB, ` ${text("МиБ")}`)} · ${text("Задержка главного процесса")}: ${format(row.eventLoopMs," ms")}`));
      };
      results.append(samplesArea); rows(detail.samples);
      for (const mark of detail.marks.slice(-30)) results.append(button(`${mark.at} · ${mark.label}`, () => rows(detail.samples.filter((row) => Math.abs(Date.parse(row.at) - Date.parse(mark.at)) <= 10000))));
      results.append(make("p", "mutedText", "Смена аватара рядом с лагом показывает совпадение по времени, а не виновника."));
    };
    const more = make("div", "personalPlanActions"); more.append(button("Показать временную шкалу", renderDetail, "data-diagnostic-detail"), button("Сравнить записи", async () => {
      if (!selected || !comparison) return;
      const value = await call("diagnostic-compare", { first: selected, second: comparison });
      results.replaceChildren();
      for (const period of [value.first, value.second]) results.append(make("p", "", `${text("Отсчётов")}: ${period.samples} · CPU: ${period.meanCpuPercent === null ? text("Неизвестно") : period.meanCpuPercent.toFixed(2)}% · ${text("Память")}: ${period.meanMemoryMiB === null ? text("Неизвестно") : period.meanMemoryMiB.toFixed(1)} ${text("МиБ")} · ${text("Задержка главного процесса")}: ${period.peakEventLoopMs === null ? text("Неизвестно") : period.peakEventLoopMs.toFixed(1)} ms`));
    }, "data-diagnostic-compare"), button("Экспорт отчёта без личных данных", () => call("diagnostic-export", { id: selected }))); panel.append(more, results); body.replaceChildren(panel);
  });
})(window);
