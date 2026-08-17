import Problem from "../models/Problem.js";
import ProblemSubmission from "../models/ProblemSubmission.js";
import { executePiston, normalizeLine } from "../services/problems/executor.service.js";
import { generateHarness, splitAtHarness } from "../services/problems/codegen.service.js";

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

async function latestUserStatus(candidateId, slugs) {
  if (!slugs.length) return {};
  const submissions = await ProblemSubmission.find({ candidate: candidateId, problemSlug: { $in: slugs } })
    .sort({ createdAt: -1 })
    .select("problemSlug status bookmarked");
  const map = {};
  for (const s of submissions) {
    if (map[s.problemSlug] === undefined) map[s.problemSlug] = s;
  }
  return map;
}

/**
 * GET /api/problems — LeetCode/CF-style bank list.
 * Filters: q (title/tag/externalId), tag, difficulty, minRating, maxRating,
 * source; pagination: page, limit. Keeps the legacy `problems` array shape
 * while adding `pagination`.
 */
export async function listProblems(req, res) {
  try {
    const { difficulty, tag, q, minRating, maxRating, source, sort, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (source) filter.source = source;
    if (difficulty) {
      const d = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
      if (["Easy", "Medium", "Hard", "Expert"].includes(d)) filter.difficulty = d;
    }
    if (tag) filter.tags = tag;

    const min = Number(minRating);
    const max = Number(maxRating);
    if (Number.isFinite(min) || Number.isFinite(max)) {
      filter.rating = {};
      if (Number.isFinite(min)) filter.rating.$gte = min;
      if (Number.isFinite(max)) filter.rating.$lte = max;
    }

    if (q && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: rx }, { tags: rx }, { externalId: rx }, { index: rx }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const sortSpec =
      sort === "solved" ? { solvedCount: -1, title: 1 } : { order: 1, title: 1 };

    const [problems, total] = await Promise.all([
      Problem.find(filter)
        .sort(sortSpec)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .select("slug title difficulty tags starterCode rating source url externalId solvedCount")
        .lean(),
      Problem.countDocuments(filter),
    ]);

    const statusMap = await latestUserStatus(
      req.user._id,
      problems.map((p) => p.slug)
    );

    const data = problems.map((p) => {
      const st = statusMap[p.slug];
      return {
        slug: p.slug,
        title: p.title,
        difficulty: p.difficulty,
        tags: p.tags,
        status: st?.status || null,
        bookmarked: Boolean(st?.bookmarked),
        languages: Object.keys(p.starterCode || {}),
        rating: p.rating ?? null,
        source: p.source || "custom",
        externalId: p.externalId || "",
        url: p.url || "",
        solvedCount: p.solvedCount || 0,
      };
    });

    return ok(res, {
      problems: data,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error in listProblems:", error.message);
    return fail(res, "Unable to load problems", 500);
  }
}

export async function getProblem(req, res) {
  try {
    const { slug } = req.params;
    const problem = await Problem.findOne({ slug }).lean();
    if (!problem) return fail(res, "Problem not found", 404);

    // never leak hidden judge tests to the client
    const { hiddenTestCases, codegen, ...safe } = problem;

    // per-user progress for this problem
    const progress = await ProblemSubmission.findOne({
      candidate: req.user._id,
      problemSlug: slug,
    })
      .sort({ createdAt: -1 })
      .select("status bookmarked lastAttemptedAt")
      .lean();

    safe.userProgress = progress || null;
    return ok(res, { problem: safe });
  } catch (error) {
    console.error("Error in getProblem:", error.message);
    return fail(res, "Unable to load problem", 500);
  }
}

/**
 * POST /api/problems/:slug/bookmark — toggle the bookmark for the signed-in user.
 */
export async function toggleBookmark(req, res) {
  try {
    const { slug } = req.params;
    const problem = await Problem.findOne({ slug }).select("_id").lean();
    if (!problem) return fail(res, "Problem not found", 404);

    const existing = await ProblemSubmission.findOne({
      candidate: req.user._id,
      problemSlug: slug,
    });

    if (!existing) {
      await ProblemSubmission.create({
        candidate: req.user._id,
        problemSlug: slug,
        bookmarked: true,
      });
      return ok(res, { bookmarked: true });
    }

    const bookmarked = !existing.bookmarked;
    existing.bookmarked = bookmarked;
    if (!bookmarked && !existing.code && existing.status === "attempted" && !existing.lastAttemptedAt) {
      // a pure-bookmark row that is being un-bookmarked can be removed
      await ProblemSubmission.deleteOne({ _id: existing._id });
    } else {
      await existing.save();
    }
    return ok(res, { bookmarked });
  } catch (error) {
    console.error("Error in toggleBookmark:", error.message);
    return fail(res, "Unable to update bookmark", 500);
  }
}

/**
 * GET /api/problems/progress — per-user aggregate stats for the dashboard.
 */
export async function getUserProgress(req, res) {
  try {
    const [solved, attempted, bookmarked, submissions] = await Promise.all([
      ProblemSubmission.countDocuments({ candidate: req.user._id, status: "solved" }),
      ProblemSubmission.countDocuments({ candidate: req.user._id, status: "attempted" }),
      ProblemSubmission.countDocuments({ candidate: req.user._id, bookmarked: true }),
      ProblemSubmission.findOne({ candidate: req.user._id, lastAttemptedAt: { $ne: null } })
        .sort({ lastAttemptedAt: -1 })
        .select("lastAttemptedAt problemSlug")
        .lean(),
    ]);

    return ok(res, {
      solved,
      attempted,
      bookmarked,
      lastAttemptedAt: submissions?.lastAttemptedAt || null,
      lastProblemSlug: submissions?.problemSlug || null,
    });
  } catch (error) {
    console.error("Error in getUserProgress:", error.message);
    return fail(res, "Unable to load progress", 500);
  }
}

export async function submitProblem(req, res) {
  try {
    const { slug } = req.params;
    const { language, code } = req.body;

    if (!language || !code || typeof code !== "string" || !code.trim()) {
      return fail(res, "language and code are required");
    }
    if (code.length > 50000) return fail(res, "Code is too long");

    const problem = await Problem.findOne({ slug });
    if (!problem) return fail(res, "Problem not found", 404);
    if (!problem.starterCode?.[language]) {
      return fail(res, `Language "${language}" is not supported for this problem`);
    }

    const { fn: userFn, harness: userHarness } = splitAtHarness(code);
    if (!userHarness) {
      return fail(res, "Please keep the test harness intact so your solution can be judged.");
    }

    const allTests = [...problem.testCases, ...(problem.hiddenTestCases || [])];
    const judgeHarness = generateHarness(language, { ...problem.codegen, tests: allTests });
    const program = userFn + "\n" + judgeHarness;

    const startedAt = Date.now();
    const result = await executePiston(language, program);
    const timeMs = Date.now() - startedAt;

    if (!result.success) {
      await recordSubmission(req.user._id, slug, language, code, "attempted", 0, allTests.length, [], timeMs);
      return ok(res, {
        status: "attempted",
        passedCount: 0,
        totalCount: allTests.length,
        results: [],
        error: (result.error || "Execution failed").slice(0, 2000),
        timeMs,
      });
    }

    const actualLines = (result.output || "").split("\n").map((l) => l.trim()).filter(Boolean);
    const results = allTests.map((t, i) => ({
      args: t.args,
      expected: t.expected,
      actual: actualLines[i] ?? "",
      passed: normalizeLine(actualLines[i] ?? "") === normalizeLine(t.expected),
    }));

    const passedCount = results.filter((r) => r.passed).length;
    const status = passedCount === allTests.length ? "solved" : "attempted";

    await recordSubmission(req.user._id, slug, language, code, status, passedCount, allTests.length, results, timeMs);

    return ok(res, {
      status,
      passedCount,
      totalCount: allTests.length,
      results,
      output: result.output.slice(0, 4000),
      timeMs,
    });
  } catch (error) {
    console.error("Error in submitProblem:", error.message);
    return fail(res, "Unable to run submission", 500);
  }
}

/** Persist a judge result; preserves bookmark state on update. */
async function recordSubmission(candidate, problemSlug, language, code, status, passedCount, totalCount, results, timeMs) {
  const existing = await ProblemSubmission.findOne({ candidate, problemSlug });
  if (existing) {
    existing.set({ language, code, status, passedCount, totalCount, results, timeMs, lastAttemptedAt: new Date() });
    return existing.save();
  }
  return ProblemSubmission.create({
    candidate,
    problemSlug,
    language,
    code,
    status,
    passedCount,
    totalCount,
    results,
    timeMs,
    lastAttemptedAt: new Date(),
  });
}
