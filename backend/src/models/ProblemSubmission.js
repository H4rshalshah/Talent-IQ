import mongoose from "mongoose";

const testResultSchema = new mongoose.Schema(
  {
    args: { type: [mongoose.Schema.Types.Mixed], default: [] },
    expected: { type: String, default: "" },
    actual: { type: String, default: "" },
    passed: { type: Boolean, default: false },
  },
  { _id: false }
);

const problemSubmissionSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // slug for in-house problems, "cf-<externalId>" for Codeforces problems
    problemSlug: { type: String, required: true, index: true },
    // per-user progress fields (used for Codeforces cards and dashboard stats)
    bookmarked: { type: Boolean, default: false },
    lastAttemptedAt: { type: Date, default: null },
    language: { type: String, default: "" },
    code: { type: String, default: "" },
    status: { type: String, enum: ["attempted", "solved"], default: "attempted" },
    passedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    results: { type: [testResultSchema], default: [] },
    timeMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

problemSubmissionSchema.index({ candidate: 1, problemSlug: 1 });
problemSubmissionSchema.index({ candidate: 1, status: 1 });
problemSubmissionSchema.index({ candidate: 1, bookmarked: 1 });

export default mongoose.model("ProblemSubmission", problemSubmissionSchema);
