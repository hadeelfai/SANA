// =======================================================
// ADMIN DASHBOARD PAGE (with KPIs + SLA + Charts)
// =======================================================

import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { translations } from "../translations.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Link } from "react-router-dom";

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
const CHANNEL_COLORS = ["#38d7f7", "#22c55e"];

// Priority-based SLA targets (Option B)
const PRIORITY_SLA_HOURS = {
  low: 72,      // 3 days
  medium: 48,   // 2 days
  high: 24,     // 1 day
  critical: 8,  // 8 hours
};

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

function StatusPill({ status, t, language }) {
  const map = {
    new: "bg-gray-500",
    in_progress: "bg-yellow-500",
    resolved: "bg-emerald-500",
    assigned: "bg-sky-500",
    not_resolved: "bg-red-500",
  };
  const cls = map[status] || "bg-gray-500";
  return (
    <span className={`inline-block text-xs px-3 py-1 rounded-full text-white ${cls}`}>
      {t[`status_${status}`] || status}
    </span>
  );
}

export default function AdminDashboardPage() {
  const { language } = useLanguage();
  const t = useMemo(() => translations[language], [language]);
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tickets"); // "tickets" or "users"
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [assignUserId, setAssignUserId] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [modalType, setModalType] = useState("status"); // "status" or "assign"
  const isRTL = language === "ar";
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    department: "",
    position: "",
    location: "",
  });

  function openEditModal(userToEdit) {
    setEditingUser(userToEdit);
    setEditForm({
      employeeId: userToEdit.employeeId || "",
      name: userToEdit.name || "",
      email: userToEdit.email || "",
      department: userToEdit.department || "",
      position: userToEdit.position || "",
      location: userToEdit.location || "",
    });
  }
  function closeEditModal() {
    setEditingUser(null);
  }
  async function handleUserEditSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/v1/admin/dashboard/update-user/${editingUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        await loadData();
        closeEditModal();
      }
    } catch (err) {}
  }

  useEffect(() => {
    if (user?.role !== "admin") {
      return;
    }
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [ticketsRes, usersRes, adminsRes] = await Promise.all([
        fetch("/api/v1/admin/dashboard/all-tickets", { credentials: "include" }),
        fetch("/api/v1/admin/dashboard/all-users", { credentials: "include" }),
        fetch("/api/v1/admin/dashboard/all-admins", { credentials: "include" }),
      ]);
      const ticketsData = await ticketsRes.json();
      const usersData = await usersRes.json();
      const adminsData = await adminsRes.json();

      if (!ticketsRes.ok) console.error("Tickets error:", ticketsData);
      if (!usersRes.ok) console.error("Users error:", usersData);
      if (!adminsRes.ok) console.error("Admins error:", adminsData);

      if (ticketsData.success) setTickets(ticketsData.tickets || []);
      else {
        console.error("Failed to load tickets:", ticketsData.message);
        setTickets([]);
      }

      if (usersData.success) setUsers(usersData.users || []);
      else {
        console.error("Failed to load users:", usersData.message);
        setUsers([]);
      }

      if (adminsData.success) setAdmins(adminsData.admins || []);
      else {
        console.error("Failed to load admins:", adminsData.message);
        setAdmins([]);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setTickets([]);
      setUsers([]);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(ticketId, status) {
    try {
      const res = await fetch(`/api/v1/admin/dashboard/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadData();
        setSelectedTicket(null);
        setNewStatus("");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  async function handleAssignTicket(ticketId, adminId) {
    try {
      const res = await fetch("/api/v1/admin/dashboard/assigned-ticket-admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: ticketId, adminId }),
      });
      if (res.ok) {
        await loadData();
        setSelectedTicket(null);
        setAssignUserId("");
      }
    } catch (err) {
      console.error("Failed to assign ticket:", err);
    }
  }

  async function handleDeleteTicket(ticketId) {
    if (
      !confirm(
        language === "ar"
          ? "هل أنت متأكد من حذف هذه التذكرة؟"
          : "Are you sure you want to delete this ticket?"
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/admin/dashboard/delete/${ticketId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Failed to delete ticket:", err);
    }
  }

  async function handleDeleteUser(userId) {
    if (
      !confirm(
        language === "ar"
          ? "هل أنت متأكد من حذف هذا المستخدم؟"
          : "Are you sure you want to delete this user?"
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/admin/dashboard/delete-user/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  }

  // =====================================================
  // DASHBOARD STATS + SLA LOGIC (Priority-based targets)
  // =====================================================
  const stats = useMemo(() => {
    const total = tickets.length;

    const statusCounts = STATUS_ORDER.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});

    const trendMap = {};
    const painPointMap = {};
    const channelMixCounts = { selfService: 0, assisted: 0 };

    const now = Date.now();
    let slaEligible = 0;
    let slaBreached = 0;

    tickets.forEach((ticket) => {
      const status = ticket.status || "new";
      if (statusCounts[status] !== undefined) statusCounts[status] += 1;

      const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : null;
      const resolvedAt = ticket.resolvedAt ? new Date(ticket.resolvedAt) : null;

      // Trend: created vs resolved per day
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

      // Pain points by category
      const painKey = ticket.category || "Other";
      painPointMap[painKey] = (painPointMap[painKey] || 0) + 1;

      // Channel mix
      if (ticket.channel === "self_service") {
        channelMixCounts.selfService++;
      } else {
        channelMixCounts.assisted++;
      }

      // SLA breach check (priority-based)
      const priority = (ticket.priority || "low").toLowerCase();
      const slaHours = PRIORITY_SLA_HOURS[priority];
      if (createdAt && slaHours) {
        slaEligible++;
        const endTime =
          resolvedAt && !isNaN(resolvedAt)
            ? resolvedAt.getTime()
            : now;
        const ageHours = (endTime - createdAt.getTime()) / (1000 * 60 * 60);
        if (ageHours > slaHours) slaBreached++;
      }
    });

    const openCount = total - (statusCounts.resolved || 0);

    // Trend data
    const trendData = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        created: vals.created,
        resolved: vals.resolved,
      }));

    // Pain data (Pareto)
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

    const channelMixData = [
      {
        name: language === "ar" ? "الخدمة الذاتية" : "Self-Service",
        value: channelMixCounts.selfService,
      },
      {
        name: language === "ar" ? "الدعم المباشر" : "Assisted",
        value: channelMixCounts.assisted,
      },
    ];

    const slaBreachPct = slaEligible
      ? Math.round((slaBreached / slaEligible) * 100)
      : 0;

    return {
      total,
      statusCounts,
      openCount,
      trendData,
      painData,
      channelMixData,
      slaBreachPct,
    };
  }, [tickets, language]);

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#272727] text-white flex items-center justify-center">
        <div>{language === "ar" ? "غير مصرح بالوصول" : "Access Denied"}</div>
      </div>
    );
  }

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
          <div className="w-full max-w-7xl py-10 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h1 className="text-3xl md:text-4xl font-bold">{t.adminDashboard}</h1>
              <div className="opacity-70 text-sm">
                {language === "ar"
                  ? `آخر تحديث: ${new Date().toLocaleString("ar-SA")}`
                  : `Last updated: ${new Date().toLocaleString("en-US")}`}
              </div>
            </div>

            {/* Statistics Dashboard */}
            {loading ? (
              <div className="opacity-70">
                {language === "ar" ? "جاري تحميل البيانات..." : "Loading statistics..."}
              </div>
            ) : (
              <>
                {/* ========= KPI CARDS (Open, Self-Service %, SLA Breach %, Total) ========= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatusCard
                    title={language === "ar" ? "التذاكر المفتوحة" : "Open Tickets"}
                    count={stats.openCount}
                  />

                  <StatusCard
                    title={language === "ar" ? "نسبة الخدمة الذاتية" : "Self-Service %"}
                    count={(() => {
                      const totalChannels =
                        (stats.channelMixData?.[0]?.value || 0) +
                        (stats.channelMixData?.[1]?.value || 0);
                      if (!totalChannels) return "0%";
                      const pct = Math.round(
                        (stats.channelMixData[0].value / totalChannels) * 100
                      );
                      return `${pct}%`;
                    })()}
                  />

                  <StatusCard
                    title={
                      language === "ar"
                        ? "نسبة اختراق اتفاقية مستوى الخدمة"
                        : "SLA Breach %"
                    }
                    count={`${stats.slaBreachPct}%`}
                  />

                  <StatusCard
                    title={language === "ar" ? "إجمالي التذاكر" : "Total Tickets"}
                    count={stats.total}
                  />
                </div>

                {/* ================= TREND + CHANNEL MIX ================= */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  {/* Ticket Creation vs Resolution Trend */}
                  <div className="bg-[#343434] rounded-xl p-5 space-y-4 xl:col-span-2">
                    <h2 className="text-xl font-semibold">
                      {language === "ar"
                        ? "اتجاه إنشاء وحل التذاكر"
                        : "Ticket Creation vs Resolution Trend"}
                    </h2>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.trendData}>
                          <CartesianGrid stroke="#444444" strokeDasharray="3 3" />
                          <XAxis dataKey="date" stroke="#d1d5db" />
                          <YAxis
                            stroke="#d1d5db"
                            label={{
                              value:
                                language === "ar" ? "عدد التذاكر" : "Number of Tickets",
                              angle: -90,
                              position: "insideLeft",
                              offset: 10,
                              style: { fill: "#d1d5db", fontSize: 14, fontWeight: 500 },
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

                  {/* Support Channel Distribution */}
                  <div className="bg-[#343434] rounded-xl p-5 space-y-4">
                    <h2 className="text-xl font-semibold">
                      {language === "ar"
                        ? "توزيع قنوات الدعم"
                        : "Support Channel Distribution"}
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

                {/* ================= MOST COMMON ISSUE CATEGORIES (Pareto) ================= */}
                <div className="bg-[#343434] rounded-xl p-5 space-y-4">
                  <h2 className="text-xl font-semibold">
                    {language === "ar"
                      ? "الفئات الأكثر شيوعًا"
                      : "Most Common Issue Categories"}
                  </h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={stats.painData}>
                        <CartesianGrid stroke="#444444" strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="#d1d5db" />
                        <YAxis
                          stroke="#d1d5db"
                          label={{
                            value: language === "ar" ? "العدد" : "Count",
                            angle: -90,
                            position: "insideLeft",
                            offset: 10,
                            style: { fill: "#d1d5db", fontSize: 14, fontWeight: 500 },
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

                {/* ========== Latest Tickets + Status Breakdown (existing admin blocks) ========== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
<div className="bg-[#343434] rounded-xl p-5 flex flex-col h-64">
  <h2 className="text-xl font-semibold mb-3 sticky top-0 bg-[#343434]">
    {t.latestTickets}
  </h2>

  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
    {tickets
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20)
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
            {ticket.category} • {t[`status_${ticket.status}`]}
          </div>
        </Link>
      ))}
  </div>
</div>

<div className="bg-[#343434] rounded-xl p-5 flex flex-col h-64">
  <h2 className="text-xl font-semibold mb-4">
    {language === "ar" ? "تفاصيل الحالة" : "Status Breakdown"}
  </h2>

  {/* EVENLY SPACED STATUS ROWS */}
  <div className="flex-1 flex flex-col justify-between">
    {STATUS_ORDER.map((statusKey) => (
      <div key={statusKey} className="flex items-center justify-between gap-3">
        <span className="opacity-70 text-sm min-w-[100px]">
          {t[`status_${statusKey}`] || statusKey}
        </span>

        <div className="flex-1 mx-3 h-2 bg-[#2C2C2C] rounded-full overflow-hidden">
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

        <span className="font-semibold text-sm min-w-[20px] text-right">
          {stats.statusCounts[statusKey] || 0}
        </span>
      </div>
    ))}
  </div>
</div>


                </div>
              </>
            )}

            {/* Tabs */}
            <div className="flex gap-4 border-b border-[#404040] mt-4">
              <button
                onClick={() => setActiveTab("tickets")}
                className={`px-4 py-2 border-b-2 transition ${
                  activeTab === "tickets"
                    ? "border-[#2AC0DA] text-[#2AC0DA]"
                    : "border-transparent opacity-60"
                }`}
              >
                {t.allTickets}
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-4 py-2 border-b-2 transition ${
                  activeTab === "users"
                    ? "border-[#2AC0DA] text-[#2AC0DA]"
                    : "border-transparent opacity-60"
                }`}
              >
                {t.allUsers}
              </button>
            </div>

            {loading ? (
              <div className="opacity-70">
                {language === "ar" ? "جاري التحميل..." : "Loading..."}
              </div>
            ) : activeTab === "tickets" ? (
              /* Tickets Table */
              <div className="bg-[#343434] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#2C2C2C]">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {t.ticketId}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {t.title}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {t.category}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {t.status_new}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {t.priority}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {t.createdBy}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {t.assignedTo}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {t.actions}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.length === 0 ? (
                        <tr>
                          <td
                            colSpan="8"
                            className="px-4 py-8 text-center opacity-60"
                          >
                            {language === "ar"
                              ? "لا توجد تذاكر"
                              : "No tickets found"}
                          </td>
                        </tr>
                      ) : (
                        tickets.map((ticket) => (
                          <tr
                            key={ticket._id}
                            className="border-t border-[#404040] hover:bg-[#2C2C2C]"
                          >
                            <td className="px-4 py-3">
                              <Link
                                to={`/tickets/${ticket._id}`}
                                className="font-mono text-sm text-[#2AC0DA] hover:underline"
                              >
                                {ticket.ticketId || ticket._id.slice(-8)}
                              </Link>
                            </td>
                            <td className="px-4 py-3">
                              <Link
                                to={`/tickets/${ticket._id}`}
                                className="hover:text-[#2AC0DA] transition"
                              >
                                {ticket.title}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {ticket.category}
                            </td>
                            <td className="px-4 py-3">
                              <StatusPill
                                status={ticket.status}
                                t={t}
                                language={language}
                              />
                            </td>
                            <td className="px-4 py-3 text-sm capitalize">
                              {ticket.priority}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {ticket.createdBy?.name ||
                                ticket.createdBy?.email ||
                                "-"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {ticket.assignedTo?.name ||
                                ticket.assignedTo?.email ||
                                "-"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedTicket(ticket._id);
                                    setModalType("status");
                                    setNewStatus("");
                                  }}
                                  className="text-xs px-3 py-1 bg-[#2AC0DA] rounded hover:opacity-80 transition"
                                >
                                  {t.changeStatus}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTicket(ticket._id);
                                    setModalType("assign");
                                    setAssignUserId("");
                                  }}
                                  className="text-xs px-3 py-1 bg-[#48A07D] rounded hover:opacity-80 transition"
                                >
                                  {t.assign}
                                </button>
                                <button
                                  onClick={() => handleDeleteTicket(ticket._id)}
                                  className="text-xs px-3 py-1 bg-red-600 rounded hover:opacity-80 transition"
                                >
                                  {t.delete}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Users Table */
              <div className="bg-[#343434] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#2C2C2C]">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {t.employeeId}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {language === "ar" ? "الاسم" : "Name"}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {t.email}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {t.department}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {t.position}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {t.actions}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-4 py-8 text-center opacity-60"
                          >
                            {language === "ar"
                              ? "لا يوجد مستخدمون"
                              : "No users found"}
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr
                            key={u._id}
                            className="border-t border-[#404040] hover:bg-[#2C2C2C]"
                          >
                            <td className="px-4 py-3 text-sm">
                              {u.employeeId || "-"}
                            </td>
                            <td className="px-4 py-3">{u.name}</td>
                            <td className="px-4 py-3 text-sm opacity-80">
                              {u.email}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {u.department || u.team || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {u.position || "-"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEditModal(u)}
                                  className="text-xs px-3 py-1 bg-[#2AC0DA] rounded hover:opacity-80 transition"
                                >
                                  {t.edit}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u._id)}
                                  className="text-xs px-3 py-1 bg-red-600 rounded hover:opacity-80 transition"
                                >
                                  {t.delete}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modals */}
            {selectedTicket && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#343434] rounded-xl p-6 max-w-md w-full mx-4">
                  <h2 className="text-xl font-bold mb-4">
                    {modalType === "status" ? t.changeStatus : t.assignTicket}
                  </h2>
                  {modalType === "status" ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2 opacity-80">
                          {t.status_new}
                        </label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="w-full bg-[#272727] rounded-lg px-4 py-2 outline-none"
                        >
                          <option value="">
                            {language === "ar"
                              ? "اختر الحالة"
                              : "Select Status"}
                          </option>
                          <option value="new">{t.status_new}</option>
                          <option value="in_progress">
                            {t.status_in_progress}
                          </option>
                          <option value="assigned">{t.status_assigned}</option>
                          <option value="resolved">{t.status_resolved}</option>
                          <option value="not_resolved">
                            {t.status_not_resolved}
                          </option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (newStatus)
                              handleStatusChange(selectedTicket, newStatus);
                          }}
                          className="flex-1 px-4 py-2 bg-[#2AC0DA] rounded hover:opacity-80 transition"
                        >
                          {t.update}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTicket(null);
                            setNewStatus("");
                            setModalType("status");
                          }}
                          className="flex-1 px-4 py-2 bg-[#404040] rounded hover:opacity-80 transition"
                        >
                          {t.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2 opacity-80">
                          {t.selectUser}
                        </label>
                        <select
                          value={assignUserId}
                          onChange={(e) => setAssignUserId(e.target.value)}
                          className="w-full bg-[#272727] rounded-lg px-4 py-2 outline-none"
                        >
                          <option value="">{t.selectUser}</option>
                          {admins.map((u) => (
                            <option key={u._id} value={u._id}>
                              {u.name} ({u.email})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (assignUserId)
                              handleAssignTicket(selectedTicket, assignUserId);
                          }}
                          className="flex-1 px-4 py-2 bg-[#48A07D] rounded hover:opacity-80 transition"
                        >
                          {t.assign}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTicket(null);
                            setAssignUserId("");
                            setModalType("status");
                          }}
                          className="flex-1 px-4 py-2 bg-[#404040] rounded hover:opacity-80 transition"
                        >
                          {t.cancel}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {editingUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#343434] rounded-xl p-6 max-w-md w-full mx-4">
                  <h2 className="text-xl font-bold mb-4">{t.editUser}</h2>
                  <form onSubmit={handleUserEditSubmit} className="space-y-3">
                    <input
                      className="w-full rounded px-3 py-2 bg-[#272727]"
                      placeholder="Employee ID"
                      value={editForm.employeeId}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          employeeId: e.target.value,
                        }))
                      }
                    />
                    <input
                      className="w-full rounded px-3 py-2 bg-[#272727]"
                      placeholder={t.name}
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                    <input
                      className="w-full rounded px-3 py-2 bg-[#272727]"
                      placeholder={t.email}
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, email: e.target.value }))
                      }
                    />
                    <input
                      className="w-full rounded px-3 py-2 bg-[#272727]"
                      placeholder={t.department}
                      value={editForm.department}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          department: e.target.value,
                        }))
                      }
                    />
                    <input
                      className="w-full rounded px-3 py-2 bg-[#272727]"
                      placeholder={t.position}
                      value={editForm.position}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          position: e.target.value,
                        }))
                      }
                    />
                    <input
                      className="w-full rounded px-3 py-2 bg-[#272727]"
                      placeholder={t.location}
                      value={editForm.location}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          location: e.target.value,
                        }))
                      }
                    />
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-[#2AC0DA] rounded hover:opacity-80 transition"
                      >
                        {t.save}
                      </button>
                      <button
                        type="button"
                        onClick={closeEditModal}
                        className="flex-1 px-4 py-2 bg-[#404040] rounded hover:opacity-80 transition"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}