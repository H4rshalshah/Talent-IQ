import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeftIcon, LoaderIcon, PlusIcon, UsersIcon, VideoIcon } from "lucide-react";
import Navbar from "../components/Navbar";
import { useActiveSessions, useCreateSession } from "../hooks/useSessions";
import { useUser } from "@clerk/clerk-react";
import { usePracticeProblems } from "../hooks/usePracticeProblems";
import { getDifficultyBadgeClass } from "../lib/utils";

function HumanInterviewLobbyPage() {
  const navigate = useNavigate();
  const { user } = useUser();

  const createSessionMutation = useCreateSession();
  const { data: activeSessionsData, isLoading: loadingActiveSessions } = useActiveSessions();

  const [problem, setProblem] = useState("");
  const [problemSlug, setProblemSlug] = useState("");
  const [difficulty, setDifficulty] = useState("");
  // in-house problems first, then the most-solved Codeforces problems so the
  // picker covers the whole library instead of the old 5 hardcoded titles
  const { data: customData, isLoading: loadingCustom } = usePracticeProblems({
    page: 1,
    limit: 100,
    source: "custom",
  });
  const { data: cfData, isLoading: loadingCf } = usePracticeProblems({
    page: 1,
    limit: 100,
    source: "codeforces",
    sort: "solved",
  });
  const loadingProblems = loadingCustom || loadingCf;
  const problems = [
    ...(customData?.data?.problems || []),
    ...(cfData?.data?.problems || []),
  ];

  const activeSessions = activeSessionsData?.sessions || [];

  const isUserInSession = (session) => {
    if (!user?.id) return false;
    return session.host?.clerkId === user.id || session.participant?.clerkId === user.id;
  };

  const handleProblemChange = (e) => {
    const selected = problems.find((p) => p.slug === e.target.value);
    setProblem(selected?.title || "");
    setProblemSlug(selected?.slug || "");
    // Session difficulty only accepts easy/medium/hard
    const d = String(selected?.difficulty || "").toLowerCase();
    setDifficulty(d === "expert" ? "hard" : d);
  };

  const handleCreate = () => {
    if (!problem || !difficulty) return;
    createSessionMutation.mutate(
      { problem, problemSlug, difficulty },
      {
        onSuccess: (data) => navigate(`/session/${data.session._id}`),
      }
    );
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <button onClick={() => navigate("/interviews")} className="btn btn-ghost btn-sm mb-6 gap-1">
          <ChevronLeftIcon className="size-4" /> Back to Interviews
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <div className="icon-tint size-14">
            <UsersIcon className="size-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black">Human Interview Lobby</h1>
            <p className="text-base-content/70">
              Create a live 1-on-1 interview room or join one that's waiting for a participant.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* CREATE ROOM */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-secondary/10 rounded-xl">
                  <VideoIcon className="size-5 text-secondary" />
                </div>
                <h2 className="text-xl font-black">Create Interview Room</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Select Problem</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  {loadingProblems ? (
                    <div className="flex items-center gap-2 text-sm text-base-content/60 py-2">
                      <LoaderIcon className="size-4 animate-spin" />
                      Loading problems...
                    </div>
                  ) : (
                    <select
                      className="select w-full"
                      value={problemSlug || problem}
                      onChange={handleProblemChange}
                    >
                      <option value="" disabled>
                        Choose a coding problem...
                      </option>
                      {problems.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.title} · {p.difficulty}
                          {p.source === "codeforces" ? ` · CF ${p.rating || ""}` : " · In-house"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {difficulty && (
                  <div className="alert alert-success">
                    <div>
                      <p className="font-semibold">Room Summary</p>
                      <p>
                        Problem: <span className="font-medium">{problem}</span> ·{" "}
                        <span className={`badge badge-sm ${getDifficultyBadgeClass(difficulty)}`}>
                          {difficulty}
                        </span>
                      </p>
                      <p className="text-sm opacity-80">1-on-1 session · video, chat & coding</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCreate}
                  disabled={!problem || !difficulty || createSessionMutation.isPending}
                  className="btn btn-primary w-full gap-2"
                >
                  {createSessionMutation.isPending ? (
                    <>
                      <LoaderIcon className="size-5 animate-spin" />
                      Creating room...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="size-5" />
                      Create Room &amp; Invite
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* JOIN ROOM */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <UsersIcon className="size-5 text-accent" />
                </div>
                <h2 className="text-xl font-black">Join an Active Session</h2>
              </div>

              {loadingActiveSessions ? (
                <div className="flex items-center justify-center py-16">
                  <LoaderIcon className="size-8 animate-spin text-primary" />
                </div>
              ) : activeSessions.length > 0 ? (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {activeSessions.map((session) => {
                    const full = session.participant && !isUserInSession(session);
                    return (
                      <div key={session._id} className="card bg-base-200 border-2 border-base-300 p-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <p className="font-bold truncate">{session.problem}</p>
                            <div className="flex items-center gap-3 text-sm text-base-content/60 mt-1">
                              <span className={`badge badge-sm ${getDifficultyBadgeClass(session.difficulty)}`}>
                                {session.difficulty.slice(0, 1).toUpperCase() + session.difficulty.slice(1)}
                              </span>
                              <span>{session.participant ? "2/2" : "1/2"} participants</span>
                              <span className="hidden sm:inline">Host: {session.host?.name}</span>
                            </div>
                          </div>
                          {full ? (
                            <button className="btn btn-disabled btn-sm">Full</button>
                          ) : (
                            <button
                              onClick={() => navigate(`/session/${session._id}`)}
                              className="btn btn-primary btn-sm gap-1"
                            >
                              {isUserInSession(session) ? "Rejoin" : "Join"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <UsersIcon className="size-12 mx-auto text-base-content/30 mb-3" />
                  <p className="font-semibold opacity-70">No active sessions</p>
                  <p className="text-sm opacity-50">Create a room on the left to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HumanInterviewLobbyPage;
