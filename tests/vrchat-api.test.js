"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { VrchatUserResolver, normalizeAuthCookie } = require("../apps/client/src/vrchat-api");

test("normalizes a raw Cookie-Editor auth value without reading the browser", () => {
  assert.equal(normalizeAuthCookie("authcookie_example"), "auth=authcookie_example");
  assert.equal(normalizeAuthCookie("auth=authcookie_example"), "auth=authcookie_example");
  assert.equal(normalizeAuthCookie("twoFactorAuth=1; auth=authcookie_example"), "twoFactorAuth=1; auth=authcookie_example");
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

function responseJson(body, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body
  };
}
