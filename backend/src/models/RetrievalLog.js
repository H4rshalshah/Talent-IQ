import mongoose from "mongoose";

const retrievalLogSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      default: null,
      index: true,
    },
    queryText: { type: String, required: true },
    collections: { type: [String], default: [] },
    retrievedDocumentIds: { type: [String], default: [] },
    grounded: { type: Boolean, default: true },
    // latency of the retrieval call in ms
    latencyMs: { type: Number, default: 0 },
    retrievedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

retrievalLogSchema.index({ retrievedAt: -1 });

const RetrievalLog = mongoose.model("RetrievalLog", retrievalLogSchema);

export default RetrievalLog;
