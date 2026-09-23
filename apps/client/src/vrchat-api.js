"use strict";

const USER_ID_RE = /^usr_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const AVATAR_ID_RE = /^avtr_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const QUEUE_INTERVAL_MS = 350;
const MAX_RETRIES = 3;
const FETCH_TIMEOUT_MS = 15_000;
const PROFILE_CACHE_TTL_MS = 30 * 60 * 1000;
const PROFILE_CACHE_MAX_ENTRIES = 1_000;
const AVATAR_SEARCH_CACHE_TTL_MS = 15 * 60 * 1000;
const AVATAR_SEARCH_CACHE_MAX_ENTRIES = 100;
const AVATAR_COLLECTION_CACHE_MAX_ENTRIES = 12;
const MAX_RETRY_DELAY_MS = 60_000;
const AVATAR_COLLECTION_PAGE_SIZE = 100;
const AVATAR_COLLECTION_MAX_PAGES = 3;
const SOCIAL_CACHE_TTL_MS = 60_000;
const FRIEND_PAGE_SIZE = 100;
const FRIEND_MAX_PAGES_PER_STATE = 10;

function normalizeAuthCookie(value) {
  const cookie = String(value || "").trim();
  if (!cookie || /(?:^|;)\s*auth=/iu.test(cookie)) return cookie;
  return /^authcookie_/iu.test(cookie) ? `auth=${cookie}` : cookie;
}

function cookiePairs(value) {
  const rows = Array.isArray(value) ? value : [value];
  const pairs = [];
  for (const row of rows) {
    const text = String(row || "");
    for (const match of text.matchAll(/(?:^|[;,]\s*)(auth|twoFactorAuth)=([^;,]*)/giu)) {
      pairs.push(`${match[1]}=${match[2]}`);
    }
  }
  return pairs;
}

function mergeCookieHeaders(...values) {
  const cookies = new Map();
  for (const value of values) {
    for (const pair of cookiePairs(value)) {
      const separator = pair.indexOf("=");
      cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  }
  return [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

function responseCookieHeader(response, currentCookie = "") {
  const headers = response?.headers;
  let setCookies = [];
  if (typeof headers?.getSetCookie === "function") setCookies = headers.getSetCookie();
  else if (typeof headers?.raw === "function") setCookies = headers.raw()?.["set-cookie"] || [];
  else if (typeof headers?.get === "function") setCookies = headers.get("set-cookie") || [];
  return mergeCookieHeaders(currentCookie, setCookies);
}

function normalizeCurrentUser(data) {
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

function normalizeAvatarName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/gu, " ")
    .replace(/\s+by\s+.+$/iu, "")
    .toLowerCase()
    .slice(0, 180);
}

function freshCacheValue(cache, key, now = Date.now()) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Number(entry.expiresAt) <= now) {
    cache.delete(key);
    return undefined;
  }
  cache.delete(key);
  cache.set(key, entry);
  return entry.value;
}

function setBoundedCacheValue(cache, key, value, expiresAt, maximumEntries) {
  cache.delete(key);
  cache.set(key, { expiresAt, value });
  while (cache.size > maximumEntries) cache.delete(cache.keys().next().value);
}

