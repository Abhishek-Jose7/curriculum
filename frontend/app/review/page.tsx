"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Loader2, MessageSquare, Send, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { A4Preview } from "@/components/curriculum/a4-preview";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { CourseDraft, ReviewerComment } from "@/types/curriculum";

const sectionLabels: Record<string, string> = {
  basic: "Basic Details",
  teaching: "Teaching Scheme",
  examination: "Examination Scheme",
  objectives: "Course Objectives",
  outcomes: "Course Outcomes",
  modules: "Modules",
  experiments: "Experiments/Tutorials",
  assessments: "Assessments",
  references: "References",
};

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course") ?? "1";

  const [course, setCourse] = useState<CourseDraft | null>(null);
  const [comments, setComments] = useState<ReviewerComment[]>([]);
  const [selected, setSelected] = useState("outcomes");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    try {
      const courseData = await apiFetch<CourseDraft>(`/courses/${courseId}/`);
      setCourse(courseData);

      const commentsData = await apiFetch<{ results?: ReviewerComment[] } | ReviewerComment[]>(
        `/reviewer-comments/?course=${courseId}`
      );
      const commentsList = Array.isArray(commentsData) ? commentsData : commentsData.results ?? [];
      setComments(commentsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void fetchCourse();
  }, [fetchCourse]);

  const handleAddComment = async () => {
    if (!draft.trim() || !course) return;
    setSubmitting(true);
    try {
      const newComment = await apiFetch<ReviewerComment>("/reviewer-comments/", {
        method: "POST",
        body: JSON.stringify({
          course: course.id,
          section_key: selected,
          section_label: sectionLabels[selected] ?? selected,
          body: draft,
        }),
      });
      setComments((prev) => [...prev, newComment]);
      setDraft("");
    } catch (err) {
      alert("Failed to post comment: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveComment = async (commentId: number) => {
    try {
      const resolved = await apiFetch<ReviewerComment>(`/reviewer-comments/${commentId}/resolve/`, {
        method: "POST",
      });
      setComments((prev) => prev.map((c) => (c.id === commentId ? resolved : c)));
    } catch (err) {
      alert("Failed to resolve comment");
    }
  };

  const handleWorkflowDecision = async (decision: "REQUEST_CHANGES" | "APPROVE") => {
    if (!course) return;
    setDeciding(true);
    const note = decision === "REQUEST_CHANGES"
      ? prompt("Enter note for changes requested:") ?? ""
      : "";
    try {
      await apiFetch("/approval-workflows/", {
        method: "POST",
        body: JSON.stringify({
          course: course.id,
          decision,
          note,
        }),
      });
      // Refresh course to get updated status
      const updatedCourse = await apiFetch<CourseDraft>(`/courses/${courseId}/`);
      setCourse(updatedCourse);
      alert(decision === "APPROVE" ? "Course approved!" : "Changes requested.");
    } catch (err) {
      alert("Workflow action failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setDeciding(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-foreground/60" />
          <span className="ml-2 text-foreground/60">Loading review data...</span>
        </div>
      </AppShell>
    );
  }

  if (error || !course) {
    return (
      <AppShell>
        <div className="rounded-md border border-red-300 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error ?? "Course not found"}
          <Button variant="secondary" className="ml-4" onClick={() => void fetchCourse()}>Retry</Button>
        </div>
      </AppShell>
    );
  }

  const sectionComments = comments.filter(
    (c) => c.section_key === selected || c.section_key.startsWith(`${selected}.`)
  );
  const openCount = comments.filter((c) => !c.is_resolved).length;
  const resolvedCount = comments.filter((c) => c.is_resolved).length;

  return (
    <AppShell>
      <div className="grid min-h-[calc(100vh-104px)] overflow-hidden rounded-md border border-border xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="min-w-0">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">{course.code} {course.title}</h2>
                <StatusBadge status={course.status} />
              </div>
              <p className="text-sm text-foreground/60">
                Select a rendered document section to attach structured reviewer comments.
                <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs">
                  {openCount} open · {resolvedCount} resolved
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={deciding}
                onClick={() => void handleWorkflowDecision("REQUEST_CHANGES")}
              >
                {deciding ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                Request Changes
              </Button>
              <Button
                disabled={deciding || openCount > 0}
                onClick={() => void handleWorkflowDecision("APPROVE")}
                title={openCount > 0 ? "Resolve all open comments before approving" : "Approve this course"}
              >
                {deciding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Approve Content
              </Button>
            </div>
          </div>
          <div className="h-[calc(100vh-185px)]">
            <A4Preview course={course} reviewMode selectedSection={selected} onSelectSection={setSelected} />
          </div>
        </section>

        <aside className="flex flex-col border-l border-border bg-background">
          <div className="border-b border-border p-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <MessageSquare className="h-4 w-4" />
              Section Comments
            </h3>
            <p className="text-sm text-foreground/60">
              Selected: <strong>{sectionLabels[selected] ?? selected}</strong>
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-auto p-4">
            {sectionComments.length === 0 && (
              <p className="py-4 text-center text-sm text-foreground/50">
                No comments for this section yet.
              </p>
            )}
            {sectionComments.map((comment) => (
              <div
                key={comment.id}
                className={cn(
                  "rounded-md border p-3",
                  comment.is_resolved ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-border"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{comment.section_label}</div>
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded px-2 py-0.5 text-xs", comment.is_resolved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>
                      {comment.is_resolved ? "Resolved" : "Open"}
                    </span>
                    {!comment.is_resolved && (
                      <Button
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => void handleResolveComment(comment.id)}
                      >
                        <Check className="mr-1 h-3 w-3" />Resolve
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-foreground/75">{comment.body}</p>
                <div className="mt-2 text-xs text-foreground/55">{comment.reviewer_name}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-4">
            <textarea
              className="min-h-24 w-full rounded-md border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={`Comment on ${sectionLabels[selected] ?? selected}`}
              disabled={submitting}
            />
            <Button
              className="mt-3 w-full"
              onClick={() => void handleAddComment()}
              disabled={submitting || !draft.trim()}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Add Section Comment
            </Button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
