// QA harness: drives a real (headless) Chrome/Edge through the page, captures frames of the
// preloader and every section, and reports console errors, CLS and LCP.
//   node scripts/qa.mjs [--url=http://localhost:5188] [--w=1440 --h=900] [--rm] [--out=dir] [--repeat]
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d;
const flag = (k) => process.argv.includes(`--${k}`);
const URL = arg("url", "http://localhost:5188/");
const W = +arg("w", 1440), H = +arg("h", 900);
const OUT = arg("out", "qa-shots");
const RM = flag("rm");
const EXE = arg("exe", "C:/Program Files/Google/Chrome/Application/chrome.exe");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await fs.mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: "new",
  args: ["--autoplay-policy=no-user-gesture-required", "--hide-scrollbars=false"],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1, isMobile: W < 768, hasTouch: W < 768 });
if (RM) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);

const logs = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(`${m.type()}: ${m.text()}`); });
page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
page.on("requestfailed", (r) => logs.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));

await page.evaluateOnNewDocument(() => {
  window.__cls = 0; window.__lcp = 0; window.__shifts = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => {
    if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push({ v: e.value, y: Math.round(scrollY), r: e.sources?.slice(0, 1).map((s) => [s.previousRect.y, s.currentRect.y, s.previousRect.height, s.currentRect.height, document.documentElement.scrollHeight, innerHeight]), src: e.sources?.map((s) => (s.node?.className || s.node?.nodeName) + (s.node?.nodeName === '#text' ? ':' + s.node.textContent.slice(0, 18) + '@' + (s.node.parentElement?.className || '') : '')) }); }
  })).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((l) => { const e = l.getEntries().at(-1); window.__lcp = e.startTime; window.__lcpEl = e.element?.outerHTML?.slice(0, 80); })
    .observe({ type: "largest-contentful-paint", buffered: true });
});

const shot = async (name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });
const t0 = Date.now();
await page.goto(URL, { waitUntil: "domcontentloaded" });

if (flag("repeat")) {
  // Second visit in the same session → short loader.
  await page.waitForFunction(() => document.documentElement.classList.contains("is-ready"), { timeout: 20000 });
  await page.reload({ waitUntil: "domcontentloaded" });
}

if (!RM) {
  for (const t of [300, 1100, 1900, 2600, 3200, 3700]) {
    await wait(Math.max(0, t - (Date.now() - t0)));
    await shot(`00-preloader-${t}`);
  }
}
await page.waitForFunction(() => document.documentElement.classList.contains("is-ready"), { timeout: 20000 });
const loadMs = Date.now() - t0;
const lcpAtLoad = await page.evaluate(() => ({ lcp: Math.round(window.__lcp), el: window.__lcpEl, cls: +window.__cls.toFixed(4) }));
await wait(600);

// Positions: [label, selector, fraction through the section's scroll range]
const stops = [
  ["01-hero-top", ".hero", 0], ["02-hero-lift", ".hero", 0.3], ["03-hero-dive", ".hero", 0.62], ["04-dome-rise", ".hero", 0.85],
  ["05-dome", ".dome", 0.35], ["06-spread", ".spread", 0.4], ["07-concept", ".concept", 0.3],
  ["08-quote-a", ".quote", 0.05], ["09-quote-b", ".quote", 0.5], ["10-quote-c", ".quote", 0.97], ["11-place", ".place", 0.35],
  ["12-loc-start", ".location", 0.02], ["13-loc-a", ".location", 0.3], ["14-loc-b", ".location", 0.6], ["15-loc-end", ".location", 0.97],
  ["16-route-a", ".route", 0.35], ["17-route-b", ".route", 0.75], ["18-valley-a", ".valley", 0.02], ["19-valley-b", ".valley", 0.5], ["20-valley-c", ".valley", 0.98],
  ["21-amen-zoom", ".amenities", 0.65], ["22-residences", ".residences", 0.35],
  ["23-arch-open", ".arch", 0.45], ["24-arch-scale", ".arch", 0.9], ["25-interiors", ".interiors", 0.2], ["26-closing", ".closing", 0.3],
  ["27-footer-card", ".footer-spacer", 0.6], ["28-footer-end", ".footer", 1],
];

const report = { viewport: `${W}x${H}`, reducedMotion: RM, loadMs, lcpAtLoad, stops: {} };
for (const [name, sel, f] of stops) {
  const y = await page.evaluate((sel, f) => {
    const el = document.querySelector(sel);
    const top = el.getBoundingClientRect().top + window.scrollY - (document.documentElement.classList.contains("st-refresh") ? 0 : 0);
    // Scroll range of a section: from its top reaching the viewport top to its bottom reaching the viewport bottom.
    const range = el.offsetHeight - innerHeight;
    const target = sel === ".footer"
      ? document.documentElement.scrollHeight - innerHeight - (1 - f) * innerHeight
      : range > 0 ? top + range * f : top - innerHeight * 0.25 + el.offsetHeight * f;
    if (window.__lenis) window.__lenis.scrollTo(target, { immediate: true, force: true });
    else window.scrollTo(0, target);
    return Math.round(target);
  }, sel, f);
  await wait(1500);
  await shot(name);
  report.stops[name] = await page.evaluate(() => ({
    y: Math.round(scrollY),
    progress: getComputedStyle(document.documentElement).getPropertyValue("--progress").trim(),
    counter: document.querySelector("[data-progress-count]")?.textContent,
    theme: document.querySelector(".ui-mark")?.className.match(/theme_on-\w+/)?.[0],
  }));
  report.stops[name].target = y;
}

// Rewind check: scroll back to the top through everything.
await page.evaluate(() => (window.__lenis ? window.__lenis.scrollTo(0, { immediate: true, force: true }) : window.scrollTo(0, 0)));
await wait(1200);
await shot("23-back-top");

// Velocity: real wheel input arms the corner mark.
if (!RM) {
  await page.mouse.move(W / 2, H / 2);
  const speeds = [];
  for (let i = 0; i < 6; i++) { await page.mouse.wheel({ deltaY: 400 }); await wait(60); speeds.push(await page.evaluate(() => Math.round(window.__mark?.state.speed))); }
  for (let i = 0; i < 4; i++) { await page.mouse.wheel({ deltaY: -400 }); await wait(60); speeds.push(await page.evaluate(() => Math.round(window.__mark?.state.speed))); }
  await wait(1600);
  speeds.push(await page.evaluate(() => Math.round(window.__mark?.state.speed)));
  report.markSpeeds = speeds;
}

Object.assign(report, await page.evaluate(() => ({
  cls: +window.__cls.toFixed(4), shifts: Object.entries(window.__shifts.reduce((a, s) => { const k = (s.src || []).join(" | ").slice(0, 60) + " y=" + s.y + " r=" + JSON.stringify(s.r); a[k] = +((a[k] || 0) + s.v).toFixed(4); return a; }, {})).sort((x, y) => y[1] - x[1]).slice(0, 12), lcp: Math.round(window.__lcp), lcpEl: window.__lcpEl,
  h1: document.querySelectorAll("h1").length,
  imgsNoAlt: [...document.querySelectorAll("img:not([alt])")].length,
  lenis: !!window.__lenis,
  visitedFlag: sessionStorage.getItem("hasVisited"),
})));
report.logs = logs;
console.log(JSON.stringify(report, null, 2));
await browser.close();
