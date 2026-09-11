import Problem from "../models/Problem.js";
import ProblemSubmission from "../models/ProblemSubmission.js";
import { EXECUTABLE_LANGUAGES, executeInSandbox, normalizeLine } from "../services/problems/executor.service.js";
import { generateHarness, splitAtHarness } from "../services/problems/codegen.service.js";
import {
  buildProblemFilter,
  buildProblemSort,
  parsePagination,
} from "../services/problems/problemQuery.service.js";
import { syncCodeforcesProblems } from "../services/codeforces/sync.service.js";
import { fail, ok } from "../lib/apiResponse.js";

const MAX_CODE_LENGTH = 50000;

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
 * GET /api/problems — problem bank list.
 * Filters: q, tag, difficulty, minRating, maxRating, source; pagination: page, limit.
 */
export async function listProblems(req, res) {
  try {
    const filter = buildProblemFilter(req.query);
    const { page: pageNum, limit: limitNum, skip } = parsePagination(req.query);

    const [problems, total] = await Promise.all([
      Problem.find(filter)
        .sort(buildProblemSort(req.query.sort))
        .skip(skip)
        .limit(limitNum)
        .select("slug title difficulty tags starterCode rating source url externalId solvedCount")
        .lean(),
      Problem.countDocuments(filter),
    ]);

    // Lazy self-healing: if the Codeforces bank is empty (fresh deploy or a
    // wiped DB), kick off a background sync so ANY user who opens the bank
    // sees problems. Failures are logged and never break the list request.
    let syncing = false;
    if (req.query.source !== "custom") {
      const cfCount = await Problem.countDocuments({ source: "codeforces" });
      if (cfCount === 0) {
        syncing = true;
        syncCodeforcesProblems()
          .then((stats) => console.log("✅ Lazy Codeforces sync:", JSON.stringify(stats)))
          .catch((error) => console.warn("⚠️ Lazy Codeforces sync skipped:", error.message));
      }
    }

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
        languages: Object.keys(p.starterCode || {}).filter((l) => EXECUTABLE_LANGUAGES.includes(l)),
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
      syncing,
    });
  } catch (error) {
    console.error("Error in listProblems:", error.message);
    return fail(res, "Unable to load problems", 500, "PROBLEMS_UNAVAILABLE");
  }
}

export async function getProblem(req, res) {
  try {
    const { slug } = req.params;
    const problem = await Problem.findOne({ slug }).lean();
    if (!problem) return fail(res, "Problem not found", 404, "NOT_FOUND");

    // never leak hidden judge tests to the client
    const { hiddenTestCases, codegen, ...safe } = problem;

    // only advertise languages the sandbox can actually run
    safe.starterCode = Object.fromEntries(
      Object.entries(safe.starterCode || {}).filter(([lang]) => EXECUTABLE_LANGUAGES.includes(lang))
    );

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
    return fail(res, "Unable to load problem", 500, "PROBLEM_UNAVAILABLE");
  }
}

/** POST /api/problems/:slug/bookmark — toggle the bookmark for the signed-in user. */
export async function toggleBookmark(req, res) {
  try {
    const { slug } = req.params;
    const problem = await Problem.findOne({ slug }).select("_id").lean();
    if (!problem) return fail(res, "Problem not found", 404, "NOT_FOUND");

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
      await ProblemSubmission.deleteOne({ _id: existing._id });
    } else {
      await existing.save();
    }
    return ok(res, { bookmarked });
  } catch (error) {
    console.error("Error in toggleBookmark:", error.message);
    return fail(res, "Unable to update bookmark", 500, "BOOKMARK_FAILED");
  }
}

/** GET /api/problems/progress — per-user aggregate stats for the dashboard. */
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
    return fail(res, "Unable to load progress", 500, "PROGRESS_UNAVAILABLE");
  }
}

/** Shared validation for the run/submit code paths. */
async function prepareJudgeRun(req, res) {
  const { slug } = req.params;
  const { language, code } = req.body;

  if (!language || !EXECUTABLE_LANGUAGES.includes(language)) {
    fail(res, `Language must be one of: ${EXECUTABLE_LANGUAGES.join(", ")}`, 422, "VALIDATION_ERROR");
    return null;
  }
  if (!code || typeof code !== "string" || !code.trim()) {
    fail(res, "Code is required", 422, "VALIDATION_ERROR");
    return null;
  }
  if (code.length > MAX_CODE_LENGTH) {
    fail(res, "Code is too long", 413, "PAYLOAD_TOO_LARGE");
    return null;
  }

  const problem = await Problem.findOne({ slug });
  if (!problem) {
    fail(res, "Problem not found", 404, "NOT_FOUND");
    return null;
  }
  if (!problem.starterCode?.[language]) {
    fail(res, `Language "${language}" is not supported for this problem`, 422, "VALIDATION_ERROR");
    return null;
  }

  const { fn: userFn, harness: userHarness } = splitAtHarness(code);
  if (!userHarness) {
    fail(res, "Please keep the test harness intact so your solution can be judged.", 422, "HARNESS_MODIFIED");
    return null;
  }

  return { problem, language, code, userFn };
}

