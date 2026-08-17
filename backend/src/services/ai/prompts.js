// Centralized prompt templates. Every prompt separates the system instruction
// from retrieved context and candidate state, and asks for structured JSON.

const EXPERIENCE_LEVELS = {
  entry: "Entry level (0-2 years)",
  mid: "Mid level (2-5 years)",
  senior: "Senior level (5+ years)",
};

export function formatRetrievedContext(chunks, grounded) {
  if (!chunks || chunks.length === 0) {
    return "[No retrieved reference material was available. Use your general knowledge, and mark grounded=false.]";
  }
  const lines = chunks.map(
    (chunk, i) =>
      `[${i + 1}] (source: ${chunk.sourceType}, topic: ${chunk.metadata?.topic || "unknown"}, id: ${chunk.id})\n${chunk.content}`
  );
  return lines.join("\n\n");
}

export const buildQuestionPrompt = ({ role, experienceLevel, difficulty, topic, retrievedContext, grounded, candidateState }) => `[SYSTEM INSTRUCTION]
You are an adaptive technical interviewer for the role of ${role || "Software Engineer"}.
The candidate is ${EXPERIENCE_LEVELS[experienceLevel] || experienceLevel || "Mid level (2-5 years)"}.
You must generate ONE interview question at ${difficulty} difficulty on the topic "${topic}".
Prefer the retrieved reference material over invented specifics. The question should be answerable in a spoken interview (no whiteboard required).
Return ONLY a JSON object with this exact shape:
{
  "question": "the interview question text",
  "topic": "the topic slug",
  "difficulty": "easy|medium|hard",
  "category": "short category label",
  "followUpHint": "what a strong answer should include, used for the next follow-up",
  "grounded": ${grounded}
}

[RETRIEVED CONTEXT]
${formatRetrievedContext(retrievedContext, grounded)}

[CANDIDATE STATE]
${JSON.stringify(candidateState, null, 2)}

[TASK]
Generate the next interview question for this candidate.`;

export const buildFollowUpPrompt = ({ role, question, answer, topic, retrievedContext, grounded, candidateState }) => `[SYSTEM INSTRUCTION]
You are an adaptive technical interviewer for the role of ${role || "Software Engineer"}.
The candidate just answered a question. Decide the best next step:
- If the answer was STRONG, ask a deeper follow-up on the same topic.
- If the answer was WEAK, ask a simpler conceptual question on the same topic (or a closely related foundational concept).
- Otherwise, move to a new topic.
Prefer the retrieved reference material over invented specifics.
Return ONLY a JSON object with this exact shape:
{
  "question": "the next interview question text",
  "topic": "the topic slug",
  "difficulty": "easy|medium|hard",
  "category": "short category label",
  "isFollowUp": true or false,
  "followUpHint": "what a strong answer should include",
  "grounded": ${grounded}
}

[RETRIEVED CONTEXT]
${formatRetrievedContext(retrievedContext, grounded)}

[CANDIDATE STATE]
${JSON.stringify(candidateState, null, 2)}

[LAST QUESTION]
${question}

[LAST ANSWER]
${answer}

[TASK]
Generate the next question for this candidate.`;

export const buildEvaluationPrompt = ({ role, question, topic, difficulty, answer, retrievedContext, grounded }) => `[SYSTEM INSTRUCTION]
You are an expert technical interviewer evaluating a candidate's spoken answer for a ${role || "Software Engineer"} position.
Evaluate the answer on correctness, technical depth, completeness, reasoning, confidence, and problem-solving.
Prefer the retrieved reference material when judging correctness, but do not be harsher than the material requires.
Return ONLY a JSON object with this exact shape:
{
  "score": 0-10 integer,
  "correctness": "strong|moderate|weak",
  "technicalDepth": "excellent|good|fair|poor",
  "completeness": "complete|partial|incomplete",
  "missingConcepts": ["concept names the candidate missed or got wrong"],
  "strengths": ["what the candidate did well"],
  "feedback": "1-3 sentence constructive feedback for the candidate (no score, no grading language)",
  "recommendedDifficulty": "easy|medium|hard",
  "nextTopic": "topic slug for the next question",
  "grounded": ${grounded}
}

[RETRIEVED CONTEXT]
${formatRetrievedContext(retrievedContext, grounded)}

[QUESTION]
${question} (topic: ${topic}, difficulty: ${difficulty})

[CANDIDATE ANSWER]
${answer}

[TASK]
Evaluate the candidate's answer.`;

