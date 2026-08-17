import { chatCompletionJson, isLlmConfigured } from "./llm.service.js";
import { retrieveContext } from "../rag/retriever.service.js";
import {
  buildQuestionPrompt,
  buildFollowUpPrompt,
  buildEvaluationPrompt,
} from "./prompts.js";
import {
  roleLabel,
  topicsForRole,
  selectNextTopic,
  shiftDifficulty,
} from "./topics.js";

// ---------------------------------------------------------------------------
// AI interview engine.
//
// generateQuestion()  — RAG-grounded next-question generation
// evaluateAnswer()    — RAG-grounded evaluation + adaptive state update
// buildInterviewState — shapes the interview state sent to prompts
// ---------------------------------------------------------------------------

export function isAiInterviewAvailable() {
  return isLlmConfigured();
}

/**
 * Shape the interview state used for grounding and adaptivity.
 */
export function buildInterviewState(interview, questions = []) {
  return {
    role: roleLabel(interview.role),
    roleSlug: interview.role,
    experienceLevel: interview.config?.experienceLevel,
    currentDifficulty: interview.currentDifficulty,
    currentTopic: interview.currentTopic,
    performanceScore: interview.performanceScore,
    questionHistory: interview.questionHistory,
    weakAreas: interview.weakAreas,
    strongAreas: interview.strongAreas,
    questionsAsked: questions.length,
    questionsTotal: interview.config?.numQuestions,
  };
}

/**
 * Pick the best topic for the next question (or stay on the current topic
 * for a follow-up).
 */
function pickTopic(interview, isFollowUp) {
  if (isFollowUp && interview.currentTopic) return interview.currentTopic;
  return selectNextTopic({
    role: interview.role,
    topicPool: topicsForRole(interview.role),
    weakAreas: interview.weakAreas,
    strongAreas: interview.strongAreas,
    questionHistory: interview.questionHistory,
    configTopics: interview.config?.topics,
  });
}

/**
 * Generate the next interview question, grounded in retrieved context.
 *
 * @param {object} interview Mongoose Interview doc (with state)
 * @param {object} options { isFollowUp, lastQuestion, lastAnswer, evaluation }
 * @returns {Promise<{question:string,topic:string,difficulty:string,category:string,isFollowUp:boolean,retrievedContextIds:string[],grounded:boolean}>}
 */
export async function generateQuestion(interview, options = {}) {
  const { isFollowUp = false, lastQuestion, lastAnswer } = options;

  const topic = pickTopic(interview, isFollowUp);
  const difficulty = isFollowUp
    ? followUpDifficulty(interview.currentDifficulty, options.evaluation)
    : interview.currentDifficulty;

  const { chunks, grounded } = await retrieveContext({
    role: interview.role,
    topic,
    difficulty,
    weakAreas: interview.weakAreas,
    candidateId: interview.candidate?.toString(),
    interviewId: interview._id,
    collections: isFollowUp ? ["job-knowledge", "question-bank"] : ["job-knowledge", "question-bank", "candidate-history"],
  });

  const candidateState = buildInterviewState(interview);

  let result;
  try {
    const prompt = isFollowUp
      ? buildFollowUpPrompt({
          role: roleLabel(interview.role),
          question: lastQuestion,
          answer: lastAnswer,
          topic,
          retrievedContext: chunks,
          grounded,
          candidateState,
        })
      : buildQuestionPrompt({
          role: roleLabel(interview.role),
          experienceLevel: interview.config?.experienceLevel,
          difficulty,
          topic,
          retrievedContext: chunks,
          grounded,
          candidateState,
        });

    const raw = await chatCompletionJson({ system: "You are an adaptive technical interviewer.", user: prompt });
    result = {
      question: String(raw.question || "").trim(),
      topic: String(raw.topic || topic).trim(),
      difficulty: ["easy", "medium", "hard"].includes(raw.difficulty) ? raw.difficulty : difficulty,
      category: String(raw.category || topic).trim(),
      isFollowUp: Boolean(raw.isFollowUp),
      followUpHint: String(raw.followUpHint || ""),
      grounded: Boolean(raw.grounded ?? grounded),
      retrievedContextIds: chunks.map((c) => c.id),
    };
  } catch (error) {
    console.error("⚠️ LLM question generation failed:", error.message);
    // never surface raw AI errors to candidates
    throw new Error("AI interviewer is temporarily unavailable. Please try again.");
  }

  if (!result.question) {
    throw new Error("Unable to generate interview question");
  }

  // persist adaptive state so the next question is grounded in this one
  interview.currentTopic = topic;
  interview.currentDifficulty = difficulty;
  if (result.retrievedContextIds?.length) {
    interview.retrievedContextIds = [
      ...new Set([...(interview.retrievedContextIds || []), ...result.retrievedContextIds]),
    ].slice(-40);
  }
  return result;
}

