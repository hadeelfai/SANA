import { Ticket } from "../models/ticketModel.js";

export const getDashboardData = async (req, res) => {
  try {
    let tickets = await Ticket.find({ createdBy: req.user._id }).lean();

    const processed = tickets.map(t => {
      // Final resolvedAt normalization
      const resolvedAt =
        t.resolvedAt ||
        (t.status === "resolved" ? t.updatedAt : null);

      // Channel mix: Self-Service vs Assisted
      const channel = t.solvedWithSana ? "self_service" : "assisted";

      // Normalize priority (to lower-case)
      const priority = (t.priority || "low").toLowerCase();

      // Pain point must use CATEGORY ONLY
      const painCategory = t.category || "Other";

      return {
        ...t,
        resolvedAt,
        channel,
        priority,
        painCategory,
      };
    });

    return res.json({ tickets: processed });
  } catch (err) {
    console.error("Dashboard error:", err);
    return res.status(500).json({
      message: "Failed to load dashboard data",
    });
  }
};