export const buildCodeReviewPrompt = ({ problemTitle, problemStatement, language, code, testResults, retrievedContext, grounded, solutionApproach = "" }) => `[SYSTEM INSTRUCTION]
You are a senior engineer performing a code review of a candidate's solution to a coding interview problem.
Evaluate correctness, time complexity, space complexity, code quality, edge cases, and suggest optimizations.
Prefer the retrieved reference solutions and optimization patterns when comparing approaches.
Return ONLY a JSON object with this exact shape:
{
  "correctnessScore": 0-10 integer,
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "codeQualityScore": 0-10 integer,
  "issues": ["specific issues found in the code"],
  "missingEdgeCases": ["edge cases likely mishandled"],
  "suggestedOptimization": "concrete optimization suggestion",
  "optimizedTimeComplexity": "O(n)",
  "optimizedSpaceComplexity": "O(1)",
  "summary": "2-4 sentence overall review summary",
  "grounded": ${grounded}
}

[RETRIEVED CONTEXT]
${formatRetrievedContext(retrievedContext, grounded)}

[PROBLEM]
${problemTitle}
${problemStatement}
${solutionApproach ? `\n[EXPECTED SOLUTION APPROACH]\n${solutionApproach}` : ""}

[LANGUAGE]
${language}

[CANDIDATE CODE]
${code}

[TEST RESULTS]
${JSON.stringify(testResults || {})}

[TASK]
Review the candidate's code.`;

export const buildPerformanceReportPrompt = ({ role, questions, avgScore, difficultyPath, strongAreas, weakAreas, grounded }) => `[SYSTEM INSTRUCTION]
You are an expert interviewer generating a performance report for a candidate after a ${role || "Software Engineer"} interview.
Return ONLY a JSON object with this exact shape:
{
  "technicalScore": 0-100 integer,
  "codingScore": 0-100 integer,
  "communicationScore": 0-100 integer,
  "problemSolvingScore": 0-100 integer,
  "overallScore": 0-100 integer,
  "strengths": ["strength statements"],
  "weaknesses": ["weakness statements"],
  "summary": "2-3 sentence overall summary"
}

[INTERVIEW DATA]
Average question score: ${avgScore}/10
Difficulty progression: ${difficultyPath.join(" -> ")}
Strong areas: ${strongAreas.join(", ") || "none recorded"}
Weak areas: ${weakAreas.join(", ") || "none recorded"}

[QUESTIONS AND EVALUATIONS]
${JSON.stringify(
  questions.map((q) => ({
    question: q.question,
    topic: q.topic || q.category,
    difficulty: q.difficulty,
    score: q.score,
    evaluation: q.evaluation,
  })),
  null,
  2
)}

[TASK]
Generate the performance report.`;

export const buildCareerRoadmapPrompt = ({ role, readiness, strongSkills, skillGaps, weakAreas, interviewScores, retrievedContext, grounded }) => `[SYSTEM INSTRUCTION]
You are an expert AI career coach building a personalized improvement roadmap for a candidate targeting the role "${role}".
Ground every recommendation in the retrieved learning material when available.
Return ONLY a JSON object with this exact shape:
{
  "readiness": 0-100 integer,
  "strongSkills": ["skills the candidate is strong at"],
  "skillGaps": ["skills the candidate needs to improve"],
  "recommendations": ["3-6 concrete recommendations"],
  "roadmap": [
    { "week": 1, "title": "week theme", "topics": ["topic names"], "resources": ["specific learning resources/topics"] }
  ]
}
Generate 4-6 weeks of roadmap.

[RETRIEVED CONTEXT]
${formatRetrievedContext(retrievedContext, grounded)}

[CANDIDATE PROFILE]
Current readiness: ${readiness}%
Strong skills: ${strongSkills.join(", ") || "unknown"}
Skill gaps / weak areas: ${[...new Set([...skillGaps, ...weakAreas])].join(", ") || "unknown"}
Recent interview scores: ${interviewScores.join(", ") || "no interviews yet"}

[TASK]
Generate the personalized career roadmap.`;
