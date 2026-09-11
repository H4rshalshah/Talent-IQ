// ---------------------------------------------------------------------------
// Role Readiness engine (domain-aware, deterministic).
//
// Compares what the candidate has actually demonstrated (interview question
// scores, performance report metrics, solved practice problems) against the
// skill requirements of a target role. Every number is derived from stored
// data — there is no estimation and no AI "vibes". When there is no evidence
// for a skill it is reported as "no_data" instead of being invented.
// ---------------------------------------------------------------------------

import { roleLabel, topicLabel } from "../ai/topics.js";

export const MIN_READY_SCORE = 60;
export const STRONG_SCORE = 75;

/**
 * Skill requirements per role. `metric` refers to a Performance report field;
 * `topics` refers to AI interview question topics. A skill's score is the
 * average of whichever of those signals exist.
 */
export const ROLE_SKILL_MATRIX = {
  "software-engineer": [
    { skill: "Data Structures & Algorithms", metric: "problemSolving", topics: ["data-structures", "algorithms"] },
    { skill: "Coding", metric: "coding", includePractice: true },
    { skill: "System Design", metric: "technical", topics: ["system-design"] },
    { skill: "Databases", metric: "technical", topics: ["databases"] },
    { skill: "Communication", metric: "communication" },
  ],
  "frontend-developer": [
    { skill: "JavaScript", metric: "coding", topics: ["javascript", "web"] },
    { skill: "React", metric: "coding", topics: ["react"] },
    { skill: "CS Fundamentals", metric: "problemSolving", topics: ["cs-fundamentals"] },
    { skill: "Communication", metric: "communication" },
  ],
  "backend-developer": [
    { skill: "Node.js / Server-Side", metric: "coding", topics: ["nodejs"] },
    { skill: "Databases", metric: "technical", topics: ["databases"] },
    { skill: "System Design", metric: "problemSolving", topics: ["system-design"] },
    { skill: "OOP & Design", metric: "technical", topics: ["oop"] },
    { skill: "Communication", metric: "communication" },
  ],
  "full-stack-developer": [
    { skill: "JavaScript", metric: "coding", topics: ["javascript", "web"] },
    { skill: "React", metric: "coding", topics: ["react"] },
    { skill: "Node.js / Server-Side", metric: "technical", topics: ["nodejs"] },
    { skill: "Databases", metric: "technical", topics: ["databases"] },
    { skill: "System Design", metric: "problemSolving", topics: ["system-design"] },
  ],
  "data-analyst": [
    { skill: "SQL & Databases", metric: "technical", topics: ["databases", "sql"] },
    { skill: "Data Analysis", metric: "problemSolving", topics: ["data-analysis"] },
    { skill: "CS Fundamentals", metric: "coding", topics: ["cs-fundamentals"] },
    { skill: "Communication", metric: "communication" },
  ],
  "machine-learning-engineer": [
    { skill: "Machine Learning", metric: "technical", topics: ["machine-learning"] },
    { skill: "Data Analysis", metric: "problemSolving", topics: ["data-analysis"] },
    { skill: "Python / Coding", metric: "coding" },
    { skill: "Databases", metric: "technical", topics: ["databases"] },
    { skill: "System Design", metric: "problemSolving", topics: ["system-design"] },
  ],
};

const METRIC_FIELDS = ["technicalScore", "codingScore", "communicationScore", "problemSolvingScore"];

const average = (values) => {
  const nums = values.filter((v) => Number.isFinite(v));
  if (!nums.length) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
};

/** Average of a Performance metric across interviews, or null when absent. */
export function averageMetric(performances = [], metric) {
  const field = `${metric}Score`;
  if (!METRIC_FIELDS.includes(field)) return null;
  return average(performances.map((p) => p?.[field]));
}

/**
 * Average interview question score (0-10) per topic, scaled to 0-100.
 * @param {Array<{topic?:string, category?:string, score?:number}>} questions
 * @returns {Record<string, number>}
 */
export function topicScoresFrom(questions = []) {
  const buckets = new Map();
  for (const q of questions) {
    if (q?.score == null) continue;
    const topic = q.topic || q.category || "general";
    if (!buckets.has(topic)) buckets.set(topic, []);
    buckets.get(topic).push(q.score);
  }
  const out = {};
  for (const [topic, scores] of buckets) {
    out[topic] = Math.min(100, Math.max(0, Math.round((average(scores) ?? 0) * 10)));
  }
  return out;
}

/**
 * Practice score from solved problem count. Null until the candidate has
 * actually solved something (no evidence -> no score).
 */
export function practiceScore(solvedCount = 0) {
  if (!solvedCount) return null;
  return Math.min(100, Math.round((solvedCount / 10) * 100));
}

function statusFor(score) {
  if (score == null) return "no_data";
  if (score >= STRONG_SCORE) return "strong";
  if (score >= MIN_READY_SCORE) return "developing";
  return "gap";
}

/**
 * @param {object} params
 * @param {string} params.role target role slug
 * @param {Array} params.performances Performance docs
 * @param {Array} params.questions InterviewQuestion docs (with topic + score)
 * @param {number} params.solvedCount solved practice problems
 * @returns {object} deterministic readiness analysis
 */
export function computeRoleReadiness({ role, performances = [], questions = [], solvedCount = 0 }) {
  const requirements = ROLE_SKILL_MATRIX[role] || ROLE_SKILL_MATRIX["software-engineer"];
  const topicScores = topicScoresFrom(questions);
  const practice = practiceScore(solvedCount);

  const skills = requirements.map((req) => {
    const evidence = [];

    const metricScore = req.metric ? averageMetric(performances, req.metric) : null;
    if (metricScore != null) evidence.push(metricScore);

    if (req.topics?.length) {
      const topicValues = req.topics.map((t) => topicScores[t]).filter((v) => v != null);
      if (topicValues.length) evidence.push(average(topicValues));
    }

    if (req.includePractice && practice != null) evidence.push(practice);

    const score = average(evidence);
    return {
      skill: req.skill,
      score,
      status: statusFor(score),
      evidenceCount: evidence.length,
    };
  });

  const scored = skills.filter((s) => s.score != null);
  const overallReadiness = scored.length
    ? Math.round(scored.reduce((a, s) => a + s.score, 0) / scored.length)
    : null;

  const strongAreas = scored.filter((s) => s.status === "strong").map((s) => s.skill);
  const gaps = scored
    .filter((s) => s.status === "gap")
    .sort((a, b) => a.score - b.score)
    .map((s) => s.skill);

  const weakTopics = Object.entries(topicScores)
    .filter(([, v]) => v < MIN_READY_SCORE)
    .sort((a, b) => a[1] - b[1])
    .map(([t]) => t);

  const recommendedActions = [
    ...gaps.map((skill, i) => ({
      action: `Bring ${skill} up to role standard`,
      reason: `Your ${skill} score is below the ${MIN_READY_SCORE}% readiness bar for ${roleLabel(role)}.`,
      priority: i + 1,
    })),
    ...weakTopics.slice(0, 3).map((topic, i) => ({
      action: `Practice ${topicLabel(topic)} questions`,
      reason: `Your interview answers on ${topicLabel(topic)} averaged below ${MIN_READY_SCORE}%.`,
      priority: gaps.length + i + 1,
    })),
  ];

  return {
    role,
    roleLabel: roleLabel(role),
    overallReadiness,
    sufficientData: scored.length >= 2,
    skills,
    strongAreas,
    gaps,
    recommendedActions,
    dataPoints: {
      interviews: performances.length,
      questions: questions.filter((q) => q?.score != null).length,
      solvedProblems: solvedCount,
    },
  };
}
