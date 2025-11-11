import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    assignedTickets: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
        }
    ],
    specialization: {
        type: String,
        default: "General Support",
    }
}, { 
    timestamps: true,
})

const User = mongoose.model("User", userSchema);

export default User;