import { ENV } from "../lib/env.js";
import { syncCodeforcesProblems } from "../services/codeforces/sync.service.js";
import { fail, ok } from "../lib/apiResponse.js";

/** Lightweight admin gate — no auth-system changes. */
export function requireCodeforcesAdmin(req, res, next) {
  const adminEmails = (ENV.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.length) {
    return fail(res, "Codeforces sync is disabled (no ADMIN_EMAILS configured)", 403, "SYNC_DISABLED");
  }
  if (!adminEmails.includes(String(req.user?.email || "").toLowerCase())) {
    return fail(res, "You are not authorized to run the Codeforces sync", 403, "FORBIDDEN");
  }
  next();
}

/**
 * POST /api/codeforces/sync — fetch, merge, upsert. Rejects concurrent runs.
 */
export async function syncProblems(req, res) {
  try {
    const stats = await syncCodeforcesProblems();
    return ok(res, stats);
  } catch (error) {
    const status = error.code === "SYNC_IN_PROGRESS" ? 409 : 502;
    console.error("⚠️ Codeforces sync failed:", error.message);
    return fail(res, error.message, status);
  }
}
