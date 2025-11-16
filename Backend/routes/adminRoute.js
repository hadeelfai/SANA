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
  updateUserInfo,
  getAllAdmins,
  assignTicketToAdmin,
} from "../controllers/adminController.js";
import { addComment, getTicketById } from "../controllers/userController.js";

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
router.get("/all-admins", getAllAdmins);

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
  "/assigned-ticket-admin",
  assignTicketToAdmin
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
router.patch(
  "/update-user/:userId",
  updateUserInfo
);
router.post(
  "/tickets/:ticketId/comments",
  addComment
);
router.get(
  "/tickets/:id",
  getTicketById
);


export default router;