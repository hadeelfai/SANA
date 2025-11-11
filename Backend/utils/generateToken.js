import jwt from "jsonwebtoken";
import { envVars } from "../config/envVars.js"; // Ensure correct path to envVars.js

export const generateTokenAndSetCookie = (userId,role, res) => {
  // Generate the JWT token with a 15-day expiration
  const token = jwt.sign(
    { userId, role },
    envVars.JWT_SECRET,
    {
      expiresIn: "15d",
    }
  );

  // Set the JWT token in a cookie
  res.cookie("jwt", token, {
    httpOnly: true, // Prevent JavaScript from accessing the cookie
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in milliseconds
    sameSite: "strict", // Helps prevent CSRF attacks
    secure: envVars.NODE_ENV !== "development", // Only use Secure cookies in production
  });

  return token;
};