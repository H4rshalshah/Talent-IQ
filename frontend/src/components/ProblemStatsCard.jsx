import { Link } from "react-router";
import { BookmarkIcon, CheckCircle2Icon, Code2Icon, LoaderIcon } from "lucide-react";
import { useProblemProgress } from "../hooks/usePracticeProblems";

function ProblemStatsCard() {
  const { data, isLoading } = useProblemProgress();
  const progress = data?.data;

  return (
    <div className="card bg-base-100 border-2 border-base-300 hover:border-primary/30 transition-colors h-full">
      <div className="card-body">
        <div className="flex items-center gap-3 mb-4">
          <div className="icon-tint size-10">
            <Code2Icon className="size-5" />
          </div>
          <h2 className="text-xl font-black">Problem Progress</h2>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="skeleton h-6 w-full"></div>
            <div className="skeleton h-6 w-2/3"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-base-200 p-3 text-center">
                <CheckCircle2Icon className="size-5 text-success mx-auto mb-1" />
                <div className="text-2xl font-black">{progress?.solved ?? 0}</div>
                <div className="text-xs text-base-content/50">Solved</div>
              </div>
              <div className="rounded-xl bg-base-200 p-3 text-center">
                <Code2Icon className="size-5 text-primary mx-auto mb-1" />
                <div className="text-2xl font-black">{progress?.attempted ?? 0}</div>
                <div className="text-xs text-base-content/50">Attempted</div>
              </div>
              <div className="rounded-xl bg-base-200 p-3 text-center">
                <BookmarkIcon className="size-5 text-warning mx-auto mb-1" />
                <div className="text-2xl font-black">{progress?.bookmarked ?? 0}</div>
                <div className="text-xs text-base-content/50">Bookmarked</div>
              </div>
            </div>

            <Link to="/practice" className="btn btn-ghost btn-sm mt-4 w-full gap-2 border border-base-300">
              Browse Question Bank
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default ProblemStatsCard;
