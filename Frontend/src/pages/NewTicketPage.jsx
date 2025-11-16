import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { translations } from "../translations.js";

export default function NewTicketPage() {
  const { language } = useLanguage();
  const t = useMemo(() => translations[language], [language]);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Hardware");
  const [subcategory, setSubcategory] = useState("");
  const [priority, setPriority] = useState("low");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const isRTL = language === "ar";

  async function handleCreateTicket(e) {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/dashboard/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          category,
          subcategory,
          priority,
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to create ticket");
      }
      // Redirect to tickets page after successful creation
      navigate("/tickets");
    } catch (err) {
      setMessage(
        language === "ar"
          ? "حدث خطأ أثناء إنشاء التذكرة"
          : "An error occurred while creating the ticket"
      );
    } finally {
      setSubmitting(false);
    }
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
          <div className="w-full max-w-3xl py-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-8">
              {t.newTicket}
            </h1>

            <form
          onSubmit={handleCreateTicket}
              className="space-y-6"
            >
          {/* Title */}
          <div>
            <label className="block mb-2 opacity-80">{t.title}</label>
            <input
                className="w-full bg-[#343434] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#3A3A3A]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 opacity-80">{t.category}</label>
              <select
                  className="w-full bg-[#343434] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#3A3A3A]"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="Hardware">{t.categoryHardware}</option>
                <option value="Software">{t.categorySoftware}</option>
                <option value="Network">{t.categoryNetwork}</option>
                <option value="Access">{t.categoryAccess}</option>
                <option value="Request">{t.categoryRequest}</option>
                <option value="Incident">{t.categoryIncident}</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 opacity-80">{t.priority}</label>
              <select
                  className={`w-full bg-[#343434] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#3A3A3A] ${
                    priority === "low"
                      ? "text-green-400"
                      : priority === "medium"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                required
              >
                <option className="text-green-400" value="low">{t.lowPriority}</option>
                <option className="text-yellow-400" value="medium">{t.mediumPriority}</option>
                <option className="text-red-400" value="high">{t.highPriority}</option>
              </select>
            </div>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block mb-2 opacity-80">{t.subcategory}</label>
            <input
              type="text"
              className="w-full bg-[#343434] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#3A3A3A]"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder={language === "ar" ? "مثال: مشكلة الطابعة، الوصول إلى VPN، خطأ في البريد الإلكتروني" : "e.g., Printer issue, VPN access, Email error"}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-2 opacity-80">{t.description}</label>
            <textarea
                className="w-full bg-[#343434] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#3A3A3A] min-h-[140px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* SANA suggestions placeholder and button */}
          <div className="space-y-3">
            <h2 className="font-semibold">{`SANA ${t.suggestions}`}</h2>
            <button
              type="button"
              className="w-72 rounded-lg px-6 py-3 transition disabled:opacity-60 bg-[#272727]"
              style={{
                  background:
                    "linear-gradient(#272727, #272727) padding-box, linear-gradient(90deg, #2AC0DA, #CEE9E8, #48A07D) border-box",
                  border: "2px solid transparent",
                }}  
              onClick={() => {
                // Placeholder for AI suggestion hook
                setDescription((prev) =>
                  prev && !prev.endsWith("\n")
                    ? `${prev}\n`
                    : prev
                );
              }}
            >
              {t.suggestedSolution} SANA
            </button>
          </div>

          {/* Actions */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
                className="w-full rounded-lg px-6 py-3 transition disabled:opacity-60 bg-[#272727]"
            style={{
                background:
                  "linear-gradient(#272727, #272727) padding-box, linear-gradient(90deg, #2AC0DA, #CEE9E8, #48A07D) border-box",
                border: "2px solid transparent",
              }}
            >
              {submitting ? (language === "ar" ? "جارٍ الإنشاء..." : "Creating...") : t.completeTicket}
            </button>
          </div>
            </form>

            {message && (
              <div className="mt-6 text-sm opacity-80">{message}</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


