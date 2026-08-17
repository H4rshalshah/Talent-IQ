import { chatCompletionJson } from "./llm.service.js";
import { buildPerformanceReportPrompt } from "./prompts.js";
import { roleLabel } from "./topics.js";

/**
 * Generate a structured performance report for a completed interview.
 *
 * Falls back to a deterministic heuristic aggregation when the LLM is not
 * configured or fails, so the report page always renders something honest.
 *
 * @param {object} interview
 * @param {Array} questions InterviewQuestion docs with evaluations
 * @returns {Promise<{technicalScore:number,codingScore:number,communicationScore:number,problemSolvingScore:number,overallScore:number,strengths:string[],weaknesses:string[],summary:string}>}
 */
export async function generatePerformanceReport(interview, questions) {
  const answered = questions.filter((q) => q.score != null);
  const avgScore = answered.length
    ? answered.reduce((sum, q) => sum + q.score, 0) / answered.length
    : 0;

  const difficultyPath = [];
  for (const q of questions) {
    const last = difficultyPath[difficultyPath.length - 1];
    if (last !== q.difficulty) difficultyPath.push(q.difficulty);
  }

  const weakAreas = interview.weakAreas || [];
  const strongAreas = interview.strongAreas || [];

  const heuristic = buildHeuristicReport({ avgScore, strongAreas, weakAreas, difficultyPath });

  try {
    const raw = await chatCompletionJson({
      system: "You are an expert interviewer generating performance reports.",
      user: buildPerformanceReportPrompt({
        role: roleLabel(interview.role),
        questions,
        avgScore,
        difficultyPath: difficultyPath.length ? difficultyPath : ["medium"],
        strongAreas,
        weakAreas,
        grounded: true,
      }),
    });

    const report = {
      technicalScore: clampScore(raw.technicalScore),
      codingScore: clampScore(raw.codingScore),
      communicationScore: clampScore(raw.communicationScore),
      problemSolvingScore: clampScore(raw.problemSolvingScore),
      overallScore: clampScore(raw.overallScore),
      strengths: Array.isArray(raw.strengths) ? raw.strengths.slice(0, 6) : heuristic.strengths,
      weaknesses: Array.isArray(raw.weaknesses) ? raw.weaknesses.slice(0, 6) : heuristic.weaknesses,
      summary: String(raw.summary || heuristic.summary),
    };
    return report;
  } catch (error) {
    console.warn("⚠️ LLM performance report failed, using heuristic:", error.message);
    return heuristic;
  }
}

function clampScore(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.min(Math.max(Math.round(n), 0), 100);
}

function buildHeuristicReport({ avgScore, strongAreas, weakAreas, difficultyPath }) {
  const base = Math.round(avgScore * 10); // 0-100 from 0-10 avg
  const reachedHard = difficultyPath.includes("hard");
  const bonus = reachedHard ? 5 : 0;
  const overall = Math.min(Math.max(base + bonus, 0), 100);

  return {
    technicalScore: Math.min(Math.max(base, 0), 100),
    codingScore: Math.min(Math.max(base - 5, 0), 100),
    communicationScore: Math.min(Math.max(base - 8, 0), 100),
    problemSolvingScore: Math.min(Math.max(base + 3, 0), 100),
    overallScore: overall,
    strengths: strongAreas.length
      ? strongAreas.map((a) => `Strong performance in ${a}`)
      : ["Consistent participation across questions"],
    weaknesses: weakAreas.length
      ? weakAreas.map((a) => `Needs improvement in ${a}`)
      : ["Deeper technical detail in answers"],
    summary: `Completed with an average score of ${avgScore.toFixed(1)}/10 across ${strongAreas.length + weakAreas.length || "several"} topics.`,
  };
}
