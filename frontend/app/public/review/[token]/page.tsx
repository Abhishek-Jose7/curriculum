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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://curriculum-backend.collacou.workers.dev/api";

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
      /* ignore parse errors */
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
  created_at?: string;
};

const SECTION_LABELS: Record<string, string> = {
  overview: "Overview & Schemes",
  outcomes: "Course Outcomes & CO-PO Matrix",
  modules: "Modules & Syllabus Content",
  experiments: "Experiments",
  assessment_references: "Assessment & References",
};

function SectionCard({
  sectionKey,
  course,
  comments,
  token,
  sessionToken,
  onUpdateComments,
  onSessionInvalid,
}: {
  sectionKey: string;
  course: any;
  comments: CommentRow[];
  token: string;
  sessionToken: string;
  onUpdateComments: (updater: (prev: CommentRow[]) => CommentRow[]) => void;
  onSessionInvalid: () => void;
}) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [busy, setBusy] = useState(false);

  const authHeaders = { Authorization: `Bearer ${sessionToken}` };

  const handleError = (err: ApiError) => {
    if (err.status === 401) {
      onSessionInvalid();
      return true;
    }
    return false;
  };

  const handleAdd = async () => {
    if (!body.trim() || !name.trim()) return;
    setBusy(true);
    try {
      const created = await publicFetch<CommentRow>(`/public/review/${token}/comments/`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          section_key: sectionKey,
          section_label: SECTION_LABELS[sectionKey] ?? sectionKey,
          body,
          reviewer_name: name,
        }),
      });
      onUpdateComments((prev) => [created, ...prev]);
      setBody("");
    } catch (err) {
      if (!handleError(err as ApiError)) alert("Failed to post comment. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async (comment: CommentRow) => {
    setBusy(true);
    try {
      const updated = await publicFetch<CommentRow>(`/public/review/${token}/comments/${comment.id}/`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ body: editBody }),
      });
      onUpdateComments((prev) => prev.map((c) => (c.id === comment.id ? updated : c)));
      setEditingId(null);
    } catch (err) {
      if (!handleError(err as ApiError)) alert("Failed to update comment.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (comment: CommentRow) => {
    if (!window.confirm("Delete this draft comment?")) return;
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

  const isDraft = (c: CommentRow) => c.status === "DRAFT";

  return (
    <div className="rounded border border-border bg-card shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="border-b border-border/80 bg-card/60 px-5 py-4">
        <h2 className="text-sm font-serif font-bold text-foreground">
          {SECTION_LABELS[sectionKey] ?? sectionKey}
        </h2>
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
          Section {sectionKey} · {comments.length} comment{comments.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Section content (read-only) */}
      <div className="px-5 py-4 border-b border-border/40 bg-background/40 text-xs text-foreground/80 leading-relaxed">
        {sectionKey === "overview" && <OverviewContent course={course} />}
        {sectionKey === "outcomes" && <OutcomesContent course={course} />}
        {sectionKey === "modules" && <ModulesContent course={course} />}
        {sectionKey === "experiments" && <ExperimentsContent course={course} />}
        {sectionKey === "assessment_references" && <AssessmentReferencesContent course={course} />}
      </div>

      {/* Comments thread */}
      <div className="space-y-3 px-5 py-4 bg-muted/10">
        {comments.length === 0 ? (
          <div className="py-4 text-center text-[11px] font-medium text-muted-foreground border border-dashed border-border/70 rounded bg-card/40">
            <MessageSquare className="mx-auto h-4 w-4 mb-1 text-muted-foreground/45" />
            No comments yet on this section.
          </div>
        ) : (
          comments.map((comment) => (
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

      {/* Add comment form */}
      <div className="border-t border-border/60 px-5 py-4 bg-card/60 space-y-2.5">
        <input
          type="text"
          placeholder="Your name (required)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 w-full rounded border border-border bg-background px-3 text-xs font-medium placeholder:text-muted-foreground/50 focus-visible:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        />
        <textarea
          placeholder={`Add a comment on ${SECTION_LABELS[sectionKey] ?? sectionKey}...`}
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

function OverviewContent({ course }: { course: any }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Info label="Course Objectives" value={course.objectives || "—"} />
        <Info label="Prerequisites" value={course.pre_requisites || "—"} />
      </div>
      <Info label="Syllabus Introduction" value={course.syllabus_intro || "—"} />
      <div className="rounded border border-border/70 bg-card/50 p-3">
        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Teaching Scheme</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <Metric label="Lecture hrs/wk" value={course.lecture_hours ?? 0} />
          <Metric label="Tutorial hrs/wk" value={course.tutorial_hours ?? 0} />
          <Metric label="Practical hrs/wk" value={course.practical_hours ?? 0} />
          <Metric label="Credits" value={course.credits ?? 0} />
        </div>
      </div>
      <div className="rounded border border-border/70 bg-card/50 p-3">
        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Examination Scheme</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric label="Internal" value={course.internal_marks ?? 0} />
          <Metric label="External (ESE)" value={course.external_marks ?? 0} />
          <Metric label="Duration (hrs)" value={course.duration_hours ?? 0} />
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <p className="text-xs text-foreground/75 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-sm font-mono font-bold text-foreground">{value}</div>
      <div className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function OutcomesContent({ course }: { course: any }) {
  const outcomes = course.outcomes ?? [];
  const poColumns = ["PO1", "PO2", "PO3", "PO4", "PO5", "PO6", "PO7", "PO8", "PO9", "PO10", "PO11", "PO12", "PSO1", "PSO2"];
  return (
    <div className="space-y-3">
      {outcomes.length === 0 ? (
        <p className="text-muted-foreground">No course outcomes defined.</p>
      ) : (
        <ul className="space-y-2">
          {outcomes.map((outcome: any) => (
            <li key={outcome.id ?? outcome.code} className="rounded border border-border/70 bg-card/50 p-2.5">
              <span className="font-mono font-bold text-primary mr-2">{outcome.code}</span>
              <span>{outcome.description}</span>
              {outcome.bloom_level && (
                <span className="ml-2 rounded-sm bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                  {outcome.bloom_level}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {outcomes.some((o: any) => o.po_map && Object.keys(o.po_map).length > 0) && (
        <div className="overflow-x-auto rounded border border-border/70 bg-card/50">
          <table className="w-full text-[9px] border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-border/70">
                <th className="px-2 py-1.5 text-left font-bold uppercase tracking-wider text-muted-foreground">CO</th>
                {poColumns.map((po) => (
                  <th key={po} className="px-1.5 py-1.5 text-center font-bold text-muted-foreground">{po}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {outcomes.map((outcome: any) => (
                <tr key={outcome.id ?? outcome.code} className="border-b border-border/40 last:border-b-0">
                  <td className="px-2 py-1.5 font-mono font-bold text-primary">{outcome.code}</td>
                  {poColumns.map((po) => {
                    const weight = outcome.po_map?.[po];
                    return (
                      <td key={po} className={cn("px-1.5 py-1.5 text-center", weight ? "font-bold text-foreground" : "text-muted-foreground/30")}>
                        {weight ?? "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ModulesContent({ course }: { course: any }) {
  const modules = course.modules ?? [];
  if (modules.length === 0) return <p className="text-muted-foreground">No modules defined.</p>;
  return (
    <div className="space-y-3">
      {modules.map((mod: any) => (
        <div key={mod.id ?? mod.number} className="rounded border border-border/70 bg-card/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground">Module {mod.number}: {mod.title}</span>
            {mod.contact_hours ? <span className="text-[9px] font-mono text-muted-foreground shrink-0">{mod.contact_hours} hrs</span> : null}
          </div>
          <p className="mt-1.5 text-xs text-foreground/75 whitespace-pre-wrap">{mod.content}</p>
          {(mod.topics ?? []).length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-border/40 pt-2">
              {(mod.topics ?? []).map((topic: any, idx: number) => (
                <li key={topic.id ?? idx} className="text-[11px] text-foreground/70">
                  <span className="text-muted-foreground">•</span> <span className="font-semibold">{topic.title}</span>
                  {topic.description ? <span> — {topic.description}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function ExperimentsContent({ course }: { course: any }) {
  const experiments = course.experiments ?? [];
  if (experiments.length === 0) return <p className="text-muted-foreground">No experiments defined.</p>;
  return (
    <ul className="space-y-2">
      {experiments.map((exp: any) => (
        <li key={exp.id ?? exp.number} className="rounded border border-border/70 bg-card/50 p-2.5">
          <span className="font-mono font-bold text-primary mr-2">Exp {exp.number}</span>
          <span className="font-semibold">{exp.title}</span>
          {exp.description && <p className="mt-1 text-[11px] text-foreground/70">{exp.description}</p>}
          {exp.hours ? <span className="mt-1 block text-[9px] font-mono text-muted-foreground">{exp.hours} hrs</span> : null}
        </li>
      ))}
    </ul>
  );
}

function AssessmentReferencesContent({ course }: { course: any }) {
  const assessments = course.assessments ?? [];
  const references = course.reference_books ?? [];
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Assessment Scheme</div>
        {assessments.length === 0 ? (
          <p className="text-muted-foreground">No assessments defined.</p>
        ) : (
          <ul className="space-y-1.5">
            {assessments.map((a: any) => (
              <li key={a.id ?? a.component} className="flex items-baseline justify-between gap-3 rounded border border-border/70 bg-card/50 p-2.5">
                <div>
                  <span className="font-semibold">{a.component}</span>
                  {a.description && <p className="text-[11px] text-foreground/70">{a.description}</p>}
                </div>
                <span className="font-mono font-bold text-primary shrink-0">{a.marks} marks</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Reference Books</div>
        {references.length === 0 ? (
          <p className="text-muted-foreground">No references defined.</p>
        ) : (
          <ul className="space-y-1.5">
            {references.map((b: any) => (
              <li key={b.id ?? b.title} className="rounded border border-border/70 bg-card/50 p-2.5">
                <span className="font-semibold">{b.title}</span>
                {b.authors && <span className="text-muted-foreground"> — {b.authors}</span>}
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  {[b.publisher, b.edition, b.year].filter(Boolean).join(", ")}
                  {b.is_textbook ? " · Textbook" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

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
  const [error, setError] = useState<string | null>(null);
  const [lockedSeconds, setLockedSeconds] = useState(0);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (lockedSeconds <= 0) return;
    const t = setInterval(() => setLockedSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [lockedSeconds]);

  const handleSubmit = async () => {
    if (pin.length !== 4 || lockedSeconds > 0 || verifying) return;
    setError(null);
    setVerifying(true);
    try {
      const data = await publicFetch<{ sessionToken: string; course: { code: string; title: string } }>(
        `/public/review/${token}/verify/`,
        { method: "POST", body: JSON.stringify({ pin }) }
      );
      onVerified(data.sessionToken, data.course);
    } catch (err) {
      const e = err as ApiError;
      if (e.status === 429) {
        setLockedSeconds(e.data?.retryAfterSeconds ?? 900);
        setPin("");
      } else if (e.status === 401) {
        const remaining = e.data?.attemptsRemaining;
        setError(remaining != null ? `Incorrect PIN. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` : "Incorrect PIN.");
        setPin("");
      } else if (e.status === 404) {
        onInvalid();
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setVerifying(false);
    }
  };

  const minutes = Math.floor(lockedSeconds / 60);
  const seconds = lockedSeconds % 60;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded border border-border bg-card p-6 shadow-sm space-y-5">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded border border-border bg-background">
            <Lock className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-sm font-serif font-bold text-foreground">Protected Reviewer Portal</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fr. CRCE — Curriculum Review</p>
        </div>
        <div className="rounded border border-border/70 bg-muted/20 px-3 py-2.5 text-center">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Course</p>
          <p className="text-xs font-bold text-foreground">Enter the 4-digit PIN to continue</p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSubmit();
            }}
            placeholder="••••"
            disabled={lockedSeconds > 0 || verifying}
            className="h-12 w-full rounded border border-border bg-background text-center text-xl font-mono font-bold tracking-[0.5em] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/60 disabled:opacity-50"
          />
          {lockedSeconds > 0 ? (
            <div className="rounded border border-destructive/20 bg-destructive/5 px-3 py-2 text-center">
              <p className="text-[11px] font-bold text-destructive">
                Too many incorrect attempts. Try again in {minutes}:{String(seconds).padStart(2, "0")}
              </p>
            </div>
          ) : error ? (
            <div className="rounded border border-destructive/20 bg-destructive/5 px-3 py-2 text-center">
              <p className="text-[11px] font-bold text-destructive">{error}</p>
            </div>
          ) : null}
          <Button className="w-full h-10 font-bold uppercase tracking-wider text-xs" onClick={() => void handleSubmit()} disabled={pin.length !== 4 || lockedSeconds > 0 || verifying}>
            {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <KeyRound className="h-3.5 w-3.5 mr-2" />}
            Unlock Review
          </Button>
          <p className="text-center text-[9px] font-medium text-muted-foreground">
            This link is protected. Enter the PIN shared by the course coordinator to view and comment on the syllabus.
          </p>
        </div>
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
    // Placeholder until the full course detail loads; the reviewing stage fetches it immediately.
    setCourse((prev: any) => ({ ...(prev ?? {}), code: info.code, title: info.title }));
    setStage("reviewing");
  };

  const handleSessionInvalid = () => {
    setSessionToken(null);
    setCourse(null);
    setComments([]);
    setStage("pin");
  };

  const handleSubmit = async () => {
    if (!sessionToken) return;
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
        alert(e.message || "Failed to submit review.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/80 bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <GraduationCap className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">External Reviewer Portal</div>
              <div className="truncate text-sm font-serif font-bold text-foreground">
                {course ? `${course.code} — ${course.title}` : "Loading course..."}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded border border-border bg-background px-2.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Copy this review link"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6 pb-28">
        {loading ? (
          <div className="flex h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Loading syllabus for review...</span>
          </div>
        ) : !course ? (
          <div className="py-16 text-center text-xs font-semibold text-muted-foreground">Could not load this syllabus.</div>
        ) : (
          <>
            <div className="rounded border border-border bg-card/60 px-4 py-3 text-[11px] text-muted-foreground leading-relaxed">
              You are viewing a <span className="font-bold text-foreground">read-only</span> copy of the syllabus. Draft comments below are only visible
              to people holding this link until you press <span className="font-bold text-foreground">Submit Review</span>, after which they become visible
              to the course coordinator and HOD.
            </div>
            {sections.map((section) => (
              <SectionCard
                key={section.key}
                sectionKey={section.key}
                course={course}
                comments={comments.filter((c) => c.section_key === section.key)}
                token={token}
                sessionToken={sessionToken ?? ""}
                onUpdateComments={(updater) => setComments((prev) => updater(prev))}
                onSessionInvalid={handleSessionInvalid}
              />
            ))}
          </>
        )}
      </main>

      {/* Sticky submit bar */}
      {stage === "reviewing" && course && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/80 bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {draftCount} draft comment{draftCount === 1 ? "" : "s"} ready
            </div>
            <Button
              onClick={() => void handleSubmit()}
              disabled={submitting || draftCount === 0}
              className="h-10 px-6 font-bold uppercase tracking-wider text-xs"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Check className="h-3.5 w-3.5 mr-2" />}
              Submit Review
            </Button>
          </div>
        </div>
      )}
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
