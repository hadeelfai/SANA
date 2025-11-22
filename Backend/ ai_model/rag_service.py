from fastapi import FastAPI
from pydantic import BaseModel
from ai_sans import hr_answer  # نستفيد من نفس الكود اللي كتبنا

app = FastAPI(title="Fikrah RAG Service")

class Question(BaseModel):
    question: str

@app.post("/rag/ask")
def ask_rag(payload: Question):
    answer = hr_answer(payload.question)
    return {"answer": answer}
