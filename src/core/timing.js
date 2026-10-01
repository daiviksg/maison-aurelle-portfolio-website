// The timing language. Every animation on the site uses one of these three
// durations and one of these eases — no raw numbers or ad-hoc eases elsewhere.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

export const BREAKPOINT = 992;
export const durS = 0.4, durM = 0.8, durL = 1.2;
export const stagger = 0.1, delayReveal = 0.3;

CustomEase.create("InOut",     "0.75,0,0.25,1");
CustomEase.create("Out",       "0.25,1,0.5,1");
CustomEase.create("In",        "0.5,0,0.75,0");
CustomEase.create("Ease",      "0.25,0.1,0.25,1");
CustomEase.create("diveIn",    "0.6,0,0,1");     // preloader arch dive
CustomEase.create("horScroll", "0.25,0,0.75,1"); // horizontal section

// Hand-drawn, irregular: the loading bar surges, hesitates, surges again and settles.
CustomEase.create(
  "loadBar",
  "M0,0 C0.06,0.02 0.1,0.24 0.16,0.3 0.2,0.34 0.25,0.33 0.3,0.35 0.36,0.37 0.38,0.52 0.44,0.58 " +
  "0.5,0.64 0.56,0.6 0.62,0.63 0.7,0.67 0.74,0.86 0.82,0.92 0.9,0.97 0.95,0.99 1,1"
);

// Media queries used by every gsap.matchMedia() on the site.
export const MQ = {
  desk: `(min-width: ${BREAKPOINT}px) and (prefers-reduced-motion: no-preference)`,
  mob: `(max-width: ${BREAKPOINT - 1}px) and (prefers-reduced-motion: no-preference)`,
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
};

export const reducedMotion = () => window.matchMedia(MQ.reduce).matches;
export const isDesk = () => window.innerWidth >= BREAKPOINT;

export { gsap, ScrollTrigger, SplitText, CustomEase };
