import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#272727] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="p-[2px] bg-gradient-to-r from-[#2AC0DA] via-[#CEE9E8] to-[#48A07D] rounded-2xl">
          <div className="bg-[#272727] rounded-2xl p-8">
            <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 opacity-80">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#343434] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#3A3A3A]"
                />
              </div>
              <div>
                <label className="block mb-2 opacity-80">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#343434] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#3A3A3A]"
                />
              </div>
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
                {submitting ? "Signing in..." : "Sign In"}
              </button>
            </form>
            <p className="text-sm opacity-80 mt-4 text-center">
              Don’t have an account?{" "}
              <Link to="/signup" className="underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


