// Plum curtain → framed lockup assembles → watermark → the vertical line loads on an
// irregular ease → the arch opens, widens and dives off the top while the hero resolves
// from 0.75 to 1 on the same frames. A repeat visit in the same session plays only the dive.
import { gsap, durS, durM, durL, stagger, reducedMotion } from "../core/timing.js";
import { a, ctn } from "../core/reveal.js";
import { lockScroll, unlockScroll, lenis } from "../core/scroll.js";

const visitedKey = "hasVisited";
const hasVisited = () => { try { return sessionStorage.getItem(visitedKey) === "1"; } catch { return false; } };
const markVisited = () => { try { sessionStorage.setItem(visitedKey, "1"); } catch { /* private mode */ } };

export function runPreloader({ ready, fontsReady = Promise.resolve(), onDive }) {
  const el = document.querySelector("[data-preloader]");
  const frame = document.querySelector("[data-hero-frame]");

  if (!el || reducedMotion()) {
    el?.remove();
    onDive?.();
    return Promise.resolve();
  }

  lockScroll();
  const repeat = hasVisited();
  const q = (s) => el.querySelector(s);
  const name = q("[data-pl-name]");
  const script = q("[data-pl-script]");
  const sides = el.querySelectorAll("[data-pl-side]");
  const sub = q("[data-pl-sub]");
  const glyph = q("[data-pl-glyph]");
  const border = q("[data-pl-frame]");
  const watermark = q("[data-pl-watermark]");
  const bar = q("[data-pl-bar]");
  const lineEl = bar.parentElement;
  const outlines = el.querySelectorAll(".preloader__arch");
  const quiet = [glyph, script, watermark, border, lineEl, ...sides, sub];

  // The hero waits, pre-shrunk, under the curtain.
  gsap.set(frame, { scale: 0.75, transformOrigin: "center top", z: 10 });

  return new Promise((resolve) => {
    const finish = () => {
      el.style.display = "none";
      el.setAttribute("hidden", "");
      // The curtain always lifts on the first frame, whatever the browser tried to restore.
      window.scrollTo(0, 0);
      lenis?.scrollTo(0, { immediate: true, force: true });
      unlockScroll();
      markVisited();
      resolve();
    };

    const dive = () => {
      const tl = gsap.timeline({ onComplete: finish });
      tl.addLabel("dive")
        .add(() => onDive?.(), "dive")
        .to(el, { "--arch-w": "125vw", "--arch-s": 125 / 36, "--arch-y": "-100vh", duration: durL, ease: "diveIn" }, "dive")
        .to(frame, { scale: 1, duration: durL, ease: "diveIn" }, "<") // one camera move, not two effects
        .to(outlines, { opacity: 0, duration: durS, ease: "In" }, "<");
      return tl;
    };

    if (repeat) {
      // Short path: the window is already arch-wide, just below the fold — it only dives.
      gsap.set(el, { "--arch-w": "36vw", "--arch-s": 1, "--arch-y": "104vh" });
      gsap.set([name, ...quiet], { autoAlpha: 0 });
      ready.then(dive);
      return;
    }

    gsap.set(el, { "--arch-w": "24vw", "--arch-s": 24 / 36, "--arch-y": "104vh" });
    a(name, "initial");
    ctn([...sides, sub], "initial");
    gsap.set(glyph, { clipPath: "inset(100% 0% 0% 0%)" });
    gsap.set(script, { clipPath: "inset(0% 100% 0% 0%)" });
    gsap.set([watermark, border], { autoAlpha: 0 });

    const intro = gsap.timeline({ paused: true });
    fontsReady.then(() => intro.play()); // assemble the lockup in its real face, not a fallback
    intro
      .to(border, { autoAlpha: 1, duration: durL, ease: "Ease" }, 0)
      .to(glyph, { clipPath: "inset(0% 0% 0% 0%)", duration: durM, ease: "Out" }, 0)
      .add(a(name, "reveal"), stagger * 2)
      .to(script, { clipPath: "inset(0% 0% 0% 0%)", duration: durL, ease: "InOut" }, durM)
      .add(ctn(sides, "reveal"), durM)
      .add(ctn(sub, "reveal"), durM + stagger * 2)
      .to(watermark, { autoAlpha: 1, duration: durL, ease: "Ease" }, durS)
      .to(bar, { scaleY: 1, duration: durL, ease: "loadBar" }, durM);

    // Hold on a full line until the page is actually measured and the hero decoded.
    Promise.all([ready, new Promise((r) => intro.eventCallback("onComplete", r))]).then(() => {
      const out = gsap.timeline({ onComplete: () => dive() });
      out
        .add(a(name, "hide"), 0)
        .add(ctn([...sides, sub], "hide"), 0)
        .to([glyph, script, watermark, border, lineEl], { autoAlpha: 0, duration: durS, ease: "In" }, 0)
        .to(el, { "--arch-w": "36vw", "--arch-s": 1, "--arch-y": "15vh", duration: durL, ease: "InOut" }, durS);
    });
  });
}
