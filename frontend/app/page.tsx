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
  Activity,
  Layers,
  BookMarked,
  ChevronRight,
  TrendingUp,
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

  useEffect(() => {
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

  return (
    <AppShell>
      <div className="space-y-12 animate-fade-in text-left">
        {/* Scholarly Frontispiece Intro Section */}
        <section className="space-y-4 pt-4">
          <div className="text-[10px] font-bold text-primary uppercase tracking-widest font-mono">academic catalog registry</div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight leading-tight">
            Register of Normalized Curricula <br />
            <span className="italic text-muted-foreground font-normal">&amp; Official Course Syllabus Books</span>
          </h1>
          <div className="w-20 h-0.5 bg-primary/40 my-3" />
          <p className="text-sm text-foreground/75 leading-relaxed max-w-2xl font-medium">
            This repository houses the autonomous curriculum definitions, academic credits, and course structures. Faculty author learning objectives, peer reviewers validate sections, and the publishing engine compiles final booklets directly from database schemas.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/courses">
                Browse Active Register <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button variant="secondary" asChild className="border-border">
              <Link href="/admin">
                Administrative Office
              </Link>
            </Button>
          </div>
        </section>

        {/* Ledger Tabular Metrics (Replaced Card Grid) */}
        <section className="border-t border-b border-border bg-card/10 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="p-5 space-y-1 text-center md:text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Draft Manuscripts</span>
              <div className="text-2xl font-serif font-bold text-foreground">{stats.draft}</div>
            </div>
            <div className="p-5 space-y-1 text-center md:text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Under Peer Review</span>
              <div className="text-2xl font-serif font-bold text-foreground flex items-center justify-center md:justify-start gap-1.5">
                {stats.review}
                {stats.review > 0 && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
              </div>
            </div>
            <div className="p-5 space-y-1 text-center md:text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Approved Syllabuses</span>
              <div className="text-2xl font-serif font-bold text-foreground">{stats.approved}</div>
            </div>
            <div className="p-5 space-y-1 text-center md:text-left">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Published Books</span>
              <div className="text-2xl font-serif font-bold text-foreground">{stats.published}</div>
            </div>
          </div>
        </section>

        {/* Dynamic Section Layout */}
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          {/* Active Syllabus Catalogue (Table of Contents look) */}
          <section className="space-y-6">
            <div className="pb-3 border-b border-border/80 flex items-center justify-between">
              <h2 className="text-base font-serif font-bold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Active Syllabus Catalogue
              </h2>
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Section Index</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs font-bold text-muted-foreground/50 flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 animate-spin text-primary" /> Querying catalog registry...
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded border border-dashed border-border p-12 text-center text-xs font-semibold text-muted-foreground bg-card/30">
                No syllabus records configured in the database. Use Administrative Controls to initialize them.
              </div>
            ) : (
              <div className="space-y-4">
                {courses.slice(0, 5).map((course) => (
                  <div 
                    key={course.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 group pb-3 border-b border-border/40 hover:border-primary/20 transition-all duration-150"
                  >
                    <div className="flex-1 dot-leader min-w-0">
                      <div className="dot-leader-title font-bold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground/75 font-semibold bg-muted px-1.5 py-0.5 rounded border border-border/40 shrink-0">{course.code}</span>
                        <Link href={`/courses/${course.id}`} className="truncate max-w-[280px] sm:max-w-[340px]">{course.title}</Link>
                      </div>
                      <div className="dot-leader-value self-end">
                        <StatusBadge status={course.status} />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2.5 shrink-0 pl-0 sm:pl-4">
                      <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider hidden md:inline-block">Credits: {course.credits}</span>
                      <Button variant="ghost" size="sm" asChild className="h-8 text-[10px] font-bold tracking-tight uppercase border-border/40 hover:bg-secondary/40">
                        <Link href={`/courses/${course.id}`}>
                          Open Manuscript <ChevronRight className="ml-0.5 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Academic Workflow Steppers (Horizontal/Ledger style) */}
          <aside className="space-y-6">
            <div className="pb-3 border-b border-border/80">
              <h2 className="text-base font-serif font-bold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Workflow Pipeline
              </h2>
            </div>
            
            <div className="rounded border border-border p-5 bg-card/30 space-y-5">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="font-mono text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/25 h-5 w-5 rounded-sm flex items-center justify-center shrink-0 mt-0.5">01</div>
                  <div className="space-y-0.5 flex-1">
                    <div className="text-[10px] font-bold text-foreground uppercase tracking-wider">Formulate Shell</div>
                    <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
                      Administrative office sets up dynamic semesters, departments, and subject catalog shells.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="font-mono text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/25 h-5 w-5 rounded-sm flex items-center justify-center shrink-0 mt-0.5">02</div>
                  <div className="space-y-0.5 flex-1">
                    <div className="text-[10px] font-bold text-foreground uppercase tracking-wider">Teacher Drafting</div>
                    <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
                      Syllabus coordinator accepts secure coordination rights and drafts modular contents.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="font-mono text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/25 h-5 w-5 rounded-sm flex items-center justify-center shrink-0 mt-0.5">03</div>
                  <div className="space-y-0.5 flex-1">
                    <div className="text-[10px] font-bold text-foreground uppercase tracking-wider">Peer Validation</div>
                    <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
                      External board reviewers examine the draft, attach section comments, and grant approval.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="font-mono text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/25 h-5 w-5 rounded-sm flex items-center justify-center shrink-0 mt-0.5">04</div>
                  <div className="space-y-0.5 flex-1">
                    <div className="text-[10px] font-bold text-foreground uppercase tracking-wider">Press Assembly</div>
                    <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
                      HOD office compiles approved drafts into unified institutional curriculum booklet PDFs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
