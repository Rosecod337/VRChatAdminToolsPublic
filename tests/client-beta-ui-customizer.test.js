"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { normalizeProfile, PRESETS } = require("../apps/client-beta/renderer/ui-customizer");
const target = "body > main:nth-of-type(1) > h2:nth-of-type(2)";

test("interface profile import rejects executable CSS and bounds resource usage", () => {
  const profile = normalizeProfile({ name: "n".repeat(100), theme: {
    background: "url(https://example.com/tracker)", accent: "#aBc123", font: "__proto__", scale: 500,
  }, elements: {
    "body{color:red}/*": { color: "#ffffff" },
    [target]: { color: "red;display:none", background: "#ffffff", opacity: 0, fontSize: 500, maxWidth: 9000, textAlign: "url(x)", text: "t".repeat(500) },
  } });
  assert.equal(profile.name.length, 60);
  assert.equal(profile.theme.background, undefined);
  assert.equal(profile.theme.font, undefined);
  assert.equal(profile.theme.scale, undefined);
  assert.equal(profile.theme.accent, "#aBc123");
  assert.deepEqual(Object.keys(profile.elements), [target]);
  assert.equal(profile.elements[target].color, undefined);
  assert.equal(profile.elements[target].fontSize, 64);
  assert.equal(profile.elements[target].opacity, 40);
  assert.equal(profile.elements[target].maxWidth, 1600);
  assert.equal(profile.elements[target].textAlign, undefined);
  assert.equal(profile.elements[target].text.length, 200);
  const large = normalizeProfile({ elements: Object.fromEntries(Array.from({ length: 1000 }, (_, i) =>
    [`body > div:nth-of-type(${i+1})`, { radius: 10 }])) });
  assert.equal(Object.keys(large.elements).length, 250);
});

test("built-in appearance presets contain only accepted theme values", () => {
  assert.ok(Object.keys(PRESETS).length >= 4);
  for (const preset of Object.values(PRESETS)) {
    assert.deepEqual(normalizeProfile(preset).theme, preset.theme);
  }
});

test("ready-made themes keep text and accents legible on panels", () => {
  const luminance = (hex) => {
    const [red, green, blue] = hex.slice(1).match(/../gu).map((part) => Number.parseInt(part, 16) / 255)
      .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return red * 0.2126 + green * 0.7152 + blue * 0.0722;
  };
  const contrast = (left, right) => {
    const values = [luminance(left), luminance(right)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };
  for (const [key, preset] of Object.entries(PRESETS)) {
    for (const role of ["text", "muted", "accent"]) {
      assert.ok(contrast(preset.theme[role], preset.theme.surface) >= 4.5, `${key} ${role} is difficult to read`);
    }
  }
});
