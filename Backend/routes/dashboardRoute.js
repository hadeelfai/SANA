import express from "express";
import { getDashboardData } from "../controllers/dashboardController.js";
import { createTicket } from "../controllers/userController.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { getTicketById } from "../controllers/userController.js";
import { addComment } from "../controllers/userController.js";

const router = express.Router();

router.get("/user", protectRoute, getDashboardData);
router.post("/create", protectRoute, createTicket);
router.get("/tickets/:id", protectRoute, getTicketById);
router.post("/tickets/:ticketId/comments", protectRoute, addComment);

export default router;