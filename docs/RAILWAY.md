# Запуск собственного сервера на Railway

Эта инструкция создаёт отдельный сервер и новую пустую базу. Она не подключает сборку к инфраструктуре разработчиков VRChat Admin Tools.

## 1. Подготовьте репозиторий

1. Создайте собственный репозиторий GitHub.
2. Загрузите в него содержимое этой папки без `.env`, ключей, cookie и каталогов `node_modules`, `.build`, `release`.
3. Убедитесь, что в корне находятся `package.json`, `railway.json` и каталог `server-template`.

## 2. Создайте проект Railway

1. Создайте новый пустой проект Railway.
2. Нажмите **New → Database → PostgreSQL**.
3. Добавьте сервис из своего GitHub-репозитория.
4. Оставьте корневой каталог `/`. Команда запуска уже задана в `railway.json`:

```text
npm --workspace server-template start
```

## 3. Настройте переменные

В разделе **Variables** API-сервиса добавьте:

```dotenv
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
LICENSE_PEPPER=СЛУЧАЙНЫЙ_СЕКРЕТ_1
ADMIN_TOKEN=СЛУЧАЙНЫЙ_СЕКРЕТ_2
SESSION_TTL_HOURS=24
REMEMBER_SESSION_TTL_HOURS=720
PLAY_SESSION_STALE_MINUTES=30
API_RATE_LIMIT_PER_MINUTE=600
CORS_ORIGIN=
VRCHAT_USER_AGENT=VRChatAdminToolsSelfHosted/1.0 contact:your-email@example.com
SOURCE_URL=https://github.com/ВАШ-АККАУНТ/ВАШ-РЕПОЗИТОРИЙ
```

Если PostgreSQL-сервис называется не `Postgres`, выберите его `DATABASE_URL` через подсказку Railway при создании reference variable. `LICENSE_PEPPER` и `ADMIN_TOKEN` должны быть разными. Сгенерировать каждый секрет можно командой:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Не сохраняйте секреты в репозитории. В Railway их можно пометить как **Sealed**. `SOURCE_URL` должен вести на исходный код именно той версии сервера, которую вы запустили.

## 4. Запустите API

1. Примените staged changes и дождитесь успешного deployment.
2. В **Settings → Networking** создайте публичный домен.
3. Откройте `https://ВАШ-ДОМЕН/health`.

Ожидаемый ответ начинается с:

```json
{"ok":true,"version":"1.0.0"}
```

Миграции PostgreSQL выполняются автоматически при запуске. Не создавайте таблицы вручную.

## 5. Создайте первый ключ

1. Запустите админское приложение: `npm run admin:dev`.
2. В поле **API server** укажите публичный Railway URL без завершающего `/`.
3. В поле **Admin token** вставьте значение `ADMIN_TOKEN`.
4. Сохраните настройки и создайте лицензионный ключ.

Ключи одной команды могут иметь одинаковый `team_id`, но каждому администратору следует выдавать отдельный ключ.

## 6. Подключите клиент

Измените `apps/client/config.json`:

```json
{
  "serverUrl": "https://ВАШ-ДОМЕН.up.railway.app",
  "autoUpdates": false
}
```

После этого запустите `npm run client:dev` или соберите установщик командой `npm run build:client`.

## Обновление и резервные копии

Railway разворачивает новые коммиты подключённой ветки автоматически. Перед изменением схемы или крупным обновлением создавайте резервную копию PostgreSQL. Не заменяйте `LICENSE_PEPPER`: после его смены ранее выданные ключи перестанут проходить проверку.

Актуальная справка Railway:

- https://docs.railway.com/databases/postgresql
- https://docs.railway.com/variables
- https://docs.railway.com/deployments/start-command
