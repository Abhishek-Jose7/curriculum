"use client";

import {
  Archive,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Layers,
  LogOut,
  Moon,
  Sun,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/context";

type NavItem = { href: string; label: string; icon: React.ElementType };

function getNavForRole(role: AuthUser["role"]): NavItem[] {
  const base: NavItem[] = [{ href: "/", label: "Overview", icon: LayoutDashboard }];

  if (role === "FACULTY") return [
    ...base,
    { href: "/courses", label: "My Courses", icon: BookOpen },
  ];

  if (role === "HOD") return [
    ...base,
    { href: "/admin/schemes", label: "Schemes", icon: Layers },
    { href: "/courses", label: "All Courses", icon: BookOpen },
    { href: "/review", label: "Review Board", icon: CheckCircle2 },
    { href: "/publishing", label: "PDF Publisher", icon: FileText },
    { href: "/archive", label: "Curriculum Archive", icon: Archive },
    { href: "/admin", label: "Admin Controls", icon: Users },
  ];

  if (role === "ADMIN") return [
    ...base,
    { href: "/admin/schemes", label: "Schemes", icon: Layers },
    { href: "/courses", label: "All Courses", icon: BookOpen },
    { href: "/review", label: "Review Board", icon: CheckCircle2 },
    { href: "/publishing", label: "PDF Publisher", icon: FileText },
    { href: "/archive", label: "Curriculum Archive", icon: Archive },
    { href: "/admin", label: "Admin Controls", icon: Users },
  ];

  return base;
}

const ROLE_LABELS: Record<AuthUser["role"], string> = {
  ADMIN: "Administrator",
  HOD: "Head of Dept.",
  FACULTY: "Teacher",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const { user, logout, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    // Auto-collapse sidebar when viewing a specific subject (but not the /courses listing itself)
    if (pathname?.match(/^\/courses\/[^/]+$/)) {
      setIsCollapsed(true);
      localStorage.setItem("sidebar-collapsed", "true");
    }
  }, [pathname]);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const nav = user ? getNavForRole(user.role) : [];
  const displayName =
    user ? `${user.first_name} ${user.last_name}`.trim() || user.email : "";

  const pathSegments = (pathname || "").split("/").filter(Boolean);

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      {/* Sidebar */}
      {mounted && !authLoading && user && (
        <aside className={cn(
          "fixed inset-y-0 left-0 hidden border-r border-border bg-background md:flex flex-col z-20 transition-all duration-200",
          isCollapsed ? "w-16" : "w-60"
        )}>
          {/* Collapse Toggle Button */}
          <button
            onClick={toggleCollapse}
            className="absolute bottom-20 -right-3 h-6 w-6 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm cursor-pointer z-30 transition-transform hover:scale-105"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>

          {/* Brand Link to Home */}
          <Link
            href="/"
            className={cn(
              "flex h-20 items-center border-b border-border/60 shrink-0 hover:bg-secondary/20 transition-colors group cursor-pointer",
              isCollapsed ? "justify-center px-0" : "gap-2.5 px-6"
            )}
            title="Return to Home Dashboard"
          >
            <GraduationCap className="h-5 w-5 text-primary shrink-0 group-hover:scale-105 transition-transform" />
            {!isCollapsed && (
              <div className="animate-fade-in text-left">
                <div className="text-xs font-serif font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">Syllabus Press</div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Fr. CRCE Autonomous</div>
              </div>
            )}
          </Link>

          {/* Nav */}
          {mounted && user && (
            <nav className="p-4 space-y-1 mt-4 flex-1 overflow-y-auto">
              {!isCollapsed ? (
                <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2 text-left animate-fade-in">
                  Curriculum Portal
                </div>
              ) : (
                <div className="h-px bg-border/60 mx-2 my-2" />
              )}
              {nav.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={cn(
                      "relative flex items-center rounded-sm text-xs font-bold transition-all border border-transparent",
                      isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-3.5 py-2.5 text-left",
                      isActive
                        ? "text-primary bg-secondary/40"
                        : "text-foreground/55 hover:text-foreground hover:bg-secondary/20"
                    )}
                  >
                    {isActive && (
                      <span className={cn("absolute top-0 bottom-0 bg-primary", isCollapsed ? "left-0 w-1" : "left-0 w-0.5")} />
                    )}
                    <item.icon className="h-3.5 w-3.5 opacity-65 shrink-0" />
                    {!isCollapsed && <span className="animate-fade-in">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User footer */}
          {mounted && user && (
            <div className={cn("border-t border-border/60 shrink-0", isCollapsed ? "p-3 flex flex-col items-center gap-3" : "p-4 space-y-0.5 text-left")}>
              {!isCollapsed ? (
                <>
                  <div className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest px-1">
                    {ROLE_LABELS[user.role]}
                  </div>
                  <div className="text-xs font-semibold text-foreground truncate px-1">{displayName}</div>
                  <button
                    onClick={() => void logout()}
                    className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground hover:text-red-500 transition-colors mt-2 px-1 cursor-pointer"
                  >
                    <LogOut className="h-3 w-3" />
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => void logout()}
                  title="Sign out"
                  className="flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </aside>
      )}

      {/* Main */}
      <main className={mounted && !authLoading && user ? (isCollapsed ? "md:pl-16 transition-all duration-200" : "md:pl-60 transition-all duration-200") : ""}>
        <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border/80 bg-background/95 px-4 md:px-6">
          <nav className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground overflow-x-auto py-1">
            <Link href="/" className="hover:text-primary transition-colors font-serif font-bold text-foreground">
              Syllabus Portal
            </Link>
            {pathSegments.length > 0 && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                {pathSegments.map((seg, i) => {
                  const href = "/" + pathSegments.slice(0, i + 1).join("/");
                  const isLast = i === pathSegments.length - 1;
                  const label = seg.toUpperCase() === "COURSES" ? "Courses"
                    : seg.toUpperCase() === "REVIEW" ? "Review Board"
                    : seg.toUpperCase() === "PUBLISHING" ? "PDF Publisher"
                    : seg.toUpperCase() === "ARCHIVE" ? "Curriculum Archive"
                    : seg.toUpperCase() === "ADMIN" ? "Admin Controls"
                    : seg;
                  return (
                    <span key={href} className="flex items-center gap-1.5 shrink-0">
                      {isLast ? (
                        <span className="font-bold text-foreground truncate max-w-[180px]">{label}</span>
                      ) : (
                        <Link href={href} className="hover:text-primary transition-colors">
                          {label}
                        </Link>
                      )}
                      {!isLast && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />}
                    </span>
                  );
                })}
              </>
            )}
          </nav>
          {mounted && user && <NotificationsBell />}
          <Button
            variant="secondary"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 p-0 rounded shrink-0 ml-2"
            aria-label="Toggle theme"
          >
            <Sun className="hidden h-3.5 w-3.5 dark:block text-amber-500" />
            <Moon className="h-3.5 w-3.5 dark:hidden text-primary" />
          </Button>
        </header>
        <div className="p-3 md:p-4 w-full max-w-full">{children}</div>
      </main>
    </div>
  );
}

