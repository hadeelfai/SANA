import { Ticket } from "../models/ticketModel.js";

export const getDashboardData = async (req, res) => {
  try {
    // simplest version: just return tickets
    const tickets = await Ticket.find({ createdBy: req.user._id }).lean();

    return res.json({ tickets });         // ✅ always send JSON
  } catch (err) {
    console.error("Dashboard error:", err);
    return res
      .status(500)
      .json({ message: "Failed to load dashboard data" }); // ✅ still JSON
  }
};