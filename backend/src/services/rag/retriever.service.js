import { queryVectorStore } from "./vectorStore.service.js";
import RetrievalLog from "../../models/RetrievalLog.js";
import { ENV } from "../../lib/env.js";

// Simple in-memory cache of retrieval results per query signature.
// Repeated calls for the same topic/difficulty within an interview don't
// re-query the vector store. Cache is cleared between server restarts.
const retrievalCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_ENTRIES = 200;

function cacheKey(signature) {
  return JSON.stringify(signature);
}

function getCached(key) {
  const entry = retrievalCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    retrievalCache.delete(key);
    return null;
  }
  return entry.results;
}

function setCached(key, results) {
  if (retrievalCache.size >= MAX_CACHE_ENTRIES) {
    // drop the oldest entry
    const oldest = retrievalCache.keys().next().value;
    retrievalCache.delete(oldest);
  }
  retrievalCache.set(key, { results, timestamp: Date.now() });
}

function buildQueryText({ role, topic, difficulty, question, weakAreas }) {
  const parts = [];
  if (role) parts.push(`role: ${role}`);
  if (topic) parts.push(`topic: ${topic}`);
  if (difficulty) parts.push(`difficulty: ${difficulty}`);
  if (question) parts.push(`question: ${question}`);
  if (weakAreas?.length) parts.push(`candidate weak areas: ${weakAreas.slice(0, 3).join(", ")}`);
  return parts.join("\n");
}

/**
 * Retrieve top-k relevant chunks across the given collections.
 *
 * @param {object} options
 * @param {string} options.role target role slug
 * @param {string} options.topic topic slug
 * @param {string} [options.difficulty]
 * @param {string} [options.question] extra query text (e.g. the question/answer being evaluated)
 * @param {string[]} [options.weakAreas] candidate weak areas to include in the query
 * @param {string} [options.candidateId] scopes candidate-history retrieval
 * @param {string} [options.interviewId] for retrieval logging
 * @param {string[]} [options.collections] which collections to search (default: job-knowledge + question-bank)
 * @param {number} [options.topK]
 * @param {boolean} [options.useCache] default true
 * @returns {Promise<{chunks:Array, grounded:boolean}>}
 */
export async function retrieveContext({
  role,
  topic,
  difficulty,
  question,
  weakAreas,
  candidateId,
  interviewId,
  collections = ["job-knowledge", "question-bank"],
  topK = ENV.VECTOR_TOP_K,
  useCache = true,
}) {
  const queryText = buildQueryText({ role, topic, difficulty, question, weakAreas });

  const signature = { queryText, collections, candidateId, topK };
  const key = cacheKey(signature);

  if (useCache) {
    const cached = getCached(key);
    if (cached) return cached;
  }

  const startedAt = Date.now();
  let chunks = [];

  try {
    for (const collection of collections) {
      const filter = { sourceType: collection };
      if (collection === "candidate-history" && candidateId) {
        filter["metadata.candidateId"] = String(candidateId);
      }
      if (topic) filter["metadata.topic"] = topic;
      if (role) filter["metadata.role"] = role;

      const results = await queryVectorStore({ query: queryText, filter, topK });
      chunks.push(...results);
    }

    // de-duplicate by id, keep best score first
    const seen = new Set();
    chunks = chunks
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .filter((chunk) => {
        if (seen.has(chunk.id)) return false;
        seen.add(chunk.id);
        return true;
      })
      .slice(0, topK);
  } catch (error) {
    // Retrieval failure must never block the interview — log and fall back
    // to ungrounded generation.
    console.error("⚠️ Retrieval failed, falling back to ungrounded generation:", error.message);
  }

  const grounded = chunks.length > 0;
  const latencyMs = Date.now() - startedAt;

  // log retrieval for debugging/evaluation (best-effort, never fatal)
  try {
    await RetrievalLog.create({
      interviewId: interviewId || null,
      queryText,
      collections,
      retrievedDocumentIds: chunks.map((c) => c.id),
      grounded,
      latencyMs,
    });
  } catch (error) {
    console.warn("⚠️ Could not write retrieval log:", error.message);
  }

  const result = { chunks, grounded };
  if (useCache) setCached(key, result);
  return result;
}
