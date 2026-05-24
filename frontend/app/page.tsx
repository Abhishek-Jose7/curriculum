"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api";
import {
  GraduationCap,
  BookOpen,
  CheckCircle,
  FileText,
  Clock,
  ArrowRight,
  UserCheck,
  Activity,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState({
    draft: 0,
    review: 0,
    approved: 0,
    published: 0,
  });
  const [loading, setLoading] = useState(true);

  // Authentication role helper (quick select for testing)
  const [activeRole, setActiveRole] = useState("ADMIN");

  useEffect(() => {
    // Read current role if any
    const role = window.localStorage.getItem("userRole") ?? "ADMIN";
    setActiveRole(role);

    async function loadDashboardData() {
      try {
        const res = await apiFetch<any>("/courses/");
        const list = Array.isArray(res) ? res : res.results ?? [];
        setCourses(list);

        // Count stats
        const counts = { draft: 0, review: 0, approved: 0, published: 0 };
        list.forEach((c: any) => {
          if (c.status === "DRAFT") counts.draft++;
          if (c.status === "SUBMITTED" || c.status === "UNDER_REVIEW") counts.review++;
          if (c.status === "APPROVED") counts.approved++;
          if (c.status === "PUBLISHED" || c.status === "LOCKED") counts.published++;
        });
        setStats(counts);
      } catch (err) {
        console.error("Dashboard fail to load courses", err);
      } finally {
        setLoading(false);
      }
    }
    void loadDashboardData();
  }, []);

  const switchRole = async (role: "ADMIN" | "FACULTY" | "REVIEWER") => {
    setActiveRole(role);
    window.localStorage.setItem("userRole", role);
    
    // Auto-authenticate as that seeded user behind the scenes
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
      alert(`Switched credentials to standard seed account: ${role.toLowerCase()}`);
    } catch {
      alert(`Switched mock role setting to ${role}. Make sure database is seeded!`);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <section className="rounded-xl border border-border bg-gradient-to-r from-primary/10 via-zinc-900/50 to-zinc-950 p-6 md:p-8">
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Curriculum Syllabus Management
            </h1>
            <p className="text-foreground/75 leading-relaxed text-sm md:text-base">
              A dynamic portal for the college Engineering Department to author, validate, review, and assemble official curriculum books directly from normalized database structures.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/courses">
                  Browse Active Courses <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/admin">
                  Go to Setup Panel
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Mock Role Switcher for Seamless Testing in Department */}
        <section className="rounded-lg border border-border bg-zinc-900/20 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <UserCheck className="h-4 w-4 text-primary" />
            Seamless Role Access (Fast Login Switcher)
          </div>
          <p className="text-xs text-foreground/60">
            Click to instantly authenticate as one of the seeded system roles. No complex login required.
          </p>
          <div className="flex gap-2">
            {(["ADMIN", "FACULTY", "REVIEWER"] as const).map((role) => (
              <button
                key={role}
                onClick={() => void switchRole(role)}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-semibold border transition-all",
                  activeRole === role
                    ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                    : "border-border hover:bg-muted text-foreground/70"
                )}
              >
                {role === "ADMIN" ? "Admin (HOD)" : role === "FACULTY" ? "Faculty Teacher" : "External Reviewer"}
              </button>
            ))}
          </div>
        </section>

        {/* Statistics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border p-4 bg-zinc-950/40">
            <div className="flex items-center justify-between text-foreground/60 text-xs">
              <span>Syllabus Drafts</span>
              <BookOpen className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{stats.draft}</div>
          </div>
          <div className="rounded-lg border border-border p-4 bg-zinc-950/40">
            <div className="flex items-center justify-between text-foreground/60 text-xs">
              <span>Under Review</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{stats.review}</div>
          </div>
          <div className="rounded-lg border border-border p-4 bg-zinc-950/40">
            <div className="flex items-center justify-between text-foreground/60 text-xs">
              <span>Approved Syllabuses</span>
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{stats.approved}</div>
          </div>
          <div className="rounded-lg border border-border p-4 bg-zinc-950/40">
            <div className="flex items-center justify-between text-foreground/60 text-xs">
              <span>Published Curriculum</span>
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{stats.published}</div>
          </div>
        </div>

        {/* Main Content Dashboard */}
        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Syllabus Work-in-Progress Shells
            </h2>

            {loading ? (
              <div className="py-12 text-center text-sm text-foreground/50">
                Loading academic syllabus records...
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-foreground/60">
                No syllabus course shells configured. Go to the Setup Panel to create them!
              </div>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border overflow-hidden bg-zinc-950/20">
                {courses.slice(0, 5).map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors">
                    <div>
                      <div className="font-semibold text-sm text-white">
                        {course.code} - {course.title}
                      </div>
                      <div className="text-xs text-foreground/55 mt-0.5">
                        Type: {course.course_type} · Credits: {course.credits}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={course.status} />
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/courses/${course.id}`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Quick Steps
            </h2>
            <div className="rounded-lg border border-border p-4 space-y-4 bg-zinc-950/20">
              <div className="space-y-2">
                <div className="text-xs font-bold text-primary uppercase">1. Setup Tier</div>
                <p className="text-xs text-foreground/70">
                  Configure dynamic departments, semesters, and course shells from the setup portal.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold text-primary uppercase">2. Assign Teacher</div>
                <p className="text-xs text-foreground/70">
                  Send secure invite links to let teachers accept subject editing rights.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold text-primary uppercase">3. Review & Approve</div>
                <p className="text-xs text-foreground/70">
                  External reviewer logs comment on specific syllabus sections to clear validation.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold text-primary uppercase">4. Assembly PDF</div>
                <p className="text-xs text-foreground/70">
                  Assemble all approved subject courses into a unified curriculum book PDF with exact styling.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
