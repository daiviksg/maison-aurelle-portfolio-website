// 5.2 Display — the sentence pulls itself apart. word-spacing triggers layout, so the
// lines are short and nothing else in this section animates.
import { gsap, MQ } from "../core/timing.js";

export function initSpread() {
  const title = document.querySelector("[data-spread]");
  const section = title.closest("section");
  const mm = gsap.matchMedia();
  mm.add({ desk: MQ.desk, mob: MQ.mob }, (ctx) => {
    gsap.fromTo(title, { wordSpacing: "0rem" }, {
      wordSpacing: ctx.conditions.desk ? "10rem" : "4rem",
      ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
}
