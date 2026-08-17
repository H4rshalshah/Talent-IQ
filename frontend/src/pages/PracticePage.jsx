import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  BookmarkIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Code2Icon,
  ExternalLinkIcon,
  LoaderIcon,
  SearchIcon,
  ServerIcon,
  StarIcon,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { getDifficultyBadgeClass, formatSolvedCount } from "../lib/utils";
import {
  usePracticeProblems,
  useProblemProgress,
  useSyncCodeforces,
  useToggleBookmark,
} from "../hooks/usePracticeProblems";

const SOURCES = [
  { key: "", label: "All" },
  { key: "codeforces", label: "Codeforces" },
  { key: "custom", label: "In-House" },
];

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert"];

const RATING_BANDS = [
  { label: "All ratings", min: null, max: null },
  { label: "800–1000", min: 800, max: 1000 },
  { label: "1000–1200", min: 1000, max: 1200 },
  { label: "1200–1400", min: 1200, max: 1400 },
  { label: "1400–1600", min: 1400, max: 1600 },
  { label: "1600–1800", min: 1600, max: 1800 },
  { label: "1800–2000", min: 1800, max: 2000 },
  { label: "2000+", min: 2000, max: null },
];

function ProblemCard({ problem }) {
  const bookmarkMutation = useToggleBookmark();
  const isExternal = problem.source !== "custom";

  return (
    <div className="card bg-base-100 border border-base-300 hover:border-primary/40 transition-colors">
      <div className="card-body p-4 sm:p-5">
        {/* TOP ROW */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {problem.rating != null && (
              <span className="badge badge-ghost badge-sm gap-1 shrink-0">
                <StarIcon className="size-3" />
                {problem.rating}
              </span>
            )}
            <span className={`badge badge-sm shrink-0 ${getDifficultyBadgeClass(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
            <span
              className={`badge badge-sm shrink-0 ${
                isExternal ? "badge-primary badge-outline" : "badge-secondary badge-outline"
              }`}
            >
              {isExternal ? "Codeforces" : "In-House"}
            </span>
          </div>
          <button
            onClick={() => bookmarkMutation.mutate(problem.slug)}
            title={problem.bookmarked ? "Remove bookmark" : "Bookmark this problem"}
            aria-label={problem.bookmarked ? "Remove bookmark" : "Bookmark this problem"}
            className={`btn btn-ghost btn-sm btn-circle shrink-0 ${
              problem.bookmarked ? "text-warning" : "text-base-content/30 hover:text-base-content/60"
            }`}
          >
            <BookmarkIcon className="size-4" fill={problem.bookmarked ? "currentColor" : "none"} />
          </button>
        </div>

        {/* TITLE */}
        <h3 className="font-bold text-base leading-snug mt-1 break-words">{problem.title}</h3>
        <p className="text-xs text-base-content/50 font-mono">
          {isExternal ? (
            <>
              {problem.externalId} · {formatSolvedCount(problem.solvedCount)} solved
            </>
          ) : (
            <>
              {problem.languages?.length || 0} languages · {problem.solvedCount > 0 ? `${problem.solvedCount} solved` : "solve in the built-in editor"}
            </>
          )}
        </p>

        {/* PRIMARY TAG */}
        <div className="mt-2">
          {problem.tags?.[0] ? (
            <span className="badge badge-ghost badge-sm text-base-content/70">{problem.tags[0]}</span>
          ) : (
            <span className="text-xs text-base-content/40">No tags</span>
          )}
        </div>

        {/* ACTION — both sources open the detail page; Codeforces problems
            show the statement on Codeforces from there (never a dead link) */}
        <div className="card-actions mt-3 pt-3 border-t border-base-300">
          <Link to={`/problem/${problem.slug}`} className="btn btn-primary btn-sm w-full gap-2">
            {isExternal ? (
              <>
                View Problem
                <ExternalLinkIcon className="size-3.5" />
              </>
            ) : (
              <>
                <Code2Icon className="size-4" />
                Solve in Editor
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}

function PracticePage() {
  const [source, setSource] = useState("");
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [tag, setTag] = useState("");
  const [bandIndex, setBandIndex] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 24;

  const band = RATING_BANDS[bandIndex];

  const filters = useMemo(
    () => ({
      source: source || undefined,
      q: q.trim() || undefined,
      difficulty: difficulty || undefined,
      tag: tag || undefined,
      minRating: source === "custom" ? undefined : (band.min ?? undefined),
      maxRating: source === "custom" ? undefined : (band.max ?? undefined),
      page,
      limit,
    }),
    [source, q, difficulty, tag, bandIndex, band.min, band.max, page]
  );

  const { data, isLoading, isError, refetch, isFetching } = usePracticeProblems(filters);
  const { data: progressData } = useProblemProgress();
  const syncMutation = useSyncCodeforces();

  const problems = data?.data?.problems || [];
  const pagination = data?.data?.pagination || { total: 0, totalPages: 0, page: 1 };

  const allTags = useMemo(() => {
    const set = new Set();
    for (const p of problems) for (const t of p.tags || []) set.add(t);
    return [...set].slice(0, 24).sort();
  }, [problems]);

  const resetPage = (fn) => (v) => {
    setPage(1);
    fn(v);
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Practice Problems</h1>
            <p className="text-base-content/70 mt-1">
              Competitive programming problems from Codeforces plus in-house problems with a
              built-in editor.
              {progressData?.data ? (
                <span className="ml-2 text-sm font-medium text-success">
                  {progressData.data.solved} solved · {progressData.data.bookmarked} bookmarked
                </span>
              ) : null}
            </p>
          </div>

          {/* Admin sync */}
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="btn btn-ghost btn-sm gap-2 border border-base-300"
            title="Re-sync the problem bank from the Codeforces API (admins only)"
          >
            <ServerIcon className="size-4" />
            {syncMutation.isPending ? "Syncing…" : "Sync from Codeforces"}
          </button>
        </div>

        {/* SOURCE TABS */}
        <div className="flex gap-2 mb-4">
          {SOURCES.map((s) => (
            <button
              key={s.key || "all"}
              onClick={() => {
                setSource(s.key);
                setPage(1);
              }}
              className={`btn btn-sm ${source === s.key ? "btn-primary" : "btn-ghost border border-base-300"}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* FILTERS */}
        <div className="card bg-base-100 border border-base-300 mb-6">
          <div className="card-body py-4 gap-3">
            {/* SEARCH + DIFFICULTY */}
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <SearchIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => resetPage(setQ)(e.target.value)}
                  placeholder="Search by title, contest id, or index…"
                  className="input input-bordered input-sm w-full pl-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {["", ...DIFFICULTIES].map((d) => (
                  <button
                    key={d || "all"}
                    onClick={() => resetPage(setDifficulty)(d)}
                    className={`btn btn-sm ${difficulty === d ? "btn-primary" : "btn-ghost"}`}
                  >
                    {d || "All"}
                  </button>
                ))}
              </div>
            </div>

            {/* RATING BANDS (hidden for in-house only) */}
            {source !== "custom" && (
              <div className="flex flex-wrap gap-1.5">
                {RATING_BANDS.map((b, i) => (
                  <button
                    key={b.label}
                    onClick={() => {
                      setPage(1);
                      setBandIndex(i);
                    }}
                    className={`badge badge-sm ${bandIndex === i ? "badge-primary" : "badge-ghost cursor-pointer"}`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}

            {/* TOPICS */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => resetPage(setTag)("")}
                  className={`badge badge-sm ${!tag ? "badge-primary" : "badge-ghost cursor-pointer"}`}
                >
                  All topics
                </button>
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => resetPage(setTag)(tag === t ? "" : t)}
                    className={`badge badge-sm ${tag === t ? "badge-primary" : "badge-ghost cursor-pointer"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RESULTS */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card bg-base-100 border border-base-300">
                <div className="card-body p-5 space-y-3">
                  <div className="skeleton h-5 w-24"></div>
                  <div className="skeleton h-5 w-full"></div>
                  <div className="skeleton h-4 w-2/3"></div>
                  <div className="skeleton h-9 w-full mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="card bg-base-100 border border-base-300 py-16 text-center">
            <p className="text-base-content/60 mb-4">
              Couldn't load the problem bank. Try again, and if it stays empty ask an admin to run
              "Sync from Codeforces".
            </p>
            <button onClick={() => refetch()} className="btn btn-primary btn-sm">
              Retry
            </button>
          </div>
        ) : problems.length === 0 ? (
          <div className="card bg-base-100 border border-base-300 py-16 text-center">
            <StarIcon className="size-10 mx-auto text-base-content/30 mb-3" />
            <p className="text-base-content/60 mb-4">No problems match your filters.</p>
            {pagination.total === 0 && source !== "custom" && (
              <button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="btn btn-primary btn-sm mx-auto gap-2"
              >
                <ServerIcon className="size-4" />
                {syncMutation.isPending ? "Syncing…" : "Sync from Codeforces"}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-base-content/50">
                {pagination.total} problems{isFetching ? " · updating…" : ""}
              </p>
              <div className="flex items-center gap-4 text-sm text-base-content/60">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2Icon className="size-4 text-success" />
                  {problems.filter((p) => p.status === "solved").length} solved here
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {problems.map((problem) => (
                <ProblemCard key={problem.slug} problem={problem} />
              ))}
            </div>

            {/* PAGINATION */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn btn-ghost btn-sm border border-base-300 gap-1"
                >
                  <ChevronLeftIcon className="size-4" /> Prev
                </button>
                <span className="text-sm text-base-content/60">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="btn btn-ghost btn-sm border border-base-300 gap-1"
                >
                  Next <ChevronRightIcon className="size-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PracticePage;
