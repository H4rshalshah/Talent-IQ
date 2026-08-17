import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { requireCodeforcesAdmin, syncProblems } from "../controllers/codeforcesController.js";

const router = express.Router();

// admin-only: triggers a fetch from the Codeforces API into MongoDB
router.post("/sync", protectRoute, requireCodeforcesAdmin, syncProblems);

export default router;
