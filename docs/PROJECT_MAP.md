# Project Map

## Назначение

Репозиторий содержит Stable, отдельный Beta-клиент, приложение управления ключами, общий парсер локальных логов и нейтральный серверный шаблон для самостоятельного размещения.

## Точки запуска

- Клиент: `apps/client/src/main.js`, команда `npm run client:dev`.
- Beta-клиент: `apps/client-beta/src/main.js`, команда `npm run client-beta:dev`.
- Админское приложение: `apps/admin/src/main.js`, команда `npm run admin:dev`.
- Сервер-шаблон: `server-template/src/index.js`, команда `npm run server:dev`.
- Парсер: `packages/parser/index.js`.

## Основные модули

| Компонент | Основной файл | Связанные файлы |
| --- | --- | --- |
| Electron lifecycle, IPC и обновления клиента | `apps/client/src/main.js` | `preload.js`, `security.js` |
| Однократный импорт сохранённой сессии Stable в отдельные настройки Beta | `apps/client/src/stable-settings-import.js` | `main.js`, `preload.js`, `tests/client-beta.test.js` |
| Отдельный Beta-интерфейс поверх общего desktop core | `apps/client-beta/src/main.js` | `renderer/index.html`, `renderer/app.js`, `renderer/styles.css` |
| Чтение и анализ VRChat-логов | `apps/client/src/log-tailer.js` | `packages/parser/index.js` |
| Интерфейс, диагностика, заметки, архив и условная вкладка Owner | `apps/client/renderer/renderer.js` | `index.html`, `styles.css` |
| Управление ключами | `apps/admin/src/main.js` | `apps/admin/renderer/` |
| API, лицензии и синхронизация общих заметок | `server-template/src/index.js` | `db.js`, `crypto.js` |
| PostgreSQL migrations | `server-template/src/db.js` | API routes in `index.js` |

## Поток данных

1. Клиент читает разрешённые пользователем `output_log_*.txt`.
2. Общий парсер превращает строки в нормализованные события.
3. Main process передаёт события renderer через preload bridge.
4. Renderer хранит ограниченное состояние и синхронизирует заметки и архив через API.
5. Сервер проверяет сессии лицензий и сохраняет данные в PostgreSQL.

Клиент содержит IPC-контракты официальной вкладки Owner, включая управление участниками привязанной VRChat-группы, но нейтральный `server-template` не реализует закрытые маршруты модерации и не выдаёт права Owner.

## Проверка

```powershell
npm test
npm run build:client
npm run build:client-beta
npm run build:admin
```

Обычно не анализируйте `node_modules/`, `.build/`, `release/`, логи, кеши и установщики.
