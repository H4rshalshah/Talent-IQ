// Pure query-building logic for the problem bank list.
//
// Kept separate from the controller so it can be unit tested without a
// database and reused by any future endpoint (recommendations, search, ...).

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert"];

/** Escape user input before it is embedded in a RegExp (prevents ReDoS/injection). */
export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normalize a difficulty filter ("easy" -> "Easy"). Returns null when the
 * value is not a valid difficulty so the caller can ignore it.
 */
export function normalizeDifficulty(value) {
  if (!value || typeof value !== "string") return null;
  const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  return DIFFICULTIES.includes(normalized) ? normalized : null;
}

export const PROBLEM_SOURCES = ["custom", "codeforces", "ai_generated"];

/**
 * Build a Mongo filter from raw query params. Unknown/invalid values are
 * ignored rather than rejected — list endpoints should never 400 on a filter.
 */
export function buildProblemFilter(query = {}) {
  const { difficulty, tag, q, minRating, maxRating, source } = query;
  const filter = {};

  if (source && PROBLEM_SOURCES.includes(source)) filter.source = source;

  const normalizedDifficulty = normalizeDifficulty(difficulty);
  if (normalizedDifficulty) filter.difficulty = normalizedDifficulty;

  if (tag && typeof tag === "string") filter.tags = tag;

  const min = Number(minRating);
  const max = Number(maxRating);
  if (Number.isFinite(min) || Number.isFinite(max)) {
    filter.rating = {};
    if (Number.isFinite(min)) filter.rating.$gte = min;
    if (Number.isFinite(max)) filter.rating.$lte = max;
  }

  if (q && String(q).trim()) {
    const rx = new RegExp(escapeRegExp(String(q).trim()), "i");
    filter.$or = [{ title: rx }, { tags: rx }, { externalId: rx }, { index: rx }];
  }

  return filter;
}

/** Clamp pagination so a hostile limit can never exhaust the DB. */
export function parsePagination({ page, limit } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  return { page: pageNum, limit: limitNum, skip: (pageNum - 1) * limitNum };
}

export function buildProblemSort(sort) {
  return sort === "solved" ? { solvedCount: -1, title: 1 } : { order: 1, title: 1 };
}
