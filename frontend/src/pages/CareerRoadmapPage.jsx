import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  CompassIcon,
  LoaderIcon,
  RefreshCwIcon,
  SparklesIcon,
  TriangleAlertIcon,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useCareerRoadmap, useGenerateCareerRoadmap } from "../hooks/useCareerRoadmap";
import { useCountUp, useReveal } from "../lib/animations/useReveal";
import { ROLES, roleLabel } from "../data/interviewConfig";

function CareerRoadmapPage() {
  const { data, isLoading } = useCareerRoadmap();
  const generateMutation = useGenerateCareerRoadmap();
  const revealRef = useReveal();

  const [selectedRole, setSelectedRole] = useState("software-engineer");

  const roadmap = data?.data?.roadmap;
  const readinessRef = useCountUp(roadmap?.readiness ?? 0, { duration: 1.3 });

  const handleGenerate = (role) => {
    generateMutation.mutate({ role, experienceLevel: "mid" });
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

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div ref={revealRef} className="max-w-5xl mx-auto px-4 py-12">
        {/* HEADER */}
        <div className="reveal flex items-center gap-4 mb-8">
          <div className="icon-tint icon-tint-warning size-14">
            <CompassIcon className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black">AI Career Coach</h1>
            <p className="text-base-content/70">
              A personalized improvement roadmap grounded in your actual interview performance
            </p>
          </div>
        </div>

        {!roadmap ? (
          /* GENERATE FORM */
          <div className="reveal card bg-base-100 shadow-xl">
            <div className="card-body p-8">
              <div className="flex items-center gap-2 mb-4">
                <SparklesIcon className="size-5 text-warning" />
                <h2 className="text-xl font-black">Generate your roadmap</h2>
              </div>
              <p className="text-base-content/70 mb-6">
                Pick your target role. Your roadmap is built from your interview history, skill gaps,
                and retrieved learning material — not generic advice.
              </p>

              <label className="label">
                <span className="label-text font-semibold">Target Role</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {ROLES.map((role) => (
                  <button
                    key={role.slug}
                    onClick={() => setSelectedRole(role.slug)}
                    className={`btn btn-outline justify-start h-auto py-3 ${
                      selectedRole === role.slug ? "btn-primary" : ""
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleGenerate(selectedRole)}
                disabled={generateMutation.isPending}
                className="btn btn-primary btn-lg w-full gap-2"
              >
                {generateMutation.isPending ? (
                  <>
                    <LoaderIcon className="size-5 animate-spin" />
                    Building your roadmap from interview data...
                  </>
                ) : (
                  <>
                    <CompassIcon className="size-5" />
                    Generate Personalized Roadmap
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* READINESS HEADER */}
            <div className="reveal card bg-base-100 border-2 border-primary/30 mb-8">
              <div className="card-body md:flex-row items-center gap-8">
                <div className="text-center">
                  <p className="text-sm text-base-content/60 uppercase tracking-wide font-semibold mb-1">
                    Current Readiness
                  </p>
                  <div>
                    <span ref={readinessRef} className="text-5xl font-black text-primary" />
                    <span className="text-xl text-base-content/50 font-bold">%</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-xl font-black mb-1">Your Target Role</h2>
                    <p className="text-base-content/70">{roleLabel(roadmap.targetRole)}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-success mb-2">
                        Strong Skills
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(roadmap.strongSkills || []).map((s) => (
                          <span key={s} className="badge badge-success badge-outline">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-warning mb-2">
                        Needs Improvement
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(roadmap.skillGaps || []).map((s) => (
                          <span key={s} className="badge badge-warning badge-outline">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleGenerate(roadmap.targetRole)}
                  disabled={generateMutation.isPending}
                  className="btn btn-outline btn-sm gap-1"
                >
                  {generateMutation.isPending ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : (
                    <RefreshCwIcon className="size-4" />
                  )}
                  Regenerate
                </button>
              </div>
            </div>

            {/* RECOMMENDATIONS */}
            {(roadmap.recommendations || []).length > 0 && (
              <div className="reveal card bg-base-100 shadow-lg mb-8">
                <div className="card-body">
                  <h2 className="text-lg font-black mb-4">Recommended Actions</h2>
                  <div className="space-y-3">
                    {roadmap.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="badge badge-primary badge-lg mt-0.5">{i + 1}</span>
                        <p className="text-base-content/80">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ROADMAP WEEKS */}
            <h2 className="reveal text-2xl font-black mb-4">Your Roadmap</h2>
            <div className="space-y-4">
              {(roadmap.roadmap || []).map((week) => (
                <div key={week.week} className="reveal card bg-base-100 shadow-lg">
                  <div className="card-body">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="icon-tint size-10 font-black">
                        {week.week}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Week {week.week}: {week.title}</h3>
                        <p className="text-sm text-base-content/50">Focus areas for this week</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {(week.topics || []).map((t) => (
                        <span key={t} className="badge badge-outline">
                          {t}
                        </span>
                      ))}
                    </div>

                    {(week.resources || []).length > 0 && (
                      <div className="bg-base-200 rounded-xl p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-base-content/50 mb-2 flex items-center gap-1.5">
                          <BookOpenIcon className="size-3.5" /> Learning resources
                        </p>
                        <ul className="space-y-1.5">
                          {week.resources.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2Icon className="size-4 text-primary shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="reveal mt-8 flex flex-wrap gap-4">
              <Link to="/interviews/ai/configure" className="btn btn-primary gap-1">
                Practice with an AI Interview <ArrowRightIcon className="size-4" />
              </Link>
              <Link to="/practice" className="btn btn-outline gap-1">
                Practice Coding <ArrowRightIcon className="size-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CareerRoadmapPage;
