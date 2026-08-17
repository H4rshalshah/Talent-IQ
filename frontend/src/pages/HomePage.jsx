import { Link } from "react-router";
import {
  ArrowRightIcon,
  BotIcon,
  CheckIcon,
  Code2Icon,
  CompassIcon,
  LineChartIcon,
  SparklesIcon,
  TargetIcon,
  UsersIcon,
  VideoIcon,
  ZapIcon,
} from "lucide-react";
import { SignInButton, useUser } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "../lib/animations/gsap.setup";
import { useReveal } from "../lib/animations/useReveal";

function HomePage() {
  const { isSignedIn } = useUser();
  const heroRef = useRef(null);
  const featuresRef = useReveal();

  // hero entrance: staggered line/word reveal on load
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(".hero-badge", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
        .fromTo(
          ".hero-line",
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.12 },
          "-=0.2"
        )
        .fromTo(
          ".hero-sub",
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          "-=0.3"
        )
        .fromTo(
          ".hero-cta",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, stagger: 0.1 },
          "-=0.25"
        )
        .fromTo(
          ".hero-stats",
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          "-=0.25"
        )
        .fromTo(
          ".hero-visual",
          { scale: 0.96, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.7 },
          "-=0.6"
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-gradient-to-br from-base-100 via-base-200 to-base-300 min-h-screen">
      {/* NAVBAR */}
      <nav className="bg-base-100/80 backdrop-blur-md border-b border-primary/20 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          <Link
            to={"/"}
            className="flex items-center gap-3 hover:scale-105 transition-transform duration-200"
          >
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg">
              <SparklesIcon className="size-6 text-white" />
            </div>

            <div className="flex flex-col">
              <span className="font-black text-xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent font-mono tracking-wider">
                Talent IQ
              </span>
              <span className="text-xs text-base-content/60 font-medium -mt-1">
                Interview Smarter
              </span>
            </div>
          </Link>

          {!isSignedIn && (
            <SignInButton mode="modal">
              <button className="group px-6 py-3 bg-gradient-to-r from-primary to-secondary rounded-xl text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center gap-2">
                <span>Get Started</span>
                <ArrowRightIcon className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </SignInButton>
          )}
          {isSignedIn && (
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              Go to Dashboard
              <ArrowRightIcon className="size-4" />
            </Link>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div ref={heroRef} className="max-w-7xl mx-auto px-4 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT */}
          <div className="space-y-8">
            <div className="hero-badge badge badge-primary badge-lg">
              <ZapIcon className="size-4" />
              RAG-Powered Adaptive Interviews
            </div>

            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.08]">
              <span className="hero-line block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Prepare Smarter.
              </span>
              <span className="hero-line block text-base-content">Interview Better.</span>
              <span className="hero-line block text-base-content">Grow Faster.</span>
            </h1>

            <p className="hero-sub text-xl text-base-content/70 leading-relaxed max-w-xl">
              Talent-IQ combines human interviews, retrieval-grounded AI interviews, coding
              assessment, AI-powered feedback, and personalized career guidance in one platform.
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-4">
              {isSignedIn ? (
                <Link to="/interviews/ai/configure" className="hero-cta btn btn-primary btn-lg gap-2">
                  <BotIcon className="size-5" />
                  Start AI Interview
                  <ArrowRightIcon className="size-5" />
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <button className="hero-cta btn btn-primary btn-lg gap-2">
                    <BotIcon className="size-5" />
                    Start AI Interview
                    <ArrowRightIcon className="size-5" />
                  </button>
                </SignInButton>
              )}

              <Link to={isSignedIn ? "/problems" : "/"} className="hero-cta btn btn-outline btn-lg gap-2">
                <Code2Icon className="size-5" />
                Practice Coding
              </Link>
            </div>

            {/* STATS */}
            <div className="hero-stats stats stats-vertical lg:stats-horizontal bg-base-100 shadow-lg">
              <div className="stat">
                <div className="stat-value text-primary">2</div>
                <div className="stat-title">Interview Modes</div>
              </div>
              <div className="stat">
                <div className="stat-value text-secondary">6+</div>
                <div className="stat-title">Target Roles</div>
              </div>
              <div className="stat">
                <div className="stat-value text-accent">RAG</div>
                <div className="stat-title">Grounded AI Feedback</div>
              </div>
            </div>
          </div>

          {/* RIGHT: hero visual */}
          <div className="hero-visual relative">
            <div className="card bg-base-100 shadow-2xl border-2 border-primary/20 overflow-hidden">
              <div className="card-body p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <BotIcon className="size-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold">AI Interviewer</p>
                    <p className="text-xs text-base-content/60">Software Engineer · Mid level</p>
                  </div>
                </div>

                <div className="bg-base-200 rounded-xl p-4 mb-3">
                  <p className="text-xs text-base-content/50 mb-1 font-semibold uppercase tracking-wide">
                    Question · Medium
                  </p>
                  <p className="font-medium">
                    "Explain runtime polymorphism with a practical example."
                  </p>
                </div>

                <div className="bg-base-200 rounded-xl p-4 mb-6">
                  <p className="text-xs text-base-content/50 mb-1 font-semibold uppercase tracking-wide">
                    Your answer
                  </p>
                  <p className="text-sm text-base-content/80">
                    Polymorphism means many forms — a subclass overrides a base method...
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="badge badge-success gap-1">
                    <CheckIcon className="size-3" />
                    Strong answer
                  </span>
                  <button className="btn btn-primary btn-sm gap-1">
                    Ask follow-up <ArrowRightIcon className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* floating chips */}
            <div className="absolute -top-4 -right-2 card bg-base-100 shadow-xl px-4 py-3 border border-secondary/30 hidden sm:block">
              <p className="text-xs text-base-content/60">Adaptive difficulty</p>
              <p className="font-bold text-secondary">Easy → Medium → Hard</p>
            </div>
            <div className="absolute -bottom-4 -left-2 card bg-base-100 shadow-xl px-4 py-3 border border-accent/30 hidden sm:block">
              <p className="text-xs text-base-content/60">Performance trend</p>
              <p className="font-bold text-accent">64 → 71 → 78 → 83</p>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div ref={featuresRef} className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Everything you need to <span className="text-primary font-mono">ace interviews</span>
          </h2>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Human-led or AI-led interviews, grounded feedback, and a personalized path forward
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: UsersIcon,
              title: "Human Interviews",
              text: "Live 1-on-1 video rooms with real-time chat, screen sharing, collaborative coding, and recording.",
            },
            {
              icon: BotIcon,
              title: "AI Interviews",
              text: "Conversational AI interviews that adapt to your answers, grounded in retrieved domain knowledge.",
            },
            {
              icon: TargetIcon,
              title: "Adaptive Questioning",
              text: "Strong answer? The difficulty climbs. Weak spot? The interviewer circles back with a foundational question.",
            },
            {
              icon: Code2Icon,
              title: "RAG-Grounded Code Review",
              text: "AI code analysis comparing your solution against known-good approaches and optimization patterns.",
            },
            {
              icon: LineChartIcon,
              title: "Performance Analytics",
              text: "Skill breakdown, interview history, and score trends that show your growth over time.",
            },
            {
              icon: CompassIcon,
              title: "Career Roadmap",
              text: "A personalized improvement plan built from your actual performance, not generic advice.",
            },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="reveal card bg-base-100 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="card-body">
                  <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    <Icon className="size-8 text-primary" />
                  </div>
                  <h3 className="card-title">{feature.title}</h3>
                  <p className="text-base-content/70">{feature.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA BAND */}
        <div className="reveal mt-20 card bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-2xl">
          <div className="card-body md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-black mb-1">Ready to interview smarter?</h3>
              <p className="text-white/80">
                Start an adaptive AI interview or practice coding in minutes.
              </p>
            </div>
            {isSignedIn ? (
              <Link to="/interviews" className="btn btn-lg bg-base-100 text-base-content hover:bg-base-200 border-0 gap-2">
                <VideoIcon className="size-5" />
                Start Interview
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button className="btn btn-lg bg-base-100 text-base-content hover:bg-base-200 border-0 gap-2">
                  <VideoIcon className="size-5" />
                  Start Interview
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-base-300 py-8 text-center text-sm text-base-content/50">
        Talent-IQ · RAG-Powered Adaptive Interview & Career Intelligence Platform
      </footer>
    </div>
  );
}
export default HomePage;
