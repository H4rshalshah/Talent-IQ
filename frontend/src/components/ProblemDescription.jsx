import { getDifficultyBadgeClass } from "../lib/utils";

function ProblemDescription({ problem, currentProblemId, onProblemChange, allProblems }) {
  return (
    <div className="h-full overflow-y-auto bg-base-200">
      {/* HEADER */}
      <div className="p-6 bg-base-100 border-b border-base-300">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-base-content">{problem.title}</h1>
          <span className={`badge ${getDifficultyBadgeClass(problem.difficulty)}`}>{problem.difficulty}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {problem.tags?.map((tag) => (
            <span key={tag} className="badge badge-ghost badge-sm text-base-content/60">
              {tag}
            </span>
          ))}
        </div>

        {allProblems.length > 0 && (
          <div className="mt-4">
            <select
              className="select select-sm w-full"
              value={currentProblemId}
              onChange={(e) => onProblemChange(e.target.value)}
            >
              {allProblems.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.title} - {p.difficulty}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* DESCRIPTION */}
        <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
          <h2 className="text-lg font-bold text-base-content mb-3">Description</h2>
          <div className="space-y-3 text-base leading-relaxed text-base-content/90">
            {problem.description.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>

        {/* EXAMPLES */}
        {problem.examples?.length > 0 && (
          <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
            <h2 className="text-lg font-bold mb-4 text-base-content">Examples</h2>
            <div className="space-y-4">
              {problem.examples.map((example, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge badge-sm">{idx + 1}</span>
                    <p className="font-semibold text-base-content">Example {idx + 1}</p>
                  </div>
                  <div className="bg-base-200 rounded-lg p-4 font-mono text-sm space-y-1.5">
                    <div className="flex gap-2">
                      <span className="text-primary font-bold min-w-16">Input:</span>
                      <span className="break-all">{example.input}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-primary font-bold min-w-16">Output:</span>
                      <span>{example.output}</span>
                    </div>
                    {example.explanation && (
                      <div className="pt-2 border-t border-base-300 mt-2">
                        <span className="text-base-content/60 font-sans text-xs">
                          <span className="font-semibold">Explanation:</span> {example.explanation}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONSTRAINTS */}
        {problem.constraints?.length > 0 && (
          <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
            <h2 className="text-lg font-bold mb-4 text-base-content">Constraints</h2>
            <ul className="space-y-2 text-base-content/90">
              {problem.constraints.map((constraint, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <code className="text-sm">{constraint}</code>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* SOLUTION APPROACH (collapsed — candidates can peek after attempting) */}
        {problem.solutionApproach && (
          <details className="bg-base-100 rounded-xl shadow-sm border border-base-300 group">
            <summary className="px-5 py-3 font-bold text-base-content cursor-pointer select-none">
              Expected approach
            </summary>
            <div className="px-5 pb-5 text-sm leading-relaxed text-base-content/80 whitespace-pre-line">
              {problem.solutionApproach}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

export default ProblemDescription;
