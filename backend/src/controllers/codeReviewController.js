import CodeSubmission from "../models/CodeSubmission.js";
import Interview from "../models/Interview.js";
import Problem from "../models/Problem.js";
import { reviewCode } from "../services/ai/codeReview.service.js";
import { EXECUTABLE_LANGUAGES } from "../services/problems/executor.service.js";
import { fail, ok } from "../lib/apiResponse.js";

// Review is offered for every language the sandbox can actually execute, so
// the AI reviewer can never be asked about a language the editor hides.
const ALLOWED_LANGUAGES = new Set(EXECUTABLE_LANGUAGES);

export async function reviewCodeSubmission(req, res) {
  try {
    const {
      problemId,
      problemTitle,
      problemStatement,
      language,
      code,
      testResults,
      interviewId,
      sessionId,
    } = req.body;

    if (!problemId) return fail(res, "problemId is required", 422, "VALIDATION_ERROR");
    if (!language || !ALLOWED_LANGUAGES.has(language)) {
      return fail(
        res,
        `Language must be one of: ${EXECUTABLE_LANGUAGES.join(", ")}`,
        422,
        "VALIDATION_ERROR"
      );
    }
    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return fail(res, "Code is required", 422, "VALIDATION_ERROR");
    }
    if (code.length > 50000) return fail(res, "Code is too long to review", 413, "PAYLOAD_TOO_LARGE");

    // verify interview ownership when an interviewId (or sessionId) is supplied
    let resolvedInterviewId = interviewId || null;
    if (sessionId && !resolvedInterviewId) {
      const linked = await Interview.findOne({ sessionId });
      if (linked) resolvedInterviewId = linked._id;
    }
    if (resolvedInterviewId) {
      const interview = await Interview.findById(resolvedInterviewId);
      if (!interview) return fail(res, "Interview not found", 404, "NOT_FOUND");
      if (interview.candidate.toString() !== req.user._id.toString()) {
        return fail(res, "You do not have access to this interview", 403, "FORBIDDEN");
      }
    }

    // ground the review in the bank's canonical solution approach when the
    // problem is one of ours (identified by slug)
    let resolvedTitle = problemTitle;
    let solutionApproach = "";
    try {
      const bankProblem = await Problem.findOne({ slug: problemId }).lean();
      if (bankProblem) {
        resolvedTitle = bankProblem.title;
        solutionApproach = bankProblem.solutionApproach || "";
      }
    } catch (error) {
      console.warn("⚠️ Could not load problem bank entry for review:", error.message);
    }

    const review = await reviewCode({
      problemId,
      problemTitle: resolvedTitle || problemId,
      problemStatement: problemStatement || "",
      solutionApproach,
      language,
      code,
      testResults,
      interviewId: resolvedInterviewId,
    });

    const submission = await CodeSubmission.create({
      interviewId: resolvedInterviewId,
      candidate: req.user._id,
      problemId,
      problemTitle: resolvedTitle || problemId,
      language,
      code,
      testResults,
      timeComplexity: review.timeComplexity,
      spaceComplexity: review.spaceComplexity,
      aiReview: review,
    });

    return ok(res, { review, submissionId: submission._id }, 201);
  } catch (error) {
    console.error("Error in reviewCodeSubmission:", error.message);
    return fail(res, "Unable to review code", 500, "AI_REVIEW_FAILED");
  }
}
