import express from "express";
import {
  createTicket,
  getUserTickets,
  getAssignedTickets,
  getTicketById,
  updateTicketStatus,
  getUser,
  addComment,
  removeTicket,
} from "../controllers/userController.js";

const router = express.Router();

// Create a ticket (any user)
router.post("/create",  createTicket);
router.post(
  "/tickets/:ticketId/comments",
  
  addComment
);

// Get tickets for the logged-in user
router.get("/user",  getUserTickets);
router.get("/user/:id", getUser);

router.get("/tickets/:id",  getTicketById);

// for engineer assigned tickets
router.get(
  "/assigned-tickets",
  getAssignedTickets
);

// Update ticket status (admin & engineer only)
router.patch(
  "/:ticketId/status",
  updateTicketStatus
);


router.delete("/remove-ticket/:id",removeTicket);

export default router;