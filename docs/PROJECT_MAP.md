# Project Map

## Назначение

Репозиторий содержит два Electron-приложения VRChat Admin Tools, общий парсер локальных логов и нейтральный серверный шаблон для самостоятельного размещения.

## Точки запуска

- Клиент: `apps/client/src/main.js`, команда `npm run client:dev`.
- Админское приложение: `apps/admin/src/main.js`, команда `npm run admin:dev`.
- Сервер-шаблон: `server-template/src/index.js`, команда `npm run server:dev`.
- Парсер: `packages/parser/index.js`.

## Основные модули

| Компонент | Основной файл | Связанные файлы |
| --- | --- | --- |
| Electron lifecycle, IPC и обновления клиента | `apps/client/src/main.js` | `preload.js`, `security.js` |
| Чтение и анализ VRChat-логов | `apps/client/src/log-tailer.js` | `packages/parser/index.js` |
| Интерфейс, диагностика, заметки и архив | `apps/client/renderer/renderer.js` | `index.html`, `styles.css` |
| Управление ключами | `apps/admin/src/main.js` | `apps/admin/renderer/` |
| API, лицензии и синхронизация | `server-template/src/index.js` | `db.js`, `crypto.js` |
| PostgreSQL migrations | `server-template/src/db.js` | API routes in `index.js` |

## Поток данных

1. Клиент читает разрешённые пользователем `output_log_*.txt`.
2. Общий парсер превращает строки в нормализованные события.
3. Main process передаёт события renderer через preload bridge.
4. Renderer хранит ограниченное состояние и синхронизирует заметки и архив через API.
5. Сервер проверяет сессии лицензий и сохраняет данные в PostgreSQL.

## Проверка

```powershell
npm test
npm run build:client
npm run build:admin
```

Обычно не анализируйте `node_modules/`, `.build/`, `release/`, логи, кеши и установщики.
