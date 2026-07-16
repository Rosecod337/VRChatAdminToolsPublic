"use strict";

const USER_ID_RE = /^usr_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const AVATAR_ID_RE = /^avtr_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const QUEUE_INTERVAL_MS = 350;
const MAX_RETRIES = 3;
const FETCH_TIMEOUT_MS = 15_000;
const AVATAR_SEARCH_CACHE_TTL_MS = 15 * 60 * 1000;
const AVATAR_COLLECTION_PAGE_SIZE = 100;
const AVATAR_COLLECTION_MAX_PAGES = 3;

function normalizeAuthCookie(value) {
  const cookie = String(value || "").trim();
  if (!cookie || /(?:^|;)\s*auth=/iu.test(cookie)) return cookie;
  return /^authcookie_/iu.test(cookie) ? `auth=${cookie}` : cookie;
}

function normalizeAvatarName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/gu, " ")
    .replace(/\s+by\s+.+$/iu, "")
    .toLowerCase()
    .slice(0, 180);
}

async function fetchVrchat(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("VRChat API request timed out");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

class VrchatUserResolver {
  constructor() {
    this.cache = new Map();
    this.pending = new Map();
    this.queue = [];
    this.queueTimer = null;
    this.userAgent = process.env.VRCHAT_USER_AGENT || "VRChatAdminTools/0.5.5 contact:local";
    this.authCookie = process.env.VRCHAT_AUTH_COOKIE || "";
    this.avatarSearchCache = new Map();
    this.avatarSearchPending = new Map();
    this.avatarCollectionCache = new Map();
  }

  setAuthCookie(authCookie) {
    const normalized = normalizeAuthCookie(authCookie);
    if (normalized === this.authCookie) return;
    this.authCookie = normalized;
    this.cache.clear();
    this.avatarSearchCache.clear();
    this.avatarSearchPending.clear();
    this.avatarCollectionCache.clear();
  }

  hasAuthCookie() {
    return Boolean(this.authCookie);
  }

  async resolve(userId) {
    if (!USER_ID_RE.test(String(userId || ""))) return null;
    if (this.cache.has(userId)) return this.cache.get(userId);
    if (this.pending.has(userId)) return this.pending.get(userId);

    const promise = new Promise((resolve) => {
      this.queue.push({ userId, resolve, retries: 0 });
      this._scheduleQueue();
    }).then((profile) => {
      if (profile) this.cache.set(userId, profile);
      this.pending.delete(userId);
      return profile;
    });

    this.pending.set(userId, promise);
    return promise;
  }

  _scheduleQueue() {
    if (this.queueTimer) return;
    this.queueTimer = setTimeout(() => this._processNext(), QUEUE_INTERVAL_MS);
  }

  async _processNext() {
    this.queueTimer = null;
    if (this.queue.length === 0) return;

    const item = this.queue.shift();
    try {
      const profile = await this.fetchUser(item.userId);
      item.resolve(profile);
    } catch (error) {
      const isRateLimit = error.message?.includes("429");
      if (isRateLimit || item.retries < MAX_RETRIES) {
        item.retries += 1;
        const delay = isRateLimit ? 2000 : 500 * item.retries;
        setTimeout(() => {
          this.queue.unshift(item);
          this._scheduleQueue();
        }, delay);
      } else {
        item.resolve(null);
      }
    }

    if (this.queue.length > 0) {
      this.queueTimer = setTimeout(() => this._processNext(), QUEUE_INTERVAL_MS);
    }
  }

  async fetchUser(userId) {
    const url = `https://api.vrchat.cloud/api/1/users/${encodeURIComponent(userId)}`;
    const headers = {
      "accept": "application/json",
      "user-agent": this.userAgent
    };
    if (this.authCookie) headers.cookie = this.authCookie;

    const response = await fetchVrchat(url, { headers });

    if (!response.ok) throw new Error(`VRChat API HTTP ${response.status}`);
    const data = await response.json();
    return {
      userId,
      displayName: data.displayName || data.username || userId,
      profileUrl: `https://vrchat.com/home/user/${encodeURIComponent(userId)}`,
      source: "api"
    };
  }

  async fetchCurrentUser() {
    if (!this.authCookie) throw new Error("VRChat auth cookie is not configured");

    const response = await fetchVrchat("https://api.vrchat.cloud/api/1/auth/user", {
      headers: {
        "accept": "application/json",
        "user-agent": this.userAgent,
        "cookie": this.authCookie
      }
    });

    if (!response.ok) throw new Error(`VRChat API HTTP ${response.status}`);
    const data = await response.json();
    if (!data?.id) throw new Error("VRChat account session is invalid");

    return {
      userId: data.id,
      displayName: data.displayName || data.username || data.id,
      location: data.location || "",
      worldId: data.worldId || parseWorldId(data.location),
      instanceId: data.instanceId || parseInstanceId(data.location),
      profileUrl: `https://vrchat.com/home/user/${encodeURIComponent(data.id)}`
    };
  }

  async fetchCurrentInstance(currentUser = null) {
    if (!this.authCookie) throw new Error("VRChat auth cookie is not configured");

    const user = currentUser || await this.fetchCurrentUser();
    if (!user?.worldId || !user?.instanceId) {
      throw new Error("VRChat current instance is not available");
    }

    const locationId = `${encodeURIComponent(user.worldId)}:${encodeURIComponent(user.instanceId)}`;
    const response = await fetchVrchat(`https://api.vrchat.cloud/api/1/instances/${locationId}`, {
      headers: {
        "accept": "application/json",
        "user-agent": this.userAgent,
        "cookie": this.authCookie
      }
    });

    if (!response.ok) throw new Error(`VRChat API HTTP ${response.status}`);
    const data = await response.json();
    if (!data) throw new Error("VRChat instance was not found");

    const location = data.location || data.id || user.location || `${user.worldId}:${user.instanceId}`;
    return {
      location,
      worldId: data.worldId || user.worldId || parseWorldId(location),
      instanceId: data.instanceId || user.instanceId || parseInstanceId(location),
      worldName: data.world?.name || data.worldName || data.name || "",
      nUsers: normalizeNumber(data.n_users),
      capacity: normalizeNumber(data.capacity ?? data.world?.capacity),
      queueSize: normalizeNumber(data.queueSize ?? data.queue_count),
      fetchedAt: new Date().toISOString(),
      source: "api"
    };
  }

  async fetchAvatar(avatarId) {
    const id = String(avatarId || "").trim();
    if (!AVATAR_ID_RE.test(id)) throw new Error("VRChat avatar id is invalid");
    if (!this.authCookie) throw new Error("VRChat auth cookie is not configured");

    const response = await fetchVrchat(`https://api.vrchat.cloud/api/1/avatars/${encodeURIComponent(id)}`, {
      headers: {
        "accept": "application/json",
        "user-agent": this.userAgent,
        "cookie": this.authCookie
      }
    });

    if (!response.ok) throw new Error(`VRChat API HTTP ${response.status}`);
    const data = await response.json();
    return {
      avatarId: data.id || id,
      avatarName: data.name || data.displayName || id,
      authorName: data.authorName || "",
      releaseStatus: data.releaseStatus || "",
      profileUrl: `https://vrchat.com/home/avatar/${encodeURIComponent(data.id || id)}`,
      source: "api"
    };
  }

  async searchAvatarCandidates(avatarName) {
    const query = String(avatarName || "").trim().slice(0, 240);
    const nameKey = normalizeAvatarName(query);
    if (!nameKey) return { query, candidates: [] };
    if (!this.authCookie) throw new Error("VRChat auth cookie is not configured");

    const cached = this.avatarSearchCache.get(nameKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    if (this.avatarSearchPending.has(nameKey)) return this.avatarSearchPending.get(nameKey);

    const pending = this._searchAvatarCandidates(query, nameKey)
      .then((value) => {
        this.avatarSearchCache.set(nameKey, {
          expiresAt: Date.now() + AVATAR_SEARCH_CACHE_TTL_MS,
          value
        });
        return value;
      })
      .finally(() => this.avatarSearchPending.delete(nameKey));

    this.avatarSearchPending.set(nameKey, pending);
    return pending;
  }

  async _searchAvatarCandidates(query, nameKey) {
    const searchQuery = query.replace(/\s+by\s+.+$/iu, "").trim();
    const tasks = [
      this._fetchFavoriteAvatars(searchQuery),
      this._fetchCachedAvatarCollection("own", "/avatars", { user: "me", releaseStatus: "all", sort: "updated", order: "descending" }),
      this._fetchCachedAvatarCollection("licensed", "/avatars/licensed", {})
    ];
    const results = await Promise.allSettled(tasks);
    const successful = results.filter((result) => result.status === "fulfilled");
    if (successful.length === 0) {
      throw results[0]?.reason || new Error("VRChat avatar search is unavailable");
    }

    const byId = new Map();
    for (const result of successful) {
      for (const avatar of result.value) {
        const candidate = normalizeAvatarCandidate(avatar.data, avatar.source);
        if (!candidate || normalizeAvatarName(candidate.avatarName) !== nameKey) continue;
        const existing = byId.get(candidate.avatarId);
        if (existing) {
          existing.sources = [...new Set([...existing.sources, ...candidate.sources])];
        } else {
          byId.set(candidate.avatarId, candidate);
        }
      }
    }

    return {
      query,
      candidates: [...byId.values()]
        .sort((a, b) => avatarSourcePriority(a) - avatarSourcePriority(b) || a.avatarId.localeCompare(b.avatarId))
        .slice(0, 10)
    };
  }

  async _fetchFavoriteAvatars(query) {
    const rows = await this._fetchAvatarPage("/avatars/favorites", {
      search: query,
      n: AVATAR_COLLECTION_PAGE_SIZE,
      offset: 0,
      releaseStatus: "all"
    });
    return rows.map((data) => ({ data, source: "favorite" }));
  }

  async _fetchCachedAvatarCollection(cacheKey, pathName, baseParams) {
    const cached = this.avatarCollectionCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const rows = [];
    for (let page = 0; page < AVATAR_COLLECTION_MAX_PAGES; page += 1) {
      const pageRows = await this._fetchAvatarPage(pathName, {
        ...baseParams,
        n: AVATAR_COLLECTION_PAGE_SIZE,
        offset: page * AVATAR_COLLECTION_PAGE_SIZE
      });
      rows.push(...pageRows.map((data) => ({ data, source: cacheKey })));
      if (pageRows.length < AVATAR_COLLECTION_PAGE_SIZE) break;
    }

    this.avatarCollectionCache.set(cacheKey, {
      expiresAt: Date.now() + AVATAR_SEARCH_CACHE_TTL_MS,
      value: rows
    });
    return rows;
  }

  async _fetchAvatarPage(pathName, params) {
    const url = new URL(`https://api.vrchat.cloud/api/1${pathName}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    }
    const response = await fetchVrchat(url.toString(), {
      headers: {
        "accept": "application/json",
        "user-agent": this.userAgent,
        "cookie": this.authCookie
      }
    });
    if (!response.ok) throw new Error(`VRChat API HTTP ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  fallbackProfile(userId) {
    return {
      userId,
      displayName: userId,
      profileUrl: `https://vrchat.com/home/user/${encodeURIComponent(userId)}`,
      source: "fallback"
    };
  }
}

function parseWorldId(location) {
  return String(location || "").match(/wrld_[0-9a-f-]+/iu)?.[0] || "";
}

function parseInstanceId(location) {
  const value = String(location || "");
  if (!value.includes(":")) return "";
  return value.split(":").slice(1).join(":");
}

function normalizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeAvatarCandidate(data, source) {
  const avatarId = String(data?.id || "").trim();
  const avatarName = String(data?.name || data?.displayName || "").trim();
  if (!AVATAR_ID_RE.test(avatarId) || !avatarName) return null;
  return {
    avatarId,
    avatarName,
    authorName: String(data.authorName || "").trim(),
    releaseStatus: String(data.releaseStatus || "").trim(),
    profileUrl: `https://vrchat.com/home/avatar/${encodeURIComponent(avatarId)}`,
    sources: [source]
  };
}

function avatarSourcePriority(candidate) {
  const sources = new Set(candidate.sources || []);
  if (sources.has("own")) return 0;
  if (sources.has("favorite")) return 1;
  if (sources.has("licensed")) return 2;
  return 3;
}

module.exports = {
  VrchatUserResolver,
  normalizeAuthCookie,
  normalizeAvatarName,
  parseWorldId,
  parseInstanceId
};
