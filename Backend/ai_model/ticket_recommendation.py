# ============================================================
# SANA – Ticketing Recommendation Engine (RAG + Semantic Search)
# PRODUCTION VERSION FOR VS CODE
# ============================================================

import os
import re
import pandas as pd
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.docstore.document import Document
from sentence_transformers import CrossEncoder
from rank_bm25 import BM25Okapi
from openai import OpenAI

# ============================================================
# 0) Load API Key
# ============================================================

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ============================================================
# 1) Paths
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TICKET_PATH = os.path.join(BASE_DIR, "tickets_cleaned.csv")
TICKET_FAISS_DIR = os.path.join(BASE_DIR, "faiss_ticket_index")

# Global variables for loaded data
df = None
ticket_vs = None
bm25 = None
cross_enc = None
_initialized = False

# ============================================================
# 2) Language Detection
# ============================================================

def detect_lang(text: str) -> str:
    """Return 'ar' if Arabic letters are present else 'en'."""
    return "ar" if re.search(r"[\u0600-\u06FF]", text or "") else "en"

# ============================================================
# 3) Translation Helper
# ============================================================

def translate_ar_to_en(text: str) -> str:
    """
    Translate Arabic issue to English for better ticket retrieval.
    If text is not Arabic or translation fails, return original text.
    """
    if detect_lang(text) != "ar":
        return text
    
    system = (
        "You are a professional translator for IT support content. "
        "Translate the following Arabic IT issue into clear English. "
        "Return ONLY the translation, no explanations."
    )
    
    try:
        translation = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.0,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": text},
            ],
        ).choices[0].message.content
        
        return translation.strip()
    except Exception as e:
        print(f"Translation failed: {e}")
        return text

# ============================================================
# 4) Load Dataset & Build Index (ONE TIME ONLY)
# ============================================================

def load_and_prepare_data():
    global df, ticket_vs, bm25, cross_enc, _initialized
    
    if _initialized:
        return
    
    if not os.path.exists(TICKET_PATH):
        print(f"Warning: {TICKET_PATH} not found. Creating empty index.")
        # Create empty index
        docs = [Document(page_content="No tickets available", metadata={})]
        embeddings = HuggingFaceEmbeddings(model_name="intfloat/multilingual-e5-large")
        ticket_vs = FAISS.from_documents(docs, embeddings)
        TOKENS = [d.page_content.lower().split() for d in docs]
        bm25 = BM25Okapi(TOKENS)
        cross_enc = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
        _initialized = True
        return
    
    df = pd.read_csv(TICKET_PATH)
    df.columns = df.columns.str.strip().str.lower()

    # Map your dataset columns
    if "subject / title" in df.columns:
        df["title"] = df["subject / title"]
    elif "title" in df.columns:
        df["title"] = df["title"]
    else:
        df["title"] = "No Title"

    if "detailed description" in df.columns:
        df["description"] = df["detailed description"]
    elif "description" in df.columns:
        df["description"] = df["description"]
    else:
        df["description"] = "No Description Provided"

    if "category / type" in df.columns:
        df["category"] = df["category / type"]
    elif "category" in df.columns:
        df["category"] = df["category"]
    else:
        df["category"] = "General"

    if "status" in df.columns:
        df["resolution"] = df["status"].fillna("No resolution provided")
    elif "resolution" in df.columns:
        df["resolution"] = df["resolution"].fillna("No resolution provided")
    else:
        df["resolution"] = "No resolution provided"

    df["title"] = df["title"].fillna("No Title")
    df["description"] = df["description"].fillna("No Description Provided")
    df["category"] = df["category"].fillna("General")
    df["resolution"] = df["resolution"].fillna("No resolution provided")

    # Combine into embedding text
    def combine_ticket_text(row):
        return " | ".join([
            row["title"],
            row["description"],
            f"Category: {row['category']}",
            f"Resolution: {row['resolution']}"
        ])

    df["text"] = df.apply(combine_ticket_text, axis=1)

    # Build FAISS index
    docs = [
        Document(
            page_content=row["text"],
            metadata={
                "category": row["category"],
                "title": row["title"],
                "resolution": row["resolution"]
            }
        )
        for _, row in df.iterrows()
    ]

    embeddings = HuggingFaceEmbeddings(model_name="intfloat/multilingual-e5-large")
    ticket_vs = FAISS.from_documents(docs, embeddings)

    # Keyword retriever
    TOKENS = [d.page_content.lower().split() for d in docs]
    bm25 = BM25Okapi(TOKENS)

    # Cross-encoder reranker
    cross_enc = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    
    _initialized = True
    print("Ticket recommendation model initialized successfully")

# Initialize on import
try:
    load_and_prepare_data()
except Exception as e:
    print(f"Warning: Could not initialize ticket recommendation model: {e}")
    print("The model will be initialized on first use.")

# ============================================================
# 5) Recommendation Function (USED BY YOUR WEB APP)
# ============================================================

