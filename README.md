# VRChat Log Analyzer

Windows desktop application for VRChat server administrators. Monitors your VRChat session in real time — tracks who joins and leaves, what avatars people use, and when portals are spawned.

> 💬 **Discord:** [discord.gg/7URkA6EQYY](https://discord.gg/7URkA6EQYY) — support, updates, and bug reports

---

## Features

- **Real-time log monitoring** — tails your VRChat `output_log_*.txt` as events happen
- **Player join / leave tracking** — see who enters and exits your instance with timestamps
- **Avatar change tracking** — know when someone switches their avatar
- **Portal spawn detection** — see when portals are dropped and where they lead
- **VRChat profile lookup** — resolves user IDs to display names via the VRChat API
- **Custom Builder** — drag-and-drop dashboard with grid/columns/rows layouts
- **License-based activation** — one key, bound to your hardware
- **Auto-update** — new versions install automatically in the background

---

## Requirements

- Windows 10 / 11 (64-bit)
- VRChat installed and launched at least once (log files must exist)
- A valid license key (get one in our [Discord](https://discord.gg/7URkA6EQYY))

---

## Installation

1. Go to [**Releases**](../../releases/latest) and download `VRChat-Log-Analyzer-Setup.exe`
2. Run the installer
3. On first launch, enter your **API server URL** and **license key**
4. Optionally paste your VRChat `auth=...` cookie for display name resolution
5. Click **Активировать** — done

---

## How It Works

The app reads VRChat's local log files (`output_log_*.txt`) from:

```
C:\Users\<You>\AppData\LocalLow\VRChat\VRChat\
```

It does **not** inject into VRChat, modify any game files, or interact with the game process in any way. It only reads the log files that VRChat writes itself.

### Display Names

When a `usr_XXXX` ID appears in the log, the app queries:

```
https://api.vrchat.cloud/api/1/users/{id}
```

If you paste a VRChat `auth=...` cookie in settings, the app uses it to resolve names for users with private profiles. The cookie is stored locally on your machine only.

---

## Controls

| Button | Action |
|--------|--------|
| **Start** | Begin watching the log file for new events |
| **Stop** | Stop watching |
| **Scan** | Parse the last 5000 lines of the current log file |
| **Log file** | Manually select a different log file |
| **Logout** | Clear session and return to activation screen |

---

## Tabs

- **Заход / Выход** — player join and leave events
- **Порталы** — portal spawn events
- **Аватары** — avatar change events
- **Custom Builder** — rearrange all panels, choose layout

---

## Auto-Update

The app checks for updates on every launch. When a new version is available it downloads in the background and prompts you to restart. No manual reinstall needed.

---

## Privacy

- No gameplay data is sent anywhere except your own licensed API server
- Your VRChat cookie (if entered) is stored only in the local app settings file and is never transmitted to third parties
- Hardware ID is a one-way SHA-256 hash of your machine — it is used only for license binding and is never stored in plain form

---

## Support & Community

Having issues? Join the Discord — fastest way to get help.

💬 [discord.gg/7URkA6EQYY](https://discord.gg/7URkA6EQYY)

---

## License

This software is proprietary. Redistribution, decompilation, and reverse engineering are prohibited.
