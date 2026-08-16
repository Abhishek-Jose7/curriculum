"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Copy,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  MessageSquare,
  Pencil,
  Send,
  ShieldAlert,
  Trash2,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { A4Preview } from "@/components/curriculum/a4-preview";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://curriculum-backend.collacou.workers.dev/api").replace(/\/api$/, "");

type ApiError = Error & { status?: number; code?: string | null; data?: any };

async function publicFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    let data: any = {};
    try {
      data = await res.json();
    } catch {
      /* ignore */
    }
    const err: ApiError = new Error(data.error || data.detail || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data.error ?? null;
    err.data = data;
    throw err;
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

type Stage = "pin" | "reviewing" | "submitted";

type CommentRow = {
  id: string;
  section_key: string;
  section_label: string;
  body: string;
  reviewer_name: string | null;
  reviewer_email?: string | null;
  is_external?: number;
  status?: string;
  submitted_at?: string | null;
};

const SECTION_LABELS: Record<string, string> = {
  overview: "Course Overview & Objectives",
  outcomes: "Course Outcomes & CO-PO",
  modules: "Modules & Content",
  experiments: "Experiments / Lab Work",
  assessment_references: "Assessment & References",
};

// Map A4Preview detailed selectable keys to backend comment section keys
const A4_TO_SECTION_MAP: Record<string, string> = {
  basic: "overview",
  examination: "overview",
  outcomes: "outcomes",
  modules: "modules",
  self_learning: "modules",
  assessments: "assessment_references",
  experiments: "experiments",
  references: "assessment_references",
  video_lectures: "assessment_references",
  copo_matrix: "outcomes",
};

function PinGate({
  token,
  onVerified,
  onInvalid,
}: {
  token: string;
  onVerified: (sessionToken: string, course: { code: string; title: string }) => void;
  onInvalid: () => void;
}) {
  const [pin, setPin] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedSeconds, setLockedSeconds] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (lockedSeconds > 0) {
      const interval = setInterval(() => setLockedSeconds((s) => s - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [lockedSeconds]);

  const handleSubmit = async () => {
    if (pin.length !== 4 || lockedSeconds > 0 || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const data = await publicFetch<{ sessionToken: string; course: { code: string; title: string } }>(
        `/public/review/${token}/verify/`,
        { method: "POST", body: JSON.stringify({ pin }) }
      );
      onVerified(data.sessionToken, data.course);
    } catch (err) {
      const e = err as ApiError;
      if (e.status === 404) {
        onInvalid();
      } else if (e.status === 429) {
        setLockedSeconds(e.data?.retryAfterSeconds ?? 300);
        setError("Too many failed attempts.");
        setAttemptsRemaining(null);
      } else if (e.status === 401 && e.code === "PIN_INVALID") {
        setError("Invalid PIN.");
        setAttemptsRemaining(e.data?.attemptsRemaining ?? null);
        setPin("");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-xl font-serif font-bold text-foreground">Secure Review</h1>
          <p className="text-xs text-muted-foreground">Enter the 4-digit PIN provided by the course coordinator.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2 text-center">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="••••"
              className="h-14 w-40 rounded border border-border bg-background px-4 text-center text-2xl font-mono tracking-[0.35em] focus-visible:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 mx-auto"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
              disabled={lockedSeconds > 0 || verifying}
            />
            {error && (
              <p className="text-[10px] font-medium text-destructive mt-1">
                {error} {attemptsRemaining !== null && `(${attemptsRemaining} attempts left)`}
              </p>
            )}
            {lockedSeconds > 0 && (
              <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                Locked. Try again in {Math.ceil(lockedSeconds / 60)} min.
              </p>
            )}
          </div>
          <Button className="w-full h-10 font-bold uppercase tracking-wider text-xs" onClick={() => void handleSubmit()} disabled={pin.length !== 4 || lockedSeconds > 0 || verifying}>
            {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <KeyRound className="h-3.5 w-3.5 mr-2" />}
            Unlock Review
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionCommentsPane({
  sectionKey,
  label,
  comments,
  course,
  token,
  sessionToken,
  onUpdateComments,
  onSessionInvalid,
}: {
  sectionKey: string;
  label: string;
  comments: CommentRow[];
  course: any;
  token: string;
  sessionToken: string;
  onUpdateComments: (updater: (prev: CommentRow[]) => CommentRow[]) => void;
  onSessionInvalid: () => void;
}) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const sectionComments = comments.filter((c) => c.section_key === sectionKey);
  const isDraft = (c: CommentRow) => c.status === "DRAFT";

  const authHeaders = {
    Authorization: `Bearer ${sessionToken}`,
    "Content-Type": "application/json",
  };

  const handleError = (e: ApiError) => {
    if (e.status === 401) {
      onSessionInvalid();
      return true;
    }
    return false;
  };

  const handleAdd = async () => {
    if (!body.trim() || !name.trim() || busy) return;
    setBusy(true);
    try {
      const created = await publicFetch<CommentRow>(`/public/review/${token}/comments/`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          section_key: sectionKey,
          section_label: label,
          body,
          reviewer_name: name,
        }),
      });
      onUpdateComments((prev) => [created, ...prev]);
      setBody("");
    } catch (err) {
      if (!handleError(err as ApiError)) alert("Failed to save comment.");
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async (comment: CommentRow) => {
    if (!editBody.trim() || busy) return;
    setBusy(true);
    try {
      const updated = await publicFetch<CommentRow>(`/public/review/${token}/comments/${comment.id}/`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ body: editBody }),
      });
      onUpdateComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingId(null);
    } catch (err) {
      if (!handleError(err as ApiError)) alert("Failed to update comment.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (comment: CommentRow) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    setBusy(true);
    try {
      await publicFetch(`/public/review/${token}/comments/${comment.id}/`, {
        method: "DELETE",
        headers: authHeaders,
      });
      onUpdateComments((prev) => prev.filter((c) => c.id !== comment.id));
    } catch (err) {
      if (!handleError(err as ApiError)) alert("Failed to delete comment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id={`section-${sectionKey}`} className="rounded border border-border bg-card shadow-sm overflow-hidden mb-6 scroll-mt-20">
      <div className="p-3 border-b border-border/80 bg-muted/20">
        <h2 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
          {label}
        </h2>
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
          {sectionComments.length} comment{sectionComments.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="p-4 space-y-3 bg-muted/5">
        {sectionComments.length === 0 ? (
          <div className="py-4 text-center text-[11px] font-medium text-muted-foreground border border-dashed border-border/70 rounded bg-card/40">
            <MessageSquare className="mx-auto h-4 w-4 mb-2 text-muted-foreground/45" />
            No comments yet.
          </div>
        ) : (
          sectionComments.map((comment) => (
            <div key={comment.id} className="rounded border border-border bg-card p-3.5 shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2 mb-2">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  {comment.reviewer_name ?? "Anonymous"}
                </span>
                <span
                  className={cn(
                    "rounded-sm px-1.5 py-0.5 text-[8px] font-bold font-mono border uppercase tracking-wider",
                    isDraft(comment)
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  )}
                >
                  {isDraft(comment) ? "DRAFT" : "SUBMITTED"}
                </span>
              </div>

              {editingId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="min-h-[60px] w-full rounded border border-border bg-background p-2.5 text-xs font-medium resize-none focus-visible:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-[9px] font-bold uppercase tracking-wider" onClick={() => void handleEdit(comment)} disabled={busy}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-[9px] font-bold uppercase tracking-wider" onClick={() => setEditingId(null)} disabled={busy}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-serif text-foreground/80 leading-relaxed italic">&ldquo;{comment.body}&rdquo;</p>
              )}

              {isDraft(comment) && editingId !== comment.id && (
                <div className="mt-2 flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditBody(comment.body);
                    }}
                    disabled={busy}
                  >
                    <Pencil className="h-2.5 w-2.5 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-red-500"
                    onClick={() => void handleDelete(comment)}
                    disabled={busy}
                  >
                    <Trash2 className="h-2.5 w-2.5 mr-1" /> Delete
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border/60 p-4 bg-muted/10 space-y-2.5">
        <input
          type="text"
          placeholder="Your name (required)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 w-full rounded border border-border bg-background px-3 text-xs font-medium placeholder:text-muted-foreground/50 focus-visible:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        />
        <textarea
          placeholder={`Add a comment on ${label}...`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[70px] w-full rounded border border-border bg-background p-2.5 text-xs font-medium resize-none placeholder:text-muted-foreground/50 focus-visible:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        />
        <Button
          className="w-full h-9 font-bold uppercase tracking-wider text-[10px]"
          onClick={() => void handleAdd()}
          disabled={busy || !body.trim() || !name.trim()}
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Send className="h-3 w-3 mr-1.5" />}
          Save Draft Comment
        </Button>
      </div>
    </div>
  );
}

function PublicReviewContent() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [stage, setStage] = useState<Stage>("pin");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const [selectedA4Section, setSelectedA4Section] = useState<string | null>(null);

  const sections = useMemo(() => {
    const base = [
      { key: "overview", label: SECTION_LABELS.overview },
      { key: "outcomes", label: SECTION_LABELS.outcomes },
      { key: "modules", label: SECTION_LABELS.modules },
    ];
    if (course && course.course_type !== "THEORY") {
      base.push({ key: "experiments", label: SECTION_LABELS.experiments });
    }
    base.push({ key: "assessment_references", label: SECTION_LABELS.assessment_references });
    return base;
  }, [course]);

  const loadReview = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${sessionToken}` };
      const [courseData, commentsData] = await Promise.all([
        publicFetch<any>(`/public/review/${token}/`, { headers }),
        publicFetch<CommentRow[]>(`/public/review/${token}/comments/`, { headers }),
      ]);
      setCourse(courseData);
      setComments(Array.isArray(commentsData) ? commentsData : []);
    } catch (err) {
      const e = err as ApiError;
      if (e.status === 401) {
        setSessionToken(null);
        setStage("pin");
      } else if (e.status === 404) {
        setInvalidLink(true);
      }
    } finally {
      setLoading(false);
    }
  }, [sessionToken, token]);

  useEffect(() => {
    if (stage === "reviewing") void loadReview();
  }, [stage, loadReview]);

  const handleVerified = (newSessionToken: string, info: { code: string; title: string }) => {
    setSessionToken(newSessionToken);
    setCourse((prev: any) => ({ ...(prev ?? {}), code: info.code, title: info.title }));
    setStage("reviewing");
  };

  const handleSessionInvalid = () => {
    setSessionToken(null);
    setStage("pin");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async () => {
    if (!sessionToken) return;
    if (!confirm("Are you sure you want to submit all draft comments? You won't be able to edit them after submission.")) return;
    setSubmitting(true);
    try {
      const data = await publicFetch<{ submittedCount: number }>(`/public/review/${token}/submit/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      setSubmittedCount(data.submittedCount);
      setStage("submitted");
    } catch (err) {
      const e = err as ApiError;
      if (e.status === 401) {
        handleSessionInvalid();
      } else {
        alert("Failed to submit review.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (invalidLink) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded border border-destructive/20 bg-destructive/5 p-6 text-center space-y-3">
          <ShieldAlert className="mx-auto h-6 w-6 text-destructive" />
          <h1 className="text-sm font-serif font-bold text-destructive">Review Link Invalid</h1>
          <p className="text-xs text-muted-foreground">This review link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (stage === "pin") {
    return <PinGate token={token} onVerified={handleVerified} onInvalid={() => setInvalidLink(true)} />;
  }

  if (stage === "submitted") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded border border-border bg-card p-8 text-center shadow-sm space-y-4">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
          <h1 className="text-lg font-serif font-bold text-foreground">Thanks — your review has been submitted</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {submittedCount} comment{submittedCount === 1 ? "" : "s"} were submitted to the course coordinator
            {course?.code ? ` (${course.code})` : ""}. You can close this tab.
          </p>
          <Button variant="secondary" className="h-9 text-[10px] font-bold uppercase tracking-wider" onClick={() => window.location.reload()}>
            Submit another review
          </Button>
        </div>
      </div>
    );
  }

  const draftCount = comments.filter((c) => c.status === "DRAFT").length;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="shrink-0 z-20 border-b border-border/80 bg-card/95 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <GraduationCap className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">External Reviewer Portal</div>
              <div className="truncate text-sm font-serif font-bold text-foreground">
                {course ? `${course.code} — ${course.title}` : "Loading course..."}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded border border-border bg-background px-2.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Copy this review link"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <Button
              onClick={() => void handleSubmit()}
              disabled={submitting || draftCount === 0}
              className="h-8 px-4 font-bold uppercase tracking-wider text-[10px]"
            >
              {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Check className="h-3 w-3 mr-1.5" />}
              Submit Review ({draftCount})
            </Button>
          </div>
        </div>
      </header>

      {/* Main Split Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-muted/10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Loading syllabus for review...</span>
          </div>
        ) : !course ? (
          <div className="flex-1 flex items-center justify-center text-xs font-semibold text-muted-foreground">Could not load this syllabus.</div>
        ) : (
          <>
            {/* Left Pane - A4 Preview */}
            <div className="w-full md:w-[60%] lg:w-[65%] h-full overflow-y-auto bg-[#e5e7eb] dark:bg-muted/30 relative">
              <div className="sticky top-4 left-0 right-0 flex justify-center pointer-events-none z-10">
                {selectedA4Section && (
                  <div className="bg-foreground/80 text-background text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md backdrop-blur">
                    Viewing {A4_TO_SECTION_MAP[selectedA4Section] ? SECTION_LABELS[A4_TO_SECTION_MAP[selectedA4Section]] : selectedA4Section}
                  </div>
                )}
              </div>
              <div className="p-4 md:p-8 flex justify-center pb-24">
                <div className="bg-white text-black shadow-xl max-w-full origin-top">
                  <A4Preview 
                    course={course} 
                    reviewMode={true} 
                    selectedSection={selectedA4Section ?? undefined} 
                    onSelectSection={(id) => {
                      setSelectedA4Section(id === selectedA4Section ? null : id);
                      // Scroll the right pane to the section
                      const targetKey = A4_TO_SECTION_MAP[id];
                      if (targetKey) {
                        document.getElementById(`section-${targetKey}`)?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Pane - Comments */}
            <div className="w-full md:w-[40%] lg:w-[35%] h-[50vh] md:h-full border-t md:border-t-0 md:border-l border-border shrink-0 bg-muted/5 z-10 flex flex-col">
              <div className="p-4 border-b border-border/80 bg-card shadow-sm shrink-0 z-20">
                <h2 className="text-sm font-serif font-bold text-foreground">Review Comments</h2>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
                  Scroll to leave feedback per section
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {sections.map((section) => (
                  <SectionCommentsPane
                    key={section.key}
                    sectionKey={section.key}
                    label={section.label}
                    comments={comments}
                    course={course}
                    token={token}
                    sessionToken={sessionToken ?? ""}
                    onUpdateComments={(updater) => setComments((prev) => updater(prev))}
                    onSessionInvalid={handleSessionInvalid}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function PublicReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      }
    >
      <PublicReviewContent />
    </Suspense>
  );
}
