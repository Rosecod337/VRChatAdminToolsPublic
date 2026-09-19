"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { VrchatUserResolver, normalizeAuthCookie } = require("../apps/client/src/vrchat-api");

test("normalizes a raw Cookie-Editor auth value without reading the browser", () => {
  assert.equal(normalizeAuthCookie("authcookie_example"), "auth=authcookie_example");
  assert.equal(normalizeAuthCookie("auth=authcookie_example"), "auth=authcookie_example");
  assert.equal(normalizeAuthCookie("twoFactorAuth=1; auth=authcookie_example"), "twoFactorAuth=1; auth=authcookie_example");
});

test("loginWithAccount exchanges credentials for a reusable session without exposing the password", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async (url, options = {}) => {
    assert.equal(String(url), "https://api.vrchat.cloud/api/1/auth/user");
    assert.match(options.headers.authorization, /^Basic /u);
    assert.equal(
      Buffer.from(options.headers.authorization.slice(6), "base64").toString("utf8"),
      "demo%40example.com:p%40ss%3Aword"
    );
    return responseJson(
      { id: "usr_11111111-1111-4111-8111-111111111111", displayName: "Demo" },
      true,
      200,
      ["auth=authcookie_login; Path=/; HttpOnly; Secure"]
    );
  };

  const resolver = new VrchatUserResolver();
  const result = await resolver.loginWithAccount("demo@example.com", "p@ss:word");
  assert.equal(result.authenticated, true);
  assert.equal(result.user.displayName, "Demo");
  assert.equal(resolver.getAuthCookie(), "auth=authcookie_login");
  assert.equal(Object.hasOwn(result, "password"), false);
});

test("account login supports TOTP and persists both VRChat session cookies", async (t) => {
  const originalFetch = global.fetch;
  const calls = [];
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return responseJson(
        { requiresTwoFactorAuth: ["totp"] },
        true,
        200,
        ["auth=authcookie_pending; Path=/; HttpOnly"]
      );
    }
    if (calls.length === 2) {
      assert.equal(options.method, "POST");
      assert.equal(options.headers.cookie, "auth=authcookie_pending");
      assert.deepEqual(JSON.parse(options.body), { code: "123456" });
      return responseJson(
        { enabled: true, verified: true },
        true,
        200,
        ["twoFactorAuth=twofactor_verified; Path=/; HttpOnly"]
      );
    }
    assert.match(options.headers.cookie, /auth=authcookie_pending/u);
    assert.match(options.headers.cookie, /twoFactorAuth=twofactor_verified/u);
    return responseJson({ id: "usr_11111111-1111-4111-8111-111111111111", displayName: "Demo" });
  };

  const resolver = new VrchatUserResolver();
  const pending = await resolver.loginWithAccount("demo", "password");
  assert.deepEqual(pending, { authenticated: false, requiresTwoFactorAuth: ["totp"] });
  const result = await resolver.verifyAccountLogin("totp", "123456");
  assert.equal(result.authenticated, true);
  assert.match(resolver.getAuthCookie(), /auth=authcookie_pending/u);
  assert.match(resolver.getAuthCookie(), /twoFactorAuth=twofactor_verified/u);
});

test("fetchCurrentInstance reads current instance online count from VRChat API", async (t) => {
  const originalFetch = global.fetch;
  const calls = [];

  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).endsWith("/auth/user")) {
      return responseJson({
        id: "usr_11111111-1111-4111-8111-111111111111",
        displayName: "Rose337",
        location: "wrld_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:12345~private(usr_owner)"
      });
    }
    if (String(url).includes("/instances/")) {
      return responseJson({
        id: "wrld_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:12345~private(usr_owner)",
        worldId: "wrld_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        instanceId: "12345~private(usr_owner)",
        n_users: 46,
        capacity: 80
      });
    }
    throw new Error(`unexpected url ${url}`);
  };

  const resolver = new VrchatUserResolver();
  resolver.setAuthCookie("auth=authcookie_test");

  const instance = await resolver.fetchCurrentInstance();

  assert.equal(instance.nUsers, 46);
  assert.equal(instance.capacity, 80);
  assert.equal(instance.worldId, "wrld_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
  assert.equal(instance.instanceId, "12345~private(usr_owner)");
  assert.equal(calls.length, 2);
  assert.match(calls[1], /\/instances\/wrld_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:12345~private\(usr_owner\)$/u);
});

