// Dome — a sky disc rises over the last screen of the hero dive, carrying its headline on
// its curve, and widens as it comes so its edge flattens into the next ground.
import { gsap, MQ } from "../core/timing.js";

export function initDome() {
  const dome = document.querySelector("[data-dome]");
  const disc = dome.querySelector("[data-dome-disc]");
  const mm = gsap.matchMedia();
  mm.add(MQ.motion, () => {
    gsap.fromTo(disc, { scale: 1, z: 10 }, {
      scale: 1.6,
      ease: "none",
      scrollTrigger: { trigger: dome, start: "top bottom", end: "top top", scrub: true },
    });
  });
}
