import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { aiLimiter } from "../lib/rateLimit.js";
import {
  getProblem,
  getUserProgress,
  listProblems,
  submitProblem,
  toggleBookmark,
} from "../controllers/problemController.js";

const router = express.Router();

// static routes first so they aren't captured by "/:slug"
router.get("/progress", protectRoute, getUserProgress);
router.get("/", protectRoute, listProblems);
router.get("/:slug", protectRoute, getProblem);
router.post("/:slug/bookmark", protectRoute, toggleBookmark);
router.post("/:slug/submit", protectRoute, aiLimiter, submitProblem);

export default router;
