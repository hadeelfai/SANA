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
    },
    employeeId: {
        type: String,
        trim: true,
    },
    department: {
        type: String,
        trim: true,
    },
    team: {
        type: String,
        trim: true,
    },
    position: {
        type: String,
        trim: true,
    },
    location: {
        type: String,
        trim: true,
    },
    officeBranch: {
        type: String,
        trim: true,
    },
    floor: {
        type: String,
        trim: true,
    },
    building: {
        type: String,
        trim: true,
    }
}, { 
    timestamps: true,
})

const User = mongoose.model("User", userSchema);

export default User;