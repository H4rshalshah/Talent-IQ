import CodeSubmission from "../models/CodeSubmission.js";
import { reviewCode } from "../services/ai/codeReview.service.js";

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

const ALLOWED_LANGUAGES = ["javascript", "python", "java"];

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

    if (!problemId) return fail(res, "problemId is required");
    if (!language || !ALLOWED_LANGUAGES.includes(language)) {
      return fail(res, "Language must be one of: javascript, python, java");
    }
    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return fail(res, "Code is required");
    }
    if (code.length > 50000) return fail(res, "Code is too long to review");

    // verify interview ownership when an interviewId (or sessionId) is supplied
    let resolvedInterviewId = interviewId || null;
    if (sessionId && !resolvedInterviewId) {
      const Interview = (await import("../models/Interview.js")).default;
      const linked = await Interview.findOne({ sessionId });
      if (linked) resolvedInterviewId = linked._id;
    }
    if (resolvedInterviewId) {
      const Interview = (await import("../models/Interview.js")).default;
      const interview = await Interview.findById(resolvedInterviewId);
      if (!interview) return fail(res, "Interview not found", 404);
      if (interview.candidate.toString() !== req.user._id.toString()) {
        return fail(res, "You do not have access to this interview", 403);
      }
    }

    // ground the review in the bank's canonical solution approach when the
    // problem is one of ours (identified by slug)
    let resolvedTitle = problemTitle;
    let solutionApproach = "";
    try {
      const Problem = (await import("../models/Problem.js")).default;
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
      problemTitle: problemTitle || problemId,
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
    if (/temporarily unavailable/i.test(error.message)) {
      return fail(res, error.message, 503);
    }
    return fail(res, "Unable to review code", 500);
  }
}
