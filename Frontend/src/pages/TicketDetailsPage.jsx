import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { translations } from "../translations.js";

export default function TicketDetailsPage() {
  const { id } = useParams();
  const { language } = useLanguage();
  const t = useMemo(() => translations[language], [language]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRTL = language === "ar";

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/dashboard/tickets/${id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch ticket");
        const data = await res.json();
        if (alive) setTicket(data?.ticket || data);
      } catch {
        if (alive) setTicket(null);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [id]);

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
                    <span className="opacity-60">{language === "ar" ? "الحالة: " : "Status: "}</span>
                    <span>{ticket.status}</span>
                  </div>
                  <div className="opacity-80">
                    <span className="opacity-60">{language === "ar" ? "التصنيف: " : "Category: "}</span>
                    <span>{ticket.category}</span>
                  </div>
                  <div className="opacity-80">
                    <span className="opacity-60">{language === "ar" ? "الأولوية: " : "Priority: "}</span>
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
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


