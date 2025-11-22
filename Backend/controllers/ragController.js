import axios from "axios";

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://localhost:5001";

export const askRag = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const response = await axios.post(`${RAG_SERVICE_URL}/rag/ask`, {
      question,
    });

    return res.json(response.data); // { answer: ... }
  } catch (err) {
    console.error("RAG error:", err.message);
    return res.status(500).json({ error: "RAG service error" });
  }
};
