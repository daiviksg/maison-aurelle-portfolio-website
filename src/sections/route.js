// Route — a hand-drawn line draws itself as you scroll (stroke-dashoffset scrub); each stop
// is placed on the curve by its fraction of the line's length and arrives, discretely, the
// moment the line reaches it. Desktop only; below 992px it is a plain list.
import { gsap, MQ } from "../core/timing.js";

export function initRoute() {
  const map = document.querySelector("[data-route]");
  const path = map.querySelector("[data-route-path]");
  const stops = [...map.querySelectorAll("li[data-at]")];
  const VB = { w: 1400, h: 260 };

  const mm = gsap.matchMedia();
  mm.add(MQ.desk, () => {
    const len = path.getTotalLength();
    stops.forEach((li) => {
      const pt = path.getPointAtLength(len * +li.dataset.at);
      li.style.setProperty("--px", `${(pt.x / VB.w) * 100}%`);
      li.style.setProperty("--py", `${(pt.y / VB.h) * 100}%`);
    });
    map.classList.add("is-live");

    const reach = (progress) => stops.forEach((li) => li.classList.toggle("is-reached", +li.dataset.at <= progress + 0.001));
    gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: {
        trigger: map,
        start: "top 85%",
        end: "bottom 35%",
        scrub: true,
        onUpdate: (self) => reach(self.progress),
        onRefresh: (self) => reach(self.progress),
      },
    });

    return () => {
      map.classList.remove("is-live");
      stops.forEach((li) => li.classList.remove("is-reached"));
      gsap.set(path, { clearProps: "strokeDasharray,strokeDashoffset" });
    };
  });
}
