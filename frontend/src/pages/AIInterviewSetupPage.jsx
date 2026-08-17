import { useState } from "react";
import { useNavigate } from "react-router";
import { BotIcon, ChevronLeftIcon, LoaderIcon, Settings2Icon, SparklesIcon } from "lucide-react";
import Navbar from "../components/Navbar";
import { useCreateAiInterview } from "../hooks/useInterviews";
import {
  DIFFICULTIES,
  DURATIONS,
  EXPERIENCE_LEVELS,
  INTERVIEW_TYPES,
  ROLES,
  topicsForRole,
  topicLabel,
} from "../data/interviewConfig";

function AIInterviewSetupPage() {
  const navigate = useNavigate();
  const createMutation = useCreateAiInterview();

  const [config, setConfig] = useState({
    role: "software-engineer",
    experienceLevel: "mid",
    duration: 30,
    interviewType: "general",
    difficulty: "medium",
    numQuestions: 10,
    topics: [],
  });

  const availableTopics = topicsForRole(config.role);

  const update = (patch) => setConfig((prev) => ({ ...prev, ...patch }));

  const toggleTopic = (topic) => {
    const topics = config.topics.includes(topic)
      ? config.topics.filter((t) => t !== topic)
      : [...config.topics, topic];
    update({ topics });
  };

  const handleRoleChange = (role) => {
    // keep topics that still apply to the new role, drop the rest
    const pool = topicsForRole(role);
    update({ role, topics: config.topics.filter((t) => pool.includes(t)) });
  };

  const handleStart = () => {
    createMutation.mutate(
      { ...config, topics: config.topics.length ? config.topics : availableTopics },
      {
        onSuccess: (response) => {
          const interview = response?.data?.interview;
          if (interview?._id) navigate(`/interviews/ai/${interview._id}`);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <button onClick={() => navigate("/interviews")} className="btn btn-ghost btn-sm mb-6 gap-1">
          <ChevronLeftIcon className="size-4" /> Back to Interviews
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <BotIcon className="size-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black">Configure AI Interview</h1>
            <p className="text-base-content/70">
              The interviewer retrieves reference material and your history before asking anything.
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-6 sm:p-8 space-y-8">
            {/* ROLE */}
            <div>
              <label className="label">
                <span className="label-text font-semibold text-lg">Target Job Role</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ROLES.map((role) => (
                  <button
                    key={role.slug}
                    onClick={() => handleRoleChange(role.slug)}
                    className={`btn btn-outline justify-start h-auto py-3 ${
                      config.role === role.slug ? "btn-primary" : ""
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            {/* EXPERIENCE + DIFFICULTY + DURATION + TYPE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Experience Level</span>
                </label>
                <select
                  className="select w-full"
                  value={config.experienceLevel}
                  onChange={(e) => update({ experienceLevel: e.target.value })}
                >
                  {EXPERIENCE_LEVELS.map((level) => (
                    <option key={level.slug} value={level.slug}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Starting Difficulty</span>
                </label>
                <select
                  className="select w-full"
                  value={config.difficulty}
                  onChange={(e) => update({ difficulty: e.target.value })}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Interview Duration</span>
                </label>
                <select
                  className="select w-full"
                  value={config.duration}
                  onChange={(e) => update({ duration: Number(e.target.value) })}
                >
                  {DURATIONS.map((d) => (
                    <option key={d.minutes} value={d.minutes}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Interview Type</span>
                </label>
                <select
                  className="select w-full"
                  value={config.interviewType}
                  onChange={(e) => update({ interviewType: e.target.value })}
                >
                  {INTERVIEW_TYPES.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* TOPICS */}
            <div>
              <label className="label">
                <span className="label-text font-semibold">Technical Topics</span>
                <span className="label-text-alt">
                  {config.topics.length === 0
                    ? "All topics for this role"
                    : `${config.topics.length} selected`}
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTopics.map((topic) => {
                  const selected = config.topics.includes(topic);
                  return (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`badge badge-lg cursor-pointer transition-colors ${
                        selected ? "badge-primary" : "badge-outline hover:badge-primary/30"
                      }`}
                    >
                      {topicLabel(topic)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* NUM QUESTIONS */}
            <div>
              <label className="label">
                <span className="label-text font-semibold">
                  Number of Questions: <span className="text-primary font-bold">{config.numQuestions}</span>
                </span>
              </label>
              <input
                type="range"
                min={3}
                max={20}
                value={config.numQuestions}
                onChange={(e) => update({ numQuestions: Number(e.target.value) })}
                className="range range-primary"
              />
              <div className="flex justify-between text-xs text-base-content/50 px-1 mt-1">
                <span>3</span>
                <span>10</span>
                <span>20</span>
              </div>
            </div>

            <div className="alert alert-info">
              <Settings2Icon className="size-5" />
              <div>
                <p className="font-semibold">How it works</p>
                <p className="text-sm">
                  The AI interviewer retrieves relevant domain knowledge, reference questions,
                  and your past performance before each question, and adapts difficulty to your
                  answers in real time.
                </p>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={createMutation.isPending}
              className="btn btn-primary btn-lg w-full gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <LoaderIcon className="size-5 animate-spin" />
                  Preparing your interview...
                </>
              ) : (
                <>
                  <SparklesIcon className="size-5" />
                  Start AI Interview
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIInterviewSetupPage;
