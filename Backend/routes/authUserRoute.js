import express from "express";
import {
  userLogin,
  userLogout,
  userSignup,
  authCheck,
} from "../controllers/authUserController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/signup", userSignup);
router.post("/login", userLogin);
router.post("/logout", userLogout);

router.get("/authCheck",protectRoute, authCheck);
export default router;