import { generateStructured, isAiConfigured } from "./aiClient.js";

// Compatibility layer — keeps the previous chatCompletionJson() API working
// while all real provider logic lives in ./aiClient.js (task routing,
// Groq/Gemini failover, JSON validation, safe fallbacks).
// New code should call aiClient.generateStructured({ task, system, user })
// directly.

export function isLlmConfigured() {
  return isAiConfigured();
}

/**
 * Run a chat completion and return parsed JSON.
 * @param {object} options
 * @param {string} options.task interview | evaluation | review | report | roadmap
 * @param {string} options.system
 * @param {string} options.user
 * @param {number} [options.maxTokens]
 * @param {number} [options.temperature]
 * @returns {Promise<object>} validated structured output (safe default on failure)
 */
export async function chatCompletionJson({ task = "interview", system, user, maxTokens = 1200, temperature = 0.4, useFallback = true }) {
  return generateStructured({ task, system, user, maxTokens, temperature, useFallback });
}
