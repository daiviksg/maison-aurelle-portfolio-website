// 5.4 Amenities — zoom-through hand-off. The grid scales 1 → 2 into the pool card while
// the layer carrying it fades 1 → 0 on the same frames, revealing the room beneath.
import { gsap, durS, durM, durL, MQ } from "../core/timing.js";

export function initAmenities() {
  const area = document.querySelector("[data-amen-area]");
  const over = area.querySelector("[data-amen-over]");
  const grid = area.querySelector("[data-amen-grid]");
  const focus = area.querySelector("[data-amen-focus]");

  const mm = gsap.matchMedia();
  mm.add(MQ.desk, () => {
    // Untransformed offsets, so the origin is stable however far the scale has got.
    const origin = () => `${focus.offsetLeft + focus.offsetWidth / 2}px ${focus.offsetTop + focus.offsetHeight / 2}px`;

    gsap.timeline({
      scrollTrigger: { trigger: area, start: "top top", end: "bottom bottom", scrub: true, invalidateOnRefresh: true },
    })
      .to({}, { duration: durM }) // hold: let the grid be read
      .fromTo(grid, { scale: 1, z: 10, transformOrigin: origin }, { scale: 2, duration: durL, ease: "InOut" })
      .fromTo(over, { opacity: 1 }, { opacity: 0, duration: durL, ease: "InOut" }, "<")
      .to({}, { duration: durS }); // hold on the room revealed through it
  });
}
