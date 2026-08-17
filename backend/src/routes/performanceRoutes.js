import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { getPerformance, getPerformanceById } from "../controllers/performanceController.js";

const router = express.Router();

router.get("/", protectRoute, getPerformance);
router.get("/:interviewId", protectRoute, getPerformanceById);

export default router;
