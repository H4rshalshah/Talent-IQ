import { Link, useParams } from "react-router";
import {
  ArrowRightIcon,
  BotIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  Code2Icon,
  CompassIcon,
  LineChartIcon,
  LoaderIcon,
  TrophyIcon,
  TriangleAlertIcon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";
import Navbar from "../components/Navbar";
import { useInterviewById } from "../hooks/useInterviews";
import { useCountUp, useReveal } from "../lib/animations/useReveal";
import { roleLabel, topicLabel } from "../data/interviewConfig";

function ScoreCard({ label, value, gradient }) {
  const ref = useCountUp(value ?? 0, { duration: 1.1 });
  return (
    <div className="card bg-base-100 border-2 border-base-300">
      <div className="card-body items-center text-center py-5">
        <span ref={ref} className={`text-4xl font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent`} />
        <span className="text-sm text-base-content/60 font-medium">{label}</span>
      </div>
    </div>
  );
}

function QuestionReview({ question, index }) {
  const [open, setOpen] = useState(index === 0);
  const scoreColor =
    question.score >= 7 ? "badge-success" : question.score >= 4 ? "badge-warning" : "badge-error";

  return (
    <div className="card bg-base-100 border-2 border-base-300 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-base-200/50 transition-colors"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="badge badge-ghost badge-sm">Q{index + 1}</span>
            <span className="badge badge-outline badge-sm">
              {question.isFollowUp ? "Follow-up" : topicLabel(question.topic || question.category)}
            </span>
            <span
              className={`badge badge-sm ${
                question.difficulty === "easy"
                  ? "badge-success"
                  : question.difficulty === "hard"
                    ? "badge-error"
                    : "badge-warning"
              }`}
            >
              {question.difficulty}
            </span>
            {question.score != null && <span className={`badge badge-sm ${scoreColor}`}>{question.score}/10</span>}
          </div>
          <p className="font-semibold">{question.question}</p>
        </div>
        <ChevronDownIcon className={`size-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          <div className="bg-base-200 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-base-content/50 mb-1">Your answer</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{question.answer || "No answer submitted"}</p>
          </div>

          {question.evaluation && (
            <div className="bg-base-200 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-base-content/50 mb-2">AI evaluation</p>
              <p className="text-sm leading-relaxed mb-2">{question.evaluation.feedback}</p>
              {question.evaluation.missingConcepts?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {question.evaluation.missingConcepts.map((c) => (
                    <span key={c} className="badge badge-warning badge-outline badge-sm">
                      {c}
                    </span>
                  ))}
                </div>
              )}
              {question.evaluation.strengths?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {question.evaluation.strengths.map((s) => (
                    <span key={s} className="badge badge-success badge-outline badge-sm">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InterviewResultPage() {
  const { id } = useParams();
  const { data, isLoading } = useInterviewById(id);
  const revealRef = useReveal();

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

  const interview = data?.data?.interview;
  const questions = data?.data?.questions || [];
  const performance = data?.data?.performance;
  const submissions = data?.data?.submissions || [];
  const difficultyPath = data?.data?.difficultyPath || [];

  if (!interview) {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="text-center py-32">
          <p className="text-lg font-semibold">Interview not found</p>
          <Link to="/interviews" className="btn btn-primary mt-4">
            Back to Interviews
          </Link>
        </div>
      </div>
    );
  }

  const isAi = interview.type === "ai";
  const session = interview.sessionId;

  // topic distribution
  const topicCounts = new Map();
  for (const q of questions) {
    const t = q.topic || q.category || "general";
    topicCounts.set(t, (topicCounts.get(t) || 0) + 1);
  }
  const topTopics = [...topicCounts.entries()].sort((a, b) => b[1] - a[1]);
  const strongest = topTopics[0]?.[0];
  const weakest = interview.weakAreas?.[0] || topTopics[topTopics.length - 1]?.[0];

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div ref={revealRef} className="max-w-5xl mx-auto px-4 py-12">
        {/* HEADER */}
        <div className="reveal mb-8">
          <div className="flex items-center gap-2 text-base-content/60 text-sm mb-2">
            <Link to="/interviews" className="hover:text-primary">
              Interviews
            </Link>
            <span>/</span>
            <span>Result</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="icon-tint size-14">
              {isAi ? <BotIcon className="size-7" /> : <UsersIcon className="size-7" />}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black">
                {isAi ? roleLabel(interview.role) : session?.problem || "Human Interview"}
              </h1>
              <p className="text-base-content/70">
                {isAi
                  ? `AI Adaptive Interview (RAG-grounded) · ${interview.config?.numQuestions || questions.length} questions`
                  : `Human Interview · ${session?.participant ? "2 participants" : "1 participant"}`}
              </p>
            </div>
            <span className="badge badge-lg badge-primary ml-auto">
              {interview.status === "completed" ? "Completed" : interview.status}
            </span>
          </div>
        </div>

        {isAi && performance ? (
          <>
            {/* SCORES */}
            <div className="reveal grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="card bg-base-100 border-2 border-primary/30 col-span-2 md:col-span-1">
                <div className="card-body items-center text-center py-5">
                  <OverallScore value={performance.overallScore} />
                  <span className="text-sm text-base-content/60 font-medium">Overall Score</span>
                </div>
              </div>
              <ScoreCard label="Technical" value={performance.technicalScore} gradient="from-primary to-secondary" />
              <ScoreCard label="Problem Solving" value={performance.problemSolvingScore} gradient="from-secondary to-accent" />
              <ScoreCard label="Coding" value={performance.codingScore} gradient="from-accent to-primary" />
              <ScoreCard label="Communication" value={performance.communicationScore} gradient="from-success to-primary" />
            </div>

            {/* SUMMARY CHIPS */}
            <div className="reveal grid sm:grid-cols-2 gap-4 mb-8">
              <div className="card bg-base-100 border-2 border-base-300">
                <div className="card-body py-5">
                  <h3 className="font-bold text-sm uppercase tracking-wide text-base-content/60 mb-3">
                    Interview Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Role</span>
                      <span className="font-semibold">{roleLabel(interview.role)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Type</span>
                      <span className="font-semibold">AI Adaptive (RAG-grounded)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Questions</span>
                      <span className="font-semibold">{questions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Follow-ups</span>
                      <span className="font-semibold">{questions.filter((q) => q.isFollowUp).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Average score</span>
                      <span className="font-semibold">
                        {questions.length
                          ? (
                              questions.filter((q) => q.score != null).reduce((a, q) => a + q.score, 0) /
                              Math.max(questions.filter((q) => q.score != null).length, 1)
                            ).toFixed(1)
                          : "—"}
                        /10
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 border-2 border-base-300">
                <div className="card-body py-5">
                  <h3 className="font-bold text-sm uppercase tracking-wide text-base-content/60 mb-3">
                    Difficulty Progression
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    {(difficultyPath.length ? difficultyPath : [interview.difficulty]).map((d, i) => (
                      <span key={`${d}-${i}`} className="flex items-center gap-2">
                        <span
                          className={`badge badge-lg ${
                            d === "easy" ? "badge-success" : d === "hard" ? "badge-error" : "badge-warning"
                          }`}
                        >
                          {d.slice(0, 1).toUpperCase() + d.slice(1)}
                        </span>
                        {i < difficultyPath.length - 1 && <ArrowRightIcon className="size-4 text-base-content/40" />}
                      </span>
                    ))}
                  </div>

                  <h3 className="font-bold text-sm uppercase tracking-wide text-base-content/60 mb-3">
                    Topic Distribution
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {topTopics.map(([topic, count]) => (
                      <span key={topic} className="badge badge-outline">
                        {topicLabel(topic)} × {count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* STRONG / WEAK */}
            <div className="reveal grid sm:grid-cols-2 gap-4 mb-8">
              <div className="card bg-base-100 border-2 border-success/30">
                <div className="card-body py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrophyIcon className="size-5 text-success" />
                    <h3 className="font-bold">Strongest: {strongest ? topicLabel(strongest) : "—"}</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {(performance.strengths || []).map((s) => (
                      <li key={s} className="flex items-start gap-2 text-sm">
                        <CheckCircle2Icon className="size-4 text-success shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="card bg-base-100 border-2 border-warning/30">
                <div className="card-body py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TriangleAlertIcon className="size-5 text-warning" />
                    <h3 className="font-bold">Weakest: {weakest ? topicLabel(weakest) : "—"}</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {(performance.weaknesses || []).map((w) => (
                      <li key={w} className="flex items-start gap-2 text-sm">
                        <TriangleAlertIcon className="size-4 text-warning shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Q&A REVIEW */}
            <div className="reveal mb-8">
              <h2 className="text-2xl font-black mb-4">Questions &amp; Answers</h2>
              <div className="space-y-3">
                {questions.length > 0 ? (
                  questions.map((q, idx) => <QuestionReview key={q._id} question={q} index={idx} />)
                ) : (
                  <p className="text-base-content/60">No questions recorded for this interview.</p>
                )}
              </div>
            </div>

            {/* CODE SUBMISSIONS */}
            {submissions.length > 0 && (
              <div className="reveal mb-8">
                <h2 className="text-2xl font-black mb-4">Code Reviews</h2>
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div key={sub._id} className="card bg-base-100 border-2 border-base-300">
                      <div className="card-body">
                        <div className="flex items-center gap-2 mb-2">
                          <Code2Icon className="size-5 text-primary" />
                          <h3 className="font-bold">{sub.problemTitle}</h3>
                          <span className="badge badge-ghost badge-sm">{sub.language}</span>
                        </div>
                        {sub.aiReview && (
                          <div className="grid sm:grid-cols-2 gap-3 text-sm">
                            <div className="bg-base-200 rounded-lg p-3">
                              <p className="text-xs font-bold uppercase text-base-content/50 mb-1">
                                Complexity
                              </p>
                              <p>
                                Time: <code className="font-mono">{sub.aiReview.timeComplexity}</code> · Space:{" "}
                                <code className="font-mono">{sub.aiReview.spaceComplexity}</code>
                              </p>
                            </div>
                            <div className="bg-base-200 rounded-lg p-3">
                              <p className="text-xs font-bold uppercase text-base-content/50 mb-1">
                                Optimization
                              </p>
                              <p>{sub.aiReview.suggestedOptimization || "—"}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : isAi && interview.status === "in_progress" ? (
          <div className="reveal card bg-base-100 shadow-xl text-center py-16">
            <LoaderIcon className="size-10 mx-auto animate-spin text-primary mb-4" />
            <p className="text-lg font-semibold mb-2">This interview is still in progress</p>
            <Link to={`/interviews/ai/${interview._id}`} className="btn btn-primary mt-2 gap-1">
              Resume Interview <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        ) : (
          /* HUMAN INTERVIEW RESULT */
          <div className="reveal space-y-6">
            <div className="card bg-base-100 border-2 border-base-300">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <Code2Icon className="size-6 text-secondary" />
                  <h2 className="text-xl font-black">Session Summary</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-base-200 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase text-base-content/50 mb-1">Problem</p>
                    <p className="font-semibold">{session?.problem || "—"}</p>
                  </div>
                  <div className="bg-base-200 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase text-base-content/50 mb-1">Difficulty</p>
                    <p className="font-semibold capitalize">{interview.difficulty || "—"}</p>
                  </div>
                  <div className="bg-base-200 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase text-base-content/50 mb-1">Host</p>
                    <p className="font-semibold">{session?.host?.name || "—"}</p>
                  </div>
                  <div className="bg-base-200 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase text-base-content/50 mb-1">Participant</p>
                    <p className="font-semibold">{session?.participant?.name || "Waiting for participant"}</p>
                  </div>
                </div>
                <div className="alert alert-info mt-4">
                  <UsersIcon className="size-5" />
                  <span>
                    Human interviews are conducted live with video, chat, and collaborative coding.
                    No AI score is generated for human-led sessions.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="reveal grid sm:grid-cols-3 gap-4 mt-10">
          <Link to="/performance" className="btn btn-outline gap-2">
            <LineChartIcon className="size-5" /> View Performance
          </Link>
          <Link to="/career-roadmap" className="btn btn-outline gap-2">
            <CompassIcon className="size-5" /> Career Roadmap
          </Link>
          <Link
            to={isAi ? "/interviews/ai/configure" : "/interviews"}
            className="btn btn-primary gap-2"
          >
            New Interview <ArrowRightIcon className="size-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function OverallScore({ value }) {
  const ref = useCountUp(value ?? 0, { duration: 1.4 });
  return (
    <div className="relative">
      <span ref={ref} className="text-5xl font-black text-primary" />
      <span className="text-lg text-base-content/50 font-bold">/100</span>
    </div>
  );
}

export default InterviewResultPage;