test("searchAvatarCandidates keeps only exact names and deduplicates sources", async (t) => {
  const originalFetch = global.fetch;
  const calls = [];
  const avatarId = "avtr_11111111-1111-4111-8111-111111111111";

  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => {
    const value = String(url);
    calls.push(value);
    if (value.includes("/avatars/favorites")) {
      return responseJson([
        { id: avatarId, name: "Bonk", authorName: "Author" },
        { id: "avtr_33333333-3333-4333-8333-333333333333", name: "Bonk Clone" }
      ]);
    }
    if (value.includes("/avatars/licensed")) return responseJson([]);
    if (value.includes("/avatars?")) return responseJson([{ id: avatarId, name: "bonk", authorName: "Author" }]);
    throw new Error(`unexpected url ${url}`);
  };

  const resolver = new VrchatUserResolver();
  resolver.setAuthCookie("auth=authcookie_test");
  const result = await resolver.searchAvatarCandidates("  Bonk by Someone  ");

  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].avatarId, avatarId);
  assert.deepEqual(result.candidates[0].sources.sort(), ["favorite", "own"]);
  const favoriteCall = calls.find((url) => url.includes("/avatars/favorites"));
  assert.match(favoriteCall, /[?&]search=Bonk(?:&|$)/u);
  assert.doesNotMatch(favoriteCall, /Someone/u);

  const firstCallCount = calls.length;
  resolver.setAuthCookie("auth=authcookie_test");
  const cached = await resolver.searchAvatarCandidates("Bonk");
  assert.equal(cached.candidates.length, 1);
  assert.equal(calls.length, firstCallCount);
});

test("fetchSocialSummary returns authenticated friends and public groups and caches the result", async (t) => {
  const originalFetch = global.fetch;
  const calls = [];
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => {
    const value = String(url);
    calls.push(value);
    if (value.endsWith("/auth/user")) {
      return responseJson({ id: "usr_11111111-1111-4111-8111-111111111111", displayName: "Rose337" });
    }
    if (value.includes("/auth/user/friends")) {
      return responseJson([{ id: "usr_22222222-2222-4222-8222-222222222222", displayName: "Friend", status: "active" }]);
    }
    if (value.includes("/groups")) {
      return responseJson([{ groupId: "grp_33333333-3333-4333-8333-333333333333", name: "Example Group", memberCount: 12 }]);
    }
    throw new Error(`unexpected url ${url}`);
  };

  const resolver = new VrchatUserResolver();
  resolver.setAuthCookie("auth=authcookie_test");
  const result = await resolver.fetchSocialSummary();

  assert.equal(result.user.displayName, "Rose337");
  assert.equal(result.friends[0].displayName, "Friend");
  assert.equal(result.groups[0].name, "Example Group");
  assert.equal(result.completeFriends, true);
  assert.equal(calls.filter((url) => url.includes("/auth/user/friends")).length, 2);
  assert.ok(calls.some((url) => url.includes("offline=false")));
  assert.ok(calls.some((url) => url.includes("offline=true")));
  const callCount = calls.length;
  await resolver.fetchSocialSummary();
  assert.equal(calls.length, callCount);
});

