// Valley — the page's paper dissolves into cloud, the cloud banks part to either side and
// lift away, and the country behind the lake settles from 1.3 to 1.
import { gsap, durS, durL, MQ } from "../core/timing.js";

export function initValley() {
  const area = document.querySelector("[data-valley-area]");
  const img = area.querySelector("[data-valley-img]");
  const veil = area.querySelector("[data-valley-veil]");
  const [left, right, top] = ["l", "r", "t"].map((k) => area.querySelector(`[data-cloud="${k}"]`));

  const mm = gsap.matchMedia();
  mm.add(MQ.motion, () => {
    gsap.set([img, left, right, top], { z: 10 });
    gsap.timeline({ scrollTrigger: { trigger: area, start: "top top", end: "bottom bottom", scrub: true } })
      .fromTo(veil, { opacity: 1 }, { opacity: 0, duration: durS, ease: "Ease" }, 0)
      .fromTo(left, { xPercent: 42, scale: 1.25 }, { xPercent: -30, scale: 1, duration: durL, ease: "InOut" }, 0)
      .fromTo(right, { xPercent: -42, scale: 1.25 }, { xPercent: 30, scale: 1, duration: durL, ease: "InOut" }, 0)
      .fromTo(top, { yPercent: 40 }, { yPercent: -30, autoAlpha: 0, duration: durL, ease: "InOut" }, 0)
      .fromTo(img, { scale: 1.3 }, { scale: 1, duration: durL, ease: "InOut" }, 0);
  });
}