def recommend_solution(issue_description, top_k=8):
    """
    Retrieve similar tickets using FAISS + rerank with cross-encoder.
    For Arabic: Translate to English for better retrieval, but respond in Arabic.
    """
    global ticket_vs, cross_enc
    
    # Detect language
    lang = detect_lang(issue_description)
    print(f"[DEBUG] Detected language: {'Arabic (العربية)' if lang == 'ar' else 'English'}")
    print(f"[DEBUG] Issue preview: {issue_description[:100]}")
    
    # Initialize if not already done
    if not _initialized:
        load_and_prepare_data()
    
    if ticket_vs is None:
        no_results = {
            "en": "No similar issues found. Please contact support.",
            "ar": "لم يتم العثور على مشاكل مشابهة. يرجى الاتصال بالدعم."
        }
        return no_results[lang], {}

    # Prepare query for embedding
    q_for_embed = issue_description
    
    if lang == "ar":
        # Translate Arabic to English for better retrieval from English tickets
        q_en = translate_ar_to_en(issue_description)
        # Combine both for better matching
        q_for_embed = f"{issue_description} / {q_en}"
        print(f"[DEBUG] Translated query: {q_en[:100]}")
    
    # Search using FAISS
    query = "query: " + q_for_embed
    
    try:
        hits = ticket_vs.similarity_search(query, k=top_k)
        if not hits:
            no_results = {
                "en": "No similar issues found. Please contact support.",
                "ar": "لم يتم العثور على مشاكل مشابهة. يرجى الاتصال بالدعم."
            }
            return no_results[lang], {}
    except Exception as e:
        print(f"Error in similarity search: {e}")
        error_msg = {
            "en": "Error retrieving suggestions. Please try again.",
            "ar": "خطأ في جلب الاقتراحات. يرجى المحاولة مرة أخرى."
        }
        return error_msg[lang], {}

    # Rerank with cross-encoder
    try:
        pairs = [[q_for_embed, h.page_content] for h in hits]
        scores = cross_enc.predict(pairs).tolist()
        ranked = sorted(zip(hits, scores), key=lambda x: x[1], reverse=True)
    except Exception as e:
        print(f"Error in reranking: {e}")
        ranked = list(zip(hits, [0.5] * len(hits)))

    # Build context
    contexts = [d.page_content.replace("passage:", "") for d, _ in ranked[:3]]
    context_text = "\n\n---\n\n".join(contexts)[:3000]

    best_doc = ranked[0][0]

    meta = {
        "category": best_doc.metadata.get("category", ""),
        "title": best_doc.metadata.get("title", ""),
    }

    # Bilingual system prompts
    system_prompts = {
        "en": """You are a technical support assistant for an internal company helpdesk.
Use ONLY the content inside [CONTEXT] to propose:
• Most likely root cause
• Recommended solution
• Steps to fix
• Confidence (High/Medium/Low)

IMPORTANT: Respond entirely in ENGLISH only. Do not use any other language.""",
        
        "ar": """أنت مساعد دعم فني لمكتب مساعدة داخلي للشركة.
استخدم فقط المحتوى الموجود في [السياق] لاقتراح:
• السبب الجذري الأكثر احتمالاً
• الحل الموصى به
• خطوات الإصلاح
• مستوى الثقة (عالي/متوسط/منخفض)

مهم جداً: يجب أن تكون إجابتك بالكامل باللغة العربية فقط. لا تستخدم الإنجليزية أبداً."""
    }

    user_prompts = {
        "en": f"""A new ticket was submitted:

[ISSUE]
{issue_description}

Use the following past similar issues to generate a recommendation:

[CONTEXT]
{context_text}

IMPORTANT: Provide your response entirely in ENGLISH only.""",
        
        "ar": f"""تم إرسال تذكرة جديدة:

[المشكلة]
{issue_description}

استخدم المشاكل المشابهة التالية لإنشاء توصية:

[السياق]
{context_text}

مهم جداً: قدم إجابتك بالكامل باللغة العربية فقط."""
    }

    try:
        messages = [
            {"role": "system", "content": system_prompts[lang]},
            {"role": "user", "content": user_prompts[lang]},
        ]

        answer = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.0,
            messages=messages,
        ).choices[0].message.content

        print(f"[DEBUG] Generated response length: {len(answer)} characters")
        return answer, meta
    except Exception as e:
        print(f"Error in LLM call: {e}")
        error_msg = {
            "en": "Error generating recommendation. Please try again.",
            "ar": "خطأ في إنشاء التوصية. يرجى المحاولة مرة أخرى."
        }
        return error_msg[lang], meta

# ============================================================
# 6) Public Functions for VS Code Backend
# ============================================================

def predict_ticket_solution(issue_text):
    """For a single text field input."""
    solution, meta = recommend_solution(issue_text)
    return {
        "issue": issue_text,
        "recommendation": solution,
        "metadata": meta
    }

def predict_from_fields(title, description):
    """For web-based ticket forms."""
    merged = f"{title}. {description}"
    solution, meta = recommend_solution(merged)
    return {
        "title": title,
        "description": description,
        "recommendation": solution,
        "metadata": meta
    }