test("fetchSocialSummary returns a safe partial result when one friend state or groups are unavailable", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async (url) => {
    const value = String(url);
    if (value.endsWith("/auth/user")) return responseJson({ id: "usr_11111111-1111-4111-8111-111111111111", displayName: "Rose337" });
    if (value.includes("/auth/user/friends") && value.includes("offline=false")) return responseJson([{ id: "usr_22222222-2222-4222-8222-222222222222", displayName: "Friend", status: "active" }]);
    if (value.includes("/auth/user/friends") && value.includes("offline=true")) throw new Error("offline list unavailable");
    if (value.includes("/groups")) return responseJson({}, false, 503);
    throw new Error(`unexpected url ${url}`);
  };
  const resolver = new VrchatUserResolver();
  resolver.setAuthCookie("auth=authcookie_test");
  const result = await resolver.fetchSocialSummary();
  assert.equal(result.friends.length, 1);
  assert.equal(result.groups.length, 0);
  assert.equal(result.completeFriends, false);
  assert.equal(result.partial, true);
});

test("fetchUserProfile exposes only authenticated API fields and public groups", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  const userId = "usr_22222222-2222-4222-8222-222222222222";
  global.fetch = async (url) => {
    const value = String(url);
    if (value.includes(`/users/${userId}/mutuals/friends`)) return responseJson([]);
    if (value.includes(`/users/${userId}/groups`)) return responseJson([{ groupId: "grp_33333333-3333-4333-8333-333333333333", name: "Group" }]);
    if (value.includes("/instances/wrld_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:123")) return responseJson({ world: { name: "Midnight Rooftop" } });
    if (value.includes(`/users/${userId}`)) return responseJson({ id: userId, displayName: "Friend", bio: "Hello", allowAvatarCopying: true, location: "wrld_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:123" });
    throw new Error(`unexpected url ${url}`);
  };
  const resolver = new VrchatUserResolver();
  resolver.setAuthCookie("auth=authcookie_test");
  const result = await resolver.fetchUserProfile(userId);
  assert.equal(result.bio, "Hello");
  assert.equal(result.allowAvatarCopying, true);
  assert.equal(result.worldId, "wrld_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
  assert.equal(result.worldName, "Midnight Rooftop");
  assert.equal(result.groups[0].name, "Group");
});

test("fetchUser distinguishes a private profile from an expired account session", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  const userId = "usr_22222222-2222-4222-8222-222222222222";
  global.fetch = async (url) => {
    if (String(url).includes(`/users/${userId}`)) return responseJson({}, false, 401);
    if (String(url).endsWith("/auth/user")) return responseJson({ id: "usr_11111111-1111-4111-8111-111111111111", displayName: "Current" });
    throw new Error(`unexpected url ${url}`);
  };
  const resolver = new VrchatUserResolver();
  resolver.setAuthCookie("auth=authcookie_test");
  await assert.rejects(() => resolver.fetchUser(userId), /user profile is unavailable/u);

  global.fetch = async () => responseJson({}, false, 401);
  await assert.rejects(() => resolver.fetchUser(userId), /account session is invalid/u);
});

test("fetchCurrentUser keeps refreshed VRChat cookies available for persistence", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async () => responseJson(
    { id: "usr_11111111-1111-4111-8111-111111111111", displayName: "Current" },
    true,
    200,
    ["auth=authcookie_fresh; Path=/; HttpOnly"]
  );
  const resolver = new VrchatUserResolver();
  resolver.setAuthCookie("auth=authcookie_old; twoFactorAuth=twofactor_keep");
  let persisted = "";
  resolver.setAuthCookieChangeHandler((cookie) => { persisted = cookie; });
  await resolver.fetchCurrentUser();
  assert.match(persisted, /auth=authcookie_fresh/u);
  assert.match(persisted, /twoFactorAuth=twofactor_keep/u);
  assert.equal(resolver.getAuthCookie(), persisted);
});

