// 5.1 Hero — "the dive". Content lifts faster than the background, then the background
// scales 1 → 2 from 50% 75% so it reads as a camera flying in, not a flat zoom.
// Also: a by-day / by-night toggle (clip wipe between two plates) and hotspots.
import { gsap, ScrollTrigger, durS, durL, MQ, reducedMotion } from "../core/timing.js";

export function initHero() {
  const area = document.querySelector("[data-hero-area]");
  const bg = area.querySelector("[data-hero-bg]");
  const content = area.querySelector("[data-hero-content]");
  const img = area.querySelector("[data-hero-img]");
  const hotspots = area.querySelector("[data-hotspots]");
  const cta = area.querySelector("[data-hero-cta]");

  initDayNight(area);

  const build = () => {
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      gsap.set([bg, content], { z: 10 });
      gsap.timeline({
        scrollTrigger: { trigger: area, start: "top top", end: "bottom bottom", scrub: true, invalidateOnRefresh: true },
      })
        .to(content, { y: () => -window.innerHeight * 0.9, duration: durL, ease: "Ease" }, 0)
        .to(bg, { yPercent: -6, duration: durL, ease: "Ease" }, 0)
        .to(bg, { scale: 2, transformOrigin: "50% 75%", duration: durL, ease: "InOut" }, "-=0.2")
        .to(hotspots, { autoAlpha: 0, duration: durS, ease: "In" }, "<");

      // The circular call to action is a control, not type to be scrubbed: it toggles.
      ScrollTrigger.create({ trigger: area, start: "6% top", end: "62% top", toggleClass: { targets: cta, className: "is-visible" } });
    });
  };

  // Offsets must be measured against a decoded image, not a zero-height box.
  img.complete ? build() : img.addEventListener("load", build, { once: true });
}

function initDayNight(area) {
  const night = area.querySelector("[data-hero-night]");
  const group = area.querySelector(".daynight");
  const buttons = group.querySelectorAll("[data-daynight]");

  const set = (mode) => {
    group.dataset.mode = mode;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.daynight === mode)));
    gsap.to(night, {
      clipPath: mode === "night" ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 0% 100%)",
      duration: reducedMotion() ? 0 : durL,
      ease: "InOut",
      overwrite: true,
    });
  };
  buttons.forEach((b) => b.addEventListener("click", () => set(b.dataset.daynight)));
}
