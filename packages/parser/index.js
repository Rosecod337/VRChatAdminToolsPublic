"use strict";

const TIMESTAMP_RE = /^(?<time>\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2})\s+(?<level>\w+)\s+-\s+(?<message>.*)$/u;
const WORLD_ID_RE = /wrld_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/iu;
const AVATAR_ID_RE = /avtr_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/iu;
const LINK_TTL_MS = 60_000;
const QUEUE_MAX = 30;

function createParserState() {
  return {
    unpackingQueue: [],
    switchingQueue: [],
    avatarContextQueue: [],
    sequence: 0
  };
}

function parseTimestamp(value) {
  if (!value) return null;
  const [datePart, timePart] = value.split(" ");
  if (!datePart || !timePart) return null;
  const normalized = datePart.replace(/\./gu, "-") + "T" + timePart;
  const date = new Date(normalized);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function parseBaseLine(line) {
  const match = TIMESTAMP_RE.exec(line);
  if (!match) return null;
  return {
    timeText: match.groups.time,
    timestamp: parseTimestamp(match.groups.time),
    level: match.groups.level,
    message: match.groups.message,
    raw: line
  };
}

function withBase(base, event, state) {
  state.sequence += 1;
  return {
    id: `${base.timeText}-${event.type}-${hashSmall(base.raw)}-${state.sequence}`,
    timeText: base.timeText,
    timestamp: base.timestamp,
    level: base.level,
    raw: base.raw,
    ...event
  };
}

function hashSmall(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function nowMs(timestamp) {
  return timestamp ? new Date(timestamp).getTime() : Date.now();
}

function pushQueue(queue, entry) {
  queue.push(entry);
  if (queue.length > QUEUE_MAX) queue.shift();
}

function avatarKey(name) {
  return String(name || "")
    .replace(/\s+by\s+.+$/iu, "")
    .trim()
    .replace(/\s+/gu, " ")
    .toLowerCase();
}

function recentEntries(queue, now, key = "") {
  return queue
    .filter((entry) => Math.abs(now - entry.tsMs) <= LINK_TTL_MS)
    .filter((entry) => !key || entry.key === key);
}

function takeLatestEntry(queue, now, key = "") {
  for (let index = queue.length - 1; index >= 0; index -= 1) {
    const entry = queue[index];
    if (Math.abs(now - entry.tsMs) > LINK_TTL_MS) continue;
    if (key && entry.key !== key) continue;
    return queue.splice(index, 1)[0];
  }
  return null;
}

function rememberAvatarContext(state, entry) {
  const key = entry.key || avatarKey(entry.avatarName);
  const next = { ...entry, key };
  const existing = state.avatarContextQueue.find((item) => item.key === key && item.playerName === next.playerName);
  if (existing) {
    Object.assign(existing, next);
    return;
  }
  pushQueue(state.avatarContextQueue, next);
}

function parseLineWithState(state, line) {
  const base = parseBaseLine(line);
  if (!base) return null;

  const message = base.message;
  const now = nowMs(base.timestamp);
  let match = /\[Behaviour\]\s+OnPlayerJoined\s+(?<name>.+?)\s+\((?<userId>usr_[^)]+)\)$/u.exec(message);
  if (match) {
    return withBase(base, {
      type: "player-joined",
      category: "players",
      playerName: match.groups.name.trim(),
      userId: match.groups.userId.trim()
    }, state);
  }

  match = /\[Behaviour\]\s+OnPlayerLeft\s+(?<name>.+?)\s+\((?<userId>usr_[^)]+)\)$/u.exec(message);
  if (match) {
    return withBase(base, {
      type: "player-left",
      category: "players",
      playerName: match.groups.name.trim(),
      userId: match.groups.userId.trim()
    }, state);
  }

  match = /\[Behaviour\]\s+Switching\s+(?<name>.+?)\s+to avatar\s+(?<avatarName>.+)$/u.exec(message);
  if (match) {
    const playerName = match.groups.name.trim();
    const avatarName = match.groups.avatarName.trim();
    const avatarId = message.match(AVATAR_ID_RE)?.[0] ?? null;
    const key = avatarKey(avatarName);
    const existing = state.switchingQueue.find((entry) => entry.key === key && entry.playerName === playerName);
    if (existing) {
      Object.assign(existing, { avatarName, tsMs: now });
    } else {
      pushQueue(state.switchingQueue, { key, playerName, avatarName, tsMs: now });
    }
    rememberAvatarContext(state, { key, playerName, avatarName, avatarId, tsMs: now });
    return withBase(base, {
      type: "avatar-changed",
      category: "avatars",
      playerName,
      avatarName,
      avatarId,
      correlationConfidence: "direct"
    }, state);
  }

  match = /\[Behaviour\]\s+Loading avatar for\s+(?<name>.+)$/u.exec(message);
  if (match) {
    return withBase(base, {
      type: "avatar-loading",
      category: "avatars",
      playerName: match.groups.name.trim(),
      correlationConfidence: "direct"
    }, state);
  }

  match = /Loading Avatar Data:(?<avatarId>avtr_[0-9a-f-]+)/iu.exec(message);
  if (match) {
    const avatarId = match.groups.avatarId.trim();
    const contexts = recentEntries(state.avatarContextQueue, now);
    const context = contexts.length === 1 ? contexts[0] : null;
    if (context) rememberAvatarContext(state, { ...context, avatarId, tsMs: now });
    return withBase(base, {
      type: "avatar-data",
      category: "avatars",
      avatarId,
      playerName: context?.playerName || "",
      avatarName: context?.avatarName || "",
      correlationConfidence: context ? "temporal" : contexts.length > 1 ? "ambiguous" : "unknown"
    }, state);
  }

  match = /\[AssetBundleDownloadManager\]\s+\[\d+\]\s+Unpacking Avatar\s+\((?<fullName>.+)\)$/u.exec(message);
  if (match) {
    const fullName = match.groups.fullName.trim();
    const key = avatarKey(fullName);
    const existing = state.unpackingQueue.find((entry) => entry.key === key);
    if (existing) {
      Object.assign(existing, { fullName, tsMs: now });
    } else {
      pushQueue(state.unpackingQueue, { key, fullName, tsMs: now });
    }
    return null;
  }

  match = /\[Behaviour\]\s+CacheComponents:\s+ParticleSystems\s+(?<ps>\d+),\s+AudioSources\s+(?<au>\d+)/u.exec(message);
  if (match) {
    const particleSystems = Number(match.groups.ps);
    const audioSources = Number(match.groups.au);
    if (particleSystems === 0 && audioSources === 0) return null;

    const unpackEntry = takeLatestEntry(state.unpackingQueue, now);
    let avatarName = "";
    let playerName = "";
    let correlationConfidence = "unknown";

    if (unpackEntry) {
      avatarName = unpackEntry.fullName;
      const matchingSwitches = recentEntries(state.switchingQueue, now, unpackEntry.key);
      if (matchingSwitches.length === 1) {
        const switching = takeLatestEntry(state.switchingQueue, now, unpackEntry.key);
        playerName = switching?.playerName || "";
        correlationConfidence = "temporal";
      } else if (matchingSwitches.length > 1) {
        correlationConfidence = "ambiguous";
      } else {
        correlationConfidence = "name-only";
      }
    } else {
      const switchingEntries = recentEntries(state.switchingQueue, now);
      if (switchingEntries.length === 1) {
        const switching = takeLatestEntry(state.switchingQueue, now);
        avatarName = switching?.avatarName || "";
        playerName = switching?.playerName || "";
        correlationConfidence = "temporal";
      } else if (switchingEntries.length > 1) {
        correlationConfidence = "ambiguous";
      }
    }

    if (avatarName) {
      rememberAvatarContext(state, {
        key: avatarKey(avatarName),
        playerName,
        avatarName,
        tsMs: now
      });
    }

    return withBase(base, {
      type: "avatar-audio",
      category: "avatars",
      avatarName,
      playerName,
      particleSystems,
      audioSources,
      correlationConfidence
    }, state);
  }

  match = /\[Behaviour\]\s+Entering Room:\s+(?<worldName>.+)$/u.exec(message);
  if (match) {
    return withBase(base, {
      type: "world-entering",
      category: "worlds",
      worldName: match.groups.worldName.trim()
    }, state);
  }

  match = /\[Behaviour\]\s+Joining\s+(?<instance>wrld_[^\s]+)$/u.exec(message);
  if (match) {
    const instance = match.groups.instance.trim();
    return withBase(base, {
      type: "world-joining",
      category: "worlds",
      worldId: instance.match(WORLD_ID_RE)?.[0] ?? null,
      instance
    }, state);
  }

  match = /\[Behaviour\]\s+Joining or Creating Room:\s+(?<worldName>.+)$/u.exec(message);
  if (match) {
    return withBase(base, {
      type: "world-joined",
      category: "worlds",
      worldName: match.groups.worldName.trim()
    }, state);
  }

  if (/\[PortalManager\]\s+Pending portal request fulfilled\.?$/iu.test(message)) {
    return withBase(base, {
      type: "portal-created",
      category: "portals"
    }, state);
  }

  if (/\[PortalManager\]\s+Received portal destroy event\.?$/iu.test(message)) {
    return withBase(base, {
      type: "portal-destroyed",
      category: "portals"
    }, state);
  }

  match = /User Authenticated:\s+(?<name>.+?)\s+\((?<userId>usr_[^)]+)\)/u.exec(message);
  if (match) {
    return withBase(base, {
      type: "user-authenticated",
      category: "system",
      playerName: match.groups.name.trim(),
      userId: match.groups.userId.trim()
    }, state);
  }

  return null;
}

function createParser() {
  let state = createParserState();
  return {
    parseLine(line) {
      return parseLineWithState(state, line);
    },
    parseLines(lines) {
      return lines.map((line) => parseLineWithState(state, line)).filter(Boolean);
    },
    reset() {
      state = createParserState();
    }
  };
}

const defaultParser = createParser();

function parseLine(line) {
  return defaultParser.parseLine(line);
}

function parseLines(lines) {
  return defaultParser.parseLines(lines);
}

module.exports = {
  createParser,
  parseLine,
  parseLines,
  parseTimestamp
};