test("fetchGroup includes available group instances and tolerates an unavailable instance list", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  const groupId = "grp_33333333-3333-4333-8333-333333333333";
  global.fetch = async (url) => {
    const value = String(url);
    if (value.endsWith(`/groups/${groupId}/instances`)) {
      return responseJson([{ location: "wrld_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:123", memberCount: 7, world: { id: "wrld_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Group Public" } }]);
    }
    if (value.endsWith(`/groups/${groupId}`)) return responseJson({ id: groupId, name: "Group", announcement: { title: "News", text: "Hello" } });
    throw new Error(`unexpected url ${url}`);
  };
  const resolver = new VrchatUserResolver();
  resolver.setAuthCookie("auth=authcookie_test");
  const group = await resolver.fetchGroup(groupId);
  assert.equal(group.announcement.title, "News");
  assert.equal(group.instances[0].worldName, "Group Public");
  assert.equal(group.instances[0].memberCount, 7);

  global.fetch = async (url) => {
    if (String(url).endsWith(`/groups/${groupId}/instances`)) throw new Error("network unavailable");
    return responseJson({ id: groupId, name: "Group" });
  };
  const fallback = await resolver.fetchGroup(groupId);
  assert.deepEqual(fallback.instances, []);
});

test("fetchAvatar exposes per-platform performance ratings", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  const avatarId = "avtr_44444444-4444-4444-8444-444444444444";
  global.fetch = async () => responseJson({ id: avatarId, name: "Public Demo", releaseStatus: "public", unityPackages: [{ platform: "standalonewindows", performanceRating: "Good" }, { platform: "android", performanceRating: "Poor" }] });
  const resolver = new VrchatUserResolver();
  resolver.setAuthCookie("auth=authcookie_test");
  const avatar = await resolver.fetchAvatar(avatarId);
  assert.deepEqual(avatar.performance, { standalonewindows: "Good", android: "Poor" });
});

test("searchAvatarCandidates returns multiple exact IDs without choosing one", async (t) => {
  const originalFetch = global.fetch;

  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => {
    const value = String(url);
    if (value.includes("/avatars/favorites")) {
      return responseJson([{ id: "avtr_11111111-1111-4111-8111-111111111111", name: "Bonk" }]);
    }
    if (value.includes("/avatars/licensed")) return responseJson([]);
    if (value.includes("/avatars?")) {
      return responseJson([{ id: "avtr_22222222-2222-4222-8222-222222222222", name: "Bonk" }]);
    }
    throw new Error(`unexpected url ${url}`);
  };

  const resolver = new VrchatUserResolver();
  resolver.setAuthCookie("auth=authcookie_test");
  const result = await resolver.searchAvatarCandidates("Bonk");

  assert.equal(result.candidates.length, 2);
  assert.notEqual(result.candidates[0].avatarId, result.candidates[1].avatarId);
});

test("searchAvatars supports partial names and authors across authenticated collections", async (t) => {
  const originalFetch = global.fetch;
  const calls = [];
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => {
    const value = String(url);
    calls.push(value);
    if (value.includes("/avatars/favorites")) {
      return responseJson([
        { id: "avtr_11111111-1111-4111-8111-111111111111", name: "Night Shift", authorName: "Alice", releaseStatus: "public" },
        { id: "avtr_22222222-2222-4222-8222-222222222222", name: "Day Shift", authorName: "Bob", releaseStatus: "public" }
      ]);
    }
    if (value.includes("/avatars/licensed")) {
      return responseJson([{ id: "avtr_33333333-3333-4333-8333-333333333333", name: "Studio Model", authorName: "Night Works", releaseStatus: "private" }]);
    }
    if (value.includes("/avatars?")) return responseJson([]);
    throw new Error(`unexpected url ${url}`);
  };

  const resolver = new VrchatUserResolver();
  resolver.setAuthCookie("auth=authcookie_test");
  const result = await resolver.searchAvatars("night");

  assert.deepEqual(result.candidates.map((row) => row.avatarId), [
    "avtr_11111111-1111-4111-8111-111111111111",
    "avtr_33333333-3333-4333-8333-333333333333"
  ]);
  assert.equal(result.candidates[0].canFavorite, true);
  assert.equal(result.candidates[1].canFavorite, false);
  assert.deepEqual(result.scope, ["favorite", "own", "licensed"]);
  const callCount = calls.length;
  await resolver.searchAvatars("night");
  assert.equal(calls.length, callCount);
});

