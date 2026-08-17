import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "./gsap.setup";

let lenis = null;
let tickerCallback = null;

/**
 * Initialize Lenis smooth scrolling and sync it with ScrollTrigger.
 * Respects prefers-reduced-motion: falls back to native scrolling entirely.
 * Safe to call once at the app root.
 */
export function initSmoothScroll() {
  if (lenis || prefersReducedMotion()) return null;

  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  tickerCallback = (time) => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(tickerCallback);
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function getLenis() {
  return lenis;
}

export function destroySmoothScroll() {
  if (!lenis) return;
  if (tickerCallback) gsap.ticker.remove(tickerCallback);
  lenis.destroy();
  lenis = null;
  tickerCallback = null;
}
