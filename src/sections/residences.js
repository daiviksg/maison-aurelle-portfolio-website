// Residences — accessible tabs (arrow keys, Home/End, automatic activation), a floor-plan
// dialog (Esc, focus trap and focus return are native to <dialog>), and a scrubbed
// 1.15 → 1 image scale — this section's image geometry.
import { gsap, MQ } from "../core/timing.js";
import { lockScroll, unlockScroll } from "../core/scroll.js";

const PLANS = {
  shore: {
    name: "Shore",
    rooms: [
      [0, 0, 44, 30, "Living"], [44, 0, 26, 30, "Kitchen"], [70, 0, 30, 18, "Dining"],
      [70, 18, 30, 12, "Pantry"], [0, 30, 30, 30, "Principal"], [30, 30, 20, 14, "Bath"],
      [30, 44, 20, 16, "Dressing"], [50, 30, 25, 30, "Bedroom"], [75, 30, 25, 30, "Bedroom"],
    ],
    terrace: [0, -12, 70, 12],
  },
  garden: {
    name: "Garden",
    rooms: [
      [0, 0, 36, 34, "Living"], [36, 0, 34, 20, "Kitchen"], [36, 20, 34, 14, "Dining"],
      [70, 0, 30, 34, "Study"], [0, 34, 28, 26, "Bedroom"], [28, 34, 24, 26, "Bedroom"],
      [52, 34, 18, 26, "Bath"], [70, 34, 30, 26, "Principal"],
    ],
    terrace: [70, 60, 30, 14],
  },
  ridge: {
    name: "Ridge",
    rooms: [
      [0, 0, 50, 26, "Living"], [50, 0, 24, 26, "Kitchen"], [74, 0, 26, 26, "Dining"],
      [0, 26, 26, 34, "Principal"], [26, 26, 16, 16, "Bath"], [26, 42, 16, 18, "Dressing"],
      [42, 26, 20, 34, "Bedroom"], [62, 26, 19, 34, "Bedroom"], [81, 26, 19, 34, "Bedroom"],
    ],
    terrace: [0, -14, 100, 14],
  },
};

function planSvg({ name, rooms, terrace }) {
  const pad = 4, top = -16;
  const rect = ([x, y, w, h, label], cls) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"/>` +
    (label ? `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="middle">${label.toUpperCase()}</text>` : "");
  return `<svg viewBox="${-pad} ${top - pad} ${100 + pad * 2} ${80 + pad * 2}" role="img" aria-label="Indicative floor plan, ${name} residence: ${rooms.map((r) => r[4]).join(", ")}, with terrace">
    <style>
      rect{fill:none;stroke:#F3F3EC99;stroke-width:.35}
      .t{stroke:#F3F3EC4D;stroke-dasharray:1 1}
      text{fill:#F3F3EC;font:700 2.1px Archivo,Arial,sans-serif;letter-spacing:.1px}
    </style>
    ${rect([...terrace, "Terrace"], "t")}
    ${rooms.map((r) => rect(r, "r")).join("")}
  </svg>`;
}

export function initResidences() {
  const tablist = document.querySelector("[data-tabs]");
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const dialog = document.getElementById("plans");
  const opener = document.querySelector('[data-modal-open="plans"]');
  const plans = dialog.querySelector("[data-plans]");
  const planName = dialog.querySelector("[data-plan-name]");
  let current = "shore";

  const select = (tab, focus = true) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    current = tab.id.replace("tab-", "");
    opener.textContent = `View ${PLANS[current].name} floor plans`;
    if (focus) tab.focus();
  };

  tabs.forEach((t) => t.addEventListener("click", () => select(t)));
  tablist.addEventListener("keydown", (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    select(tabs[(to + tabs.length) % tabs.length]);
  });
  select(tabs[0], false);

  // Dialog
  opener.addEventListener("click", () => {
    plans.innerHTML = planSvg(PLANS[current]);
    planName.textContent = PLANS[current].name;
    lockScroll();
    dialog.showModal();
    opener.setAttribute("aria-expanded", "true");
  });
  dialog.addEventListener("close", () => {
    opener.setAttribute("aria-expanded", "false");
    unlockScroll();
    opener.focus();
  });
  dialog.querySelectorAll("[data-modal-close]").forEach((b) => b.addEventListener("click", () => dialog.close()));
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); }); // backdrop

  // Scrubbed image scale
  const zoom = document.querySelector("[data-zoom]");
  const mm = gsap.matchMedia();
  mm.add(MQ.motion, () => {
    gsap.fromTo(zoom, { scale: 1.15, z: 10 }, {
      scale: 1,
      ease: "none",
      scrollTrigger: { trigger: zoom.parentElement, start: "top bottom", end: "center center", scrub: true },
    });
  });
}
