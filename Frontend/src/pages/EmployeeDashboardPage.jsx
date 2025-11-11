import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { translations } from "../translations.js";

const STATUS_ORDER = ["new", "in_progress", "assigned", "resolved", "not_resolved"];

function StatusCard({ title, count, accent }) {
  return (
    <div className="bg-[#343434] rounded-xl p-5 flex flex-col gap-3">
      <span className="text-sm opacity-60">{title}</span>
      <span className={`text-3xl font-semibold ${accent}`}>{count}</span>
    </div>
  );
}

export default function EmployeeDashboardPage() {
  const { language } = useLanguage();
  const t = useMemo(() => translations[language], [language]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isRTL = language === "ar";

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/v1/dashboard/user", {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Failed to fetch");
        }
        if (alive) {
          setTickets(data?.tickets || data || []);
        }
      } catch (err) {
        if (alive) {
          setError(err.message);
          setTickets([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = tickets.length;
    const statusCounts = STATUS_ORDER.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
    tickets.forEach((ticket) => {
      const key = ticket.status;
      if (statusCounts[key] !== undefined) statusCounts[key] += 1;
    });
    return { total, statusCounts };
  }, [tickets]);

  return (
    <div
      className="min-h-screen bg-[#272727] text-white font-normal flex flex-col"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Sidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main
        className={`flex-1 flex flex-col transition-all duration-500 ${
          menuOpen ? (isRTL ? "mr-80" : "ml-80") : isRTL ? "mr-16" : "ml-16"
        }`}
      >
        <div className="w-full flex justify-center px-4">
          <div className="w-full max-w-5xl py-10 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h1 className="text-3xl md:text-4xl font-bold">
                {t.employeeDashboard}
              </h1>
              <div className="opacity-70 text-sm">
                {language === "ar"
                  ? `آخر تحديث: ${new Date().toLocaleString("ar-SA")}`
                  : `Last updated: ${new Date().toLocaleString("en-US")}`}
              </div>
            </div>

            {loading ? (
              <div className="opacity-70">
                {language === "ar" ? "جاري تحميل البيانات..." : "Loading statistics..."}
              </div>
            ) : error ? (
              <div className="text-red-400">{error}</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatusCard title={t.totalTickets} count={stats.total} accent="text-[#2AC0DA]" />
                  <StatusCard title={t.openTickets} count={stats.statusCounts.new || 0} accent="text-emerald-400" />
                  <StatusCard title={t.inProgressTickets} count={stats.statusCounts.in_progress || 0} accent="text-yellow-300" />
                  <StatusCard title={t.resolvedTickets} count={stats.statusCounts.resolved || 0} accent="text-blue-300" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-[#343434] rounded-xl p-5 space-y-4">
                    <h2 className="text-xl font-semibold">{t.latestTickets}</h2>
                    {tickets.length === 0 ? (
                      <div className="opacity-70">
                        {language === "ar" ? "لا توجد تذاكر حتى الآن" : "No tickets yet"}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tickets
                          .slice()
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                          .slice(0, 5)
                          .map((ticket) => (
                            <Link
                              key={ticket._id}
                              to={`/tickets/${ticket._id}`}
                              className="block bg-[#2C2C2C] rounded-lg p-4 hover:bg-[#2f2f2f] transition"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className={`font-semibold ${isRTL ? "text-right" : "text-left"}`}>
                                  {ticket.title}
                                </div>
                                <span className="text-xs opacity-60">
                                  {new Date(ticket.createdAt).toLocaleDateString(
                                    language === "ar" ? "ar-SA" : "en-US"
                                  )}
                                </span>
                              </div>
                              <div className="text-sm opacity-70 mt-1">
                                {ticket.category} • {ticket.status}
                              </div>
                            </Link>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#343434] rounded-xl p-5 space-y-4">
                    <h2 className="text-xl font-semibold">
                      {language === "ar" ? "تفاصيل الحالة" : "Status Breakdown"}
                    </h2>
                    <div className="space-y-3">
                      {STATUS_ORDER.map((statusKey) => (
                        <div key={statusKey} className="flex items-center justify-between gap-3">
                          <span className="opacity-70">
                            {t[`status_${statusKey}`] || statusKey}
                          </span>
                          <div className="flex-1 mx-4 h-2 bg-[#2C2C2C] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#2AC0DA] via-[#CEE9E8] to-[#48A07D]"
                              style={{
                                width:
                                  stats.total === 0
                                    ? "0%"
                                    : `${Math.round(
                                        (stats.statusCounts[statusKey] / stats.total) * 100
                                      )}%`,
                              }}
                            />
                          </div>
                          <span className="font-semibold">
                            {stats.statusCounts[statusKey] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
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


