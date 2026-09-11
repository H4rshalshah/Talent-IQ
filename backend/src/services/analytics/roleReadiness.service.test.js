import test from "node:test";
import assert from "node:assert/strict";

import {
  MIN_READY_SCORE,
  ROLE_SKILL_MATRIX,
  averageMetric,
  computeRoleReadiness,
  practiceScore,
  topicScoresFrom,
} from "./roleReadiness.service.js";

test("every role has at least three measurable skill requirements", () => {
  for (const [role, requirements] of Object.entries(ROLE_SKILL_MATRIX)) {
    assert.ok(requirements.length >= 3, `${role} should define at least 3 skills`);
    for (const req of requirements) {
      assert.ok(req.skill);
      assert.ok(req.metric || req.topics?.length, `${role}/${req.skill} has no evidence source`);
    }
  }
});

test("averageMetric averages only present numeric fields", () => {
  const performances = [
    { codingScore: 80, technicalScore: 60 },
    { codingScore: 100, technicalScore: 40 },
  ];
  assert.equal(averageMetric(performances, "coding"), 90);
  assert.equal(averageMetric(performances, "technical"), 50);
  assert.equal(averageMetric([], "coding"), null);
  assert.equal(averageMetric(performances, "notAMetric"), null);
});

test("topicScoresFrom scales 0-10 question scores to 0-100 per topic", () => {
  const scores = topicScoresFrom([
    { topic: "algorithms", score: 8 },
    { topic: "algorithms", score: 6 },
    { topic: "databases", score: 3 },
    { topic: "databases", score: null },
    { category: "react", score: 10 },
  ]);
  assert.deepEqual(scores, { algorithms: 70, databases: 30, react: 100 });
});

test("practiceScore returns null with no solved problems and caps at 100", () => {
  assert.equal(practiceScore(0), null);
  assert.equal(practiceScore(5), 50);
  assert.equal(practiceScore(10), 100);
  assert.equal(practiceScore(50), 100);
});

test("computeRoleReadiness reports no_data instead of inventing scores", () => {
  const result = computeRoleReadiness({
    role: "software-engineer",
    performances: [],
    questions: [],
    solvedCount: 0,
  });

  assert.equal(result.overallReadiness, null);
  assert.equal(result.sufficientData, false);
  assert.ok(result.skills.every((s) => s.status === "no_data" && s.score === null));
  assert.deepEqual(result.gaps, []);
  assert.deepEqual(result.recommendedActions, []);
});

test("computeRoleReadiness derives scores, gaps and actions from stored data", () => {
  const result = computeRoleReadiness({
    role: "software-engineer",
    performances: [
      { technicalScore: 50, codingScore: 50, communicationScore: 50, problemSolvingScore: 50 },
    ],
    questions: [],
    solvedCount: 0,
  });

  assert.equal(result.overallReadiness, 50);
  assert.equal(result.sufficientData, true);
  assert.equal(result.roleLabel, "Software Engineer");
  assert.equal(result.dataPoints.interviews, 1);

  const coding = result.skills.find((s) => s.skill === "Coding");
  assert.equal(coding.score, 50);
  assert.equal(coding.status, "gap");

  assert.ok(result.gaps.includes("Coding"));
  assert.equal(result.recommendedActions.length, result.gaps.length);
  assert.equal(result.recommendedActions[0].priority, 1);
});

test("computeRoleReadiness blends interview-topic evidence with report metrics", () => {
  const result = computeRoleReadiness({
    role: "backend-developer",
    performances: [
      { technicalScore: 60, codingScore: 60, communicationScore: 60, problemSolvingScore: 60 },
    ],
    questions: [{ topic: "system-design", score: 10 }],
    solvedCount: 0,
  });

  const systemDesign = result.skills.find((s) => s.skill === "System Design");
  // problemSolving metric (60) blended with the perfect system-design topic (100)
  assert.equal(systemDesign.score, 80);
  assert.equal(systemDesign.status, "strong");
  assert.equal(systemDesign.evidenceCount, 2);
  assert.ok(result.strongAreas.includes("System Design"));
});

test("computeRoleReadiness falls back to the software-engineer matrix for unknown roles", () => {
  const result = computeRoleReadiness({ role: "does-not-exist" });
  assert.equal(result.skills.length, ROLE_SKILL_MATRIX["software-engineer"].length);
  assert.equal(result.overallReadiness, null);
});

test("MIN_READY_SCORE is the threshold that separates gaps from developing", () => {
  const justBelow = computeRoleReadiness({
    role: "data-analyst",
    performances: [
      {
        technicalScore: MIN_READY_SCORE - 1,
        codingScore: MIN_READY_SCORE - 1,
        communicationScore: MIN_READY_SCORE - 1,
        problemSolvingScore: MIN_READY_SCORE - 1,
      },
    ],
  });
  assert.ok(justBelow.gaps.length > 0);
});
