import { Link } from "react-router";
import {
  ArrowRightIcon,
  AwardIcon,
  BotIcon,
  CheckCircle2Icon,
  FlameIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useCountUp } from "../lib/animations/useReveal";
import { roleLabel } from "../data/interviewConfig";

function ReadinessCard({ data, isLoading }) {
  const readinessRef = useCountUp(data?.readiness ?? 0, { duration: 1.2 });

  if (isLoading) {
    return (
      <div className="card bg-base-100 border-2 border-primary/20">
        <div className="card-body space-y-4">
          <div className="skeleton h-8 w-48"></div>
          <div className="skeleton h-24 w-full"></div>
          <div className="skeleton h-20 w-full"></div>
        </div>
      </div>
    );
  }

  const latest = data?.latestInterview;

  return (
    <div className="card bg-base-100 border-2 border-primary/20 hover:border-primary/40 transition-colors">
      <div className="card-body">
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="icon-tint size-12">
              <AwardIcon className="size-6" />
            </div>
            <h2 className="text-xl font-black">Interview Readiness</h2>
          </div>
          {/* pill on its own row so it can never overlap the title or wrap
              awkwardly — padded by content, not fixed width */}
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-content whitespace-nowrap">
              <FlameIcon className="size-4" />
              {data?.interviewCount ?? 0} done
            </span>
          </div>
        </div>

        {/* READINESS SCORE */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative size-32 shrink-0">
            <svg viewBox="0 0 120 120" className="size-32 -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="10" className="text-base-300" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#readinessGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(2 * Math.PI * 52 * (data?.readiness ?? 0)) / 100} ${2 * Math.PI * 52}`}
                className="transition-all duration-700"
              />
              <defs>
                <linearGradient id="readinessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--p))" />
                  <stop offset="100%" stopColor="hsl(var(--s))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span ref={readinessRef} className="text-3xl font-black text-primary" />
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-base-content/70">
              <TrendingUpIcon className="size-4 text-success shrink-0" />
              <span className="text-sm font-medium">Based on your interview history</span>
            </div>

            {/* latest interview */}
            {latest ? (
              <Link
                to={`/interviews/result/${latest._id}`}
                className="block card bg-base-200 p-3 hover:border-primary/40 border-2 border-transparent transition-colors"
              >
                <p className="text-xs text-base-content/50 uppercase tracking-wide font-semibold mb-1">
                  Latest Interview
                </p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold min-w-0 truncate">{roleLabel(latest.role)}</span>
                  <span className="badge badge-primary shrink-0">Score: {latest.score ?? "—"}%</span>
                </div>
              </Link>
            ) : (
              <div className="card bg-base-200 p-3">
                <p className="text-sm text-base-content/60">
                  No interviews yet — start an AI interview to get your first score.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* STRONG / IMPROVE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-base-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2Icon className="size-4 text-success shrink-0" />
              <h3 className="font-bold text-sm uppercase tracking-wide text-base-content/60">
                Strong Areas
              </h3>
            </div>
            {data?.strongAreas?.length ? (
              <div className="flex flex-wrap gap-2">
                {data.strongAreas.map((area) => (
                  <span key={area} className="badge badge-success badge-outline">
                    {area}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-base-content/50">Complete an interview to see strengths</p>
            )}
          </div>

          <div className="bg-base-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TriangleAlertIcon className="size-4 text-warning shrink-0" />
              <h3 className="font-bold text-sm uppercase tracking-wide text-base-content/60">
                Improve Next
              </h3>
            </div>
            {data?.weakAreas?.length ? (
              <div className="flex flex-wrap gap-2">
                {data.weakAreas.map((area) => (
                  <span key={area} className="badge badge-warning badge-outline">
                    {area}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-base-content/50">No weak areas detected yet</p>
            )}
          </div>
        </div>

        {/* RECOMMENDED ACTION */}
        <Link
          to="/interviews/ai/configure"
          className="btn btn-primary mt-4 w-full gap-2"
        >
          <BotIcon className="size-5" />
          Start Adaptive AI Interview
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
    </div>
  );
}

export default ReadinessCard;
