import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const ENV = {
  PORT: process.env.PORT,
  DB_URL: process.env.DB_URL,
  NODE_ENV: process.env.NODE_ENV,
  CLIENT_URL: process.env.CLIENT_URL,
  INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
  INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
  STREAM_API_KEY: process.env.STREAM_API_KEY,
  STREAM_API_SECRET: process.env.STREAM_API_SECRET,
  // comma-separated emails allowed to trigger the Codeforces sync
  ADMIN_EMAILS: process.env.ADMIN_EMAILS || "",
  // AI / LLM — fast & free providers. Groq is primary; Gemini is the fallback
  // used automatically when Groq hits its rate limit.
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GROQ_MODEL: process.env.GROQ_MODEL || "groq/compound-mini",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || "gemini-embedding-001",
  // "gemini" uses the Gemini embeddings API (requires GEMINI_API_KEY);
  // "local" uses a deterministic hashing embedding (no key required).
  // Auto-detected when unset: gemini if a key exists, else local.
  EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER,
  // Vector search: uses Atlas $vectorSearch when available, otherwise falls
  // back to in-memory cosine similarity over the same MongoDB collection.
  VECTOR_TOP_K: Number(process.env.VECTOR_TOP_K || 6),
};

export const hasLlmKey = () => Boolean(ENV.GROQ_API_KEY || ENV.GEMINI_API_KEY);
