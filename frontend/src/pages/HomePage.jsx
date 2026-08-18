import { Link } from "react-router";
import {
  ArrowRightIcon,
  BotIcon,
  CheckIcon,
  Code2Icon,
  CompassIcon,
  LineChartIcon,
  MessageSquareTextIcon,
  SparklesIcon,
  TargetIcon,
  UsersIcon,
  VideoIcon,
  ZapIcon,
} from "lucide-react";
import { SignInButton, useUser } from "@clerk/clerk-react";
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "../lib/animations/gsap.setup";
import { useReveal } from "../lib/animations/useReveal";

/* ─── 10 demo Q&A pairs ─── */
const DEMO_QA = [
  {
    question: "Explain runtime polymorphism with a practical example.",
    difficulty: "Medium",
    topic: "OOP",
    isFollowUp: false,
    answer:
      "Polymorphism means many forms — a subclass overrides a base method, so the same interface behaves differently at runtime based on the actual object type.",
    feedback: "Strong answer",
    feedbackType: "success",
  },
  {
    question: "How would you design a rate limiter for a public API?",
    difficulty: "Hard",
    topic: "System Design",
    isFollowUp: false,
    answer:
      "I'd use a token bucket algorithm with Redis for distributed counting, resetting tokens at a fixed interval per client IP.",
    feedback: "Solid answer",
    feedbackType: "primary",
  },
  {
    question: "What is the difference between SQL and NoSQL databases?",
    difficulty: "Easy",
    topic: "Databases",
    isFollowUp: false,
    answer:
      "SQL databases use structured schemas with joins and ACID transactions, while NoSQL offers flexible document models optimized for horizontal scaling.",
    feedback: "Strong answer",
    feedbackType: "success",
  },
  {
    question: "When would you choose NoSQL over SQL in a real project?",
    difficulty: "Medium",
    topic: "Databases",
    isFollowUp: true,
    answer:
      "When the data model is unstructured or rapidly evolving, like user activity logs or product catalogs, NoSQL's schema flexibility and write throughput are ideal.",
    feedback: "Good effort — here's how to go deeper",
    feedbackType: "warning",
  },
  {
    question: "Explain the virtual DOM and why React uses it.",
    difficulty: "Medium",
    topic: "React",
    isFollowUp: false,
    answer:
      "The virtual DOM is a lightweight JS copy of the real DOM. React diffs the old and new trees to compute the minimal set of actual DOM mutations needed.",
    feedback: "Strong answer",
    feedbackType: "success",
  },
  {
    question: "What is a closure and give a practical use case.",
    difficulty: "Easy",
    topic: "JavaScript",
    isFollowUp: false,
    answer:
      "A closure is a function that remembers its outer scope variables. A common use case is data privacy — creating private counters or encapsulated state in modules.",
    feedback: "Strong answer",
    feedbackType: "success",
  },
  {
    question: "How does event delegation work in the DOM?",
    difficulty: "Medium",
    topic: "Web",
    isFollowUp: true,
    answer:
      "Instead of attaching listeners to every child, you attach one listener to a parent. Events bubble up, so the parent catches events from all descendants via event.target.",
    feedback: "Solid answer",
    feedbackType: "primary",
  },
  {
    question: "How does the garbage collector work in JavaScript?",
    difficulty: "Hard",
    topic: "JavaScript",
    isFollowUp: false,
    answer:
      "JavaScript uses mark-and-sweep. It traces from root objects, marks all reachable values, then frees memory for anything unmarked. Generational GC separates short-lived and long-lived objects.",
    feedback: "Strong answer",
    feedbackType: "success",
  },
  {
    question: "What problem does Redux solve in a React application?",
    difficulty: "Medium",
    topic: "React",
    isFollowUp: false,
    answer:
      "Redux provides a single predictable state container — it centralizes state so any component can read it, and updates happen through dispatched actions with pure reducers.",
    feedback: "Strong answer",
    feedbackType: "success",
  },
  {
    question: "Explain the CAP theorem in distributed systems.",
    difficulty: "Hard",
    topic: "System Design",
    isFollowUp: true,
    answer:
      "A distributed system can only guarantee two of three: Consistency, Availability, and Partition tolerance. Since network partitions are inevitable, you choose between CP and AP.",
    feedback: "Solid answer",
    feedbackType: "primary",
  },
];

/* ─── Typewriter hook — only types when enabled=true ─── */
function useTypewriter(text, { speed = 20, enabled = true } = {}) {
  const [displayed, setDisplayed] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Always clear previous interval
    clearInterval(intervalRef.current);

    if (!enabled || !text) {
      setDisplayed("");
      setIsComplete(false);
      indexRef.current = 0;
      return;
    }

    // Reset and start fresh
    setDisplayed("");
    setIsComplete(false);
    indexRef.current = 0;

    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= text.length) {
        setDisplayed(text);
        setIsComplete(true);
        clearInterval(intervalRef.current);
      } else {
        setDisplayed(text.slice(0, indexRef.current));
      }
    }, speed);

    return () => clearInterval(intervalRef.current);
  }, [text, speed, enabled]);

  return { displayed, isComplete };
}

