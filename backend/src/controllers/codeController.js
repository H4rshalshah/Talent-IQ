import { EXECUTABLE_LANGUAGES, executeInSandbox } from "../services/problems/executor.service.js";
import { fail, ok } from "../lib/apiResponse.js";

const ALLOWED_LANGUAGES = new Set(EXECUTABLE_LANGUAGES);
const MAX_CODE_LENGTH = 50000;

/**
 * POST /api/code/execute
 *
 * Runs a standalone snippet for the collaborative (human) interview editor.
 * This is the ONLY path that executes arbitrary candidate code, and it is:
 *   - authenticated (protectRoute)
 *   - rate limited (aiLimiter)
 *   - size limited
 *   - language restricted to verified sandbox runtimes
 * Execution happens in the remote Wandbox sandbox, never on the API host, so
 * snippets have no access to application secrets or the MongoDB network.
 */
export async function executeCodeSnippet(req, res) {
  try {
    const { language, code } = req.body;

    if (!language || !ALLOWED_LANGUAGES.has(language)) {
      return fail(
        res,
        `Language must be one of: ${EXECUTABLE_LANGUAGES.join(", ")}`,
        422,
        "VALIDATION_ERROR"
      );
    }
    if (!code || typeof code !== "string" || !code.trim()) {
      return fail(res, "Code is required", 422, "VALIDATION_ERROR");
    }
    if (code.length > MAX_CODE_LENGTH) {
      return fail(res, "Code is too long to execute", 413, "PAYLOAD_TOO_LARGE");
    }

    const startedAt = Date.now();
    const result = await executeInSandbox(language, code);
    const timeMs = Date.now() - startedAt;

    return ok(res, {
      success: result.success,
      stdout: (result.output || "").slice(0, 20000),
      error: result.error ? String(result.error).slice(0, 4000) : null,
      timeMs,
    });
  } catch (error) {
    console.error("Error in executeCodeSnippet:", error.message);
    return fail(res, "Unable to execute code", 502, "EXECUTION_UNAVAILABLE");
  }
}
