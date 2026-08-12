"use client";

import {
  Archive,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
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
    { href: "/courses", label: "All Courses", icon: BookOpen },
    { href: "/review", label: "Review Board", icon: CheckCircle2 },
    { href: "/publishing", label: "Catalogue Press", icon: FileText },
    { href: "/archive", label: "Curriculum Archive", icon: Archive },
    { href: "/admin", label: "Office Controls", icon: Users },
  ];

  if (role === "ADMIN") return [
    ...base,
    { href: "/courses", label: "All Courses", icon: BookOpen },
    { href: "/review", label: "Review Board", icon: CheckCircle2 },
    { href: "/publishing", label: "Catalogue Press", icon: FileText },
    { href: "/archive", label: "Curriculum Archive", icon: Archive },
    { href: "/admin", label: "Office Controls", icon: Users },
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
  const { user, logout } = useAuth();

  const nav = user ? getNavForRole(user.role) : [];
  const displayName =
    user ? `${user.first_name} ${user.last_name}`.trim() || user.email : "";

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-background md:flex flex-col z-20">
        {/* Brand */}
        <div className="flex h-20 items-center gap-2.5 px-6 border-b border-border/60 shrink-0">
          <GraduationCap className="h-5 w-5 text-primary shrink-0" />
          <div>
            <div className="text-xs font-serif font-bold uppercase tracking-widest text-foreground">Syllabus press</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Fr. CRCE Autonomous</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-4 space-y-1 mt-4 flex-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2">
            Manuscript Ledger
          </div>
          {nav.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-sm px-3.5 py-2.5 text-xs font-bold transition-all border border-transparent",
                  isActive
                    ? "text-primary bg-secondary/40"
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

        {/* User footer */}
        {user && (
          <div className="border-t border-border/60 p-4 shrink-0 space-y-0.5">
            <div className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest px-1">
              {ROLE_LABELS[user.role]}
            </div>
            <div className="text-xs font-semibold text-foreground truncate px-1">{displayName}</div>
            <button
              onClick={() => void logout()}
              className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground hover:text-red-500 transition-colors mt-2 px-1"
            >
              <LogOut className="h-3 w-3" />
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="md:pl-60">
        <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border/80 bg-background/95 px-4 md:px-6">
          <h1 className="text-xs font-serif font-bold text-foreground">Curriculum Document Office</h1>
          <Button
            variant="secondary"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 p-0 rounded"
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
