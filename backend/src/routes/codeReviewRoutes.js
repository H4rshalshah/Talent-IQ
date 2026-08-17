import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { codeReviewLimiter } from "../lib/rateLimit.js";
import { reviewCodeSubmission } from "../controllers/codeReviewController.js";

const router = express.Router();

router.post("/review", protectRoute, codeReviewLimiter, reviewCodeSubmission);

export default router;
