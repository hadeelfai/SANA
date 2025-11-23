// =======================================================
// EMPLOYEE DASHBOARD PAGE
// =======================================================

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { translations } from "../translations.js";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts";

const STATUS_ORDER = ["new", "in_progress", "assigned", "resolved", "not_resolved"];
const GRADIENT = "linear-gradient(to right, #38d7f7, #8ad0b4)"; 
const MTTR_TARGET_HOURS = 24;
const CHANNEL_COLORS = ["#38d7f7", "#22c55e"];
const PRIORITY_COLORS = ["#22c55e", "#eab308", "#fb923c", "#f97373"];

function StatusCard({ title, count }) {
  return (
    <div className="bg-[#343434] rounded-xl p-6 flex flex-col items-center justify-center gap-2 shadow-lg min-h-[140px]">
      <span className="text-sm opacity-70 text-center">{title}</span>
      <span
        className="text-5xl font-bold text-white"
        style={{ 
          background: GRADIENT,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {count}
      </span>
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

  // ==============================================
  // LOAD TICKETS FROM BACKEND
  // ==============================================
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

        if (!res.ok) throw new Error(data?.message || "Failed to fetch");

        if (alive) {
          setTickets(data?.tickets || []);
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
    return () => (alive = false);
  }, []);

  // ==============================================
  // MAIN STAT AGGREGATIONS
  // ==============================================
  const stats = useMemo(() => {
    const total = tickets.length;

    // Base status counter
    const statusCounts = STATUS_ORDER.reduce(
      (acc, s) => ({ ...acc, [s]: 0 }),
      {}
    );

    // Aggregation maps
    const trendMap = {};
    const painPointMap = {};
    const mttrPerServiceMap = {};
    const channelMixCounts = { selfService: 0, assisted: 0 };

    const agingBuckets = ["<24h", "2–3d", "4–7d", ">7d"];
    const agingMap = agingBuckets.reduce((acc, bucket) => {
      acc[bucket] = { low: 0, medium: 0, high: 0, critical: 0 };
      return acc;
    }, {});

    let mttrSum = 0;
    let mttrCount = 0;

    const now = Date.now();

    // =========================================
    // PROCESS EACH TICKET
    // =========================================
    tickets.forEach((ticket) => {
      const status = ticket.status || "new";

      // -------- STATUS COUNTS
      if (statusCounts[status] !== undefined) {
        statusCounts[status] += 1;
      }

      // -------- TREND GRAPH
      const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : null;
      const resolvedAt = ticket.resolvedAt ? new Date(ticket.resolvedAt) : null;

      if (createdAt && !isNaN(createdAt)) {
        const day = createdAt.toISOString().slice(0, 10);
        if (!trendMap[day]) trendMap[day] = { created: 0, resolved: 0 };
        trendMap[day].created++;
      }

      if (resolvedAt && !isNaN(resolvedAt)) {
        const day = resolvedAt.toISOString().slice(0, 10);
        if (!trendMap[day]) trendMap[day] = { created: 0, resolved: 0 };
        trendMap[day].resolved++;
      }

      // -------- MTTR
      let mttrHours = ticket.mttrHours;
      if (!mttrHours && createdAt && resolvedAt) {
        mttrHours = (resolvedAt - createdAt) / (1000 * 60 * 60);
      }

      if (mttrHours && !isNaN(mttrHours)) {
        mttrSum += mttrHours;
        mttrCount++;

        const service = ticket.category;
        if (!mttrPerServiceMap[service]) mttrPerServiceMap[service] = { sum: 0, count: 0 };
        mttrPerServiceMap[service].sum += mttrHours;
        mttrPerServiceMap[service].count++;
      }

      // -------- TOP PAIN POINTS (CATEGORY ONLY)
      const painKey = ticket.category || "Other";
      painPointMap[painKey] = (painPointMap[painKey] || 0) + 1;

      // -------- CHANNEL MIX (self_service or assisted)
      if (ticket.channel === "self_service") {
        channelMixCounts.selfService++;
      } else {
        channelMixCounts.assisted++;
      }

      // -------- AGING BACKLOG
      if (status !== "resolved" && createdAt) {
        const ageHours = (now - createdAt) / (1000 * 60 * 60);
        let bucket = "<24h";
        if (ageHours >= 24 && ageHours < 72) bucket = "2–3d";
        else if (ageHours >= 72 && ageHours < 168) bucket = "4–7d";
        else if (ageHours >= 168) bucket = ">7d";

        const prio = (ticket.priority || "low").toLowerCase();
        const validPrio = ["low", "medium", "high", "critical"].includes(prio)
          ? prio
          : "low";

        agingMap[bucket][validPrio]++;
      }
    });

    // Prepare trend data
    const trendData = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, created: vals.created, resolved: vals.resolved }));

    // Pain point data (Pareto)
    const painEntries = Object.entries(painPointMap).sort((a, b) => b[1] - a[1]);
    const totalPain = painEntries.reduce((s, [, c]) => s + c, 0);
    let cumulative = 0;

    const painData = painEntries.slice(0, 10).map(([name, count]) => {
      cumulative += count;
      return {
        name,
        count,
        cumulativePct: totalPain ? +((cumulative / totalPain) * 100).toFixed(1) : 0,
      };
    });

    // Channel mix
    const channelMixData = [
      {
        name:
          language === "ar"
            ? "الخدمة الذاتية"
            : "Self-Service",
        value: channelMixCounts.selfService,
      },
      {
        name:
          language === "ar"
            ? "الدعم المباشر"
            : "Assisted",
        value: channelMixCounts.assisted,
      },
    ];

    // Aging backlog
    const agingBacklogData = agingBuckets.map((bucket) => ({
      bucket,
      ...agingMap[bucket],
    }));

    // KPIs
    const openCount = total - (statusCounts.resolved || 0);
    const avgMttr = mttrCount ? +(mttrSum / mttrCount).toFixed(1) : 0;

    return {
      total,
      statusCounts,
      openCount,
      avgMttr,
      trendData,
      painData,
      channelMixData,
      agingBacklogData,
    };
  }, [tickets, language]);

  // ==============================================
  // RENDER PAGE
  // ==============================================
  return (
    <div
      className="min-h-screen bg-[#272727] text-white flex flex-col"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Sidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <main
        className={`flex-1 transition-all duration-500 ${
          menuOpen ? (isRTL ? "mr-80" : "ml-80") : isRTL ? "mr-16" : "ml-16"
        }`}
      >
        <div className="w-full flex justify-center px-4">
          <div className="max-w-6xl w-full py-10 space-y-6">

            {/* Page Header */}
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

            {/* Loading & Error */}
            {loading ? (
              <div className="opacity-70">
                {language === "ar" ? "جاري تحميل البيانات..." : "Loading..."}
              </div>
            ) : error ? (
              <div className="text-red-400">{error}</div>
            ) : (
              <>
                {/* ================= KPI CARDS ================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatusCard
                    title={language === "ar" ? "التذاكر المفتوحة" : "Open Tickets"}
                    count={stats.openCount}
                  />

                  <StatusCard
                    title={language === "ar" ? "نسبة الخدمة الذاتية" : "Self-Service %"}
                    count={(() => {
                      const total = stats.channelMixData?.[0].value + stats.channelMixData?.[1].value;
                      if (!total) return "0%";
                      return `${Math.round((stats.channelMixData[0].value / total) * 100)}%`;
                    })()}
                  />

                  <StatusCard
                    title={language === "ar" ? "إجمالي التذاكر" : "Total Tickets"}
                    count={stats.total}
                  />
                </div>

                {/* ================= TREND + CHANNEL MIX ================= */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  {/* Created vs Resolved */}
                  <div className="bg-[#343434] rounded-xl p-5 space-y-4 xl:col-span-2">
                    <h2 className="text-xl font-semibold">
                      {language === "ar" ? "اتجاه إنشاء وحل التذاكر" : "Ticket Creation vs Resolution Trend"}
                    </h2>

                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.trendData}>
                          <CartesianGrid stroke="#444444" strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#d1d5db"
                          />
                          <YAxis 
                            stroke="#d1d5db"
                            label={{ 
                              value: language === "ar" ? "عدد التذاكر" : "Tickets Count", 
                              angle: -90, 
                              position: "insideLeft",
                              offset: 10,
                              style: { fill: "#d1d5db", fontSize: 14, fontWeight: 500 }
                            }}
                          />
                          <Tooltip contentStyle={{ background: "#111827", border: "none" }} />
                          <Legend />

                          <Line
                            type="monotone"
                            dataKey="created"
                            stroke="#38bdf8"
                            strokeWidth={2}
                            dot={false}
                          />

                          <Line
                            type="monotone"
                            dataKey="resolved"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Channel Mix */}
                  <div className="bg-[#343434] rounded-xl p-5 space-y-4">
                    <h2 className="text-xl font-semibold">
                      {language === "ar" ? "توزيع قنوات الدعم" : "Support Channel Distribution"}
                    </h2>

                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.channelMixData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="55%"
                            outerRadius="85%"
                          >
                            {stats.channelMixData.map((_, idx) => (
                              <Cell
                                key={idx}
                                fill={CHANNEL_COLORS[idx % CHANNEL_COLORS.length]}
                              />
                            ))}
                          </Pie>

                          <Tooltip contentStyle={{ background: "#111827", border: "none" }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* ================= TOP PAIN POINTS ================= */}
                <div className="bg-[#343434] rounded-xl p-5 space-y-4">
                  <h2 className="text-xl font-semibold">
                    {language === "ar" ? "الفئات الأكثر شيوعًا" : "Most Common Issue Categories"}
                  </h2>

                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={stats.painData}>
                        <CartesianGrid stroke="#444444" strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#d1d5db"
                        />
                        <YAxis 
                          stroke="#d1d5db"
                          label={{ 
                            value: language === "ar" ? "العدد" : "Count", 
                            angle: -90, 
                            position: "insideLeft",
                            offset: 10,
                            style: { fill: "#d1d5db", fontSize: 14, fontWeight: 500 }
                          }}
                        />

                        <Tooltip contentStyle={{ background: "#111827", border: "none" }} />
                        <Legend />

                        <Bar dataKey="count" fill="#38bdf8" />
                        <Line
                          type="monotone"
                          dataKey="cumulativePct"
                          stroke="#22c55e"
                          strokeWidth={2}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  {/* Aging Backlog */}
                  <div className="bg-[#343434] rounded-xl p-5 space-y-4">
                    <h2 className="text-xl font-semibold">
                      {language === "ar"
                        ? "توزيع عمر التذاكر المفتوحة"
                        : "Open Ticket Age Distribution"}
                    </h2>
                    <div className="h-64">
                      {stats.agingBacklogData?.length === 0 ? (
                        <div className="opacity-70 text-sm">
                          {language === "ar" ? "لا توجد تذاكر متراكمة" : "No backlog data"}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.agingBacklogData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
                            <XAxis 
                              dataKey="bucket" 
                              stroke="#d1d5db" 
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis 
                              stroke="#d1d5db"
                              label={{ 
                                value: language === "ar" ? "العدد" : "Count", 
                                angle: -90, 
                                position: "insideLeft",
                                offset: 10,
                                style: { fill: "#d1d5db", fontSize: 14, fontWeight: 500 }
                              }}
                            />
                            <Tooltip contentStyle={{ backgroundColor: "#111827", border: "none" }} />
                            <Legend />
                            <Bar dataKey="low" stackId="age" fill="#22c55e" />
                            <Bar dataKey="medium" stackId="age" fill="#eab308" />
                            <Bar dataKey="high" stackId="age" fill="#fb923c" />
                            <Bar dataKey="critical" stackId="age" fill="#f97373" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Status Breakdown */}
                  <div className="bg-[#343434] rounded-xl p-5 flex flex-col">
                    <h2 className="text-xl font-semibold mb-4">
                      {language === "ar" ? "نظرة عامة على حالة التذاكر" : "Ticket Status Overview"}
                    </h2>
                    <div className="flex-1 flex flex-col justify-evenly">
                      {STATUS_ORDER.map((statusKey) => (
                        <div key={statusKey} className="flex items-center justify-between gap-3">
                          <span className="opacity-70 min-w-[100px]">
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
                          <span className="font-semibold min-w-[30px] text-right">{stats.statusCounts[statusKey] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Scrollable Latest Tickets */}
                <div className="bg-[#343434] rounded-xl p-5 space-y-4 h-80 overflow-y-auto">
                  <h2 className="text-xl font-semibold">{t.latestTickets}</h2>

                  {tickets.length === 0 ? (
                    <div className="opacity-70">
                      {language === "ar" ? "لا توجد تذاكر" : "No tickets yet"}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tickets
                        .slice()
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .map((ticket) => (
                          <Link
                            key={ticket._id}
                            to={`/tickets/${ticket._id}`}
                            className="block bg-[#2C2C2C] rounded-lg p-4 hover:bg-[#2f2f2f] transition"
                          >
                            <div className="flex items-center justify-between">
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
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}