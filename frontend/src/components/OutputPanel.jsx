import { AlertTriangleIcon, CheckCircle2Icon, PlayIcon, XCircleIcon } from "lucide-react";

const formatArg = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

/** Human label for a run/submit result. */
function StatusBadge({ output }) {
  const { status, passedCount = 0, totalCount = 0, timeMs } = output;

  if (status === "solved" || status === "passed") {
    return (
      <span className="flex items-center gap-2 text-sm font-semibold text-success">
        <CheckCircle2Icon className="size-4" />
        {status === "solved" ? "Accepted" : "Sample tests passed"} · {passedCount}/{totalCount}
        {timeMs ? <span className="font-normal text-base-content/50">{timeMs}ms</span> : null}
      </span>
    );
  }

  if (status === "attempted" || status === "failed") {
    return (
      <span className="flex items-center gap-2 text-sm font-semibold text-warning">
        <XCircleIcon className="size-4" />
        {passedCount}/{totalCount} tests passed
        {timeMs ? <span className="font-normal text-base-content/50">{timeMs}ms</span> : null}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2 text-sm font-semibold text-error">
      <AlertTriangleIcon className="size-4" />
      Execution error
    </span>
  );
}

function TestCaseRow({ test, index }) {
  const input = (test.args || []).map(formatArg).join(", ");
  return (
    <div
      className={`rounded-lg border p-3 text-sm ${
        test.passed
          ? "border-success/30 bg-success/5"
          : "border-error/40 bg-error/5"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {test.passed ? (
          <CheckCircle2Icon className="size-4 text-success shrink-0" />
        ) : (
          <XCircleIcon className="size-4 text-error shrink-0" />
        )}
        <span className="font-semibold">
          {test.passed ? "Passed" : "Failed"} test {index + 1}
        </span>
      </div>
      <div className="font-mono text-xs space-y-1 break-all">
        <div>
          <span className="text-base-content/50">Input:</span> {input || "—"}
        </div>
        <div>
          <span className="text-base-content/50">Expected:</span> {test.expected}
        </div>
        {!test.passed && (
          <div className="text-error">
            <span className="text-base-content/50">Actual:</span> {test.actual || "(no output)"}
          </div>
        )}
      </div>
    </div>
  );
}

function OutputPanel({ output }) {
  const hasTests = Array.isArray(output?.results) && output.results.length > 0;

  return (
    <div className="h-full bg-base-100 flex flex-col">
      <div className="px-4 py-2 bg-base-200 border-b border-base-300 flex items-center justify-between gap-3 min-h-10">
        <span className="font-semibold text-sm">Output</span>
        {output ? <StatusBadge output={output} /> : null}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {output === null ? (
          <p className="text-base-content/50 text-sm flex items-center gap-2">
            <PlayIcon className="size-4" />
            Run your code against the sample tests, or submit for full judging.
          </p>
        ) : (
          <>
            {hasTests && (
              <div className="space-y-2">
                {output.results.map((test, i) => (
                  <TestCaseRow key={i} test={test} index={i} />
                ))}
              </div>
            )}

            {output.error && (
              <pre className="text-xs font-mono text-error whitespace-pre-wrap bg-error/5 border border-error/30 rounded-lg p-3">
                {output.error}
              </pre>
            )}

            {/* Raw stdout is useful for the collaborative editor and when a
                program prints extra diagnostics. */}
            {(output.stdout || output.output) && !hasTests && (
              <pre className="text-sm font-mono whitespace-pre-wrap text-base-content">
                {output.stdout || output.output}
              </pre>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default OutputPanel;
