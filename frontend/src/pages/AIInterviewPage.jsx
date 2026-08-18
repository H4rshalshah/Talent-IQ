import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BotIcon,
  CheckCircle2Icon,
  ClockIcon,
  FlagIcon,
  LoaderIcon,
  MessageSquareTextIcon,
  SendIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import Navbar from "../components/Navbar";
import {
  useAbortInterview,
  useCompleteAiInterview,
  useGetAiQuestion,
  useInterviewById,
  useSubmitAiAnswer,
} from "../hooks/useInterviews";
import { roleLabel, topicLabel } from "../data/interviewConfig";
import { gsap, prefersReducedMotion } from "../lib/animations/gsap.setup";
import { formatDistanceToNow } from "date-fns";

/* ─── Typewriter hook ─────────────────────────────────────────────────── */
function useTypewriter(text, { speed = 18, enabled = true } = {}) {
  const [displayed, setDisplayed] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayed(text || "");
      setIsComplete(true);
      return;
    }

    // Reset
    setDisplayed("");
    setIsComplete(false);
    indexRef.current = 0;

    const id = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= text.length) {
        setDisplayed(text);
        setIsComplete(true);
        clearInterval(id);
      } else {
        setDisplayed(text.slice(0, indexRef.current));
      }
    }, speed);

    return () => clearInterval(id);
  }, [text, speed, enabled]);

  return { displayed, isComplete };
}

