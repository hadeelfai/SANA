import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { translations } from "../translations.js";
import { Link } from "react-router-dom";

function StatusPill({ status }) {
  const map = {
    new: "bg-gray-500",
    in_progress: "bg-yellow-500",
    resolved: "bg-emerald-500",
    assigned: "bg-sky-500",
    not_resolved: "bg-red-500",
  };
  const cls = map[status] || "bg-gray-500";
  return (
    <span className={`inline-block text-sm px-4 py-1 rounded-full text-white ${cls}`}>
      {status}
    </span>
  );
}

export default function MyTicketsPage() {
  const { language } = useLanguage();
  const t = useMemo(() => translations[language], [language]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const isRTL = language === "ar";

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/dashboard/user", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch tickets");
        const data = await res.json();
        const ticketsData = data?.tickets || data || [];
        // Sort tickets by newest first (by createdAt date, descending)
        const sortedTickets = ticketsData.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA; // Descending order (newest first)
        });
        if (alive) setTickets(sortedTickets);
      } catch {
        if (alive) setTickets([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#272727] text-white font-normal flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main
        className={`flex-1 flex flex-col transition-all duration-500 ${
          menuOpen ? (isRTL ? "mr-80" : "ml-80") : isRTL ? "mr-16" : "ml-16"
        }`}
      >
        <div className="w-full flex justify-center px-4">
          <div className="w-full max-w-4xl py-10 space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {language === "ar" ? "تذاكري" : "My Tickets"}
            </h1>
            {loading ? (
              <div className="opacity-70">{language === "ar" ? "جاري التحميل..." : "Loading..."}</div>
            ) : tickets.length === 0 ? (
              <div className="opacity-70">{language === "ar" ? "لا توجد تذاكر" : "No tickets found"}</div>
            ) : (
              tickets.map((tkt) => (
                <Link
                  to={`/tickets/${tkt._id}`}
                  key={tkt._id}
                  className="block bg-[#343434] rounded-xl p-4 hover:bg-[#2f2f2f] transition"
                >
                  <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className="flex-1 px-2">
                      <div className="text-lg font-semibold">{tkt.title}</div>
                      <div className="opacity-70 text-sm">{tkt.category}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusPill status={tkt.status} />
                      <div className="opacity-60 text-sm">
                        {new Date(tkt.createdAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


