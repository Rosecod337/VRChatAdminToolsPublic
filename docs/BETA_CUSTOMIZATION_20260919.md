# Beta appearance and VRCX read-only expansion

Local implementation checkpoint: 2026-09-19. Source remains `apps/client-beta/`; this is not a published release. Original edited files were preserved under the workspace's `tmp/beta-before-customization-20260918/` because this checkout has no Git metadata.

## Appearance editor

Open **Оформление / Appearance** in the lower-right corner. It applies throughout the Beta renderer, beyond Builder.

- Global background, panel, secondary, text, muted, accent and border colors; three font families; 80–120% scale; panel corner radius.
- Pick a visible element to change its background, text/border color, font size, corners, padding and opacity. Static labels can be renamed without interpreting HTML.
- Eight named profiles; clone, switch, export/import JSON, delete, reset individual elements or the entire profile. Settings stay in `betaInterfaceProfilesV1` on this device. Export is separate from the existing history backup.
- Import limits: 256 KiB, 250 element overrides, bounded numbers and strict color/selector allowlists. No executable HTML, CSS URLs or script imports.
- User-provided names, event data, counters, account authentication and license information are excluded from label replacement. Some captions generated dynamically by a screen are not yet editable; the editor disables that field. This is **not** a claim that every dynamic text in the app can be rewritten.
- Builder remains responsible for drag/resize/order of its widgets. Rearranging arbitrary screens is not implemented. Element overrides use structural selectors; a future layout change can require reselecting an element. Keep an exported profile before upgrades.
- Constructable stylesheets preserve the existing renderer Content Security Policy and work under `file://`. Customized captions are excluded from automatic translation; resetting restores the current system caption.

Implementation: `renderer/ui-customizer.js` and `ui-customizer.css`, loaded by `index.html`. No privileged IPC was added.

## Read-only VRChat additions

The user selected **view and search only** for this VRCX pass. Group creation, edits, transfers, moderation deletion, cosmetic edits and instance announcements remain outside this pass.

- Social search across loaded friends, local favorite friends, groups, favorite worlds/avatars, notifications, Prints and inventory.
- Inventory list with a type filter. Prints are fetched only for the authenticated account. These are searchable metadata lists, not image galleries.
- Group calendar list and text search in the group dialog. Missing calendar permission is distinguished from an empty list.
- New public profile endpoint fallback and read-only cosmetic metadata (frame, nameplate/profile effect, theme colors, etc.). Animated cosmetic rendering and applying remote profile themes to our UI are not implemented.
- Local quick search shows favorites first and supports a favorites-only filter. SQLite prioritizes favorite players before its result limit.
- Full manager note on hover. Group-event filter for the notification types actually returned by the existing notifications endpoint; notification-v2 polling has not been added.
- Collection search covers the first 100 retrieved items/events; a partial-list indicator is shown. It is not a server-wide search. Changing/disconnecting the account clears collection UI state and rejects late responses.

## VRCX comparison

Reference: [VRCX v2026.09.16 release](https://github.com/vrcx-team/VRCX/releases/tag/v2026.09.16). This is an independent implementation against the existing app architecture, not a bulk source merge.

| Release area | Current result |
| --- | --- |
| New profile data and cosmetics | Read-only metadata and endpoint fallback; full visual effects pending |
| Profile/theme editing | Deferred: current request is read-only |
| Prints favorites | Own-print metadata/search added; favorite mutation deferred |
| Local favorites in quick search | Implemented |
| Group join count | Pending: current stored session schema does not reliably identify every group join; no fabricated count |
| Group calendar | Read/search added, editing deferred |
| Group creation/edit/transfer | Deferred by user |
| Bulk moderation deletion | Deferred by read-only scope |
| Inventory filtering | Implemented for loaded first-page metadata |
| Group-event notifications | Filter added for delivered types; v2 transport remains pending |
| In-instance announcements | Deferred by read-only scope |
| Dialog design and full notes | Existing native dialog layout retained, appearance editor added, manager note hover added |
| VRCX-specific fixes and Linux/macOS runtime changes | Not copied: different database, runtime and platform code |

API shape references: [Prints](https://vrchat.community/reference/get-user-prints), [inventory](https://vrchat.community/reference/get-inventory), [calendar](https://vrchat.community/reference/get-group-calendar-events), [VRCX profile types](https://github.com/vrcx-team/VRCX/blob/v2026.09.16/src/types/api/profile.d.ts). Community API descriptions are not a guarantee of current live behavior; authenticated smoke tests remain necessary.

## Product ideas to validate

These are proposals, not implemented features:

- **Free:** a local privacy dashboard showing retained data, disk usage and per-category cleanup. Useful without a server or recurring AI cost. Validate whether users can find and delete their own data unaided.
- **Free:** export a session recap with world/time/selected participants, previewed before sharing. Build on existing history and let the user exclude names.
- **Paid:** a shared incident timeline with warnings, evidence, responsible moderator, appeal state and temporary-ban deadlines. Main value is coordinated decisions across moderators, with existing per-key permissions enforced on the server.
- **Paid:** policy simulation: show whom a proposed rule would affect before enabling it, with an exclusion list and an explanation for each match. Validate on real anonymized audit samples before adding more automatic punishment rules.

First validate with a few group owners: whether the incident timeline reduces missed appeals/expired bans, and whether it is used each week. More cosmetic options alone are a weak paid differentiator.

## Verification and remaining release work

Run targeted tests, the full Node test suite, `scripts/check-beta-i18n.mjs`, and the existing renderer performance script. `BETA_PREVIEW_CUSTOMIZER_QA=1` verifies profile persistence/reset and safe captions; `BETA_PREVIEW_SOCIAL_QA=1` verifies search/type data and account-switch isolation. Stress preview covers 1,000 players and 2,000 events.

Packaged/runtime verification and authenticated live VRChat/Discord checks are separate from these local tests. Do not label this checkpoint as a full VRCX port or publish over the existing Beta.2 release without preparing a new version and release validation.
