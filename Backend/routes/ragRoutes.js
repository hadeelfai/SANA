import express from "express";
import { askRag } from "../controllers/ragController.js";

const router = express.Router();

router.post("/ask", askRag);

export default router;
