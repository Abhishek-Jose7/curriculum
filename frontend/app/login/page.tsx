"use client";

import { useState, FormEvent } from "react";
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787/api";
const USER_STORAGE_KEY = "curriculum_user";

const DEV_FILLS =
  process.env.NODE_ENV === "development"
    ? [
        { label: "Admin", email: "admin@frcrce.edu", password: "ChangeMe123!" },
        { label: "HOD", email: "hod@frcrce.edu", password: "ChangeMe123!" },
        { label: "Teacher", email: "faculty@frcrce.edu", password: "ChangeMe123!" },
      ]
    : [];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/token/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as any).detail ?? "Invalid credentials.");
        return;
      }
      // Hydrate user into localStorage for immediate AuthContext access
      const meRes = await fetch(`${API_URL}/auth/me/`, { credentials: "include" });
      if (meRes.ok) {
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(await meRes.json()));
      }
      window.location.href = "/";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded border border-border bg-card flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold text-foreground">Syllabus Press</h1>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Fr. CRCE — Staff Portal
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 rounded border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="you@frcrce.edu"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 rounded border border-border bg-background px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-500 font-semibold">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Signing in&hellip;</>
              : "Sign in"}
          </Button>
        </form>

        {/* Dev quick-fills — only in development builds */}
        {DEV_FILLS.length > 0 && (
          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest text-center">
              Dev quick-fill
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              {DEV_FILLS.map((fill) => (
                <button
                  key={fill.label}
                  type="button"
                  onClick={() => { setEmail(fill.email); setPassword(fill.password); }}
                  className="text-[11px] font-bold border border-border rounded px-2.5 py-1 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  {fill.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
