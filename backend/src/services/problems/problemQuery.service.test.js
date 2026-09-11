import test from "node:test";
import assert from "node:assert/strict";

import {
  buildProblemFilter,
  buildProblemSort,
  escapeRegExp,
  normalizeDifficulty,
  parsePagination,
} from "./problemQuery.service.js";

test("normalizeDifficulty accepts any casing and rejects unknown values", () => {
  assert.equal(normalizeDifficulty("easy"), "Easy");
  assert.equal(normalizeDifficulty("HARD"), "Hard");
  assert.equal(normalizeDifficulty("expert"), "Expert");
  assert.equal(normalizeDifficulty("impossible"), null);
  assert.equal(normalizeDifficulty(""), null);
  assert.equal(normalizeDifficulty(undefined), null);
});

test("escapeRegExp neutralizes regex metacharacters", () => {
  const escaped = escapeRegExp("a.b[c](d)+*?");
  assert.doesNotThrow(() => new RegExp(escaped));
  assert.equal(escaped, "a\\.b\\[c\\]\\(d\\)\\+\\*\\?");
});

test("buildProblemFilter combines source, difficulty, tag and rating range", () => {
  const filter = buildProblemFilter({
    difficulty: "easy",
    tag: "Array",
    minRating: "1200",
    maxRating: "1600",
    source: "codeforces",
  });

  assert.equal(filter.source, "codeforces");
  assert.equal(filter.difficulty, "Easy");
  assert.equal(filter.tags, "Array");
  assert.deepEqual(filter.rating, { $gte: 1200, $lte: 1600 });
});

test("buildProblemFilter ignores unknown values instead of throwing", () => {
  const filter = buildProblemFilter({
    difficulty: "impossible",
    source: "drop-tables",
    minRating: "abc",
  });
  assert.deepEqual(filter, {});
});

test("buildProblemFilter treats a single-sided rating bound correctly", () => {
  assert.deepEqual(buildProblemFilter({ minRating: "2000" }).rating, { $gte: 2000 });
  assert.deepEqual(buildProblemFilter({ maxRating: "800" }).rating, { $lte: 800 });
});

test("buildProblemFilter escapes the search term", () => {
  const filter = buildProblemFilter({ q: "two.sum*" });
  assert.ok(Array.isArray(filter.$or));
  const rx = filter.$or[0].title;
  assert.ok(rx instanceof RegExp);
  // must match a literal "two.sum*" and not act as a wildcard
  assert.ok(rx.test("two.sum*"));
  assert.ok(!rx.test("twoXsumY"));
});

test("parsePagination clamps hostile input", () => {
  assert.deepEqual(parsePagination({ page: "0", limit: "500" }), { page: 1, limit: 100, skip: 0 });
  assert.deepEqual(parsePagination({ page: "3", limit: "20" }), { page: 3, limit: 20, skip: 40 });
  assert.deepEqual(parsePagination({}), { page: 1, limit: 20, skip: 0 });
  assert.deepEqual(parsePagination({ page: "-4", limit: "-4" }), { page: 1, limit: 1, skip: 0 });
});

test("buildProblemSort supports the solved ordering", () => {
  assert.deepEqual(buildProblemSort("solved"), { solvedCount: -1, title: 1 });
  assert.deepEqual(buildProblemSort(undefined), { order: 1, title: 1 });
});
