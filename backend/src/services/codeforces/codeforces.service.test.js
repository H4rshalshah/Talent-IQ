import test from "node:test";
import assert from "node:assert/strict";

import {
  difficultyFromRating,
  externalIdFrom,
  mapToProblemDocs,
  problemUrlFrom,
} from "./codeforces.service.js";

test("difficultyFromRating maps the Codeforces rating bands", () => {
  assert.equal(difficultyFromRating(800), "Easy");
  assert.equal(difficultyFromRating(1000), "Easy");
  assert.equal(difficultyFromRating(1200), "Medium");
  assert.equal(difficultyFromRating(1600), "Medium");
  assert.equal(difficultyFromRating(1800), "Hard");
  assert.equal(difficultyFromRating(2200), "Hard");
  assert.equal(difficultyFromRating(2400), "Expert");
  assert.equal(difficultyFromRating(undefined), "Medium");
});

test("externalIdFrom builds the contest-index identity", () => {
  assert.equal(externalIdFrom(4, "A"), "4-A");
  assert.equal(externalIdFrom(1900, "E2"), "1900-E2");
});

test("problemUrlFrom builds the canonical Codeforces problem URL", () => {
  assert.equal(problemUrlFrom(4, "A"), "https://codeforces.com/problemset/problem/4/A");
  assert.equal(problemUrlFrom(1900, "E2"), "https://codeforces.com/problemset/problem/1900/E2");
});

test("mapToProblemDocs merges statistics, dedupes and skips malformed entries", () => {
  const problems = [
    { contestId: 4, index: "A", name: "Watermelon", rating: 800, tags: ["math", "brute force"] },
    // duplicate -> must be dropped
    { contestId: 4, index: "A", name: "Watermelon (dupe)", rating: 800, tags: ["math"] },
    // malformed entries -> must be skipped, never crash
    { contestId: undefined, index: "B", name: "No contest" },
    { contestId: 5, index: "", name: "No index" },
    { contestId: 6, index: "C", name: "" },
    { contestId: 1900, index: "E2", name: "Hard One", rating: 2600, tags: ["graphs"] },
  ];
  const statistics = [
    { contestId: 4, index: "A", solvedCount: 123456 },
    { contestId: 1900, index: "E2", solvedCount: 42 },
  ];

  const docs = mapToProblemDocs(problems, statistics);

  assert.equal(docs.length, 2);

  const watermelon = docs.find((d) => d.externalId === "4-A");
  assert.equal(watermelon.slug, "cf-4-a");
  assert.equal(watermelon.title, "Watermelon");
  assert.equal(watermelon.difficulty, "Easy");
  assert.equal(watermelon.solvedCount, 123456);
  assert.equal(watermelon.source, "codeforces");
  assert.equal(watermelon.url, "https://codeforces.com/problemset/problem/4/A");
  assert.equal(watermelon.order, 800);

  const hard = docs.find((d) => d.externalId === "1900-E2");
  assert.equal(hard.difficulty, "Expert");
  assert.equal(hard.order, 2600);
});

test("mapToProblemDocs keeps unrated problems with a null rating", () => {
  const docs = mapToProblemDocs(
    [{ contestId: 7, index: "A", name: "Unrated", tags: [] }],
    []
  );
  assert.equal(docs.length, 1);
  assert.equal(docs[0].rating, null);
  assert.equal(docs[0].difficulty, "Medium");
  assert.equal(docs[0].solvedCount, 0);
});
