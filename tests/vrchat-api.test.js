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
        displayName: "ExampleUser",
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

function responseJson(body, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body
  };
}