function retryAfterMilliseconds(response) {
  const raw = typeof response?.headers?.get === "function" ? response.headers.get("retry-after") : "";
  if (!raw) return 0;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.min(MAX_RETRY_DELAY_MS, Math.max(0, seconds * 1000));
  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) ? Math.min(MAX_RETRY_DELAY_MS, Math.max(0, timestamp - Date.now())) : 0;
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
  constructor(options = {}) {
    const safeOptions = options && typeof options === "object" ? options : {};
    this.cache = new Map();
    this.pending = new Map();
    this.queue = [];
    this.queueTimer = null;
    this.userAgent = process.env.VRCHAT_USER_AGENT || "VRChatAdminTools/0.5.5 contact:local";
    this.authCookie = process.env.VRCHAT_AUTH_COOKIE || "";
    this.avatarSearchCache = new Map();
    this.avatarSearchPending = new Map();
    this.avatarCollectionCache = new Map();
    this.socialCache = null;
    this.personalCache = new Map();
    this.pendingLoginCookie = "";
    this.pendingLoginMethods = [];
    this.authCookieChangeHandler = null;
    this.queueIntervalMs = Math.max(0, Number(safeOptions.queueIntervalMs ?? QUEUE_INTERVAL_MS) || 0);
    this.maxRetries = Math.max(0, Number(safeOptions.maxRetries ?? MAX_RETRIES) || 0);
    this.retryBaseDelayMs = Math.max(1, Number(safeOptions.retryBaseDelayMs ?? 500) || 500);
    this.profileCacheLimit = Math.max(1, Number(safeOptions.profileCacheLimit ?? PROFILE_CACHE_MAX_ENTRIES) || PROFILE_CACHE_MAX_ENTRIES);
    this.profileCacheTtlMs = Math.max(1, Number(safeOptions.profileCacheTtlMs ?? PROFILE_CACHE_TTL_MS) || PROFILE_CACHE_TTL_MS);
  }

  setAuthCookie(authCookie) {
    const normalized = normalizeAuthCookie(authCookie);
    if (normalized === this.authCookie) return;
    this.authCookie = normalized;
    this.cache.clear();
    this.avatarSearchCache.clear();
    this.avatarSearchPending.clear();
    this.avatarCollectionCache.clear();
    this.socialCache = null;
    this.personalCache.clear();
  }

  hasAuthCookie() {
    return Boolean(this.authCookie);
  }

  getAuthCookie() {
    return this.authCookie;
  }

  setAuthCookieChangeHandler(handler) {
    this.authCookieChangeHandler = typeof handler === "function" ? handler : null;
  }

  _captureAuthCookie(response) {
    if (!response?.ok || !this.authCookie) return;
    const refreshed = responseCookieHeader(response, this.authCookie);
    if (!refreshed || refreshed === this.authCookie) return;
    this.setAuthCookie(refreshed);
    this.authCookieChangeHandler?.(refreshed);
  }

  cancelAccountLogin() {
    this.pendingLoginCookie = "";
    this.pendingLoginMethods = [];
  }

  async loginWithAccount(username, password) {
    const account = String(username || "").trim();
    const secret = String(password || "");
    if (!account || account.length > 320) throw new Error("vrchat_login_username_required");
    if (!secret || secret.length > 1024) throw new Error("vrchat_login_password_required");

    this.cancelAccountLogin();
    const credentials = Buffer.from(`${encodeURIComponent(account)}:${encodeURIComponent(secret)}`, "utf8").toString("base64");
    const response = await fetchVrchat("https://api.vrchat.cloud/api/1/auth/user", {
      headers: {
        "accept": "application/json",
        "authorization": `Basic ${credentials}`,
        "user-agent": this.userAgent
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) throw new Error("vrchat_login_invalid_credentials");
      if (response.status === 429) throw new Error("vrchat_login_rate_limited");
      throw new Error(`VRChat API HTTP ${response.status}`);
    }

    const loginCookie = responseCookieHeader(response);
    if (!/(?:^|;)\s*auth=/iu.test(loginCookie)) throw new Error("vrchat_login_session_missing");
    const methods = [...new Set((Array.isArray(data?.requiresTwoFactorAuth) ? data.requiresTwoFactorAuth : [])
      .map((method) => String(method || ""))
      .filter((method) => ["totp", "emailOtp", "otp"].includes(method)))];
    if (methods.length > 0) {
      this.pendingLoginCookie = loginCookie;
      this.pendingLoginMethods = methods;
      return { authenticated: false, requiresTwoFactorAuth: methods };
    }

    const user = normalizeCurrentUser(data);
    this.setAuthCookie(loginCookie);
    return { authenticated: true, requiresTwoFactorAuth: [], user };
  }

  async verifyAccountLogin(method, code) {
    if (!this.pendingLoginCookie) throw new Error("vrchat_login_not_pending");
    const type = String(method || "");
    const value = String(code || "").trim();
    const endpoint = {
      totp: "totp",
      emailOtp: "emailotp",
      otp: "otp"
    }[type];
    const methodAllowed = this.pendingLoginMethods.includes(type) || (type === "otp" && this.pendingLoginMethods.includes("totp"));
    if (!endpoint || !methodAllowed) throw new Error("vrchat_login_2fa_method_invalid");
    if (value.length < 4 || value.length > 64) throw new Error("vrchat_login_2fa_code_required");

    const response = await fetchVrchat(`https://api.vrchat.cloud/api/1/auth/twofactorauth/${endpoint}/verify`, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "cookie": this.pendingLoginCookie,
        "user-agent": this.userAgent
      },
      body: JSON.stringify({ code: value })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result?.verified !== true) {
      if (response.status === 429) throw new Error("vrchat_login_rate_limited");
      throw new Error("vrchat_login_2fa_invalid");
    }

    const completedCookie = responseCookieHeader(response, this.pendingLoginCookie);
    const currentUserResponse = await fetchVrchat("https://api.vrchat.cloud/api/1/auth/user", {
      headers: {
        "accept": "application/json",
        "cookie": completedCookie,
        "user-agent": this.userAgent
      }
    });
    const currentUserData = await currentUserResponse.json().catch(() => ({}));
    if (!currentUserResponse.ok) throw new Error(`VRChat API HTTP ${currentUserResponse.status}`);
    const user = normalizeCurrentUser(currentUserData);
    this.cancelAccountLogin();
    this.setAuthCookie(completedCookie);
    return { authenticated: true, requiresTwoFactorAuth: [], user };
  }

  async resolve(userId) {
    if (!USER_ID_RE.test(String(userId || ""))) return null;
    const cached = freshCacheValue(this.cache, userId);
    if (cached) return cached;
    if (this.pending.has(userId)) return this.pending.get(userId);

    const promise = new Promise((resolve) => {
      this.queue.push({ userId, resolve, retries: 0 });
      this._scheduleQueue();
    }).then((profile) => {
      if (profile) setBoundedCacheValue(this.cache, userId, profile, Date.now() + this.profileCacheTtlMs, this.profileCacheLimit);
      this.pending.delete(userId);
      return profile;
    });

    this.pending.set(userId, promise);
    return promise;
  }

  _scheduleQueue() {
    if (this.queueTimer) return;
    this.queueTimer = setTimeout(() => this._processNext(), this.queueIntervalMs);
  }

  async _processNext() {
    this.queueTimer = null;
    if (this.queue.length === 0) return;

    const item = this.queue.shift();
    try {
      const profile = await this.fetchUser(item.userId);
      item.resolve(profile);
    } catch (error) {
      const isRateLimit = error?.status === 429 || error.message?.includes("429");
      if (item.retries < this.maxRetries) {
        item.retries += 1;
        const exponentialDelay = Math.min(MAX_RETRY_DELAY_MS, this.retryBaseDelayMs * (2 ** (item.retries - 1)));
        const delay = isRateLimit ? Math.max(exponentialDelay, Number(error?.retryAfterMs) || 0) : exponentialDelay;
        setTimeout(() => {
          this.queue.push(item);
          this._scheduleQueue();
        }, delay);
      } else {
        item.resolve(null);
      }
    }

    if (this.queue.length > 0) {
      this.queueTimer = setTimeout(() => this._processNext(), this.queueIntervalMs);
    }
  }

  async fetchUser(userId) {
    if (!USER_ID_RE.test(String(userId || ""))) throw new Error("VRChat user id is invalid");
    const url = `https://api.vrchat.cloud/api/1/users/${encodeURIComponent(userId)}`;
    const headers = {
      "accept": "application/json",
      "user-agent": this.userAgent
    };
    if (this.authCookie) headers.cookie = this.authCookie;

    const response = await fetchVrchat(url, { headers });

    if (response.status === 401 && this.authCookie) {
      await this.fetchCurrentUser();
      throw new Error("VRChat user profile is unavailable");
    }
    if (!response.ok) {
      const error = new Error(`VRChat API HTTP ${response.status}`);
      error.status = response.status;
      if (response.status === 429) error.retryAfterMs = retryAfterMilliseconds(response);
      throw error;
    }
    const data = await response.json();
    return normalizeUserProfile(data, userId);
  }

  async fetchUserProfile(userId) {
    if (!this.authCookie) throw new Error("VRChat auth cookie is not configured");
    if (!USER_ID_RE.test(String(userId || ""))) throw new Error("VRChat user id is invalid");
    const headers = {
      "accept": "application/json",
      "user-agent": this.userAgent,
      "cookie": this.authCookie
    };
    const [legacy, publicResponse] = await Promise.all([
      this.fetchUser(userId).then((value) => ({ value }), (error) => ({ error })),
      fetchVrchat(`https://api.vrchat.cloud/api/1/profile/${encodeURIComponent(userId)}`, { headers }).catch(() => null)
    ]);
    const publicData = publicResponse?.ok ? await publicResponse.json().catch(() => null) : null;
    const validPublic = publicData && publicData.id === userId;
    if (!legacy.value && !validPublic) throw legacy.error || new Error("VRChat profile is unavailable");
    const profile = legacy.value || normalizeUserProfile(publicData, userId);
    if (validPublic) {
      profile.cosmetics = normalizeProfileCosmetics(publicData);
      profile.displayName = String(publicData.displayName || profile.displayName).slice(0, 300);
      profile.bio = String(publicData.bio || profile.bio).slice(0, 2000);
    }
    if (!legacy.value) {
      const privateResponse = await fetchVrchat(`https://api.vrchat.cloud/api/1/profile/${encodeURIComponent(userId)}/private`, { headers }).catch(() => null);
      const privateData = privateResponse?.ok ? await privateResponse.json().catch(() => null) : null;
      if (privateData?.id === userId) Object.assign(profile, normalizeUserProfile({ ...publicData, ...privateData, ...privateData.activity }, userId));
    }
    const instanceRequest = profile.worldId && profile.instanceId
      ? fetchVrchat(`https://api.vrchat.cloud/api/1/instances/${encodeURIComponent(profile.worldId)}:${encodeURIComponent(profile.instanceId)}`, { headers }).catch(() => null)
      : Promise.resolve(null);
    const [groupsResponse, mutualsResponse, instanceResponse] = await Promise.all([
      fetchVrchat(`https://api.vrchat.cloud/api/1/users/${encodeURIComponent(userId)}/groups`, { headers }).catch(() => null),
      fetchVrchat(`https://api.vrchat.cloud/api/1/users/${encodeURIComponent(userId)}/mutuals/friends?n=100&offset=0`, { headers }).catch(() => null),
      instanceRequest
    ]);
    const groups = groupsResponse?.ok ? normalizeGroups(await groupsResponse.json()) : [];
    const mutualRows = mutualsResponse?.ok ? await mutualsResponse.json() : [];
    const instance = instanceResponse?.ok ? await instanceResponse.json().catch(() => null) : null;
    const mutualFriends = (Array.isArray(mutualRows) ? mutualRows : [])
      .map((row) => normalizeFriend(row, row?.status === "offline"))
      .filter(Boolean);
    return {
      ...profile,
      worldName: String(instance?.world?.name || instance?.worldName || instance?.name || profile.worldName || "").slice(0, 300),
      groups,
      mutualFriends
    };
  }

  async fetchGroup(groupId) {
    const id = String(groupId || "").trim();
    if (!/^grp_[0-9a-f-]+$/iu.test(id)) throw new Error("VRChat group id is invalid");
    if (!this.authCookie) throw new Error("VRChat auth cookie is not configured");
    const headers = {
      "accept": "application/json",
      "user-agent": this.userAgent,
      "cookie": this.authCookie
    };
    const [response, instancesResponse, calendarResponse] = await Promise.all([
      fetchVrchat(`https://api.vrchat.cloud/api/1/groups/${encodeURIComponent(id)}`, { headers }),
      fetchVrchat(`https://api.vrchat.cloud/api/1/groups/${encodeURIComponent(id)}/instances`, { headers }).catch(() => null),
      fetchVrchat(`https://api.vrchat.cloud/api/1/calendar/${encodeURIComponent(id)}?n=100&offset=0`, { headers }).catch(() => null)
    ]);
    if (!response.ok) throw new Error(`VRChat API HTTP ${response.status}`);
    const data = await response.json();
    const instanceRows = instancesResponse?.ok ? await instancesResponse.json() : [];
    const calendar = calendarResponse?.ok ? await calendarResponse.json().catch(() => null) : null;
    return {
      ...normalizeGroup(data, id),
      instances: (Array.isArray(instanceRows) ? instanceRows : []).map(normalizeGroupInstance).filter(Boolean).slice(0, 50),
      events: (Array.isArray(calendar?.results) ? calendar.results : []).slice(0, 100).map(normalizeCalendarEvent).filter(Boolean),
      eventsUnavailable: !Array.isArray(calendar?.results),
      eventsTruncated: Boolean(calendar?.hasNext) || Number(calendar?.totalCount || 0) > 100
    };
  }

  async fetchPersonalCollection(kind, { force = false } = {}) {
    if (!this.authCookie) throw new Error("VRChat auth cookie is not configured");
    const safeKind = ["favorite-worlds", "favorite-avatars", "notifications", "prints", "inventory"].includes(kind) ? kind : "";
    if (!safeKind) throw new Error("VRChat personal collection is invalid");
    const cached = force ? undefined : freshCacheValue(this.personalCache, safeKind);
    if (cached) return cached;
    const ownUser = safeKind === "prints" ? await this.fetchCurrentUser() : null;
    if (ownUser && !USER_ID_RE.test(ownUser.userId)) throw new Error("VRChat account session is invalid");
    const collectionCookie = this.authCookie;
    const pathName = {
      "favorite-worlds": "/worlds/favorites?n=100&offset=0&sort=updated&order=descending",
      "favorite-avatars": "/avatars/favorites?n=100&offset=0&sort=updated&order=descending&releaseStatus=all",
      notifications: "/auth/user/notifications?n=100",
      prints: `/prints/user/${encodeURIComponent(ownUser?.userId || "")}`,
      inventory: "/inventory?n=100&offset=0"
    }[safeKind];
    const response = await fetchVrchat(`https://api.vrchat.cloud/api/1${pathName}`, {
      headers: {
        "accept": "application/json",
        "user-agent": this.userAgent,
        "cookie": this.authCookie
      }
    });
    if (!response.ok) throw new Error(`VRChat API HTTP ${response.status}`);
    const data = await response.json();
    if (collectionCookie !== this.authCookie) throw new Error("VRChat account changed during collection request");
    const rows = safeKind === "prints" ? (Array.isArray(data) ? data : []).slice(0, 100).filter((row) => row?.ownerId === ownUser.userId).map(normalizePrint).filter(Boolean)
      : safeKind === "inventory" ? (Array.isArray(data?.data) ? data.data : []).slice(0, 100).map(normalizeInventoryItem).filter(Boolean)
      : safeKind === "favorite-worlds"
      ? (Array.isArray(data) ? data : []).map(normalizeFavoriteWorld).filter(Boolean)
      : safeKind === "favorite-avatars"
        ? (Array.isArray(data) ? data : []).map((row) => normalizeAvatarCandidate(row, "favorite")).filter(Boolean)
        : (Array.isArray(data) ? data : []).map(normalizeNotification).filter(Boolean);
    if ((safeKind === "prints" && !Array.isArray(data)) || (safeKind === "inventory" && !Array.isArray(data?.data))) throw new Error("VRChat collection response is unavailable");
    const sourceCount = Array.isArray(data) ? data.length : Array.isArray(data?.data) ? data.data.length : rows.length;
    const value = { kind: safeKind, rows, fetchedAt: new Date().toISOString(), truncated: sourceCount >= 100 || Number(data?.totalCount || 0) > sourceCount };
    setBoundedCacheValue(this.personalCache, safeKind, value, Date.now() + SOCIAL_CACHE_TTL_MS, 5);
    return value;
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

    this._captureAuthCookie(response);
    if (response.status === 401) throw new Error("VRChat account session is invalid");
    if (!response.ok) throw new Error(`VRChat API HTTP ${response.status}`);
    const data = await response.json();
    return normalizeCurrentUser(data);
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

  async fetchSocialSummary({ force = false } = {}) {
    if (!this.authCookie) throw new Error("VRChat auth cookie is not configured");
    if (!force && this.socialCache?.expiresAt > Date.now()) return this.socialCache.value;
    const user = await this.fetchCurrentUser();
    const headers = {
      "accept": "application/json",
      "user-agent": this.userAgent,
      "cookie": this.authCookie
    };
    const [onlineResult, offlineResult, groupsResponse] = await Promise.all([
      this._fetchFriendsByState(false, headers).catch((error) => ({ rows: [], complete: false, error })),
      this._fetchFriendsByState(true, headers).catch((error) => ({ rows: [], complete: false, error })),
      fetchVrchat(`https://api.vrchat.cloud/api/1/users/${encodeURIComponent(user.userId)}/groups`, { headers }).catch(() => null)
    ]);
    if (onlineResult.error && offlineResult.error) throw onlineResult.error;
    const groupRows = groupsResponse?.ok ? await groupsResponse.json() : [];
    const friendsById = new Map();
    for (const row of onlineResult.rows) friendsById.set(row.userId, { ...row, online: true });
    for (const row of offlineResult.rows) if (!friendsById.has(row.userId)) friendsById.set(row.userId, { ...row, online: false });
    const friends = [...friendsById.values()];
    const groups = normalizeGroups(groupRows);
    const value = {
      user,
      friends,
      groups,
      completeFriends: onlineResult.complete && offlineResult.complete,
      truncatedFriends: !onlineResult.complete || !offlineResult.complete,
      fetchedAt: new Date().toISOString(),
      source: "vrchat-api",
      partial: Boolean(onlineResult.error || offlineResult.error || !groupsResponse?.ok)
    };
    this.socialCache = { expiresAt: Date.now() + SOCIAL_CACHE_TTL_MS, value };
    return value;
  }

  async _fetchFriendsByState(offline, headers) {
    const rows = [];
    let complete = false;
    for (let page = 0; page < FRIEND_MAX_PAGES_PER_STATE; page += 1) {
      const url = new URL("https://api.vrchat.cloud/api/1/auth/user/friends");
      url.searchParams.set("n", String(FRIEND_PAGE_SIZE));
      url.searchParams.set("offset", String(page * FRIEND_PAGE_SIZE));
      url.searchParams.set("offline", String(Boolean(offline)));
      const response = await fetchVrchat(url.toString(), { headers });
      if (!response.ok) throw new Error(`VRChat API HTTP ${response.status}`);
      const pageRows = await response.json();
      const normalized = (Array.isArray(pageRows) ? pageRows : [])
        .map((row) => normalizeFriend(row, offline))
        .filter(Boolean);
      rows.push(...normalized);
      if (!Array.isArray(pageRows) || pageRows.length < FRIEND_PAGE_SIZE) {
        complete = true;
        break;
      }
    }
    return { rows, complete };
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
      authorId: data.authorId || "",
      authorName: data.authorName || "",
      description: String(data.description || "").slice(0, 1000),
      releaseStatus: data.releaseStatus || "",
      createdAt: data.created_at || data.createdAt || "",
      updatedAt: data.updated_at || data.updatedAt || "",
      version: normalizeNumber(data.version),
      platforms: normalizeAvatarPlatforms(data),
      performance: normalizeAvatarPerformance(data),
      packages: normalizeAvatarPackages(data),
      tags: (Array.isArray(data.tags) ? data.tags : []).map(String).filter(Boolean).slice(0, 50),
      featured: Boolean(data.featured),
      canFavorite: String(data.releaseStatus || "").toLowerCase() === "public",
      profileUrl: `https://vrchat.com/home/avatar/${encodeURIComponent(data.id || id)}`,
      source: "api"
    };
  }

  async favoriteAvatar(avatarId, favoriteGroup = "avatars1") {
    const id = String(avatarId || "").trim();
    const group = String(favoriteGroup || "avatars1").trim();
    if (!AVATAR_ID_RE.test(id)) throw new Error("VRChat avatar id is invalid");
    if (!/^avatars[1-6]$/u.test(group)) throw new Error("VRChat avatar favorite group is invalid");
    if (!this.authCookie) throw new Error("VRChat auth cookie is not configured");

    const avatar = await this.fetchAvatar(id);
    if (!avatar.canFavorite) throw new Error("VRChat allows this action only for a public avatar");

    const response = await fetchVrchat("https://api.vrchat.cloud/api/1/favorites", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "user-agent": this.userAgent,
        "cookie": this.authCookie
      },
      body: JSON.stringify({ type: "avatar", favoriteId: id, tags: [group] })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = String(data?.error?.message || "").trim();
      if (/already.+favorite/iu.test(message)) {
        return { avatarId: id, avatarName: avatar.avatarName, alreadyFavorite: true, favoriteGroup: group };
      }
      throw new Error(message || `VRChat API HTTP ${response.status}`);
    }

    this.avatarSearchCache.clear();
    this.avatarCollectionCache.delete("favorite");
    return {
      avatarId: id,
      avatarName: avatar.avatarName,
      favoriteId: data.id || "",
      favoriteGroup: group,
      alreadyFavorite: false
    };
  }

  async selectAvatar(avatarId) {
    const id = String(avatarId || "").trim();
    if (!AVATAR_ID_RE.test(id)) throw new Error("VRChat avatar id is invalid");
    if (!this.authCookie) throw new Error("VRChat auth cookie is not configured");

    const avatar = await this.fetchAvatar(id);
    const response = await fetchVrchat(`https://api.vrchat.cloud/api/1/avatars/${encodeURIComponent(id)}/select`, {
      method: "PUT",
      headers: {
        "accept": "application/json",
        "user-agent": this.userAgent,
        "cookie": this.authCookie
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = String(data?.error?.message || "").trim();
      throw new Error(message || `VRChat API HTTP ${response.status}`);
    }
    return {
      avatarId: id,
      avatarName: avatar.avatarName,
      selected: String(data?.currentAvatar || id) === id
    };
  }

  async searchAvatarCandidates(avatarName) {
    const query = String(avatarName || "").trim().slice(0, 240);
    const nameKey = normalizeAvatarName(query);
    if (!nameKey) return { query, candidates: [] };
    if (!this.authCookie) throw new Error("VRChat auth cookie is not configured");

    const cached = freshCacheValue(this.avatarSearchCache, nameKey);
    if (cached) return cached;
    if (this.avatarSearchPending.has(nameKey)) return this.avatarSearchPending.get(nameKey);

    const pending = this._searchAvatarCandidates(query, nameKey)
      .then((value) => {
        setBoundedCacheValue(this.avatarSearchCache, nameKey, value, Date.now() + AVATAR_SEARCH_CACHE_TTL_MS, AVATAR_SEARCH_CACHE_MAX_ENTRIES);
        return value;
      })
      .finally(() => this.avatarSearchPending.delete(nameKey));

    this.avatarSearchPending.set(nameKey, pending);
    return pending;
  }

  async searchAvatars(searchText) {
    const query = String(searchText || "").trim().replace(/\s+/gu, " ").slice(0, 120);
    const searchKey = normalizeAvatarName(query);
    if (searchKey.length < 2) throw new Error("Avatar search requires at least two characters");
    if (!this.authCookie) throw new Error("VRChat auth cookie is not configured");

    const cacheKey = `browse:${searchKey}`;
    const cached = freshCacheValue(this.avatarSearchCache, cacheKey);
    if (cached) return cached;
    if (this.avatarSearchPending.has(cacheKey)) return this.avatarSearchPending.get(cacheKey);

    const pending = this._searchAvatars(query, searchKey)
      .then((value) => {
        setBoundedCacheValue(this.avatarSearchCache, cacheKey, value, Date.now() + AVATAR_SEARCH_CACHE_TTL_MS, AVATAR_SEARCH_CACHE_MAX_ENTRIES);
        return value;
      })
      .finally(() => this.avatarSearchPending.delete(cacheKey));

    this.avatarSearchPending.set(cacheKey, pending);
    return pending;
  }

  async _searchAvatars(query, searchKey) {
    const tasks = [
      this._fetchFavoriteAvatars(query),
      this._fetchCachedAvatarCollection("own", "/avatars", { user: "me", releaseStatus: "all", sort: "updated", order: "descending" }),
      this._fetchCachedAvatarCollection("licensed", "/avatars/licensed", {})
    ];
    const results = await Promise.allSettled(tasks);
    const successful = results.filter((result) => result.status === "fulfilled");
    if (!successful.length) throw results[0]?.reason || new Error("VRChat avatar search is unavailable");

    const byId = new Map();
    for (const result of successful) {
      for (const avatar of result.value) {
        const candidate = normalizeAvatarCandidate(avatar.data, avatar.source);
        if (!candidate) continue;
        const searchable = normalizeAvatarName(`${candidate.avatarName} ${candidate.authorName} ${candidate.description}`);
        if (!searchable.includes(searchKey)) continue;
        const existing = byId.get(candidate.avatarId);
        if (existing) existing.sources = [...new Set([...existing.sources, ...candidate.sources])];
        else byId.set(candidate.avatarId, candidate);
      }
    }

    const rank = (candidate) => {
      const name = normalizeAvatarName(candidate.avatarName);
      if (name === searchKey) return 0;
      if (name.startsWith(searchKey)) return 1;
      if (name.includes(searchKey)) return 2;
      return 3;
    };
    return {
      query,
      scope: ["favorite", "own", "licensed"],
      candidates: [...byId.values()]
        .sort((left, right) => rank(left) - rank(right) || avatarSourcePriority(left) - avatarSourcePriority(right) || left.avatarName.localeCompare(right.avatarName))
        .slice(0, 40)
    };
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
    const cached = freshCacheValue(this.avatarCollectionCache, cacheKey);
    if (cached) return cached;

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

    setBoundedCacheValue(this.avatarCollectionCache, cacheKey, rows, Date.now() + AVATAR_SEARCH_CACHE_TTL_MS, AVATAR_COLLECTION_CACHE_MAX_ENTRIES);
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

function normalizeFriend(data, offlineHint = false) {
  const userId = String(data?.id || "").trim();
  if (!USER_ID_RE.test(userId)) return null;
  const location = String(data?.location || "");
  return {
    userId,
    displayName: String(data?.displayName || data?.username || userId).slice(0, 160),
    status: String(data?.status || (offlineHint ? "offline" : "active")),
    statusDescription: String(data?.statusDescription || "").slice(0, 300),
    location,
    worldId: parseWorldId(location),
    instanceId: parseInstanceId(location),
    worldName: String(data?.worldName || data?.world?.name || "").slice(0, 300),
    platform: String(data?.platform || data?.last_platform || ""),
    lastActivity: String(data?.last_activity || data?.last_login || ""),
    bio: String(data?.bio || "").slice(0, 1000),
    bioLinks: (Array.isArray(data?.bioLinks) ? data.bioLinks : []).map(String).slice(0, 8),
    avatarId: String(data?.currentAvatar || data?.currentAvatarId || "").slice(0, 120),
    avatarImageUrl: String(data?.currentAvatarImageUrl || data?.currentAvatarThumbnailImageUrl || "").slice(0, 1000),
    profileImageUrl: String(data?.profilePicOverride || data?.userIcon || data?.currentAvatarThumbnailImageUrl || data?.currentAvatarImageUrl || "").slice(0, 1000),
    allowAvatarCopying: Boolean(data?.allowAvatarCopying),
    profileUrl: `https://vrchat.com/home/user/${encodeURIComponent(userId)}`
  };
}

function normalizeUserProfile(data, fallbackUserId = "") {
  const userId = String(data?.id || fallbackUserId || "").trim();
  const location = String(data?.location || "");
  return {
    userId,
    displayName: String(data?.displayName || data?.username || userId),
    bio: String(data?.bio || "").slice(0, 2000),
    bioLinks: (Array.isArray(data?.bioLinks) ? data.bioLinks : []).map(String).slice(0, 8),
    status: String(data?.status || ""),
    statusDescription: String(data?.statusDescription || "").slice(0, 300),
    location,
    worldId: String(data?.worldId || parseWorldId(location)),
    instanceId: String(data?.instanceId || parseInstanceId(location)),
    worldName: String(data?.worldName || data?.world?.name || "").slice(0, 300),
    platform: String(data?.platform || data?.last_platform || ""),
    lastActivity: String(data?.last_activity || data?.last_login || ""),
    dateJoined: String(data?.date_joined || ""),
    isFriend: Boolean(data?.isFriend),
    allowAvatarCopying: Boolean(data?.allowAvatarCopying),
    avatarId: String(data?.currentAvatar || data?.currentAvatarId || "").slice(0, 120),
    avatarImageUrl: String(data?.currentAvatarImageUrl || data?.currentAvatarThumbnailImageUrl || "").slice(0, 1000),
    profileImageUrl: String(data?.profilePicOverride || data?.userIcon || data?.currentAvatarThumbnailImageUrl || data?.currentAvatarImageUrl || "").slice(0, 1000),
    note: String(data?.note || "").slice(0, 2000),
    badges: (Array.isArray(data?.badges) ? data.badges : []).map((badge) => ({
      name: String(badge?.badgeName || ""),
      description: String(badge?.badgeDescription || "").slice(0, 300)
    })).filter((badge) => badge.name).slice(0, 20),
    tags: (Array.isArray(data?.tags) ? data.tags : []).map(String).slice(0, 50),
    profileUrl: `https://vrchat.com/home/user/${encodeURIComponent(userId)}`,
    source: "api"
  };
}

function normalizeGroup(data, fallbackGroupId = "") {
  const groupId = String(data?.groupId || data?.id || fallbackGroupId || "").trim();
  return {
    groupId,
    name: String(data?.name || data?.shortCode || groupId),
    shortCode: String(data?.shortCode || ""),
    description: String(data?.description || "").slice(0, 4000),
    iconUrl: String(data?.iconUrl || data?.icon?.url || "").slice(0, 1000),
    bannerUrl: String(data?.bannerUrl || data?.banner?.url || "").slice(0, 1000),
    memberCount: normalizeNumber(data?.memberCount),
    onlineMemberCount: normalizeNumber(data?.onlineMemberCount),
    ownerId: String(data?.ownerId || ""),
    privacy: String(data?.privacy || ""),
    joinState: String(data?.joinState || ""),
    isRepresenting: Boolean(data?.isRepresenting),
    rules: (Array.isArray(data?.rules) ? data.rules : []).map((rule) => ({
      title: String(rule?.title || ""),
      text: String(rule?.text || rule?.description || "").slice(0, 1000)
    })).slice(0, 30),
    links: (Array.isArray(data?.links) ? data.links : []).map(String).slice(0, 12),
    announcement: normalizeGroupAnnouncement(data?.announcement),
    profileUrl: `https://vrchat.com/home/group/${encodeURIComponent(groupId)}`,
    source: "api"
  };
}

function normalizeProfileCosmetics(data) {
  const result = {};
  for (const key of ["backgroundType", "backgroundTextureId", "bannerType", "themeId", "iconFrame", "nameplateEffect", "profileEffect", "pronouns"]) {
    if (typeof data?.[key] === "string") result[key] = data[key].slice(0, 200);
  }
  for (const key of ["bannerColor", "themeButtonColor", "themeIconColor", "themeSubtextColor"]) {
    const color = String(data?.[key] || "").replace(/^#/u, "");
    if (/^[0-9a-f]{6}$/iu.test(color)) result[key] = `#${color}`;
  }
  return result;
}

function normalizePrint(data) {
  if (!/^prnt_[0-9a-f-]{36}$/iu.test(String(data?.id || ""))) return null;
  return { id: data.id, name: String(data.note || data.worldName || data.id).slice(0, 500),
    authorName: String(data.authorName || "").slice(0, 200), worldId: String(data.worldId || "").slice(0, 100),
    worldName: String(data.worldName || "").slice(0, 300), createdAt: String(data.createdAt || data.timestamp || "") };
}

function normalizeInventoryItem(data) {
  if (!/^inv_[0-9a-f-]{36}$/iu.test(String(data?.id || ""))) return null;
  return { id: data.id, name: String(data.name || data.id).slice(0, 300),
    description: String(data.description || "").slice(0, 1000), itemType: String(data.itemType || "").slice(0, 80),
    equipSlot: String(data.equipSlot || "").slice(0, 80), archived: Boolean(data.isArchived),
    createdAt: String(data.created_at || "") };
}

function normalizeCalendarEvent(data) {
  if (!/^cal_[0-9a-f-]{36}$/iu.test(String(data?.id || ""))) return null;
  return { id: data.id, title: String(data.title || data.id).slice(0, 300), description: String(data.description || "").slice(0, 2000),
    startsAt: String(data.startsAt || ""), endsAt: String(data.endsAt || ""), category: String(data.category || "").slice(0, 80) };
}

function normalizeGroupAnnouncement(data) {
  if (!data || typeof data !== "object") return null;
  const title = String(data.title || "").slice(0, 300);
  const text = String(data.text || data.description || "").slice(0, 4000);
  if (!title && !text) return null;
  return { title, text, createdAt: String(data.createdAt || data.created_at || "") };
}

function normalizeGroupInstance(data) {
  const location = String(data?.location || "").trim();
  const worldId = String(data?.world?.id || parseWorldId(location) || "").trim();
  const instanceId = String(data?.instanceId || parseInstanceId(location) || "").trim();
  if (!worldId && !instanceId) return null;
  return {
    worldId,
    instanceId,
    location,
    worldName: String(data?.world?.name || worldId || "").slice(0, 300),
    memberCount: normalizeNumber(data?.memberCount)
  };
}

function normalizeGroups(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => normalizeGroup(row))
    .filter((row) => /^grp_[0-9a-f-]+$/iu.test(row.groupId));
}

function normalizeAvatarPlatforms(data) {
  const packages = Array.isArray(data?.unityPackages) ? data.unityPackages : [];
  return [...new Set(packages.map((item) => String(item?.platform || "").trim()).filter(Boolean))];
}

function normalizeAvatarPerformance(data) {
  const packages = Array.isArray(data?.unityPackages) ? data.unityPackages : [];
  const byPlatform = {};
  for (const item of packages) {
    const platform = String(item?.platform || "").trim();
    const rating = String(item?.performanceRating || "").trim();
    if (platform && rating) byPlatform[platform] = rating;
  }
  return byPlatform;
}

function normalizeAvatarPackages(data) {
  const packages = Array.isArray(data?.unityPackages) ? data.unityPackages : [];
  return packages.slice(0, 20).map((item) => ({
    platform: String(item?.platform || "").slice(0, 80),
    variant: String(item?.variant || "").slice(0, 80),
    performanceRating: String(item?.performanceRating || "").slice(0, 80),
    unityVersion: String(item?.unityVersion || "").slice(0, 80),
    assetVersion: normalizeNumber(item?.assetVersion),
    fileSize: normalizeNumber(item?.fileSizeInBytes ?? item?.fileSize)
  })).filter((item) => item.platform || item.variant || item.performanceRating);
}

function normalizeFavoriteWorld(data) {
  const worldId = String(data?.id || "").trim();
  if (!/^wrld_[0-9a-f-]+$/iu.test(worldId)) return null;
  return {
    worldId,
    worldName: String(data?.name || worldId).slice(0, 300),
    authorName: String(data?.authorName || "").slice(0, 160),
    description: String(data?.description || "").slice(0, 1000),
    occupants: normalizeNumber(data?.occupants),
    capacity: normalizeNumber(data?.capacity),
    favoriteGroup: String(data?.favoriteGroup || ""),
    imageUrl: String(data?.thumbnailImageUrl || data?.imageUrl || "").slice(0, 1000),
    profileUrl: `https://vrchat.com/home/world/${encodeURIComponent(worldId)}`
  };
}

function normalizeNotification(data) {
  const id = String(data?.id || "").trim();
  if (!id) return null;
  return {
    id,
    type: String(data?.type || "notification").slice(0, 80),
    message: String(data?.message || "").slice(0, 1000),
    senderUserId: String(data?.senderUserId || ""),
    senderUsername: String(data?.senderUsername || "").slice(0, 160),
    createdAt: String(data?.created_at || ""),
    seen: Boolean(data?.seen)
  };
}

function normalizeAvatarCandidate(data, source) {
  const avatarId = String(data?.id || "").trim();
  const avatarName = String(data?.name || data?.displayName || "").trim();
  if (!AVATAR_ID_RE.test(avatarId) || !avatarName) return null;
  return {
    avatarId,
    avatarName,
    authorName: String(data.authorName || "").trim(),
    description: String(data.description || "").trim().slice(0, 500),
    releaseStatus: String(data.releaseStatus || "").trim(),
    imageUrl: String(data.thumbnailImageUrl || data.imageUrl || "").trim().slice(0, 1000),
    canFavorite: String(data.releaseStatus || "").trim().toLowerCase() === "public",
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
