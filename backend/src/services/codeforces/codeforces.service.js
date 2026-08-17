const CF_API = "https://codeforces.com/api/problemset.problems";
const FETCH_TIMEOUT_MS = 20000;

/** Map a Codeforces rating to the project's difficulty ladder. */
export function difficultyFromRating(rating) {
  if (!Number.isFinite(rating)) return "Medium";
  if (rating <= 1000) return "Easy";
  if (rating <= 1600) return "Medium";
  if (rating <= 2200) return "Hard";
  return "Expert";
}

/** "4-A" style external id + unique slug ("cf-4-a"). */
export function externalIdFrom(contestId, index) {
  return `${contestId}-${index}`;
}

export function problemUrlFrom(contestId, index) {
  return `https://codeforces.com/problemset/problem/${contestId}/${index}`;
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Fetch the full Codeforces problem set with a timeout and a shape check.
 * Returns { ok: true, result } or { ok: false, error } — never throws for
 * network/API failures so callers can degrade gracefully.
 */
export async function fetchCodeforcesProblemSet() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(CF_API, { signal: controller.signal });
  } catch (error) {
    clearTimeout(timer);
    return { ok: false, error: error.name === "AbortError" ? "Codeforces API timed out" : `Codeforces API unreachable: ${error.message}` };
  }
  clearTimeout(timer);

  if (!response.ok) {
    return { ok: false, error: `Codeforces API responded with HTTP ${response.status}` };
  }

  let body;
  try {
    body = await response.json();
  } catch (error) {
    return { ok: false, error: "Codeforces API returned invalid JSON" };
  }

  // Codeforces wraps results in { status: "OK"|"FAILED", result, comment? }
  if (!body || body.status !== "OK") {
    return { ok: false, error: `Codeforces API reported failure: ${body?.comment || "unknown"}` };
  }

  const problems = body.result?.problems;
  const statistics = body.result?.problemStatistics;
  if (!Array.isArray(problems) || !Array.isArray(statistics)) {
    return { ok: false, error: "Codeforces API returned malformed result (missing problems/statistics arrays)" };
  }

  return { ok: true, problems, statistics };
}

/**
 * Merge problems with their statistics and convert into the DB format.
 * Skips entries missing required identity fields and dedupes by externalId.
 */
export function mapToProblemDocs(problems, statistics) {
  const statsByKey = new Map();
  for (const s of statistics) {
    if (s && Number.isFinite(s.contestId) && isNonEmptyString(s.index)) {
      statsByKey.set(externalIdFrom(s.contestId, s.index), s.solvedCount ?? 0);
    }
  }

  const seen = new Set();
  const docs = [];

  for (const p of problems) {
    if (!Number.isFinite(p.contestId) || !isNonEmptyString(p.index) || !isNonEmptyString(p.name)) {
      continue; // malformed entry — skip, never crash the sync
    }
    const extId = externalIdFrom(p.contestId, p.index);
    if (seen.has(extId)) continue;
    seen.add(extId);

    const rating = Number.isFinite(p.rating) ? p.rating : null;
    const tags = Array.isArray(p.tags) ? p.tags.filter(isNonEmptyString) : [];

    docs.push({
      externalId: extId,
      contestId: p.contestId,
      index: p.index,
      slug: `cf-${extId.toLowerCase()}`,
      title: p.name,
      type: p.type || "PROGRAMMING",
      rating,
      difficulty: difficultyFromRating(rating),
      tags,
      url: problemUrlFrom(p.contestId, p.index),
      solvedCount: statsByKey.get(extId) ?? 0,
      source: "codeforces",
      // order by rating so the default sort is rating-first (then title)
      order: rating ?? 3500,
    });
  }

  return docs;
}
