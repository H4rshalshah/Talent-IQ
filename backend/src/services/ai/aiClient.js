import { ENV } from "../../lib/env.js";
import { groqProvider } from "./providers/groq.provider.js";
import { geminiProvider } from "./providers/gemini.provider.js";

// ---------------------------------------------------------------------------
// Unified AI client.
//
// The rest of the app never talks to Groq/Gemini directly — it calls
// generateStructured() with a task name, and this module decides which
// provider handles it:
//
//   interview  -> Groq   (low latency matters during a live interview)
//   review     -> Groq   (Gemini free tier is quota-bound; Groq is reliable)
//   report     -> Groq
//   roadmap    -> Groq
//
// The mapping is configurable per task via env vars, e.g.
//   AI_PROVIDER_INTERVIEW=groq
//   AI_PROVIDER_REVIEW=gemini
// If the primary provider is rate-limited it fails over to the other one for
// a cooldown window (~60s), then traffic returns to the preferred provider.
// ---------------------------------------------------------------------------

const PROVIDERS = [groqProvider, geminiProvider];
const byId = Object.fromEntries(PROVIDERS.map((p) => [p.id, p]));

// task -> primary provider id (env-overridable, defaults below)
const TASK_PROVIDER = {
  interview: process.env.AI_PROVIDER_INTERVIEW || "groq",
  evaluation: process.env.AI_PROVIDER_EVALUATION || "groq",
  review: process.env.AI_PROVIDER_REVIEW || "groq",
  report: process.env.AI_PROVIDER_REPORT || "groq",
  roadmap: process.env.AI_PROVIDER_ROADMAP || "groq",
};

const RATE_LIMIT_COOLDOWN_MS = 60_000;
const cooldowns = Object.fromEntries(PROVIDERS.map((p) => [p.id, 0]));

const RATE_LIMIT_RE = /429|rate\s*limit|too\s*many\s*requests|quota|resource\s*exhausted|overloaded/i;

function isRateLimited(error) {
  return error?.status === 429 || RATE_LIMIT_RE.test(error?.message || "");
}

function isTransient(error) {
  if (error?.status) return error.status >= 500 && error.status < 600;
  return error instanceof TypeError; // network failure
}

function markRateLimited(providerId) {
  cooldowns[providerId] = Date.now() + RATE_LIMIT_COOLDOWN_MS;
  const fallback = providerId === "groq" ? "Gemini" : "Groq";
  console.warn(`⚠️ ${providerId} hit its rate limit — using ${fallback} for ~60s`);
}

// ---------------------------------------------------------------------------
// Defensive JSON parsing — strip markdown fences / preamble before parse.
// ---------------------------------------------------------------------------

function extractJson(content) {
  const trimmed = content.trim();
  // strip ```json ... ``` fences
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    // last resort: grab the first balanced {...} block
    const match = candidate.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Malformed JSON from LLM");
  }
}

// ---------------------------------------------------------------------------
// Per-task schema validation (manual — keeps the parsed object honest before
// it is stored or returned).
// ---------------------------------------------------------------------------

function isArr(v) {
  return Array.isArray(v);
}

