import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "./gsap.setup";

/**
 * Scroll-reveal hook: fades/slides children of `ref` in once when they scroll
 * into view. Skips entirely when the user prefers reduced motion.
 *
 * Usage:
 *   const ref = useReveal();
 *   <div ref={ref} className="reveal">...</div>
 *
 * Elements with the `.reveal` class are animated; other children are left alone.
 * All GSAP contexts are reverted on unmount to avoid leaks on route changes.
 */
export function useReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const targets = el.querySelectorAll(".reveal");

      if (options.stagger) {
        gsap.fromTo(
          targets,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            stagger: options.stagger,
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              once: true,
            },
          }
        );
      } else {
        targets.forEach((target) => {
          gsap.fromTo(
            target,
            { y: 28, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.55,
              scrollTrigger: {
                trigger: target,
                start: "top 88%",
                once: true,
              },
            }
          );
        });
      }
    }, el);

    return () => {
      ctx.revert(); // cleans up all ScrollTriggers + tweens created in this context
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

/**
 * Animate a numeric value counting up to `target` on first mount.
 * Returns a ref to attach to the element and an object with a `to` method
 * to restart the count (e.g. when the value changes).
 */
export function useCountUp(target, { duration = 1.2, decimals = 0 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.textContent = Number(target).toFixed(decimals);
      return;
    }

    const state = { value: 0 };
    const tween = gsap.to(state, {
      value: Number(target) || 0,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = state.value.toFixed(decimals);
      },
    });

    return () => {
      tween.kill();
    };
  }, [target, duration, decimals]);

  return ref;
}
