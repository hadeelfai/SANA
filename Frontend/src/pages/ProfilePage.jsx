import React, { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { translations } from "../translations.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function ProfilePage() {
  const { language } = useLanguage();
  const t = useMemo(() => translations[language], [language]);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const isRTL = language === "ar";

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
          <div className="w-full max-w-3xl py-10 space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold">
              {t.profile}
            </h1>

            <div className="bg-[#343434] rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                {/* Profile icon with user's initial */}
                <div className="w-14 h-14 rounded-full bg-[#2AC0DA] flex items-center justify-center text-2xl font-semibold text-white leading-none">
                  <span className="text-center">{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
                </div>
                <div>
                  <div className="text-xl font-semibold">{user?.name || (language === "ar" ? "مستخدم" : "User")}</div>
                  <div className="opacity-70 text-sm">{user?.email || "-"}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="bg-[#2C2C2C] rounded-lg p-4">
                  <div className="opacity-60 text-sm">{t.role}</div>
                  <div className="mt-1 font-semibold capitalize">{user?.role || "-"}</div>
                </div>
                <div className="bg-[#2C2C2C] rounded-lg p-4">
                  <div className="opacity-60 text-sm">{t.employeeId}</div>
                  <div className="mt-1 font-semibold">{user?.employeeId || "-"}</div>
                </div>
                <div className="bg-[#2C2C2C] rounded-lg p-4">
                  <div className="opacity-60 text-sm">{t.department}</div>
                  <div className="mt-1 font-semibold">{user?.department || user?.team || "-"}</div>
                </div>
                <div className="bg-[#2C2C2C] rounded-lg p-4">
                  <div className="opacity-60 text-sm">{t.position}</div>
                  <div className="mt-1 font-semibold">{user?.position || "-"}</div>
                </div>
                <div className="bg-[#2C2C2C] rounded-lg p-4 sm:col-span-2">
                  <div className="opacity-60 text-sm">{t.location}</div>
                  <div className="mt-1 font-semibold">{user?.location || user?.officeBranch || user?.floor || user?.building || "-"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


