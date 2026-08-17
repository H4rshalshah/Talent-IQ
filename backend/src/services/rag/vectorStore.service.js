import mongoose from "mongoose";
import { embedTexts } from "../ai/embedding.service.js";
import KnowledgeDocument from "../../models/KnowledgeDocument.js";

// ---------------------------------------------------------------------------
// Vector store abstraction.
//
// All vector operations in the codebase go through this module so the actual
// provider can be swapped later (Pinecone, Qdrant, pgvector, ...) without
// touching business logic.
//
// Current backend: MongoDB.
//   - When an Atlas $vectorSearch index exists for the collection, queries use
//     Atlas vector search.
//   - Otherwise (local MongoDB, no index, or index creation not possible) we
//     fall back to computing cosine similarity in-process over documents
//     loaded from the same collection. Embeddings are cached in memory so the
//     fallback stays fast for typical interview-sized collections.
// ---------------------------------------------------------------------------

// in-memory cache of embeddings for the cosine fallback
const embeddingCache = new Map(); // key -> { _id, embedding, content, title, metadata }
let cacheLoaded = false;

// set to true after the first Atlas $vectorSearch failure so we don't retry
// (and re-log) on every query within this process
let atlasUnavailable = false;

function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function tryAtlasSearch({ collectionFilter, queryVector, topK, indexName }) {
  const collection = mongoose.connection.collection("knowledgedocuments");

  const pipeline = [
    {
      $vectorSearch: {
        queryVector,
        path: "embedding",
        limit: topK,
        numCandidates: Math.max(topK * 10, 50),
        index: indexName,
        filter: collectionFilter || {},
      },
    },
    { $project: { _id: 1, title: 1, content: 1, sourceType: 1, metadata: 1, score: { $meta: "vectorSearchScore" } } },
  ];

  const results = await collection.aggregate(pipeline).toArray();
  return results.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title,
    content: doc.content,
    sourceType: doc.sourceType,
    metadata: doc.metadata,
    score: doc.score,
  }));
}

async function loadAllForFallback() {
  if (cacheLoaded) return;
  embeddingCache.clear();
  const docs = await KnowledgeDocument.find({ embedding: { $ne: [] } })
    .select("_id title content sourceType metadata embedding")
    .lean();
  for (const doc of docs) {
    embeddingCache.set(doc._id.toString(), {
      id: doc._id.toString(),
      title: doc.title,
      content: doc.content,
      sourceType: doc.sourceType,
      metadata: doc.metadata,
      embedding: doc.embedding,
    });
  }
  cacheLoaded = true;
}

async function cosineSearch({ collectionFilter, queryVector, topK }) {
  await loadAllForFallback();

  const matches = [];
  for (const entry of embeddingCache.values()) {
    if (!entry.embedding || entry.embedding.length === 0) continue;

    let matchesFilter = true;
    if (collectionFilter) {
      for (const [field, value] of Object.entries(collectionFilter)) {
        // support dotted paths like "metadata.topic"
        let docValue;
        if (field === "sourceType") {
          docValue = entry.sourceType;
        } else if (field.startsWith("metadata.")) {
          docValue = entry.metadata?.[field.slice("metadata.".length)];
        } else {
          docValue = entry.metadata?.[field];
        }
        if (docValue !== value) {
          matchesFilter = false;
          break;
        }
      }
    }
    if (!matchesFilter) continue;

    const score = cosine(queryVector, entry.embedding);
    if (score > 0) matches.push({ ...entry, score });
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, topK).map(({ id, title, content, sourceType, metadata, score }) => ({
    id,
    title,
    content,
    sourceType,
    metadata,
    score,
  }));
}

/**
 * Query the vector store for the top-k most relevant documents.
 *
 * @param {object} options
 * @param {string} options.query text query to embed
 * @param {object} [options.filter] equality filter applied to sourceType/metadata
 * @param {number} [options.topK]
 * @param {string} [options.indexName] Atlas vector search index name
 * @returns {Promise<Array<{id,title,content,sourceType,metadata,score}>>}
 */
export async function queryVectorStore({ query, filter = {}, topK = 6, indexName = "vector_index" }) {
  const [queryVector] = await embedTexts([query]);

  // 1) try Atlas $vectorSearch (only makes sense when the index exists)
  if (!atlasUnavailable) {
    try {
      const results = await tryAtlasSearch({ collectionFilter: filter, queryVector, topK, indexName });
      if (results.length > 0) return results;
    } catch (error) {
      // index missing / not on Atlas / unsupported — fall through to cosine
      if (!/index|ns not found|command not found/i.test(error.message)) {
        console.warn("⚠️ Atlas vector search unavailable, using cosine fallback:", error.message);
      }
      atlasUnavailable = true;
    }
  }

  // 2) cosine fallback over the same collection
  return cosineSearch({ collectionFilter: filter, queryVector, topK });
}

/**
 * Upsert documents into the vector store.
 * @param {Array<{key:string,sourceType:string,title:string,content:string,metadata:object}>} docs
 */
export async function upsertDocuments(docs) {
  if (docs.length === 0) return { upserted: 0 };

  const texts = docs.map((doc) => doc.content);
  const embeddings = await embedTexts(texts);

  let upserted = 0;
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    await KnowledgeDocument.updateOne(
      { key: doc.key },
      {
        $set: {
          key: doc.key,
          sourceType: doc.sourceType,
          title: doc.title || "",
          content: doc.content,
          embedding: embeddings[i],
          metadata: doc.metadata || {},
        },
      },
      { upsert: true }
    );
    upserted++;
  }

  // invalidate the cosine fallback cache
  cacheLoaded = false;
  return { upserted };
}

export async function deleteDocuments(filter) {
  const result = await KnowledgeDocument.deleteMany(filter);
  cacheLoaded = false;
  return result;
}

export async function countDocuments(filter = {}) {
  return KnowledgeDocument.countDocuments(filter);
}