function gradeResults(testCases, output) {
  const actualLines = (output || "").split("\n").map((l) => l.trim()).filter(Boolean);
  return testCases.map((t, i) => ({
    args: t.args,
    expected: t.expected,
    actual: actualLines[i] ?? "",
    passed: normalizeLine(actualLines[i] ?? "") === normalizeLine(t.expected),
  }));
}

/**
 * POST /api/problems/:slug/run — execute against the VISIBLE sample tests only.
 * Never records solved status and never exposes hidden tests.
 */
export async function runProblem(req, res) {
  try {
    const prepared = await prepareJudgeRun(req, res);
    if (!prepared) return undefined;

    const { problem, language, userFn } = prepared;
    const sampleHarness = generateHarness(language, {
      ...problem.codegen,
      tests: problem.testCases,
    });
    const program = `${userFn}\n${sampleHarness}`;

    const startedAt = Date.now();
    const result = await executeInSandbox(language, program);
    const timeMs = Date.now() - startedAt;

    if (!result.success) {
      return ok(res, {
        status: "error",
        passedCount: 0,
        totalCount: problem.testCases.length,
        results: [],
        stdout: (result.output || "").slice(0, 4000),
        error: String(result.error || "Execution failed").slice(0, 2000),
        timeMs,
      });
    }

    const results = gradeResults(problem.testCases, result.output);
    const passedCount = results.filter((r) => r.passed).length;

    return ok(res, {
      status: passedCount === results.length ? "passed" : "failed",
      passedCount,
      totalCount: results.length,
      results,
      stdout: (result.output || "").slice(0, 4000),
      error: null,
      timeMs,
    });
  } catch (error) {
    console.error("Error in runProblem:", error.message);
    return fail(res, "Unable to run code", 502, "EXECUTION_UNAVAILABLE");
  }
}

/**
 * POST /api/problems/:slug/submit — judge against sample + hidden tests and
 * record per-user status. Hidden tests are never returned to the client.
 */
export async function submitProblem(req, res) {
  try {
    const prepared = await prepareJudgeRun(req, res);
    if (!prepared) return undefined;

    const { problem, language, code, userFn } = prepared;

    const allTests = [...problem.testCases, ...(problem.hiddenTestCases || [])];
    const judgeHarness = generateHarness(language, { ...problem.codegen, tests: allTests });
    const program = `${userFn}\n${judgeHarness}`;

    const startedAt = Date.now();
    const result = await executeInSandbox(language, program);
    const timeMs = Date.now() - startedAt;

    if (!result.success) {
      await recordSubmission(req.user._id, problem.slug, language, code, "attempted", 0, allTests.length, [], timeMs);
      // Only sample tests are echoed back; hidden results stay server-side.
      return ok(res, {
        status: "attempted",
        passedCount: 0,
        totalCount: allTests.length,
        results: gradeResults(problem.testCases, ""),
        stdout: (result.output || "").slice(0, 4000),
        error: String(result.error || "Execution failed").slice(0, 2000),
        timeMs,
      });
    }

    const results = gradeResults(allTests, result.output);
    const passedCount = results.filter((r) => r.passed).length;
    const status = passedCount === allTests.length ? "solved" : "attempted";

    await recordSubmission(req.user._id, problem.slug, language, code, status, passedCount, allTests.length, results, timeMs);

    return ok(res, {
      status,
      passedCount,
      totalCount: allTests.length,
      // expose per-test detail only for the visible sample tests
      results: results.slice(0, problem.testCases.length),
      stdout: (result.output || "").slice(0, 4000),
      error: null,
      timeMs,
    });
  } catch (error) {
    console.error("Error in submitProblem:", error.message);
    return fail(res, "Unable to run submission", 502, "EXECUTION_UNAVAILABLE");
  }
}

/** Persist a judge result; preserves bookmark state on update. */
async function recordSubmission(candidate, problemSlug, language, code, status, passedCount, totalCount, results, timeMs) {
  const existing = await ProblemSubmission.findOne({ candidate, problemSlug });
  if (existing) {
    // never downgrade a solved problem back to attempted
    const nextStatus = existing.status === "solved" && status === "attempted" ? "solved" : status;
    existing.set({
      language,
      code,
      status: nextStatus,
      passedCount: Math.max(existing.passedCount || 0, passedCount),
      totalCount,
      results,
      timeMs,
      lastAttemptedAt: new Date(),
    });
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
