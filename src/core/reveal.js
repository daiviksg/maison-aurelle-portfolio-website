// Six reveal primitives, three states, one attribute.
//   primitive(elements, state, delay)   state: "reveal" | "hide" | "initial"
// Markup opts in with data-reveal="a|h|p|ctn|line|slide"; [data-reveal="w"] groups
// everything inside it under one ScrollTrigger so siblings stagger together.
// Every reveal has a mirrored, faster exit, so scrolling back up rewinds rather than re-triggers.
import { gsap, SplitText, ScrollTrigger, durS, durL, stagger, reducedMotion } from "./timing.js";

const charStagger = stagger / 4;

const DEF = {
  a: {
    split: { type: "words,chars", wordsClass: "split-word" },
    pick: (s) => s.chars,
    from: { opacity: 0, rotateX: 90, x: "10rem", transformOrigin: "50% 100%" },
    to: { opacity: 1, rotateX: 0, x: 0, transformOrigin: "50% 100%" },
    hide: { opacity: 0, rotateX: -90, x: "-10rem", transformOrigin: "50% 0%" },
    each: charStagger,
  },
  h: {
    split: { type: "words,chars", wordsClass: "split-word" },
    pick: (s) => s.chars,
    from: { opacity: 0, yPercent: 50, rotateY: 90 },
    to: { opacity: 1, yPercent: 0, rotateY: 0 },
    hide: { opacity: 0, yPercent: -50, rotateY: -90 },
    each: charStagger,
  },
  p: {
    split: { type: "lines,words", mask: "lines", linesClass: "split-line", autoSplit: true },
    pick: (s) => s.lines,
    from: { yPercent: 110 },
    to: { yPercent: 0 },
    hide: { yPercent: -110 },
    each: stagger,
  },
  ctn: {
    from: { opacity: 0, y: "3.33rem" },
    to: { opacity: 1, y: 0 },
    hide: { opacity: 0 },
    each: stagger,
  },
  line: {
    from: { clipPath: "inset(0% 0% 100% 0%)" },
    to: { clipPath: "inset(0% 0% 0% 0%)" },
    hide: { clipPath: "inset(100% 0% 0% 0%)" },
    each: stagger,
  },
  slide: {
    from: { clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" },
    to: { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" },
    hide: { clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)" },
    child: {
      from: { scale: 1.5, xPercent: 25 },
      to: { scale: 1, xPercent: 0 },
      hide: { scale: 1, xPercent: -25 },
    },
    each: stagger,
  },
};

function targets(el, type) {
  const def = DEF[type];
  if (!def.split) return [el];
  if (!el._split) {
    el._split = SplitText.create(el, {
      ...def.split,
      aria: "auto", // aria-label on the element, aria-hidden on every generated span
      onSplit(self) {
        el._split = self;
        const t = def.pick(self);
        gsap.set(t, { transformPerspective: 800, force3D: true });
        // Re-apply whatever state the element is in, so a resize re-split never flashes.
        const state = el._rstate ?? "initial";
        gsap.set(t, state === "reveal" ? def.to : state === "hide" ? def.hide : def.from);
      },
    });
  }
  return def.pick(el._split);
}

function run(type, els, state = "reveal", delay = 0) {
  const def = DEF[type];
  const list = gsap.utils.toArray(els);
  const instant = reducedMotion();
  const tl = gsap.timeline({ delay: instant ? 0 : delay });

  list.forEach((el, i) => {
    const t = targets(el, type);
    const child = def.child && el.firstElementChild;
    const at = i * stagger;
    el._rstate = state;

    if (state === "initial") {
      gsap.set(t, def.from);
      if (child) gsap.set(child, { ...def.child.from, z: 10 });
      return;
    }
    const reveal = state === "reveal";
    const vars = {
      duration: instant ? 0 : reveal ? durL : durS,
      ease: reveal ? "Out" : "In",
      stagger: instant ? 0 : reveal ? def.each : def.each / 2,
      overwrite: "auto",
    };
    if (reveal) tl.fromTo(t, { ...def.from }, { ...def.to, ...vars }, at);
    else tl.to(t, { ...def.hide, ...vars }, 0);

    if (child) {
      if (reveal) tl.fromTo(child, { ...def.child.from }, { ...def.child.to, ...vars }, at);
      else tl.to(child, { ...def.child.hide, ...vars }, 0);
    }
  });
  return tl;
}

// The six primitives — exactly this signature.
export const a = (els, state, delay) => run("a", els, state, delay);
export const h = (els, state, delay) => run("h", els, state, delay);
export const p = (els, state, delay) => run("p", els, state, delay);
export const ctn = (els, state, delay) => run("ctn", els, state, delay);
export const line = (els, state, delay) => run("line", els, state, delay);
export const slide = (els, state, delay) => run("slide", els, state, delay);
export const primitives = { a, h, p, ctn, line, slide };

// ── Groups ────────────────────────────────────────────────────────────────────

const selector = '[data-reveal]:not([data-reveal="w"])';

// Cap the stagger in lists: in each run of [data-reveal-first] siblings, only the first animates.
function capLists(root) {
  const byParent = new Map();
  root.querySelectorAll("[data-reveal-first]").forEach((el) => {
    const list = byParent.get(el.parentElement) ?? [];
    list.push(el);
    byParent.set(el.parentElement, list);
  });
  byParent.forEach((list) => list.slice(1).forEach((el) => el.removeAttribute("data-reveal")));
}

function groupsIn(root, { local = false } = {}) {
  const groups = new Map();
  root.querySelectorAll(selector).forEach((el) => {
    if (!local && el.closest("[data-reveal-scope]")) return; // owned by a section (e.g. horizontal track)
    const wrapper = el.parentElement.closest('[data-reveal="w"]') ?? el;
    const list = groups.get(wrapper) ?? [];
    list.push(el);
    groups.set(wrapper, list);
  });
  return groups;
}

export function playGroup(els, state, delay = 0) {
  els.forEach((el, i) => primitives[el.dataset.reveal]?.(el, state, delay + (state === "reveal" ? i * stagger : 0)));
}

// Split and park every reveal in its hidden state. Only called once JS is confirmed
// running and motion is allowed — otherwise nothing is ever hidden.
export function prepareReveals(root = document) {
  if (reducedMotion()) return;
  capLists(root);
  root.querySelectorAll(selector).forEach((el) => primitives[el.dataset.reveal]?.(el, "initial"));
}

// One ScrollTrigger per group (once: true, kills itself after firing), plus a light
// listener that plays the mirrored exit when you scroll back above it and re-plays
// the entrance when you come back down.
export function createRevealTriggers(root = document, opts = {}) {
  if (reducedMotion()) return;
  const { containerAnimation, start = containerAnimation ? "left bottom" : "top 85%", local = false } = opts;

  groupsIn(root, { local }).forEach((els, wrapper) => {
    ScrollTrigger.create({
      trigger: wrapper,
      start,
      containerAnimation,
      once: true,
      onEnter: () => playGroup(els, "reveal"),
    });
    ScrollTrigger.create({
      trigger: wrapper,
      start,
      end: containerAnimation ? "right left" : "max",
      containerAnimation,
      onEnter: () => els[0]._rstate === "hide" && playGroup(els, "reveal"),
      onLeaveBack: () => playGroup(els, "hide"),
    });
  });
}

// Final state immediately — used by the reduced-motion branch and as a safety net.
export function revealAllNow(root = document) {
  root.querySelectorAll(selector).forEach((el) => {
    if (el._split) el._split.revert();
    gsap.set(el, { clearProps: "opacity,transform,clipPath" });
    if (el.firstElementChild) gsap.set(el.firstElementChild, { clearProps: "transform" });
  });
}
