import { chatCompletionJson } from "./llm.service.js";
import { retrieveContext } from "../rag/retriever.service.js";
import { buildCodeReviewPrompt } from "./prompts.js";

/**
 * Review candidate code against retrieved reference solutions and
 * optimization patterns for the problem.
 *
 * @param {object} options
 * @param {string} options.problemId
 * @param {string} options.problemTitle
 * @param {string} options.problemStatement
 * @param {string} options.language
 * @param {string} options.code
 * @param {object} [options.testResults]
 * @param {string} [options.interviewId]
 * @returns {Promise<{correctnessScore:number,timeComplexity:string,spaceComplexity:string,codeQualityScore:number,issues:string[],missingEdgeCases:string[],suggestedOptimization:string,optimizedTimeComplexity:string,optimizedSpaceComplexity:string,summary:string,grounded:boolean}>}
 */
export async function reviewCode({
  problemId,
  problemTitle,
  problemStatement,
  language,
  code,
  testResults,
  interviewId,
}) {
  const { chunks, grounded } = await retrieveContext({
    role: "software-engineer",
    topic: problemId,
    question: problemTitle,
    interviewId: interviewId || null,
    collections: ["question-bank", "job-knowledge"],
    topK: 5,
  });

  const prompt = buildCodeReviewPrompt({
    problemTitle,
    problemStatement,
    language,
    code,
    testResults,
    retrievedContext: chunks,
    grounded,
  });

  try {
    const raw = await chatCompletionJson({
      system: "You are a senior engineer reviewing candidate code.",
      user: prompt,
      maxTokens: 900,
    });

    return {
      correctnessScore: clamp(raw.correctnessScore, 10),
      timeComplexity: String(raw.timeComplexity || "Unknown"),
      spaceComplexity: String(raw.spaceComplexity || "Unknown"),
      codeQualityScore: clamp(raw.codeQualityScore, 10),
      issues: Array.isArray(raw.issues) ? raw.issues.slice(0, 6) : [],
      missingEdgeCases: Array.isArray(raw.missingEdgeCases) ? raw.missingEdgeCases.slice(0, 6) : [],
      suggestedOptimization: String(raw.suggestedOptimization || ""),
      optimizedTimeComplexity: String(raw.optimizedTimeComplexity || ""),
      optimizedSpaceComplexity: String(raw.optimizedSpaceComplexity || ""),
      summary: String(raw.summary || ""),
      grounded: Boolean(raw.grounded ?? grounded),
    };
  } catch (error) {
    console.error("⚠️ AI code review failed:", error.message);
    throw new Error("AI code review is temporarily unavailable. Please try again.");
  }
}

function clamp(value, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.min(Math.max(Math.round(n), 0), max);
}
