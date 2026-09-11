import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { aiLimiter, codeReviewLimiter } from "../lib/rateLimit.js";
import { reviewCodeSubmission } from "../controllers/codeReviewController.js";
import { executeCodeSnippet } from "../controllers/codeController.js";

const router = express.Router();

router.post("/review", protectRoute, codeReviewLimiter, reviewCodeSubmission);
router.post("/execute", protectRoute, aiLimiter, executeCodeSnippet);

export default router;
