import { Link } from "react-router";
import {
  ArrowRightIcon,
  BotIcon,
  CalendarIcon,
  ClockIcon,
  LoaderIcon,
  MessagesSquareIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";
import Navbar from "../components/Navbar";
import InterviewTypeSelector from "../components/InterviewTypeSelector";
import { useListInterviews } from "../hooks/useInterviews";
import { useReveal } from "../lib/animations/useReveal";
import { formatDistanceToNow } from "date-fns";
import { roleLabel } from "../data/interviewConfig";

const statusBadge = (status) => {
  switch (status) {
    case "completed":
      return <span className="badge badge-success badge-sm">Completed</span>;
    case "in_progress":
      return <span className="badge badge-primary badge-sm">In progress</span>;
    default:
      return <span className="badge badge-ghost badge-sm">Aborted</span>;
  }
};

function InterviewsPage() {
  const { data, isLoading } = useListInterviews();
  const revealRef = useReveal();

  const interviews = data?.data?.interviews || [];
  const completedCount = interviews.filter((i) => i.status === "completed").length;

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div ref={revealRef} className="max-w-6xl mx-auto px-4 py-12">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">Interviews</h1>
          <p className="text-base-content/70">
            Choose how you want to interview — with an AI interviewer grounded in retrieval,
            or live with another person.
          </p>
        </div>

        {/* MODE SELECTOR */}
        <div className="reveal mb-12">
          <InterviewTypeSelector />
        </div>

        {/* HISTORY */}
        <div className="reveal">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="icon-tint size-10">
                <MessagesSquareIcon className="size-5" />
              </div>
              <h2 className="text-2xl font-black">Your Interview History</h2>
            </div>
            <span className="badge badge-accent badge-lg">{completedCount} completed</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoaderIcon className="size-10 animate-spin text-primary" />
            </div>
          ) : interviews.length > 0 ? (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body p-0">
                <div className="divide-y divide-base-200">
                  {interviews.map((interview) => (
                    <div key={interview._id} className="flex flex-wrap items-center gap-4 p-5">
                      <div className="icon-tint size-11 shrink-0">
                        {interview.type === "ai" ? (
                          <BotIcon className="size-5" />
                        ) : (
                          <UsersIcon className="size-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-40">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold">{roleLabel(interview.role)}</h3>
                          <span className="badge badge-ghost badge-sm">
                            {interview.type === "ai" ? "AI Interview" : "Human Interview"}
                          </span>
                          {statusBadge(interview.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-base-content/60 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="size-3.5" />
                            {formatDistanceToNow(new Date(interview.startedAt), { addSuffix: true })}
                          </span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="size-3.5" />
                            {interview.duration} min · {interview.questionCount} questions
                          </span>
                        </div>
                      </div>

                      {interview.status === "completed" && interview.score != null ? (
                        <div className="flex items-center gap-2">
                          <TrophyIcon className="size-5 text-warning" />
                          <span className="font-black text-lg">{interview.score}%</span>
                        </div>
                      ) : interview.status === "in_progress" && interview.type === "ai" ? (
                        <Link
                          to={`/interviews/ai/${interview._id}`}
                          className="btn btn-primary btn-sm gap-1"
                        >
                          Resume <ArrowRightIcon className="size-4" />
                        </Link>
                      ) : (
                        <span className="text-sm text-base-content/40">No score</span>
                      )}

                      {(interview.status === "completed" || interview.status === "aborted") && (
                        <Link
                          to={`/interviews/result/${interview._id}`}
                          className="btn btn-outline btn-sm gap-1"
                        >
                          View Result <ArrowRightIcon className="size-4" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 card bg-base-100">
              <div className="icon-tint w-16 h-16 mx-auto mb-4 rounded-full">
                <MessagesSquareIcon className="size-8" />
              </div>
              <p className="text-lg font-semibold opacity-70 mb-1">No interviews yet</p>
              <p className="text-sm opacity-50 mb-6">
                Pick a mode above to conduct your first interview
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InterviewsPage;
