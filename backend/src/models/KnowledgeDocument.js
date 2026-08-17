import mongoose from "mongoose";

const knowledgeDocumentSchema = new mongoose.Schema(
  {
    // job-knowledge | question-bank | candidate-history
    sourceType: {
      type: String,
      enum: ["job-knowledge", "question-bank", "candidate-history"],
      required: true,
      index: true,
    },
    title: { type: String, default: "" },
    content: { type: String, required: true },
    embedding: { type: [Number], default: [] },
    metadata: {
      role: { type: String, default: "" },
      topic: { type: String, default: "" },
      difficulty: { type: String, default: "" },
      // scoping for candidate-history docs
      candidateId: { type: String, default: "" },
      interviewId: { type: String, default: "" },
    },
    // stable dedupe key used by ingestion (sourceType:title:metadata)
    key: { type: String, default: "", index: true },
  },
  { timestamps: true }
);

knowledgeDocumentSchema.index({ sourceType: 1, "metadata.role": 1, "metadata.topic": 1 });

const KnowledgeDocument = mongoose.model("KnowledgeDocument", knowledgeDocumentSchema);

export default KnowledgeDocument;
