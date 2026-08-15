"use client";

import { BookPlus, Loader2, Plus, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

type SemesterOption = {
  id: string;
  number: number;
  department_id: string;
  department_code?: string;
  academic_year_name?: string;
};

type Teacher = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  department_id: string | null;
};

const teacherName = (t: Teacher) =>
  [t.first_name, t.last_name].filter(Boolean).join(" ").trim() || t.email;

export function CreateSubjectPanel({ onGoToTeachers }: { onGoToTeachers: () => void }) {
  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [loadingSemesters, setLoadingSemesters] = useState(true);

  const [semesterId, setSemesterId] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseType, setCourseType] = useState("THEORY");
  const [credits, setCredits] = useState("4");
  const [facultyUserId, setFacultyUserId] = useState("");

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function loadSemesters() {
      try {
        const res = await apiFetch<any>("/semesters/");
        const list = Array.isArray(res) ? res : res.results ?? [];
        setSemesters(list);
        if (list.length > 0) setSemesterId(String(list[0].id));
      } catch {
        // ignore
      } finally {
        setLoadingSemesters(false);
      }
    }
    void loadSemesters();
  }, []);

  const selectedSemester = semesters.find((s) => String(s.id) === String(semesterId));

  // Load teachers for the selected semester's department
  useEffect(() => {
    setFacultyUserId("");
    if (!semesterId || !selectedSemester?.department_id) {
      setTeachers([]);
      return;
    }
    setLoadingTeachers(true);
    apiFetch<Teacher[]>(`/profiles/faculty?role=FACULTY&department_id=${selectedSemester.department_id}`)
      .then((list) => setTeachers(Array.isArray(list) ? list : []))
      .catch(() => setTeachers([]))
      .finally(() => setLoadingTeachers(false));
  }, [semesterId, selectedSemester?.department_id]);

  const canSubmit = semesterId && courseCode.trim() && courseTitle.trim() && facultyUserId;

  async function createSubject() {
    if (!canSubmit) return;
    setCreating(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await apiFetch("/courses/", {
        method: "POST",
        body: JSON.stringify({
          semester_id: semesterId,
          code: courseCode.trim(),
          title: courseTitle.trim(),
          course_type: courseType,
          credits: Number(credits) || 0,
          faculty_user_id: facultyUserId,
          status: "DRAFT",
        }),
      });
      setSuccessMsg(`Subject "${courseTitle.trim()}" created with teacher assigned.`);
      setCourseCode("");
      setCourseTitle("");
      setFacultyUserId("");
      // Refresh the teacher list in case the department state changed
      setLoadingTeachers(true);
      apiFetch<Teacher[]>(`/profiles/faculty?role=FACULTY&department_id=${selectedSemester?.department_id}`)
        .then((list) => setTeachers(Array.isArray(list) ? list : []))
        .catch(() => setTeachers([]))
        .finally(() => setLoadingTeachers(false));
    } catch (err: any) {
      const message = err?.message ?? "";
      if (message.includes("TEACHER_DEPARTMENT_MISMATCH") || message.includes("TEACHER_INVALID")) {
        setErrorMsg("The selected teacher is no longer valid for this department. Please pick again.");
        setFacultyUserId("");
        setLoadingTeachers(true);
        apiFetch<Teacher[]>(`/profiles/faculty?role=FACULTY&department_id=${selectedSemester?.department_id}`)
          .then((list) => setTeachers(Array.isArray(list) ? list : []))
          .catch(() => setTeachers([]))
          .finally(() => setLoadingTeachers(false));
      } else if (message.includes("TEACHER_REQUIRED")) {
        setErrorMsg("A teacher must be selected to create a subject.");
      } else {
        setErrorMsg("Failed to create subject. " + message);
      }
    } finally {
      setCreating(false);
    }
  }

  const teacherField = loadingTeachers ? (
    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Loading teachers...
    </div>
  ) : !semesterId ? (
    <p className="text-xs font-semibold text-muted-foreground">Pick a semester first.</p>
  ) : teachers.length === 0 ? (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">No active teachers in this department yet.</p>
      <Button type="button" variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider" onClick={onGoToTeachers}>
        <UserPlus className="h-3 w-3 mr-1.5" /> Add a teacher
      </Button>
    </div>
  ) : (
    <select
      value={facultyUserId}
      onChange={(e) => setFacultyUserId(e.target.value)}
      className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary cursor-pointer"
    >
      <option value="">Select teacher</option>
      {teachers.map((t) => (
        <option key={t.id} value={t.id} className="bg-card text-foreground">
          {teacherName(t)} ({t.email})
        </option>
      ))}
    </select>
  );

  return (
    <section className="rounded border border-border bg-card p-6 shadow-sm space-y-6">
      <div className="border-b border-border/80 pb-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded bg-primary/10 flex items-center justify-center text-primary">
          <BookPlus className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-base font-serif font-bold text-foreground">Create Subject</h2>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            Register a new curriculum catalog entry with an assigned teacher coordinator.
          </p>
        </div>
      </div>

      {loadingSemesters ? (
        <div className="flex items-center justify-center py-6 gap-2 text-xs font-bold text-muted-foreground/60">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Loading semester structure...
        </div>
      ) : semesters.length === 0 ? (
        <div className="p-4 rounded bg-amber-500/5 border border-amber-500/10 text-xs font-bold text-amber-600 text-center leading-relaxed">
          No semesters configured. Please initialize academic semester tiers in Manage Semesters first.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Select Semester Tier</span>
              <select
                className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary cursor-pointer"
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
              >
                {semesters.map((sem) => (
                  <option key={sem.id} value={sem.id} className="bg-card text-foreground">
                    {sem.department_code || "DEPT"} - Sem {sem.number} ({sem.academic_year_name || ""})
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Subject Code</span>
              <input
                className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. CS301"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Subject Title</span>
              <input
                className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="e.g. Data Structures & Algorithms"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Syllabus Type</span>
              <select
                className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary cursor-pointer"
                value={courseType}
                onChange={(e) => setCourseType(e.target.value)}
              >
                <option value="THEORY" className="bg-card text-foreground">Theory Coursework</option>
                <option value="LAB" className="bg-card text-foreground">Practical (Lab Work)</option>
                <option value="THEORY_LAB" className="bg-card text-foreground">Integrated Theory & Practical</option>
                <option value="PROJECT" className="bg-card text-foreground">Project Shell</option>
                <option value="ELECTIVE" className="bg-card text-foreground">Elective Shell</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Credits</span>
              <input
                type="number"
                className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                placeholder="e.g. 4"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Teacher Coordinator (Required)</span>
              {teacherField}
            </label>
          </div>

          {errorMsg && (
            <p className="rounded border border-rose-500/10 bg-rose-500/5 p-3 text-xs font-bold text-rose-600 leading-relaxed">{errorMsg}</p>
          )}
          {successMsg && (
            <p className="rounded border border-emerald-500/10 bg-emerald-500/5 p-3 text-xs font-bold text-emerald-600 leading-relaxed">{successMsg}</p>
          )}

          <Button
            className="w-full md:w-auto h-10 mt-2"
            onClick={() => void createSubject()}
            disabled={!canSubmit || creating}
          >
            {creating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
            Create Subject
          </Button>
        </div>
      )}
    </section>
  );
}
