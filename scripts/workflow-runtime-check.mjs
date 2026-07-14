import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const WORKFLOW_DIR = new URL("../.github/workflows/", import.meta.url);
const requiredMajors = new Map([
  ["actions/checkout", 6],
  ["actions/setup-node", 6],
  ["actions/configure-pages", 6],
  ["actions/upload-pages-artifact", 5],
  ["actions/deploy-pages", 5],
]);

const files = (await readdir(WORKFLOW_DIR)).filter((name) => /\.ya?ml$/i.test(name));
const violations = [];
const seen = new Map([...requiredMajors.keys()].map((action) => [action, 0]));

for (const file of files) {
  const source = await readFile(new URL(file, WORKFLOW_DIR), "utf8");
  for (const match of source.matchAll(/uses:\s*(actions\/[a-z-]+)@v(\d+)/g)) {
    const [, action, majorText] = match;
    if (!requiredMajors.has(action)) continue;
    seen.set(action, seen.get(action) + 1);
    const expected = requiredMajors.get(action);
    const actual = Number(majorText);
    if (actual !== expected) violations.push(`${file}: ${action}@v${actual}, expected @v${expected}`);
  }
  if (/node-version:\s*["']?20(?:[."']|\s|$)/m.test(source)) {
    violations.push(`${file}: node-version 20 is deprecated; use 24`);
  }
}

for (const [action, count] of seen) {
  assert(count > 0, `Expected at least one workflow to use ${action}`);
}
assert.equal(violations.length, 0, `Workflow runtime policy failed:\n- ${violations.join("\n- ")}`);

console.log(`✅ Workflow runtime policy: ${files.length} workflows use Node.js 24-compatible official actions`);
