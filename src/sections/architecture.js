// 5.5 Architecture — clip-path curtains as a camera. Two halves open a multi-point
// aperture, then the whole frame scales 1 → 1.84 while the motifs push outward and the
// next section scales 0.75 → 1 from its top to meet it. Percentages throughout, so it is
// resolution independent. Most paint-expensive section: nothing else animates here.
import { gsap, durL, MQ } from "../core/timing.js";

// Six points each: a narrow pointed slit at the seam → the full half-frame.
const L = {
  closed: "polygon(50% 30%, 46% 38%, 46% 70%, 50% 70%, 50% 70%, 50% 30%)",
  open:   "polygon(50% 0%, 0% 0%, 0% 100%, 50% 100%, 50% 100%, 50% 0%)",
};
const R = {
  closed: "polygon(50% 30%, 54% 38%, 54% 70%, 50% 70%, 50% 70%, 50% 30%)",
  open:   "polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%, 50% 100%, 50% 0%)",
};

export function initArchitecture() {
  const area = document.querySelector("[data-arch-area]");
  const frame = area.querySelector("[data-arch-frame]");
  const halfL = area.querySelector('[data-arch-half="l"]');
  const halfR = area.querySelector('[data-arch-half="r"]');
  const motifL = area.querySelector('[data-arch-motif="l"]');
  const motifR = area.querySelector('[data-arch-motif="r"]');
  const next = document.querySelector("[data-arch-next]");

  const mm = gsap.matchMedia();
  mm.add(MQ.desk, () => {
    gsap.set([frame, next], { z: 10 });

    gsap.timeline({ scrollTrigger: { trigger: area, start: "top top", end: "bottom bottom", scrub: true } })
      .fromTo(halfL, { clipPath: L.closed }, { clipPath: L.open, duration: durL, ease: "InOut" }, 0)
      .fromTo(halfR, { clipPath: R.closed }, { clipPath: R.open, duration: durL, ease: "InOut" }, 0)
      .fromTo(frame, { scale: 1 }, { scale: 1.84, duration: durL, ease: "In" })
      .fromTo(motifL, { xPercent: 0 }, { xPercent: -50, duration: durL, ease: "In" }, "<")
      .fromTo(motifR, { xPercent: 0 }, { xPercent: 50, duration: durL, ease: "In" }, "<");

    gsap.fromTo(next, { scale: 0.75 }, {
      scale: 1,
      transformOrigin: "center top",
      ease: "none",
      scrollTrigger: { trigger: next, start: "top bottom", end: "top top", scrub: true },
    });
  });
}
