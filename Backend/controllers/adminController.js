import { Ticket } from "../models/ticketModel.js";
import User from "../models/userModel.js"; // optional, if you need user data for some operations
import mongoose from "mongoose";
// Get all tickets (Admin only)
export const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");
    if (!tickets || tickets.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No tickets found",
      });
    }
    res.status(200).json({
      success: true,
      tickets,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

// Get all tickets (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" });
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found",
      });
    }
    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

// Get tickets by userId
export const getTicketsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (
      !userId ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing user ID",
      });
    }
    // Optional: Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Fetch tickets created by this user
    const tickets = await Ticket.find({
      createdBy: userId,
    });

    res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error("Error fetching tickets by user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update the status of a ticket (Admin only)
export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    // Validate the status
    const allowedStatuses = [
      "new",
      "in_progress",
      "resolved",
      "assigned",
      "not_resolved",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Allowed statuses are: new, in_progress, resolved, assigned, not_resolved.",
      });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Update ticket status
    ticket.status = status;
    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      ticket,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

export const updateTicketPriority = async (req, res) => {
  try {
    const { ticketId } = req.params;
    let { priority } = req.body;

    priority =
      priority.charAt(0).toUpperCase() +
      priority.slice(1).toLowerCase();

    const allowedPriorities = [
      "Low",
      "Medium",
      "High",
      "Critical",
    ];

    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid priority. Allowed values: Low, Medium, High, Critical.",
      });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.priority = priority;
    await ticket.save();


    // 🔥 Populate createdBy and optionally other refs
    const updatedTicket = await Ticket.findById(ticketId)
      .populate("createdBy")
      .populate("assignedTo"); // optional if needed


    res.status(200).json({
      success: true,
      message: "Ticket priority updated successfully",
      ticket:updatedTicket,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

// assign the ticket to engineer
export const assignTicketToEngineer = async (req, res) => {
  try {
    const { id, engineerId } = req.body;

    // Validate input
    if (!id || !engineerId) {
      return res.status(400).json({
        success: false,
        message: "ticketId and engineerId are required",
      });
    }

    // Find the ticket
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Find the engineer
    const engineer = await User.findById(engineerId);
    if (!engineer || engineer.role !== "engineer") {
      return res.status(400).json({
        success: false,
        message:
          "Engineer not found or user is not an engineer",
      });
    }

    // Assign the ticket
    ticket.assignedTo = engineerId;
    ticket.status = "assigned"; // Set status to 'assigned' or use the provided status
    await ticket.save();

    // Only push the ticket if it's not already in the array
    if (
      engineer.assignedTickets &&
      !engineer.assignedTickets.includes(id)
    ) {
      engineer.assignedTickets.push(id);
      await engineer.save();
    }

    res.status(200).json({
      success: true,
      message: "Ticket assigned to engineer successfully",
      ticket,
    });
  } catch (error) {
    console.error(
      "Error assigning ticket to engineer:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all engineers (Admin only)
export const getAllEngineers = async (req, res) => {
  try {
    const engineers = await User.find({ role: "engineer" });
    if (!engineers || engineers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No engineers found",
      });
    }
    res.status(200).json({
      success: true,
      engineers,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

// Delete a ticket (Admin only)
export const deleteTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Validate ticketId
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    // Find and delete the ticket
    const ticket = await Ticket.findByIdAndDelete(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Find and delete the user
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Check if the user is authenticated (Admin only)
export async function authCheck(req, res) {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.log("Error in authCheck:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}