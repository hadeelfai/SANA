import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    assignedTickets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket"
      }
    ],
    role: {
      type: String,
      enum: ["admin"],
      default: "admin"
    }
  },
  { timestamps: true }
);
const Admin = mongoose.model("Admin", adminSchema);

export default Admin;