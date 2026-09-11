import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { getRoleReadiness, getRoleRequirements } from "../controllers/roleReadinessController.js";

const router = express.Router();

router.get("/requirements", protectRoute, getRoleRequirements);
router.get("/", protectRoute, getRoleReadiness);

export default router;
