import { ENV } from "../lib/env.js";
import { fail } from "../lib/apiResponse.js";

// Centralized error handling. Controllers return their own {success:false}
// responses, but anything that throws (or a request that matches no route)
// lands here so the client always receives the same shape — never a raw
// stack trace, never a bare HTML error page.

export function notFoundHandler(req, res) {
  return fail(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, "ROUTE_NOT_FOUND");
}

// Express identifies error middleware by arity — all four args are required.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = Number(err?.status || err?.statusCode) || 500;
  const isServerError = status >= 500;

  // Technical detail stays in the logs; the client gets a safe message.
  console.error(
    `💥 ${req.method} ${req.originalUrl} → ${status}:`,
    isServerError ? err.stack || err.message : err.message
  );

  const message = isServerError
    ? "Something went wrong on our end. Please try again."
    : err.message || "Request could not be processed";

  return fail(res, message, status);
}

/**
 * Minimal structured request logger: method, path, status, duration. Keeps
 * production logs free of bodies/secrets while still being useful.
 */
export function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`;
    if (res.statusCode >= 500) console.error(`❌ ${line}`);
    else if (ENV.NODE_ENV !== "production") console.log(`→ ${line}`);
  });

  next();
}
