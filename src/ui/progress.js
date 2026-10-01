// One document-wide ScrollTrigger writes --progress; CSS positions the thumb and clips
// the fill. Dragging maps to a long lenis.scrollTo — a slow camera move, not a jump.
import { ScrollTrigger, gsap, durL } from "../core/timing.js";
import { scrollToTarget } from "../core/scroll.js";

const DRAG_DURATION = 3.2;

export function initProgress() {
  const root = document.documentElement;
  const count = document.querySelector("[data-progress-count]");
  const rail = document.querySelector("[data-progress-rail]");
  const thumb = document.querySelector("[data-progress-thumb]");
  const cue = document.querySelector("[data-scroll-cue]");
  const cueText = cue?.querySelector("[data-cue-text]");
  let atEnd = false;
  if (!rail) return;

  let shown = -1;
  const write = (p) => {
    const pct = p * 100;
    root.style.setProperty("--progress", `${pct.toFixed(2)}%`);
    root.style.setProperty("--progress-n", p.toFixed(4));
    const end = p > 0.97;
    if (cue && end !== atEnd) {
      atEnd = end;
      cue.classList.toggle("is-top", end);
      cueText.textContent = end ? "To top" : "Scroll";
    }
    const n = Math.floor(pct);
    if (n === shown) return;
    shown = n;
    count.textContent = String(n).padStart(2, "0");
    thumb.setAttribute("aria-label", `Page position ${n}%. Drag, or use arrow keys, Home and End.`);
  };

  ScrollTrigger.create({
    trigger: document.documentElement,
    start: 0,
    end: "max",
    onUpdate: (self) => write(self.progress),
    onRefresh: (self) => write(self.progress),
  });

  const max = () => ScrollTrigger.maxScroll(window);
  const goTo = (ratio, duration = DRAG_DURATION) =>
    scrollToTarget(gsap.utils.clamp(0, 1, ratio) * max(), { duration });
  const ratioAt = (clientY) => {
    const r = rail.getBoundingClientRect();
    return (clientY - r.top) / r.height;
  };

  thumb.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    thumb.setPointerCapture(e.pointerId);
    thumb.classList.add("is-dragging");
    const move = (ev) => goTo(ratioAt(ev.clientY));
    const up = () => {
      thumb.classList.remove("is-dragging");
      thumb.removeEventListener("pointermove", move);
      thumb.removeEventListener("pointerup", up);
      thumb.removeEventListener("pointercancel", up);
    };
    thumb.addEventListener("pointermove", move);
    thumb.addEventListener("pointerup", up);
    thumb.addEventListener("pointercancel", up);
  });

  rail.addEventListener("pointerdown", (e) => {
    if (e.target === thumb) return;
    goTo(ratioAt(e.clientY));
  });

  // Scroll cue: one screen further, or all the way back once the page has ended.
  cue?.addEventListener("click", () => {
    if (atEnd) goTo(0, DRAG_DURATION);
    else scrollToTarget(window.scrollY + window.innerHeight, { duration: durL });
  });

  thumb.addEventListener("keydown", (e) => {
    const p = window.scrollY / max();
    const step = { ArrowDown: 0.05, ArrowRight: 0.05, ArrowUp: -0.05, ArrowLeft: -0.05, PageDown: 0.15, PageUp: -0.15 }[e.key];
    if (step !== undefined) goTo(p + step, durL);
    else if (e.key === "Home") goTo(0, durL);
    else if (e.key === "End") goTo(1, durL);
    else return;
    e.preventDefault();
  });
}
