import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Navbar from "../components/Navbar";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ProblemDescription from "../components/ProblemDescription";
import OutputPanel from "../components/OutputPanel";
import CodeEditorPanel from "../components/CodeEditorPanel";
import AiReviewPanel from "../components/AiReviewPanel";
import { LANGUAGE_CONFIG } from "../data/languages";
import {
  useProblem,
  usePracticeProblems,
  useRunProblem,
  useSubmitProblem,
} from "../hooks/usePracticeProblems";

import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { AlertTriangleIcon, ExternalLinkIcon, LoaderIcon, StarIcon } from "lucide-react";
import { getDifficultyBadgeClass, formatSolvedCount } from "../lib/utils";
import { prefersReducedMotion } from "../lib/animations/gsap.setup";

function ProblemPage() {
  // NOTE: the route is declared as "/problem/:id", so the param is `id`.
  const { id: slug } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useProblem(slug);
  // dropdown lists only in-house problems (the ones with an editor)
  const { data: listData } = usePracticeProblems({ source: "custom", page: 1, limit: 100 });
  const runMutation = useRunProblem();
  const submitMutation = useSubmitProblem();

  const problem = data?.data?.problem;
  const allProblems = listData?.data?.problems || [];

  const languages = useMemo(
    () =>
      problem
        ? Object.keys(problem.starterCode || {}).filter((l) => LANGUAGE_CONFIG[l]?.executable)
        : [],
    [problem]
  );

  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState(null);
  const [activeTab, setActiveTab] = useState("output");

  // load starter code once the problem arrives / language changes
  useEffect(() => {
    if (!problem) return;
    const lang = languages.includes(selectedLanguage) ? selectedLanguage : languages[0];
    if (!lang) return;
    setSelectedLanguage(lang);
    setCode(problem.starterCode[lang]);
    setOutput(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.slug]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    setCode(problem.starterCode[newLang]);
    setOutput(null);
  };

  const handleProblemChange = (newSlug) => navigate(`/problem/${newSlug}`);

  // purely celebratory — skipped entirely when the user prefers reduced motion
  const triggerConfetti = () => {
    if (prefersReducedMotion()) return;
    confetti({ particleCount: 80, spread: 250, origin: { x: 0.2, y: 0.6 } });
    confetti({ particleCount: 80, spread: 250, origin: { x: 0.8, y: 0.6 } });
  };

  const handleRunCode = () => {
    if (!problem || !code.trim()) return;
    setOutput(null);
    setActiveTab("output");

    runMutation.mutate(
      { slug: problem.slug, language: selectedLanguage, code },
      {
        onSuccess: (response) => {
          const res = response?.data;
          setOutput(res);
          if (res?.error) {
            toast.error("Code execution failed — check the error output");
          } else if (res?.status === "passed") {
            triggerConfetti();
            toast.success(`All ${res.totalCount} sample tests passed!`);
          } else {
            toast.error(`${res?.passedCount ?? 0}/${res?.totalCount ?? 0} sample tests passed`);
          }
        },
      }
    );
  };

  const handleSubmit = () => {
    if (!problem || !code.trim()) return;
    setActiveTab("output");

    submitMutation.mutate(
      { slug: problem.slug, language: selectedLanguage, code },
      {
        onSuccess: (response) => {
          const res = response?.data;
          setOutput(res);
          if (res?.status === "solved") {
            triggerConfetti();
            toast.success(`Accepted — all ${res.totalCount} tests passed!`);
          } else if (res?.error) {
            toast.error("Compilation or runtime error");
          } else {
            toast.error(`${res?.passedCount ?? 0}/${res?.totalCount ?? 0} tests passed`);
          }
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-base-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoaderIcon className="size-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-screen bg-base-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <AlertTriangleIcon className="size-12 mx-auto text-warning mb-3" />
            <p className="font-semibold mb-1">Couldn't load this problem</p>
            <p className="text-sm text-base-content/60 mb-4">
              {error?.response?.data?.message || "Please try again."}
            </p>
            <button onClick={() => refetch()} className="btn btn-primary btn-sm">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="h-screen bg-base-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-base-content/60">
          Problem not found.
        </div>
      </div>
    );
  }

  // external problems (Codeforces) have no editor/judge — link out instead
  if (problem.source && problem.source !== "custom") {
    return (
      <div className="h-screen bg-base-100 flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`badge ${getDifficultyBadgeClass(problem.difficulty)}`}>{problem.difficulty}</span>
              <span className="badge badge-primary badge-outline">Codeforces</span>
              {problem.rating ? <span className="badge badge-ghost gap-1"><StarIcon className="size-3" />{problem.rating}</span> : null}
              <span className="badge badge-ghost">{formatSolvedCount(problem.solvedCount)} solved</span>
            </div>
            <h1 className="text-3xl font-bold mb-1">{problem.title}</h1>
            <p className="text-sm text-base-content/50 font-mono mb-6">
              {problem.externalId} · Contest {problem.contestId}
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {(problem.tags || []).map((t) => (
                <span key={t} className="badge badge-ghost">{t}</span>
              ))}
            </div>
            <p className="text-base-content/70 mb-6">
              This problem is hosted on Codeforces. Open it there to read the statement and submit
              your solution with Codeforces' own judge.
            </p>
            <a
              href={problem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary gap-2"
            >
              Practice on Codeforces
              <ExternalLinkIcon className="size-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-base-100 flex flex-col">
      <Navbar />

      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal">
          {/* LEFT: problem description */}
          <Panel defaultSize={40} minSize={30}>
            <ProblemDescription
              problem={problem}
              currentProblemId={problem.slug}
              onProblemChange={handleProblemChange}
              allProblems={allProblems}
            />
          </Panel>

          <PanelResizeHandle className="w-2 bg-base-300 hover:bg-primary transition-colors cursor-col-resize" />

          {/* RIGHT: editor + output */}
          <Panel defaultSize={60} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={30}>
                <CodeEditorPanel
                  selectedLanguage={selectedLanguage}
                  languages={languages}
                  code={code}
                  isRunning={runMutation.isPending}
                  onLanguageChange={handleLanguageChange}
                  onCodeChange={setCode}
                  onRunCode={handleRunCode}
                  onSubmit={handleSubmit}
                  isSubmitting={submitMutation.isPending}
                />
              </Panel>

              <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

              <Panel defaultSize={30} minSize={25}>
                <div className="h-full flex flex-col">
                  <div className="flex bg-base-200 border-b border-base-300">
                    <button
                      onClick={() => setActiveTab("output")}
                      className={`px-4 py-2 text-sm font-semibold border-b-2 ${
                        activeTab === "output"
                          ? "border-primary text-primary"
                          : "border-transparent text-base-content/50"
                      }`}
                    >
                      Output
                    </button>
                    <button
                      onClick={() => setActiveTab("review")}
                      className={`px-4 py-2 text-sm font-semibold border-b-2 ${
                        activeTab === "review"
                          ? "border-primary text-primary"
                          : "border-transparent text-base-content/50"
                      }`}
                    >
                      AI Review
                    </button>
                  </div>
                  <div className="flex-1 min-h-0">
                    {activeTab === "output" ? (
                      <OutputPanel output={output} />
                    ) : (
                      <AiReviewPanel
                        problemId={problem.slug}
                        problemTitle={problem.title}
                        problemStatement={problem.description || ""}
                        language={selectedLanguage}
                        code={code}
                        testResults={output}
                      />
                    )}
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default ProblemPage;
