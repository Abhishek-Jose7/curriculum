"use client";

import { BookOpen, CheckCircle2, FileText, GraduationCap, LayoutDashboard, Moon, Sun, Users, ShieldAlert, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/courses", label: "Manuscripts", icon: BookOpen },
  { href: "/review", label: "Review Board", icon: CheckCircle2 },
  { href: "/publishing", label: "Catalogue Press", icon: FileText },
  { href: "/admin", label: "Office Controls", icon: Users }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  // Integrated workspace switcher states
  const [activeRole, setActiveRole] = useState("ADMIN");
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    const role = window.localStorage.getItem("userRole") ?? "ADMIN";
    setActiveRole(role);
  }, []);

  const switchRole = async (role: "ADMIN" | "FACULTY" | "REVIEWER") => {
    setSwitching(true);
    setActiveRole(role);
    window.localStorage.setItem("userRole", role);
    
    const credentials: Record<string, string> = {
      ADMIN: "admin",
      FACULTY: "faculty",
      REVIEWER: "reviewer",
    };
    
    try {
      const authData = await apiFetch<any>("/auth/token/", {
        method: "POST",
        body: JSON.stringify({
          username: credentials[role],
          password: "ChangeMe123!",
        }),
      });
      window.localStorage.setItem("accessToken", authData.access);
      window.localStorage.setItem("refreshToken", authData.refresh);
      setSwitching(false);
      window.location.reload(); // Reload current view under new credentials
    } catch {
      setSwitching(false);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      {/* Editorial Minimalist Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-background md:block z-20">
        <div className="flex h-20 items-center gap-2.5 px-6 border-b border-border/60">
          <GraduationCap className="h-5 w-5 text-primary shrink-0" />
          <div>
            <div className="text-xs font-serif font-bold uppercase tracking-widest text-foreground">Syllabus press</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Fr. CRCE Autonomous</div>
          </div>
        </div>
        
        <nav className="p-4 space-y-1 mt-4">
          <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2">Manuscript Ledger</div>
          {nav.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-sm px-3.5 py-2.5 text-xs font-bold transition-all border border-transparent",
                  isActive 
                    ? "text-primary bg-secondary/40 font-serif-editorial text-[13px]" 
                    : "text-foreground/55 hover:text-foreground hover:bg-secondary/20"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                )}
                <item.icon className="h-3.5 w-3.5 opacity-65 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Column Framework */}
      <main className="md:pl-60">
        {/* High-End Title Bar Header */}
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-border/80 bg-background/95 px-6 md:px-8">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">college syllabus publishing engine</div>
            <h1 className="text-sm font-serif font-bold text-foreground">Curriculum Document Office</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Custom Workspace switcher selector */}
            <div className="flex items-center gap-1.5 p-1 rounded border border-border bg-card">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1.5 hidden sm:inline-block">Authority Access:</span>
              <select
                disabled={switching}
                value={activeRole}
                onChange={(e) => void switchRole(e.target.value as any)}
                className="h-7 rounded border border-transparent bg-transparent text-[11px] font-bold text-primary uppercase px-1.5 focus:outline-none focus:border-border cursor-pointer disabled:opacity-50"
              >
                <option value="ADMIN">HOD Office (Admin)</option>
                <option value="FACULTY">Faculty Coordinator</option>
                <option value="REVIEWER">External Reviewer</option>
              </select>
            </div>

            {/* Simple Light/Dark Theme Switcher */}
            <Button 
              variant="secondary" 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8 p-0 rounded"
              aria-label="Toggle theme"
            >
              <Sun className="hidden h-3.5 w-3.5 dark:block text-amber-500" />
              <Moon className="h-3.5 w-3.5 dark:hidden text-primary" />
            </Button>
          </div>
        </header>
        
        {/* Content Wrapper */}
        <div className="p-6 md:p-8 max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
