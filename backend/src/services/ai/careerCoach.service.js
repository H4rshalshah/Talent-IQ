import { chatCompletionJson } from "./llm.service.js";
import { retrieveContext } from "../rag/retriever.service.js";
import { buildCareerRoadmapPrompt } from "./prompts.js";
import { roleLabel, topicsForRole, topicLabel } from "./topics.js";

/**
 * Generate a personalized career roadmap for a candidate, grounded in the
 * job-knowledge collection so recommendations link to real material.
 *
 * @param {object} params
 * @param {object} params.user Mongoose user
 * @param {string} params.targetRole role slug
 * @param {string[]} params.strongSkills
 * @param {string[]} params.skillGaps
 * @param {number[]} params.interviewScores
 * @param {number} params.readiness 0-100 heuristic readiness
 * @param {string} [params.interviewId]
 * @returns {Promise<{readiness:number,strongSkills:string[],skillGaps:string[],recommendations:string[],roadmap:Array<{week:number,title:string,topics:string[],resources:string[]}>}>}
 */
export async function generateCareerRoadmap({
  user,
  targetRole,
  strongSkills = [],
  skillGaps = [],
  interviewScores = [],
  readiness = 50,
  interviewId,
}) {
  const weakAreas = skillGaps;
  const roleSlug = targetRole;

  const { chunks, grounded } = await retrieveContext({
    role: roleSlug,
    topic: "",
    weakAreas,
    candidateId: user._id?.toString(),
    interviewId: interviewId || null,
    collections: ["job-knowledge"],
    topK: 8,
  });

  const prompt = buildCareerRoadmapPrompt({
    role: roleLabel(roleSlug),
    readiness,
    strongSkills,
    skillGaps,
    weakAreas,
    interviewScores,
    retrievedContext: chunks,
    grounded,
  });

  try {
    const raw = await chatCompletionJson({
      task: "roadmap",
      system: "You are an expert AI career coach.",
      user: prompt,
      maxTokens: 1600,
    });

    const roadmap = Array.isArray(raw.roadmap)
      ? raw.roadmap
          .slice(0, 6)
          .map((week, i) => ({
            week: Number(week.week) || i + 1,
            title: String(week.title || `Week ${i + 1}`),
            topics: Array.isArray(week.topics) ? week.topics.slice(0, 5) : [],
            resources: Array.isArray(week.resources) ? week.resources.slice(0, 4) : [],
          }))
      : [];

    return {
      readiness: clampReadiness(raw.readiness ?? readiness),
      strongSkills: Array.isArray(raw.strongSkills) ? raw.strongSkills.slice(0, 6) : strongSkills,
      skillGaps: Array.isArray(raw.skillGaps) ? raw.skillGaps.slice(0, 6) : skillGaps,
      recommendations: Array.isArray(raw.recommendations) ? raw.recommendations.slice(0, 6) : [],
      roadmap,
    };
  } catch (error) {
    console.warn("⚠️ LLM career roadmap failed, using heuristic roadmap:", error.message);
    return buildHeuristicRoadmap({ roleSlug, strongSkills, skillGaps, readiness });
  }
}

function clampReadiness(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.min(Math.max(Math.round(n), 0), 100);
}

function buildHeuristicRoadmap({ roleSlug, strongSkills, skillGaps, readiness }) {
  const topics = topicsForRole(roleSlug);
  const gaps = skillGaps.length ? skillGaps : topics.slice(0, 2);

  const roadmap = [
    {
      week: 1,
      title: "Foundations Refresh",
      topics: [...new Set([...gaps.slice(0, 2), topics[0]])].slice(0, 3).map(topicLabel),
      resources: ["Official documentation for the topics above", "Interactive practice problems"],
    },
    {
      week: 2,
      title: "Core Skill Building",
      topics: [...new Set([...gaps.slice(0, 3), topics[1]])].slice(0, 3).map(topicLabel),
      resources: ["Structured courses", "Hands-on projects"],
    },
    {
      week: 3,
      title: "Applied Practice",
      topics: [...new Set([...gaps, ...topics.slice(0, 2)])].slice(0, 3).map(topicLabel),
      resources: ["Mock interviews", "Real-world mini-projects"],
    },
    {
      week: 4,
      title: "Mock Interviews & Polish",
      topics: ["Interview communication", ...gaps.slice(0, 2).map(topicLabel)],
      resources: ["Timed mock interviews", "Peer feedback sessions"],
    },
  ];

  return {
    readiness,
    strongSkills: strongSkills.slice(0, 6),
    skillGaps: gaps.slice(0, 6).map(topicLabel),
    recommendations: [
      `Strengthen ${gaps[0] ? topicLabel(gaps[0]) : "core fundamentals"} with structured practice`,
      "Complete at least one mock interview per week",
      "Build a small project that exercises your weak areas",
    ],
    roadmap,
  };
}
