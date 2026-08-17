/**
 * Thin slider used for the question-count selector (and anything that needs a
 * stepper-style indicator). Track is ~5px with rounded ends; the fill is a
 * separate element that animates its width linearly (200ms ease-out) when the
 * value changes — no bounce, no overshoot. The value label lives in the label
 * row above the bar so nothing reflows while the fill moves.
 */
function ThinSlider({ min, max, step = 1, value, onChange, label, className = "" }) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between mb-2">
        <span className="label-text font-semibold">
          {label} <span className="text-primary font-bold">{value}</span>
        </span>
      </div>

      {/* track (5px) + animated fill + invisible native input on top */}
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-base-300" aria-hidden />
        <div
          className="absolute h-1.5 rounded-full bg-primary transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%`, maxWidth: "100%" }}
          aria-hidden
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={typeof label === "string" ? label : "Select a value"}
          className="relative w-full h-5 appearance-none bg-transparent outline-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-base-100
            [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:mt-[-4.5px]
            [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-base-100 [&::-moz-range-thumb]:shadow
            [&::-webkit-slider-runnable-track]:bg-transparent
            [&::-moz-range-track]:bg-transparent"
        />
      </div>

      <div className="flex justify-between text-xs text-base-content/50 px-1 mt-1">
        <span>{min}</span>
        <span>{Math.round((min + max) / 2)}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export default ThinSlider;
