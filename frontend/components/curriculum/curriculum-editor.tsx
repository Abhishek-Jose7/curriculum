"use client";

import { BookOpen, Check, ClipboardList, Eye, FlaskConical, Library, MessageSquare, Plus, Save, ScrollText, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { A4Preview } from "@/components/curriculum/a4-preview";
import { useAutosave } from "@/hooks/use-autosave";
import { sampleCourse } from "@/lib/sample-course";
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
  { key: "preview", label: "Live Preview", icon: Eye }
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function CurriculumEditor({ courseId }: { courseId: number }) {
  const [active, setActive] = useState<TabKey>("basic");
  const [course, setCourse] = useState<CourseDraft>({ ...sampleCourse, id: courseId });
  const [version, setVersion] = useState(7);

  const save = useCallback(async () => {
    setVersion((current) => current + 1);
  }, []);
  const autosaveState = useAutosave(course, save, 900);
  const validation = useMemo(() => validateCourse(course), [course]);

  const updateCourse = <K extends keyof CourseDraft>(key: K, value: CourseDraft[K]) => setCourse((current) => ({ ...current, [key]: value }));
  const updateNested = <K extends keyof CourseDraft>(key: K, value: Partial<CourseDraft[K]>) => setCourse((current) => ({ ...current, [key]: { ...(current[key] as object), ...value } as CourseDraft[K] }));

  return (
    <div className="grid min-h-[calc(100vh-104px)] gap-0 overflow-hidden rounded-md border border-border xl:grid-cols-[minmax(560px,1fr)_minmax(460px,0.9fr)]">
      <section className="min-w-0 overflow-hidden bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold">{course.code} {course.title}</h2>
              <StatusBadge status={course.status} />
              <span className={cn("rounded px-2 py-1 text-xs font-semibold", validation.missing.length ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800")}>
                {validation.missing.length ? `${validation.missing.length} sections missing` : "Validation clear"}
              </span>
            </div>
            <div className="mt-1 text-sm text-foreground/60">Autosave: {autosaveState} · Version {version} · Last modified {course.last_modified}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void save()}><Save className="h-4 w-4" />Save</Button>
            <Button>Submit for Review</Button>
          </div>
        </div>

        <div className="flex overflow-x-auto border-b border-border bg-muted/35">
          {tabs.map((tab) => (
            <button key={tab.key} className={cn("flex h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm", active === tab.key ? "border-primary bg-background text-primary" : "border-transparent text-foreground/70 hover:bg-background/70")} onClick={() => setActive(tab.key)}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="h-[calc(100vh-220px)] overflow-auto p-4">
          {active === "basic" && (
            <Panel title="Basic Details" description="Official catalogue identity and syllabus preamble.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Course Code" value={course.code} onChange={(value) => updateCourse("code", value)} error={!course.code ? "Required" : undefined} />
                <Field label="Course Name" value={course.title} onChange={(value) => updateCourse("title", value)} error={!course.title ? "Required" : undefined} />
                <Select label="Course Type" value={course.course_type} onChange={(value) => updateCourse("course_type", value as CourseDraft["course_type"])} options={["THEORY", "LAB", "PROJECT", "ELECTIVE", "INTERDISCIPLINARY"]} />
                <Field label="Faculty Assigned" value={course.faculty_name} onChange={(value) => updateCourse("faculty_name", value)} />
                <TextArea label="Prerequisites" value={course.pre_requisites} onChange={(value) => updateCourse("pre_requisites", value)} />
                <TextArea label="Syllabus Introduction" value={course.syllabus_intro} onChange={(value) => updateCourse("syllabus_intro", value)} />
                <TextArea className="md:col-span-2" label="Course Objectives" value={course.objectives} onChange={(value) => updateCourse("objectives", value)} error={course.objectives.length < 20 ? "Add measurable objectives" : undefined} />
              </div>
            </Panel>
          )}

          {active === "teaching" && (
            <Panel title="Teaching Scheme" description="Lecture, tutorial, practical load, and credit values used in semester structure pages.">
              <div className="grid gap-4 md:grid-cols-4">
                <NumberField label="Lecture Hours" value={course.teaching.lecture_hours} onChange={(value) => updateNested("teaching", { lecture_hours: value })} />
                <NumberField label="Tutorial Hours" value={course.teaching.tutorial_hours} onChange={(value) => updateNested("teaching", { tutorial_hours: value })} />
                <NumberField label="Practical Hours" value={course.teaching.practical_hours} onChange={(value) => updateNested("teaching", { practical_hours: value })} />
                <NumberField label="Credits" value={course.teaching.credits} step="0.5" onChange={(value) => updateNested("teaching", { credits: value })} />
              </div>
            </Panel>
          )}

          {active === "exam" && (
            <Panel title="Examination Scheme" description="Marks, duration, and passing rules rendered into the official scheme table.">
              <div className="grid gap-4 md:grid-cols-4">
                <NumberField label="Internal Marks" value={course.examination.internal_marks} onChange={(value) => updateNested("examination", { internal_marks: value })} />
                <NumberField label="External Marks" value={course.examination.external_marks} onChange={(value) => updateNested("examination", { external_marks: value })} />
                <NumberField label="Duration Hours" value={course.examination.duration_hours} step="0.5" onChange={(value) => updateNested("examination", { duration_hours: value })} />
                <NumberField label="Passing Marks" value={course.examination.passing_marks} onChange={(value) => updateNested("examination", { passing_marks: value })} />
              </div>
            </Panel>
          )}

          {active === "outcomes" && <OutcomeEditor outcomes={course.outcomes} onChange={(outcomes) => updateCourse("outcomes", outcomes)} />}
          {active === "modules" && <ModuleEditor modules={course.modules} onChange={(modules) => updateCourse("modules", modules)} />}
          {active === "experiments" && <ExperimentEditor experiments={course.experiments} onChange={(experiments) => updateCourse("experiments", experiments)} />}
          {active === "assessments" && <AssessmentEditor assessments={course.assessments} onChange={(assessments) => updateCourse("assessments", assessments)} />}
          {active === "references" && <ReferenceEditor references={course.references} onChange={(references) => updateCourse("references", references)} />}
          {active === "comments" && <CommentsPanel course={course} />}
          {active === "preview" && <A4Preview course={course} />}
        </div>
      </section>

      <aside className="hidden min-w-0 border-l border-border bg-muted/40 xl:block">
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <div className="font-medium">Live Rendered Curriculum Pages</div>
          <span className="text-xs text-foreground/60">A4 · print CSS simulation · overflow visible</span>
        </div>
        <div className="h-[calc(100vh-153px)]">
          <A4Preview course={course} />
        </div>
      </aside>
    </div>
  );
}

function OutcomeEditor({ outcomes, onChange }: { outcomes: CourseOutcome[]; onChange: (items: CourseOutcome[]) => void }) {
  return (
    <Panel title="Course Outcomes" description="Each outcome must be measurable and mapped to Bloom level.">
      <Rows items={outcomes} addLabel="Add Outcome" newItem={{ code: `CO${outcomes.length + 1}`, description: "", bloom_level: "Apply", order: outcomes.length + 1 }} onChange={onChange} render={(item, index, update) => (
        <div className="grid gap-3 md:grid-cols-[90px_1fr_160px_auto]">
          <Field label="CO" value={item.code} onChange={(value) => update({ code: value })} />
          <TextArea label="Description" value={item.description} onChange={(value) => update({ description: value })} error={item.description.length < 12 ? "Describe a measurable outcome" : undefined} />
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
    <Panel title="Modules" description="Structured syllabus modules with nested topics and controlled contact hours.">
      <div className="space-y-4">
        {modules.map((module, index) => (
          <div key={index} className="rounded-md border border-border p-3">
            <div className="grid gap-3 md:grid-cols-[90px_1fr_140px_auto]">
              <NumberField label="No." value={module.number} onChange={(value) => updateModule(index, { number: value })} />
              <Field label="Module Title" value={module.title} onChange={(value) => updateModule(index, { title: value })} />
              <NumberField label="Hours" value={module.contact_hours} onChange={(value) => updateModule(index, { contact_hours: value })} />
              <RemoveButton onClick={() => onChange(modules.filter((_, i) => i !== index))} />
            </div>
            <TextArea className="mt-3" label="Module Content" value={module.content} onChange={(value) => updateModule(index, { content: value })} error={module.content.length < 20 ? "Module content is too short for official syllabus" : undefined} />
            <div className="mt-3 space-y-2">
              <div className="text-sm font-medium">Topics</div>
              {(module.topics ?? []).map((topic, topicIndex) => (
                <div key={topicIndex} className="grid gap-2 md:grid-cols-[220px_1fr_auto]">
                  <Field label="Topic" value={topic.title} onChange={(value) => updateModule(index, { topics: (module.topics ?? []).map((t, i) => i === topicIndex ? { ...t, title: value } : t) })} />
                  <Field label="Description" value={topic.description} onChange={(value) => updateModule(index, { topics: (module.topics ?? []).map((t, i) => i === topicIndex ? { ...t, description: value } : t) })} />
                  <RemoveButton onClick={() => updateModule(index, { topics: (module.topics ?? []).filter((_, i) => i !== topicIndex) })} />
                </div>
              ))}
              <Button variant="secondary" onClick={() => updateModule(index, { topics: [...(module.topics ?? []), { title: "", description: "" }] })}><Plus className="h-4 w-4" />Add Topic</Button>
            </div>
          </div>
        ))}
        <Button variant="secondary" onClick={() => onChange([...modules, { number: modules.length + 1, title: "", contact_hours: 0, content: "", topics: [] }])}><Plus className="h-4 w-4" />Add Module</Button>
      </div>
    </Panel>
  );
}

function ExperimentEditor({ experiments, onChange }: { experiments: Experiment[]; onChange: (items: Experiment[]) => void }) {
  return (
    <Panel title="Experiments/Tutorials" description="Lab or tutorial work rendered as numbered practical/tutorial rows.">
      <Rows items={experiments} addLabel="Add Experiment" newItem={{ number: experiments.length + 1, title: "", description: "", hours: 2 }} onChange={onChange} render={(item, index, update) => (
        <div className="grid gap-3 md:grid-cols-[90px_1fr_120px_auto]">
          <NumberField label="No." value={item.number} onChange={(value) => update({ number: value })} />
          <TextArea label="Experiment / Tutorial" value={`${item.title}\n${item.description}`} onChange={(value) => { const [title, ...rest] = value.split("\n"); update({ title, description: rest.join("\n") }); }} />
          <NumberField label="Hours" value={item.hours} onChange={(value) => update({ hours: value })} />
          <RemoveButton onClick={() => onChange(experiments.filter((_, i) => i !== index))} />
        </div>
      )} />
    </Panel>
  );
}

function AssessmentEditor({ assessments, onChange }: { assessments: Assessment[]; onChange: (items: Assessment[]) => void }) {
  return (
    <Panel title="Assessments" description="Assessment components and marks must reconcile with the examination scheme.">
      <Rows items={assessments} addLabel="Add Assessment" newItem={{ component: "", marks: 0, description: "" }} onChange={onChange} render={(item, index, update) => (
        <div className="grid gap-3 md:grid-cols-[220px_120px_1fr_auto]">
          <Field label="Component" value={item.component} onChange={(value) => update({ component: value })} />
          <NumberField label="Marks" value={item.marks} onChange={(value) => update({ marks: value })} />
          <Field label="Description" value={item.description} onChange={(value) => update({ description: value })} />
          <RemoveButton onClick={() => onChange(assessments.filter((_, i) => i !== index))} />
        </div>
      )} />
    </Panel>
  );
}

function ReferenceEditor({ references, onChange }: { references: ReferenceBook[]; onChange: (items: ReferenceBook[]) => void }) {
  return (
    <Panel title="References" description="Textbooks, reference books, standards, and online resources for the official references table.">
      <Rows items={references} addLabel="Add Reference" newItem={{ title: "", authors: "", publisher: "", edition: "", year: "", is_textbook: false }} onChange={onChange} render={(item, index, update) => (
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Title" value={item.title} onChange={(value) => update({ title: value })} />
          <Field label="Authors" value={item.authors} onChange={(value) => update({ authors: value })} />
          <Field label="Publisher" value={item.publisher} onChange={(value) => update({ publisher: value })} />
          <Field label="Edition" value={item.edition} onChange={(value) => update({ edition: value })} />
          <Field label="Year" value={item.year} onChange={(value) => update({ year: value })} />
          <div className="flex items-end justify-between gap-3">
            <label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" checked={item.is_textbook} onChange={(event) => update({ is_textbook: event.target.checked })} />Textbook</label>
            <RemoveButton onClick={() => onChange(references.filter((_, i) => i !== index))} />
          </div>
        </div>
      )} />
    </Panel>
  );
}

function CommentsPanel({ course }: { course: CourseDraft }) {
  return (
    <Panel title="Reviewer Comments" description="Structured comments attached to official curriculum sections.">
      <div className="space-y-3">
        {course.comments.map((comment) => (
          <div key={comment.id} className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{comment.section_label}</div>
              <span className={cn("rounded px-2 py-1 text-xs", comment.is_resolved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>{comment.is_resolved ? "Resolved" : "Open"}</span>
            </div>
            <p className="mt-2 text-sm text-foreground/75">{comment.body}</p>
            <div className="mt-2 text-xs text-foreground/55">{comment.reviewer_name}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Rows<T>({ items, newItem, addLabel, onChange, render }: { items: T[]; newItem: T; addLabel: string; onChange: (items: T[]) => void; render: (item: T, index: number, update: (patch: Partial<T>) => void) => React.ReactNode }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-md border border-border p-3">
          {render(item, index, (patch) => onChange(items.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row)))}
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange([...items, newItem])}><Plus className="h-4 w-4" />{addLabel}</Button>
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-foreground/60">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <label>
      <span className="text-sm font-medium">{label}</span>
      <input className={cn("mt-1 h-10 w-full rounded-md border bg-background px-3", error ? "border-amber-500" : "border-border")} value={value} onChange={(event) => onChange(event.target.value)} />
      {error && <span className="mt-1 block text-xs text-amber-700">{error}</span>}
    </label>
  );
}

function NumberField({ label, value, onChange, step = "1" }: { label: string; value: number; onChange: (value: number) => void; step?: string }) {
  return (
    <label>
      <span className="text-sm font-medium">{label}</span>
      <input className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" type="number" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-sm font-medium">{label}</span>
      <select className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange, error, className }: { label: string; value: string; onChange: (value: string) => void; error?: string; className?: string }) {
  return (
    <label className={className}>
      <span className="text-sm font-medium">{label}</span>
      <textarea className={cn("mt-1 min-h-24 w-full rounded-md border bg-background p-3", error ? "border-amber-500" : "border-border")} value={value} onChange={(event) => onChange(event.target.value)} />
      {error && <span className="mt-1 block text-xs text-amber-700">{error}</span>}
    </label>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return <Button type="button" variant="ghost" className="self-end px-2" aria-label="Remove row" onClick={onClick}><Trash2 className="h-4 w-4" /></Button>;
}

function validateCourse(course: CourseDraft) {
  const missing = [
    !course.objectives && "Objectives",
    course.outcomes.length === 0 && "Course outcomes",
    course.modules.length === 0 && "Modules",
    course.assessments.length === 0 && "Assessments",
    course.references.length === 0 && "References"
  ].filter(Boolean) as string[];
  return { missing };
}
