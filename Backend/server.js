import express from "express";
import authUserRoutes from "./routes/authUserRoute.js";
import authAdminRoutes from "./routes/authAdminRoute.js";
import userRoutes from "./routes/userRoute.js";
import adminRoutes from "./routes/adminRoute.js";
import dashboardRoute from "./routes/dashboardRoute.js";
import ragRoutes from "./routes/ragRoutes.js"; // added from remote
import { envVars } from "./config/envVars.js";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
import { protectRoute } from "./middleware/protectRoute.js";
import path from "path";

const app = express();
const PORT = envVars.PORT || 10000;

app.use(express.json());
app.use(cookieParser());

// -------------------- AUTH ROUTES --------------------
app.use("/api/v1/auth/user", authUserRoutes);
app.use("/api/v1/auth/admin", authAdminRoutes);

// -------------------- MAIN APP ROUTES --------------------
app.use("/api/v1/users", protectRoute, userRoutes); // user profile, CRUD
app.use("/api/v1/admin/dashboard", protectRoute, adminRoutes); // admin-only

// Dashboard must load before overlapping routes
app.use("/api/v1/dashboard", protectRoute, dashboardRoute);

// RAG ROUTE
app.use("/api/v1/rag", ragRoutes);

const __dirname = path.resolve();
if (envVars.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"))
  );
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on port ${PORT}`);
  connectDB();
});
