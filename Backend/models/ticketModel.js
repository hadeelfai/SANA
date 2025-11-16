import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  commentedBy: {
    type: String,
    required: true,
  },
  commentedAt: {
    type: Date,
    default: Date.now,
  },
});
const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["Hardware", "Software", "Network", "Access", "Request", "Incident"],
      required: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "in_progress", "resolved", "assigned", "not_resolved"],
      default: "new",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    priority: {
      type: String,
      required: true,
    },
    comments: [commentSchema],
  },
  { timestamps: true }
);

// Generate unique ticket ID before saving
ticketSchema.pre('save', async function(next) {
  if (!this.ticketId) {
    // Generate ticket ID: TKT-YYYYMMDD-XXXXX (5 random alphanumeric)
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    let isUnique = false;
    let ticketId;
    
    // Ensure uniqueness
    while (!isUnique) {
      const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
      ticketId = `TKT-${dateStr}-${randomStr}`;
      // Use this.constructor to get the model
      const existing = await this.constructor.findOne({ ticketId });
      if (!existing) {
        isUnique = true;
        this.ticketId = ticketId;
      }
    }
  }
  next();
});

export const Ticket = mongoose.model(
  "Ticket",
  ticketSchema
);