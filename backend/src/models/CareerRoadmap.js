import mongoose from "mongoose";

const roadmapWeekSchema = new mongoose.Schema(
  {
    week: { type: Number, required: true },
    title: { type: String, required: true },
    topics: { type: [String], default: [] },
    resources: { type: [String], default: [] },
  },
  { _id: false }
);

const careerRoadmapSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetRole: { type: String, required: true },
    currentLevel: { type: String, default: "" },
    readiness: { type: Number, default: 0 }, // 0-100
    strongSkills: { type: [String], default: [] },
    skillGaps: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    roadmap: { type: [roadmapWeekSchema], default: [] },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

careerRoadmapSchema.index({ candidate: 1, generatedAt: -1 });

const CareerRoadmap = mongoose.model("CareerRoadmap", careerRoadmapSchema);

export default CareerRoadmap;
