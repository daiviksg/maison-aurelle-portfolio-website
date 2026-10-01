// Interaction QA: keyboard pass, tabs, dialog, scroll lock, and resizing across the breakpoint.
//   node scripts/qa-interact.mjs [--url=http://localhost:5188]
import puppeteer from "puppeteer-core";

const URL = process.argv.find((a) => a.startsWith("--url="))?.split("=")[1] ?? "http://localhost:5188/";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const logs = [];
page.on("console", (m) => ["error", "warning"].includes(m.type()) && logs.push(m.text()));
page.on("pageerror", (e) => logs.push("pageerror: " + e.message));

await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.documentElement.classList.contains("is-ready"), { timeout: 20000 });
await wait(500);
const out = {};

// 1. Keyboard: tab through every control, record each one and whether a focus ring shows.
const focusables = [];
for (let i = 0; i < 40; i++) {
  await page.keyboard.press("Tab");
  const f = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    return { tag: el.tagName, text: (el.getAttribute("aria-label") || el.textContent).trim().slice(0, 40), ring: cs.outlineStyle !== "none" && cs.outlineWidth !== "0px", visible: el.getBoundingClientRect().width > 0 };
  });
  if (!f) break;
  if (focusables.length && focusables[0].text === f.text && focusables[0].tag === f.tag) break;
  focusables.push(f);
}
out.keyboard = { count: focusables.length, allRings: focusables.every((f) => f.ring), noRing: focusables.filter((f) => !f.ring), list: focusables.map((f) => `${f.tag}:${f.text}`) };

// 2. Tabs: arrow keys move selection and focus.
await page.focus("#tab-shore");
await page.keyboard.press("ArrowRight");
const t1 = await page.evaluate(() => ({ focus: document.activeElement.id, selected: document.querySelector('[aria-selected="true"]').id, gardenVisible: !document.getElementById("panel-garden").hidden, shoreHidden: document.getElementById("panel-shore").hidden }));
await page.keyboard.press("End");
const t2 = await page.evaluate(() => document.querySelector('[aria-selected="true"]').id);
await page.keyboard.press("ArrowRight"); // wraps
const t3 = await page.evaluate(() => document.querySelector('[aria-selected="true"]').id);
out.tabs = { afterRight: t1, afterEnd: t2, wrap: t3 };

// 3. Dialog: open via keyboard, lock scroll without layout jump, Esc closes, focus returns.
await page.focus('[data-modal-open="plans"]');
const beforeW = await page.evaluate(() => document.querySelector("main").getBoundingClientRect().width);
await page.keyboard.press("Enter");
await wait(300);
const open = await page.evaluate(() => ({
  open: document.getElementById("plans").open,
  expanded: document.querySelector('[data-modal-open="plans"]').getAttribute("aria-expanded"),
  locked: document.documentElement.classList.contains("is-locked"),
  scrollbarW: getComputedStyle(document.documentElement).getPropertyValue("--scrollbar-w"),
  mainW: document.querySelector("main").getBoundingClientRect().width,
  focusInDialog: document.getElementById("plans").contains(document.activeElement),
  svg: !!document.querySelector("[data-plans] svg"),
}));
await page.keyboard.press("Escape");
await wait(300);
const closed = await page.evaluate(() => ({
  open: document.getElementById("plans").open,
  expanded: document.querySelector('[data-modal-open="plans"]').getAttribute("aria-expanded"),
  locked: document.documentElement.classList.contains("is-locked"),
  focusBack: document.activeElement.matches('[data-modal-open="plans"]'),
}));
out.dialog = { beforeW, open, closed };

// 4. Space / PageDown / End still scroll natively (through Lenis).
await page.evaluate(() => document.activeElement.blur());
await page.evaluate(() => window.__lenis.scrollTo(0, { immediate: true }));
await wait(300);
await page.keyboard.press("PageDown"); await wait(1500);
const afterPgDn = await page.evaluate(() => Math.round(scrollY));
await page.keyboard.press("Space"); await wait(1500);
const afterSpace = await page.evaluate(() => Math.round(scrollY));
await page.keyboard.press("End"); await wait(2500);
const afterEnd = await page.evaluate(() => ({ y: Math.round(scrollY), max: document.documentElement.scrollHeight - innerHeight }));
await page.keyboard.press("Home"); await wait(2500);
const afterHome = await page.evaluate(() => Math.round(scrollY));
out.keys = { afterPgDn, afterSpace, afterEnd, afterHome };

// 5. Resize mid-page across the breakpoint and back.
await page.evaluate(() => window.__lenis.scrollTo(document.querySelector(".place").offsetTop, { immediate: true }));
await wait(600);
const snap = () => page.evaluate(() => ({
  w: innerWidth,
  locH: document.querySelector("[data-loc-area]").style.height || "auto",
  trackX: getComputedStyle(document.querySelector("[data-loc-track]")).transform,
  lines: document.querySelectorAll(".place .split-line").length,
  lineWidths: [...document.querySelectorAll(".place__statement .split-line")].map((l) => Math.round(l.getBoundingClientRect().width)).slice(0, 3),
  parallaxZ: getComputedStyle(document.querySelector('[data-parallax="ctn-down"]')).transform !== "none",
  amenScale: getComputedStyle(document.querySelector("[data-amen-grid]")).transform,
  triggers: window.ScrollTrigger?.getAll().length,
}));
const desk1 = await snap();
await page.setViewport({ width: 800, height: 900 }); await wait(1500);
const mob = await snap();
await page.setViewport({ width: 1440, height: 900 }); await wait(1500);
const desk2 = await snap();
out.resize = { desk1, mob, desk2 };

out.logs = logs;
console.log(JSON.stringify(out, null, 1));
await browser.close();
