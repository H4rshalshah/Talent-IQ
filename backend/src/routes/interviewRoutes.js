import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { aiLimiter } from "../lib/rateLimit.js";
import {
  abortInterview,
  completeAiInterview,
  createAiInterview,
  getAiQuestion,
  getInterviewById,
  listInterviews,
  submitAiAnswer,
} from "../controllers/interviewController.js";

const router = express.Router();

// AI interview lifecycle
router.post("/ai/create", protectRoute, aiLimiter, createAiInterview);
router.post("/ai/question", protectRoute, aiLimiter, getAiQuestion);
router.post("/ai/answer", protectRoute, aiLimiter, submitAiAnswer);
router.post("/ai/complete", protectRoute, aiLimiter, completeAiInterview);

// shared
router.get("/", protectRoute, listInterviews);
router.get("/:id", protectRoute, getInterviewById);
router.post("/:id/abort", protectRoute, abortInterview);

export default router;
