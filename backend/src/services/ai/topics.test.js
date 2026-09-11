import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_TOPICS,
  shiftDifficulty,
  selectNextTopic,
  topicsForRole,
  roleLabel,
} from "./topics.js";

test("shiftDifficulty clamps at both ends of the ladder", () => {
  assert.equal(shiftDifficulty("easy", -1), "easy");
  assert.equal(shiftDifficulty("hard", 1), "hard");
  assert.equal(shiftDifficulty("medium", 1), "hard");
  assert.equal(shiftDifficulty("medium", -1), "easy");
});

test("shiftDifficulty falls back to medium for unknown input", () => {
  assert.equal(shiftDifficulty("impossible", 1), "medium");
  assert.equal(shiftDifficulty(undefined, 1), "medium");
});

test("selectNextTopic prioritizes a weak area that has not been asked", () => {
  const topic = selectNextTopic({
    role: "software-engineer",
    topicPool: ["data-structures", "algorithms", "databases"],
    weakAreas: ["databases"],
    strongAreas: [],
    questionHistory: [],
    configTopics: [],
  });
  assert.equal(topic, "databases");
});

test("selectNextTopic avoids repeating recent topics", () => {
  const topic = selectNextTopic({
    role: "software-engineer",
    topicPool: ["data-structures", "algorithms"],
    weakAreas: ["data-structures"],
    strongAreas: [],
    questionHistory: ["data-structures", "data-structures", "data-structures", "data-structures"],
    configTopics: [],
  });
  assert.equal(topic, "algorithms");
});

test("selectNextTopic falls back to the least-asked topic", () => {
  const topic = selectNextTopic({
    role: "frontend-developer",
    topicPool: ["react", "javascript"],
    weakAreas: [],
    strongAreas: ["react", "javascript"],
    questionHistory: ["react", "javascript", "react"],
    configTopics: [],
  });
  // react asked twice, javascript once -> javascript has the lowest count
  assert.equal(topic, "javascript");
});

test("topicsForRole returns the role pool and a default for unknown roles", () => {
  assert.deepEqual(topicsForRole("frontend-developer"), ["javascript", "react", "web", "cs-fundamentals"]);
  assert.deepEqual(topicsForRole("unknown-role"), DEFAULT_TOPICS);
});

test("roleLabel resolves known slugs and passes through unknown ones", () => {
  assert.equal(roleLabel("backend-developer"), "Backend Developer");
  assert.equal(roleLabel("custom-role"), "custom-role");
  assert.equal(roleLabel(null), "Software Engineer");
});
