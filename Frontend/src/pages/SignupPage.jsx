// src/components/SignupPage.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [showPassword, setShowPassword] = useState(false);  
  const { userSignup } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    userSignup({
      name,
      email,
      password,
      role: role.toLowerCase(),
      specialization,
    });
    // You can add more fields here as needed
    // Here you would typically send the data to your backend API for signup
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-600 to-cyan-400">
      <Link
        to="/"
        className="absolute top-4 left-4 text-white text-lg font-bold"
      >
        Home
      </Link>
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center">
          Create an Account
        </h2>

        <p className="text-center text-gray-600 mb-6">
          Sign up to get started with our ticketing system
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
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm mb-1">
              Password
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
                placeholder="********"
                className="w-full border rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring pr-10"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm mb-1">
              Role
            </label>
            <select
              id="role"
              value={role}
              required
              onChange={(e) => setRole(e.target.value)}
              className="w-full border rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring"
            >
              <option value="" disabled>
                Select a role
              </option>
              <option>User</option>
              <option>Engineer</option>
            </select>
          </div>
              
              {/* Conditional Textarea for Engineer */}
      {role === "Engineer" && (
        <div className="mt-4">
          <label htmlFor="specialization" className="block text-sm mb-1">
            Specialization
          </label>
          <textarea
            id="specialization"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            rows="1"
            className="w-full border rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring"
            placeholder="Enter your specialization"
            required
          />
        </div>
      )}
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
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
          >
            Create Account
          </button>

          <p className="text-sm text-center mt-4">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}