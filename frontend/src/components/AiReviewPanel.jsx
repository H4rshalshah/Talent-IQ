import { useState } from "react";
import {
  AlertTriangleIcon,
  BotIcon,
  CheckCircle2Icon,
  LightbulbIcon,
  LoaderIcon,
  SparklesIcon,
} from "lucide-react";
import { useCodeReview } from "../hooks/useCodeReview";

function AiReviewPanel({ problemId, problemTitle, problemStatement, language, code, testResults, sessionId }) {
  const reviewMutation = useCodeReview();
  const [review, setReview] = useState(null);
  const [error, setError] = useState(null);

  const handleReview = () => {
    setError(null);
    reviewMutation.mutate(
      {
        problemId,
        problemTitle,
        problemStatement,
        language,
        code,
        testResults,
        sessionId,
      },
      {
        onSuccess: (response) => setReview(response?.data?.review),
        onError: (err) => setError(err?.response?.data?.message || "AI review failed"),
      }
    );
  };

  return (
    <div className="h-full bg-base-100 flex flex-col">
      <div className="px-4 py-2 bg-base-200 border-b border-base-300 flex items-center justify-between">
        <span className="font-semibold text-sm flex items-center gap-2">
          <BotIcon className="size-4 text-primary" />
          AI Code Review
        </span>
        <button
          onClick={handleReview}
          disabled={reviewMutation.isPending || !code?.trim()}
          className="btn btn-primary btn-xs gap-1"
        >
          {reviewMutation.isPending ? (
            <>
              <LoaderIcon className="size-3.5 animate-spin" /> Reviewing...
            </>
          ) : (
            <>
              <SparklesIcon className="size-3.5" /> {review ? "Re-review" : "Review Code"}
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {reviewMutation.isPending && (
          <div className="flex items-center gap-2 text-primary text-sm">
            <LoaderIcon className="size-5 animate-spin" />
            Analyzing against reference solutions and optimization patterns...
          </div>
        )}

        {error && (
          <div className="alert alert-warning text-sm">
            <AlertTriangleIcon className="size-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!review && !reviewMutation.isPending && !error && (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto mb-3 bg-primary/10 rounded-2xl flex items-center justify-center">
              <SparklesIcon className="size-8 text-primary/60" />
            </div>
            <p className="text-sm text-base-content/60">
              Get an AI review of your solution: correctness, complexity, code quality, edge cases,
              and optimizations — grounded in reference solutions for this problem.
            </p>
          </div>
        )}

        {review && (
          <>
            {/* SCORES */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-base-200 rounded-xl p-3 text-center">
                <p className="text-3xl font-black text-primary">{review.correctnessScore}/10</p>
                <p className="text-xs text-base-content/60 font-medium">Correctness</p>
              </div>
              <div className="bg-base-200 rounded-xl p-3 text-center">
                <p className="text-3xl font-black text-secondary">{review.codeQualityScore}/10</p>
                <p className="text-xs text-base-content/60 font-medium">Code Quality</p>
              </div>
            </div>

            {/* COMPLEXITY */}
            <div className="bg-base-200 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-base-content/50 mb-2">
                Complexity
              </p>
              <div className="flex gap-6 text-sm">
                <p>
                  Time: <code className="font-mono font-bold">{review.timeComplexity}</code>
                </p>
                <p>
                  Space: <code className="font-mono font-bold">{review.spaceComplexity}</code>
                </p>
              </div>
            </div>

            {/* SUMMARY */}
            {review.summary && (
              <p className="text-sm text-base-content/80 leading-relaxed">{review.summary}</p>
            )}

            {/* ISSUES */}
            {review.issues?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-base-content/50 mb-2 flex items-center gap-1.5">
                  <AlertTriangleIcon className="size-3.5 text-warning" /> Potential Issues
                </p>
                <ul className="space-y-1.5">
                  {review.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-warning mt-0.5">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* EDGE CASES */}
            {review.missingEdgeCases?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-base-content/50 mb-2">
                  Missing Edge Cases
                </p>
                <div className="flex flex-wrap gap-2">
                  {review.missingEdgeCases.map((edge, i) => (
                    <span key={i} className="badge badge-warning badge-outline badge-sm">
                      {edge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* OPTIMIZATION */}
            {review.suggestedOptimization && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-primary mb-2 flex items-center gap-1.5">
                  <LightbulbIcon className="size-3.5" /> Suggested Optimization
                </p>
                <p className="text-sm">{review.suggestedOptimization}</p>
                {(review.optimizedTimeComplexity || review.optimizedSpaceComplexity) && (
                  <p className="text-sm mt-2">
                    Optimized:{" "}
                    <code className="font-mono font-bold">{review.optimizedTimeComplexity || "—"}</code> time ·{" "}
                    <code className="font-mono font-bold">{review.optimizedSpaceComplexity || "—"}</code> space
                  </p>
                )}
              </div>
            )}

            {review.grounded === false && (
              <p className="text-xs text-base-content/40 flex items-center gap-1">
                <CheckCircle2Icon className="size-3.5" /> Reviewed with general knowledge (no reference material
                matched)
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AiReviewPanel;
