import express from "express";
import authUserRoutes from "./routes/authUserRoute.js";
import authAdminRoutes from "./routes/authAdminRoute.js";
import userRoutes from "./routes/userRoute.js";
import { envVars } from "./config/envVars.js";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
import { protectRoute } from "./middleware/protectRoute.js";
import path from "path";
import adminRoutes from "./routes/adminRoute.js";
import dashboardRoute from "./routes/dashboardRoute.js";
import ragRoutes from "./routes/ragRoutes.js";


const app = express();
const PORT = envVars.PORT || 10000; // Default to 5000 if no PORT is defined in envVars
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth/user", authUserRoutes);
app.use("/api/v1/auth/admin", authAdminRoutes);
app.use("/api/v1/dashboard", protectRoute, userRoutes);
app.use(
  "/api/v1/admin/dashboard",
  protectRoute,
  adminRoutes
);

// ✅ DASHBOARD ROUTE MUST COME BEFORE ANYTHING THAT OVERLAPS
app.use("/api/v1/dashboard", protectRoute, dashboardRoute);
app.use("/api/v1/rag", ragRoutes);





const __dirname = path.resolve();

if (envVars.NODE_ENV === "production") {
  app.use(
    express.static(path.join(__dirname, "/frontend/dist"))
  );
  app.get("/{*any}", (req, res) => {
    res.sendFile(
      path.resolve(
        __dirname,
        "frontend",
        "dist",
        "index.html"
      )
    );
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on port ${PORT}`); // Log the actual port
  connectDB(); // Connect to the database
});