/* ─── Hero Demo Component ─── */
function HeroDemo() {
  const [qaIndex, setQaIndex] = useState(0);
  // Phases: "typing-question" → "show-answer" → "typing-answer" → "show-feedback" → "fading" → next
  const [phase, setPhase] = useState("typing-question");
  const [showAnswerBox, setShowAnswerBox] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [clickedFollowUp, setClickedFollowUp] = useState(false);
  const timerRef = useRef(null);
  const timer2Ref = useRef(null);

  // Helper: skip to next question immediately
  const handleAskFollowUp = () => {
    if (clickedFollowUp) return;
    setClickedFollowUp(true);
    clearTimeout(timerRef.current);
    clearTimeout(timer2Ref.current);
    setFadingOut(true);
    setTimeout(() => {
      setFadingOut(false);
      setShowAnswerBox(false);
      setShowFeedback(false);
      setClickedFollowUp(false);
      setPhase("typing-question");
      setQaIndex((prev) => (prev + 1) % DEMO_QA.length);
    }, 300);
  };

  const qa = DEMO_QA[qaIndex];
  const isTypingQuestion = phase === "typing-question";
  const isTypingAnswer = phase === "typing-answer";

  // Typewriter: question (only enabled when phase is "typing-question")
  const {
    displayed: typedQuestion,
    isComplete: questionDone,
  } = useTypewriter(qa.question, { speed: 22, enabled: isTypingQuestion });

  // Typewriter: answer (only enabled when phase is "typing-answer")
  const {
    displayed: typedAnswer,
    isComplete: answerDone,
  } = useTypewriter(qa.answer, { speed: 14, enabled: isTypingAnswer });

  // Question typing done → show answer box, then start typing answer
  useEffect(() => {
    if (phase !== "typing-question" || !questionDone) return;
    timerRef.current = setTimeout(() => {
      setShowAnswerBox(true);
      setPhase("typing-answer");
    }, 500);
    return () => clearTimeout(timerRef.current);
  }, [phase, questionDone]);

  // Answer typing done → show feedback
  useEffect(() => {
    if (phase !== "typing-answer" || !answerDone) return;
    timerRef.current = setTimeout(() => {
      setShowFeedback(true);
      setPhase("show-feedback");
    }, 400);
    return () => clearTimeout(timerRef.current);
  }, [phase, answerDone]);

  // Feedback shown → wait then fade out → next (auto-advance)
  useEffect(() => {
    if (phase !== "show-feedback" || clickedFollowUp) return;
    timerRef.current = setTimeout(() => {
      setFadingOut(true);
      timer2Ref.current = setTimeout(() => {
        setFadingOut(false);
        setShowAnswerBox(false);
        setShowFeedback(false);
        setPhase("typing-question");
        setQaIndex((prev) => (prev + 1) % DEMO_QA.length);
      }, 350);
    }, 2500);
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(timer2Ref.current);
    };
  }, [phase, clickedFollowUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(timer2Ref.current);
    };
  }, []);

  return (
    <div
      className={`card bg-base-100 shadow-2xl border-2 border-primary/20 overflow-hidden transition-opacity duration-300 ${
        fadingOut ? "hero-demo-fade-out" : ""
      }`}
    >
      <div className="card-body p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <BotIcon className="size-6 text-white" />
            </div>
            <div>
              <p className="font-bold">AI Interviewer</p>
              <p className="text-xs text-base-content/60">
                Software Engineer · Mid level
              </p>
            </div>
          </div>
          {(isTypingQuestion || isTypingAnswer) && (
            <span className="ai-generating-badge badge badge-primary badge-xs gap-1.5 py-1 px-2.5">
              <SparklesIcon className="size-3 animate-spin" />
              AI
            </span>
          )}
        </div>

        {/* Question Block */}
        <div
          className={`bg-base-200 rounded-xl p-4 mb-3 transition-all duration-300 ${
            fadingOut ? "opacity-0" : "hero-demo-fade-in"
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            {qa.isFollowUp ? (
              <span className="badge badge-warning badge-xs">Follow-up</span>
            ) : (
              <span className="badge badge-primary badge-xs">New question</span>
            )}
            <span className="text-[10px] text-base-content/40 uppercase tracking-wider font-semibold">
              {qa.difficulty} · {qa.topic}
            </span>
          </div>
          <p className="font-medium leading-relaxed">
            {isTypingQuestion ? typedQuestion : qa.question}
            {isTypingQuestion && <span className="ai-cursor" />}
          </p>
        </div>

        {/* Answer Block */}
        <div
          className={`rounded-xl p-4 mb-3 transition-all duration-400 ${
            showAnswerBox
              ? "bg-base-200 hero-demo-fade-in opacity-100"
              : "bg-transparent opacity-0 max-h-0 overflow-hidden p-0 mb-0"
          } ${fadingOut ? "opacity-0" : ""}`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <MessageSquareTextIcon className="size-3 text-primary" />
            <span className="text-[10px] text-base-content/40 uppercase tracking-wider font-semibold">
              Your answer
            </span>
          </div>
          <p className="text-sm text-base-content/80 leading-relaxed">
            {isTypingAnswer ? typedAnswer : showAnswerBox ? qa.answer : ""}
            {isTypingAnswer && <span className="ai-cursor" />}
          </p>
        </div>

        {/* Feedback + Buttons */}
        {showFeedback && (
          <div
            className={`space-y-3 mb-2 transition-opacity duration-300 ${
              fadingOut ? "opacity-0" : "hero-demo-fade-in"
            }`}
          >
            <div className="bg-base-200/60 rounded-lg p-3">
              <div className="flex items-start gap-2">
                {qa.feedbackType === "success" ? (
                  <CheckIcon className="size-4 text-success shrink-0 mt-0.5" />
                ) : qa.feedbackType === "warning" ? (
                  <SparklesIcon className="size-4 text-warning shrink-0 mt-0.5" />
                ) : (
                  <SparklesIcon className="size-4 text-primary shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-xs font-semibold mb-0.5">{qa.feedback}</p>
                  <p className="text-[11px] text-base-content/60 leading-relaxed">
                    {qa.feedbackType === "success"
                      ? "Excellent depth and clarity."
                      : qa.feedbackType === "warning"
                        ? "Try including a specific example next time."
                        : "Good foundation — can you add more detail?"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`badge badge-sm gap-1 ${
                    qa.feedbackType === "success"
                      ? "badge-success"
                      : qa.feedbackType === "warning"
                        ? "badge-warning"
                        : "badge-primary"
                  }`}
                >
                  <CheckIcon className="size-3" />
                  {qa.feedback}
                </span>
                <span className="badge badge-outline badge-xs">
                  {qa.difficulty}
                </span>
              </div>
              <button
                onClick={handleAskFollowUp}
                className="btn btn-primary btn-sm gap-1"
              >
                Ask follow-up <ArrowRightIcon className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Info chips — INSIDE the card */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-base-300">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-secondary/10 flex items-center justify-center">
              <ZapIcon className="size-3.5 text-secondary" />
            </div>
            <div>
              <p className="text-[10px] text-base-content/50 leading-tight">
                Adaptive difficulty
              </p>
              <p className="font-bold text-secondary text-xs">
                Easy → Medium → Hard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-accent/10 flex items-center justify-center">
              <LineChartIcon className="size-3.5 text-accent" />
            </div>
            <div>
              <p className="text-[10px] text-base-content/50 leading-tight">
                Performance trend
              </p>
              <p className="font-bold text-accent text-xs">
                64 → 71 → 78 → 83
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
function HomePage() {
  const { isSignedIn } = useUser();
  const heroRef = useRef(null);
  const featuresRef = useReveal();

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(
          ".hero-badge",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 }
        )
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
            to="/"
            className="flex items-center gap-3 hover:scale-105 transition-transform duration-200"
          >
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg">
              <SparklesIcon className="size-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl text-primary font-mono tracking-wider">
                Talent IQ
              </span>
              <span className="text-xs text-base-content/60 font-medium -mt-1">
                Interview Smarter
              </span>
            </div>
          </Link>

          {!isSignedIn && (
            <SignInButton mode="modal">
              <button className="group px-6 py-3 bg-primary rounded-xl text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center gap-2">
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
              <span className="hero-line block text-primary">
                Prepare Smarter.
              </span>
              <span className="hero-line block text-base-content">
                Interview Better.
              </span>
              <span className="hero-line block text-base-content">
                Grow Faster.
              </span>
            </h1>

            <p className="hero-sub text-xl text-base-content/70 leading-relaxed max-w-xl">
              Talent-IQ combines human interviews, retrieval-grounded AI
              interviews, coding assessment, AI-powered feedback, and
              personalized career guidance in one platform.
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-4">
              {isSignedIn ? (
                <Link
                  to="/interviews/ai/configure"
                  className="hero-cta btn btn-primary btn-lg gap-2"
                >
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

              <Link
                to={isSignedIn ? "/practice" : "/"}
                className="hero-cta btn btn-outline btn-lg gap-2"
              >
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
          <div className="hero-visual">
            <HeroDemo />
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div ref={featuresRef} className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Everything you need to{" "}
            <span className="text-primary font-mono">ace interviews</span>
          </h2>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Human-led or AI-led interviews, grounded feedback, and a
            personalized path forward
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
        <div className="reveal mt-20 card bg-primary text-white shadow-2xl">
          <div className="card-body md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-black mb-1">
                Ready to interview smarter?
              </h3>
              <p className="text-white/80">
                Start an adaptive AI interview or practice coding in minutes.
              </p>
            </div>
            {isSignedIn ? (
              <Link
                to="/interviews"
                className="btn btn-lg bg-base-100 text-base-content hover:bg-base-200 border-0 gap-2"
              >
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
        Talent-IQ · RAG-Powered Adaptive Interview & Career Intelligence
        Platform
      </footer>
    </div>
  );
}

export default HomePage;
