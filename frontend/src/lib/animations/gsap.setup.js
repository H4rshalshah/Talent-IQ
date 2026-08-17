import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";

// Register plugins exactly once, in this single module.
gsap.registerPlugin(ScrollTrigger, Flip);

// Keep entrance animations snappy — anything longer starts to feel like lag.
gsap.defaults({ ease: "power3.out", duration: 0.5 });

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, Flip };
