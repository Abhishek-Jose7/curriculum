"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context";
import { StatusBadge } from "@/components/ui/badge";
import {
  Activity, ArrowRight, ChevronRight, Clock, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLE_HEADINGS: Record<string, string> = {
  ADMIN: "System Overview",
  HOD: "Department Syllabi",
  FACULTY: "My Assigned Courses",
};

const WORKFLOW_STEPS = [
  { n: "01", title: "Formulate Shell", desc: "Admin sets up semesters, departments, and subject shells." },
  { n: "02", title: "Teacher Drafting", desc: "Teacher drafts modular syllabus content for assigned courses." },
  { n: "03", title: "External Review", desc: "Invited reviewers examine drafts via shared link and add comments." },
  { n: "04", title: "HOD Approval", desc: "HOD approves syllabi and compiles final curriculum booklet PDFs." },
];

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState({ draft: 0, review: 0, approved: 0, published: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    async function load() {
      try {
        const res = await apiFetch<any>("/courses/");
        let list: any[] = Array.isArray(res) ? res : (res.results ?? []);
        // FACULTY sees only their own assigned courses
        if (user!.role === "FACULTY") {
          list = list.filter((c: any) => c.faculty_user_id === user!.id);
        }
        setCourses(list);
        const counts = { draft: 0, review: 0, approved: 0, published: 0 };
        list.forEach((c: any) => {
          if (c.status === "DRAFT") counts.draft++;
          if (c.status === "SUBMITTED" || c.status === "UNDER_REVIEW") counts.review++;
          if (c.status === "APPROVED") counts.approved++;
          if (c.status === "PUBLISHED" || c.status === "LOCKED") counts.published++;
        });
        setStats(counts);
      } catch (err) {
        console.error("Dashboard load failed", err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [authLoading, user]);

  return (
    <AppShell>
      <div className="space-y-12 animate-fade-in text-left">
        {/* Header */}
        <section className="space-y-4 pt-4">
          <div className="text-[10px] font-bold text-primary uppercase tracking-widest font-mono">
            academic catalog registry
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight leading-tight">
            {ROLE_HEADINGS[user?.role ?? "ADMIN"]} <br />
            <span className="italic text-muted-foreground font-normal">&amp; Official Course Syllabus Books</span>
          </h1>
          <div className="w-20 h-0.5 bg-primary/40 my-3" />
          <div className="pt-2 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/courses">
                Browse Active Register <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
            {(user?.role === "ADMIN" || user?.role === "HOD") && (
              <Button variant="secondary" asChild className="border-border">
                <Link href="/admin">Administrative Office</Link>
              </Button>
            )}
          </div>
        </section>

        {/* Stats ledger */}
        <section className="border-t border-b border-border bg-card/10 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
            {[
              { label: "Draft Manuscripts", val: stats.draft },
              { label: "Under Peer Review", val: stats.review, pulse: stats.review > 0 },
              { label: "Approved Syllabuses", val: stats.approved },
              { label: "Published Books", val: stats.published },
            ].map(({ label, val, pulse }) => (
              <div key={label} className="p-5 space-y-1 text-center md:text-left">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">{label}</span>
                <div className="text-2xl font-serif font-bold text-foreground flex items-center justify-center md:justify-start gap-1.5">
                  {val}
                  {pulse && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Content + workflow */}
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <section className="space-y-6">
            <div className="pb-3 border-b border-border/80 flex items-center justify-between">
              <h2 className="text-base font-serif font-bold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Active Syllabus Catalogue
              </h2>
            </div>

            {loading || authLoading ? (
              <div className="py-12 text-center text-xs font-bold text-muted-foreground/50 flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 animate-spin text-primary" /> Querying catalog registry…
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded border border-dashed border-border p-12 text-center text-xs font-semibold text-muted-foreground bg-card/30">
                {user?.role === "FACULTY"
                  ? "No courses assigned to you yet. Contact your HOD."
                  : "No syllabus records found. Use Administrative Controls to set them up."}
              </div>
            ) : (
              <div className="space-y-4">
                {courses.slice(0, 8).map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40 hover:border-primary/20 transition-all duration-150"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-foreground flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground/75 bg-muted px-1.5 py-0.5 rounded border border-border/40 shrink-0">
                          {course.code}
                        </span>
                        <Link
                          href={`/courses/${course.id}`}
                          className="truncate max-w-[280px] sm:max-w-[340px] hover:text-primary transition-colors"
                        >
                          {course.title}
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <StatusBadge status={course.status} />
                      <Button variant="ghost" size="sm" asChild className="h-8 text-[10px] font-bold tracking-tight uppercase border-border/40 hover:bg-secondary/40">
                        <Link href={`/courses/${course.id}`}>
                          Open <ChevronRight className="ml-0.5 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                {courses.length > 8 && (
                  <div className="pt-2">
                    <Button variant="ghost" asChild className="text-xs">
                      <Link href="/courses">
                        View all {courses.length} courses <ArrowRight className="ml-1.5 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Workflow sidebar */}
          <aside className="space-y-6">
            <div className="pb-3 border-b border-border/80">
              <h2 className="text-base font-serif font-bold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Workflow Pipeline
              </h2>
            </div>
            <div className="rounded border border-border p-5 bg-card/30 space-y-5">
              {WORKFLOW_STEPS.map(({ n, title, desc }) => (
                <div key={n} className="flex items-start gap-3">
                  <div className="font-mono text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/25 h-5 w-5 rounded-sm flex items-center justify-center shrink-0 mt-0.5">
                    {n}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="text-[10px] font-bold text-foreground uppercase tracking-wider">{title}</div>
                    <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
