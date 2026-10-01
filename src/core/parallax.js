// Five attribute-driven parallax variants. Built inside gsap.matchMedia() so they are
// torn down and rebuilt whenever the viewport crosses the breakpoint.
import { gsap, MQ } from "./timing.js";

const VARIANTS = {
  img:        { from: { yPercent: -15 }, to: { yPercent: 15 },  start: "top bottom",    end: "bottom top",  scrub: 0.5 },
  "img-out":  { from: { yPercent: 0 },   to: { yPercent: 20 },  start: "bottom bottom", end: "bottom top",  scrub: 0.5 },
  "img-in":   { from: { yPercent: -20 }, to: { yPercent: 0 },   start: "top bottom",    end: "bottom bottom", scrub: true },
  "ctn-down": { from: { yPercent: -10 }, to: { yPercent: 10 },  start: "top 125%",      end: "bottom -25%", scrub: 0.5 },
  "ctn-up":   { from: { yPercent: 10 },  to: { yPercent: -10 }, start: "top 125%",      end: "bottom -25%", scrub: 0.5 },
};

export function initParallax() {
  const mm = gsap.matchMedia();
  mm.add({ desk: MQ.desk, mob: MQ.mob }, (ctx) => {
    const { desk } = ctx.conditions;
    document.querySelectorAll("[data-parallax]").forEach((el) => {
      const v = VARIANTS[el.dataset.parallax];
      if (!v) return; // "w" wrappers
      if (desk && el.dataset.desk === "off") return;
      if (!desk && el.dataset.mob === "off") return;
      const trigger = el.closest('[data-parallax="w"]') ?? el;
      gsap.fromTo(el, { ...v.from, z: 10 }, {
        ...v.to,
        z: 10,
        ease: "none",
        scrollTrigger: { trigger, start: v.start, end: v.end, scrub: v.scrub },
      });
    });
  });
  return mm;
}
