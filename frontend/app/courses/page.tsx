"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, FileSearch, Loader2, Plus, RefreshCw, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { Course, CourseStatus } from "@/types/curriculum";
import { cn } from "@/lib/utils";

type CourseListItem = {
  id: number;
  code: string;
  title: string;
  faculty_name: string | null;
  status: CourseStatus;
  updated_at: string;
  semester_label: string;
  outcomes: { code: string }[];
  modules: { number: number }[];
  experiments: { number: number }[];
  assessments: { component: string }[];
  reference_books: { title: string }[];
};

function computeValidation(course: CourseListItem): { label: string; missing: string[] } {
  const missing: string[] = [];
  if (!course.outcomes?.length) missing.push("Course Outcomes");
  if (!course.modules?.length) missing.push("Modules");
  if (!course.assessments?.length) missing.push("Assessments");
  if (!course.reference_books?.length) missing.push("References");
  return {
    label: missing.length === 0 ? "Clear" : missing.length <= 2 ? "Warnings" : "Incomplete",
    missing,
  };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<CourseListItem[]>("/courses/");
      setCourses(Array.isArray(data) ? data : (data as any).results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCourses();
  }, []);

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in text-left">
        {/* Title Bar Action area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
          <div className="space-y-1">
            <h2 className="text-xl font-serif font-bold text-foreground">Curriculum Register Queue</h2>
            <p className="text-xs text-muted-foreground font-semibold">Catalogue listing of active course shells, validation completeness, and active reviewer approvals.</p>
          </div>
          <div className="flex gap-2.5 self-start sm:self-center">
            <Button variant="secondary" onClick={() => void fetchCourses()} className="h-9 border-border">
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin text-primary")} /> Refresh ledger
            </Button>
            <Button asChild className="h-9">
              <Link href="/admin">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Initialize subject
              </Link>
            </Button>
          </div>
        </div>

        {/* Loading Ledger Shell state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 bg-card rounded border border-border shadow-sm space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs font-bold text-muted-foreground/60">Fetching curriculum registers...</span>
          </div>
        )}

        {/* Error notification block */}
        {error && (
          <div className="rounded border border-destructive/20 bg-destructive/5 p-4 text-xs font-semibold text-foreground flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4.5 w-4.5 text-destructive" />
              <div>
                <div className="font-extrabold text-destructive">Registry Fetch Error</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{error}</div>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => void fetchCourses()} className="h-8 border-border">Retry</Button>
          </div>
        )}

        {/* Main Administrative Register Grid */}
        {!loading && !error && (
          <div className="overflow-hidden border border-border bg-card shadow-sm rounded-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] border-collapse text-xs">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border/80 text-foreground/75 text-[10px] font-bold uppercase tracking-wider text-left">
                    <th className="px-4 py-3.5 font-mono">Code</th>
                    <th className="px-4 py-3.5 font-serif font-bold text-sm lowercase first-letter:uppercase">Subject Title</th>
                    <th className="px-4 py-3.5">Coordinator Assigned</th>
                    <th className="px-4 py-3.5">Workflow Status</th>
                    <th className="px-4 py-3.5">Last Modification</th>
                    <th className="px-4 py-3.5 text-center">Validation</th>
                    <th className="px-4 py-3.5">Missing Block</th>
                    <th className="px-4 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {courses.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground/50 font-semibold font-serif italic">
                        No curriculum subjects configured in this semester catalog registry.
                      </td>
                    </tr>
                  )}
                  {courses.map((course) => {
                    const validation = computeValidation(course);
                    return (
                      <tr key={course.id} className="hover:bg-muted/40 transition-colors group">
                        <td className="px-4 py-4 font-mono font-bold text-primary hover:underline">
                          <Link href={`/courses/${course.id}`}>{course.code}</Link>
                        </td>
                        <td className="px-4 py-4 font-serif font-bold text-[13px] text-foreground/95">
                          <Link href={`/courses/${course.id}`} className="hover:text-primary transition-colors">
                            {course.title}
                          </Link>
                        </td>
                        <td className="px-4 py-4 font-semibold text-foreground/70">{course.faculty_name ?? "—"}</td>
                        <td className="px-4 py-4"><StatusBadge status={course.status} /></td>
                        <td className="px-4 py-4 font-medium text-muted-foreground/80">
                          {course.updated_at ? new Date(course.updated_at).toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider",
                              validation.label === "Clear" && "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                              validation.label === "Warnings" && "bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20",
                              validation.label === "Incomplete" && "bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            )}
                          >
                            {validation.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-medium text-muted-foreground/70 max-w-[180px] truncate" title={validation.missing.join(", ")}>
                          {validation.missing.length ? validation.missing.join(", ") : "None"}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <Link href={`/courses/${course.id}`} className="text-primary hover:underline font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Eye className="h-3 w-3" /> Draft
                            </Link>
                            <Link href={`/review?course=${course.id}`} className="text-foreground/60 hover:text-primary hover:underline font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <FileSearch className="h-3 w-3" /> Review
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