const VALIDATORS = {
  interview(parsed) {
    return {
      question: String(parsed.question || "").trim(),
      topic: String(parsed.topic || "").trim(),
      difficulty: ["easy", "medium", "hard"].includes(parsed.difficulty) ? parsed.difficulty : "medium",
      category: String(parsed.category || "").trim(),
      isFollowUp: Boolean(parsed.isFollowUp),
      followUpHint: String(parsed.followUpHint || "").trim(),
      grounded: Boolean(parsed.grounded),
    };
  },
  evaluation(parsed) {
    const score = Math.min(Math.max(Number(parsed.score) || 5, 0), 10);
    return {
      score,
      correctness: ["strong", "moderate", "weak"].includes(parsed.correctness)
        ? parsed.correctness
        : score >= 7
          ? "strong"
          : score <= 4
            ? "weak"
            : "moderate",
      technicalDepth: ["excellent", "good", "fair", "poor"].includes(parsed.technicalDepth)
        ? parsed.technicalDepth
        : "good",
      completeness: ["complete", "partial", "incomplete"].includes(parsed.completeness)
        ? parsed.completeness
        : "partial",
      missingConcepts: isArr(parsed.missingConcepts) ? parsed.missingConcepts.slice(0, 8).map(String) : [],
      strengths: isArr(parsed.strengths) ? parsed.strengths.slice(0, 5).map(String) : [],
      feedback: String(parsed.feedback || "Thanks for your answer.").trim(),
      recommendedDifficulty: ["easy", "medium", "hard"].includes(parsed.recommendedDifficulty)
        ? parsed.recommendedDifficulty
        : null,
      nextTopic: String(parsed.nextTopic || "").trim(),
      grounded: Boolean(parsed.grounded),
    };
  },
  review(parsed) {
    const clamp = (v, max) => {
      const n = Number(v);
      if (Number.isNaN(n)) return 0;
      return Math.min(Math.max(Math.round(n), 0), max);
    };
    return {
      correctnessScore: clamp(parsed.correctnessScore, 10),
      timeComplexity: String(parsed.timeComplexity || "Unknown"),
      spaceComplexity: String(parsed.spaceComplexity || "Unknown"),
      codeQualityScore: clamp(parsed.codeQualityScore, 10),
      issues: isArr(parsed.issues) ? parsed.issues.slice(0, 6).map(String) : [],
      missingEdgeCases: isArr(parsed.missingEdgeCases) ? parsed.missingEdgeCases.slice(0, 6).map(String) : [],
      suggestedOptimization: String(parsed.suggestedOptimization || ""),
      optimizedTimeComplexity: String(parsed.optimizedTimeComplexity || ""),
      optimizedSpaceComplexity: String(parsed.optimizedSpaceComplexity || ""),
      summary: String(parsed.summary || ""),
      grounded: Boolean(parsed.grounded),
    };
  },
  report(parsed) {
    const clamp = (v) => {
      const n = Number(v);
      if (Number.isNaN(n)) return 0;
      return Math.min(Math.max(Math.round(n), 0), 100);
    };
    return {
      technicalScore: clamp(parsed.technicalScore),
      codingScore: clamp(parsed.codingScore),
      communicationScore: clamp(parsed.communicationScore),
      problemSolvingScore: clamp(parsed.problemSolvingScore),
      overallScore: clamp(parsed.overallScore),
      strengths: isArr(parsed.strengths) ? parsed.strengths.slice(0, 8).map(String) : [],
      weaknesses: isArr(parsed.weaknesses) ? parsed.weaknesses.slice(0, 8).map(String) : [],
      summary: String(parsed.summary || ""),
    };
  },
  roadmap(parsed) {
    const readiness = Math.min(Math.max(Number(parsed.readiness) || 50, 0), 100);
    return {
      readiness,
      strongSkills: isArr(parsed.strongSkills) ? parsed.strongSkills.slice(0, 10).map(String) : [],
      skillGaps: isArr(parsed.skillGaps) ? parsed.skillGaps.slice(0, 10).map(String) : [],
      recommendations: isArr(parsed.recommendations) ? parsed.recommendations.slice(0, 8).map(String) : [],
      roadmap: isArr(parsed.roadmap)
        ? parsed.roadmap.slice(0, 8).map((week) => ({
            week: Number(week?.week) || 1,
            title: String(week?.title || ""),
            topics: isArr(week?.topics) ? week.topics.slice(0, 8).map(String) : [],
            resources: isArr(week?.resources) ? week.resources.slice(0, 8).map(String) : [],
          }))
        : [],
    };
  },
};

