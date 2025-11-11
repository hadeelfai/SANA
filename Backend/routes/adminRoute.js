import express from "express";
import {
  getAllTickets,
  getAllUsers,
  getTicketsByUser,
  updateTicketStatus,
  assignTicketToEngineer,
  authCheck,
  getAllEngineers,
  deleteTicket,
  deleteUser,
  updateTicketPriority,
} from "../controllers/adminController.js";

const router = express.Router();

// Get all tickets (admin only)
router.get(
  "/all-tickets",
  getAllTickets
);

// Get all users (admin only)
router.get(
  "/all-users",
  getAllUsers
);
router.get(
  "/all-engineers",
  getAllEngineers
);

// Get tickets for the logged-in user
router.get(
  "/:userId/tickets",
  getTicketsByUser
);

// Update ticket status (admin only)
router.patch(
  "/:ticketId/status",
  updateTicketStatus
);

router.patch(
  "/assigned-ticket",
  assignTicketToEngineer
);
router.patch(
  "/:ticketId/priority",
  updateTicketPriority
);
router.delete(
  "/delete/:ticketId",
  deleteTicket
);
router.delete(
  "/delete-user/:userId",
  deleteUser
);


export default router;