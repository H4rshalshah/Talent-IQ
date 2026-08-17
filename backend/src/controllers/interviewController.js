import Interview from "../models/Interview.js";
import InterviewQuestion from "../models/InterviewQuestion.js";
import Performance from "../models/Performance.js";
import CodeSubmission from "../models/CodeSubmission.js";
import CareerRoadmap from "../models/CareerRoadmap.js";
import { generateQuestion, evaluateAnswer, isAiInterviewAvailable } from "../services/ai/interview.service.js";
import { generatePerformanceReport } from "../services/ai/evaluation.service.js";
import { ingestCandidateHistory } from "../services/rag/ingestion.service.js";
import { ROLES, roleLabel } from "../services/ai/topics.js";

const VALID_DIFFICULTIES = ["easy", "medium", "hard"];
const VALID_EXPERIENCE = ["entry", "mid", "senior"];

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function loadOwnedInterview(interviewId, userId) {
  const interview = await Interview.findById(interviewId);
  if (!interview) return { error: "Interview not found", status: 404 };
  if (interview.candidate.toString() !== userId.toString()) {
    return { error: "You do not have access to this interview", status: 403 };
  }
  return { interview };
}

async function seedCandidateState(interview) {
  // Pull recurring weak/strong areas from the candidate's past AI interviews
  // so the first question is already grounded in history (candidate-history RAG).
  try {
    const past = await Interview.find({
      candidate: interview.candidate,
      type: "ai",
      status: "completed",
      _id: { $ne: interview._id },
    })
      .sort({ completedAt: -1 })
      .limit(5)
      .select("weakAreas strongAreas");

    const weak = new Map();
    const strong = new Map();
    for (const p of past) {
      for (const w of p.weakAreas || []) weak.set(w, (weak.get(w) || 0) + 1);
      for (const s of p.strongAreas || []) strong.set(s, (strong.get(s) || 0) + 1);
    }
    // topics that recurred as weak across >= 2 interviews
    interview.weakAreas = [...weak.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic)
      .slice(0, 5);
    interview.strongAreas = [...strong.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic)
      .slice(0, 5);
    await interview.save();
  } catch (error) {
    console.warn("⚠️ Could not seed candidate state:", error.message);
  }
}

// ---------------------------------------------------------------------------
// AI interview endpoints
// ---------------------------------------------------------------------------

export async function createAiInterview(req, res) {
  try {
    const {
      role,
      experienceLevel = "mid",
      duration = 30,
      interviewType = "general",
      difficulty = "medium",
      topics = [],
      numQuestions = 10,
    } = req.body;

    if (!role || !ROLES.some((r) => r.slug === role)) {
      return fail(res, "A valid job role is required");
    }
    if (!VALID_EXPERIENCE.includes(experienceLevel)) return fail(res, "Invalid experience level");
    if (!VALID_DIFFICULTIES.includes(difficulty)) return fail(res, "Invalid difficulty");
    if (!Number.isFinite(duration) || duration < 5 || duration > 120) {
      return fail(res, "Duration must be between 5 and 120 minutes");
    }
    if (!Number.isFinite(numQuestions) || numQuestions < 3 || numQuestions > 30) {
      return fail(res, "Number of questions must be between 3 and 30");
    }
    if (!Array.isArray(topics) || topics.length > 12) {
      return fail(res, "Topics must be an array with at most 12 items");
    }

    const interview = await Interview.create({
      candidate: req.user._id,
      type: "ai",
      role,
      difficulty,
      duration,
      status: "in_progress",
      startedAt: new Date(),
      config: {
        experienceLevel,
        interviewType,
        topics: topics.filter(Boolean),
        numQuestions: Math.round(numQuestions),
      },
      currentDifficulty: difficulty,
    });

    await seedCandidateState(interview);

    return ok(res, { interview }, 201);
  } catch (error) {
    console.error("Error in createAiInterview:", error.message);
    return fail(res, "Unable to create AI interview", 500);
  }
}

/**
 * Generate + persist the next question for an interview.
 * @returns {Promise<InterviewQuestion|null>}
 */
async function createNextQuestion(interview, { isFollowUp = false, lastQuestion, lastAnswer, evaluation } = {}) {
  const count = await InterviewQuestion.countDocuments({ interviewId: interview._id });

  const generated = await generateQuestion(interview, { isFollowUp, lastQuestion, lastAnswer, evaluation });
  await interview.save(); // persist adaptive state changes

  const questionDoc = await InterviewQuestion.create({
    interviewId: interview._id,
    question: generated.question,
    category: generated.category,
    topic: generated.topic,
    difficulty: generated.difficulty,
    isFollowUp: generated.isFollowUp,
    order: count,
    retrievedContextIds: generated.retrievedContextIds || [],
    grounded: generated.grounded !== false,
  });

  return questionDoc;
}

