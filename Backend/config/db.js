import mongoose from "mongoose";
import { envVars } from "./envVars.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(envVars.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed", error);
    process.exit(1); // Exit the process with failure
  }
};