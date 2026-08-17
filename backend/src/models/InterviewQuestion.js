import mongoose from "mongoose";

const interviewQuestionSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
      index: true,
    },
    question: { type: String, required: true },
    category: { type: String, default: "" },
    topic: { type: String, default: "" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    // true when this is a follow-up on the previous question's topic
    isFollowUp: { type: Boolean, default: false },
    answer: { type: String, default: "" },
    score: { type: Number, default: null }, // 0-10
    evaluation: { type: mongoose.Schema.Types.Mixed, default: null },
    order: { type: Number, default: 0 },
    // RAG traceability: ids of the knowledge documents used to generate/evaluate
    retrievedContextIds: { type: [String], default: [] },
    grounded: { type: Boolean, default: true }, // false when RAG fell back to general knowledge
  },
  { timestamps: true }
);

interviewQuestionSchema.index({ interviewId: 1, order: 1 });

const InterviewQuestion = mongoose.model("InterviewQuestion", interviewQuestionSchema);

export default InterviewQuestion;