export async function getAiQuestion(req, res) {
  try {
    const { interviewId } = req.body;
    if (!interviewId) return fail(res, "interviewId is required");

    const { interview, error, status } = await loadOwnedInterview(interviewId, req.user._id);
    if (error) return fail(res, error, status);

    if (interview.status !== "in_progress") return fail(res, "Interview is not in progress", 400);

    const questions = await InterviewQuestion.find({ interviewId: interview._id }).sort({ order: 1 });
    const last = questions[questions.length - 1];

    // re-fetch path: last question not yet answered -> return it as-is
    if (last && !last.answer) {
      return ok(res, { question: last });
    }

    // otherwise generate the next question from the adaptive state
    const next = await createNextQuestion(interview);
    return ok(res, { question: next });
  } catch (error) {
    console.error("Error in getAiQuestion:", error.message);
    if (/temporarily unavailable/i.test(error.message)) {
      return fail(res, error.message, 503);
    }
    return fail(res, "Unable to generate interview question", 500);
  }
}

export async function submitAiAnswer(req, res) {
  try {
    const { interviewId, questionId, answer } = req.body;
    if (!interviewId || !questionId) return fail(res, "interviewId and questionId are required");
    if (!answer || typeof answer !== "string" || answer.trim().length < 3) {
      return fail(res, "Please provide an answer");
    }
    if (answer.length > 20000) return fail(res, "Answer is too long");

    const { interview, error, status } = await loadOwnedInterview(interviewId, req.user._id);
    if (error) return fail(res, error, status);
    if (interview.status !== "in_progress") return fail(res, "Interview is not in progress", 400);

    const question = await InterviewQuestion.findOne({ _id: questionId, interviewId: interview._id });
    if (!question) return fail(res, "Question not found", 404);
    if (question.answer) return fail(res, "This question has already been answered", 400);

    // ---- evaluate (RAG-grounded) + update adaptive state ----
    const { evaluation } = await evaluateAnswer(interview, question, answer.trim());
    await interview.save();

    question.answer = answer.trim();
    question.score = evaluation.score;
    question.evaluation = evaluation;
    question.retrievedContextIds = evaluation.retrievedContextIds || [];
    question.grounded = evaluation.grounded !== false;
    await question.save();

    // ---- decide next step deterministically from the score ----
    // strong -> deeper follow-up on same topic; weak -> simpler conceptual
    // question; otherwise -> move to a new topic.
    let isFollowUp = false;
    if (evaluation.score >= 7) isFollowUp = true;
    else if (evaluation.score <= 4) isFollowUp = true;

    const next = await createNextQuestion(interview, {
      isFollowUp,
      lastQuestion: question.question,
      lastAnswer: answer.trim(),
      evaluation,
    });

    return ok(res, {
      feedback: {
        text: evaluation.feedback,
        correctness: evaluation.correctness,
        strengths: evaluation.strengths || [],
      },
      nextQuestion: next,
    });
  } catch (error) {
    console.error("Error in submitAiAnswer:", error.message);
    if (/temporarily unavailable/i.test(error.message)) {
      return fail(res, error.message, 503);
    }
    return fail(res, "Unable to evaluate answer", 500);
  }
}

export async function completeAiInterview(req, res) {
  try {
    const { interviewId } = req.body;
    if (!interviewId) return fail(res, "interviewId is required");

    const { interview, error, status } = await loadOwnedInterview(interviewId, req.user._id);
    if (error) return fail(res, error, status);
    if (interview.status === "completed") {
      const existing = await Performance.findOne({ interviewId: interview._id });
      return ok(res, { interview, performance: existing });
    }

    const questions = await InterviewQuestion.find({ interviewId: interview._id }).sort({ order: 1 });
    const answered = questions.filter((q) => q.score != null);

    if (answered.length === 0) {
      return fail(res, "No questions were answered in this interview", 400);
    }

    const report = await generatePerformanceReport(interview, questions);

    // unique performance doc per interview
    const performance = await Performance.findOneAndUpdate(
      { interviewId: interview._id },
      {
        candidate: interview.candidate,
        technicalScore: report.technicalScore,
        codingScore: report.codingScore,
        communicationScore: report.communicationScore,
        problemSolvingScore: report.problemSolvingScore,
        overallScore: report.overallScore,
        strengths: report.strengths,
        weaknesses: report.weaknesses,
        summary: report.summary,
      },
      { upsert: true, new: true }
    );

    // ground future interviews in this one via candidate-history collection
    try {
      await ingestCandidateHistory({
        candidateId: interview.candidate,
        interviewId: interview._id,
        answers: questions.map((q) => ({
          question: q.question,
          answer: q.answer,
          score: q.score,
          category: q.topic || q.category,
        })),
        weakAreas: interview.weakAreas,
        strongAreas: interview.strongAreas,
      });
    } catch (err) {
      console.warn("⚠️ Candidate history ingestion failed:", err.message);
    }

    interview.status = "completed";
    interview.completedAt = new Date();
    interview.score = report.overallScore;
    await interview.save();

    return ok(res, { interview, performance });
  } catch (error) {
    console.error("Error in completeAiInterview:", error.message);
    return fail(res, "Unable to complete interview", 500);
  }
}