// Safe defaults so a provider failure never crashes the request.
const FALLBACKS = {
  interview: () => ({
    question: "",
    topic: "",
    difficulty: "medium",
    category: "",
    isFollowUp: false,
    followUpHint: "",
    grounded: false,
  }),
  evaluation: () => ({
    score: 5,
    correctness: "moderate",
    technicalDepth: "good",
    completeness: "partial",
    missingConcepts: [],
    strengths: [],
    feedback: "Thanks for your answer.",
    recommendedDifficulty: null,
    nextTopic: "",
    grounded: false,
  }),
  review: () => ({
    correctnessScore: 5,
    timeComplexity: "Unknown",
    spaceComplexity: "Unknown",
    codeQualityScore: 5,
    issues: [],
    missingEdgeCases: [],
    suggestedOptimization: "",
    optimizedTimeComplexity: "",
    optimizedSpaceComplexity: "",
    summary: "The AI reviewer is temporarily unavailable.",
    grounded: false,
  }),
  report: () => ({
    technicalScore: 0,
    codingScore: 0,
    communicationScore: 0,
    problemSolvingScore: 0,
    overallScore: 0,
    strengths: [],
    weaknesses: [],
    summary: "The AI report generator is temporarily unavailable.",
  }),
  roadmap: () => ({
    readiness: 50,
    strongSkills: [],
    skillGaps: [],
    recommendations: [],
    roadmap: [],
  }),
};

const STRICT_SUFFIX = "\n\nReturn ONLY a single valid JSON object. No markdown, no code fences, no preamble, no commentary.";

function nextProvider(task, avoid) {
  const primary = TASK_PROVIDER[task] || "groq";
  const ordered = primary === "groq" ? ["groq", "gemini"] : ["gemini", "groq"];
  const now = Date.now();

  const candidates = ordered.filter((id) => id !== avoid && cooldowns[id] <= now);
  if (candidates.length > 0) return byId[candidates[0]];

  const soonest = [...ordered].sort((a, b) => cooldowns[a] - cooldowns[b])[0];
  const fallbackId = ordered.find((id) => id !== avoid) || soonest;
  return byId[fallbackId];
}

/**
 * Run a structured (JSON) LLM completion with provider failover, defensive
 * parsing, per-task validation, one stricter retry, then a safe fallback.
 *
 * @param {object} options
 * @param {string} options.task one of: interview | evaluation | review | report | roadmap
 * @param {string} options.system
 * @param {string} options.user
 * @param {number} [options.maxTokens]
 * @param {number} [options.temperature]
 * @param {boolean} [options.useFallback] when true (default) return a safe
 *   default instead of throwing; set false to surface the error to the caller
 * @returns {Promise<object>} validated structured output
 * @throws {Error} when useFallback=false and all attempts fail
 */
export async function generateStructured({ task, system, user, maxTokens = 1200, temperature = 0.4, useFallback = true }) {
  const validate = VALIDATORS[task];
  if (!validate) throw new Error(`Unknown AI task: ${task}`);

  // allow a fallback to surface a friendly error instead (used by callers
  // that prefer an explicit 503 over a canned default)
  let avoid = null;
  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const provider = nextProvider(task, avoid);
    const strict = attempt >= 1 ? system + STRICT_SUFFIX : system;

    try {
      // Gemini models spend part of the output budget on reasoning, so give
      // them a larger budget to avoid truncating the JSON answer.
      const effectiveMaxTokens = provider.id === "gemini" ? Math.min(Math.max(maxTokens * 2, 1600), 6000) : maxTokens;
      const { content } = await provider.complete({ system: strict, user, jsonMode: true, maxTokens: effectiveMaxTokens, temperature });
      const parsed = extractJson(content);
      const validated = validate(parsed);
      // a valid structured answer must have at least one meaningful field
      if (JSON.stringify(validated).length <= 4) throw new Error("Empty structured output");
      return validated;
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ AI task "${task}": ${provider.id} attempt ${attempt + 1} failed (${error.message})`);
      if (isRateLimited(error)) {
        markRateLimited(provider.id);
        avoid = provider.id;
      } else if (isTransient(error)) {
        avoid = provider.id;
      }
      // parsing/validation errors: stay on the same provider, retry stricter
      if (attempt >= 2) break;
    }
  }

  // provider unavailable / malformed output everywhere
  if (!useFallback) throw new Error(lastError?.message || `AI task "${task}" failed`);
  console.error(`⚠️ AI task "${task}" failed after retries (${lastError?.message || "unknown"}), using safe fallback`);
  return FALLBACKS[task]();
}

export function isAiConfigured() {
  return Boolean(ENV.GROQ_API_KEY || ENV.GEMINI_API_KEY);
}
