import { ENV, hasLlmKey } from "../../lib/env.js";

let openaiClient = null;

async function getClient() {
  if (openaiClient) return openaiClient;
  const { default: OpenAI } = await import("openai");
  openaiClient = new OpenAI({ apiKey: ENV.OPENAI_API_KEY, baseURL: ENV.OPENAI_BASE_URL });
  return openaiClient;
}

export function isLlmConfigured() {
  return hasLlmKey();
}

/**
 * Run a chat completion and return parsed JSON.
 *
 * @param {object} options
 * @param {string} options.system
 * @param {string} options.user
 * @param {boolean} [options.jsonMode] request a JSON object response
 * @param {number} [options.maxTokens]
 * @param {number} [options.temperature]
 * @param {number} [options.maxRetries] retries on malformed JSON / transient errors
 * @returns {Promise<object>} parsed JSON
 * @throws {Error} when the LLM is not configured or fails after retries
 */
export async function chatCompletionJson({
  system,
  user,
  jsonMode = true,
  maxTokens = 1200,
  temperature = 0.4,
  maxRetries = 2,
}) {
  if (!hasLlmKey()) {
    throw new Error("LLM is not configured: OPENAI_API_KEY is missing");
  }

  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const client = await getClient();
      const response = await client.chat.completions.create({
        model: ENV.LLM_MODEL,
        temperature,
        max_tokens: maxTokens,
        response_format: jsonMode ? { type: "json_object" } : undefined,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });

      const content = response.choices?.[0]?.message?.content || "";
      if (!content.trim()) throw new Error("Empty LLM response");

      if (jsonMode) {
        try {
          return JSON.parse(content);
        } catch {
          // try to extract the JSON object embedded in the text
          const match = content.match(/\{[\s\S]*\}/);
          if (match) return JSON.parse(match[0]);
          throw new Error("Malformed JSON from LLM");
        }
      }

      return { text: content };
    } catch (error) {
      lastError = error;
      // no point retrying auth/config errors
      if (/api key|authentication|401|403/i.test(error.message)) break;
      // small backoff between retries
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }

  throw new Error(lastError?.message || "LLM request failed");
}
