import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { translations } from "../translations.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function TicketDetailsPage() {
  const { id } = useParams();
  const { language } = useLanguage();
  const t = useMemo(() => translations[language], [language]);
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentsEndRef = useRef(null);
  const isRTL = language === "ar";

  const loadTicket = async () => {
    try {
      // Try user route first, then admin route if user is admin
      let res = await fetch(`/api/v1/dashboard/tickets/${id}`, {
        credentials: "include",
      });
      if (!res.ok && user?.role === "admin") {
        // Try admin route if user route fails and user is admin
        res = await fetch(`/api/v1/admin/dashboard/tickets/${id}`, {
          credentials: "include",
        });
      }
      if (!res.ok) throw new Error("Failed to fetch ticket");
      const data = await res.json();
      setTicket(data?.ticket || data);
    } catch {
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      await loadTicket();
    }
    load();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.comments]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      // Try user route first, then admin route if user is admin
      let res = await fetch(`/api/v1/dashboard/tickets/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ text: commentText.trim() }),
      });

      // If user route fails and user is admin, try admin route
      if (!res.ok && user?.role === "admin") {
        res = await fetch(`/api/v1/admin/dashboard/tickets/${id}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ text: commentText.trim() }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to add comment");
      }

      setCommentText("");
      // Reload ticket to get updated comments
      await loadTicket();
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#272727] text-white font-normal flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main
        className={`flex-1 flex flex-col transition-all duration-500 ${
          menuOpen ? (isRTL ? "mr-80" : "ml-80") : isRTL ? "mr-16" : "ml-16"
        }`}
      >
        <div className="w-full flex justify-center px-4">
          <div className="w-full max-w-3xl py-10 space-y-4">
            {loading ? (
              <div className="opacity-70">{language === "ar" ? "جاري التحميل..." : "Loading..."}</div>
            ) : !ticket ? (
              <div className="opacity-70">{language === "ar" ? "لم يتم العثور على التذكرة" : "Ticket not found"}</div>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-bold">{ticket.title}</h1>
                <div className="bg-[#343434] rounded-xl p-4 space-y-3">
                  <div className="opacity-80">
                    <span className="opacity-60">{t.ticketId}: </span>
                    <span className="font-mono">{ticket.ticketId || ticket._id}</span>
                  </div>
                  <div className="opacity-80">
                    <span className="opacity-60">{language === "ar" ? "الحالة: " : "Status: "}</span>
                    <span>{t[`status_${ticket.status}`] || ticket.status}</span>
                  </div>
                  <div className="opacity-80">
                    <span className="opacity-60">{t.category}: </span>
                    <span>{ticket.category}</span>
                  </div>
                  {ticket.subcategory && (
                    <div className="opacity-80">
                      <span className="opacity-60">{t.subcategory}: </span>
                      <span>{ticket.subcategory}</span>
                    </div>
                  )}
                  <div className="opacity-80">
                    <span className="opacity-60">{t.priority}: </span>
                    <span>{ticket.priority}</span>
                  </div>
                  <div className="opacity-80">
                    <span className="opacity-60">{language === "ar" ? "أُنشئت في: " : "Created: "}</span>
                    <span>{new Date(ticket.createdAt).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}</span>
                  </div>
                  <div>
                    <div className="mb-1 opacity-60">{t.description}</div>
                    <div className="bg-[#2f2f2f] rounded-lg p-3 whitespace-pre-wrap">{ticket.description}</div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="bg-[#343434] rounded-xl p-4 space-y-4">
                  <h2 className="text-xl font-semibold">{t.comments}</h2>
                  
                  {/* Comments List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {ticket.comments && ticket.comments.length > 0 ? (
                      [...ticket.comments]
                        .sort((a, b) => new Date(b.commentedAt) - new Date(a.commentedAt))
                        .map((comment, index) => (
                        <div key={index} className="bg-[#2C2C2C] rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm">{comment.commentedBy}</span>
                            <span className="text-xs opacity-60">
                              {new Date(comment.commentedAt).toLocaleString(
                                language === "ar" ? "ar-SA" : "en-US"
                              )}
                            </span>
                          </div>
                          <p className="text-sm opacity-90 whitespace-pre-wrap">{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="opacity-60 text-sm py-4 text-center">
                        {t.noComments}
                      </div>
                    )}
                    <div ref={commentsEndRef} />
                  </div>

                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="space-y-2">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={t.commentPlaceholder}
                      className="w-full bg-[#2C2C2C] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#2AC0DA] min-h-[100px] resize-none"
                      required
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !commentText.trim()}
                      className="px-6 py-2 bg-[#2AC0DA] rounded-lg hover:opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment 
                        ? (language === "ar" ? "جاري النشر..." : "Posting...") 
                        : t.postComment
                      }
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


