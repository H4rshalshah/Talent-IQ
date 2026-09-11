import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowRightIcon,
  BotIcon,
  CheckCircle2Icon,
  CompassIcon,
  GaugeIcon,
  LineChartIcon,
  LoaderIcon,
  TargetIcon,
  TriangleAlertIcon,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useRoleReadiness } from "../hooks/useRoleReadiness";
import { useCountUp, useReveal } from "../lib/animations/useReveal";
import { ROLES, roleLabel } from "../data/interviewConfig";

const STATUS_META = {
  strong: { label: "Strong", className: "badge-success" },
  developing: { label: "Developing", className: "badge-warning" },
  gap: { label: "Needs work", className: "badge-error" },
  no_data: { label: "No data", className: "badge-ghost" },
};

function SkillRow({ skill }) {
  const meta = STATUS_META[skill.status] || STATUS_META.no_data;
  const score = skill.score ?? 0;

  return (
    <div className="py-3 border-b border-base-300 last:border-b-0">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="font-medium text-sm min-w-0 break-words">{skill.skill}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono font-bold text-sm">
            {skill.score == null ? "—" : `${skill.score}%`}
          </span>
          <span className={`badge badge-sm ${meta.className}`}>{meta.label}</span>
        </div>
      </div>
      <div className="h-2.5 bg-base-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            skill.status === "strong"
              ? "bg-success"
              : skill.status === "gap"
                ? "bg-error"
                : skill.status === "developing"
                  ? "bg-warning"
                  : "bg-base-300"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function RoleReadinessPage() {
  const [role, setRole] = useState("software-engineer");
  const { data, isLoading, isError, error } = useRoleReadiness(role);
  const revealRef = useReveal();

  const readiness = data?.data?.readiness;
  const readinessRef = useCountUp(readiness?.overallReadiness ?? 0, { duration: 1.2 });

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div ref={revealRef} className="max-w-6xl mx-auto px-4 py-12">
        <div className="reveal flex items-center gap-4 mb-8">
          <div className="icon-tint size-14">
            <TargetIcon className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black">Role Readiness</h1>
            <p className="text-base-content/70">
              Your demonstrated skills measured against a target role — computed from your interview
              and coding data only.
            </p>
          </div>
        </div>

        {/* ROLE SELECTOR */}
        <div className="reveal card bg-base-100 border border-base-300 mb-8">
          <div className="card-body py-5">
            <p className="text-sm font-semibold text-base-content/60 uppercase tracking-wide mb-3">
              Target Role
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.slug}
                  onClick={() => setRole(r.slug)}
                  className={`btn btn-sm justify-start ${
                    role === r.slug ? "btn-primary" : "btn-outline"
                  }`}
                  aria-pressed={role === r.slug}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="card bg-base-100 border border-base-300 py-24 flex items-center justify-center">
            <LoaderIcon className="size-10 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="card bg-base-100 border border-base-300 text-center py-16">
            <TriangleAlertIcon className="size-12 mx-auto text-warning mb-3" />
            <p className="font-semibold mb-1">Couldn't compute role readiness</p>
            <p className="text-sm text-base-content/60">
              {error?.response?.data?.message || "Please try again."}
            </p>
          </div>
        ) : !readiness?.sufficientData ? (
          <div className="card bg-base-100 border border-base-300 text-center py-16 px-6">
            <GaugeIcon className="size-14 mx-auto text-primary/40 mb-4" />
            <h2 className="text-xl font-bold mb-2">Not enough data yet</h2>
            <p className="text-base-content/60 mb-1 max-w-xl mx-auto">
              Role readiness is computed from your AI interview answers and coding practice — there is
              no estimation. Complete an interview and solve a few problems to unlock it.
            </p>
            <p className="text-xs text-base-content/40 mb-6">
              Collected so far: {readiness?.dataPoints?.interviews ?? 0} interviews ·{" "}
              {readiness?.dataPoints?.questions ?? 0} evaluated answers ·{" "}
              {readiness?.dataPoints?.solvedProblems ?? 0} problems solved
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/interviews/ai/configure" className="btn btn-primary gap-2">
                <BotIcon className="size-4" />
                Start AI Interview
              </Link>
              <Link to="/practice" className="btn btn-outline gap-2">
                Practice Coding
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* OVERALL */}
            <div className="reveal card bg-base-100 border-2 border-primary/30 mb-8">
              <div className="card-body md:flex-row items-center gap-8">
                <div className="text-center shrink-0">
                  <p className="text-sm text-base-content/60 uppercase tracking-wide font-semibold mb-1">
                    Overall Readiness
                  </p>
                  <div>
                    <span ref={readinessRef} className="text-5xl font-black text-primary" />
                    <span className="text-xl text-base-content/50 font-bold">%</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-black mb-1">{roleLabel(readiness.role)}</h2>
                  <p className="text-sm text-base-content/60">
                    Weighted average of {readiness.skills.filter((s) => s.score != null).length}{" "}
                    measurable skills from {readiness.dataPoints.interviews} interviews and{" "}
                    {readiness.dataPoints.solvedProblems} solved problems.
                  </p>
                  <p className="text-xs text-base-content/40 mt-3 flex items-start gap-1.5">
                    <TriangleAlertIcon className="size-3.5 shrink-0 mt-0.5" />
                    This assessment is generated from your recorded performance and should be treated
                    as guidance, not a hiring decision.
                  </p>
                </div>
              </div>
            </div>

            {/* SKILL MATRIX */}
            <div className="reveal card bg-base-100 border border-base-300 mb-8">
              <div className="card-body">
                <h2 className="text-lg font-black mb-2">Skill Matrix</h2>
                <div>
                  {readiness.skills.map((skill) => (
                    <SkillRow key={skill.skill} skill={skill} />
                  ))}
                </div>
              </div>
            </div>

            {/* STRONG / GAPS */}
            <div className="reveal grid md:grid-cols-2 gap-6 mb-8">
              <div className="card bg-base-100 border-2 border-success/30">
                <div className="card-body py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2Icon className="size-5 text-success" />
                    <h2 className="text-lg font-black">Strong Areas</h2>
                  </div>
                  {readiness.strongAreas.length ? (
                    <div className="flex flex-wrap gap-2">
                      {readiness.strongAreas.map((s) => (
                        <span key={s} className="badge badge-success badge-outline">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-base-content/50">
                      No skill has crossed the strong threshold yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="card bg-base-100 border-2 border-warning/30">
                <div className="card-body py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TriangleAlertIcon className="size-5 text-warning" />
                    <h2 className="text-lg font-black">Needs Improvement</h2>
                  </div>
                  {readiness.gaps.length ? (
                    <div className="flex flex-wrap gap-2">
                      {readiness.gaps.map((s) => (
                        <span key={s} className="badge badge-warning badge-outline">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-base-content/50">
                      Nothing below the readiness bar — keep it up.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* RECOMMENDED ACTIONS */}
            {readiness.recommendedActions.length > 0 && (
              <div className="reveal card bg-base-100 border border-base-300 mb-8">
                <div className="card-body">
                  <h2 className="text-lg font-black mb-4">Recommended Next Steps</h2>
                  <div className="space-y-3">
                    {readiness.recommendedActions.map((item) => (
                      <div key={item.action} className="flex items-start gap-3">
                        <span className="badge badge-primary badge-sm mt-0.5">{item.priority}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{item.action}</p>
                          <p className="text-sm text-base-content/60">{item.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="reveal flex flex-wrap gap-4">
              <Link to="/career-roadmap" className="btn btn-primary gap-2">
                <CompassIcon className="size-5" />
                Build a Roadmap for This Role
              </Link>
              <Link to="/performance" className="btn btn-outline gap-2">
                <LineChartIcon className="size-5" />
                View Performance
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RoleReadinessPage;
