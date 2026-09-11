// Single source of truth for the API response envelope.
//
// Success: { success: true, data: {...} }
// Error:   { success: false, message: "Human readable", code: "ERROR_CODE" }
//
// Every controller imports these so the contract can never drift between
// endpoints. `code` is a stable machine-readable identifier the frontend can
// branch on without parsing prose.

const DEFAULT_CODES = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  422: "VALIDATION_ERROR",
  429: "RATE_LIMITED",
  500: "INTERNAL_ERROR",
  502: "UPSTREAM_ERROR",
  503: "SERVICE_UNAVAILABLE",
};

export function codeForStatus(status) {
  return DEFAULT_CODES[status] || (status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST");
}

export const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });

export const fail = (res, message, status = 400, code = codeForStatus(status)) =>
  res.status(status).json({ success: false, message, code });
