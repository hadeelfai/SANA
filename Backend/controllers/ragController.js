import axios from "axios";

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://localhost:5001";

export const askRag = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "❌ Question is required",
      });
    }

    console.log(`[RAG] Calling service at ${RAG_SERVICE_URL}/rag/ask with question:`, question);

    const response = await axios.post(`${RAG_SERVICE_URL}/rag/ask`, {
      question,
    }, {
      timeout: 30000, // 30 second timeout
    });

    console.log(`[RAG] Service response:`, response.data);

    if (!response.data || !response.data.answer) {
      console.error("[RAG] Invalid response format:", response.data);
      return res.status(500).json({
        error: "Invalid response from RAG service",
        details: "Response missing answer field"
    });
    }

    return res.json({
      answer: response.data.answer,
    });

  } catch (error) {
    console.error("[RAG Error] Full error:", error);
    
    // Handle different error types
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error(`[RAG] Cannot connect to service at ${RAG_SERVICE_URL}`);
      return res.status(503).json({
        error: "RAG service unavailable",
        message: "The AI service is not running or not reachable. Please check if the Python RAG service is running on port 5001.",
        details: error.message
      });
    }

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("[RAG] Service error response:", error.response.status, error.response.data);
      return res.status(error.response.status || 500).json({
        error: "RAG service error",
        message: error.response.data?.error || error.response.data?.message || "Error from RAG service",
        details: error.response.data
      });
    }

    // Other errors (network, timeout, etc.)
    return res.status(500).json({
      error: "RAG service error",
      message: error.message || "Unknown error occurred",
      details: error.code || "No additional details"
    });
  }
};

export const getTicketSuggestion = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!description) {
      return res.status(400).json({
        error: "❌ Description is required",
      });
    }

    console.log(`[RAG] Calling ticket suggestion at ${RAG_SERVICE_URL}/rag/ticket-suggestion`);

    const response = await axios.post(`${RAG_SERVICE_URL}/rag/ticket-suggestion`, {
      title: title || "",
      description,
    }, {
      timeout: 30000, // 30 second timeout
    });

    console.log(`[RAG] Ticket suggestion response:`, response.data);

    if (!response.data) {
      console.error("[RAG] Invalid response format:", response.data);
      return res.status(500).json({
        error: "Invalid response from RAG service",
        details: "Response missing data"
      });
    }

    return res.json({
      success: response.data.success !== false,
      recommendation: response.data.recommendation || "",
      metadata: response.data.metadata || {}
    });

  } catch (error) {
    console.error("[RAG Error] Full error:", error);
    
    // Handle different error types
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error(`[RAG] Cannot connect to service at ${RAG_SERVICE_URL}`);
      return res.status(503).json({
        success: false,
        error: "RAG service unavailable",
        message: "The AI service is not running or not reachable. Please check if the Python RAG service is running on port 5001.",
        recommendation: "Unable to generate suggestions. Please try again later.",
        details: error.message
      });
    }

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("[RAG] Service error response:", error.response.status, error.response.data);
      return res.status(error.response.status || 500).json({
        success: false,
        error: "RAG service error",
        message: error.response.data?.error || error.response.data?.message || "Error from RAG service",
        recommendation: "Unable to generate suggestions. Please try again later.",
        details: error.response.data
      });
    }

    // Other errors (network, timeout, etc.)
    return res.status(500).json({
      success: false,
      error: "RAG service error",
      message: error.message || "Unknown error occurred",
      recommendation: "Unable to generate suggestions. Please try again later.",
      details: error.code || "No additional details"
    });
  }
};
