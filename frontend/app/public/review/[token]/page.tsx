"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Check, Loader2, MessageSquare, Send, ShieldAlert, CornerDownRight, AlignLeft, User } from "lucide-react";
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

function PublicReviewContent() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [course, setCourse] = useState<CourseDraft | null>(null);
  const [comments, setComments] = useState<ReviewerComment[]>([]);
  const [selected, setSelected] = useState("outcomes");
  
  const [draft, setDraft] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourse = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Unauthenticated fetches
      const courseData = await apiFetch<CourseDraft>(`/public/review/${token}/`);
      setCourse(courseData);

      const commentsData = await apiFetch<{ results?: ReviewerComment[] } | ReviewerComment[]>(
        `/public/review/${token}/comments/`
      );
      const commentsList = Array.isArray(commentsData) ? commentsData : commentsData.results ?? [];
      setComments(commentsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchCourse();
  }, [fetchCourse]);

  const handleAddComment = async () => {
    if (!draft.trim() || !reviewerName.trim() || !course) return;
    setSubmitting(true);
    try {
      const newComment = await apiFetch<ReviewerComment>(`/public/review/${token}/comments/`, {
        method: "POST",
        body: JSON.stringify({
          section_key: selected,
          section_label: sectionLabels[selected] ?? selected,
          body: draft,
          reviewer_name: reviewerName,
        }),
      });
      setComments((prev) => [newComment, ...prev]);
      setDraft("");
    } catch (err) {
      alert("Failed to post comment: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] flex-col items-center justify-center p-8 bg-card border border-border rounded shadow-sm space-y-4 animate-pulse">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Retrieving revision context ledger...</span>
        </div>
      </AppShell>
    );
  }

  if (error || !course) {
    return (
      <AppShell>
        <div className="rounded border border-destructive/20 bg-destructive/5 p-6 text-sm text-foreground flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <div className="font-serif font-bold text-destructive text-base">Review Link Invalid</div>
              <div className="text-xs text-muted-foreground font-medium mt-1">{error ?? "This review link is invalid or has expired."}</div>
            </div>
          </div>
          <Button variant="secondary" className="h-9 font-bold text-xs uppercase tracking-wider border-destructive/20 text-destructive hover:bg-destructive/10 shrink-0" onClick={() => void fetchCourse()}>Retry Connection</Button>
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
      <div className={cn(
        "grid min-h-[calc(100vh-80px)] overflow-hidden border border-border bg-card shadow-sm animate-fade-in rounded-sm",
        isExpanded ? "grid-cols-1" : "xl:grid-cols-[1fr_380px]"
      )}>
        {/* Left Hand Document Review Workspace Pane */}
        <section className={cn("min-w-0 bg-background/30", isExpanded ? "w-full h-full flex flex-col" : "flex flex-col")}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border p-6 bg-card/60">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded-sm text-muted-foreground border border-border">{course.code}</span>
                <h2 className="text-lg font-serif font-bold text-foreground tracking-tight">
                  {course.title}
                </h2>
                <StatusBadge status={course.status} />
              </div>
              
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2 flex-wrap">
                <span>EXTERNAL REVIEW PORTAL</span>
                <span>·</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{openCount} Open Annotations</span>
                <span>·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{resolvedCount} Resolved</span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 bg-secondary/30 dark:bg-secondary/10 overflow-hidden relative max-h-[calc(100vh-230px)] flex flex-col items-center justify-center">
            <div className="w-full max-w-4xl h-full overflow-hidden academic-document-shadow border border-border bg-white text-black relative flex flex-col">
              <div className="bg-muted/30 border-b border-border/80 px-4 py-2 flex items-center justify-between text-[9px] font-mono text-muted-foreground select-none shrink-0">
                <span>DESK PREVIEW MOCK — SYLLABUS DRAFT V{course.id}</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/60" /> COMPLIANT PRINT SPECIFICATION (A4)
                </span>
              </div>
              <div className="flex-1 overflow-hidden relative w-full h-full">
                <A4Preview 
                  course={course} 
                  reviewMode 
                  selectedSection={selected} 
                  onSelectSection={setSelected} 
                  isFullScreen={isExpanded}
                  onToggleFullScreen={() => setIsExpanded(prev => !prev)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Right Hand Commentary Stream Thread Feed */}
        <aside className={cn("border-t xl:border-t-0 xl:border-l border-border bg-card", isExpanded ? "hidden" : "flex flex-col")}>
          <div className="border-b border-border p-6 bg-card/60 space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">MARGINALIA &amp; NOTES</div>
            <h3 className="font-serif font-bold text-sm text-foreground flex items-center gap-2">
              <AlignLeft className="h-4 w-4 text-primary" />
              Syllabus Annotations
            </h3>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
              <CornerDownRight className="h-3 w-3 text-muted-foreground/60" />
              Focus: <span className="font-bold text-foreground font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded-sm border border-border">{sectionLabels[selected] ?? selected}</span>
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-6 scrollbar-thin max-h-[calc(100vh-390px)] bg-background/5 flex flex-col-reverse">
            {sectionComments.length === 0 ? (
              <div className="py-12 px-4 text-center text-xs font-medium text-muted-foreground border border-dashed border-border/80 rounded bg-card/40 flex flex-col items-center justify-center space-y-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground/45" />
                <p className="font-serif italic text-muted-foreground/75">No peer review annotations logged on this syllabus block.</p>
                <p className="text-[10px] text-muted-foreground/50 max-w-[200px]">Select a text block on the manuscript page to file a revision note.</p>
              </div>
            ) : (
              sectionComments.map((comment) => (
                <div
                  key={comment.id}
                  className={cn(
                    "p-4 transition-all duration-150 rounded-sm border",
                    comment.is_resolved 
                      ? "border-emerald-500/20 bg-emerald-500/5" 
                      : "border-border bg-card hover:border-primary/30 academic-document-shadow"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2 mb-3">
                    <div className="text-[10px] font-mono font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
                      Ref: §{comment.section_key}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "rounded-sm px-1.5 py-0.5 text-[8px] font-bold font-mono border uppercase tracking-wider", 
                        comment.is_resolved 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      )}>
                        {comment.is_resolved ? "RESOLVED" : "OPEN"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-serif text-foreground/80 leading-relaxed italic">
                    &ldquo;{comment.body}&rdquo;
                  </p>
                  <div className="mt-4 pt-2 border-t border-border/40 flex items-center justify-between text-[9px] font-mono text-muted-foreground">
                    <span>BY: {comment.reviewer_name ?? "Anonymous"} {comment.is_external ? "(External)" : ""}</span>
                    <span>§ AUTHORIZED</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Submission TextArea panel */}
          <div className="border-t border-border p-6 bg-card/60 space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Your Name (Required)"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="h-9 w-full rounded-sm border border-border bg-background pl-9 pr-3 text-xs font-medium focus-visible:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/60"
                disabled={submitting}
              />
            </div>
            <textarea
              className="min-h-[80px] w-full rounded-sm border border-border bg-background p-3.5 text-xs font-medium leading-relaxed transition-all duration-150 focus-visible:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/60 resize-none font-serif"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={`Register review annotation for ${sectionLabels[selected] ?? selected}...`}
              disabled={submitting}
            />
            <Button
              className="mt-3 w-full h-10 font-bold uppercase tracking-wider text-xs rounded-sm"
              onClick={() => void handleAddComment()}
              disabled={submitting || !draft.trim() || !reviewerName.trim()}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="mr-2 h-3 w-3" />
              )}
              Log Review Annotation
            </Button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

export default function PublicReviewPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex h-[60vh] flex-col items-center justify-center p-8 bg-card border border-border rounded shadow-sm space-y-4 animate-pulse">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Initializing external peer review console...</span>
        </div>
      </AppShell>
    }>
      <PublicReviewContent />
    </Suspense>
  );
}