test("favoriteAvatar verifies a public avatar and adds it to the first VRChat avatar list", async (t) => {
  const originalFetch = global.fetch;
  const avatarId = "avtr_44444444-4444-4444-8444-444444444444";
  const calls = [];
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes(`/avatars/${avatarId}`)) {
      return responseJson({ id: avatarId, name: "Public Demo", releaseStatus: "public" });
    }
    if (String(url).endsWith("/favorites") && options.method === "POST") {
      return responseJson({ id: "fvrt_demo", favoriteId: avatarId, type: "avatar", tags: ["avatars1"] });
    }
    throw new Error(`unexpected url ${url}`);
  };

  const resolver = new VrchatUserResolver();
  resolver.setAuthCookie("auth=authcookie_test");
  const result = await resolver.favoriteAvatar(avatarId);

  assert.equal(result.favoriteId, "fvrt_demo");
  assert.equal(result.alreadyFavorite, false);
  const mutation = calls.find((call) => call.options.method === "POST");
  assert.deepEqual(JSON.parse(mutation.options.body), {
    type: "avatar",
    favoriteId: avatarId,
    tags: ["avatars1"]
  });
});

test("fetchPersonalCollection normalizes only the current account collections", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async (url) => {
    const value = String(url);
    if (value.includes("/worlds/favorites")) return responseJson([{ id: "wrld_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Favorite World", occupants: 4 }]);
    if (value.includes("/auth/user/notifications")) return responseJson([{ id: "not_demo", type: "invite", message: "Join", senderUserId: "usr_22222222-2222-4222-8222-222222222222" }]);
    throw new Error(`unexpected url ${url}`);
  };
  const resolver = new VrchatUserResolver();
  resolver.setAuthCookie("auth=authcookie_test");
  const worlds = await resolver.fetchPersonalCollection("favorite-worlds");
  const notifications = await resolver.fetchPersonalCollection("notifications");
  assert.equal(worlds.rows[0].worldName, "Favorite World");
  assert.equal(notifications.rows[0].type, "invite");
  await assert.rejects(() => resolver.fetchPersonalCollection("someone-elses-favorites"), /invalid/u);
});

test("prints use the authenticated account ID and reject foreign owners", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  const ownId = "usr_22222222-2222-4222-8222-222222222222";
  const printId = "prnt_11111111-1111-4111-8111-111111111111";
  const requested = [];
  global.fetch = async (url) => {
    requested.push(String(url));
    if (String(url).endsWith("/auth/user")) return responseJson({ id: ownId });
    if (String(url).endsWith(`/prints/user/${ownId}`)) return responseJson([
      { id: printId, ownerId: ownId, note: "Our evening" },
      { id: printId, ownerId: "usr_someone_else", note: "Private" }
    ]);
    throw new Error("unexpected endpoint");
  };
  const resolver = new VrchatUserResolver(); resolver.setAuthCookie("auth=authcookie_test");
  const prints = await resolver.fetchPersonalCollection("prints");
  assert.equal(prints.rows.length, 1);
  assert.equal(prints.rows[0].name, "Our evening");
  assert.equal(requested.length, 2);
  await resolver.fetchPersonalCollection("prints");
  assert.equal(requested.length, 2);
  resolver.setAuthCookie("auth=authcookie_another");
  await resolver.fetchPersonalCollection("prints");
  assert.equal(requested.length, 4);
});

test("inventory normalizes bounded metadata and does not turn malformed data into an empty success", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async () => responseJson({ data: Array.from({ length: 150 }, () => ({
    id: "inv_11111111-1111-4111-8111-111111111111", name: "Frame", itemType: "iconFrame", privateSecret: "not exported"
  })), totalCount: 500 });
  const resolver = new VrchatUserResolver(); resolver.setAuthCookie("auth=authcookie_test");
  const inventory = await resolver.fetchPersonalCollection("inventory");
  assert.equal(inventory.rows.length, 100);
  assert.equal(inventory.truncated, true);
  assert.equal(inventory.rows[0].itemType, "iconFrame");
  assert.equal(inventory.rows[0].privateSecret, undefined);
  global.fetch = async () => responseJson({ unavailable: true });
  await assert.rejects(() => resolver.fetchPersonalCollection("inventory", { force: true }), /unavailable/u);
});

