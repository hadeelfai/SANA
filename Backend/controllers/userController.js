import { Ticket } from "../models/ticketModel.js";
import User from "../models/userModel.js"; // optional, if you need user data for some operations
import mongoose from "mongoose";
// Create a new ticket
export const createTicket = async (req, res) => {
  try {
    const { title, description, priority, category, subcategory } =
      req.body;
    const userId = req.user._id; // Assuming you have a user object set by the auth middleware

    const newTicket = new Ticket({
      title,
      description,
      priority,
      category,
      subcategory,
      createdBy: userId,
    });

    await newTicket.save();
    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket: newTicket,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

// Get tickets for the logged-in user
export const getUserTickets = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming you have a user object set by the auth middleware
    const tickets = await Ticket.find({
      createdBy: userId,
    });
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
export const getAssignedTickets = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "engineer") {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only engineers can view assigned tickets.",
      });
    }

    // Now fetch tickets using assignedTickets array
    const assignedTickets = await Ticket.find({
      _id: { $in: user.assignedTickets },
    }).populate("createdBy", "name email"); // if you want to show creator details

    res.status(200).json({
      success: true,
      tickets: assignedTickets,
    });
  } catch (err) {
    console.error("Error fetching assigned tickets:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update the status of a ticket (Admin & engineer only)
export const updateTicketStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const { ticketId } = req.params;
    const { status } = req.body;

    if (user.role !== "engineer") {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only engineers can change status of assigned tickets.",
      });
    }
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



// Get a ticket by ID (for user and admin)
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id).populate(
      "createdBy",
      "name email"
    );
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }
    res.status(200).json({
      success: true,
      ticket,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

// Get user details
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    const user = await User.findById(id).select(
      "-password"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

export const addComment = async (req, res) => {
  const { ticketId } = req.params;
  const { text } = req.body;
  const name = req.user.name; // assuming you're using auth middleware to attach user

  if (!text) {
    return res
      .status(400)
      .json({ message: "Comment text is required." });
  }

  try {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res
        .status(404)
        .json({ message: "Ticket not found." });
    }

    const comment = {
      text,
      commentedBy: name,
      commentedAt: new Date(),
    };

    ticket.comments.push(comment);
    await ticket.save();

    return res.status(200).json({
      message: "Comment added successfully.",
      comment,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return res
      .status(500)
      .json({ message: "Server error." });
  }
};

export const removeTicket = async (req, res) => {
  const { id } = req.params; // Ticket ID
  const userId = req.user._id;

  try {
    // Remove the ticket reference from the user's assignedTickets
    const user = await User.findOneAndUpdate(
      { _id: userId },
      {
        $pull: {
          assignedTickets: id,
        },
      },
      { new: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "Ticket removed successfully" });
  } catch (error) {
    console.error("Error removing ticket:", error);
    res
      .status(500)
      .json({ message: "Failed to remove ticket", error });
  }
};