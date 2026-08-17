import { ENV } from "../../lib/env.js";

// Deterministic local embedding (hashing trick with sub-word n-grams).
// Quality is far below a real model, but it makes ingestion + retrieval
// work without any API key, which is useful for local development and tests.
const LOCAL_DIM = 384;
const LOCAL_SEED = 42;

function hashToIndex(token, dim, salt) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % dim;
}

function tokenize(text) {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s+#.-]/g, " ");
  const words = normalized.split(/\s+/).filter(Boolean);
  const tokens = [];
  for (const word of words) {
    if (word.length > 3) {
      for (let i = 0; i <= word.length - 3; i++) tokens.push(word.slice(i, i + 3));
    }
    tokens.push(word);
  }
  return tokens;
}

export function localEmbedText(text) {
  const vec = new Array(LOCAL_DIM).fill(0);
  const tokens = tokenize(text);
  for (const token of tokens) {
    const idx = hashToIndex(token, LOCAL_DIM, LOCAL_SEED);
    const sign = hashToIndex(token, LOCAL_DIM, LOCAL_SEED + 7) % 2 === 0 ? 1 : -1;
    vec[idx] += sign;
  }
  // L2 normalize
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < vec.length; i++) vec[i] /= norm;
  return vec;
}

export function embeddingProvider() {
  if (ENV.EMBEDDING_PROVIDER === "local") return "local";
  if (ENV.EMBEDDING_PROVIDER === "gemini" || (!ENV.EMBEDDING_PROVIDER && ENV.GEMINI_API_KEY)) {
    return "gemini";
  }
  return "local";
}

// Gemini embeddings (free tier, e.g. gemini-embedding-001). Uses the
// batchEmbedContents endpoint, falling back to local hashing on any failure.
const GEMINI_EMBED_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${ENV.GEMINI_API_KEY}`;

// keep each request well under Gemini's 2048-token input limit
function truncate(text, maxChars = 8000) {
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}

async function geminiEmbedTexts(texts) {
  const model = `models/${ENV.EMBEDDING_MODEL}`;
  const res = await fetch(GEMINI_EMBED_URL(ENV.EMBEDDING_MODEL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model,
        content: { parts: [{ text: truncate(text) }] },
      })),
    }),
  });

  if (!res.ok) throw new Error(`gemini embeddings HTTP ${res.status}`);
  const data = await res.json();
  const embeddings = (data.embeddings || []).map((e) => e.values);
  if (embeddings.length !== texts.length) throw new Error("gemini embeddings count mismatch");
  return embeddings;
}

/**
 * Embed a list of text chunks.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function embedTexts(texts) {
  const provider = embeddingProvider();

  if (provider === "gemini") {
    try {
      return await geminiEmbedTexts(texts);
    } catch (error) {
      console.error("⚠️ Gemini embedding failed, falling back to local embedding:", error.message);
    }
  }

  return texts.map((t) => localEmbedText(t));
}

export async function embedText(text) {
  const [vec] = await embedTexts([text]);
  return vec;
}
