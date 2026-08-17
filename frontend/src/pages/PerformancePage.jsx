import { Link } from "react-router";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CompassIcon,
  LineChartIcon,
  LoaderIcon,
  TrophyIcon,
  TriangleAlertIcon,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { usePerformance } from "../hooks/usePerformance";
import { useCountUp, useReveal } from "../lib/animations/useReveal";
import { SkillBars, TrendChart } from "../components/charts";
import { roleLabel } from "../data/interviewConfig";
import { format } from "date-fns";

function PerformancePage() {
  const { data, isLoading, isError, error } = usePerformance();
  const revealRef = useReveal();

  const perf = data?.data;
  const overallRef = useCountUp(perf?.overallScore ?? 0, { duration: 1.4 });

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

  const skillItems = perf?.skillBreakdown
    ? [
        { label: "Technical Knowledge", value: perf.skillBreakdown.technicalKnowledge },
        { label: "Problem Solving", value: perf.skillBreakdown.problemSolving },
        { label: "Coding", value: perf.skillBreakdown.coding },
        { label: "Communication", value: perf.skillBreakdown.communication },
        { label: "CS Fundamentals", value: perf.skillBreakdown.csFundamentals },
      ]
    : [];

  const history = perf?.history || [];
  const trendLabels = history.map((_, i) => `#${i + 1}`);

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div ref={revealRef} className="max-w-6xl mx-auto px-4 py-12">
        {/* HEADER */}
        <div className="reveal flex items-center gap-4 mb-8">
          <div className="icon-tint size-14">
            <LineChartIcon className="size-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black">Performance Dashboard</h1>
            <p className="text-base-content/70">Track your interview scores and skill growth over time</p>
          </div>
        </div>

        {isError ? (
          <div className="reveal card bg-base-100 shadow-xl text-center py-16">
            <TriangleAlertIcon className="size-12 mx-auto text-warning mb-3" />
            <p className="font-semibold mb-2">Couldn't load performance data</p>
            <p className="text-sm text-base-content/60">{error?.response?.data?.message || "Please try again"}</p>
          </div>
        ) : perf?.interviewCount === 0 ? (
          <div className="reveal card bg-base-100 shadow-xl text-center py-20">
            <TrophyIcon className="size-14 mx-auto text-primary/40 mb-4" />
            <h2 className="text-xl font-bold mb-2">No performance data yet</h2>
            <p className="text-base-content/60 mb-6">
              Complete an AI interview to unlock your performance dashboard.
            </p>
            <Link to="/interviews/ai/configure" className="btn btn-primary gap-1">
              Start AI Interview <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* OVERALL + SKILLS */}
            <div className="reveal grid lg:grid-cols-3 gap-6 mb-8">
              <div className="card bg-base-100 border-2 border-primary/30">
                <div className="card-body items-center justify-center text-center">
                  <p className="text-sm text-base-content/60 uppercase tracking-wide font-semibold mb-2">
                    Overall Score
                  </p>
                  <div>
                    <span ref={overallRef} className="text-6xl font-black text-primary" />
                    <span className="text-xl text-base-content/50 font-bold">/100</span>
                  </div>
                  <p className="text-sm text-base-content/60 mt-2">{perf.interviewCount} interviews completed</p>
                </div>
              </div>

              <div className="lg:col-span-2 card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h2 className="text-lg font-black mb-4">Skill Breakdown</h2>
                  <SkillBars items={skillItems} />
                </div>
              </div>
            </div>

            {/* TREND */}
            {history.length >= 2 && (
              <div className="reveal card bg-base-100 shadow-lg mb-8">
                <div className="card-body">
                  <h2 className="text-lg font-black mb-4">Performance Trends</h2>
                  <TrendChart points={history.map((h) => h.score ?? 0)} labels={trendLabels} />
                  <p className="text-xs text-base-content/50 mt-2">
                    Score progression:{" "}
                    {history.map((h, i) => `Interview ${i + 1} → ${h.score ?? 0}`).join(" · ")}
                  </p>
                </div>
              </div>
            )}

            {/* STRENGTHS / WEAKNESSES */}
            <div className="reveal grid md:grid-cols-2 gap-6 mb-8">
              <div className="card bg-base-100 border-2 border-success/30">
                <div className="card-body">
                  <div className="flex items-center gap-2 mb-3">
                    <TrophyIcon className="size-5 text-success" />
                    <h2 className="text-lg font-black">Strengths</h2>
                  </div>
                  {perf.strengths?.length ? (
                    <ul className="space-y-2">
                      {perf.strengths.map((s) => (
                        <li key={s} className="flex items-start gap-2 text-sm">
                          <CheckCircle2Icon className="size-4 text-success shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-base-content/50">Complete more interviews to detect strengths</p>
                  )}
                </div>
              </div>

              <div className="card bg-base-100 border-2 border-warning/30">
                <div className="card-body">
                  <div className="flex items-center gap-2 mb-3">
                    <TriangleAlertIcon className="size-5 text-warning" />
                    <h2 className="text-lg font-black">Weak Areas</h2>
                  </div>
                  {perf.weaknesses?.length ? (
                    <ul className="space-y-2">
                      {perf.weaknesses.map((w) => (
                        <li key={w} className="flex items-start gap-2 text-sm">
                          <TriangleAlertIcon className="size-4 text-warning shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-base-content/50">No weak areas detected yet</p>
                  )}
                  <Link to="/career-roadmap" className="btn btn-outline btn-sm mt-4 gap-1">
                    <CompassIcon className="size-4" />
                    Get improvement plan
                  </Link>
                </div>
              </div>
            </div>

            {/* HISTORY TABLE */}
            <div className="reveal card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="text-lg font-black mb-4">Interview History</h2>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Role</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th className="text-right">Score</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h) => (
                        <tr key={h._id} className="hover">
                          <td>{format(new Date(h.createdAt), "MMM d, yyyy")}</td>
                          <td>
                            <span className="badge badge-ghost badge-sm">
                              {h.type === "ai" ? "AI" : "Human"}
                            </span>
                          </td>
                          <td className="font-medium">{roleLabel(h.role)}</td>
                          <td>{h.duration ?? "—"} min</td>
                          <td>
                            <span
                              className={`badge badge-sm ${
                                h.status === "completed" ? "badge-success" : "badge-warning"
                              }`}
                            >
                              {h.status}
                            </span>
                          </td>
                          <td className="text-right font-bold">{h.score ?? "—"}</td>
                          <td className="text-right">
                            <Link
                              to={`/interviews/result/${h.interviewId}`}
                              className="btn btn-ghost btn-xs gap-1"
                            >
                              Details <ArrowRightIcon className="size-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PerformancePage;
