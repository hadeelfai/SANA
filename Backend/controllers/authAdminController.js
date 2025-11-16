import bcrypt from "bcryptjs";
import User from "../models/userModel.js"; // Use unified User model
import { validationResult } from "express-validator";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";
import { Ticket } from "../models/ticketModel.js";
// Sign-up controller
export const adminSignup = async (req, res) => {
  try {
    const errors = validationResult(req); // Get validation errors
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Force role to admin for this endpoint
    const role = "admin";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long and contain at least one special letter and one number",
      });
    }

    // Check if the email already exists in the database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ msg: "Email is already registered" });
    }

    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with admin role
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });
    // Generate token and set cookie
    generateTokenAndSetCookie(newUser._id, newUser.role, res);
    // Save the user to the database
    await newUser.save();

    // Send a success response
    res.status(201).json({
      msg: "Admin registered successfully",
      user: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

export async function adminLogin(req, res) {
  try {
    const errors = validationResult(req); // Get validation errors
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if user exists using email and has admin role
    const user = await User.findOne({
      email: email.toLowerCase(),
      role: "admin",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    // Check password match
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token and set cookie
    generateTokenAndSetCookie(user._id, user.role, res); // <-- during login

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        ...user._doc,
        password: "", // Remove password from the response
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function adminLogout(req, res) {
  try {
    res.clearCookie("jwt");
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

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