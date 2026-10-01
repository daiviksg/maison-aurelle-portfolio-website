// 5.6 Footer — the page closes on itself. The page sticks with its bottom edge on the
// viewport's while a spacer scrolls beneath it and its clip scrubs inward to a card; then
// the card scrolls away and the footer rises and scales up after it. Type never scrubs.
import { gsap, ScrollTrigger, BREAKPOINT, MQ } from "../core/timing.js";
import { ctn } from "../core/reveal.js";

export function initFooter() {
  const page = document.querySelector("[data-page-clip]");
  const spacer = document.querySelector("[data-footer]");
  const footer = document.querySelector("[data-footer-block]");
  const inner = footer.querySelector("[data-footer-inner]");
  const texts = footer.querySelectorAll("[data-footer-reveal]");
  const root = document.documentElement;

  const mm = gsap.matchMedia();
  mm.add(MQ.motion, () => {
    let vh = 0, pageH = 0;
    const measure = () => {
      vh = window.innerHeight;
      pageH = page.offsetHeight;
      root.style.setProperty("--page-top", `${vh - pageH}px`);
      page.classList.add("is-measured");
    };
    measure();
    ScrollTrigger.addEventListener("refreshInit", measure);

    // inset() is relative to the page element, which is many viewports tall. Only its
    // last viewport is on screen while it sticks, so offset the top inset by everything
    // above it; the result is the brief's inset(8% 22% 8% 22%) as seen in the viewport.
    // Driven straight from the trigger's live progress (update, refresh and leave-back), so
    // the clip can never be left behind by a stale render — above the spacer it is always off.
    const write = (t) => {
      if (t <= 0) { page.style.clipPath = ""; return; }
      const [y, x] = window.innerWidth >= BREAKPOINT ? [0.08, 22] : [0.04, 32];
      page.style.clipPath = `inset(${(pageH - vh + t * y * vh).toFixed(1)}px ${t * x}% ${(t * y * vh).toFixed(1)}px ${t * x}%)`;
    };

    ScrollTrigger.create({
      trigger: spacer,
      start: "top bottom",
      end: "bottom bottom",
      onUpdate: (self) => write(self.progress),
      onRefresh: (self) => write(self.progress),
      onLeaveBack: () => write(0),
    });

    gsap.fromTo(inner, { opacity: 0, scale: 0.75 }, {
      opacity: 1, scale: 1, z: 10, ease: "none",
      scrollTrigger: {
        trigger: footer, start: "top bottom", end: "top 25%", scrub: true,
        // Once it has fully arrived, drop the transform so the footer sits on whole pixels.
        onLeave: () => gsap.set(inner, { clearProps: "transform" }),
      },
    });

    ctn(texts, "initial");
    ScrollTrigger.create({
      trigger: footer,
      start: "top 70%",
      onEnter: () => ctn(texts, "reveal"),
      onLeaveBack: () => ctn(texts, "hide"),
    });

    return () => {
      ScrollTrigger.removeEventListener("refreshInit", measure);
      page.classList.remove("is-measured");
      page.style.clipPath = "";
    };
  });
}
