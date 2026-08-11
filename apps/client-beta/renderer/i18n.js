(function initBetaI18n(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.betaI18n = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBetaI18n(root) {
  "use strict";

  const STORAGE_KEY = "betaUiSettings";
  const SUPPORTED = new Set(["ru", "en"]);

  const EN = Object.freeze({
    "Отдельное приложение · Beta": "Standalone app · Beta",
    "Новый интерфейс поверх проверенного ядра Stable. Beta использует отдельную копию настроек и не изменяет Stable.": "A new interface built on the proven Stable core. Beta keeps separate settings and does not modify Stable.",
    "Ключ доступа": "Access key",
    "тот же, что в Stable": "the same one used in Stable",
    "Введите обычный ключ VRChat Admin Tools, который вы получили при покупке или от администратора.": "Enter the regular VRChat Admin Tools key you received after purchase or from an administrator.",
    "Имя автора заметок": "Note author name",
    "только для нового ключа": "new keys only",
    "Например: Rose337": "Example: Rose337",
    "Публичная подпись рядом с вашими командными заметками и отметками. Она запрашивается один раз.": "The public signature shown beside your team notes and labels. It is requested only once.",
    "необязательно": "optional",
    "Можно проверить аккаунт до входа. Cookie хранится только в настройках приложения.": "You can verify the account before signing in. The cookie is stored only in the app settings.",
    "Запомнить вход на этом устройстве": "Remember sign-in on this device",
    "Проверить VRChat": "Verify VRChat",
    "Войти в Beta": "Sign in to Beta",
    "Использовать вход из Stable": "Use Stable sign-in",
    "Проверяем сохранённую лицензию…": "Checking saved licence…",
    "Язык интерфейса": "Interface language",
    "Русский": "Russian",
    "Открыть уведомления": "Open notifications",
    "Последние уведомления": "Recent notifications",
    "События приложения": "App events",
    "Уведомления": "Notifications",
    "Очистить": "Clear",
    "Новых уведомлений нет.": "No new notifications.",
    "Скрыть верхнюю панель": "Hide top bar",
    "Показать верхнюю панель": "Show top bar",
    "Настройки": "Settings",
    "Установить обновление": "Install update",
    "Выйти": "Sign out",
    "Основные действия": "Main actions",
    "Выбрать лог": "Choose log",
    "Анализ": "Analyze",
    "Снимок": "Snapshot",
    "Сообщество": "Community",
    "Запустить": "Start",
    "Остановить": "Stop",
    "Лог ещё не выбран": "No log selected yet",
    "Разделы Beta": "Beta sections",
    "Сессия": "Session",
    "Мой VRChat": "My VRChat",
    "История": "History",
    "Ещё · Builder": "More · Builder",
    "Текущая сессия": "Current session",
    "Живая сессия": "Live session",
    "События локального лога": "Local log events",
    "Сессия в реальном времени": "Real-time session",
    "Кто находится в инстансе и что происходило в текущей сессии.": "See who is in the instance and what happened during the current session.",
    "онлайн": "online",
    "Экраны Сессии": "Session views",
    "Лента": "Feed",
    "Аватары": "Avatars",
    "Дашборд": "Dashboard",
    "Онлайн": "Online",
    "сейчас в мире": "in the world now",
    "Пик": "Peak",
    "за сессию": "this session",
    "Игроков": "Players",
    "уникальных": "unique",
    "Мир": "World",
    "последний из лога": "latest from log",
    "Фильтр игроков": "Player filter",
    "Онлайн сначала": "Online first",
    "Только онлайн": "Online only",
    "Все за сессию": "Everyone in session",
    "Поиск игрока": "Player search",
    "Поиск игрока или User ID…": "Search player or User ID…",
    "Фильтры ленты событий": "Event feed filters",
    "Показывать в ленте": "Show in feed",
    "Миры и порталы": "Worlds and portals",
    "Другое": "Other",
    "Сейчас": "Now",
    "Лента событий": "Event feed",
    "Запустите чтение лога — новые события появятся здесь.": "Start reading the log and new events will appear here.",
    "Событий выбранных типов пока нет.": "There are no events of the selected types yet.",
    "Люди": "People",
    "Игроки сессии": "Session players",
    "Пока никого нет.": "No one is here yet.",
    "Событий аватаров": "Avatar events",
    "Уникальных": "Unique",
    "по имени или ID": "by name or ID",
    "С Avatar ID": "With Avatar ID",
    "подтверждённых": "verified",
    "меняли аватар": "changed avatar",
    "Поиск аватара": "Avatar search",
    "Название, Avatar ID или игрок…": "Name, Avatar ID or player…",
    "Фильтр аватаров": "Avatar filter",
    "Все аватары": "All avatars",
    "С меткой crash": "Labeled crash",
    "Без Avatar ID": "Without Avatar ID",
    "Расширенный поиск": "Extended search",
    "Обновить каталог": "Refresh catalog",
    "Расширенный поиск VRChat": "Extended VRChat search",
    "Результаты": "Results",
    "Ищем среди ваших, избранных и лицензированных аватаров…": "Searching your, favorite and licensed avatars…",
    "Совпадений в доступных источниках VRChat не найдено.": "No matches were found in the available VRChat sources.",
    "Автор не указан": "Unknown author",
    "избранное": "favorites",
    "ваши": "yours",
    "лицензированные": "licensed",
    "публичный": "public",
    "доступ не подтверждён": "access not verified",
    "В каталог": "Add to catalog",
    "В избранное": "Favorite",
    "Добавляем…": "Adding…",
    "поиск…": "searching…",
    "Открыть аватар в каталоге": "Open avatar in catalog",
    "Страница": "Page",
    "Для расширенного поиска введите хотя бы 2 символа.": "Enter at least 2 characters for extended search.",
    "Расширенный поиск недоступен в этой сборке.": "Extended search is unavailable in this build.",
    "Расширенный поиск аватаров недоступен.": "Extended avatar search is unavailable.",
    "Результат поиска больше недоступен.": "This search result is no longer available.",
    "Аватар сохранён в каталог программы.": "The avatar was saved to the app catalog.",
    "Аватар уже был в избранном VRChat; каталог программы обновлён.": "The avatar was already in VRChat favorites; the app catalog was updated.",
    "Аватар сохранён в каталог и избранное VRChat.": "The avatar was saved to the catalog and VRChat favorites.",
    "Добавить в избранное можно только подтверждённый публичный аватар.": "Only a verified public avatar can be added to favorites.",
    "Текущая сессия": "Current session",
    "Карточка игрока": "Player card",
    "В сети": "Online",
    "Не в сети": "Offline",
    "Вошёл": "Joined",
    "Мир": "World",
    "Не определён": "Unknown",
    "Текущий аватар": "Current avatar",
    "Нет данных": "No data",
    "Смен аватара": "Avatar changes",
    "Avatar ID не подтверждён": "Avatar ID is not verified",
    "Открыть в аватарах": "Open in avatars",
    "Последние смены": "Recent changes",
    "Свободная": "Freeform",
    "Пресет": "Preset",
    "Две колонки": "Two columns",
    "VR крупно": "VR large",
    "Лента": "Feed",
    "Применить": "Apply",
    "Уменьшить шрифт блока": "Decrease block font",
    "Увеличить шрифт блока": "Increase block font",
    "Поиск в блоке…": "Search this block…",
    "Сессия и каталог": "Session and catalog",
    "Обнаруженные аватары": "Detected avatars",
    "Каталог аватаров": "Avatar catalog",
    "Каталог команды": "Team catalog",
    "Личный каталог": "Personal catalog",
    "Ключу разрешено видеть весь каталог команды": "This key can view the entire team catalog",
    "Показаны записи, созданные этим ключом": "Showing records created by this key",
    "Событий аватаров пока нет.": "No avatar events yet.",
    "Выберите аватар": "Select an avatar",
    "Avatar ID, командная метка и общие публикации появятся здесь.": "Avatar ID, team label and shared reports will appear here.",
    "Входов": "Joins",
    "Выходов": "Leaves",
    "Аватаров": "Avatars",
    "Смен мира": "World changes",
    "Длительность": "Duration",
    "Событий": "Events",
    "Состав событий": "Event breakdown",
    "Активность сессии": "Session activity",
    "Хронология": "Timeline",
    "Важные события": "Important events",
    "Важных событий пока нет.": "No important events yet.",
    "Личная история этого устройства": "Personal history on this device",
    "Сессии, миры и люди — без чтения друзей, голоса или личных сообщений.": "Sessions, worlds and people — without reading friends, voice or private messages.",
    "7 дней": "7 days",
    "30 дней": "30 days",
    "90 дней": "90 days",
    "Всё время": "All time",
    "Период статистики": "Statistics period",
    "Копировать итог": "Copy summary",
    "Обновить": "Refresh",
    "Текущий пользователь": "Current user",
    "Текущий инстанс": "Current instance",
    "Не проверен": "Not checked",
    "Сессий": "Sessions",
    "Времени": "Time",
    "Миров": "Worlds",
    "Уникальных игроков": "Unique players",
    "Повторных встреч": "Repeat encounters",
    "Всего встреч": "Total encounters",
    "Чаще рядом": "Seen most often",
    "Повторные встречи": "Repeat encounters",
    "Нет повторных встреч.": "No repeat encounters.",
    "Где бывали": "Visited worlds",
    "Миры": "Worlds",
    "Миры ещё не сохранены.": "No worlds saved yet.",
    "Последние": "Latest",
    "Сохранённые сессии": "Saved sessions",
    "История загрузится после входа.": "History will load after sign-in.",
    "Выберите сессию": "Select a session",
    "Мир, длительность и сохранённые встречи появятся здесь.": "World, duration and saved encounters will appear here.",
    "Сохранено на сервере": "Saved on server",
    "История сессий": "Session history",
    "Поиск по мирам, игрокам и состоянию сохранённых запусков.": "Search saved runs by world, player and state.",
    "Поиск в истории": "History search",
    "Мир, игрок, User ID или метка…": "World, player, User ID or label…",
    "Дата сессии": "Session date",
    "Состояние сессии": "Session state",
    "Все сессии": "All sessions",
    "В процессе": "In progress",
    "Завершённые": "Completed",
    "Сбросить": "Reset",
    "Архив": "Archive",
    "Сессии": "Sessions",
    "История ещё не загружена.": "History has not been loaded yet.",
    "Мир, длительность и участники появятся здесь.": "World, duration and participants will appear here.",
    "Командная работа": "Team workspace",
    "Игроки из текущей сессии, логов за сегодня и общих командных заметок.": "Players from the current session, today's logs and shared team notes.",
    "Поиск игрока Admin Tools": "Admin Tools player search",
    "Имя, User ID или заметка…": "Name, User ID or note…",
    "Фильтр игроков Admin Tools": "Admin Tools player filter",
    "Все": "All",
    "Игроки за сегодня": "Today's players",
    "Копировать снимок": "Copy snapshot",
    "Игроки": "Players",
    "Игроки Admin Tools": "Admin Tools players",
    "Заметки ещё не загружены.": "Notes have not been loaded yet.",
    "Выберите игрока": "Select a player",
    "Откройте сохранённого игрока слева, чтобы изменить командную метку или заметку.": "Select a saved player on the left to change the team label or note.",
    "Карточка остаётся открытой": "The card remains open",
    "Игрок скрыт текущим поиском или фильтром списка.": "The player is hidden by the current search or list filter.",
    "Показать в списке": "Show in list",
    "Доступ владельца": "Owner access",
    "VRChat-группа не настроена": "VRChat group is not configured",
    "Источник игроков Owner": "Owner player source",
    "Логи": "Logs",
    "Группа": "Group",
    "Поиск игрока Owner": "Owner player search",
    "Имя, User ID или ссылка VRChat…": "Name, User ID or VRChat link…",
    "Фильтр игроков Owner": "Owner player filter",
    "Найти в группе": "Find in group",
    "Игроки Owner": "Owner players",
    "Запустите чтение лога или загрузите игроков за сегодня.": "Start reading the log or load today's players.",
    "Профиль, командная заметка и подтверждаемые действия появятся здесь.": "Profile, team note and confirmed actions will appear here.",
    "Осторожный анализ": "Careful analysis",
    "Анализатор выключен.": "Analyzer is disabled.",
    "Включить": "Enable",
    "Лагает сейчас": "Lagging now",
    "Копировать отчёт": "Copy report",
    "Очистить историю": "Clear history",
    "Проверить": "Check",
    "Это не доказательство.": "This is not proof.",
    "Совпадение игрока или аватара по времени помогает проверить контекст, но не доказывает причину сбоя и не назначает виновного.": "A player or avatar matching the time can help verify context, but does not prove the cause of a crash or assign blame.",
    "Отслеживание": "Monitoring",
    "выключено": "disabled",
    "Текущий лог": "Current log",
    "Обновлён": "Updated",
    "Сохранено локально": "Saved locally",
    "Инциденты": "Incidents",
    "Инцидентов пока нет.": "No incidents yet.",
    "Выберите инцидент": "Select an incident",
    "Здесь появятся кандидаты по времени и последовательность последних событий.": "Time-based candidates and the latest event sequence will appear here.",
    "Настраиваемое рабочее место": "Custom workspace",
    "Выберите блоки, перетащите их в нужном порядке и настройте окно поверх VRChat.": "Choose blocks, drag them into the preferred order and configure the overlay window.",
    "Поверх окон": "Always on top",
    "Компактно": "Compact",
    "Раскладка": "Layout",
    "Сетка": "Grid",
    "Строки": "Rows",
    "Блоки": "Blocks",
    "Заход / выход": "Join / leave",
    "Порталы": "Portals",
    "Прозрачность": "Opacity",
    "Закрыть карточку": "Close card",
    "Игрок текущей сессии": "Current session player",
    "Игрок": "Player",
    "неизвестно": "unknown",
    "Последнее событие": "Last event",
    "Время": "Time",
    "Профиль VRChat": "VRChat profile",
    "Открыть в Admin Tools": "Open in Admin Tools",
    "Открыть в Owner": "Open in Owner",
    "Подтверждаемое действие": "Confirmed action",
    "Модерация VRChat-группы": "VRChat group moderation",
    "Игрок не выбран": "No player selected",
    "Действие": "Action",
    "Забанить в группе": "Ban from group",
    "Разбанить в группе": "Unban from group",
    "Срок": "Duration",
    "Постоянно": "Permanent",
    "Временно": "Temporary",
    "Единица": "Unit",
    "минут": "minutes",
    "часов": "hours",
    "дней": "days",
    "Причина": "Reason",
    "Кратко опишите причину…": "Briefly describe the reason…",
    "Ссылка на доказательство · необязательно": "Evidence link · optional",
    "Перед отправкой проверьте профиль и причину. Запрос будет выполнен сервером и сохранён в истории.": "Check the profile and reason before submitting. The request will be processed by the server and saved in history.",
    "Отмена": "Cancel",
    "Отправить запрос": "Submit request",
    "Только для Beta": "Beta only",
    "Настройки приложения": "App settings",
    "Интерфейс": "Interface",
    "Стартовый раздел": "Start section",
    "Плотность": "Density",
    "Комфортная": "Comfortable",
    "Компактная": "Compact",
    "Масштаб интерфейса": "Interface scale",
    "Использовать анимации": "Use animations",
    "Показывать верхнюю шапку": "Show top bar",
    "Показывать панель быстрых действий": "Show quick actions",
    "Игроки по умолчанию": "Default player view",
    "Буфер событий": "Event buffer",
    "Автоматически анализировать логи за текущий день": "Automatically analyze today's logs",
    "Запоминать выбранные карточки": "Remember selected cards",
    "Уведомлять о входе отмеченных игроков": "Notify when labeled players join",
    "Уведомлять об отмеченных crash-аватарах": "Notify about labeled crash avatars",
    "Системные уведомления появляются только по свежим событиям активного лога. Чтение старой истории их не вызывает.": "System notifications are shown only for fresh events in the active log. Reading old history does not trigger them.",
    "Приватность": "Privacy",
    "Ключ и VRChat cookie не попадают в renderer-настройки. Здесь сохраняются только параметры интерфейса.": "The key and VRChat cookie are never stored in renderer settings. Only interface preferences are saved here.",
    "Очищать поиски и выбор при выходе": "Clear searches and selections on sign-out",
    "По умолчанию": "Defaults",
    "Сохранить": "Save",
    "Состояние": "Status",
    "Готово к запуску": "Ready to start",
    "Готово": "Ready",
    "Мониторинг": "Monitoring",
    "Чтение лога активно": "Log monitoring active",
    "Чтение лога запущено": "Log monitoring started",
    "Чтение лога остановлено": "Log monitoring stopped",
    "Мониторинг запущен": "Monitoring started",
    "Мониторинг остановлен": "Monitoring stopped",
    "Ошибка чтения лога": "Log read error",
    "Ошибка": "Error",
    "ошибка": "error",
    "Внимание": "Warning",
    "Уведомление": "Notification",
    "Требует внимания": "Needs attention",
    "Настройки Beta сохранены.": "Beta settings saved.",
    "Верхняя панель скрыта. Вернуть её можно стрелкой справа сверху.": "Top bar hidden. Use the arrow in the upper-right corner to show it again.",
    "Верхняя панель показана.": "Top bar shown.",
    "Значения сброшены в форме. Нажмите «Сохранить», чтобы применить.": "Values were reset in the form. Click Save to apply them.",
    "Недоступно для текущего ключа": "Unavailable for the current key",
    "Owner недоступен для этого ключа.": "Owner is unavailable for this key.",
    "Owner недоступен: у этого ключа нет прав владельца": "Owner unavailable: this key has no owner permissions",
    "Не найден в текущем логе": "Not found in the current log",
    "Мир ещё не найден в логе": "World not found in the log yet",
    "Неизвестный мир": "Unknown world",
    "Неизвестный игрок": "Unknown player",
    "Неизвестный аватар": "Unknown avatar",
    "Не найден": "Not found",
    "не найден": "not found",
    "нет данных": "no data",
    "без заметки": "no note",
    "Без заметки": "No note",
    "Без отметки": "No label",
    "Без текста": "No text",
    "в сети": "online",
    "в сети сейчас": "online now",
    "не в сети": "offline",
    "● онлайн": "● online",
    "● не в сети": "● offline",
    "вошёл": "joined",
    "вышел": "left",
    "сменил аватар": "changed avatar",
    "создан портал": "portal created",
    "портал удалён": "portal removed",
    "мир загружен": "world loaded",
    "подключение к миру": "connecting to world",
    "загрузка мира": "loading world",
    "Сохранение…": "Saving…",
    "Сохраняем…": "Saving…",
    "Загружаем историю…": "Loading history…",
    "Загружаем командные заметки…": "Loading team notes…",
    "Загружаем запросы…": "Loading requests…",
    "загрузка…": "loading…",
    "Выбираем…": "Choosing…",
    "Анализируем…": "Analyzing…",
    "Копируем…": "Copying…",
    "Открываем…": "Opening…",
    "Запускаем…": "Starting…",
    "Останавливаем…": "Stopping…",
    "Обновляем…": "Refreshing…",
    "Проверяем…": "Checking…",
    "Устанавливаем…": "Installing…",
    "Выходим…": "Signing out…",
    "Выполняем…": "Working…",
    "Отправляем…": "Submitting…",
    "Публикуем…": "Publishing…",
    "Удаляем…": "Removing…",
    "Повторяем…": "Retrying…",
    "Восстанавливаем…": "Restoring…",
    "Ищем…": "Searching…",
    "Активируем лицензию…": "Activating licence…",
    "Проверяем VRChat аккаунт…": "Checking VRChat account…",
    "Копируем сохранённый вход из Stable…": "Copying saved Stable sign-in…",
    "Проверяем обновления…": "Checking for updates…",
    "Подготавливаем анализ текущего инстанса…": "Preparing current instance analysis…",
    "Читаем выбранный лог заново…": "Reading the selected log again…",
    "Читаем логи…": "Reading logs…",
    "Собираем статистику…": "Collecting statistics…",
    "Лог выбран. Можно запускать чтение или анализ.": "Log selected. You can start monitoring or run analysis.",
    "Выбор лога отменён.": "Log selection canceled.",
    "Анализ отменён": "Analysis canceled",
    "Автоматический анализ логов за сегодня не выполнен.": "Automatic analysis of today's logs could not be completed.",
    "Анализируем логи за текущий день…": "Analyzing today's logs…",
    "Логи VRChat за сегодня не найдены.": "No VRChat logs were found for today.",
    "Логи за текущий день проанализированы. Новые события отслеживаются автоматически.": "Today's logs were analyzed. New events are now monitored automatically.",
    "VRChat создал новый лог. Чтение продолжено автоматически.": "VRChat created a new log. Monitoring continued automatically.",
    "Лог был перезаписан. Чтение продолжено с начала файла.": "The log was overwritten. Monitoring continued from the beginning.",
    "Командная заметка сохранена": "Team note saved",
    "Заметка об аватаре сохранена.": "Avatar note saved.",
    "Предыдущее значение заметки восстановлено.": "The previous note value was restored.",
    "Заметка опубликована для всех команд.": "Note published to all teams.",
    "Общая публикация команды удалена.": "The team's shared report was removed.",
    "Отметка аватара опубликована для всех команд.": "Avatar label published to all teams.",
    "Общая отметка аватара удалена.": "Shared avatar label removed.",
    "Запрос на бан отправлен.": "Ban request submitted.",
    "Запрос на разбан отправлен.": "Unban request submitted.",
    "Запрос повторно добавлен в очередь.": "Request queued again.",
    "Операция добавлена в очередь.": "Operation added to the queue.",
    "Такая операция уже выполняется.": "This operation is already running.",
    "Снимок текущей сессии скопирован": "Current session snapshot copied",
    "Снимок сессии скопирован.": "Session snapshot copied.",
    "Снимок Admin Tools скопирован.": "Admin Tools snapshot copied.",
    "Сессия из истории скопирована.": "History session copied.",
    "Отчёт Crash Analyzer скопирован.": "Crash Analyzer report copied.",
    "Итог «Мой VRChat» скопирован.": "My VRChat summary copied.",
    "Снимок лага сохранён.": "Lag snapshot saved.",
    "Возможный сбой VRChat сохранён.": "Possible VRChat crash saved.",
    "История Crash Analyzer очищена.": "Crash Analyzer history cleared.",
    "Сообщество открыто в браузере": "Community opened in the browser",
    "Компактный режим включён.": "Compact mode enabled.",
    "Обычный размер восстановлен.": "Normal window size restored.",
    "Окно закреплено поверх остальных.": "Window pinned above others.",
    "Окно откреплено.": "Window unpinned.",
    "Настройки Builder сброшены.": "Builder settings reset.",
    "Обычный вид": "Normal view",
    "Открепить": "Unpin",
    "Проверить производительность": "Check performance",
    "Профиль": "Profile",
    "Копировать": "Copy",
    "Выбрать": "Select",
    "Повторить": "Retry",
    "Опубликовать всем": "Publish to all",
    "Обновить общую": "Update shared report",
    "Убрать нашу публикацию": "Remove our report",
    "Восстановить предыдущее": "Restore previous",
    "Заметка команды": "Team note",
    "Метка команды": "Team label",
    "Метка": "Label",
    "Статус": "Status",
    "Изменил": "Changed by",
    "История изменений": "Change history",
    "Общие публикации": "Shared reports",
    "Видны всем командам с доступом": "Visible to every team with access",
    "Для команды": "For the team",
    "Для всех команд": "For all teams",
    "Другая команда": "Another team",
    "Команда": "Team",
    "Ключ": "Key",
    "Обновлено": "Updated",
    "История запросов": "Request history",
    "Центр Owner": "Owner center",
    "Сводка модерации": "Moderation overview",
    "Очередь действий, временные баны и игроки под наблюдением.": "Queued actions, temporary bans, and watched players.",
    "В очереди": "Queued",
    "Временные баны": "Temporary bans",
    "Под наблюдением": "Watched",
    "Требуют внимания": "Needs attention",
    "Последние операции": "Recent operations",
    "Активные временные баны": "Active temporary bans",
    "Активных временных банов нет.": "There are no active temporary bans.",
    "Журнал модерации команды": "Team moderation log",
    "Операции управления VRChat-группой": "VRChat group management operations",
    "Операций пока нет.": "No operations yet.",
    "Операций с группой пока нет.": "No group operations yet.",
    "Список участников": "Member list",
    "Проверка участника": "Member check",
    "Выдача роли": "Assign role",
    "Отзыв роли": "Remove role",
    "Заметки управляющих": "Manager notes",
    "Исключение участника": "Remove member",
    "Операция": "Operation",
    "Причина не указана": "No reason provided",
    "до": "until",
    "Активных или ошибочных операций нет.": "No active or failed operations.",
    "Список наблюдения пуст.": "The watchlist is empty.",
    "карточка": "card",
    "Наблюдать": "Watch",
    "Снять наблюдение": "Stop watching",
    "Копировать карточку": "Copy card",
    "Игрок добавлен под наблюдение.": "Player added to the watchlist.",
    "Наблюдение снято.": "Player removed from the watchlist.",
    "Карточка инцидента скопирована.": "Incident card copied.",
    "VRChat Admin Tools · карточка инцидента": "VRChat Admin Tools · incident card",
    "Заметка": "Note",
    "нет": "none",
    "Подтверждённых операций": "Confirmed operations",
    "Последние аватары:": "Recent avatars:",
    "Последние события:": "Recent events:",
    "- нет данных": "- no data",
    "- нет событий": "- no events",
    "Назначенные роли": "Assigned roles",
    "Доступные роли": "Available roles",
    "Нет ролей": "No roles",
    "Управляющая роль": "Management role",
    "Роль группы": "Group role",
    "Проверить членство": "Verify membership",
    "Исключить из группы": "Remove from group",
    "Отправить бан": "Submit ban",
    "Отправить разбан": "Submit unban",
    "Забанить": "Ban",
    "Разбанить": "Unban",
    "Бан": "Ban",
    "Разбан": "Unban",
    "Управление VRChat-группой": "VRChat group management",
    "Не удалось связаться с сервером. Проверьте интернет и повторите действие.": "Could not reach the server. Check your connection and try again.",
    "Сервер временно не отвечает. Повторите действие немного позже.": "The server is temporarily unavailable. Try again shortly.",
    "Нет доступа. Проверьте лицензию и права этого ключа.": "Access denied. Check the licence and permissions for this key.",
    "Сессия завершена.": "Session ended.",
    "Сохранённая сессия недействительна.": "The saved session is invalid.",
    "Сохранённая сессия Stable недоступна.": "The saved Stable session is unavailable.",
    "Ключ не найден. Введите тот же ключ, который используется в Stable.": "Key not found. Enter the same key used in Stable.",
    "Этот ключ заблокирован.": "This key is blocked.",
    "Срок действия ключа истёк.": "The key has expired.",
    "Для ключа достигнут лимит устройств.": "The device limit for this key has been reached.",
    "Для нового ключа придумайте имя автора заметок.": "Choose a note author name for the new key.",
    "Имя автора должно содержать от 3 до 24 символов.": "The author name must contain 3 to 24 characters.",
    "В имени разрешены буквы, цифры, пробел, точка, дефис и подчёркивание.": "The name may contain letters, digits, spaces, dots, hyphens and underscores.",
    "Не смешивайте кириллицу и латиницу в имени автора.": "Do not mix Cyrillic and Latin characters in the author name.",
    "Это имя зарезервировано. Выберите другое.": "This name is reserved. Choose another one.",
    "Это имя уже используется другим ключом.": "This name is already used by another key.",
    "VRChat cookie не подошёл или устарел. Вставьте его в формате auth=authcookie_...": "The VRChat cookie is invalid or expired. Paste it in the auth=authcookie_... format.",
    "VRChat cookie не указан или недействителен. Скопируйте auth через Cookie-Editor.": "The VRChat cookie is missing or invalid. Copy auth using Cookie-Editor.",
    "Не удалось активировать лицензию.": "Could not activate the licence.",
    "Операция не выполнена.": "Operation failed.",
    "Операцию выполнить не удалось.": "The operation could not be completed.",
    "Для поиска по имени введите не менее трёх символов.": "Enter at least three characters to search by name.",
    "По этому запросу игроки не найдены.": "No players matched this search.",
    "Аватары по запросу не найдены.": "No avatars matched this search.",
    "Сессии по заданным условиям не найдены.": "No sessions matched these filters.",
    "Сохранённых сессий пока нет.": "No saved sessions yet.",
    "Игроков пока нет. Запустите лог или загрузите игроков за сегодня.": "No players yet. Start monitoring or load today's players.",
    "Игроков и заметок пока нет.": "No players or notes yet.",
    "Общих публикаций пока нет.": "No shared reports yet.",
    "Общих публикаций об этом игроке пока нет.": "No shared reports about this player yet.",
    "Изменений пока нет.": "No changes yet.",
    "Запросов по игроку пока нет.": "No requests for this player yet.",
    "Переходов между мирами пока нет.": "No world transitions yet.",
    "Смен аватаров пока нет.": "No avatar changes yet.",
    "Заходов и выходов пока нет.": "No joins or leaves yet.",
    "Событий порталов пока нет.": "No portal events yet.",
    "Событий перед инцидентом не сохранено.": "No events were saved before this incident.",
    "Точных кандидатов по названию не найдено.": "No exact candidates were found by name.",
    "Подходящих кандидатов нет.": "No suitable candidates.",
    "Кандидаты только по времени": "Time-based candidates only",
    "Нет подробностей для оценки.": "Not enough details to assess.",
    "Сначала запустите чтение лога.": "Start log monitoring first.",
    "Пока нет событий для снимка. Подождите после входа в мир.": "There are no events to snapshot yet. Wait after joining a world.",
    "Текущая сессия пока не синхронизирована. Локальный мониторинг продолжает работать.": "The current session has not synced yet. Local monitoring is still running.",
    "Не удалось обновить текущую сессию на сервере. Повторим при следующем обновлении.": "Could not update the current session on the server. It will retry on the next update.",
    "Системные уведомления недоступны в этой версии Windows.": "System notifications are unavailable on this Windows version.",
    "Windows не смогла показать системное уведомление.": "Windows could not show the system notification.",
    "Отмеченный игрок вошёл": "Labeled player joined",
    "Обнаружен отмеченный аватар": "Labeled avatar detected",
    "VRChat неожиданно закрылся во время мониторинга": "VRChat closed unexpectedly during monitoring",
    "VRChat запущен, но лог не обновлялся больше 5 минут. Это предупреждение, а не подтверждённый сбой.": "VRChat is running, but the log has not updated for over 5 minutes. This is a warning, not a confirmed crash.",
    "Crash Analyzer отслеживает состояние VRChat и последние события перед возможным сбоем. Возможны ложные совпадения. Включить анализатор?": "Crash Analyzer monitors VRChat and the latest events before a possible crash. False matches are possible. Enable the analyzer?",
    "Сбросить расположение блоков и настройки окна Builder?": "Reset Builder block positions and window settings?",
    "Восстановить предыдущее значение командной заметки?": "Restore the previous team note value?",
    "Опубликовать текущую метку и заметку для всех команд?": "Publish the current label and note to all teams?",
    "Опубликовать текущую отметку аватара для всех команд?": "Publish the current avatar label to all teams?",
    "Убрать общую публикацию вашей команды? Командная заметка останется.": "Remove your team's shared report? The team note will remain.",
    "Убрать общую публикацию вашей команды об этом аватаре?": "Remove your team's shared report about this avatar?",
    "· ID не найден": "· ID not found",
    ". Сессия будет синхронизирована позднее": ". The session will sync later",
    "**Онлайн игроки:**": "**Online players:**",
    "Аватар": "Avatar",
    "Аватар не определён": "Avatar not identified",
    "Автоматический инцидент": "Automatic incident",
    "Администратор отметил лаг вручную": "Administrator recorded lag manually",
    "аккаунт найден": "account found",
    "Безопасный мост приложения недоступен.": "The secure app bridge is unavailable.",
    "Безопасный Chrome preview · вымышленные данные": "Safe Chrome preview · sample data",
    "быстро": "fast",
    "в очереди": "queued",
    "в процессе": "in progress",
    "В Stable не найден сохранённый вход. Введите обычный ключ вручную.": "No saved sign-in was found in Stable. Enter the regular key manually.",
    "Введите данные лицензии.": "Enter your licence details.",
    "Вежливо напомнить правила": "Politely remind them of the rules",
    "включено": "enabled",
    "Включите хотя бы один блок в настройках выше.": "Enable at least one block in the settings above.",
    "Временный бан должен быть от 5 минут до 30 дней.": "A temporary ban must be between 5 minutes and 30 days.",
    "Входы": "Joins",
    "Выдать": "Assign",
    "Выйти из компактного режима": "Exit compact mode",
    "Выключить": "Disable",
    "выполнено": "completed",
    "выполняется": "running",
    "Выходы": "Leaves",
    "Диагностика": "Diagnostics",
    "Для игрока не найден User ID.": "No User ID was found for this player.",
    "Для общей публикации нужен подтверждённый Avatar ID.": "A verified Avatar ID is required for a shared report.",
    "Для общей публикации сначала подтвердите Avatar ID.": "Verify the Avatar ID before publishing a shared report.",
    "До 2000 символов": "Up to 2,000 characters",
    "За выбранный период повторных встреч нет.": "No repeat encounters in the selected period.",
    "завершена": "completed",
    "Завершённая сессия": "Completed session",
    "Загрузка участников добавлена в очередь.": "Member loading was added to the queue.",
    "Закрыть": "Close",
    "Заметка для вашей команды…": "A note for your team…",
    "Заметка об аватаре": "Avatar note",
    "Заметки управляющих добавлены в очередь на сохранение.": "Manager notes were queued for saving.",
    "Заметки управляющих VRChat-группы": "VRChat group manager notes",
    "Замечен на нескольких мероприятиях": "Seen at several events",
    "Запись истории недоступна для восстановления.": "This history entry cannot be restored.",
    "запущен": "running",
    "Зафиксированы сильные просадки FPS": "Severe FPS drops were recorded",
    "Игрок не найден в текущем списке.": "The player was not found in the current list.",
    "Игрок не найден.": "Player not found.",
    "Игроки в снимке этой сессии не сохранены.": "No players were saved in this session snapshot.",
    "идёт сейчас": "active now",
    "Исключение участника добавлено в очередь.": "Member removal was added to the queue.",
    "Каталог": "Catalog",
    "Командной заметки пока нет.": "No team note yet.",
    "Личная статистика": "Personal statistics",
    "лог не выбран": "no log selected",
    "лог обновляется": "log is updating",
    "Мир не определён": "World not identified",
    "Нажмите «Найти в группе», чтобы загрузить участников.": "Click Find in group to load members.",
    "найден": "found",
    "Найти Avatar ID": "Find Avatar ID",
    "Не удалось восстановить заметку.": "Could not restore the note.",
    "Не удалось загрузить заметки.": "Could not load notes.",
    "Не удалось загрузить историю изменений.": "Could not load change history.",
    "Не удалось загрузить историю сессий.": "Could not load session history.",
    "Не удалось загрузить операции группы.": "Could not load group operations.",
    "Не удалось загрузить сохранённые сессии.": "Could not load saved sessions.",
    "Не удалось загрузить участников группы.": "Could not load group members.",
    "Не удалось загрузить часть отметок для системных уведомлений. Повторим автоматически.": "Some labels for system notifications could not be loaded. The app will retry automatically.",
    "Не удалось загрузить Owner.": "Could not load Owner.",
    "Не удалось закрепить окно.": "Could not pin the window.",
    "Не удалось изменить прозрачность.": "Could not change window opacity.",
    "Не удалось изменить размер окна.": "Could not change the window size.",
    "Не удалось изменить роль.": "Could not change the role.",
    "Не удалось изменить наблюдение.": "Could not update the watchlist.",
    "Не удалось скопировать карточку инцидента.": "Could not copy the incident card.",
    "Не удалось исключить участника.": "Could not remove the member.",
    "Не удалось обновить каталог аватаров.": "Could not refresh the avatar catalog.",
    "Не удалось опубликовать заметку.": "Could not publish the note.",
    "Не удалось опубликовать отметку аватара.": "Could not publish the avatar label.",
    "Не удалось открыть аватар.": "Could not open the avatar.",
    "Не удалось открыть игрока в Owner.": "Could not open the player in Owner.",
    "Не удалось открыть игрока в Admin Tools.": "Could not open the player in Admin Tools.",
    "Не удалось открыть мир Prismic’s Avatar Search.": "Could not open the Prismic’s Avatar Search world.",
    "Не удалось сохранить аватар в каталог.": "Could not save the avatar to the catalog.",
    "Не удалось добавить аватар в избранное VRChat.": "Could not add the avatar to VRChat favorites.",
    "Не удалось открыть профиль.": "Could not open the profile.",
    "Не удалось открыть страницу аватара.": "Could not open the avatar page.",
    "Не удалось открыть Admin Tools.": "Could not open Admin Tools.",
    "Не удалось открыть Owner.": "Could not open Owner.",
    "Не удалось отправить запрос.": "Could not submit the request.",
    "Не удалось перенести вход из Stable.": "Could not import the Stable sign-in.",
    "Не удалось повторить запрос.": "Could not retry the request.",
    "Не удалось проверить вход из Stable.": "Could not verify the Stable sign-in.",
    "Не удалось проверить состояние.": "Could not check the status.",
    "Не удалось проверить участника.": "Could not verify the member.",
    "Не удалось проверить Avatar ID.": "Could not verify the Avatar ID.",
    "Не удалось проверить VRChat аккаунт.": "Could not verify the VRChat account.",
    "Не удалось прочитать логи за сегодня.": "Could not read today's logs.",
    "Не удалось сбросить Builder.": "Could not reset Builder.",
    "Не удалось скопировать итог.": "Could not copy the summary.",
    "Не удалось скопировать отчёт.": "Could not copy the report.",
    "Не удалось скопировать сессию.": "Could not copy the session.",
    "Не удалось скопировать снимок.": "Could not copy the snapshot.",
    "Не удалось сохранить заметки.": "Could not save notes.",
    "Не удалось сохранить заметку об аватаре.": "Could not save the avatar note.",
    "Не удалось сохранить заметку.": "Could not save the note.",
    "Не удалось сохранить снимок лага.": "Could not save the lag snapshot.",
    "Не удалось сохранить Avatar ID.": "Could not save the Avatar ID.",
    "Не удалось удалить общую отметку.": "Could not remove the shared label.",
    "Не удалось удалить общую публикацию.": "Could not remove the shared report.",
    "неизвестная ошибка": "unknown error",
    "Новый конструктор": "New builder",
    "Общие публикации недоступны.": "Shared reports are unavailable.",
    "Ожидание первого статуса…": "Waiting for the first status…",
    "Остальное": "Other",
    "Отозвать": "Revoke",
    "Поиск участников добавлен в очередь.": "Member search was added to the queue.",
    "Последние события перед сбоем": "Latest events before the crash",
    "причина не указана": "no reason provided",
    "Проверена на общем ивенте.": "Verified at a public event.",
    "Проверенный участник": "Verified member",
    "Проверить ID": "Verify ID",
    "Проверка обновления займёт немного времени.": "Checking for updates may take a moment.",
    "Проверка участника добавлена в очередь.": "Member verification was added to the queue.",
    "Ручной снимок": "Manual snapshot",
    "Сессия в процессе": "Session in progress",
    "Сессия не найдена.": "Session not found.",
    "событие": "event",
    "Событие": "Event",
    "События": "Events",
    "сессия": "session",
    "сессии": "sessions",
    "сессий": "sessions",
    "встреча": "encounter",
    "встречи": "encounters",
    "Сохранить заметки": "Save notes",
    "Список участников для этой сессии не сохранён.": "The participant list for this session was not saved.",
    "Страница аватара": "Avatar page",
    "текущий лог": "current log",
    "У этого ключа нет доступа к списку группы.": "This key cannot access the group member list.",
    "У этого ключа нет права на общую публикацию.": "This key cannot publish shared reports.",
    "У этого ключа нет права отправлять запросы бан/разбан.": "This key cannot submit ban or unban requests.",
    "Убрать выбранного игрока": "Clear selected player",
    "Укажите причину действия.": "Enter a reason for the action.",
    "Установка обновления запущена": "Update installation started",
    "Участник VRChat-группы": "VRChat group member",
    "Часть данных аватаров недоступна.": "Some avatar data is unavailable.",
    "Членство ещё не проверено или игрок не найден в загруженном списке.": "Membership has not been verified yet, or the player was not found in the loaded list.",
    "Что заметила команда…": "What the team noticed…",
    "Avatar ID не подтверждён": "Avatar ID not verified",
    "Avatar ID подтверждён и сохранён в каталоге.": "Avatar ID verified and saved to the catalog.",
    "Avatar ID проверен и каталог обновлён.": "Avatar ID verified and catalog refreshed.",
    "Cookie сохранён безопасно": "Cookie stored securely",
    "Crash / сильные лаги": "Crash / severe lag",
    "ID не найден": "ID not found"
    ,"Возможные совпадения": "Possible matches"
    ,"Сохранённые встречи": "Saved encounters"
    ,"Участники": "Participants"
    ,"Начало": "Started"
    ,"Было": "Previous"
    ,"Стало": "New"
    ,"Кандидаты": "Candidates"
    ,"кандидатов": "candidates"
    ,"встреч": "encounters"
    ,"с отметкой": "labeled"
    ,"Скачивание обновления": "Downloading update"
    ,"История VRChat": "VRChat history"
    ,"Причины": "Reasons"
    ,"_Отчёт показывает только совпадения по времени и не доказывает вину игрока или аватара._": "_This report only shows time correlations and does not prove that a player or avatar caused the issue._"
    ,"**Кандидаты по времени:**": "**Time-based candidates:**"
    ,"**Последние события перед возможным сбоем:**": "**Latest events before the possible crash:**"
    ,"аватар не определён": "avatar not identified"
    ,"Возможный сбой VRChat": "Possible VRChat crash"
    ,"Высокий": "High"
    ,"есть Avatar ID для проверки": "Avatar ID is available for verification"
    ,"Заблокирован в другом месте": "Blocked elsewhere"
    ,"загрузка аватара": "avatar loading"
    ,"игрок вошёл": "player joined"
    ,"игрок вышел": "player left"
    ,"Игрок не выбран.": "No player selected."
    ,"игрок недавно вошёл": "player joined recently"
    ,"компоненты аватара": "avatar components"
    ,"Наблюдение": "Watch"
    ,"нет кандидатов": "no candidates"
    ,"нет подробностей": "no details"
    ,"Низкий": "Low"
    ,"обнаружены компоненты аватара": "avatar components detected"
    ,"переход в мир": "world transition"
    ,"получен Avatar ID": "Avatar ID received"
    ,"появился Avatar ID": "Avatar ID appeared"
    ,"Предупреждён": "Warned"
    ,"связь игрока и аватара неоднозначна": "player-to-avatar link is ambiguous"
    ,"смена аватара": "avatar changed"
    ,"событие было в последнюю минуту": "event occurred within the last minute"
    ,"событие было рядом по времени": "event occurred close in time"
    ,"Средний": "Medium"
    ,"Crash Analyzer: инцидентов нет": "Crash Analyzer: no incidents"
  });

  const PATTERNS = Object.freeze([
    [/^(\d+)\s+событи(?:е|я|й)$/u, "$1 events"],
    [/^(\d+)\s+запис(?:ь|и|ей)$/u, "$1 entries"],
    [/^(\d+)\s+игрок(?:а|ов)?$/u, "$1 players"],
    [/^(\d+)\s+сесси(?:я|и|й)$/u, "$1 sessions"],
    [/^(\d+)\s+сессии$/u, "$1 sessions"],
    [/^(\d+)\s+встреч$/u, "$1 encounters"],
    [/^(\d+)\s+кандидатов$/u, "$1 candidates"],
    [/^(\d+)\s+найдено$/u, "$1 found"],
    [/^Результаты для «(.+)»$/u, "Results for “$1”"],
    [/^Расширенный поиск завершён:\s*(\d+)\s+результатов\.$/u, "Extended search completed: $1 results."],
    [/^(\d+)\.\s+(Высокий|Средний|Низкий) риск$/u, (_, index, risk) => `${index}. ${risk === "Высокий" ? "High" : risk === "Средний" ? "Medium" : "Low"} risk`],
    [/^(\d+)\s+мир(?:а|ов)?$/u, "$1 worlds"],
    [/^(\d+)\s+мин$/u, "$1 min"],
    [/^(\d+)\s+ч$/u, "$1 h"],
    [/^(\d+)\s+д(?:ень|ня|ней)$/u, "$1 days"],
    [/^Группа:\s*(.+)$/u, "Group: $1"],
    [/^Последний раз:\s*(.+)$/u, "Last seen: $1"],
    [/^Последняя встреча:\s*(.+)$/u, "Last encounter: $1"],
    [/^Мир:\s*(.+)$/u, "World: $1"],
    [/^Онлайн\s+(\d+)(.*)$/u, "Online $1$2"],
    [/^Найдено\s+(\d+)\s+игрок(?:а|ов)?\s+в\s+(\d+)\s+лог(?:е|ах)\.?$/u, "Found $1 players in $2 logs."],
    [/^За сегодня найдено\s+(\d+)\s+игрок(?:а|ов)?\s+в\s+(\d+)\s+лог(?:е|ах)\.?$/u, "Found $1 players in $2 logs today."],
    [/^…и ещё\s+(\d+)$/u, "…and $1 more"],
    [/^Открыть игрока\s+(.+)$/u, "Open player $1"],
    [/^Открыть\s+(.+)\s+в Admin Tools$/u, "Open $1 in Admin Tools"],
    [/^Открыть\s+(.+)\s+в Owner$/u, "Open $1 in Owner"],
    [/^Удалить всю историю Crash Analyzer \((\d+)\)\?$/u, "Delete all Crash Analyzer history ($1)?"],
    [/^Исключить\s+(.+)\s+из VRChat-группы\?$/u, "Remove $1 from the VRChat group?"],
    [/^(Выдать|Отозвать) роль «(.+)» для (.+)\?$/u, (_, action, role, player) => `${action === "Выдать" ? "Assign" : "Revoke"} role “${role}” for ${player}?`],
    [/^(Выдать|Отозвать) роль: операция добавлена в очередь\.$/u, (_, action) => `${action === "Выдать" ? "Assign" : "Revoke"} role: operation added to the queue.`],
    [/^VRChat: (запущен|не найден); (лог обновляется|лог не выбран)\.$/u, (_, process, log) => `VRChat: ${process === "запущен" ? "running" : "not found"}; ${log === "лог обновляется" ? "log is updating" : "no log selected"}.`],
    [/^Анализ завершён(.*)\. Новые события отслеживаются автоматически\.(.*)$/u, "Analysis complete$1. New events are monitored automatically.$2"],
    [/^Сессия будет синхронизирована позднее\.?$/u, "The session will sync later."],
    [/^Ошибка автообновления:\s*(.+)$/u, "Update error: $1"],
    [/^Найдено обновление\s+(.+)\. Скачиваем…$/u, "Update $1 found. Downloading…"],
    [/^Найдено обновление\s+(.+)$/u, "Update available: $1"],
    [/^Скачивание обновления:\s*(\d+)%$/u, "Downloading update: $1%"],
    [/^Обновление\s+(.+)\s+готово к установке$/u, "Update $1 is ready to install"],
    [/^Установлена актуальная версия(.*)$/u, "The latest version is installed$1"]
  ]);

  function normalizeLanguage(value) {
    return SUPPORTED.has(String(value || "").toLowerCase()) ? String(value).toLowerCase() : "ru";
  }

  function readSettings() {
    if (!root?.localStorage) return {};
    try {
      const value = JSON.parse(root.localStorage.getItem(STORAGE_KEY));
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  }

  function language() {
    if (root?.location?.search) {
      const params = new URLSearchParams(root.location.search);
      if (params.get("preview") === "1" && SUPPORTED.has(params.get("lang"))) return params.get("lang");
    }
    return normalizeLanguage(readSettings().language);
  }

  function count(value, forms, selectedLanguage = language()) {
    const amount = Math.max(0, Number(value) || 0);
    if (normalizeLanguage(selectedLanguage) === "en") return `${amount} ${amount === 1 ? forms.enOne : forms.enMany}`;
    const mod100 = amount % 100;
    const mod10 = amount % 10;
    const label = mod10 === 1 && mod100 !== 11
      ? forms.ruOne
      : (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? forms.ruFew : forms.ruMany);
    return `${amount} ${label}`;
  }

  function translate(value, selectedLanguage = language()) {
    const source = String(value ?? "");
    if (normalizeLanguage(selectedLanguage) !== "en" || !source.trim()) return source;
    const leading = source.match(/^\s*/u)?.[0] || "";
    const trailing = source.match(/\s*$/u)?.[0] || "";
    const text = source.trim();
    if (EN[text]) return `${leading}${EN[text]}${trailing}`;
    for (const [pattern, replacement] of PATTERNS) {
      if (pattern.test(text)) return `${leading}${text.replace(pattern, replacement)}${trailing}`;
    }
    if (text.includes(" · ")) {
      const parts = text.split(" · ");
      const translatedParts = parts.map((part) => translate(part, selectedLanguage).trim());
      if (translatedParts.some((part, index) => part !== parts[index])) return `${leading}${translatedParts.join(" · ")}${trailing}`;
    }
    if (text.includes("; ")) {
      const parts = text.split("; ");
      const translatedParts = parts.map((part) => translate(part, selectedLanguage).trim());
      if (translatedParts.some((part, index) => part !== parts[index])) return `${leading}${translatedParts.join("; ")}${trailing}`;
    }
    const labeled = text.match(/^([^:\n]{1,60}):\s*(.+)$/u);
    if (labeled) {
      const translatedLabel = translate(labeled[1], selectedLanguage).trim();
      if (translatedLabel !== labeled[1]) return `${leading}${translatedLabel}: ${translate(labeled[2], selectedLanguage).trim()}${trailing}`;
    }
    return source;
  }

  function translateElement(element, selectedLanguage = language()) {
    if (!element || element.closest?.("[data-i18n-skip]") || normalizeLanguage(selectedLanguage) !== "en") return;
    for (const attribute of ["placeholder", "title", "aria-label"]) {
      if (!element.hasAttribute?.(attribute)) continue;
      const current = element.getAttribute(attribute);
      const translated = translate(current, selectedLanguage);
      if (translated !== current) element.setAttribute(attribute, translated);
    }
  }

  function translateTree(node, selectedLanguage = language()) {
    if (!node || normalizeLanguage(selectedLanguage) !== "en") return;
    if (node.nodeType === 3) {
      if (node.parentElement?.closest?.("[data-i18n-skip]")) return;
      const translated = translate(node.nodeValue, selectedLanguage);
      if (translated !== node.nodeValue) node.nodeValue = translated;
      return;
    }
    if (node.nodeType !== 1 && node.nodeType !== 9 && node.nodeType !== 11) return;
    if (node.nodeType === 1 && node.closest?.("[data-i18n-skip]")) return;
    if (node.nodeType === 1) translateElement(node, selectedLanguage);
    for (const child of node.childNodes || []) translateTree(child, selectedLanguage);
  }

  function writeLanguage(nextLanguage) {
    if (!root?.localStorage) return normalizeLanguage(nextLanguage);
    const next = normalizeLanguage(nextLanguage);
    root.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readSettings(), language: next }));
    return next;
  }

  function bindInstantSelectors() {
    if (!root?.document) return;
    root.document.querySelectorAll('[data-language-select="instant"]').forEach((select) => {
      select.value = language();
      if (select.dataset.languageBound === "true") return;
      select.dataset.languageBound = "true";
      select.addEventListener("change", () => {
        writeLanguage(select.value);
        root.location.reload();
      });
    });
  }

  function start() {
    if (!root?.document) return;
    const selectedLanguage = language();
    root.document.documentElement.lang = selectedLanguage;
    bindInstantSelectors();
    translateTree(root.document, selectedLanguage);
    if (selectedLanguage !== "en" || !root.MutationObserver) return;
    const observer = new root.MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") translateTree(mutation.target, selectedLanguage);
        for (const node of mutation.addedNodes || []) translateTree(node, selectedLanguage);
      }
      bindInstantSelectors();
    });
    observer.observe(root.document.documentElement, { childList: true, subtree: true, characterData: true });
  }

  if (root?.document) {
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
  }

  return { STORAGE_KEY, normalizeLanguage, language, count, translate, translateTree, writeLanguage };
});