function followUpDifficulty(currentDifficulty, evaluation) {
  const score = evaluation?.score;
  if (score == null) return currentDifficulty;
  if (score >= 8) return shiftDifficulty(currentDifficulty, 1);
  if (score <= 4) return shiftDifficulty(currentDifficulty, -1);
  return currentDifficulty;
}

/**
 * Evaluate a candidate answer against retrieved reference material and update
 * the interview's adaptive state (performance score, weak/strong areas,
 * next difficulty).
 *
 * @param {object} interview
 * @param {object} question InterviewQuestion doc
 * @param {string} answer
 * @returns {Promise<{evaluation:object, nextDifficulty:string, nextTopic:string}>}
 */
export async function evaluateAnswer(interview, question, answer) {
  const { chunks, grounded } = await retrieveContext({
    role: interview.role,
    topic: question.topic || question.category,
    difficulty: question.difficulty,
    question: question.question,
    weakAreas: interview.weakAreas,
    candidateId: interview.candidate?.toString(),
    interviewId: interview._id,
    collections: ["job-knowledge", "question-bank"],
  });

  const prompt = buildEvaluationPrompt({
    role: roleLabel(interview.role),
    question: question.question,
    topic: question.topic || question.category,
    difficulty: question.difficulty,
    answer,
    retrievedContext: chunks,
    grounded,
  });

  let evaluation;
  try {
    const raw = await chatCompletionJson({ system: "You are an expert interviewer.", user: prompt });
    evaluation = sanitizeEvaluation(raw);
  } catch (error) {
    console.error("⚠️ LLM evaluation failed:", error.message);
    throw new Error("AI interviewer is temporarily unavailable. Please try again.");
  }

  // ---- adaptive engine (deterministic, score-based) ----
  const score = evaluation.score;
  const prevCount = Math.max(interview.questionHistory.length, 1);
  interview.performanceScore = Math.round(
    ((interview.performanceScore * (prevCount - 1) + score) / prevCount) * 10
  ) / 10;

  const topic = question.topic || question.category || "general";
  if (!interview.questionHistory.includes(topic)) {
    interview.questionHistory.push(topic);
  }

  if (score >= 7) {
    if (!interview.strongAreas.includes(topic)) interview.strongAreas.push(topic);
    interview.weakAreas = interview.weakAreas.filter((t) => t !== topic);
  } else if (score <= 4) {
    if (!interview.weakAreas.includes(topic)) interview.weakAreas.push(topic);
    interview.strongAreas = interview.strongAreas.filter((t) => t !== topic);
  }

  // difficulty adaptation: strong -> up, weak -> down, otherwise stay
  let nextDifficulty = interview.currentDifficulty;
  if (score >= 8) nextDifficulty = shiftDifficulty(nextDifficulty, 1);
  else if (score <= 4) nextDifficulty = shiftDifficulty(nextDifficulty, -1);

  interview.currentDifficulty = nextDifficulty;
  interview.currentTopic = evaluation.nextTopic && evaluation.nextTopic !== "next" ? evaluation.nextTopic : topic;

  return {
    evaluation,
    nextDifficulty,
    nextTopic: interview.currentTopic,
    retrievedContextIds: chunks.map((c) => c.id),
    grounded,
  };
}

function sanitizeEvaluation(raw) {
  const score = Math.min(Math.max(Number(raw.score) || 5, 0), 10);
  const correctness = ["strong", "moderate", "weak"].includes(raw.correctness)
    ? raw.correctness
    : score >= 7
      ? "strong"
      : score <= 4
        ? "weak"
        : "moderate";
  return {
    score,
    correctness,
    technicalDepth: ["excellent", "good", "fair", "poor"].includes(raw.technicalDepth)
      ? raw.technicalDepth
      : "good",
    completeness: ["complete", "partial", "incomplete"].includes(raw.completeness)
      ? raw.completeness
      : "partial",
    missingConcepts: Array.isArray(raw.missingConcepts) ? raw.missingConcepts.slice(0, 8) : [],
    strengths: Array.isArray(raw.strengths) ? raw.strengths.slice(0, 5) : [],
    feedback: String(raw.feedback || "Thanks for your answer.").trim(),
    recommendedDifficulty: ["easy", "medium", "hard"].includes(raw.recommendedDifficulty)
      ? raw.recommendedDifficulty
      : null,
    nextTopic: String(raw.nextTopic || "").trim(),
    grounded: Boolean(raw.grounded),
  };
}

/**
 * Score fallback used when the LLM is unavailable: simple heuristic based on
 * answer length. This keeps the interview flowing instead of hard-blocking.
 */
export function heuristicFallbackScore(answer) {
  const length = (answer || "").trim().length;
  if (length >= 300) return { score: 7, correctness: "moderate", feedback: "Your answer covered several points." };
  if (length >= 120) return { score: 5, correctness: "moderate", feedback: "Good start — try to add more technical detail." };
  return { score: 3, correctness: "weak", feedback: "Try to elaborate with concrete technical details." };
}
