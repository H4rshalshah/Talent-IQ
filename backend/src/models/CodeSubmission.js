import mongoose from "mongoose";

const codeSubmissionSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      default: null,
      index: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problemId: { type: String, required: true },
    problemTitle: { type: String, default: "" },
    language: { type: String, required: true },
    code: { type: String, required: true },
    testResults: { type: mongoose.Schema.Types.Mixed, default: null },
    timeComplexity: { type: String, default: "" },
    spaceComplexity: { type: String, default: "" },
    aiReview: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

codeSubmissionSchema.index({ candidate: 1, createdAt: -1 });

const CodeSubmission = mongoose.model("CodeSubmission", codeSubmissionSchema);

export default CodeSubmission;