export async function abortInterview(req, res) {
  try {
    const { id } = req.params;
    const { interview, error, status } = await loadOwnedInterview(id, req.user._id);
    if (error) return fail(res, error, status);

    interview.status = "aborted";
    interview.completedAt = new Date();
    await interview.save();
    return ok(res, { interview });
  } catch (error) {
    console.error("Error in abortInterview:", error.message);
    return fail(res, "Unable to abort interview", 500);
  }
}

// ---------------------------------------------------------------------------
// shared interview endpoints (human + AI)
// ---------------------------------------------------------------------------

export async function listInterviews(req, res) {
  try {
    const interviews = await Interview.find({ candidate: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("sessionId", "problem difficulty status");

    const performances = await Performance.find({
      interviewId: { $in: interviews.map((i) => i._id) },
    }).select("overallScore interviewId");

    const scoreMap = new Map(performances.map((p) => [p.interviewId.toString(), p.overallScore]));

    const data = interviews.map((i) => ({
      _id: i._id,
      type: i.type,
      role: i.role,
      roleLabel: roleLabel(i.role),
      difficulty: i.difficulty,
      status: i.status,
      score: scoreMap.get(i._id.toString()) ?? i.score,
      duration: i.duration,
      startedAt: i.startedAt,
      completedAt: i.completedAt,
      sessionId: i.sessionId,
      questionCount: i.questionHistory?.length || 0,
    }));

    return ok(res, { interviews: data });
  } catch (error) {
    console.error("Error in listInterviews:", error.message);
    return fail(res, "Unable to load interviews", 500);
  }
}

export async function getInterviewById(req, res) {
  try {
    const { id } = req.params;
    const { interview, error, status } = await loadOwnedInterview(id, req.user._id);
    if (error) return fail(res, error, status);

    const [questions, performance, submissions] = await Promise.all([
      InterviewQuestion.find({ interviewId: interview._id }).sort({ order: 1 }),
      Performance.findOne({ interviewId: interview._id }),
      CodeSubmission.find({ interviewId: interview._id }).sort({ createdAt: -1 }),
    ]);

    if (interview.sessionId) {
      await interview.populate({
        path: "sessionId",
        populate: [
          { path: "host", select: "name email profileImage clerkId" },
          { path: "participant", select: "name email profileImage clerkId" },
        ],
      });
    }

    const difficultyPath = [];
    for (const q of questions) {
      const last = difficultyPath[difficultyPath.length - 1];
      if (last !== q.difficulty) difficultyPath.push(q.difficulty);
    }

    return ok(res, {
      interview,
      questions,
      performance,
      submissions,
      difficultyPath,
    });
  } catch (error) {
    console.error("Error in getInterviewById:", error.message);
    return fail(res, "Unable to load interview", 500);
  }
}

// used by the dashboard to show the latest interview + quick stats
export async function getDashboardData(req, res) {
  try {
    const userId = req.user._id;

    const [latestInterview, performanceDocs, latestRoadmap, submissionCount] = await Promise.all([
      Interview.findOne({ candidate: userId, status: "completed" }).sort({ completedAt: -1 }),
      Performance.find({ candidate: userId }).sort({ createdAt: -1 }),
      CareerRoadmap.findOne({ candidate: userId }).sort({ generatedAt: -1 }),
      CodeSubmission.countDocuments({ candidate: userId }),
    ]);

    const overallScores = performanceDocs.map((p) => p.overallScore).filter((s) => s != null);
    const readiness = overallScores.length
      ? Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length)
      : latestRoadmap?.readiness ?? 50;

    const latestPerformance = latestInterview
      ? performanceDocs.find((p) => p.interviewId.toString() === latestInterview._id.toString())
      : null;

    const strongAreas =
      latestPerformance?.strengths?.slice(0, 3) ??
      latestInterview?.strongAreas?.slice(0, 3) ??
      latestRoadmap?.strongSkills?.slice(0, 3) ??
      [];
    const weakAreas =
      latestPerformance?.weaknesses?.slice(0, 2) ??
      latestInterview?.weakAreas?.slice(0, 2) ??
      latestRoadmap?.skillGaps?.slice(0, 2) ??
      [];

    return ok(res, {
      readiness,
      latestInterview: latestInterview
        ? {
            _id: latestInterview._id,
            type: latestInterview.type,
            role: latestInterview.role,
            roleLabel: roleLabel(latestInterview.role),
            score: latestPerformance?.overallScore ?? latestInterview.score,
            completedAt: latestInterview.completedAt,
          }
        : null,
      strongAreas,
      weakAreas,
      interviewCount: performanceDocs.length,
      submissionCount,
    });
  } catch (error) {
    console.error("Error in getDashboardData:", error.message);
    return fail(res, "Unable to load dashboard data", 500);
  }
}
