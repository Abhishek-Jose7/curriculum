"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { RoleGuard } from "@/components/layout/role-guard";
import { useAuth } from "@/context";
import { apiFetch } from "@/lib/api";
import type {
  CurriculumScheme,
  SchemeCourseRow,
  Vertical,
  SubVertical,
  TeachingComponentType,
  TeachingComponentRow,
} from "@/types/scheme";
import { VERTICAL_SUBVERTICALS } from "@/types/scheme";
import { Button } from "@/components/ui/button";
import {
  Layers,
  ArrowLeft,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  Lock,
  Unlock,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import "@/styles/scheme-authoring-tokens.css";

interface ComponentDraft {
  component_type: TeachingComponentType;
  hours: number;
  ise_marks?: number;
  mse_marks?: number;
  ese_min_marks?: number;
  ese_max_marks?: number;
  credit_points: number;
}

const VERTICAL_OPTIONS: Vertical[] = ["BSESC", "PCPEC", "MDC", "SC", "HSSM", "EL", "LLC", "BC"];
const COMPONENT_TYPES: TeachingComponentType[] = ["TH", "TU", "PR", "SL"];

export default function SchemeAuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [scheme, setScheme] = useState<CurriculumScheme | null>(null);
  const [activeSem, setActiveSem] = useState<number>(1);
  const [courses, setCourses] = useState<SchemeCourseRow[]>([]);
  const [loadingScheme, setLoadingScheme] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [finishingSem, setFinishingSem] = useState(false);

  // Add Subject Form State
  const [vertical, setVertical] = useState<Vertical>("BSESC");
  const [subVertical, setSubVertical] = useState<SubVertical>("BSC");
  const [title, setTitle] = useState("");
  const [codeMode, setCodeMode] = useState<"auto" | "custom">("auto");
  const [customCode, setCustomCode] = useState("");
  const [components, setComponents] = useState<ComponentDraft[]>([
    { component_type: "TH", hours: 3, ise_marks: 20, mse_marks: 30, ese_min_marks: 20, ese_max_marks: 50, credit_points: 3 },
  ]);

  // Edit Shell Modal State
  const [editingCourse, setEditingCourse] = useState<SchemeCourseRow | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editVertical, setEditVertical] = useState<Vertical>("BSESC");
  const [editSubVertical, setEditSubVertical] = useState<SubVertical>("BSC");
  const [editCode, setEditCode] = useState("");
  const [editComponents, setEditComponents] = useState<ComponentDraft[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    loadScheme();
  }, [id]);

  useEffect(() => {
    if (scheme) {
      loadCourses(activeSem);
    }
  }, [scheme, activeSem]);

  async function loadScheme() {
    try {
      setLoadingScheme(true);
      setError("");
      const data = await apiFetch<CurriculumScheme>(`/curriculum-schemes/${id}/`);
      setScheme(data);
    } catch (err: any) {
      setError(err.message || "Failed to load scheme.");
    } finally {
      setLoadingScheme(false);
    }
  }

  async function loadCourses(semNumber: number) {
    try {
      setLoadingCourses(true);
      const data = await apiFetch<SchemeCourseRow[]>(`/curriculum-schemes/${id}/semesters/${semNumber}/courses/`);
      setCourses(data);
    } catch (err: any) {
      console.error("Failed to load semester courses:", err);
    } finally {
      setLoadingCourses(false);
    }
  }

  function handleVerticalChange(v: Vertical) {
    setVertical(v);
    const subOpts = VERTICAL_SUBVERTICALS[v];
    if (subOpts && subOpts.length > 0) {
      setSubVertical(subOpts[0]);
    }
  }

  function handleAddComponent() {
    const usedTypes = components.map((c) => c.component_type);
    const available = COMPONENT_TYPES.find((t) => !usedTypes.includes(t));
    if (!available) return;

    let defaultHours = 2;
    let defaultCredits = 1;
    let ise = 25;
    let mse = 0;
    let eseMin = 20;
    let eseMax = 25;

    if (available === "TU") {
      defaultHours = 1;
      defaultCredits = 1;
      ise = 25;
      mse = 0;
      eseMin = 0;
      eseMax = 0;
    } else if (available === "PR") {
      defaultHours = 2;
      defaultCredits = 1;
      ise = 25;
      mse = 0;
      eseMin = 20;
      eseMax = 25;
    } else if (available === "SL") {
      defaultHours = 2;
      defaultCredits = 1;
      ise = 25;
      mse = 0;
      eseMin = 0;
      eseMax = 0;
    }

    setComponents([
      ...components,
      {
        component_type: available,
        hours: defaultHours,
        ise_marks: ise,
        mse_marks: mse,
        ese_min_marks: eseMin,
        ese_max_marks: eseMax,
        credit_points: defaultCredits,
      },
    ]);
  }

  function handleRemoveComponent(index: number) {
    if (components.length <= 1) return;
    setComponents(components.filter((_, i) => i !== index));
  }

  function handleComponentChange(index: number, field: keyof ComponentDraft, val: any) {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: val };
    setComponents(updated);
  }

  async function handleAddSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Course title is required.");
      return;
    }
    if (components.length === 0) {
      setError("At least one component is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload: any = {
        scheme_id: id,
        semester_number: activeSem,
        vertical,
        sub_vertical: subVertical,
        title: title.trim(),
        components: components.map((c) => ({
          component_type: c.component_type,
          hours: Number(c.hours) || 0,
          ise_marks: Number(c.ise_marks) || 0,
          mse_marks: Number(c.mse_marks) || 0,
          ese_min_marks: Number(c.ese_min_marks) || 0,
          ese_max_marks: Number(c.ese_max_marks) || 0,
          credit_points: Number(c.credit_points) || 0,
        })),
      };

      if (codeMode === "custom" && customCode.trim()) {
        payload.code = customCode.trim();
      }

      await apiFetch("/courses/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Reset form
      setTitle("");
      setCustomCode("");
      setCodeMode("auto");
      setComponents([
        { component_type: "TH", hours: 3, ise_marks: 20, mse_marks: 30, ese_min_marks: 20, ese_max_marks: 50, credit_points: 3 },
      ]);

      await loadCourses(activeSem);
      await loadScheme();
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        setError(parsed.detail || parsed.error || "Failed to create subject shell.");
      } catch {
        setError(err.message || "Failed to create subject shell.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFinishSemester() {
    try {
      setFinishingSem(true);
      setError("");
      await apiFetch(`/curriculum-schemes/${id}/semesters/${activeSem}/finish-shell`, {
        method: "PATCH",
      });

      await loadScheme();
      if (activeSem < 8) {
        setActiveSem(activeSem + 1);
      }
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        setError(parsed.detail || parsed.error || "Failed to mark semester complete.");
      } catch {
        setError(err.message || "Failed to mark semester complete.");
      }
    } finally {
      setFinishingSem(false);
    }
  }

  function openEditModal(course: SchemeCourseRow) {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditVertical(course.vertical || "BSESC");
    setEditSubVertical(course.sub_vertical || "BSC");
    setEditCode(course.code);
    setEditComponents(
      (course.components || []).map((c) => ({
        component_type: c.component_type,
        hours: c.hours,
        ise_marks: c.ise_marks ?? 0,
        mse_marks: c.mse_marks ?? 0,
        ese_min_marks: c.ese_min_marks ?? 0,
        ese_max_marks: c.ese_max_marks ?? 0,
        credit_points: c.credit_points ?? 0,
      }))
    );
    setEditError("");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      setSavingEdit(true);
      setEditError("");

      const payload = {
        title: editTitle.trim(),
        vertical: editVertical,
        sub_vertical: editSubVertical,
        code: editCode.trim(),
        code_is_custom: editingCourse.code_is_custom,
        components: editComponents.map((c) => ({
          component_type: c.component_type,
          hours: Number(c.hours) || 0,
          ise_marks: Number(c.ise_marks) || 0,
          mse_marks: Number(c.mse_marks) || 0,
          ese_min_marks: Number(c.ese_min_marks) || 0,
          ese_max_marks: Number(c.ese_max_marks) || 0,
          credit_points: Number(c.credit_points) || 0,
        })),
      };

      await apiFetch(`/courses/${editingCourse.id}/shell`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setEditingCourse(null);
      await loadCourses(activeSem);
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        setEditError(parsed.detail || parsed.error || "Failed to update course shell.");
      } catch {
        setEditError(err.message || "Failed to update course shell.");
      }
    } finally {
      setSavingEdit(false);
    }
  }

  // Calculate live summary stats for right table
  const summary = courses.reduce(
    (acc, course) => {
      for (const comp of course.components || []) {
        if (comp.component_type === "TH") acc.thHours += comp.hours || 0;
        if (comp.component_type === "TU") acc.tuHours += comp.hours || 0;
        if (comp.component_type === "PR") acc.prHours += comp.hours || 0;
        if (comp.component_type === "SL") acc.slHours += comp.hours || 0;
        acc.totalMarks += (comp.ise_marks || 0) + (comp.mse_marks || 0) + (comp.ese_max_marks || 0);
        acc.totalCredits += Number(comp.credit_points) || 0;
      }
      return acc;
    },
    { thHours: 0, tuHours: 0, prHours: 0, slHours: 0, totalMarks: 0, totalCredits: 0 }
  );

  const activeSemMeta = scheme?.semesters?.find((s) => s.number === activeSem);

  if (loadingScheme) {
    return (
      <RoleGuard allowed={["ADMIN", "HOD"]}>
        <AppShell>
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#A6763A]" />
          </div>
        </AppShell>
      </RoleGuard>
    );
  }

  if (!scheme) {
    return (
      <RoleGuard allowed={["ADMIN", "HOD"]}>
        <AppShell>
          <div className="max-w-4xl mx-auto p-6 text-center">
            <p className="text-red-600 font-semibold mb-4">Curriculum scheme not found.</p>
            <Button onClick={() => router.push("/admin/schemes")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Schemes
            </Button>
          </div>
        </AppShell>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowed={["ADMIN", "HOD"]}>
      <AppShell>
        <div className="max-w-7xl mx-auto space-y-4 sa-container p-3 sm:p-5 rounded-lg">
          {/* Top Bar / Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 sa-border">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/schemes")}
                className="h-8 px-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Schemes
              </Button>
              <div className="h-4 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-bold sa-display flex items-center gap-2">
                  <span>Entering Year: {scheme.entering_year}</span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-normal bg-zinc-100 dark:bg-zinc-800">
                    Prefix: {scheme.scheme_year_code}
                  </span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/admin/schemes/${scheme.id}/unlock`)}
                className="text-xs gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" /> Unlock Console
              </Button>
            </div>
          </div>

          {/* 8-Semester Tab Strip */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((semNum) => {
              const semData = scheme.semesters?.find((s) => s.number === semNum);
              const isFinished = Boolean(semData?.shell_completed_at);
              const isActive = activeSem === semNum;

              return (
                <button
                  key={semNum}
                  onClick={() => setActiveSem(semNum)}
                  className={`flex flex-col items-center py-2 px-1 rounded-md text-xs font-semibold transition-colors relative ${
                    isActive
                      ? "bg-white dark:bg-zinc-900 shadow-sm text-[#1B2430] dark:text-zinc-100"
                      : "text-zinc-600 hover:bg-white/50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>Sem {semNum}</span>
                    {isFinished && <CheckCircle className="w-3 h-3 text-[#2F6B4F]" />}
                  </div>
                  <span className="text-[10px] font-normal text-zinc-500">
                    {semData?.course_count || 0} subjects
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="p-3 text-sm rounded border border-red-200 bg-red-50 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Split-Screen Authoring Area */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Panel: Add Subject Form (420px width) */}
            <div className="w-full lg:w-[420px] flex-shrink-0 bg-white dark:bg-zinc-900 border sa-border rounded-lg p-4 sm:p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b pb-2.5 sa-border">
                <h2 className="font-bold text-sm sa-display">
                  Add Subject — Sem {activeSem}
                </h2>
                {activeSemMeta?.shell_completed_at && (
                  <span className="text-[11px] text-[#2F6B4F] flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Shell Finished
                  </span>
                )}
              </div>

              <form onSubmit={handleAddSubject} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: "var(--sa-slate)" }}>
                      Vertical
                    </label>
                    <select
                      className="w-full border rounded px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 sa-border"
                      value={vertical}
                      onChange={(e) => handleVerticalChange(e.target.value as Vertical)}
                    >
                      {VERTICAL_OPTIONS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: "var(--sa-slate)" }}>
                      Sub-Vertical
                    </label>
                    <select
                      className="w-full border rounded px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 sa-border"
                      value={subVertical}
                      onChange={(e) => setSubVertical(e.target.value as SubVertical)}
                    >
                      {(VERTICAL_SUBVERTICALS[vertical] || []).map((sv) => (
                        <option key={sv} value={sv}>{sv}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: "var(--sa-slate)" }}>
                    Course Title
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 sa-border"
                    placeholder="e.g. Engineering Mathematics II"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Code Generation Mode */}
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: "var(--sa-slate)" }}>
                    Course Code
                  </label>
                  <div className="flex items-center gap-4 text-xs mb-1.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="codeMode"
                        checked={codeMode === "auto"}
                        onChange={() => setCodeMode("auto")}
                      />
                      <span>Auto-generate</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="codeMode"
                        checked={codeMode === "custom"}
                        onChange={() => setCodeMode("custom")}
                      />
                      <span>Custom</span>
                    </label>
                  </div>
                  {codeMode === "custom" && (
                    <input
                      type="text"
                      className="w-full border rounded px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-zinc-900 sa-border"
                      placeholder="e.g. 26BSC11EC01"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                      required
                    />
                  )}
                </div>

                {/* Teaching Components */}
                <div className="space-y-2 pt-2 border-t sa-border">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold" style={{ color: "var(--sa-slate)" }}>
                      Teaching Components ({components.length})
                    </label>
                    {components.length < 4 && (
                      <button
                        type="button"
                        onClick={handleAddComponent}
                        className="text-xs text-[#A6763A] hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add Component
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {components.map((comp, idx) => (
                      <div key={idx} className="p-2 rounded border sa-border bg-zinc-50 dark:bg-zinc-800/40 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <select
                            className="border rounded px-1.5 py-0.5 text-xs font-semibold bg-white dark:bg-zinc-900 sa-border"
                            value={comp.component_type}
                            onChange={(e) => handleComponentChange(idx, "component_type", e.target.value as TeachingComponentType)}
                          >
                            {COMPONENT_TYPES.map((t) => (
                              <option key={t} value={t} disabled={components.some((c, cIdx) => cIdx !== idx && c.component_type === t)}>
                                {t} ({t === "TH" ? "Theory" : t === "TU" ? "Tutorial" : t === "PR" ? "Practical" : "Self-Learning"})
                              </option>
                            ))}
                          </select>
                          {components.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveComponent(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          <div>
                            <span className="text-[10px] text-zinc-500 block">Hrs/Wk</span>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              className="w-full border rounded px-1.5 py-0.5 text-xs text-center sa-border bg-white dark:bg-zinc-900"
                              value={comp.hours}
                              onChange={(e) => handleComponentChange(idx, "hours", Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 block">Credits</span>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="10"
                              className="w-full border rounded px-1.5 py-0.5 text-xs text-center font-bold sa-border bg-white dark:bg-zinc-900"
                              value={comp.credit_points}
                              onChange={(e) => handleComponentChange(idx, "credit_points", Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 block">Marks</span>
                            <div className="text-center font-mono py-0.5">
                              {(Number(comp.ise_marks) || 0) + (Number(comp.mse_marks) || 0) + (Number(comp.ese_max_marks) || 0)}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-1 text-[10px]">
                          <div>
                            <span className="text-zinc-400 block">ISE</span>
                            <input
                              type="number"
                              className="w-full border rounded px-1 py-0.5 text-center sa-border bg-white dark:bg-zinc-900"
                              value={comp.ise_marks ?? ""}
                              onChange={(e) => handleComponentChange(idx, "ise_marks", Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <span className="text-zinc-400 block">MSE</span>
                            <input
                              type="number"
                              className="w-full border rounded px-1 py-0.5 text-center sa-border bg-white dark:bg-zinc-900"
                              value={comp.mse_marks ?? ""}
                              onChange={(e) => handleComponentChange(idx, "mse_marks", Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <span className="text-zinc-400 block">ESE Min</span>
                            <input
                              type="number"
                              className="w-full border rounded px-1 py-0.5 text-center sa-border bg-white dark:bg-zinc-900"
                              value={comp.ese_min_marks ?? ""}
                              onChange={(e) => handleComponentChange(idx, "ese_min_marks", Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <span className="text-zinc-400 block">ESE Max</span>
                            <input
                              type="number"
                              className="w-full border rounded px-1 py-0.5 text-center sa-border bg-white dark:bg-zinc-900"
                              value={comp.ese_max_marks ?? ""}
                              onChange={(e) => handleComponentChange(idx, "ese_max_marks", Number(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full text-xs bg-[#1B2430] hover:bg-[#2A374A] text-white"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                  Add Subject Shell
                </Button>
              </form>

              {/* Finish Semester Button */}
              <div className="pt-3 border-t sa-border space-y-2">
                <Button
                  variant="outline"
                  onClick={handleFinishSemester}
                  disabled={finishingSem || courses.length === 0}
                  className="w-full text-xs border-[#2F6B4F] text-[#2F6B4F] hover:bg-[#2F6B4F]/10"
                >
                  {finishingSem ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  )}
                  Finish Semester {activeSem} Shell
                </Button>
                <p className="text-[11px] text-center" style={{ color: "var(--sa-slate)" }}>
                  Marks Sem {activeSem} complete and advances to next semester.
                </p>
              </div>
            </div>

            {/* Right Panel: Live Structure Table Preview */}
            <div className="flex-1 w-full bg-white dark:bg-zinc-900 border sa-border rounded-lg p-4 sm:p-5 space-y-4 shadow-sm overflow-x-auto">
              <div className="flex items-center justify-between border-b pb-2.5 sa-border">
                <div>
                  <h2 className="font-bold text-base sa-display">
                    Semester {activeSem} Structure Preview
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Live layout view matching autonomous handbook publishing specification.
                  </p>
                </div>
                <div className="text-xs font-mono px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800">
                  {courses.length} {courses.length === 1 ? "course" : "courses"}
                </div>
              </div>

              {loadingCourses ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#A6763A]" />
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed sa-border rounded-lg">
                  <p className="text-sm font-semibold text-zinc-500">No subjects in Semester {activeSem} yet.</p>
                  <p className="text-xs text-zinc-400 mt-1">Use the form on the left to add course shells.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-zinc-900 dark:border-zinc-100 text-[11px] font-bold">
                        <th className="py-2 px-2">Code</th>
                        <th className="py-2 px-2">Vertical</th>
                        <th className="py-2 px-2">Sub-V</th>
                        <th className="py-2 px-3">Course Name</th>
                        <th className="py-2 px-2 text-center">Notional (TH/TU/PR/SL)</th>
                        <th className="py-2 px-2 text-center">Marks (ISE/MSE/ESE)</th>
                        <th className="py-2 px-2 text-center">Credits</th>
                        <th className="py-2 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {courses.map((c) => {
                        const comps = c.components || [];
                        const cTotalCredits = comps.reduce((sum, cp) => sum + (Number(cp.credit_points) || 0), 0);
                        const cTotalMarks = comps.reduce((sum, cp) => sum + (Number(cp.ise_marks) || 0) + (Number(cp.mse_marks) || 0) + (Number(cp.ese_max_marks) || 0), 0);

                        return (
                          <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                            <td className="py-2.5 px-2 font-mono font-bold">{c.code}</td>
                            <td className="py-2.5 px-2">{c.vertical || "-"}</td>
                            <td className="py-2.5 px-2 font-semibold">{c.sub_vertical || "-"}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-medium">{c.title}</div>
                              {c.faculty_name && (
                                <div className="text-[10px] text-zinc-500">
                                  Teacher: {c.faculty_name}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <div className="flex flex-col gap-0.5 items-center">
                                {comps.map((cp, idx) => (
                                  <span key={idx} className="font-mono text-[11px]">
                                    {cp.component_type}: {cp.hours}h
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <div className="flex flex-col gap-0.5 items-center font-mono text-[11px]">
                                {comps.map((cp, idx) => {
                                  const mTotal = (cp.ise_marks || 0) + (cp.mse_marks || 0) + (cp.ese_max_marks || 0);
                                  return (
                                    <span key={idx}>
                                      {cp.component_type}: {cp.ise_marks || 0}/{cp.mse_marks || 0}/{cp.ese_max_marks || 0} ({mTotal})
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold font-mono">
                              {cTotalCredits}
                            </td>
                            <td className="py-2.5 px-2 text-right">
                              <button
                                onClick={() => openEditModal(c)}
                                className="p-1 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                                title="Edit shell"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Summary Bar */}
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg border sa-border flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="font-mono">
                      <strong>Hours Ratio:</strong> TH:TU:PR:SL = {summary.thHours}:{summary.tuHours}:{summary.prHours}:{summary.slHours}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500">Total Marks:</span>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            summary.totalMarks === 1000
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {summary.totalMarks} / 1000
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500">Total Credits:</span>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            summary.totalCredits === 20
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {summary.totalCredits} / 20
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Edit Shell Modal */}
          {editingCourse && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-lg w-full p-6 border sa-border shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-3 sa-border">
                  <h3 className="font-bold text-base sa-display">
                    Edit Subject Shell: <span className="font-mono">{editingCourse.code}</span>
                  </h3>
                  <button
                    onClick={() => setEditingCourse(null)}
                    className="text-gray-400 hover:text-gray-600 font-mono text-lg"
                  >
                    ×
                  </button>
                </div>

                {editError && (
                  <div className="p-2.5 text-xs rounded border border-red-200 bg-red-50 text-red-700">
                    {editError}
                  </div>
                )}

                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Course Title</label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 text-xs bg-white dark:bg-zinc-900 sa-border"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Vertical</label>
                      <select
                        className="w-full border rounded px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 sa-border"
                        value={editVertical}
                        onChange={(e) => {
                          const v = e.target.value as Vertical;
                          setEditVertical(v);
                          const subOpts = VERTICAL_SUBVERTICALS[v];
                          if (subOpts && subOpts.length > 0) setEditSubVertical(subOpts[0]);
                        }}
                      >
                        {VERTICAL_OPTIONS.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">Sub-Vertical</label>
                      <select
                        className="w-full border rounded px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 sa-border"
                        value={editSubVertical}
                        onChange={(e) => setEditSubVertical(e.target.value as SubVertical)}
                      >
                        {(VERTICAL_SUBVERTICALS[editVertical] || []).map((sv) => (
                          <option key={sv} value={sv}>{sv}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Course Code</label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 text-xs font-mono bg-white dark:bg-zinc-900 sa-border"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                    />
                  </div>

                  {/* Components in Edit Modal */}
                  <div className="space-y-2 border-t pt-3 sa-border">
                    <label className="block text-xs font-semibold">Teaching Components</label>
                    {editComponents.map((comp, idx) => (
                      <div key={idx} className="p-2.5 rounded border sa-border bg-zinc-50 dark:bg-zinc-800/40 text-xs space-y-2">
                        <div className="flex items-center justify-between font-bold">
                          <span>{comp.component_type} Component</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-[10px] text-zinc-500 block">Hours/Week</span>
                            <input
                              type="number"
                              className="w-full border rounded px-2 py-1 text-xs text-center sa-border bg-white dark:bg-zinc-900"
                              value={comp.hours}
                              onChange={(e) => {
                                const up = [...editComponents];
                                up[idx].hours = Number(e.target.value);
                                setEditComponents(up);
                              }}
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 block">Credits</span>
                            <input
                              type="number"
                              step="0.5"
                              className="w-full border rounded px-2 py-1 text-xs text-center font-bold sa-border bg-white dark:bg-zinc-900"
                              value={comp.credit_points}
                              onChange={(e) => {
                                const up = [...editComponents];
                                up[idx].credit_points = Number(e.target.value);
                                setEditComponents(up);
                              }}
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 block">Total Marks</span>
                            <div className="text-center font-mono py-1">
                              {(comp.ise_marks || 0) + (comp.mse_marks || 0) + (comp.ese_max_marks || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t sa-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingCourse(null)}
                      disabled={savingEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={savingEdit}
                      className="bg-[#1B2430] hover:bg-[#2A374A] text-white"
                    >
                      {savingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                      Save Shell
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </RoleGuard>
  );
}
