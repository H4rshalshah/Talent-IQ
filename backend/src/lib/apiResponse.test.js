import test from "node:test";
import assert from "node:assert/strict";

import { codeForStatus, fail, ok } from "./apiResponse.js";
import { notFoundHandler } from "../middleware/errorHandler.js";

const createRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
};

test("codeForStatus maps known statuses to stable codes", () => {
  assert.equal(codeForStatus(400), "BAD_REQUEST");
  assert.equal(codeForStatus(401), "UNAUTHORIZED");
  assert.equal(codeForStatus(403), "FORBIDDEN");
  assert.equal(codeForStatus(404), "NOT_FOUND");
  assert.equal(codeForStatus(422), "VALIDATION_ERROR");
  assert.equal(codeForStatus(429), "RATE_LIMITED");
  assert.equal(codeForStatus(503), "SERVICE_UNAVAILABLE");
});

test("codeForStatus falls back safely for unknown statuses", () => {
  assert.equal(codeForStatus(418), "BAD_REQUEST");
  assert.equal(codeForStatus(599), "INTERNAL_ERROR");
});

test("ok wraps data in the success envelope with a 200 default", () => {
  const res = createRes();
  ok(res, { hello: "world" });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true, data: { hello: "world" } });
});

test("ok honours an explicit status code", () => {
  const res = createRes();
  ok(res, { _id: "1" }, 201);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
});

test("fail emits message + code and never leaks extra fields", () => {
  const res = createRes();
  fail(res, "Problem not found", 404);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { success: false, message: "Problem not found", code: "NOT_FOUND" });
});

test("fail accepts an explicit code override", () => {
  const res = createRes();
  fail(res, "Harness modified", 422, "HARNESS_MODIFIED");
  assert.equal(res.body.code, "HARNESS_MODIFIED");
});

test("notFoundHandler returns the standard envelope for unknown routes", () => {
  const res = createRes();
  notFoundHandler({ method: "GET", originalUrl: "/api/nope" }, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.success, false);
  assert.equal(res.body.code, "ROUTE_NOT_FOUND");
  assert.match(res.body.message, /GET \/api\/nope/);
});
