import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { aiLimiter } from "../lib/rateLimit.js";
import {
  generateCareerRoadmapForUser,
  getCareerRoadmap,
} from "../controllers/careerCoachController.js";

const router = express.Router();

router.get("/", protectRoute, getCareerRoadmap);
router.post("/generate", protectRoute, aiLimiter, generateCareerRoadmapForUser);

export default router;