/* ─── Main Component ─────────────────────────────────────────────────── */
function AIInterviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useInterviewById(id);
  const getQuestionMutation = useGetAiQuestion();
  const submitAnswerMutation = useSubmitAiAnswer();
  const completeMutation = useCompleteAiInterview();
  const abortMutation = useAbortInterview();

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);

  const questionRef = useRef(null);
  const timeUpHandled = useRef(false);
  const interview = data?.data?.interview;
  const questions = data?.data?.questions || [];
  const answeredCount = questions.filter((q) => q.answer).length;

  /* ─── Typewriter for question text ─── */
  const { displayed: typedQuestion, isComplete: typewriterDone } = useTypewriter(
    currentQuestion?.question,
    { speed: 14, enabled: !isGenerating && !!currentQuestion }
  );

  // redirect completed interviews to the result page
  useEffect(() => {
    if (interview?.status === "completed") {
      navigate(`/interviews/result/${id}`, { replace: true });
    }
  }, [interview?.status, id, navigate]);

  const handleTimeUp = useCallback(() => {
    if (!id || timeUpHandled.current) return;
    timeUpHandled.current = true;
    completeMutation.mutate(id, {
      onSuccess: () => navigate(`/interviews/result/${id}`),
    });
  }, [id, completeMutation, navigate]);

  // timer
  useEffect(() => {
    if (!interview || interview.status !== "in_progress") return;
    const total = interview.duration * 60;
    const elapsed = interview.startedAt
      ? Math.floor((Date.now() - new Date(interview.startedAt).getTime()) / 1000)
      : 0;
    const initial = Math.max(total - elapsed, 0);
    setSecondsLeft(initial);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev == null) return prev;
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          setTimeout(handleTimeUp, 0);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [interview?._id, interview?.status]);

  // initial question generation / resume
  useEffect(() => {
    if (isLoading || !interview || interview.status !== "in_progress") return;

    const last = questions[questions.length - 1];
    if (last && !last.answer) {
      setCurrentQuestion(last);
      return;
    }
    if (last && last.answer) {
      setIsGenerating(true);
      getQuestionMutation.mutate(
        { interviewId: id },
        {
          onSuccess: (response) => setCurrentQuestion(response?.data?.question),
          onSettled: () => setIsGenerating(false),
        }
      );
    }
    if (!last) {
      setIsGenerating(true);
      getQuestionMutation.mutate(
        { interviewId: id },
        {
          onSuccess: (response) => setCurrentQuestion(response?.data?.question),
          onSettled: () => setIsGenerating(false),
        }
      );
    }
  }, [isLoading, interview?._id, questions.length]);

  // GSAP question transition
  useEffect(() => {
    const questionId = currentQuestion?._id;
    if (!questionId || prefersReducedMotion()) return;
    const el = questionRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" }
      );
    }, el);

    return () => ctx.revert();
  }, [currentQuestion?._id]);

  const handleSubmit = () => {
    if (!answerText.trim() || !currentQuestion?._id || isGenerating) return;
    if (submitAnswerMutation.isPending) return;

    submitAnswerMutation.mutate(
      {
        interviewId: id,
        questionId: currentQuestion._id,
        answer: answerText.trim(),
      },
      {
        onSuccess: (response) => {
          setFeedback(response?.data?.feedback || null);
          setCurrentQuestion(response?.data?.nextQuestion || null);
          setAnswerText("");
          queryClient.invalidateQueries({ queryKey: ["interview", id] });
        },
      }
    );
  };

  const handleFinish = () => {
    completeMutation.mutate(id, {
      onSuccess: () => navigate(`/interviews/result/${id}`),
    });
  };

  const handleAbort = () => {
    abortMutation.mutate(id, {
      onSuccess: () => navigate("/interviews"),
    });
  };

  const fmtTime = (total) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <LoaderIcon className="size-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!interview || interview.status === "aborted") {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="max-w-md mx-auto py-32 text-center">
          <AlertTriangleIcon className="size-16 mx-auto text-warning mb-4" />
          <h1 className="text-2xl font-bold mb-2">Interview unavailable</h1>
          <Link to="/interviews" className="btn btn-primary mt-4">
            Back to Interviews
          </Link>
        </div>
      </div>
    );
  }

  const progressPct = Math.min(
    Math.round((answeredCount / (interview.config?.numQuestions || 10)) * 100),
    100
  );
  const timerLow = secondsLeft != null && secondsLeft < 300;

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <Navbar />

      {/* ─── TOP BAR ─── */}
      <div className="bg-base-100 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          {/* Left: title + badges inline */}
          <div className="flex items-center gap-3">
            <div className="icon-tint size-10">
              <BotIcon className="size-5" />
            </div>
            <div>
              <p className="font-bold leading-tight">
                AI Interview · {roleLabel(interview.role)}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-base-content/60">RAG-grounded</span>
                <span className="badge badge-primary badge-xs">Adaptive Difficulty</span>
                {interview.performanceScore != null && (
                  <span className="badge badge-secondary badge-xs">
                    Score {interview.performanceScore.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: progress + timer + finish */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block w-40">
              <div className="flex justify-between text-xs text-base-content/60 mb-1">
                <span>{answeredCount} answered</span>
                <span>{interview.config?.numQuestions || 10} total</span>
              </div>
              <progress className="progress progress-primary w-full" value={progressPct} max="100" />
            </div>

            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold ${
                timerLow ? "bg-error/10 text-error" : "bg-base-200 text-base-content"
              }`}
            >
              <ClockIcon className="size-4" />
              {secondsLeft != null ? fmtTime(secondsLeft) : "--:--"}
            </div>

            <button onClick={() => setShowConfirmEnd(true)} className="btn btn-error btn-sm gap-1">
              <FlagIcon className="size-4" />
              Finish
            </button>
          </div>
        </div>
      </div>

      {/* ─── MAIN 3-COLUMN GRID ─── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_300px] gap-6">
        {/* ─── LEFT: interviewer + progress ─── */}
        <div className="flex flex-col gap-6">
          {/* Question Card */}
          <div
            className={`card bg-base-100 shadow overflow-hidden transition-all duration-300 ${
              isGenerating ? "ai-glow-border border border-primary/30" : "border border-base-300"
            }`}
          >
            <div className="card-body p-6 gap-4">
              {/* Header row: avatar + info + generating badge */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="icon-tint size-12 rounded-full">
                      <BotIcon className="size-6" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 size-3.5 bg-success rounded-full border-2 border-base-100" />
                  </div>
                  <div>
                    <p className="font-bold">AI Interviewer</p>
                    <p className="text-xs text-base-content/60">
                      {roleLabel(interview.role)} · {interview.config?.experienceLevel} level
                    </p>
                  </div>
                </div>

                {/* Pulsing AI badge when generating */}
                {isGenerating && (
                  <span className="ai-generating-badge badge badge-primary gap-1.5 py-1.5 px-3">
                    <SparklesIcon className="size-3.5 animate-spin" />
                    AI Generating…
                  </span>
                )}
              </div>

              {/* Question area */}
              <div ref={questionRef} className="space-y-3">
                {isGenerating ? (
                  <div className="space-y-3">
                    <div className="skeleton h-6 w-3/4 rounded-lg"></div>
                    <div className="skeleton h-6 w-1/2 rounded-lg"></div>
                    <div className="skeleton h-4 w-2/3 rounded-lg"></div>
                  </div>
                ) : currentQuestion ? (
                  <div className="ai-question-fade">
                    {/* Badges: topic + type — inside flex row, won't break layout */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="badge badge-primary badge-sm">
                        {currentQuestion.isFollowUp ? "Follow-up" : "New question"}
                      </span>
                      <span className="badge badge-outline badge-sm">
                        {topicLabel(currentQuestion.topic || currentQuestion.category)}
                      </span>
                    </div>

                    {/* Typewriter text with blinking cursor */}
                    <p className="text-xl sm:text-2xl font-bold leading-snug">
                      {typedQuestion}
                      {!typewriterDone && <span className="ai-cursor" />}
                    </p>
                  </div>
                ) : getQuestionMutation.isError ? (
                  <div className="card bg-error/5 border border-error/20 p-4">
                    <p className="text-sm text-base-content/80 mb-3">
                      {getQuestionMutation.error?.response?.data?.message ||
                        "AI interviewer is temporarily unavailable."}
                    </p>
                    <button
                      onClick={() => {
                        getQuestionMutation.reset();
                        setIsGenerating(true);
                        getQuestionMutation.mutate(
                          { interviewId: id },
                          {
                            onSuccess: (response) =>
                              setCurrentQuestion(response?.data?.question),
                            onSettled: () => setIsGenerating(false),
                          }
                        );
                      }}
                      className="btn btn-primary btn-sm gap-1"
                    >
                      <LoaderIcon className="size-4" />
                      Retry question generation
                    </button>
                  </div>
                ) : (
                  <p className="text-base-content/60">Preparing your interview…</p>
                )}
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <div className="card bg-base-100 shadow border border-base-300">
            <div className="card-body p-6 gap-3">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Interview progress</span>
                <span className="text-base-content/60">
                  {answeredCount} / {interview.config?.numQuestions || 10}
                </span>
              </div>
              <progress
                className="progress progress-primary w-full"
                value={progressPct}
                max="100"
              />
              <div className="flex flex-wrap gap-2 mt-1">
                {questions.map((q, idx) => (
                  <span
                    key={q._id}
                    className={`size-2.5 rounded-full ${
                      q.answer
                        ? "bg-success"
                        : idx === questions.length - 1
                          ? "bg-primary animate-pulse"
                          : "bg-base-300"
                    }`}
                    title={`Q${idx + 1}: ${q.answer ? "answered" : "pending"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── CENTER: answer input ─── */}
        <div className="card bg-base-100 shadow border border-base-300 flex flex-col overflow-hidden">
          <div className="card-body p-6 flex-1 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <MessageSquareTextIcon className="size-5 text-primary" />
              <h2 className="font-bold text-lg">Your Answer</h2>
            </div>

            <textarea
              className="textarea textarea-bordered flex-1 min-h-48 resize-none text-base leading-relaxed"
              placeholder="Answer the question in your own words. Include specific technical details, examples, and reasoning..."
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
              disabled={isGenerating || !currentQuestion}
            />

            {/* Feedback */}
            {feedback && (
              <div className="alert bg-base-200 border border-base-300">
                <div className="flex items-start gap-3">
                  {feedback.correctness === "strong" ? (
                    <CheckCircle2Icon className="size-5 text-success shrink-0 mt-0.5" />
                  ) : feedback.correctness === "weak" ? (
                    <AlertTriangleIcon className="size-5 text-warning shrink-0 mt-0.5" />
                  ) : (
                    <SparklesIcon className="size-5 text-primary shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-sm mb-1">
                      {feedback.correctness === "strong"
                        ? "Strong answer"
                        : feedback.correctness === "weak"
                          ? "Good effort — here's how to go deeper"
                          : "Solid answer"}
                    </p>
                    <p className="text-sm text-base-content/80">{feedback.text}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={
                !answerText.trim() ||
                !currentQuestion ||
                isGenerating ||
                submitAnswerMutation.isPending
              }
              className="btn btn-primary btn-lg w-full gap-2"
            >
              {submitAnswerMutation.isPending ? (
                <>
                  <LoaderIcon className="size-5 animate-spin" />
                  Evaluating with retrieved reference material…
                </>
              ) : (
                <>
                  <SendIcon className="size-5" />
                  Submit Answer
                  <span className="text-xs opacity-70 hidden sm:inline">(Ctrl+Enter)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ─── RIGHT: topic/difficulty/status ─── */}
        <div className="flex flex-col gap-6">
          {/* Current Focus Card */}
          <div className="card bg-base-100 shadow border border-base-300">
            <div className="card-body p-6 gap-4">
              <h3 className="font-bold text-sm uppercase tracking-wide text-base-content/60">
                Current Focus
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base-content/60 text-sm">Topic</span>
                  <span className="badge badge-outline text-xs">
                    {topicLabel(
                      currentQuestion?.topic || interview.currentTopic || "—"
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base-content/60 text-sm">Difficulty</span>
                  <span
                    className={`badge text-xs ${
                      (currentQuestion?.difficulty || interview.currentDifficulty) === "easy"
                        ? "badge-success"
                        : (currentQuestion?.difficulty || interview.currentDifficulty) ===
                            "hard"
                          ? "badge-error"
                          : "badge-warning"
                    }`}
                  >
                    {(
                      currentQuestion?.difficulty ||
                      interview.currentDifficulty ||
                      "medium"
                    )
                      .slice(0, 1)
                      .toUpperCase() +
                      (
                        currentQuestion?.difficulty ||
                        interview.currentDifficulty ||
                        "medium"
                      ).slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base-content/60 text-sm">Adaptive score</span>
                  <span className="font-mono font-bold text-sm">
                    {interview.performanceScore != null
                      ? `${interview.performanceScore.toFixed(1)}/10`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Card */}
          <div className="card bg-base-100 shadow border border-base-300">
            <div className="card-body p-6 gap-3">
              <h3 className="font-bold text-sm uppercase tracking-wide text-base-content/60">
                Tracking
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-base-content/60">Questions asked</span>
                  <span className="font-semibold">{questions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base-content/60">Follow-ups</span>
                  <span className="font-semibold">
                    {questions.filter((q) => q.isFollowUp).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base-content/60">Strong areas</span>
                  <span className="font-semibold">
                    {interview.strongAreas?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base-content/60">Weak areas</span>
                  <span className="font-semibold">
                    {interview.weakAreas?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base-content/60">Started</span>
                  <span className="font-semibold">
                    {interview.startedAt
                      ? formatDistanceToNow(new Date(interview.startedAt), {
                          addSuffix: true,
                        })
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info tip */}
          <div className="alert alert-info text-sm">
            <SparklesIcon className="size-4 shrink-0" />
            <span>
              Each question is grounded in retrieved reference material. No scores are
              shown mid-interview so you can answer naturally.
            </span>
          </div>
        </div>
      </div>

      {/* ─── CONFIRM END MODAL ─── */}
      {showConfirmEnd && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-2xl mb-2">Finish this interview?</h3>
            <p className="text-base-content/70 mb-6">
              Your answers will be evaluated and a performance report will be generated.
              This cannot be undone.
            </p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowConfirmEnd(false)}>
                <XIcon className="size-4" /> Keep going
              </button>
              <button
                className="btn btn-error gap-1"
                onClick={handleFinish}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? (
                  <LoaderIcon className="size-4 animate-spin" />
                ) : (
                  <FlagIcon className="size-4" />
                )}
                Finish &amp; View Report
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setShowConfirmEnd(false)}
          ></div>
        </div>
      )}

      {/* LEAVE MODAL */}
      {abortMutation.isPending && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-xl">Ending interview…</h3>
          </div>
        </div>
      )}

      {/* ABORT link */}
      <div className="pb-6 text-center">
        <button
          onClick={handleAbort}
          className="btn btn-ghost btn-sm text-base-content/50 hover:text-error gap-1"
        >
          <ArrowRightIcon className="size-4 rotate-180" />
          Leave without saving (abort)
        </button>
      </div>
    </div>
  );
}

export default AIInterviewPage;
