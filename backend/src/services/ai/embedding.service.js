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

let openaiClient = null;

async function getOpenAIClient() {
  if (openaiClient) return openaiClient;
  // lazy import so the backend boots even without the key installed
  const { default: OpenAI } = await import("openai");
  openaiClient = new OpenAI({ apiKey: ENV.OPENAI_API_KEY, baseURL: ENV.OPENAI_BASE_URL });
  return openaiClient;
}

export function embeddingProvider() {
  if (ENV.EMBEDDING_PROVIDER === "local") return "local";
  if (ENV.OPENAI_API_KEY) return "openai";
  return "local";
}

/**
 * Embed a list of text chunks.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function embedTexts(texts) {
  const provider = embeddingProvider();

  if (provider === "openai") {
    try {
      const client = await getOpenAIClient();
      const response = await client.embeddings.create({
        model: ENV.EMBEDDING_MODEL,
        input: texts,
      });
      return response.data.map((item) => item.embedding);
    } catch (error) {
      console.error("⚠️ OpenAI embedding failed, falling back to local embedding:", error.message);
      return texts.map((t) => localEmbedText(t));
    }
  }

  return texts.map((t) => localEmbedText(t));
}

export async function embedText(text) {
  const [vec] = await embedTexts([text]);
  return vec;
}
