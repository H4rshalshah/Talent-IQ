import { ENV } from "../../../lib/env.js";

// Gemini provider — Google Generative Language API (REST, no SDK).
// Response shape differs from OpenAI: text lives in
// candidates[0].content.parts[].text — normalized here so callers
// never see provider-specific shapes.
const GEMINI_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${ENV.GEMINI_API_KEY}`;

export const geminiProvider = {
  id: "gemini",
  isConfigured: () => Boolean(ENV.GEMINI_API_KEY),

  /**
   * @returns {Promise<{content:string}>} normalized completion
   */
  async complete({ system, user, jsonMode = true, maxTokens = 1200, temperature = 0.4 }) {
    const res = await fetch(GEMINI_URL(ENV.GEMINI_MODEL), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          ...(jsonMode ? { responseMimeType: "application/json" } : {}),
        },
      }),
    });

    if (!res.ok) {
      const err = new Error(`gemini HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const content = (data.candidates?.[0]?.content?.parts || [])
      .filter((part) => !part.thought)
      .map((part) => part.text || "")
      .join("");
    if (!content.trim()) {
      const err = new Error("gemini returned an empty response");
      err.status = 0;
      throw err;
    }
    return { content };
  },
};
