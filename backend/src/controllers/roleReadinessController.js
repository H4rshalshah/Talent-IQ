import Performance from "../models/Performance.js";
import Interview from "../models/Interview.js";
import InterviewQuestion from "../models/InterviewQuestion.js";
import ProblemSubmission from "../models/ProblemSubmission.js";
import { ROLES } from "../services/ai/topics.js";
import { computeRoleReadiness, ROLE_SKILL_MATRIX } from "../services/analytics/roleReadiness.service.js";
import { fail, ok } from "../lib/apiResponse.js";

export async function getRoleReadiness(req, res) {
  try {
    const role = String(req.query.role || "software-engineer");
    if (!ROLES.some((r) => r.slug === role)) {
      return fail(res, "A valid job role is required", 422, "VALIDATION_ERROR");
    }

    const performances = await Performance.find({ candidate: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const interviews = await Interview.find({ candidate: req.user._id })
      .select("_id")
      .lean();

    const [questions, solvedCount] = await Promise.all([
      InterviewQuestion.find({ interviewId: { $in: interviews.map((i) => i._id) } })
        .select("topic category score")
        .lean(),
      ProblemSubmission.countDocuments({ candidate: req.user._id, status: "solved" }),
    ]);

    const readiness = computeRoleReadiness({ role, performances, questions, solvedCount });
    return ok(res, { readiness, availableRoles: ROLES.map((r) => r.slug) });
  } catch (error) {
    console.error("Error in getRoleReadiness:", error.message);
    return fail(res, "Unable to compute role readiness", 500, "READINESS_UNAVAILABLE");
  }
}

/** GET /api/role-readiness/requirements — the skill matrix used for scoring. */
export async function getRoleRequirements(req, res) {
  return ok(res, { roles: ROLES, matrix: ROLE_SKILL_MATRIX });
}
