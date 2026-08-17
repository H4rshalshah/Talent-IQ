import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // set for human interviews (the interviewer user)
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: ["human", "ai"],
      required: true,
    },
    role: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    duration: {
      type: Number,
      default: 30, // minutes
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "aborted"],
      default: "in_progress",
    },
    score: {
      type: Number,
      default: null, // 0-100 overall score, set on completion
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // AI interview configuration
    config: {
      experienceLevel: { type: String, default: "mid" },
      interviewType: { type: String, default: "general" },
      topics: { type: [String], default: [] },
      numQuestions: { type: Number, default: 10 },
    },
    // === adaptive engine state (AI interviews) ===
    currentDifficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    currentTopic: { type: String, default: "" },
    performanceScore: { type: Number, default: 0 }, // running average 0-10
    questionHistory: { type: [String], default: [] }, // topics covered
    weakAreas: { type: [String], default: [] },
    strongAreas: { type: [String], default: [] },
    retrievedContextIds: { type: [String], default: [] },
    // linked session for human interviews
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },
  },
  { timestamps: true }
);

interviewSchema.index({ candidate: 1, createdAt: -1 });

const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;
