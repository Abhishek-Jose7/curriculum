"use client";

import { BookOpen, Check, ClipboardList, Eye, FlaskConical, Library, MessageSquare, Plus, Save, ScrollText, Trash2, Calendar, AlertTriangle, FileCode, CheckCircle2, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { A4Preview } from "@/components/curriculum/a4-preview";
import { useAutosave } from "@/hooks/use-autosave";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Assessment, CourseDraft, CourseModule, CourseOutcome, Experiment, ReferenceBook } from "@/types/curriculum";

const tabs = [
  { key: "basic", label: "Basic Details", icon: BookOpen },
  { key: "teaching", label: "Teaching Scheme", icon: ClipboardList },
  { key: "exam", label: "Examination Scheme", icon: ClipboardList },
  { key: "outcomes", label: "Course Outcomes", icon: Check },
  { key: "modules", label: "Modules", icon: ScrollText },
  { key: "experiments", label: "Experiments/Tutorials", icon: FlaskConical },
  { key: "assessments", label: "Assessments", icon: ClipboardList },
  { key: "references", label: "References", icon: Library },
  { key: "comments", label: "Comments", icon: MessageSquare },
  { key: "versions", label: "History", icon: ClipboardList },
  { key: "preview", label: "Live Preview", icon: Eye }
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function CurriculumEditor({ courseId }: { courseId: number }) {
  const [active, setActive] = useState<TabKey>("basic");
  const [course, setCourse] = useState<CourseDraft | null>(null);
  const [version, setVersion] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<CourseDraft>(`/courses/${courseId}/`).then(setCourse).catch(console.error);
  }, [courseId]);

  const save = useCallback(async (dataToSave: CourseDraft | null) => {
    if (!dataToSave || !dataToSave.id) return;
    try {
      const res = await apiFetch<{ status: string; course: CourseDraft }>(`/courses/${dataToSave.id}/autosave/`, {
        method: "POST",
        body: JSON.stringify(dataToSave),
      });
      setCourse(res.course);
      setVersion((current) => current + 1);
    } catch (err) {
      console.error("Autosave failed", err);
      throw err;
    }
  }, []);
  
  const autosaveState = useAutosave(course, save, 1500);
  const validation = useMemo(() => course ? validateCourse(course) : { missing: [] }, [course]);

  const handleSubmitForReview = async () => {
    if (!course) return;
    setSubmitting(true);
    try {
      const updated = await apiFetch<CourseDraft>(`/courses/${course.id}/submit/`, {
        method: "POST"
      });
      setCourse(updated);
      alert("Subject syllabus successfully submitted for review!");
    } catch (err: any) {
      alert("Failed to submit for review: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!course) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center p-8 bg-card rounded border border-border shadow-sm space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-xs font-bold text-muted-foreground/60">Loading curriculum ledger from catalog...</span>
      </div>
    );
  }

  const updateCourse = <K extends keyof CourseDraft>(key: K, value: CourseDraft[K]) => setCourse((current) => current ? ({ ...current, [key]: value } as CourseDraft) : null);

  return (
    <div className="grid min-h-[calc(100vh-140px)] gap-0 overflow-hidden rounded border border-border bg-card shadow-sm xl:grid-cols-[1.1fr_0.9fr] animate-fade-in text-left">
      {/* Left Column Form Manuscript Editor */}
      <section className="min-w-0 overflow-hidden bg-card flex flex-col">
        {/* Course identity header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 p-5 bg-background/10">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-serif font-bold text-foreground flex items-center gap-1.5">
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded border border-border/40 font-semibold">{course.code}</span>
                {course.title}
              </h2>
              <StatusBadge status={course.status} />
              <span className={cn(
                "inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[9px] font-bold border", 
                validation.missing.length 
                  ? "bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20" 
                  : "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              )}>
                {validation.missing.length ? `${validation.missing.length} missing` : "Compliant"}
              </span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground/60 flex items-center gap-2 flex-wrap">
              <span>Autosave: <strong className="text-foreground/70">{autosaveState}</strong></span>
              <span>·</span>
              <span>Revision {version}</span>
              <span>·</span>
              <span>Modified: {course.last_modified}</span>
            </div>
          </div>
          
          <div className="flex gap-2 self-start sm:self-center">
            <Button variant="secondary" onClick={() => void save(course)} className="h-8 text-[10px] font-bold tracking-tight uppercase border-border">
              <Save className="h-3 w-3 mr-1" /> Save draft
            </Button>
            <Button onClick={() => void handleSubmitForReview()} disabled={submitting} className="h-8 text-[10px] font-bold tracking-tight uppercase">
              Submit review
            </Button>
          </div>
        </div>

        {/* Dynamic Nav Chapters list */}
        <div className="flex border-b border-border/60 overflow-x-auto bg-secondary/15 px-3 scrollbar-thin">
          {tabs.map(tab => (
            <button 
              key={tab.key} 
              onClick={() => setActive(tab.key)} 
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-3 text-[11px] font-bold border-b border-transparent transition-all uppercase tracking-wider whitespace-nowrap", 
                active === tab.key 
                  ? "border-primary text-primary bg-background" 
                  : "text-foreground/50 hover:text-foreground hover:bg-muted/40"
              )}
            >
              <tab.icon className={cn("h-3 w-3 shrink-0", active === tab.key ? "text-primary" : "text-foreground/35")} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sub-Editor Panels Workspace */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[calc(100vh-270px)] scrollbar-thin">
          {active === "basic" && (
            <Panel title="Basic Details" description="Official catalogue identification and course syllabus preamble.">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Subject Code" value={course.code} onChange={(value) => updateCourse("code", value)} error={!course.code ? "Required" : undefined} />
                <Field label="Subject Name" value={course.title} onChange={(value) => updateCourse("title", value)} error={!course.title ? "Required" : undefined} />
                <Select label="Course Type" value={course.course_type} onChange={(value) => updateCourse("course_type", value as CourseDraft["course_type"])} options={["THEORY", "LAB", "PROJECT", "ELECTIVE", "INTERDISCIPLINARY"]} />
                <Field label="Faculty Coordinator Assigned" value={course.faculty_name} onChange={(value) => updateCourse("faculty_name", value)} />
                <TextArea label="Prerequisites Coursework" value={course.pre_requisites} onChange={(value) => updateCourse("pre_requisites", value)} />
                <TextArea label="Syllabus Preamble / Introduction" value={course.syllabus_intro} onChange={(value) => updateCourse("syllabus_intro", value)} />
                <TextArea className="md:col-span-2" label="Course Learning Objectives" value={course.objectives} onChange={(value) => updateCourse("objectives", value)} error={course.objectives.length < 20 ? "Objective definitions too brief" : undefined} />
              </div>
            </Panel>
          )}

          {active === "teaching" && (
            <Panel title="Teaching Scheme" description="Lecture, tutorial, and practical contact loads, with cumulative credit definitions.">
              <div className="grid gap-5 md:grid-cols-4">
                <NumberField label="Lecture Hours/Week" value={course.lecture_hours} onChange={(value) => updateCourse("lecture_hours", value)} />
                <NumberField label="Tutorial Hours/Week" value={course.tutorial_hours} onChange={(value) => updateCourse("tutorial_hours", value)} />
                <NumberField label="Practical Hours/Week" value={course.practical_hours} onChange={(value) => updateCourse("practical_hours", value)} />
                <div className="hidden md:block"></div>
                <NumberField label="Lecture Credits" value={course.lecture_credits} step="0.5" onChange={(value) => updateCourse("lecture_credits", value)} />
                <NumberField label="Tutorial Credits" value={course.tutorial_credits} step="0.5" onChange={(value) => updateCourse("tutorial_credits", value)} />
                <NumberField label="Practical Credits" value={course.practical_credits} step="0.5" onChange={(value) => updateCourse("practical_credits", value)} />
                <NumberField label="Total Assigned Credits" value={course.credits} step="0.5" onChange={(value) => updateCourse("credits", value)} />
              </div>
            </Panel>
          )}

          {active === "exam" && (
            <Panel title="Examination Scheme" description="Assessment scheme marks, external test durations, and official passing rules.">
              <div className="grid gap-5 md:grid-cols-3">
                <NumberField label="Internal Marks" value={course.internal_marks} onChange={(value) => updateCourse("internal_marks", value)} />
                <NumberField label="External Exam Marks" value={course.external_marks} onChange={(value) => updateCourse("external_marks", value)} />
                <NumberField label="ESE Duration (Hours)" value={course.duration_hours} step="0.5" onChange={(value) => updateCourse("duration_hours", value)} />
              </div>
            </Panel>
          )}

          {active === "outcomes" && <OutcomeEditor outcomes={course.outcomes} onChange={(outcomes) => updateCourse("outcomes", outcomes)} />}
          {active === "modules" && <ModuleEditor modules={course.modules} onChange={(modules) => updateCourse("modules", modules)} />}
          {active === "experiments" && <ExperimentEditor experiments={course.experiments} onChange={(experiments) => updateCourse("experiments", experiments)} />}
          {active === "assessments" && <AssessmentEditor assessments={course.assessments} onChange={(assessments) => updateCourse("assessments", assessments)} />}
          {active === "references" && <ReferenceEditor references={course.reference_books || []} onChange={(references) => updateCourse("reference_books", references)} />}
          {active === "comments" && <CommentsPanel course={course} />}
          {active === "versions" && <VersionsPanel course={course} onRestore={(newCourse) => setCourse(newCourse)} />}
          {active === "preview" && (
            <div className="h-full w-full overflow-hidden rounded border border-border shadow-sm">
              <A4Preview course={course} />
            </div>
          )}
        </div>
      </section>

      {/* Right Column Realistic Print Desk Preview */}
      <aside className="hidden min-w-0 border-l border-border bg-zinc-200 dark:bg-zinc-950/60 xl:flex flex-col">
        <div className="flex h-20 items-center justify-between border-b border-border px-5 bg-card">
          <div className="flex items-center gap-1.5">
            <FileCode className="h-4 w-4 text-primary shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/80">Compliant Print Desk (A4)</span>
          </div>
          <span className="inline-flex items-center rounded-sm text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-500/5 px-2 py-0.5 border border-emerald-500/10">
            Pre-rendering
          </span>
        </div>
        <div className="flex-1 overflow-hidden p-6 flex justify-center academic-desk-bg relative">
          <div className="w-full h-full rounded shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] border border-black/5 bg-white overflow-hidden">
            <A4Preview course={course} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function OutcomeEditor({ outcomes, onChange }: { outcomes: CourseOutcome[]; onChange: (items: CourseOutcome[]) => void }) {
  return (
    <Panel title="Course Outcomes" description="Outcomes must represent clear intellectual competencies, mapped directly to Bloom cognitive domains.">
      <Rows items={outcomes} addLabel="Add Course Outcome" newItem={{ code: `CO${outcomes.length + 1}`, description: "", bloom_level: "Apply", order: outcomes.length + 1 }} onChange={onChange} render={(item, index, update) => (
        <div className="grid gap-4 md:grid-cols-[90px_1fr_160px_auto] items-end">
          <Field label="CO" value={item.code} onChange={(value) => update({ code: value })} />
          <TextArea label="Description of Competency" value={item.description} onChange={(value) => update({ description: value })} error={item.description.length < 12 ? "Outcome description is too short" : undefined} />
          <Field label="Bloom Level" value={item.bloom_level} onChange={(value) => update({ bloom_level: value })} />
          <RemoveButton onClick={() => onChange(outcomes.filter((_, i) => i !== index))} />
        </div>
      )} />
    </Panel>
  );
}

function ModuleEditor({ modules, onChange }: { modules: CourseModule[]; onChange: (items: CourseModule[]) => void }) {
  const updateModule = (index: number, patch: Partial<CourseModule>) => onChange(modules.map((item, i) => i === index ? { ...item, ...patch } : item));
  return (
    <Panel title="Modules" description="Structured modules detailing lecture units, contact durations, and specific syllabus sub-topics.">
      <div className="space-y-4">
        {modules.map((module, index) => (
          <div key={index} className="rounded border border-border bg-card p-5 space-y-4 shadow-sm hover:border-primary/20 transition-all duration-150">
            <div className="grid gap-4 md:grid-cols-[90px_1fr_130px_auto] items-end">
              <NumberField label="§ Module No." value={module.number} onChange={(value) => updateModule(index, { number: value })} />
              <Field label="Module Heading Title" value={module.title} onChange={(value) => updateModule(index, { title: value })} />
              <NumberField label="L-T Hours" value={module.contact_hours} onChange={(value) => updateModule(index, { contact_hours: value })} />
              <RemoveButton onClick={() => onChange(modules.filter((_, i) => i !== index))} />
            </div>
            <TextArea label="Module Content Synopsis" value={module.content} onChange={(value) => updateModule(index, { content: value })} error={module.content.length < 20 ? "Syllabus content is too brief for official publication" : undefined} />
            
            <div className="pt-3.5 space-y-3 border-t border-border/60">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sub-Topic Sections</div>
              <div className="space-y-2">
                {(module.topics ?? []).map((topic, topicIndex) => (
                  <div key={topicIndex} className="grid gap-3 md:grid-cols-[200px_1fr_auto] items-end p-4 rounded-sm bg-background border border-border/60">
                    <Field label="Topic Title" value={topic.title} onChange={(value) => updateModule(index, { topics: (module.topics ?? []).map((t, i) => i === topicIndex ? { ...t, title: value } : t) })} />
                    <Field label="Detail Description" value={topic.description} onChange={(value) => updateModule(index, { topics: (module.topics ?? []).map((t, i) => i === topicIndex ? { ...t, description: value } : t) })} />
                    <RemoveButton onClick={() => updateModule(index, { topics: (module.topics ?? []).filter((_, i) => i !== topicIndex) })} />
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => updateModule(index, { topics: [...(module.topics ?? []), { title: "", description: "" }] })} className="h-8 text-[10px]">
                <Plus className="h-3 w-3 mr-1" /> Add Sub-Topic
              </Button>
            </div>
          </div>
        ))}
        <Button variant="secondary" onClick={() => onChange([...modules, { number: modules.length + 1, title: "", contact_hours: 0, content: "", topics: [] }])} className="w-full">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Syllabus Module Block
        </Button>
      </div>
    </Panel>
  );
}

function ExperimentEditor({ experiments, onChange }: { experiments: Experiment[]; onChange: (items: Experiment[]) => void }) {
  return (
    <Panel title="Experiments/Tutorials" description="Practical laboratory exercises or numeric tutorial chapters.">
      <Rows items={experiments} addLabel="Add Experiment Block" newItem={{ number: experiments.length + 1, title: "", description: "", hours: 2 }} onChange={onChange} render={(item, index, update) => (
        <div className="grid gap-3 md:grid-cols-[90px_1fr_120px_auto] items-end">
          <NumberField label="No." value={item.number} onChange={(value) => update({ number: value })} />
          <TextArea label="Experiment Title &amp; Practical Objective (New line separates title/details)" value={`${item.title}\n${item.description}`} onChange={(value) => { const [title, ...rest] = value.split("\n"); update({ title, description: rest.join("\n") }); }} />
          <NumberField label="Contact Hours" value={item.hours} onChange={(value) => update({ hours: value })} />
          <RemoveButton onClick={() => onChange(experiments.filter((_, i) => i !== index))} />
        </div>
      )} />
    </Panel>
  );
}

function AssessmentEditor({ assessments, onChange }: { assessments: Assessment[]; onChange: (items: Assessment[]) => void }) {
  return (
    <Panel title="Assessments" description="Detailed evaluation mechanisms and marks structures.">
      <Rows items={assessments} addLabel="Add Assessment Component" newItem={{ component: "", marks: 0, description: "" }} onChange={onChange} render={(item, index, update) => (
        <div className="grid gap-3 md:grid-cols-[220px_120px_1fr_auto] items-end">
          <Field label="Assessment Category" value={item.component} onChange={(value) => update({ component: value })} />
          <NumberField label="Maximum Marks" value={item.marks} onChange={(value) => update({ marks: value })} />
          <Field label="Component Description" value={item.description} onChange={(value) => update({ description: value })} />
          <RemoveButton onClick={() => onChange(assessments.filter((_, i) => i !== index))} />
        </div>
      )} />
    </Panel>
  );
}

function ReferenceEditor({ references, onChange }: { references: ReferenceBook[]; onChange: (items: ReferenceBook[]) => void }) {
  return (
    <Panel title="References" description="Official textbooks, recommended reference books, and technical library resources.">
      <Rows items={references} addLabel="Add Reference Resource" newItem={{ title: "", authors: "", publisher: "", edition: "", year: "", is_textbook: false }} onChange={onChange} render={(item, index, update) => (
        <div className="grid gap-4 md:grid-cols-3 items-end">
          <Field label="Resource Book Title" value={item.title} onChange={(value) => update({ title: value })} />
          <Field label="Authors" value={item.authors} onChange={(value) => update({ authors: value })} />
          <Field label="Publisher House" value={item.publisher} onChange={(value) => update({ publisher: value })} />
          <Field label="Edition" value={item.edition} onChange={(value) => update({ edition: value })} />
          <Field label="Year" value={item.year} onChange={(value) => update({ year: value })} />
          <div className="flex items-center justify-between gap-3 h-10 border border-border bg-background px-3.5 rounded-sm">
            <label className="flex items-center gap-2 text-[10px] font-bold text-foreground/75 uppercase tracking-wider select-none cursor-pointer">
              <input type="checkbox" checked={item.is_textbook} onChange={(event) => update({ is_textbook: event.target.checked })} className="rounded text-primary border-border cursor-pointer" />
              Core Textbook
            </label>
            <RemoveButton onClick={() => onChange(references.filter((_, i) => i !== index))} />
          </div>
        </div>
      )} />
    </Panel>
  );
}

function CommentsPanel({ course }: { course: CourseDraft }) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<any>(`/reviewer-comments/?course=${course.id}`)
      .then((data) => setComments(Array.isArray(data) ? data : data.results ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [course.id]);

  const handleResolve = async (commentId: number) => {
    try {
      const resolved = await apiFetch<any>(`/reviewer-comments/${commentId}/resolve/`, { method: "POST" });
      setComments((prev) => prev.map((c) => (c.id === commentId ? resolved : c)));
    } catch {
      alert("Failed to resolve comment.");
    }
  };

  const openCount = comments.filter((c) => !c.is_resolved).length;

  return (
    <Panel title="Reviewer Comments" description={`Syllabus comments submitted by peer reviewers. ${openCount} items require correction.`}>
      {loading ? (
        <div className="py-8 text-center text-xs font-bold text-muted-foreground/50">Querying comment database...</div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-xs font-semibold text-muted-foreground border border-dashed border-border rounded bg-muted/20">
          No reviewer comments registered on this curriculum draft.
        </div>
      ) : (
        <div className="space-y-3.5">
          {comments.map((comment) => (
            <div key={comment.id} className={cn("rounded border p-4 shadow-sm", comment.is_resolved ? "border-emerald-500/20 bg-emerald-500/5" : "border-border bg-card")}>
              <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2 mb-2">
                <div className="font-extrabold text-[11px] text-foreground uppercase tracking-wider">{comment.section_label}</div>
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-sm px-2 py-0.5 text-[9px] font-bold border", comment.is_resolved ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20")}>
                    {comment.is_resolved ? "Resolved" : "Open"}
                  </span>
                  {!comment.is_resolved && (
                    <Button variant="secondary" size="sm" className="h-6 text-[9px] px-2.5 font-bold border-border" onClick={() => void handleResolve(comment.id)}>Resolve</Button>
                  )}
                </div>
              </div>
              <p className="text-xs font-medium text-foreground/75 leading-relaxed">{comment.body}</p>
              <div className="mt-2 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">Reviewer: {comment.reviewer_name}</div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function VersionsPanel({ course, onRestore }: { course: CourseDraft; onRestore: (course: CourseDraft) => void }) {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [diffData, setDiffData] = useState<any>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [compareTarget, setCompareTarget] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<any[]>(`/courses/${course.id}/versions/`)
      .then((data) => setVersions(Array.isArray(data) ? data : (data as any).results ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [course.id]);

  const handleRestore = async (versionId: number) => {
    if (!confirm("Are you sure you want to rollback to this version? This will overwrite your current draft.")) return;
    try {
      const res = await apiFetch<CourseDraft>(`/courses/${course.id}/rollback/`, {
        method: "POST",
        body: JSON.stringify({ version_id: versionId }),
      });
      onRestore(res);
      setDiffData(null);
    } catch (e) {
      alert("Failed to rollback.");
    }
  };

  const handleCompare = async (versionId: number) => {
    if (versions.length < 2) return;
    setDiffLoading(true);
    setCompareTarget(versionId);
    try {
      const targetIdx = versions.findIndex((v) => v.id === versionId);
      const compareWith = versions[targetIdx + 1] ?? versions[0];
      const data = await apiFetch(`/courses/${course.id}/compare_versions/`, {
        method: "POST",
        body: JSON.stringify({ version_a: compareWith.id, version_b: versionId }),
      });
      setDiffData(data);
    } catch (e) {
      alert("Failed to load diff.");
    } finally {
      setDiffLoading(false);
    }
  };

  return (
    <Panel title="Revision History" description="Historical snapshots, side-by-side comparison tables, and rolling rollbacks.">
      {loading ? (
        <div className="py-8 text-center text-xs font-bold text-muted-foreground/50">Loading revision archives...</div>
      ) : (
        <div className="space-y-3">
          {versions.map((v) => (
            <div key={v.id} className={cn("rounded border p-4 shadow-sm transition-all hover:border-primary/20", compareTarget === v.id ? "border-primary/30 bg-primary/5" : "border-border bg-card")}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground/50" />
                    Syllabus Version {v.version_number}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground/60">{new Date(v.created_at).toLocaleString()}</div>
                  {v.change_summary && <div className="text-xs font-semibold text-foreground/75 mt-1">{v.change_summary}</div>}
                  {v.edited_by_name && <div className="text-[9px] font-bold text-primary uppercase tracking-widest">Coordinator: {v.edited_by_name}</div>}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={diffLoading || versions.length < 2}
                    onClick={() => void handleCompare(v.id)}
                    className="h-8 text-[10px] font-bold border-border"
                  >
                    {diffLoading && compareTarget === v.id ? "Loading..." : "Diff Compare"}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => void handleRestore(v.id)} className="h-8 text-[10px] font-bold border-border">Restore</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {diffData && (
        <div className="mt-6 border border-border rounded p-5 bg-secondary/15 animate-fade-in text-left">
          <div className="mb-4 flex items-center justify-between pb-2 border-b border-border">
            <h4 className="font-serif font-bold text-sm text-foreground">
              Syllabus Differences: Version {diffData.version_a?.number} → Version {diffData.version_b?.number}
            </h4>
            <Button variant="ghost" size="sm" onClick={() => setDiffData(null)} className="h-7 text-[10px] font-bold">Close</Button>
          </div>
          {diffData.changes?.length === 0 ? (
            <div className="rounded border border-border bg-card/60 p-6 text-center text-xs font-bold text-muted-foreground">No differences discovered between snapshots.</div>
          ) : (
            <div className="space-y-3">
              {diffData.changes?.map((change: any, i: number) => (
                <div key={i} className="rounded border border-border overflow-hidden bg-card shadow-sm">
                  <div className="bg-muted/80 px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 font-mono">
                    {change.section} &gt; {change.field}
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-border/60 text-xs">
                    <div className="bg-rose-500/5 p-4">
                      <div className="mb-2 text-[9px] font-bold uppercase tracking-widest text-rose-500 font-mono">Before</div>
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap font-medium text-foreground/75 leading-relaxed font-mono">{typeof change.old === "string" ? change.old : JSON.stringify(change.old, null, 2)}</pre>
                    </div>
                    <div className="bg-emerald-500/5 p-4">
                      <div className="mb-2 text-[9px] font-bold uppercase tracking-widest text-emerald-500 font-mono">After</div>
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap font-medium text-foreground/75 leading-relaxed font-mono">{typeof change.new === "string" ? change.new : JSON.stringify(change.new, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

function Rows<T>({ items, newItem, addLabel, onChange, render }: { items: T[]; newItem: T; addLabel: string; onChange: (items: T[]) => void; render: (item: T, index: number, update: (patch: Partial<T>) => void) => React.ReactNode }) {
  return (
    <div className="space-y-3.5">
      {items.map((item, index) => (
        <div key={index} className="rounded border border-border bg-card p-5 shadow-sm hover:border-primary/20 transition-all duration-150">
          {render(item, index, (patch) => onChange(items.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row)))}
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange([...items, newItem])} className="w-full h-10 border-border">
        <Plus className="h-3.5 w-3.5 mr-1.5" />{addLabel}
      </Button>
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="pb-3.5 border-b border-border/80">
        <h3 className="text-base font-serif font-bold text-foreground">{title}</h3>
        <p className="text-xs font-semibold text-muted-foreground/60 leading-relaxed mt-0.5">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <label className="block space-y-1.5 w-full">
      <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">{label}</span>
      <input 
        className={cn(
          "h-10 w-full rounded-sm border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary focus:bg-primary/5", 
          error ? "border-amber-500 focus:ring-amber-500/10 focus:border-amber-500" : "border-border"
        )} 
        value={value} 
        onChange={(event) => onChange(event.target.value)} 
      />
      {error && <span className="block text-[9px] font-bold text-amber-600">{error}</span>}
    </label>
  );
}

// Fixed Loader2 type dependency inside editor layout
function NumberField({ label, value, onChange, step = "1" }: { label: string; value: number | string; onChange: (value: number) => void; step?: string }) {
  return (
    <label className="block space-y-1.5 w-full">
      <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">{label}</span>
      <input 
        className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary focus:bg-primary/5" 
        type="number" 
        step={step} 
        value={value} 
        onChange={(event) => onChange(Number(event.target.value))} 
      />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-1.5 w-full">
      <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">{label}</span>
      <select 
        className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary focus:bg-primary/5 cursor-pointer" 
        value={value} 
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => <option key={option} className="bg-card text-foreground">{option}</option>)}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange, error, className }: { label: string; value: string; onChange: (value: string) => void; error?: string; className?: string }) {
  return (
    <label className={cn("block space-y-1.5 w-full", className)}>
      <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">{label}</span>
      <textarea 
        className={cn(
          "min-h-24 w-full rounded-sm border bg-background p-3 text-xs leading-relaxed transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary focus:bg-primary/5", 
          error ? "border-amber-500 focus:ring-amber-500/10 focus:border-amber-500" : "border-border"
        )} 
        value={value} 
        onChange={(event) => onChange(event.target.value)} 
      />
      {error && <span className="block text-[9px] font-bold text-amber-600">{error}</span>}
    </label>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button 
      type="button" 
      variant="ghost" 
      className="h-9 w-9 p-0 text-foreground/35 hover:text-destructive hover:bg-destructive/10 rounded shrink-0 self-end border-border" 
      aria-label="Remove row" 
      onClick={onClick}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}

function validateCourse(course: CourseDraft) {
  const missing = [
    !course.objectives && "Objectives",
    course.outcomes.length === 0 && "Course outcomes",
    course.modules.length === 0 && "Modules",
    course.assessments.length === 0 && "Assessments",
    (course.reference_books?.length || 0) === 0 && "References"
  ].filter(Boolean) as string[];
  return { missing };
}
