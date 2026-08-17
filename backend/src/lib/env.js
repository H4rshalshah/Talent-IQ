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
  // AI / LLM
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  // Optional: point the OpenAI-compatible client at a different endpoint
  // (Ollama, LM Studio, Together, Azure OpenAI, etc.)
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  LLM_MODEL: process.env.LLM_MODEL || "gpt-4o-mini",
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
  // "openai" uses the API; "local" uses a deterministic hashing embedding
  // (no key required, useful for local development). Auto-detected when unset.
  EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER,
  // Vector search: uses Atlas $vectorSearch when available, otherwise falls
  // back to in-memory cosine similarity over the same MongoDB collection.
  VECTOR_TOP_K: Number(process.env.VECTOR_TOP_K || 6),
};

export const hasLlmKey = () => Boolean(ENV.OPENAI_API_KEY);
