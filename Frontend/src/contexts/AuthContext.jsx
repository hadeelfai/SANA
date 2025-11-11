import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    async function fetchUser() {
      setLoading(true);
      try {
        // Try user authCheck first
        let res = await fetch("/api/v1/auth/user/authCheck", {
          credentials: "include",
        });
        if (!res.ok) {
          // Try admin authCheck
          res = await fetch("/api/v1/auth/admin/authCheck", {
            credentials: "include",
          });
        }
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setUser(data?.user || null);
        } else {
          if (isMounted) setUser(null);
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchUser();
    return () => {
      isMounted = false;
    };
  }, []);

  async function logout() {
    try {
      // Try user logout
      let res = await fetch("/api/v1/auth/user/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        // Fallback admin logout
        await fetch("/api/v1/auth/admin/logout", {
          method: "POST",
          credentials: "include",
        });
      }
    } finally {
      setUser(null);
      navigate("/signin");
    }
  }

  const value = useMemo(() => ({ user, loading, setUser, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}


