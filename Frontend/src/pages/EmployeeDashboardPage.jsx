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
const MTTR_TARGET_HOURS = 24;

const CHANNEL_COLORS = ["#22c55e", "#f97316"];
const PRIORITY_COLORS = ["#22c55e", "#eab308", "#fb923c", "#f97373"];

function StatusCard({ title, count, accent }) {
  return (
    <div className="bg-[#343434] rounded-xl p-5 flex flex-col gap-3">
      <span className="text-sm opacity-70">{title}</span>
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

    // ---------- Base status counts ----------
    const statusCounts = STATUS_ORDER.reduce(
      (acc, status) => ({ ...acc, [status]: 0 }),
      {}
    );

    // ---------- Aggregation maps ----------
    const trendMap = {}; // date -> { created, resolved }
    const deptPriorityMap = {}; // dept -> { priority -> count } (SLA breach)
    const allPrioritiesSet = new Set();
    const painPointMap = {}; // subcategory / affectedService -> count
    const mttrPerServiceMap = {}; // service -> { sum, count }
    const impactMap = {}; // location -> { status -> count }
    const reopenByCategoryMap = {}; // category -> { total, reopened }
    const channelMixCounts = { selfService: 0, assisted: 0 };
    const agingBuckets = ["<24h", "2–3d", "4–7d", ">7d"];
    const agingMap = agingBuckets.reduce((acc, bucket) => {
      acc[bucket] = { low: 0, medium: 0, high: 0, critical: 0 };
      return acc;
    }, {});

    let mttrSum = 0;
    let mttrCount = 0;
    let slaBreachedResolved = 0;
    let slaBreachedCount = 0;

    const now = Date.now();

    tickets.forEach((ticket) => {
      const status = ticket.status || "new";
      if (statusCounts[status] !== undefined) {
        statusCounts[status] += 1;
      }

      // ---------- Trend: Created vs Resolved ----------
      const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : null;
      const resolvedAt = ticket.resolvedAt ? new Date(ticket.resolvedAt) : null;

      if (createdAt && !Number.isNaN(createdAt.getTime())) {
        const day = createdAt.toISOString().slice(0, 10);
        if (!trendMap[day]) trendMap[day] = { created: 0, resolved: 0 };
        trendMap[day].created += 1;
      }
      if (resolvedAt && !Number.isNaN(resolvedAt.getTime())) {
        const day = resolvedAt.toISOString().slice(0, 10);
        if (!trendMap[day]) trendMap[day] = { created: 0, resolved: 0 };
        trendMap[day].resolved += 1;
      }

      // ---------- MTTR ----------
      let mttrHours = ticket.mttrHours;
      if (mttrHours == null && createdAt && resolvedAt) {
        mttrHours = (resolvedAt - createdAt) / (1000 * 60 * 60);
      }
      if (mttrHours != null && !Number.isNaN(mttrHours)) {
        mttrSum += mttrHours;
        mttrCount += 1;
        const service =
          ticket.service || ticket.category || (language === "ar" ? "خدمة عامة" : "General");
        if (!mttrPerServiceMap[service]) {
          mttrPerServiceMap[service] = { sum: 0, count: 0 };
        }
        mttrPerServiceMap[service].sum += mttrHours;
        mttrPerServiceMap[service].count += 1;
      }

      // ---------- SLA Breach Heatmap (Dept × Priority) ----------
      const slaBreached = !!ticket.slaBreached;
      if (status === "resolved" && (createdAt || resolvedAt)) {
        slaBreachedResolved += 1;
        if (slaBreached) slaBreachedCount += 1;
      }
      if (slaBreached) {
        const dept = ticket.department || (language === "ar" ? "غير محدد" : "Unspecified");
        const priority =
          ticket.priority || (language === "ar" ? "بدون أولوية" : "No Priority");
        allPrioritiesSet.add(priority);
        if (!deptPriorityMap[dept]) deptPriorityMap[dept] = {};
        if (!deptPriorityMap[dept][priority]) deptPriorityMap[dept][priority] = 0;
        deptPriorityMap[dept][priority] += 1;
      }

      // ---------- Top Pain Points (Pareto) ----------
      const painKey =
        ticket.subcategory ||
        ticket.affectedService ||
        ticket.category ||
        (language === "ar" ? "أخرى" : "Other");
      if (!painPointMap[painKey]) painPointMap[painKey] = 0;
      painPointMap[painKey] += 1;

      // ---------- Impact Map (Location × Status) ----------
      const location =
        ticket.location || (language === "ar" ? "غير محدد" : "Unspecified");
      if (!impactMap[location]) {
        impactMap[location] = {};
      }
      if (!impactMap[location][status]) {
        impactMap[location][status] = 0;
      }
      impactMap[location][status] += 1;

      // ---------- Reopen Rate % by Category ----------
      const category =
        ticket.category || (language === "ar" ? "غير مصنف" : "Uncategorized");
      if (!reopenByCategoryMap[category]) {
        reopenByCategoryMap[category] = { total: 0, reopened: 0 };
      }
      reopenByCategoryMap[category].total += 1;
      const reopened = !!ticket.reopened || (ticket.reopenCount || 0) > 0;
      if (reopened) reopenByCategoryMap[category].reopened += 1;

      // ---------- Channel Mix (Self-service vs Assisted) ----------
      const channel = (ticket.channel || "").toLowerCase();
      const isSelfService = channel === "chatbot" || channel === "portal";
      if (isSelfService) {
        channelMixCounts.selfService += 1;
      } else {
        channelMixCounts.assisted += 1;
      }

      // ---------- Aging Backlog ----------
      const isResolved = status === "resolved";
      if (!isResolved && createdAt) {
        const ageHours = (now - createdAt.getTime()) / (1000 * 60 * 60);
        let bucket = "<24h";
        if (ageHours >= 24 && ageHours < 72) bucket = "2–3d";
        else if (ageHours >= 72 && ageHours < 168) bucket = "4–7d";
        else if (ageHours >= 168) bucket = ">7d";

        const prio = (ticket.priority || "low").toLowerCase();
        const prioKey =
          prio === "high" || prio === "critical" || prio === "medium" || prio === "low"
            ? prio
            : "low";
        agingMap[bucket][prioKey] += 1;
      }
    });

    // ---------- Derived arrays for charts ----------

    const trendData = Object.entries(trendMap)
      .sort(([d1], [d2]) => d1.localeCompare(d2))
      .map(([date, v]) => ({ date, created: v.created, resolved: v.resolved }));

    const allPriorities = Array.from(allPrioritiesSet);
    const slaHeatmapData = Object.entries(deptPriorityMap).map(
      ([department, prioCounts]) => {
        const row = { department };
        allPriorities.forEach((p) => {
          row[p] = prioCounts[p] || 0;
        });
        return row;
      }
    );

    const painEntries = Object.entries(painPointMap).sort((a, b) => b[1] - a[1]);
    const totalPain = painEntries.reduce((sum, [, count]) => sum + count, 0);
    let cumulative = 0;
    const painData = painEntries.slice(0, 10).map(([name, count]) => {
      cumulative += count;
      return {
        name,
        count,
        cumulativePct: totalPain ? +(cumulative / totalPain * 100).toFixed(1) : 0,
      };
    });

    const mttrByService = Object.entries(mttrPerServiceMap).map(
      ([service, { sum, count }]) => ({
        service,
        mttr: +(sum / count).toFixed(1),
        target: MTTR_TARGET_HOURS,
      })
    );

    const impactData = Object.entries(impactMap).map(([location, statusObj]) => {
      const row = { location };
      STATUS_ORDER.forEach((s) => {
        row[s] = statusObj[s] || 0;
      });
      return row;
    });

    const reopenRateByCategory = Object.entries(reopenByCategoryMap).map(
      ([category, { total: cTotal, reopened }]) => ({
        category,
        rate: cTotal ? +(reopened / cTotal * 100).toFixed(1) : 0,
      })
    );

    const channelMixData = [
      {
        name:
          language === "ar"
            ? "الخدمة الذاتية (شات بوت / البوابة)"
            : "Self-Service (Chatbot/Portal)",
        value: channelMixCounts.selfService,
      },
      {
        name:
          language === "ar"
            ? "الدعم المباشر (إيميل / هاتف)"
            : "Assisted (Email/Phone)",
        value: channelMixCounts.assisted,
      },
    ];

    const agingBacklogData = agingBuckets.map((bucket) => ({
      bucket,
      ...agingMap[bucket],
    }));

    const openCount = total - (statusCounts.resolved || 0);
    const avgMttr = mttrCount ? +(mttrSum / mttrCount).toFixed(1) : 0;
    const slaBreachPct = slaBreachedResolved
      ? +(slaBreachedCount / slaBreachedResolved * 100).toFixed(1)
      : 0;
    const totalChannels = channelMixCounts.selfService + channelMixCounts.assisted;
    const selfServicePct = totalChannels
      ? +(channelMixCounts.selfService / totalChannels * 100).toFixed(1)
      : 0;

    return {
      total,
      statusCounts,
      openCount,
      avgMttr,
      slaBreachPct,
      selfServicePct,
      trendData,
      slaHeatmapData,
      allPriorities,
      painData,
      mttrByService,
      impactData,
      reopenRateByCategory,
      channelMixData,
      agingBacklogData,
    };
  }, [tickets, language]);

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
          <div className="w-full max-w-6xl py-10 space-y-6">
            {/* Header */}
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

            {/* Loading / Error / Content */}
            {loading ? (
              <div className="opacity-70">
                {language === "ar"
                  ? "جاري تحميل البيانات..."
                  : "Loading statistics..."}
              </div>
            ) : error ? (
              <div className="text-red-400">{error}</div>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatusCard
                    title={
                      language === "ar" ? "التذاكر المفتوحة" : "Open Tickets"
                    }
                    count={stats.openCount}
                    accent="text-[#2AC0DA]"
                  />
                  <StatusCard
                    title={
                      language === "ar"
                        ? "متوسط زمن الحل (ساعة)"
                        : "Avg MTTR (hrs)"
                    }
                    count={stats.avgMttr ? `${stats.avgMttr}` : "-"}
                    accent="text-emerald-400"
                  />
                  <StatusCard
                    title={
                      language === "ar"
                        ? "نسبة خرق مستوى الخدمة"
                        : "SLA Breach %"
                    }
                    count={`${stats.slaBreachPct || 0}%`}
                    accent="text-red-400"
                  />
                  <StatusCard
                    title={
                      language === "ar"
                        ? "نسبة الخدمة الذاتية"
                        : "Self-Service %"
                    }
                    count={`${stats.selfServicePct || 0}%`}
                    accent="text-yellow-300"
                  />
                </div>

                {/* Created vs Resolved + Channel Mix + Reopen Rate */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  {/* Created vs Resolved Trend */}
                  <div className="bg-[#343434] rounded-xl p-5 space-y-4 xl:col-span-2">
                    <h2 className="text-xl font-semibold">
                      {language === "ar"
                        ? "اتجاه إنشاء وحل التذاكر"
                        : "Created vs Resolved Trend"}
                    </h2>
                    {stats.trendData.length === 0 ? (
                      <div className="opacity-70">
                        {language === "ar"
                          ? "لا توجد بيانات كافية للعرض"
                          : "No data to display"}
                      </div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={stats.trendData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#444444"
                            />
                            <XAxis
                              dataKey="date"
                              stroke="#d1d5db"
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis stroke="#d1d5db" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#111827",
                                border: "none",
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="created"
                              stroke="#38bdf8"
                              strokeWidth={2}
                              dot={false}
                              name={
                                language === "ar"
                                  ? "تذاكر منشأة"
                                  : "Created"
                              }
                            />
                            <Line
                              type="monotone"
                              dataKey="resolved"
                              stroke="#22c55e"
                              strokeWidth={2}
                              dot={false}
                              name={
                                language === "ar"
                                  ? "تذاكر محلولة"
                                  : "Resolved"
                              }
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Right column: Channel mix + Reopen rate */}
                  <div className="space-y-4">
                    {/* Channel Mix Donut */}
                    <div className="bg-[#343434] rounded-xl p-5 space-y-4">
                      <h2 className="text-xl font-semibold">
                        {language === "ar"
                          ? "قنوات استقبال التذاكر"
                          : "Channel Mix"}
                      </h2>
                      <div className="h-56 flex items-center justify-center">
                        {stats.channelMixData?.reduce(
                          (sum, x) => sum + x.value,
                          0
                        ) === 0 ? (
                          <div className="opacity-70 text-sm">
                            {language === "ar"
                              ? "لا توجد بيانات قنوات"
                              : "No channel data"}
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={stats.channelMixData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius="55%"
                                outerRadius="85%"
                                paddingAngle={3}
                              >
                                {stats.channelMixData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={CHANNEL_COLORS[index % CHANNEL_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#111827",
                                  border: "none",
                                }}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    {/* Reopen Rate by Category */}
                    <div className="bg-[#343434] rounded-xl p-5 space-y-4">
                      <h2 className="text-xl font-semibold">
                        {language === "ar"
                          ? "نسبة إعادة فتح التذاكر حسب الفئة"
                          : "Reopen Rate % by Category"}
                      </h2>
                      <div className="h-52">
                        {stats.reopenRateByCategory?.length === 0 ? (
                          <div className="opacity-70 text-sm">
                            {language === "ar"
                              ? "لا توجد بيانات إعادة فتح"
                              : "No reopen data"}
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.reopenRateByCategory}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#444444"
                              />
                              <XAxis
                                dataKey="category"
                                stroke="#d1d5db"
                                tick={{ fontSize: 10 }}
                              />
                              <YAxis
                                stroke="#d1d5db"
                                tickFormatter={(v) => `${v}%`}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#111827",
                                  border: "none",
                                }}
                                formatter={(value) => [`${value}%`, "Rate"]}
                              />
                              <Bar dataKey="rate" fill="#6366f1" />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SLA Heatmap + Impact Map */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* SLA Breach Heatmap */}
                  <div className="bg-[#343434] rounded-xl p-5 space-y-4">
                    <h2 className="text-xl font-semibold">
                      {language === "ar"
                        ? "خرق مستوى الخدمة حسب القسم والأولوية"
                        : "SLA Breach (Dept × Priority)"}
                    </h2>
                    <div className="h-64">
                      {stats.slaHeatmapData?.length === 0 ? (
                        <div className="opacity-70 text-sm">
                          {language === "ar"
                            ? "لا توجد بيانات خرق مستوى الخدمة"
                            : "No SLA breach data"}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.slaHeatmapData} stackOffset="expand">
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#444444"
                            />
                            <XAxis
                              dataKey="department"
                              stroke="#d1d5db"
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis
                              stroke="#d1d5db"
                              tickFormatter={(v) => `${Math.round(v * 100)}%`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#111827",
                                border: "none",
                              }}
                              formatter={(value, name) => [value, name]}
                            />
                            <Legend />
                            {stats.allPriorities.map((prio, idx) => (
                              <Bar
                                key={prio}
                                dataKey={prio}
                                stackId="sla"
                                fill={
                                  PRIORITY_COLORS[idx % PRIORITY_COLORS.length]
                                }
                              />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Impact Map (Location × Status) */}
                  <div className="bg-[#343434] rounded-xl p-5 space-y-4">
                    <h2 className="text-xl font-semibold">
                      {language === "ar"
                        ? "خريطة الأثر حسب الموقع والحالة"
                        : "Impact Map (Location × Status)"}
                    </h2>
                    <div className="h-64">
                      {stats.impactData?.length === 0 ? (
                        <div className="opacity-70 text-sm">
                          {language === "ar"
                            ? "لا توجد بيانات المواقع"
                            : "No location data"}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.impactData} stackOffset="expand">
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#444444"
                            />
                            <XAxis
                              dataKey="location"
                              stroke="#d1d5db"
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis
                              stroke="#d1d5db"
                              tickFormatter={(v) => `${Math.round(v * 100)}%`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#111827",
                                border: "none",
                              }}
                            />
                            <Legend />
                            {STATUS_ORDER.map((statusKey, idx) => (
                              <Bar
                                key={statusKey}
                                dataKey={statusKey}
                                stackId="impact"
                                fill={
                                  [
                                    "#22c55e",
                                    "#eab308",
                                    "#3b82f6",
                                    "#a855f7",
                                    "#f97373",
                                  ][idx % 5]
                                }
                              />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Pain Points (Pareto) */}
                <div className="bg-[#343434] rounded-xl p-5 space-y-4">
                  <h2 className="text-xl font-semibold">
                    {language === "ar"
                      ? "أهم نقاط الألم (تحليل باريتو)"
                      : "Top Pain Points (Pareto)"}
                  </h2>
                  <div className="h-72">
                    {stats.painData?.length === 0 ? (
                      <div className="opacity-70 text-sm">
                        {language === "ar"
                          ? "لا توجد بيانات نقاط الألم"
                          : "No pain point data"}
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={stats.painData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#444444"
                          />
                          <XAxis
                            dataKey="name"
                            stroke="#d1d5db"
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis
                            yAxisId="left"
                            stroke="#d1d5db"
                            orientation={isRTL ? "right" : "left"}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation={isRTL ? "left" : "right"}
                            stroke="#d1d5db"
                            tickFormatter={(v) => `${v}%`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#111827",
                              border: "none",
                            }}
                          />
                          <Legend />
                          <Bar
                            yAxisId="left"
                            dataKey="count"
                            name={
                              language === "ar" ? "عدد التذاكر" : "Ticket Count"
                            }
                            fill="#38bdf8"
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="cumulativePct"
                            name={
                              language === "ar"
                                ? "النسبة التراكمية"
                                : "Cumulative %"
                            }
                            stroke="#facc15"
                            strokeWidth={2}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* MTTR by Service + Aging Backlog */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* MTTR by Service */}
                  <div className="bg-[#343434] rounded-xl p-5 space-y-4">
                    <h2 className="text-xl font-semibold">
                      {language === "ar"
                        ? "متوسط زمن الحل حسب الخدمة"
                        : "MTTR by Service"}
                    </h2>
                    <div className="h-64">
                      {stats.mttrByService?.length === 0 ? (
                        <div className="opacity-70 text-sm">
                          {language === "ar"
                            ? "لا توجد بيانات زمن الحل"
                            : "No MTTR data"}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={stats.mttrByService}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#444444"
                            />
                            <XAxis
                              dataKey="service"
                              stroke="#d1d5db"
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis
                              stroke="#d1d5db"
                              label={{
                                value: language === "ar" ? "ساعات" : "Hours",
                                angle: -90,
                                position: "insideLeft",
                                style: { fill: "#d1d5db" },
                              }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#111827",
                                border: "none",
                              }}
                            />
                            <Legend />
                            <Bar
                              dataKey="mttr"
                              name={
                                language === "ar"
                                  ? "متوسط زمن الحل"
                                  : "Avg MTTR"
                              }
                              fill="#22c55e"
                            />
                            <Line
                              type="monotone"
                              dataKey="target"
                              name={
                                language === "ar"
                                  ? `الهدف (${MTTR_TARGET_HOURS} ساعة)`
                                  : `Target (${MTTR_TARGET_HOURS}h)`
                              }
                              stroke="#f97316"
                              strokeWidth={2}
                              dot={false}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Aging Backlog */}
                  <div className="bg-[#343434] rounded-xl p-5 space-y-4">
                    <h2 className="text-xl font-semibold">
                      {language === "ar"
                        ? "تراكم التذاكر حسب العمر والأولوية"
                        : "Aging Backlog (<24h / 2–3d / 4–7d / >7d × Priority)"}
                    </h2>
                    <div className="h-64">
                      {stats.agingBacklogData?.length === 0 ? (
                        <div className="opacity-70 text-sm">
                          {language === "ar"
                            ? "لا توجد تذاكر متراكمة"
                            : "No backlog data"}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.agingBacklogData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#444444"
                            />
                            <XAxis
                              dataKey="bucket"
                              stroke="#d1d5db"
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis stroke="#d1d5db" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#111827",
                                border: "none",
                              }}
                            />
                            <Legend />
                            <Bar
                              dataKey="low"
                              stackId="age"
                              name={language === "ar" ? "منخفض" : "Low"}
                              fill="#22c55e"
                            />
                            <Bar
                              dataKey="medium"
                              stackId="age"
                              name={language === "ar" ? "متوسط" : "Medium"}
                              fill="#eab308"
                            />
                            <Bar
                              dataKey="high"
                              stackId="age"
                              name={language === "ar" ? "عالٍ" : "High"}
                              fill="#fb923c"
                            />
                            <Bar
                              dataKey="critical"
                              stackId="age"
                              name={language === "ar" ? "حرج" : "Critical"}
                              fill="#f97373"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* Existing: Latest Tickets + Status Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Latest Tickets */}
                  <div className="bg-[#343434] rounded-xl p-5 space-y-4">
                    <h2 className="text-xl font-semibold">{t.latestTickets}</h2>
                    {tickets.length === 0 ? (
                      <div className="opacity-70">
                        {language === "ar"
                          ? "لا توجد تذاكر حتى الآن"
                          : "No tickets yet"}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tickets
                          .slice()
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt) - new Date(a.createdAt)
                          )
                          .slice(0, 5)
                          .map((ticket) => (
                            <Link
                              key={ticket._id}
                              to={`/tickets/${ticket._id}`}
                              className="block bg-[#2C2C2C] rounded-lg p-4 hover:bg-[#2f2f2f] transition"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div
                                  className={`font-semibold ${
                                    isRTL ? "text-right" : "text-left"
                                  }`}
                                >
                                  {ticket.title}
                                </div>
                                <span className="text-xs opacity-60">
                                  {new Date(
                                    ticket.createdAt
                                  ).toLocaleDateString(
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

                  {/* Status Breakdown */}
                  <div className="bg-[#343434] rounded-xl p-5 space-y-4">
                    <h2 className="text-xl font-semibold">
                      {language === "ar"
                        ? "تفاصيل الحالة"
                        : "Status Breakdown"}
                    </h2>
                    <div className="space-y-3">
                      {STATUS_ORDER.map((statusKey) => (
                        <div
                          key={statusKey}
                          className="flex items-center justify-between gap-3"
                        >
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
                                        (stats.statusCounts[statusKey] /
                                          stats.total) *
                                          100
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