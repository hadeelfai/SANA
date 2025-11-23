from fastapi import FastAPI
from pydantic import BaseModel
from ai_sans import hr_answer  # نستفيد من نفس الكود اللي كتبنا
from ticket_recommendation import predict_from_fields, predict_ticket_solution

app = FastAPI(title="Fikrah RAG Service")

class Question(BaseModel):
    question: str

class TicketSuggestionRequest(BaseModel):
    title: str = ""
    description: str

@app.post("/rag/ask")
def ask_rag(payload: Question):
    answer = hr_answer(payload.question)
    return {"answer": answer}

@app.post("/rag/ticket-suggestion")
def get_ticket_suggestion(payload: TicketSuggestionRequest):
    """Get SANA suggestions for a ticket based on title and description."""
    try:
        if payload.title:
            result = predict_from_fields(payload.title, payload.description)
        else:
            result = predict_ticket_solution(payload.description)
        
        return {
            "success": True,
            "recommendation": result.get("recommendation", ""),
            "metadata": result.get("metadata", {})
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "recommendation": "Error generating suggestions. Please try again.",
            "metadata": {}
        }
