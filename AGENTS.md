# Repository Guidelines

## Navigation First

Before searching code, read `docs/PROJECT_MAP.md` and identify the likely module. Do not scan the whole repository unless the map is demonstrably stale. Start with an exact `rg` search for the relevant function, class, IPC channel, event type, HTTP route, setting, or UI identifier. Expand gradually to direct imports, callers, and adjacent tests only.

Do not reread unchanged files during one task. Before editing, state the smallest required file set. After creating, moving, or deleting an important module, update only the affected section of `docs/PROJECT_MAP.md`.

## Project Boundaries

- `apps/client/`: public Electron client (`src/` main/preload; `renderer/` UI).
- `apps/admin/`: private license-management Electron app.
- `server-template/`: neutral Express/PostgreSQL API for self-hosting.
- `packages/parser/`: shared VRChat log parser and event contracts.
- `tests/`: `node:test` regression suites.
- `scripts/`: packaging and release validation performed during client builds.

Ignore `node_modules/`, `.npm-cache/`, `.build/`, `release/`, logs (`*.log`, `output_log_*.txt`), coverage, temporary files, virtual environments, and generated artifacts unless the task explicitly targets them.

## Editing and Validation

Use JavaScript with `"use strict"`, two-space indentation, semicolons, and double quotes. Keep parser rules in `packages/parser/`; do not invent information absent from VRChat logs. Preserve Electron's main/preload/renderer boundary and expose privileged actions only through explicit IPC methods. Never commit private server URLs, credentials, cookies, keys, database dumps, or personal data.

After changes, run the narrowest relevant tests first, then broader tests only when shared behavior changed. Use `npm test` for the full suite and `npm run build:client` for Electron, preload, packaging, or updater changes. Always inspect `git diff --check` and the scoped `git diff` before finishing. Public changelogs must contain user-facing information only, never private server, owner, deployment, or admin-app details.
