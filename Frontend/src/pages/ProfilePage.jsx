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
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#2AC0DA] via-[#CEE9E8] to-[#48A07D]" />
                <div>
                  <div className="text-xl font-semibold">{user?.name || (language === "ar" ? "مستخدم" : "User")}</div>
                  <div className="opacity-70 text-sm">{user?.email || "-"}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="bg-[#2C2C2C] rounded-lg p-4">
                  <div className="opacity-60 text-sm">{language === "ar" ? "الدور" : "Role"}</div>
                  <div className="mt-1 font-semibold capitalize">{user?.role || "-"}</div>
                </div>
                <div className="bg-[#2C2C2C] rounded-lg p-4">
                  <div className="opacity-60 text-sm">{language === "ar" ? "آخر تسجيل دخول" : "Last Login"}</div>
                  <div className="mt-1 font-semibold">{language === "ar" ? "—" : "—"}</div>
                </div>
              </div>
            </div>

            <div className="bg-[#343434] rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-semibold">{language === "ar" ? "إعدادات الحساب" : "Account Settings"}</h2>
              <div className="grid grid-cols-1 gap-3">
                <button
                  className="w-full rounded-lg px-6 py-3 transition bg-[#272727]"
                  style={{
                    background:
                      "linear-gradient(#272727, #272727) padding-box, linear-gradient(90deg, #2AC0DA, #CEE9E8, #48A07D) border-box",
                    border: "2px solid transparent",
                  }}
                >
                  {language === "ar" ? "تغيير كلمة المرور" : "Change Password"}
                </button>
                <button
                  className="w-full rounded-lg px-6 py-3 transition bg-[#272727]"
                  style={{
                    background:
                      "linear-gradient(#272727, #272727) padding-box, linear-gradient(90deg, #2AC0DA, #CEE9E8, #48A07D) border-box",
                    border: "2px solid transparent",
                  }}
                >
                  {language === "ar" ? "تحديث المعلومات" : "Update Info"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


