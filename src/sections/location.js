// 5.3 Location — horizontal scroll, desktop only. The wrapper's height is set from the
// track's width, so vertical and horizontal distance are 1:1 by construction.
import { gsap, ScrollTrigger, MQ, durM } from "../core/timing.js";
import { scrollToTarget } from "../core/scroll.js";
import { createRevealTriggers } from "../core/reveal.js";
import { bindVideo } from "../core/video.js";

export function initLocation() {
  const area = document.querySelector("[data-loc-area]");
  const track = area.querySelector("[data-loc-track]");
  const lines = track.querySelectorAll("[data-drift]");
  const wipes = track.querySelectorAll("[data-wipe]");
  const video = track.querySelector("[data-video]");

  const mm = gsap.matchMedia();
  mm.add({ desk: MQ.desk, mob: MQ.mob }, (ctx) => {
    if (!ctx.conditions.desk) {
      createRevealTriggers(track, { local: true });
      if (video) bindVideo(video);
      return;
    }

    const setHeight = () => { area.style.height = `${track.scrollWidth}px`; };
    setHeight();
    ScrollTrigger.addEventListener("refreshInit", setHeight);
    ScrollTrigger.refresh();

    const tween = gsap.to(track, {
      x: () => -(track.scrollWidth - area.offsetWidth),
      ease: "horScroll",
      scrollTrigger: { trigger: area, start: "2.5% top", end: "97.5% bottom", scrub: 0.25, invalidateOnRefresh: true },
    });
    area._horizontalTween = tween;

    // Title lines counter-drift in alternating directions.
    const drift = gsap.utils.wrap([-14, 14]);
    lines.forEach((el, i) => {
      gsap.fromTo(el, { xPercent: 0 }, {
        xPercent: drift(i),
        ease: "none",
        scrollTrigger: { trigger: area, start: "top top", end: () => `+=${window.innerHeight}`, scrub: 0.5 },
      });
    });

    // Images in the track open with a horizontal clip wipe as they slide in from the right.
    wipes.forEach((fig) => {
      const media = fig.querySelector(".loc-fig__media");
      gsap.set(media.firstElementChild, { z: 10 });
      gsap.timeline({
        scrollTrigger: { trigger: fig, containerAnimation: tween, start: "left bottom", end: "left center", scrub: true },
      })
        .fromTo(media, { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none" }, 0)
        .fromTo(media.firstElementChild, { scale: 1.15 }, { scale: 1, ease: "none" }, 0);
    });

    // Keyboard focus inside the track: scroll vertically to where the track brings the
    // focused control to the middle of the screen (inverting the horScroll ease).
    const ease = gsap.parseEase("horScroll");
    const onFocus = (e) => {
      const st = tween.scrollTrigger;
      const el = e.target.closest(".loc-panel") ?? e.target;
      const distance = track.scrollWidth - area.offsetWidth;
      const want = gsap.utils.clamp(0, 1, (el.offsetLeft + el.offsetWidth / 2 - window.innerWidth / 2) / distance);
      let lo = 0, hi = 1;
      for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; ease(mid) < want ? (lo = mid) : (hi = mid); }
      scrollToTarget(st.start + lo * (st.end - st.start), { duration: durM });
    };
    track.addEventListener("focusin", onFocus);

    createRevealTriggers(track, { containerAnimation: tween, local: true });
    if (video) bindVideo(video, { containerAnimation: tween, start: "left bottom", end: "right top" });

    return () => {
      ScrollTrigger.removeEventListener("refreshInit", setHeight);
      track.removeEventListener("focusin", onFocus);
      area.style.height = "";
      delete area._horizontalTween;
    };
  });
}
