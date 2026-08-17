import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "../lib/animations/gsap.setup";

/**
 * Horizontal skill bars with animated fill on first mount.
 */
export function SkillBars({ items }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll(".skill-fill"),
        { width: 0 },
        { width: (i) => `${items[i]?.value ?? 0}%`, duration: 0.9, ease: "power2.out", stagger: 0.08 }
      );
    }, el);

    return () => ctx.revert();
  }, [items]);

  return (
    <div ref={ref} className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-medium">{item.label}</span>
            <span className="font-mono font-bold text-primary">{item.value ?? 0}%</span>
          </div>
          <div className="h-3 bg-base-200 rounded-full overflow-hidden">
            <div
              className="skill-fill h-full rounded-full bg-primary"
              style={{ width: 0 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Simple SVG line chart for score progression over interviews.
 */
export function TrendChart({ points, labels }) {
  const width = 560;
  const height = 220;
  const padX = 40;
  const padY = 30;

  if (!points.length) return null;

  const min = Math.min(0, ...points) - 5;
  const max = Math.max(100, ...points) + 5;
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = points.length === 1 ? width / 2 : padX + (i * (width - padX * 2)) / (points.length - 1);
    const y = height - padY - ((p - min) / range) * (height - padY * 2);
    return [x, y];
  });

  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1][0].toFixed(1)},${height - padY} L${coords[0][0].toFixed(1)},${height - padY} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Score trend chart">
      <defs>
        <linearGradient id="trendArea" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--p))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--p))" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines */}
      {[0, 25, 50, 75, 100].map((g) => {
        const y = height - padY - ((g - min) / range) * (height - padY * 2);
        return (
          <g key={g}>
            <line x1={padX} x2={width - padX} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
            <text x={padX - 8} y={y + 4} textAnchor="end" fontSize="11" fill="currentColor" fillOpacity="0.5">
              {g}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#trendArea)" />
      <path d={linePath} fill="none" stroke="hsl(var(--p))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {coords.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="5" fill="hsl(var(--p))" stroke="var(--color-base-100, white)" strokeWidth="2" />
          <text x={x} y={y - 12} textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">
            {points[i]}
          </text>
          {labels?.[i] && (
            <text x={x} y={height - 8} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity="0.55">
              {labels[i]}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
