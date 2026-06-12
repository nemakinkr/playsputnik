import { createRequire } from "node:module";

const DEFAULT_URL = "http://127.0.0.1:4190/?v=core-journey-smoke";
const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BUNDLED_NODE_MODULES = "/Users/kirillnemakin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const targetUrl = process.argv.find((arg) => arg.startsWith("http://") || arg.startsWith("https://")) || DEFAULT_URL;
const chromePath = process.env.PLAYSPUTNIK_CHROME || DEFAULT_CHROME;

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const bundledRequire = createRequire(`${BUNDLED_NODE_MODULES}/playwright/package.json`);
    return bundledRequire("playwright");
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
});

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.evaluate(() => localStorage.removeItem("playsputnik.prototype.state.v2"));
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(1000);

  for (const reaction of ["loved", "loved", "not_for_me"]) {
    await page.evaluate((value) => {
      document.querySelector(`[data-swipe-reaction="${value}"]`)?.click();
    }, reaction);
    await page.waitForTimeout(350);
  }
  await page.waitForTimeout(900);

  const before = await page.evaluate(() => ({
    journey: Boolean(document.querySelector("[data-first-run-journey]")),
    steps: Array.from(document.querySelectorAll(".first-run-journey-step")).map((element) => ({
      action: element.dataset.firstRunAction,
      title: element.dataset.firstRunTitle,
      text: element.textContent.replace(/\s+/g, " ").trim(),
    })),
    title: document.querySelector(".first-run-copy strong")?.textContent || "",
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }));

  assert(before.journey, "First-run journey rail did not render");
  assert(before.steps.some((step) => step.action === "detail-pick" && step.title), "Journey is missing detail-pick");
  assert(before.steps.some((step) => ["save", "play"].includes(step.action) && step.title), "Journey is missing memory action");
  assert(before.steps.some((step) => step.action === "discover-pick" && step.title), "Journey is missing discover-pick");
  assert(!before.overflow, "Mobile first-run journey creates horizontal overflow");

  await page.evaluate(() => document.querySelector('[data-first-run-action="detail-pick"]')?.click());
  await page.waitForTimeout(500);
  const detail = await page.evaluate(() => ({
    hidden: document.querySelector("#game-detail")?.classList.contains("is-hidden"),
    title: document.querySelector("#game-detail-title")?.textContent || "",
    cockpit: Boolean(document.querySelector("[data-detail-cockpit]")),
  }));
  assert(detail.hidden === false, "Detail drawer did not open from journey");
  assert(detail.cockpit, "Detail cockpit did not render from journey");

  await page.evaluate(() => document.querySelector("[data-detail-close]")?.click());
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('[data-first-run-action="discover-pick"]')?.click());
  await page.waitForTimeout(700);
  const discover = await page.evaluate(() => ({
    active: document.querySelector('[data-app-view="discover"]')?.classList.contains("is-active"),
    query: document.querySelector("#game-search-input")?.value || "",
    rows: document.querySelectorAll(".game-search-row").length,
    focused: document.activeElement?.id || "",
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }));
  assert(discover.active, "Discover tab did not activate from journey");
  assert(discover.query.length >= 2, "Discover search was not prefilled from journey");
  assert(discover.rows > 0, "Discover search did not produce rows");
  assert(!discover.overflow, "Discover journey creates horizontal overflow");
  assert(errors.length === 0, `Browser errors: ${errors.join("; ")}`);

  console.log(JSON.stringify({
    mode: "core-journey-smoke",
    url: targetUrl,
    before,
    detail,
    discover,
    errors,
  }, null, 2));
} finally {
  await browser.close();
}
