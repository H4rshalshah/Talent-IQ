import Performance from "../models/Performance.js";
import Interview from "../models/Interview.js";

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

export async function getPerformance(req, res) {
  try {
    const performances = await Performance.find({ candidate: req.user._id }).sort({ createdAt: 1 });

    const interviewIds = performances.map((p) => p.interviewId);
    const interviews = await Interview.find({ _id: { $in: interviewIds } }).select(
      "role type difficulty status startedAt completedAt duration config"
    );
    const interviewMap = new Map(interviews.map((i) => [i._id.toString(), i]));

    const history = performances.map((p) => {
      const interview = interviewMap.get(p.interviewId.toString());
      return {
        _id: p._id,
        interviewId: p.interviewId,
        type: interview?.type || "ai",
        role: interview?.role || "",
        roleLabel: interview?.role
          ? interview.role.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
          : "Interview",
        score: p.overallScore,
        technicalScore: p.technicalScore,
        codingScore: p.codingScore,
        communicationScore: p.communicationScore,
        problemSolvingScore: p.problemSolvingScore,
        createdAt: p.createdAt,
        status: interview?.status || "completed",
      };
    });

    const overallScores = history.map((h) => h.score).filter((s) => s != null);
    const latest = history[history.length - 1] || null;

    const skillBreakdown = {
      technicalKnowledge: avg(performances.map((p) => p.technicalScore)),
      problemSolving: avg(performances.map((p) => p.problemSolvingScore)),
      coding: avg(performances.map((p) => p.codingScore)),
      communication: avg(performances.map((p) => p.communicationScore)),
      // technical + problem solving blend for cs fundamentals
      csFundamentals: avg(
        performances.map((p) => Math.round((p.technicalScore + p.problemSolvingScore) / 2))
      ),
    };

    // aggregate strengths/weaknesses across interviews (most common first)
    const strengthCounts = new Map();
    const weaknessCounts = new Map();
    for (const p of performances) {
      for (const s of p.strengths || []) strengthCounts.set(s, (strengthCounts.get(s) || 0) + 1);
      for (const w of p.weaknesses || []) weaknessCounts.set(w, (weaknessCounts.get(w) || 0) + 1);
    }
    const strengths = [...strengthCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([s]) => s)
      .slice(0, 5);
    const weaknesses = [...weaknessCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([w]) => w)
      .slice(0, 5);

    return ok(res, {
      overallScore: latest?.score ?? (overallScores.length ? avg(overallScores) : null),
      interviewCount: performances.length,
      skillBreakdown,
      history,
      strengths,
      weaknesses,
      recommendedImprovements: weaknesses,
    });
  } catch (error) {
    console.error("Error in getPerformance:", error.message);
    return fail(res, "Unable to load performance data", 500);
  }
}

export async function getPerformanceById(req, res) {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) return fail(res, "Interview not found", 404);
    if (interview.candidate.toString() !== req.user._id.toString()) {
      return fail(res, "You do not have access to this interview", 403);
    }

    const performance = await Performance.findOne({ interviewId });
    if (!performance) return fail(res, "No performance record for this interview", 404);

    return ok(res, { performance, interview });
  } catch (error) {
    console.error("Error in getPerformanceById:", error.message);
    return fail(res, "Unable to load performance data", 500);
  }
}
