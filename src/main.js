import { gsap, ScrollTrigger, durL, reducedMotion } from "./core/timing.js";
import { initSmoothScroll, scrollToTarget } from "./core/scroll.js";
import { initTheme } from "./core/theme.js";
import { prepareReveals, createRevealTriggers, revealAllNow } from "./core/reveal.js";
import { initParallax } from "./core/parallax.js";
import { initVideos } from "./core/video.js";
import { initCornerMark } from "./ui/corner-mark.js";
import { initProgress } from "./ui/progress.js";
import { runPreloader } from "./ui/preloader.js";
import { initHero } from "./sections/hero.js";
import { initDome } from "./sections/dome.js";
import { initSlider } from "./sections/slider.js";
import { initQuote } from "./sections/quote.js";
import { initRoute } from "./sections/route.js";
import { initValley } from "./sections/valley.js";
import { initSpread } from "./sections/spread.js";
import { initLocation } from "./sections/location.js";
import { initAmenities } from "./sections/amenities.js";
import { initResidences } from "./sections/residences.js";
import { initArchitecture } from "./sections/architecture.js";
import { initFooter } from "./sections/footer.js";

const root = document.documentElement;
if (import.meta.env.DEV) Object.assign(window, { gsap, ScrollTrigger });

// JS is confirmed running: cancel the no-JS watchdog set inline in <head>.
clearTimeout(window.__bootWatchdog);
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

// Release every sticky layer while ScrollTrigger measures (see layout.css).
ScrollTrigger.addEventListener("refreshInit", () => root.classList.add("st-refresh"));
ScrollTrigger.addEventListener("refresh", () => root.classList.remove("st-refresh"));
ScrollTrigger.config({ ignoreMobileResize: true });

function heroDecoded() {
  const img = document.querySelector("[data-hero-img]");
  if (!img) return Promise.resolve();
  const loaded = img.complete ? Promise.resolve() : new Promise((r) => img.addEventListener("load", r, { once: true }));
  return loaded.then(() => img.decode?.()).catch(() => {});
}

function bindAnchors() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains("skip-link")) return;
    const target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    scrollToTarget(target, { duration: durL * 2 });
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });
}

async function boot() {
  const lenis = initSmoothScroll();

  // Hide reveals now (JS confirmed, motion allowed) — the curtain is already down.
  prepareReveals();

  initTheme();
  initProgress();
  initCornerMark(lenis);
  initHero();
  initDome();
  initSpread();
  initSlider();
  initQuote();
  initLocation();
  initRoute();
  initValley();
  initAmenities();
  initResidences();
  initArchitecture();
  initFooter();
  initParallax();
  initVideos();
  bindAnchors();

  // Web fonts gate the type (never for long: a slow font network gives up after 2.5s).
  const fontsReady = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 2500))])
    .then(() => root.classList.add("fonts-ready"));
  const ready = Promise.all([fontsReady, heroDecoded()]).then(() => ScrollTrigger.refresh());

  await runPreloader({
    ready,
    fontsReady,
    onDive: () => createRevealTriggers(), // hero copy assembles as the arch dives away
  });

  root.classList.add("is-ready");
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}

boot().catch((err) => {
  // Never leave content parked invisible: show everything and hand scroll back.
  console.error(err);
  revealAllNow();
  document.querySelector("[data-preloader]")?.remove();
  root.classList.remove("is-locked");
  gsap.globalTimeline.clear();
});

if (reducedMotion()) root.classList.add("reduced-motion");
