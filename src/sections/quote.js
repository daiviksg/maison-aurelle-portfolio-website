// Quote — the photograph rises out of the sky through a bottom-anchored window that
// opens to full bleed; only then do the architects' words arrive (type never scrubs).
import { gsap, ScrollTrigger, durL, MQ } from "../core/timing.js";
import { p, ctn } from "../core/reveal.js";

export function initQuote() {
  const area = document.querySelector("[data-quote-area]");
  const media = area.querySelector("[data-quote-media]");
  const img = area.querySelector("[data-quote-img]");
  const mark = area.querySelector(".quote__mark");
  const lines = area.querySelector("[data-quote-lines]");
  const cite = area.querySelector("[data-quote-cite]");

  const mm = gsap.matchMedia();
  mm.add({ desk: MQ.desk, mob: MQ.mob }, (ctx) => {
    const window_ = ctx.conditions.desk ? "inset(46% 20% 0% 20%)" : "inset(55% 6% 0% 6%)";
    gsap.timeline({ scrollTrigger: { trigger: area, start: "top top", end: "bottom bottom", scrub: true } })
      .fromTo(media, { clipPath: window_ }, { clipPath: "inset(0% 0% 0% 0%)", duration: durL, ease: "InOut" }, 0)
      .fromTo(img, { scale: 1.25, z: 10 }, { scale: 1, duration: durL, ease: "InOut" }, 0);

    p(lines, "initial");
    ctn([mark, cite], "initial");
    ScrollTrigger.create({
      trigger: area,
      start: "55% bottom",
      onEnter: () => { ctn(mark, "reveal"); p(lines, "reveal", 0.1); ctn(cite, "reveal", 0.5); },
      onLeaveBack: () => { p(lines, "hide"); ctn([mark, cite], "hide"); },
    });
  });
}
