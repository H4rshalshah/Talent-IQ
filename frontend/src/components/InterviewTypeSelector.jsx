import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRightIcon, BotIcon, UsersIcon } from "lucide-react";
import { gsap, Flip, prefersReducedMotion } from "../lib/animations/gsap.setup";

const MODES = [
  {
    slug: "ai",
    title: "AI Interview",
    icon: BotIcon,
    description:
      "Conversational interview with a RAG-grounded AI interviewer. Adaptive difficulty, instant evaluation, and a performance report at the end.",
    features: ["Adaptive questioning", "RAG-grounded", "Instant evaluation", "Performance report"],
    primary: true,
    to: "/interviews/ai/configure",
  },
  {
    slug: "human",
    title: "Human Interview",
    icon: UsersIcon,
    description:
      "Live 1-on-1 interview with another person. Video, audio, screen sharing, real-time chat, and collaborative coding in a shared room.",
    features: ["HD video call", "Screen sharing", "Real-time chat", "Collaborative coding"],
    primary: false,
    to: "/interviews/human",
  },
];

function InterviewTypeSelector() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);

  const handleSelect = (mode) => {
    if (animating) return;
    setSelected(mode.slug);
    setAnimating(true);

    if (prefersReducedMotion()) {
      navigate(mode.to);
      return;
    }

    // GSAP Flip: capture the grid layout, expand the selected card, then
    // route. Kept short (~450ms) so it feels like a transition, not a delay.
    const grid = document.getElementById("interview-mode-grid");
    if (!grid) {
      navigate(mode.to);
      return;
    }

    const state = Flip.getState(".mode-card");
    grid.classList.add("mode-grid-selected");

    gsap.to(`[data-mode="${mode.slug}"]`, {
      scale: 1.02,
      boxShadow: "0 20px 50px -12px rgba(0,0,0,0.35)",
      duration: 0.25,
      onComplete: () => {
        Flip.from(state, {
          duration: 0.4,
          ease: "power3.inOut",
          absolute: true,
          onComplete: () => navigate(mode.to),
        });
      },
    });
  };

  return (
    <div id="interview-mode-grid" className="grid md:grid-cols-2 gap-6">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const isSelected = selected === mode.slug;
        return (
          <button
            key={mode.slug}
            data-mode={mode.slug}
            onClick={() => handleSelect(mode)}
            className={`mode-card text-left card bg-base-100 border-2 transition-colors duration-200 ${
              isSelected ? "border-primary ring-2 ring-primary/30" : "border-base-300 hover:border-primary/50"
            } cursor-pointer`}
          >
            <div className="card-body p-6">
              <div className="flex items-center justify-between mb-4">
                {mode.primary ? (
                  <div className="size-14 rounded-2xl bg-primary flex items-center justify-center">
                    <Icon className="size-7 text-primary-content" />
                  </div>
                ) : (
                  <div className="icon-tint size-14">
                    <Icon className="size-7" />
                  </div>
                )}
                <span className="badge badge-ghost badge-lg">
                  {isSelected ? "Selected..." : "Choose"}
                </span>
              </div>

              <h3 className="text-2xl font-black mb-2">{mode.title}</h3>
              <p className="text-base-content/70 mb-4">{mode.description}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {mode.features.map((f) => (
                  <span key={f} className="badge badge-outline badge-sm">
                    {f}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 text-primary font-semibold">
                <span>{isSelected ? "Preparing..." : `Start ${mode.title}`}</span>
                <ArrowRightIcon className="size-5" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default InterviewTypeSelector;
