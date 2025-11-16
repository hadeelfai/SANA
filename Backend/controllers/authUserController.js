import bcrypt from "bcryptjs";
import User from "../models/userModel.js"; // Import the User model
import { validationResult } from "express-validator";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";

// Sign-up controller
export const userSignup = async (req, res) => {
  try {
    const errors = validationResult(req); // Get validation errors
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ errors: errors.array() });
    }

    const { 
      name, 
      email, 
      password, 
      role, 
      specialization,
      employeeId,
      department,
      team,
      position,
      location,
      officeBranch,
      floor,
      building
    } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    // English letters, spaces, apostrophes, hyphens. Length 2–40.
    const nameRegex = /^[A-Za-z\s'-]{2,40}$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({
        success: false,
        message:
          "Name must contain only English letters and be 2 to 40 characters long",
      });
    }
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
        .json({ message: "Email already registered" });
    }

    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare the user data
    const userData = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      specialization,
      employeeId,
      department,
      team,
      position,
      location,
      officeBranch,
      floor,
      building,
    };

    // If the user is an engineer, add assignedTickets field
    if (role === "engineer") {
      userData.assignedTickets = [];
    }

    // Create a new user
    const newUser = new User(userData);

    // Generate token and set cookie
    generateTokenAndSetCookie(
      newUser._id,
      newUser.role,
      res
    );

    // Save the user to the database
    await newUser.save();

    // Send a success response
    res.status(201).json({
      message: "User registered successfully",
      user: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export async function userLogin(req, res) {
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

    // Check if user exists using email
    const user = await User.findOne({
      email: email.toLowerCase(),
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
    generateTokenAndSetCookie(user._id, user.role, res);

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

export async function userLogout(req, res) {
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