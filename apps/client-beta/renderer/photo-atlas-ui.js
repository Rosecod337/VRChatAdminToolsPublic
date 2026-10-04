"use strict";

(function installPhotoAtlas(root) {
  let filters = { query: "", from: "", to: "", album: "", offset: 0 }, selected = new Set(), version = 0, progressBound = false;
  root.betaPersonalTools.register("photos", async (body, helpers) => {
    const { api, call, make, field, button, operation, message, text, context } = helpers;
    const request = ++version;
    const result = await call("photo-list", filters);
    if (helpers.automatic && context.isEditing?.()) return;
    if (request !== version || root.betaPersonalTools.getTab() !== "photos") return;
    const controls = make("section", "panel personalPlanEditor");
    controls.append(make("h3", "", "Фотоатлас"));
    const actions = make("div", "personalPlanActions");
    actions.append(button("Выбрать папку", async () => { const value = await call("photo-folder"); if (!value.canceled) message("Индексирование началось. Можно продолжать работу."); }), button("Остановить индексирование", () => call("photo-cancel")), button("Обновить", helpers.refresh));
    controls.append(actions);
    const search = make("div", "personalStepFields");
    search.append(field("Фото, подпись или World ID", filters.query, (value) => { filters.query = value; filters.offset = 0; }), field("Альбом", filters.album, (value) => { filters.album = value; filters.offset = 0; }), field("С даты", filters.from, (value) => { filters.from = value; filters.offset = 0; }, { type: "date" }), field("По дату", filters.to, (value) => { filters.to = value; filters.offset = 0; }, { type: "date" }));
    const reload = helpers.refresh;
    search.append(button("Найти", reload)); controls.append(search);
    controls.append(make("p", "mutedText", `${text("Фотографий")}: ${result.total} · ${text("Выбрано")}: ${selected.size}`));
    if (result.needsApproval) controls.append(make("p", "mutedText", "После восстановления выберите папку оригиналов заново. Альбомы и подписи сохранятся."));
    const job = make("p", "mutedText"); job.dataset.photoJob = "";
    job.textContent = `${result.job.running ? text("Индексирование") : text("Индекс готов")} · ${result.job.indexed} · ${text("Пропущено")}: ${result.job.skipped}`;
    controls.append(job);
    const options = make("div", "personalPlanActions");
    const strip = document.createElement("input"); strip.type = "checkbox"; strip.checked = true;
    const hide = document.createElement("input"); hide.type = "checkbox"; hide.checked = true;
    const stripLabel = make("label", "checkRow"); stripLabel.append(strip, make("span", "", "Удалить XMP/EXIF и текстовые метаданные"));
    const hideLabel = make("label", "checkRow"); hideLabel.append(hide, make("span", "", "Заменить имена файлов"));
    options.append(stripLabel, hideLabel, button("Экспорт выбранных копий", async () => {
      if (!selected.size) { message("Выберите фотографии."); return; }
      const value = await call("photo-export", { ids: [...selected], stripMetadata: strip.checked, hideFilenames: hide.checked });
      if (!value.canceled) message(`${text("Копий сохранено")}: ${value.copied}`);
    })); controls.append(options, make("p", "mutedText", "Оригиналы не меняются. Удаление метаданных не скрывает людей или текст внутри изображения. Неизвестные миры и участники не угадываются."));
    const grid = make("div", "photoAtlasGrid"); body.replaceChildren(controls, grid);
    if (!result.rows.length) grid.append(make("p", "emptyState", "Выберите папку или измените фильтры."));
    for (const row of result.rows) {
      const card = make("article", "panel photoAtlasCard"); card.dataset.photoId = row.id;
      const image = document.createElement("img"); image.alt = row.caption || row.filename; image.loading = "lazy"; card.append(image);
      const choose = document.createElement("input"); choose.type = "checkbox"; choose.checked = selected.has(row.id);
      choose.addEventListener("change", () => { if (choose.checked) selected.add(row.id); else selected.delete(row.id); });
      const label = make("label", "checkRow"); label.append(choose, make("strong", "", row.filename)); card.append(label);
      card.append(make("p", "mutedText", `${row.captured_at.slice(0, 10)} · ${text(row.date_source === "metadata" ? "Дата из метаданных" : "Дата изменения файла")} · ${row.world_id || text("Мир неизвестен")}`));
      const data = { id: row.id, album: row.album, caption: row.caption, sessionId: row.session_id };
      card.append(make("p", "mutedText", `${row.album || "—"} · ${row.caption || "—"}`));
      card.append(button("Изменить подпись", async () => {
        body.querySelectorAll(".photoAnnotationEditor").forEach((node) => node.remove());
        const editor = make("div", "photoAnnotationEditor");
        editor.append(field("Альбом", row.album, (value) => { data.album = value; }), field("Подпись", row.caption, (value) => { data.caption = value; }, { maximum: 500 }));
        const sessions = await call("photo-sessions");
        const sessionLabel = make("label", "adminField"); sessionLabel.append(make("span", "", "Связать с сессией"));
        const select = document.createElement("select"); select.add(new Option(text("Не связана"), "")); for (const session of sessions) select.add(new Option(session.name, session.id));
        select.value = row.session_id; select.addEventListener("change", () => { data.sessionId = select.value; }); sessionLabel.append(select); editor.append(sessionLabel);
        editor.append(button("Сохранить", async () => { await call("photo-annotate", data); message("Подпись сохранена."); await helpers.refresh(); }));
        card.append(editor);
      }));
      if (row.session_id) card.append(button("Открыть сессию", () => context.openHistory?.(row.session_id)));
      grid.append(card);
      if (root.betaPersonalTools.getTab() !== "photos") return;
      try { const thumbnail = await call("photo-thumbnail", { id: row.id }); if (request !== version || root.betaPersonalTools.getTab() !== "photos") return; if (thumbnail) image.src = thumbnail; } catch { image.alt = text("Файл недоступен"); }
    }
    const pages = make("div", "personalPlanActions");
    const previous = button("Предыдущие", () => { filters.offset = Math.max(0, filters.offset - 36); return reload(); }); previous.disabled = filters.offset === 0;
    const next = button("Следующие", () => { filters.offset += 36; return reload(); }); next.disabled = filters.offset + 36 >= result.total; pages.append(previous, next); body.append(pages);
    if (!progressBound && api.onPhotoProgress) {
      progressBound = true;
      api.onPhotoProgress((value) => { const node = document.querySelector("[data-photo-job]"); if (node) node.textContent = `${text(value.running ? "Индексирование" : "Индекс готов")} · ${value.indexed} · ${text("Пропущено")}: ${value.skipped}`; });
    }
  });
})(window);
