// The corner mark never stops spinning. Idle at 30°/s; scrolling tweens its speed to
// dir * (30 + 10·|velocity|), and 100ms of quiet eases it back to idle over durL.
import { gsap, durL, reducedMotion } from "../core/timing.js";

const IDLE = 30;         // deg / s
const MAX_VELOCITY = 40; // clamp so a trackpad fling can't send it into a blur
const RESPONSE = 0.3;    // s — velocity pickup, deliberately quicker than durS
const QUIET = 100;       // ms of no scroll before easing back to idle

export function initCornerMark(lenis) {
  const ring = document.querySelector("[data-mark-ring]");
  if (!ring || reducedMotion()) return;

  const state = { speed: IDLE };
  let angle = 0;
  let armed = false; // programmatic scrolls (anchor jumps, restore) are ignored until real input
  let lastScroll = window.scrollY;
  let quietTimer;

  const arm = () => { armed = true; };
  ["wheel", "touchmove", "keydown"].forEach((type) => window.addEventListener(type, arm, { passive: true, once: true }));

  const onScroll = (velocity) => {
    if (!armed) return;
    const v = Math.min(Math.abs(velocity), MAX_VELOCITY);
    if (!v) return;
    const dir = Math.sign(velocity);
    gsap.to(state, { speed: dir * (IDLE + 10 * v), duration: RESPONSE, ease: "Out", overwrite: true });
    clearTimeout(quietTimer);
    quietTimer = setTimeout(() => {
      gsap.to(state, { speed: IDLE, duration: durL, ease: "InOut", overwrite: true });
    }, QUIET);
  };

  if (lenis) {
    lenis.on("scroll", (l) => {
      // Lenis reports velocity for smoothed wheel input; native touch scroll reports ~0,
      // so fall back to the per-frame delta.
      const v = l.velocity || l.scroll - lastScroll;
      lastScroll = l.scroll;
      onScroll(v);
    });
  } else {
    window.addEventListener("scroll", () => {
      onScroll(window.scrollY - lastScroll);
      lastScroll = window.scrollY;
    }, { passive: true });
  }

  gsap.ticker.add((_, deltaMs) => {
    const dt = Math.min(deltaMs, 100) / 1000; // clamped: no jump after a tab blur
    angle = (angle + state.speed * dt) % 360;
    ring.style.transform = `rotate(${angle.toFixed(2)}deg)`;
  });

  window.__mark = { state, get angle() { return angle; } };
}
