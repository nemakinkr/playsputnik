import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const [source, enSource, ruSource] = await Promise.all([
  readFile(new URL("../src/app-i18n.js", import.meta.url), "utf8"),
  readFile(new URL("../src/i18n-en.js", import.meta.url), "utf8"),
  readFile(new URL("../src/i18n-ru.js", import.meta.url), "utf8"),
]);

function boot(savedLocale, navigatorLocale) {
  const storage = new Map([["ps_locale", savedLocale]]);
  const context = {
    window: {},
    navigator: { language: navigatorLocale },
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
    },
    document: {
      documentElement: { setAttribute() {} },
      querySelectorAll: () => [],
    },
    Set,
  };
  vm.runInNewContext(source, context, { filename: "src/app-i18n.js" });
  vm.runInContext(enSource, vm.createContext(context), { filename: "src/i18n-en.js" });
  vm.runInContext(ruSource, context, { filename: "src/i18n-ru.js" });
  return context.window.PlaySputnikI18n;
}

const en = boot("en", "ru-RU");
const ru = boot("ru", "en-US");

assert.equal(en.getLocale(), "en", "saved EN should win before catalogs load");
assert.equal(ru.getLocale(), "ru", "saved RU should win before catalogs load");
assert.equal(ru.atomLabel("story"), "сюжет", "Russian atom labels should be resolved at runtime");
assert.equal(ru.atomLabel("realistic-violence"), "реалистичное насилие", "Taxonomy signals outside atoms should be localized");
assert.equal(ru.atomList(["story", "open-world"], " + "), "сюжет + открытый мир", "Atom lists should preserve the requested separator");
assert.equal(en.atomLabel("story"), "story", "English atom labels should stay natural");

console.log("✅ i18n startup honors saved locale and localizes taxonomy signals");
