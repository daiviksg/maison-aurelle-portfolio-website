import Lenis from "lenis";
import { gsap, ScrollTrigger, reducedMotion } from "./timing.js";

export let lenis = null;

export function initSmoothScroll() {
  if (reducedMotion()) return null; // native scroll, nothing smoothed

  lenis = new Lenis({
    wrapper: window,
    duration: 1.2,
    smoothWheel: true,
    touchMultiplier: 2,
    // syncTouch stays off: native momentum scrolling on touch devices.
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });
  lenis.on("scroll", ScrollTrigger.update);      // ScrollTrigger reads Lenis, not native scroll
  gsap.ticker.add((t) => lenis.raf(t * 1000));   // one rAF loop for the whole site
  gsap.ticker.lagSmoothing(0);                   // REQUIRED — or scrubs desync after a dropped frame

  window.__lenis = lenis; // handy for debugging in devtools
  return lenis;
}

// Scroll lock that doesn't shift layout: the scrollbar's width is measured into a
// custom property and replaced by body padding (see base.css).
let lockCount = 0;
export function lockScroll() {
  if (lockCount++ > 0) return;
  const root = document.documentElement;
  const w = window.innerWidth - root.clientWidth;
  root.style.setProperty("--scrollbar-w", `${w}px`);
  root.classList.add("is-locked");
  lenis?.stop();
}
export function unlockScroll() {
  if (--lockCount > 0) return;
  lockCount = 0;
  const root = document.documentElement;
  root.classList.remove("is-locked");
  root.style.setProperty("--scrollbar-w", "0px");
  lenis?.start();
}

export function scrollToTarget(target, opts = {}) {
  if (lenis) lenis.scrollTo(target, opts);
  else if (typeof target === "number") window.scrollTo({ top: target });
  else (typeof target === "string" ? document.querySelector(target) : target)?.scrollIntoView();
}
