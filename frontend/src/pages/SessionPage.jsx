import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useEndSession, useJoinSession, useSessionById } from "../hooks/useSessions";
import { useProblem } from "../hooks/usePracticeProblems";
import { PROBLEMS } from "../data/problems";
import { executeCode } from "../lib/piston";
import Navbar from "../components/Navbar";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { getDifficultyBadgeClass } from "../lib/utils";
import { Loader2Icon, LogOutIcon, PhoneOffIcon } from "lucide-react";
import { LANGUAGE_CONFIG } from "../data/problems";
import CodeEditorPanel from "../components/CodeEditorPanel";
import OutputPanel from "../components/OutputPanel";
import AiReviewPanel from "../components/AiReviewPanel";

import useStreamClient from "../hooks/useStreamClient";
import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";
import VideoCallUI from "../components/VideoCallUI";

function SessionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const { data: sessionData, isLoading: loadingSession, refetch } = useSessionById(id);

  const joinSessionMutation = useJoinSession();
  const endSessionMutation = useEndSession();

  const session = sessionData?.session;
  const isHost = session?.host?.clerkId === user?.id;
  const isParticipant = session?.participant?.clerkId === user?.id;

  const { call, channel, chatClient, isInitializingCall, streamClient } = useStreamClient(
    session,
    loadingSession,
    isHost,
    isParticipant
  );

  // resolve the problem from the backend library (covers the full Codeforces
  // bank + in-house problems); falls back to the legacy static list by title.
  const { data: problemDetail } = useProblem(session?.problemSlug || "");
  const dbProblem = problemDetail?.data?.problem;
  const staticProblem = session?.problem
    ? Object.values(PROBLEMS).find((p) => p.title === session.problem)
    : null;
  const problemData = dbProblem || staticProblem;

  // Codeforces-sourced problems have no statement/starter code in our DB —
  // the room links out instead (licensing). The editor is replaced with a
  // notice, but video + chat keep working normally.
  const isExternalProblem = Boolean(problemData?.source === "codeforces");

  // normalize backend problem docs into the shape SessionPage renders
  // (description text/notes, examples, constraints, expectedOutput per lang)
  const normalizedProblem = problemData?.source
    ? {
        ...problemData,
        description: {
          text: problemData.description || "",
          notes: [],
        },
        category: problemData.tags?.[0] || "",
        expectedOutput:
          problemData.expectedOutput && problemData.starterCode
            ? Object.fromEntries(Object.keys(problemData.starterCode).map((l) => [l, problemData.expectedOutput]))
            : problemData.expectedOutput,
      }
    : problemData;

  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState(problemData?.starterCode?.[selectedLanguage] || "");
  const [activeTab, setActiveTab] = useState("output");

  // auto-join session if user is not already a participant and not the host
  useEffect(() => {
    if (!session || !user || loadingSession) return;
    if (isHost || isParticipant) return;

    joinSessionMutation.mutate(id, { onSuccess: refetch });

    // joinSessionMutation and refetch intentionally excluded to avoid an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, user, loadingSession, isHost, isParticipant, id]);

  // redirect the "participant" when session ends
  useEffect(() => {
    if (!session || loadingSession) return;

    if (session.status === "completed") navigate("/dashboard");
  }, [session, loadingSession, navigate]);

  // update code when problem loads or changes
  useEffect(() => {
    if (problemData?.starterCode?.[selectedLanguage]) {
      setCode(problemData.starterCode[selectedLanguage]);
    }
  }, [problemData, selectedLanguage]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    // use problem-specific starter code
    const starterCode = problemData?.starterCode?.[newLang] || "";
    setCode(starterCode);
    setOutput(null);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(null);

    const result = await executeCode(selectedLanguage, code);
    setOutput(result);
    setIsRunning(false);
  };

  const handleEndSession = () => {
    // turn camera + mic off first so the devices are released the moment the
    // session ends (the browser indicator turns off immediately)
    (async () => {
      try {
        if (call) {
          try {
            await call.camera?.disable();
          } catch (e) {
            /* already off */
          }
          try {
            await call.microphone?.disable();
          } catch (e) {
            /* already off */
          }
        }
      } catch (e) {
        /* best effort */
      }
      // this will navigate the HOST to dashboard
      endSessionMutation.mutate(id, { onSuccess: () => navigate("/dashboard") });
    })();
  };

  return (
    <div className="h-screen bg-base-100 flex flex-col">
      <Navbar />

      <div className="flex-1">
        <PanelGroup direction="horizontal">
          {/* LEFT PANEL - CODE EDITOR & PROBLEM DETAILS */}
          <Panel defaultSize={50} minSize={30}>
            <PanelGroup direction="vertical">
              {/* PROBLEM DSC PANEL */}
              <Panel defaultSize={50} minSize={20}>
                <div className="h-full overflow-y-auto bg-base-200">
                  {/* HEADER SECTION */}
                  <div className="p-6 bg-base-100 border-b border-base-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <h1 className="text-3xl font-bold text-base-content">
                          {session?.problem || "Loading..."}
                        </h1>
                        {normalizedProblem?.category && (
                          <p className="text-base-content/60 mt-1">{normalizedProblem.category}</p>
                        )}
                        {isExternalProblem && problemData?.rating && (
                          <p className="text-base-content/60 mt-1">
                            Codeforces · Rating {problemData.rating} ·{" "}
                            {(problemData.tags || []).slice(0, 4).join(", ")}
                          </p>
                        )}
                        <p className="text-base-content/60 mt-2">
                          Host: {session?.host?.name || "Loading..."} •{" "}
                          {session?.participant ? 2 : 1}/2 participants
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`badge badge-lg ${getDifficultyBadgeClass(
                            session?.difficulty
                          )}`}
                        >
                          {session?.difficulty.slice(0, 1).toUpperCase() +
                            session?.difficulty.slice(1) || "Easy"}
                        </span>
                        {isExternalProblem && problemData?.url && (
                          <a
                            href={problemData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm gap-1"
                          >
                            Open on Codeforces
                          </a>
                        )}
                        {isHost && session?.status === "active" && (
                          <button
                            onClick={handleEndSession}
                            disabled={endSessionMutation.isPending}
                            className="btn btn-error btn-sm gap-2"
                          >
                            {endSessionMutation.isPending ? (
                              <Loader2Icon className="w-4 h-4 animate-spin" />
                            ) : (
                              <LogOutIcon className="w-4 h-4" />
                            )}
                            End Session
                          </button>
                        )}
                        {session?.status === "completed" && (
                          <span className="badge badge-ghost badge-lg">Completed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* problem desc */}
                    {normalizedProblem?.description?.text && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Description</h2>
                        <div className="space-y-3 text-base leading-relaxed">
                          <p className="text-base-content/90">{normalizedProblem.description.text}</p>
                          {normalizedProblem.description.notes?.map((note, idx) => (
                            <p key={idx} className="text-base-content/90">
                              {note}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* examples section */}
                    {normalizedProblem?.examples && normalizedProblem.examples.length > 0 && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Examples</h2>

                        <div className="space-y-4">
                          {normalizedProblem.examples.map((example, idx) => (
                            <div key={idx}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="badge badge-sm">{idx + 1}</span>
                                <p className="font-semibold text-base-content">Example {idx + 1}</p>
                              </div>
                              <div className="bg-base-200 rounded-lg p-4 font-mono text-sm space-y-1.5">
                                <div className="flex gap-2">
                                  <span className="text-primary font-bold min-w-[70px]">
                                    Input:
                                  </span>
                                  <span>{example.input}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-secondary font-bold min-w-[70px]">
                                    Output:
                                  </span>
                                  <span>{example.output}</span>
                                </div>
                                {example.explanation && (
                                  <div className="pt-2 border-t border-base-300 mt-2">
                                    <span className="text-base-content/60 font-sans text-xs">
                                      <span className="font-semibold">Explanation:</span>{" "}
                                      {example.explanation}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Constraints */}
                    {normalizedProblem?.constraints && normalizedProblem.constraints.length > 0 && (
                      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                        <h2 className="text-xl font-bold mb-4 text-base-content">Constraints</h2>
                        <ul className="space-y-2 text-base-content/90">
                          {normalizedProblem.constraints.map((constraint, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-primary">•</span>
                              <code className="text-sm">{constraint}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

              <Panel defaultSize={50} minSize={20}>
                <PanelGroup direction="vertical">
                  <Panel defaultSize={70} minSize={30}>
                    {isExternalProblem ? (
                      <div className="h-full flex items-center justify-center bg-base-100">
                        <div className="card bg-base-200 shadow-sm max-w-md w-full mx-6">
                          <div className="card-body items-center text-center">
                            <p className="font-bold text-lg">Problem hosted on Codeforces</p>
                            <p className="text-base-content/70 text-sm">
                              This room uses a Codeforces problem. Open it in a new tab to read
                              the statement and solve it — you can still discuss and share your
                              screen with the video call on the right.
                            </p>
                            {problemData?.url && (
                              <a
                                href={problemData.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary gap-1"
                              >
                                Open on Codeforces
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <CodeEditorPanel
                        selectedLanguage={selectedLanguage}
                        languages={
                          problemData
                            ? Object.keys(problemData.starterCode || {}).filter(
                                (l) => LANGUAGE_CONFIG[l]?.executable
                              )
                            : []
                        }
                        code={code}
                        isRunning={isRunning}
                        onLanguageChange={handleLanguageChange}
                        onCodeChange={(value) => setCode(value)}
                        onRunCode={handleRunCode}
                      />
                    )}
                  </Panel>

                  <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

                  <Panel defaultSize={30} minSize={15}>
                    {isExternalProblem ? (
                      <div className="h-full flex items-center justify-center bg-base-100 text-base-content/40 text-sm px-6 text-center">
                        Code editor is available for in-house problems — for Codeforces
                        problems, solve on the Codeforces site and share your screen.
                      </div>
                    ) : (
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
                            problemId={problemData?.id || session?.problem}
                            problemTitle={session?.problem}
                            problemStatement={`${problemData?.description?.text || ""} ${(problemData?.description?.notes || []).join(" ")}`}
                            language={selectedLanguage}
                            code={code}
                            testResults={output}
                            sessionId={session?._id}
                          />
                        )}
                      </div>
                    </div>
                    )}
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-2 bg-base-300 hover:bg-primary transition-colors cursor-col-resize" />

          {/* RIGHT PANEL - VIDEO CALLS & CHAT */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full bg-base-200 p-4 overflow-auto">
              {isInitializingCall ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
                    <p className="text-lg">Connecting to video call...</p>
                  </div>
                </div>
              ) : !streamClient || !call ? (
                <div className="h-full flex items-center justify-center">
                  <div className="card bg-base-100 shadow-xl max-w-md">
                    <div className="card-body items-center text-center">
                      <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mb-4">
                        <PhoneOffIcon className="w-12 h-12 text-error" />
                      </div>
                      <h2 className="card-title text-2xl">Connection Failed</h2>
                      <p className="text-base-content/70">Unable to connect to the video call</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <StreamVideo client={streamClient}>
                    <StreamCall call={call}>
                      <VideoCallUI chatClient={chatClient} channel={channel} />
                    </StreamCall>
                  </StreamVideo>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default SessionPage;
