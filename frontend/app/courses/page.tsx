"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, FileSearch, Loader2, Plus, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { Course, CourseStatus } from "@/types/curriculum";

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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Curriculum Workflow Queue</h2>
          <p className="text-sm text-foreground/60">Track authoring completeness, validation, preview, and review readiness.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void fetchCourses()}>
            <RefreshCw className="h-4 w-4" />Refresh
          </Button>
          <Button><Plus className="h-4 w-4" />Create Structured Course</Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-foreground/60" />
          <span className="ml-2 text-foreground/60">Loading courses...</span>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
          <Button variant="secondary" className="ml-4" onClick={() => void fetchCourses()}>Retry</Button>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-3 py-3">Course Code</th>
                <th className="px-3 py-3">Course Name</th>
                <th className="px-3 py-3">Faculty Assigned</th>
                <th className="px-3 py-3">Workflow Status</th>
                <th className="px-3 py-3">Last Modified</th>
                <th className="px-3 py-3">Validation Status</th>
                <th className="px-3 py-3">Missing Sections</th>
                <th className="px-3 py-3">Preview Action</th>
                <th className="px-3 py-3">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {courses.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-foreground/60">No courses found. Create a structured course to begin.</td></tr>
              )}
              {courses.map((course) => {
                const validation = computeValidation(course);
                return (
                  <tr key={course.id} className="hover:bg-muted/45">
                    <td className="px-3 py-3 font-mono">{course.code}</td>
                    <td className="px-3 py-3 font-medium"><Link href={`/courses/${course.id}`}>{course.title}</Link></td>
                    <td className="px-3 py-3">{course.faculty_name ?? "—"}</td>
                    <td className="px-3 py-3"><StatusBadge status={course.status} /></td>
                    <td className="px-3 py-3">{course.updated_at ? new Date(course.updated_at).toLocaleString() : "—"}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${validation.label === "Clear" ? "bg-emerald-100 text-emerald-800" : validation.label === "Warnings" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                        {validation.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs">{validation.missing.length ? validation.missing.join(", ") : "None"}</td>
                    <td className="px-3 py-3"><Button variant="secondary" asChild><Link href={`/courses/${course.id}`}><Eye className="h-4 w-4" />Preview</Link></Button></td>
                    <td className="px-3 py-3"><Button variant="secondary" asChild><Link href={`/review?course=${course.id}`}><FileSearch className="h-4 w-4" />Review</Link></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
