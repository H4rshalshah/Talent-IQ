import test from "node:test";
import assert from "node:assert/strict";

import { buildHeuristicReport, clampScore } from "./evaluation.service.js";

test("clampScore rounds and clamps to 0-100", () => {
  assert.equal(clampScore(150), 100);
  assert.equal(clampScore(-5), 0);
  assert.equal(clampScore(72.6), 73);
  assert.equal(clampScore("not a number"), 0);
  assert.equal(clampScore(undefined), 0);
});

test("buildHeuristicReport derives every score from the stored answer average", () => {
  const report = buildHeuristicReport({
    avgScore: 7.5,
    strongAreas: ["algorithms"],
    weakAreas: ["databases"],
    difficultyPath: ["easy", "medium"],
  });

  assert.equal(report.technicalScore, 75);
  assert.equal(report.codingScore, 70);
  assert.equal(report.communicationScore, 67);
  assert.equal(report.problemSolvingScore, 78);
  assert.equal(report.overallScore, 75); // no hard-question bonus
  assert.ok(report.strengths.some((s) => s.includes("algorithms")));
  assert.ok(report.weaknesses.some((w) => w.includes("databases")));
  assert.match(report.summary, /7\.5\/10/);
});

test("buildHeuristicReport awards a bonus when the candidate reached hard questions", () => {
  const withHard = buildHeuristicReport({
    avgScore: 8,
    strongAreas: [],
    weakAreas: [],
    difficultyPath: ["easy", "medium", "hard"],
  });
  assert.equal(withHard.overallScore, 85); // 80 + 5

  const withoutHard = buildHeuristicReport({
    avgScore: 8,
    strongAreas: [],
    weakAreas: [],
    difficultyPath: ["easy", "medium"],
  });
  assert.equal(withoutHard.overallScore, 80);
});

test("buildHeuristicReport never returns empty strengths or weaknesses", () => {
  const report = buildHeuristicReport({
    avgScore: 0,
    strongAreas: [],
    weakAreas: [],
    difficultyPath: [],
  });
  assert.equal(report.overallScore, 0);
  assert.equal(report.strengths.length, 1);
  assert.equal(report.weaknesses.length, 1);
});
