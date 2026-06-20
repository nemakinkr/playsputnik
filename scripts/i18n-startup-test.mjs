import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/app-i18n.js", import.meta.url), "utf8");

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
  return context.window.PlaySputnikI18n.getLocale();
}

assert.equal(boot("en", "ru-RU"), "en", "saved EN should win before catalogs load");
assert.equal(boot("ru", "en-US"), "ru", "saved RU should win before catalogs load");

console.log("✅ i18n startup honors saved locale before catalogs load");
