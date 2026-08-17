export const ROLES = [
  { slug: "software-engineer", label: "Software Engineer" },
  { slug: "frontend-developer", label: "Frontend Developer" },
  { slug: "backend-developer", label: "Backend Developer" },
  { slug: "full-stack-developer", label: "Full Stack Developer" },
  { slug: "data-analyst", label: "Data Analyst" },
  { slug: "machine-learning-engineer", label: "Machine Learning Engineer" },
];

export const roleLabel = (slug) => ROLES.find((r) => r.slug === slug)?.label || slug || "Interview";

export const EXPERIENCE_LEVELS = [
  { slug: "entry", label: "Entry Level (0-2 years)" },
  { slug: "mid", label: "Mid Level (2-5 years)" },
  { slug: "senior", label: "Senior Level (5+ years)" },
];

export const DIFFICULTIES = [
  { slug: "easy", label: "Easy" },
  { slug: "medium", label: "Medium" },
  { slug: "hard", label: "Hard" },
];

export const INTERVIEW_TYPES = [
  { slug: "general", label: "General Technical" },
  { slug: "behavioral", label: "Behavioral + Technical" },
  { slug: "deep-dive", label: "Deep Technical Dive" },
];

export const DURATIONS = [
  { minutes: 15, label: "15 min" },
  { minutes: 30, label: "30 min" },
  { minutes: 45, label: "45 min" },
  { minutes: 60, label: "60 min" },
];

export const ROLE_TOPICS = {
  "software-engineer": ["data-structures", "algorithms", "oop", "system-design", "databases", "cs-fundamentals"],
  "frontend-developer": ["javascript", "react", "web", "cs-fundamentals"],
  "backend-developer": ["nodejs", "databases", "system-design", "oop", "cs-fundamentals"],
  "full-stack-developer": ["javascript", "react", "nodejs", "databases", "system-design", "web"],
  "data-analyst": ["data-analysis", "databases", "cs-fundamentals"],
  "machine-learning-engineer": ["machine-learning", "data-analysis", "databases", "cs-fundamentals"],
};

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
  oop: "Object-Oriented Programming",
  "machine-learning": "Machine Learning",
  "data-analysis": "Data Analysis",
  sql: "SQL",
};

export const topicLabel = (slug) => TOPIC_LABELS[slug] || slug || "General";

export const topicsForRole = (roleSlug) => ROLE_TOPICS[roleSlug] || ROLE_TOPICS["software-engineer"];
