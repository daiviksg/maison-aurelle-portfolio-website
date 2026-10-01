import { ScrollTrigger } from "./timing.js";

// One ScrollTrigger per section swaps the fixed UI between the three ground themes.
// The switch line sits where the corner mark and nav live, so the swap happens
// exactly as a new ground slides under them; ui.css interpolates the colour.
const THEMES = ["theme_on-light", "theme_on-dark", "theme_on-color"];

export function initTheme() {
  const ui = [...document.querySelectorAll("[data-theme]")];
  const set = (bg) => {
    const cls = `theme_on-${bg}`;
    for (const el of ui) {
      if (el.classList.contains(cls)) continue;
      el.classList.remove(...THEMES);
      el.classList.add(cls);
    }
  };

  const sections = document.querySelectorAll("main [data-bg], [data-footer], [data-footer-block]");
  // Markers ([data-bg-marker]) switch the theme part-way through a section; scrolling
  // back above one hands the theme back to its section.
  sections.forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: "top 48px",
      end: "bottom 48px",
      onToggle: (self) => self.isActive && set(section.dataset.bg),
      onLeaveBack: section.hasAttribute("data-bg-marker") ? () => set(section.closest("section").dataset.bg) : undefined,
    });
  });

  set(document.querySelector("main [data-bg]")?.dataset.bg ?? "light");
}
