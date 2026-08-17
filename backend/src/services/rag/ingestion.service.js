import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import KnowledgeDocument from "../../models/KnowledgeDocument.js";
import { upsertDocuments, deleteDocuments, countDocuments } from "./vectorStore.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = path.join(__dirname, "../../data/knowledge");

/**
 * Split a long document into overlapping chunks of ~words per chunk.
 * @param {string} text
 * @param {number} wordsPerChunk
 * @param {number} overlap
 * @returns {string[]}
 */
export function chunkText(text, wordsPerChunk = 180, overlap = 30) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= wordsPerChunk) return [text];

  const chunks = [];
  const step = Math.max(wordsPerChunk - overlap, 1);
  for (let i = 0; i < words.length; i += step) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
  }
  return chunks;
}

/**
 * Build the dedupe key for a knowledge document.
 */
export function docKey(sourceType, title, metadata = {}) {
  const parts = [sourceType, title, metadata.role || "", metadata.topic || "", metadata.candidateId || ""];
  return parts.join("::");
}

/**
 * Ingest a list of raw documents into the vector store.
 *
 * @param {Array<{sourceType:string,title:string,content:string,metadata:object}>} documents
 * @returns {Promise<{upserted:number}>}
 */
export async function ingestDocuments(documents) {
  const docs = [];
  for (const raw of documents) {
    if (!raw.content || !raw.content.trim()) continue;
    const chunks = chunkText(raw.content);
    for (let i = 0; i < chunks.length; i++) {
      docs.push({
        key: `${docKey(raw.sourceType, raw.title, raw.metadata)}::${i}`,
        sourceType: raw.sourceType,
        title: chunks.length > 1 ? `${raw.title} (part ${i + 1})` : raw.title,
        content: chunks[i],
        metadata: raw.metadata || {},
      });
    }
  }
  return upsertDocuments(docs);
}

function readJson(filename) {
  const filePath = path.join(KNOWLEDGE_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

/**
 * Ingest the checked-in job-knowledge reference material.
 * Idempotent: re-running refreshes the docs via upsert on stable keys.
 */
export async function ingestJobKnowledge() {
  const docs = readJson("job-knowledge.json");
  const documents = docs.map((doc) => ({
    sourceType: "job-knowledge",
    title: doc.title,
    content: doc.content,
    metadata: { role: doc.role || "", topic: doc.topic || "", difficulty: doc.difficulty || "" },
  }));
  return ingestDocuments(documents);
}

/**
 * Ingest the checked-in question bank (questions + reference solutions).
 */
export async function ingestQuestionBank() {
  const docs = readJson("question-bank.json");
  const documents = [];
  for (const doc of docs) {
    const content = [
      `Question: ${doc.title}`,
      doc.content,
      `Reference solution: ${doc.referenceSolution}`,
      `Common mistakes: ${doc.commonMistakes}`,
      `Evaluation rubric: ${doc.rubric}`,
    ].join("\n\n");
    documents.push({
      sourceType: "question-bank",
      title: doc.title,
      content,
      metadata: { role: doc.role || "", topic: doc.topic || "", difficulty: doc.difficulty || "" },
    });
  }
  return ingestDocuments(documents);
}

/**
 * Ingest a candidate's history (past answers, weak areas, covered topics)
 * scoped strictly to that candidate. Replaces the candidate's previous
 * candidate-history docs so stale history doesn't accumulate.
 */
export async function ingestCandidateHistory({ candidateId, interviewId, answers, weakAreas, strongAreas }) {
  await deleteDocuments({ sourceType: "candidate-history", "metadata.candidateId": String(candidateId) });

  const documents = [];
  for (const answer of answers || []) {
    if (!answer?.answer || !answer?.question) continue;
    documents.push({
      sourceType: "candidate-history",
      title: `Candidate answer: ${answer.question.slice(0, 80)}`,
      content: `Question: ${answer.question}\nCandidate answer: ${answer.answer}\nEvaluated score: ${answer.score}/10\nCategory: ${answer.category || ""}`,
      metadata: { candidateId: String(candidateId), interviewId: String(interviewId) },
    });
  }

  for (const area of weakAreas || []) {
    documents.push({
      sourceType: "candidate-history",
      title: `Weak area: ${area}`,
      content: `The candidate has repeatedly struggled with the topic "${area}". Future interviews should revisit this area with foundational questions before progressing to advanced material.`,
      metadata: { candidateId: String(candidateId), interviewId: String(interviewId) },
    });
  }

  for (const area of strongAreas || []) {
    documents.push({
      sourceType: "candidate-history",
      title: `Strong area: ${area}`,
      content: `The candidate demonstrated strong proficiency in "${area}". Future interviews can skip introductory questions on this topic and go straight to advanced or applied questions.`,
      metadata: { candidateId: String(candidateId), interviewId: String(interviewId) },
    });
  }

  return ingestDocuments(documents);
}

/**
 * One-shot ingestion of everything needed before first use.
 */
export async function ingestAll() {
  const jobKnowledge = await ingestJobKnowledge();
  const questionBank = await ingestQuestionBank();
  const total = await countDocuments({});
  return { jobKnowledge, questionBank, total };
}

export async function getKnowledgeStats() {
  const [jobKnowledge, questionBank, candidateHistory] = await Promise.all([
    KnowledgeDocument.countDocuments({ sourceType: "job-knowledge" }),
    KnowledgeDocument.countDocuments({ sourceType: "question-bank" }),
    KnowledgeDocument.countDocuments({ sourceType: "candidate-history" }),
  ]);
  return { jobKnowledge, questionBank, candidateHistory };
}
