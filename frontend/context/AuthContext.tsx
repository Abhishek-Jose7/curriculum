"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787/api";
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
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_URL}/auth/me/`, { credentials: "include", headers });
      if (!res.ok) {
        setUser(null);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(USER_STORAGE_KEY);
          window.localStorage.removeItem("accessToken");
        }
        return;
      }
      const data: AuthUser = await res.json();
      setUser(data);
      if (typeof window !== "undefined")
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
    } catch {
      setUser(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(USER_STORAGE_KEY);
        window.localStorage.removeItem("accessToken");
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
      window.localStorage.removeItem(USER_STORAGE_KEY);
      window.localStorage.removeItem("accessToken");
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
