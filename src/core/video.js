// Video is texture: silent loops that only play while on screen. No autoplay attribute;
// a ScrollTrigger starts and stops each one. Each has a visible pause control.
import { ScrollTrigger, reducedMotion } from "./timing.js";

export function bindVideo(video, triggerVars = {}) {
  const play = () => !video._userPaused && video.play().catch(() => {});
  const pause = () => video.pause();
  return ScrollTrigger.create({
    trigger: video.parentElement,
    start: "top bottom",
    end: "bottom top",
    ...triggerVars,
    onEnter: play,
    onEnterBack: play,
    onLeave: pause,
    onLeaveBack: pause,
  });
}

export function initVideos(root = document) {
  root.querySelectorAll("[data-video-toggle]").forEach((btn) => {
    const video = btn.parentElement.querySelector("video");
    // Under reduced motion loops start paused; the button offers to play them.
    if (reducedMotion()) video._userPaused = true;
    const sync = () => {
      const paused = !!video._userPaused;
      btn.textContent = paused ? "Play motion" : "Pause motion";
    };
    btn.addEventListener("click", () => {
      video._userPaused = !video._userPaused;
      if (video._userPaused) video.pause();
      else video.play().catch(() => {});
      sync();
    });
    sync();
  });

  root.querySelectorAll("[data-video]").forEach((video) => {
    if (video.closest("[data-reveal-scope]")) return; // bound by its section (horizontal track)
    bindVideo(video);
  });
}