test("new public profile endpoint remains usable when the legacy profile is unavailable", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  const userId = "usr_22222222-2222-4222-8222-222222222222";
  global.fetch = async (url) => {
    const value = String(url);
    if (value.endsWith(`/profile/${userId}`)) return responseJson({ id: userId, displayName: "Friend", iconFrame: "inv_frame", themeButtonColor: "bb66ff", bannerColor: "red;display:none" });
    if (value.endsWith(`/profile/${userId}/private`)) return responseJson({ id: userId, isFriend: true, activity: { location: "offline" } });
    return responseJson([]);
  };
  const resolver = new VrchatUserResolver(); resolver.setAuthCookie("auth=authcookie_test");
  resolver.fetchUser = async () => { throw new Error("Legacy unavailable"); };
  const profile = await resolver.fetchUserProfile(userId);
  assert.equal(profile.displayName, "Friend");
  assert.equal(profile.isFriend, true);
  assert.equal(profile.cosmetics.iconFrame, "inv_frame");
  assert.equal(profile.cosmetics.themeButtonColor, "#bb66ff");
  assert.equal(profile.cosmetics.bannerColor, undefined);
});

test("group events distinguish unavailable permission from an empty calendar", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  const groupId = "grp_33333333-3333-4333-8333-333333333333";
  global.fetch = async (url) => {
    if (String(url).includes("/calendar/")) return responseJson({ results: [{ id: "cal_11111111-1111-4111-8111-111111111111", title: "Meetup", startsAt: "2026-09-20T18:00:00Z" }], hasNext: true });
    if (String(url).endsWith("/instances")) return responseJson([]);
    return responseJson({ id: groupId, name: "Group" });
  };
  const resolver = new VrchatUserResolver(); resolver.setAuthCookie("auth=authcookie_test");
  const group = await resolver.fetchGroup(groupId);
  assert.equal(group.events[0].title, "Meetup");
  assert.equal(group.eventsUnavailable, false);
  assert.equal(group.eventsTruncated, true);
});

test("profile queue stops retrying HTTP 429 and honors the configured retry limit", async (t) => {
  const originalFetch = global.fetch;
  const userId = "usr_99999999-9999-4999-8999-999999999999";
  let calls = 0;
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async () => {
    calls += 1;
    return {
      ok: false,
      status: 429,
      json: async () => ({}),
      headers: {
        get: (name) => String(name).toLowerCase() === "retry-after" ? "0" : null,
        getSetCookie: () => []
      }
    };
  };

  const resolver = new VrchatUserResolver({ queueIntervalMs: 0, maxRetries: 2, retryBaseDelayMs: 1 });
  const result = await resolver.resolve(userId);

  assert.equal(result, null);
  assert.equal(calls, 3);
});

test("profile cache evicts the least recently used entry at its hard limit", async () => {
  const resolver = new VrchatUserResolver({ queueIntervalMs: 0, profileCacheLimit: 2 });
  resolver.fetchUser = async (userId) => ({ userId, displayName: userId });
  const ids = [
    "usr_11111111-1111-4111-8111-111111111111",
    "usr_22222222-2222-4222-8222-222222222222",
    "usr_33333333-3333-4333-8333-333333333333"
  ];

  for (const userId of ids) await resolver.resolve(userId);

  assert.equal(resolver.cache.size, 2);
  assert.equal(resolver.cache.has(ids[0]), false);
  assert.equal(resolver.cache.has(ids[1]), true);
  assert.equal(resolver.cache.has(ids[2]), true);
});

function responseJson(body, ok = true, status = 200, setCookies = []) {
  return {
    ok,
    status,
    json: async () => body,
    headers: { getSetCookie: () => setCookies }
  };
}
