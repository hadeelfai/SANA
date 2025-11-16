import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { envVars } from "../config/envVars.js";

export const protectRoute = async (req, res, next) => {
  const token = req.cookies["jwt"];
  try {
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(token, envVars.JWT_SECRET);
    // Use unified User model for both admins and regular users
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user; // Attach user data to request
    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal error",
    });
  }
};