import express from "express";
import { askRag, getTicketSuggestion } from "../controllers/ragController.js";

const router = express.Router();

router.post("/ask", askRag);
router.post("/ticket-suggestion", getTicketSuggestion);

export default router;
