"use client";

import { BookOpen, CheckCircle2, FileText, GraduationCap, LayoutDashboard, Moon, Sun, Users } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/review", label: "Review", icon: CheckCircle2 },
  { href: "/publishing", label: "Publishing", icon: FileText },
  { href: "/admin", label: "Admin", icon: Users }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-muted/40 md:block">
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <GraduationCap className="h-6 w-6 text-primary" />
          <div>
            <div className="text-sm font-semibold">Curriculum Office</div>
            <div className="text-xs text-foreground/60">Engineering Department</div>
          </div>
        </div>
        <nav className="p-3">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-background", item.href === "/" && "bg-background")}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="md:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/95 px-5">
          <div>
            <div className="text-sm text-foreground/60">Structured Publishing Workflow</div>
            <h1 className="text-lg font-semibold">Curriculum Management</h1>
          </div>
          <Button variant="secondary" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="hidden h-4 w-4 dark:block" />
            <Moon className="h-4 w-4 dark:hidden" />
          </Button>
        </header>
        <div className="p-5">{children}</div>
      </main>
    </div>
  );
}
