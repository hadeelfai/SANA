import express from "express";
import {
  adminLogin,
  adminLogout,
  adminSignup,
  authCheck
} from "../controllers/authAdminController.js";
import { protectRoute } from "../middleware/protectRoute.js";
const router = express.Router();

router.post("/signup", adminSignup);
router.post("/login", adminLogin);
router.post("/logout", adminLogout);

router.get("/authCheck",protectRoute, authCheck);
export default router;