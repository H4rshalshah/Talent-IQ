import { ENV } from "../../../lib/env.js";

// Groq provider — OpenAI-compatible chat completions API.
// Fast + generous free tier, used for low-latency interview tasks.
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export const groqProvider = {
  id: "groq",
  isConfigured: () => Boolean(ENV.GROQ_API_KEY),

  /**
   * @returns {Promise<{content:string}>} normalized completion
   */
  async complete({ system, user, jsonMode = true, maxTokens = 1200, temperature = 0.4 }) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: ENV.GROQ_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: jsonMode ? { type: "json_object" } : undefined,
      }),
    });

    if (!res.ok) {
      const err = new Error(`groq HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    if (!content.trim()) {
      const err = new Error("groq returned an empty response");
      err.status = 0;
      throw err;
    }
    return { content };
  },
};
