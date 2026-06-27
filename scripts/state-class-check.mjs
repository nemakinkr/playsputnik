/* Inert state-class gate (static, no browser).
 *
 * The bug class (we shipped one): an element gets a state class like `is-hidden`
 * via JS or static markup, but NO CSS rule targets it, so the class is inert and
 * does nothing — e.g. `.onboarding-hero.is-hidden` was never declared, so the
 * onboarding hero showed to every seeded user. The runtime hidden-check gate
 * catches `.is-hidden` specifically at render time; this catches the WHOLE class
 * statically and cheaply: any `is-*` / `has-*` class toggled in JS or written in
 * markup must be matched by at least one CSS selector.
 *
 * A legitimately JS-only state class (read for logic, never styled) goes in
 * ALLOWLIST below — deliberately, so adding one is a conscious choice.
 *
 * Usage: node scripts/state-class-check.mjs
 */
import { readFileSync, readdirSync } from "node:fs";

const ALLOWLIST = new Set([
  // JS-only state classes that intentionally have no CSS rule go here.
]);

const jsFiles = ["app.js", ...readdirSync("src").filter((f) => f.endsWith(".js")).map((f) => `src/${f}`)];
const htmlFiles = ["index.html"];
const css = ["foundation", "components", "polish", "themes", "brand"]
  .map((n) => { try { return readFileSync(`styles/${n}.css`, "utf8"); } catch { return ""; } })
  .join("\n");

// Classes the JS toggles, or markup hard-codes.
const used = new Map(); // class -> sample source
const reToggle = /classList\.(?:add|remove|toggle)\(\s*([`'"])((?:is|has)-[a-z0-9-]+)\1/g;
const reClassAttr = /\bclass(?:Name)?\s*[+=]{1,2}\s*[`'"][^`'"]*\b((?:is|has)-[a-z0-9-]+)/g;
const reHtmlClass = /class="[^"]*\b((?:is|has)-[a-z0-9-]+)/g;
for (const f of jsFiles) {
  const s = readFileSync(f, "utf8"); let m;
  while ((m = reToggle.exec(s))) if (!used.has(m[2])) used.set(m[2], f);
  while ((m = reClassAttr.exec(s))) if (!used.has(m[1])) used.set(m[1], f);
}
for (const f of htmlFiles) {
  const s = readFileSync(f, "utf8"); let m;
  while ((m = reHtmlClass.exec(s))) if (!used.has(m[1])) used.set(m[1], f);
}

// Classes the CSS styles (appear in any selector).
const styled = new Set();
let m; const reCss = /\.((?:is|has)-[a-z0-9-]+)/g;
while ((m = reCss.exec(css))) styled.add(m[1]);

const inert = [...used.keys()].filter((c) => !styled.has(c) && !ALLOWLIST.has(c)).sort();

if (inert.length) {
  console.error(`❌ ${inert.length} inert state class(es) — toggled/written but no CSS rule:`);
  inert.forEach((c) => console.error(`   - .${c}   (e.g. ${used.get(c)})`));
  console.error("\nFix: add a CSS rule for it (e.g. `.component.is-x { … }`), or, if it's");
  console.error("intentionally JS-only (read for logic, never styled), add it to ALLOWLIST.");
  process.exit(1);
}
console.log(`✅ State classes OK (${used.size} toggled/written, all matched by CSS)`);
