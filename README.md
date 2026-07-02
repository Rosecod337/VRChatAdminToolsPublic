# VRChat Admin Tools [BETA]

Windows application for VRChat community staff. It helps monitor the current VRChat instance from local log files: joins, leaves, avatar changes, player activity, shared notes and quick Discord snapshots.

> Discord: [discord.gg/7URkA6EQYY](https://discord.gg/7URkA6EQYY) - support, updates and bug reports.

## Features

- Live monitoring of the current VRChat log file.
- Player join and leave tracking with timestamps.
- Avatar change tracking when VRChat writes the event to the log.
- Dashboard with current activity and recent events.
- Admin Tools with shared player labels and notes for your staff team.
- Snapshot button for quickly copying a readable report.
- Analyze Server button for recovering recent events from the current session logs.
- Optional VRChat account check for better profile/name detection.
- Auto-updates through GitHub Releases.

## Requirements

- Windows 10 or Windows 11, 64-bit.
- VRChat installed and launched at least once.
- A personal license key.

## License Key

The app requires a personal license key. You can get a key through the project Discord:

[discord.gg/7URkA6EQYY](https://discord.gg/7URkA6EQYY)

Do not share your key with other people. Each user should have their own key. If the app says the key is invalid, expired, blocked, or the device limit was reached, contact support in Discord.

## Installation

1. Open [Releases](../../releases/latest).
2. Download `VRChat-Log-Analyzer-Setup-<version>.exe`.
3. Run the installer.
4. Start the app and enter your license key.
5. Press **Start** to begin live monitoring.

## Optional VRChat Cookie

The VRChat account session cookie is optional. It can help the app resolve VRChat profile information more accurately.

Only use your own cookie and never send it to other people. The app stores it locally on your computer.

## Analyze Server

**Analyze Server** is useful when you opened the app after already joining an instance. It scans recent VRChat log data and tries to reconstruct the current session.

For the most accurate results:

1. Press **Start** before moderating.
2. Rejoin the target world or instance if possible.
3. Use live monitoring as the main source of truth.

Old or incomplete VRChat logs can miss events, so analysis is not guaranteed to be perfect.

## VR Overlay

The current VR Overlay is a transparent always-on-top desktop window. To see it inside VR, capture it with tools such as Desktop+, OVR Toolkit, XSOverlay, Virtual Desktop, or SteamVR desktop view.

## Privacy

- The app reads VRChat log files created by VRChat itself.
- It does not inject into VRChat, modify game files, or interact with the game process.
- Your VRChat cookie is optional and stored locally.
- License checks are used only to activate the app and protect access.

## Beta Status

This is beta software. Some counters can be wrong if VRChat did not write the required events to the log, or if monitoring started after players had already joined.

## License

This software is proprietary. Redistribution, decompilation, and reverse engineering are prohibited.
