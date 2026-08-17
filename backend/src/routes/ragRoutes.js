import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { ragLimiter } from "../lib/rateLimit.js";
import { getRagStats, ingestKnowledge, searchKnowledge } from "../controllers/ragController.js";

const router = express.Router();

router.post("/ingest", protectRoute, ragLimiter, ingestKnowledge);
router.post("/search", protectRoute, ragLimiter, searchKnowledge);
router.get("/stats", protectRoute, getRagStats);

export default router;
