import express from "express";
import { getDashboardData } from "../controllers/dashboardController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/user", protectRoute, getDashboardData);

export default router;