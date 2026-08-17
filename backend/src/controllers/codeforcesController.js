import { ENV } from "../lib/env.js";
import { syncCodeforcesProblems } from "../services/codeforces/sync.service.js";

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

/** Lightweight admin gate — no auth-system changes. */
export function requireCodeforcesAdmin(req, res, next) {
  const adminEmails = (ENV.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.length) {
    return res.status(403).json({ success: false, message: "Codeforces sync is disabled (no ADMIN_EMAILS configured)" });
  }
  if (!adminEmails.includes(String(req.user?.email || "").toLowerCase())) {
    return res.status(403).json({ success: false, message: "You are not authorized to run the Codeforces sync" });
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
