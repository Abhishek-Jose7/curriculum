"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://curriculum-backend.collacou.workers.dev/api";
const USER_STORAGE_KEY = "curriculum_user";

export type AuthUser = {
  id: string;
  email: string;
  role: "ADMIN" | "HOD" | "FACULTY";
  department_id?: string | null;
  first_name: string;
  last_name: string;
  is_superuser?: number;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: async () => {},
  refetch: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    // Public pages (e.g. the PIN-gated external reviewer portal) must not be
    // redirected to /login when no session exists.
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/public/")) {
      setLoading(false);
      return;
    }
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
      
      // We always attempt to fetch me if we reach here, because even without a token,
      // the user might have an HttpOnly curriculum_access cookie that validates them.
      
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_URL}/auth/me/`, { credentials: "include", headers });
      const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
      const secureFlag = isSecure ? "; Secure" : "";

      if (!res.ok) {
        // Session expired or invalid - clear and redirect to login
        setUser(null);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(USER_STORAGE_KEY);
          window.localStorage.removeItem("accessToken");
          // Clear HttpOnly cookie by clearing the document.cookie record
          document.cookie = `curriculum_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`;
          // Redirect to login only if not already there
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        return;
      }
      const data: AuthUser = await res.json();
      setUser(data);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
        // Backend already sets curriculum_access cookie; do not override it
      }
    } catch {
      setUser(null);
      if (typeof window !== "undefined") {
        const isSecure = window.location.protocol === "https:";
        window.localStorage.removeItem(USER_STORAGE_KEY);
        window.localStorage.removeItem("accessToken");
        document.cookie = `curriculum_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isSecure ? "; Secure" : ""}`;
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(USER_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored) as AuthUser);
        }
      } catch { /* ignore */ }
    }
    void fetchMe();
  }, [fetchMe]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/auth/logout/`, { method: "POST", credentials: "include" });
    } catch { /* ignore */ }
    setUser(null);
    if (typeof window !== "undefined") {
      const isSecure = window.location.protocol === "https:";
      window.localStorage.removeItem(USER_STORAGE_KEY);
      window.localStorage.removeItem("accessToken");
      document.cookie = `curriculum_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isSecure ? "; Secure" : ""}`;
      window.location.href = "/login";
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
