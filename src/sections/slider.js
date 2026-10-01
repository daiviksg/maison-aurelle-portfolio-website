// Concept slider — each change wipes the incoming image in from the travel side while it
// settles from 1.15 to 1; the outgoing one is simply covered. Buttons + arrow keys.
import { gsap, durL, reducedMotion } from "../core/timing.js";

export function initSlider() {
  const root = document.querySelector("[data-slider]");
  if (!root) return;
  const slides = [...root.querySelectorAll("[data-slide]")];
  const current = root.querySelector("[data-slide-current]");
  const bar = root.querySelector("[data-slide-bar]");
  const live = root.querySelector("[data-slide-live]");
  let index = 0;
  let busy = false;

  const go = (dir) => {
    if (busy) return;
    const next = (index + dir + slides.length) % slides.length;
    const from = slides[index], to = slides[next];
    busy = true;
    from.classList.replace("is-active", "is-leaving");
    from.setAttribute("aria-hidden", "true");
    to.classList.add("is-active");
    to.removeAttribute("aria-hidden");

    const instant = reducedMotion();
    const start = dir > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)";
    gsap.timeline({
      onComplete: () => { from.classList.remove("is-leaving"); busy = false; },
    })
      .fromTo(to, { clipPath: start }, { clipPath: "inset(0% 0% 0% 0%)", duration: instant ? 0 : durL, ease: "InOut" }, 0)
      .fromTo(to.querySelector("img"), { scale: 1.15 }, { scale: 1, duration: instant ? 0 : durL, ease: "Out" }, 0);

    index = next;
    current.textContent = String(index + 1);
    bar.style.transform = `scaleX(${(index + 1) / slides.length})`;
    live.textContent = `Image ${index + 1} of ${slides.length}: ${to.querySelector("img").alt}`;
  };

  root.querySelector("[data-slide-prev]").addEventListener("click", () => go(-1));
  root.querySelector("[data-slide-next]").addEventListener("click", () => go(1));
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { go(1); e.preventDefault(); }
    if (e.key === "ArrowLeft") { go(-1); e.preventDefault(); }
  });
}
