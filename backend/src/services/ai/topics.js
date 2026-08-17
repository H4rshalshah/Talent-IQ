// Role slugs used by the AI interview configurator and the RAG metadata.
export const ROLES = [
  { slug: "software-engineer", label: "Software Engineer" },
  { slug: "frontend-developer", label: "Frontend Developer" },
  { slug: "backend-developer", label: "Backend Developer" },
  { slug: "full-stack-developer", label: "Full Stack Developer" },
  { slug: "data-analyst", label: "Data Analyst" },
  { slug: "machine-learning-engineer", label: "Machine Learning Engineer" },
];

export const roleLabel = (slug) => ROLES.find((r) => r.slug === slug)?.label || slug || "Software Engineer";

// Topic pools per role. The adaptive engine cycles through these, biasing
// toward the candidate's weak areas and away from their strong areas.
export const ROLE_TOPICS = {
  "software-engineer": ["data-structures", "algorithms", "oop", "system-design", "databases", "cs-fundamentals"],
  "frontend-developer": ["javascript", "react", "web", "cs-fundamentals"],
  "backend-developer": ["nodejs", "databases", "system-design", "oop", "cs-fundamentals"],
  "full-stack-developer": ["javascript", "react", "nodejs", "databases", "system-design", "web"],
  "data-analyst": ["data-analysis", "databases", "cs-fundamentals"],
  "machine-learning-engineer": ["machine-learning", "data-analysis", "databases", "cs-fundamentals"],
};

export const DEFAULT_TOPICS = ["data-structures", "algorithms", "javascript", "system-design"];

export function topicsForRole(role) {
  return ROLE_TOPICS[role] || DEFAULT_TOPICS;
}

export const TOPIC_LABELS = {
  "data-structures": "Data Structures",
  algorithms: "Algorithms",
  "system-design": "System Design",
  databases: "Databases",
  "cs-fundamentals": "CS Fundamentals",
  javascript: "JavaScript",
  react: "React",
  nodejs: "Node.js",
  web: "Web Fundamentals",
  oop: "OOP",
  "machine-learning": "Machine Learning",
  "data-analysis": "Data Analysis",
  sql: "SQL",
};

export const topicLabel = (slug) => TOPIC_LABELS[slug] || slug || "General";

// Difficulty ladder for the adaptive engine.
export const DIFFICULTY_LADDER = ["easy", "medium", "hard"];

export function shiftDifficulty(current, delta) {
  const idx = DIFFICULTY_LADDER.indexOf(current);
  if (idx === -1) return "medium";
  const next = Math.min(Math.max(idx + delta, 0), DIFFICULTY_LADDER.length - 1);
  return DIFFICULTY_LADDER[next];
}

/**
 * Deterministic adaptive topic selection.
 * - Prefers weak areas the candidate has not been asked about yet.
 * - Avoids repeating recent topics.
 * - Otherwise cycles through the role's topic pool.
 */
export function selectNextTopic({ role, topicPool, weakAreas, strongAreas, questionHistory, configTopics }) {
  const pool = [...new Set([...(configTopics || []), ...(topicPool || DEFAULT_TOPICS)])];
  if (pool.length === 0) return "general";

  const history = questionHistory || [];

  // 1) weak areas first (not yet covered recently)
  const weakUnasked = (weakAreas || []).filter(
    (t) => pool.includes(t) && !history.slice(-4).includes(t)
  );
  if (weakUnasked.length > 0) return weakUnasked[0];

  // 2) skip strong areas when possible
  const strong = strongAreas || [];
  const candidates = pool.filter((t) => !strong.includes(t) && !history.slice(-2).includes(t));
  if (candidates.length > 0) return candidates[0];

  // 3) cycle: least-recently-asked topic
  const counts = new Map();
  for (const t of history) counts.set(t, (counts.get(t) || 0) + 1);
  return [...pool].sort((a, b) => (counts.get(a) || 0) - (counts.get(b) || 0))[0];
}
