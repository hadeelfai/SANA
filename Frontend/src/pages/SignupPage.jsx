// SignupPage.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { translations } from "../translations.js";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const { setUser } = useAuth();
  const t = useMemo(() => translations[language], [language]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const isAdmin = (role || "").toLowerCase() === "admin" || role === t.adminRole;
      const endpoint = isAdmin
        ? "/api/v1/auth/admin/signup"
        : "/api/v1/auth/user/signup";
      const body = {
        name,
        email,
        password,
        role: isAdmin ? "admin" : "user",
      };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Signup failed");

      // Update auth context with user data
      if (data?.user) {
        setUser(data.user);
      }

      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#272727] text-white flex items-center justify-center px-4" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="w-full max-w-md">
        <div className="p-[2px] bg-gradient-to-r from-[#2AC0DA] via-[#CEE9E8] to-[#48A07D] rounded-2xl">
          <div className="bg-[#272727] rounded-2xl p-8">
            <div className={`flex ${language === "ar" ? "justify-between" : "justify-between"} items-center mb-4`}>
              <button onClick={toggleLanguage} className="text-sm opacity-80 hover:opacity-100">
                {language === "ar" ? "English" : "العربية"}
              </button>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-center">
              {t.signUpTitle}
            </h2>
            <p className="text-center opacity-80 mb-6">
              {language === "ar" ? "سجّل الآن للبدء باستخدام SANA" : "Sign up to get started with SANA"}
            </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-3  md:space-y-4"
        >
          {/* Full Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm mb-1"
            >
              {language === "ar" ? "الاسم الكامل" : "Full Name"}
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#343434] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#3A3A3A] text-white"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm mb-1"
            >
              {t.email}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#343434] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#3A3A3A] text-white"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm mb-1">
              {t.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                required
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full bg-[#343434] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#3A3A3A] pr-10 text-white"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm opacity-80"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm mb-1">
              {t.role}
            </label>
            <select
              id="role"
              value={role}
              required
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-[#343434] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#3A3A3A] text-white"
            >
              <option value="" disabled>
                {language === "ar" ? "اختر الدور" : "Select a role"}
              </option>
              <option value="user">{t.userRole}</option>
              <option value="admin">{t.adminRole}</option>
            </select>
          </div>
          {/* Company & Department */}
          {/* <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-sm mb-1">Company</label>
              <input
                type="text"
                placeholder="Company Name"
                className="w-full border rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm mb-1">Department</label>
              <input
                type="text"
                placeholder="IT, HR, etc."
                className="w-full border rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring"
              />
            </div>
          </div> */}

          {/* Submit Button */}
          {error && <div className="text-red-400 text-sm">{error}</div>}
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
            {submitting ? (language === "ar" ? "جارٍ الإنشاء..." : "Creating...") : t.signUpBtn}
          </button>

          <p className="text-sm text-center mt-4">
            {t.haveAccount}{" "}
            <Link
              to="/signin"
              className="underline"
            >
              {t.goSignIn}
            </Link>
          </p>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}