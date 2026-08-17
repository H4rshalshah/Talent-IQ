import { ENV } from "../lib/env.js";
import {
  ingestAll,
  ingestJobKnowledge,
  ingestQuestionBank,
  getKnowledgeStats,
} from "../services/rag/ingestion.service.js";
import { queryVectorStore } from "../services/rag/vectorStore.service.js";
import KnowledgeDocument from "../models/KnowledgeDocument.js";

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

// RAG ingestion/search endpoints are dev/admin only.
const isDev = () => ENV.NODE_ENV !== "production";

export async function ingestKnowledge(req, res) {
  if (!isDev()) {
    return fail(res, "Ingestion is only available in development", 403);
  }
  try {
    const { source } = req.body || {};
    let result;
    if (source === "job-knowledge") result = await ingestJobKnowledge();
    else if (source === "question-bank") result = await ingestQuestionBank();
    else if (source) return fail(res, "Unknown source. Use job-knowledge, question-bank, or all");
    else result = await ingestAll();

    const stats = await getKnowledgeStats();
    return ok(res, { result, stats });
  } catch (error) {
    console.error("Error in ingestKnowledge:", error.message);
    return fail(res, "Ingestion failed", 500);
  }
}

export async function searchKnowledge(req, res) {
  if (!isDev()) {
    return fail(res, "Search is only available in development", 403);
  }
  try {
    const { query, role, topic, sourceType, topK = 6 } = req.body || {};
    if (!query || typeof query !== "string") return fail(res, "query is required");

    const filter = {};
    if (sourceType) filter.sourceType = sourceType;
    if (role) filter["metadata.role"] = role;
    if (topic) filter["metadata.topic"] = topic;

    const results = await queryVectorStore({ query, filter, topK: Number(topK) || 6 });
    return ok(res, { results });
  } catch (error) {
    console.error("Error in searchKnowledge:", error.message);
    return fail(res, "Search failed", 500);
  }
}

export async function getRagStats(req, res) {
  try {
    const stats = await getKnowledgeStats();
    const total = await KnowledgeDocument.countDocuments({});
    return ok(res, { stats, total });
  } catch (error) {
    console.error("Error in getRagStats:", error.message);
    return fail(res, "Unable to load RAG stats", 500);
  }
}
