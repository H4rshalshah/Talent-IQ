import CareerRoadmap from "../models/CareerRoadmap.js";
import Performance from "../models/Performance.js";
import Interview from "../models/Interview.js";
import { generateCareerRoadmap } from "../services/ai/careerCoach.service.js";
import { ROLES } from "../services/ai/topics.js";

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

export async function getCareerRoadmap(req, res) {
  try {
    const roadmap = await CareerRoadmap.findOne({ candidate: req.user._id }).sort({ generatedAt: -1 });
    return ok(res, { roadmap });
  } catch (error) {
    console.error("Error in getCareerRoadmap:", error.message);
    return fail(res, "Unable to load career roadmap", 500);
  }
}

export async function generateCareerRoadmapForUser(req, res) {
  try {
    const { role, experienceLevel = "mid" } = req.body;

    const validRole = role && ROLES.some((r) => r.slug === role);
    if (!validRole) return fail(res, "A valid job role is required");

    // gather the candidate's actual performance data to personalize the roadmap
    const [performances, interviews] = await Promise.all([
      Performance.find({ candidate: req.user._id }).sort({ createdAt: 1 }),
      Interview.find({ candidate: req.user._id, status: "completed" }).sort({ completedAt: -1 }),
    ]);

    const interviewScores = performances.map((p) => p.overallScore).filter((s) => s != null);
    const readiness = interviewScores.length ? avg(interviewScores) : 50;

    const strengthCounts = new Map();
    const weaknessCounts = new Map();
    for (const p of performances) {
      for (const s of p.strengths || []) strengthCounts.set(s, (strengthCounts.get(s) || 0) + 1);
      for (const w of p.weaknesses || []) weaknessCounts.set(w, (weaknessCounts.get(w) || 0) + 1);
    }
    const strongSkills = [...strengthCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([s]) => s)
      .slice(0, 5);
    const skillGaps = [...weaknessCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([w]) => w)
      .slice(0, 5);

    const latestInterview = interviews[0];
    const roadmapData = await generateCareerRoadmap({
      user: req.user,
      targetRole: role,
      strongSkills,
      skillGaps,
      interviewScores,
      readiness,
      interviewId: latestInterview?._id,
    });

    const roadmap = await CareerRoadmap.create({
      candidate: req.user._id,
      targetRole: role,
      currentLevel: experienceLevel,
      readiness: roadmapData.readiness,
      strongSkills: roadmapData.strongSkills,
      skillGaps: roadmapData.skillGaps,
      recommendations: roadmapData.recommendations,
      roadmap: roadmapData.roadmap,
      generatedAt: new Date(),
    });

    return ok(res, { roadmap }, 201);
  } catch (error) {
    console.error("Error in generateCareerRoadmapForUser:", error.message);
    return fail(res, "Unable to generate career roadmap", 500);
  }
}
