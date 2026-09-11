import test from "node:test";
import assert from "node:assert/strict";

import { validateStructuredOutput } from "./aiClient.js";

test("unknown AI tasks are rejected instead of silently accepted", () => {
  assert.throws(() => validateStructuredOutput("nonsense", {}), /Unknown AI task/);
});

test("interview output is coerced to the expected shape", () => {
  const result = validateStructuredOutput("interview", {
    question: "  Explain indexing.  ",
    topic: " databases ",
    difficulty: "impossible",
  });

  assert.equal(result.question, "Explain indexing.");
  assert.equal(result.topic, "databases");
  assert.equal(result.difficulty, "medium");
  assert.equal(result.isFollowUp, false);
});

test("evaluation scores are clamped to 0-10 and inconsistent labels are derived", () => {
  const high = validateStructuredOutput("evaluation", { score: 99, correctness: "bogus" });
  assert.equal(high.score, 10);
  assert.equal(high.correctness, "strong");

  const low = validateStructuredOutput("evaluation", { score: -4 });
  assert.equal(low.score, 0);
  assert.equal(low.correctness, "weak");

  const mid = validateStructuredOutput("evaluation", "not-an-object");
  assert.equal(mid.score, 5);
  assert.equal(mid.correctness, "moderate");
});

test("markdown fences and non-arrays never leak through the interview schema", () => {
  const result = validateStructuredOutput("interview", { question: 42, followUpHint: null });
  assert.equal(result.question, "42");
  assert.deepEqual(result.missingConcepts ?? [], []);
});

test("code review output clamps both scores and caps list lengths", () => {
  const result = validateStructuredOutput("review", {
    correctnessScore: 42,
    codeQualityScore: -3,
    issues: Array.from({ length: 20 }, (_, i) => `issue ${i}`),
    missingEdgeCases: ["empty input", 7, null],
  });

  assert.equal(result.correctnessScore, 10);
  assert.equal(result.codeQualityScore, 0);
  assert.equal(result.issues.length, 6);
  assert.deepEqual(result.missingEdgeCases, ["empty input", "7", "null"]);
  assert.equal(result.timeComplexity, "Unknown");
});

test("report and roadmap outputs are clamped to 0-100 and bounded", () => {
  const report = validateStructuredOutput("report", {
    technicalScore: 150,
    codingScore: -20,
    overallScore: "abc",
    strengths: ["a", "b"],
  });
  assert.equal(report.technicalScore, 100);
  assert.equal(report.codingScore, 0);
  assert.equal(report.overallScore, 0);

  const roadmap = validateStructuredOutput("roadmap", {
    readiness: 250,
    roadmap: [{ week: "1", title: "Basics", topics: ["arrays"] }],
  });
  assert.equal(roadmap.readiness, 100);
  assert.equal(roadmap.roadmap.length, 1);
  assert.equal(roadmap.roadmap[0].week, 1);
});
