"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { InviteTeacherPanel } from "@/components/admin/invite-teacher-panel";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import {
  GraduationCap,
  Building2,
  Calendar,
  Layers,
  BookOpen,
  Plus,
  Loader2,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ActiveTab = "invite" | "department" | "academic-year" | "semester" | "course";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("invite");

  // Options for selects
  const [departments, setDepartments] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Form states
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Department Form
  const [deptCode, setDeptCode] = useState("");
  const [deptName, setDeptName] = useState("");
  const [deptCollege, setDeptCollege] = useState("Fr. Conceicao Rodrigues College of Engineering");
  const [deptUniv, setDeptUniv] = useState("University of Mumbai");

  // 2. Academic Year Form
  const [yearName, setYearName] = useState("2026-2027");
  const [yearStart, setYearStart] = useState("2026-06-01");
  const [yearEnd, setYearEnd] = useState("2027-05-31");
  const [yearActive, setYearActive] = useState(true);

  // 3. Semester Form
  const [semDept, setSemDept] = useState("");
  const [semYear, setSemYear] = useState("");
  const [semNumber, setSemNumber] = useState(3);
  const [semTitle, setSemTitle] = useState("Second Year Computer Engineering - Semester III");
  const [semOrdinance, setSemOrdinance] = useState("");

  // 4. Course Form
  const [courseSem, setCourseSem] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseType, setCourseType] = useState("THEORY");
  const [courseCredits, setCourseCredits] = useState(3);
  const [courseL, setCourseL] = useState(3);
  const [courseT, setCourseT] = useState(0);
  const [courseP, setCourseP] = useState(0);
  const [courseInternal, setCourseInternal] = useState(40);
  const [courseExternal, setCourseExternal] = useState(60);

  const loadAllOptions = async () => {
    setLoadingOptions(true);
    try {
      const depts = await apiFetch<any>("/departments/");
      const deptsList = Array.isArray(depts) ? depts : depts.results ?? [];
      setDepartments(deptsList);
      if (deptsList.length > 0) setSemDept(String(deptsList[0].id));

      const years = await apiFetch<any>("/academic-years/");
      const yearsList = Array.isArray(years) ? years : years.results ?? [];
      setAcademicYears(yearsList);
      if (yearsList.length > 0) setSemYear(String(yearsList[0].id));

      const sems = await apiFetch<any>("/semesters/");
      const semsList = Array.isArray(sems) ? sems : sems.results ?? [];
      setSemesters(semsList);
      if (semsList.length > 0) setCourseSem(String(semsList[0].id));
    } catch (err) {
      console.error("Failed to load schema options", err);
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    void loadAllOptions();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg("");
    void loadAllOptions();
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      await apiFetch("/departments/", {
        method: "POST",
        body: JSON.stringify({
          code: deptCode,
          name: deptName,
          college_name: deptCollege,
          university_name: deptUniv,
        }),
      });
      setDeptCode("");
      setDeptName("");
      triggerSuccess("Department created successfully!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create department");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      await apiFetch("/academic-years/", {
        method: "POST",
        body: JSON.stringify({
          name: yearName,
          starts_on: yearStart,
          ends_on: yearEnd,
          is_active: yearActive,
        }),
      });
      triggerSuccess("Academic Year created successfully!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create academic year");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semDept || !semYear) {
      setErrorMsg("Please ensure department and academic year are selected.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      await apiFetch("/semesters/", {
        method: "POST",
        body: JSON.stringify({
          department: Number(semDept),
          academic_year: Number(semYear),
          number: Number(semNumber),
          title: semTitle,
          ordinance: semOrdinance,
        }),
      });
      triggerSuccess("Semester tier created successfully!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create semester");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseSem) {
      setErrorMsg("Semester is required. Set up dynamic semesters first!");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      await apiFetch("/courses/", {
        method: "POST",
        body: JSON.stringify({
          semester: Number(courseSem),
          code: courseCode,
          title: courseTitle,
          course_type: courseType,
          credits: Number(courseCredits),
          lecture_hours: Number(courseL),
          tutorial_hours: Number(courseT),
          practical_hours: Number(courseP),
          internal_marks: Number(courseInternal),
          external_marks: Number(courseExternal),
        }),
      });
      setCourseCode("");
      setCourseTitle("");
      triggerSuccess("Structured course shell created successfully!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create course shell");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary" />
              Administrative Controls
            </h1>
            <p className="text-sm text-foreground/60 mt-1">
              Initialize academic year tiers, department metadata, and invite course coordinators.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="h-3.5 w-3.5" />
              Fully Interactive Pipeline
            </span>
          </div>
        </header>

        {successMsg && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm font-semibold text-emerald-400">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm font-semibold text-rose-500">
            {errorMsg}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-1">
            <button
              onClick={() => setActiveTab("invite")}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === "invite" ? "bg-primary text-white" : "hover:bg-muted text-foreground/70"
              )}
            >
              <Plus className="h-4 w-4" />
              Invite Teachers
            </button>
            <button
              onClick={() => setActiveTab("department")}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === "department" ? "bg-primary text-white" : "hover:bg-muted text-foreground/70"
              )}
            >
              <Building2 className="h-4 w-4" />
              Create Department
            </button>
            <button
              onClick={() => setActiveTab("academic-year")}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === "academic-year" ? "bg-primary text-white" : "hover:bg-muted text-foreground/70"
              )}
            >
              <Calendar className="h-4 w-4" />
              Create Academic Year
            </button>
            <button
              onClick={() => setActiveTab("semester")}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === "semester" ? "bg-primary text-white" : "hover:bg-muted text-foreground/70"
              )}
            >
              <Layers className="h-4 w-4" />
              Create Semester
            </button>
            <button
              onClick={() => setActiveTab("course")}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === "course" ? "bg-primary text-white" : "hover:bg-muted text-foreground/70"
              )}
            >
              <BookOpen className="h-4 w-4" />
              Create Course Shell
            </button>
          </aside>

          <main className="space-y-6">
            {activeTab === "invite" && <InviteTeacherPanel />}

            {activeTab === "department" && (
              <form onSubmit={handleCreateDept} className="rounded-md border border-border p-5 space-y-4 bg-zinc-900/10">
                <div className="border-b border-border pb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Create Department Metadata
                  </h3>
                  <p className="text-sm text-foreground/60 mt-0.5">Register new engineering department tiers.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-foreground/85">Dept Code (e.g. COMP, MECH)</span>
                    <input
                      required
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      placeholder="COMP"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-foreground/85">Department Name</span>
                    <input
                      required
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      placeholder="Department of Computer Engineering"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-foreground/85">College Affiliation Name</span>
                    <input
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                      value={deptCollege}
                      onChange={(e) => setDeptCollege(e.target.value)}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-foreground/85">University Affiliation</span>
                    <input
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                      value={deptUniv}
                      onChange={(e) => setDeptUniv(e.target.value)}
                    />
                  </label>
                </div>
                <Button type="submit" disabled={loading} className="mt-2">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Department
                </Button>
              </form>
            )}

            {activeTab === "academic-year" && (
              <form onSubmit={handleCreateYear} className="rounded-md border border-border p-5 space-y-4 bg-zinc-900/10">
                <div className="border-b border-border pb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Create Academic Year Range
                  </h3>
                  <p className="text-sm text-foreground/60 mt-0.5">Initialize a new academic calendar session.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-foreground/85">Academic Session Label</span>
                    <input
                      required
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                      value={yearName}
                      onChange={(e) => setYearName(e.target.value)}
                      placeholder="2026-2027"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-foreground/85">Starts On</span>
                    <input
                      required
                      type="date"
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                      value={yearStart}
                      onChange={(e) => setYearStart(e.target.value)}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-foreground/85">Ends On</span>
                    <input
                      required
                      type="date"
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                      value={yearEnd}
                      onChange={(e) => setYearEnd(e.target.value)}
                    />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm text-foreground/90">
                  <input
                    type="checkbox"
                    checked={yearActive}
                    onChange={(e) => setYearActive(e.target.checked)}
                    className="rounded border-border text-primary"
                  />
                  Mark as currently Active Year
                </label>
                <Button type="submit" disabled={loading} className="mt-2">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Academic Year
                </Button>
              </form>
            )}

            {activeTab === "semester" && (
              <form onSubmit={handleCreateSemester} className="rounded-md border border-border p-5 space-y-4 bg-zinc-900/10">
                <div className="border-b border-border pb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Create Semester Tier
                  </h3>
                  <p className="text-sm text-foreground/60 mt-0.5">Map semesters under configured departments & years.</p>
                </div>
                {loadingOptions ? (
                  <div className="py-4 text-center text-sm text-foreground/60">Loading configured structures...</div>
                ) : departments.length === 0 || academicYears.length === 0 ? (
                  <div className="p-4 rounded bg-amber-500/5 border border-amber-500/10 text-sm text-amber-500 text-center">
                    Please set up at least one Department and Academic Year before creating Semesters.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-1">
                      <span className="text-sm font-medium text-foreground/85">Department Link</span>
                      <select
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                        value={semDept}
                        onChange={(e) => setSemDept(e.target.value)}
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.code} - {d.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-sm font-medium text-foreground/85">Academic Session</span>
                      <select
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                        value={semYear}
                        onChange={(e) => setSemYear(e.target.value)}
                      >
                        {academicYears.map((y) => (
                          <option key={y.id} value={y.id}>
                            {y.name} {y.is_active ? "(Active)" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-sm font-medium text-foreground/85">Semester Number</span>
                      <input
                        required
                        type="number"
                        min="1"
                        max="8"
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                        value={semNumber}
                        onChange={(e) => setSemNumber(Number(e.target.value))}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-sm font-medium text-foreground/85">Official Semester Banner Title</span>
                      <input
                        required
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                        value={semTitle}
                        onChange={(e) => setSemTitle(e.target.value)}
                      />
                    </label>
                    <label className="block space-y-1 md:col-span-2">
                      <span className="text-sm font-medium text-foreground/85">Ordinance Code (e.g. O.3453, Optional)</span>
                      <input
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                        value={semOrdinance}
                        onChange={(e) => setSemOrdinance(e.target.value)}
                        placeholder="O.5432"
                      />
                    </label>
                  </div>
                )}
                <Button type="submit" disabled={loading || loadingOptions || departments.length === 0 || academicYears.length === 0} className="mt-2">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Semester Tier
                </Button>
              </form>
            )}

            {activeTab === "course" && (
              <form onSubmit={handleCreateCourse} className="rounded-md border border-border p-5 space-y-4 bg-zinc-900/10">
                <div className="border-b border-border pb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Create Course Syllabus Shell
                  </h3>
                  <p className="text-sm text-foreground/60 mt-0.5">Initialize a structured syllabus subject shell.</p>
                </div>
                {loadingOptions ? (
                  <div className="py-4 text-center text-sm text-foreground/60">Loading configured structures...</div>
                ) : semesters.length === 0 ? (
                  <div className="p-4 rounded bg-amber-500/5 border border-amber-500/10 text-sm text-amber-500 text-center">
                    Please set up at least one Semester tier in the previous tab before creating courses.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block space-y-1">
                        <span className="text-sm font-medium text-foreground/85">Select Semester Class</span>
                        <select
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                          value={courseSem}
                          onChange={(e) => setCourseSem(e.target.value)}
                        >
                          {semesters.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.department_code || "COMP"} - Sem {s.number} ({s.academic_year_name})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block space-y-1">
                        <span className="text-sm font-medium text-foreground/85">Course Subject Code</span>
                        <input
                          required
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                          value={courseCode}
                          onChange={(e) => setCourseCode(e.target.value)}
                          placeholder="CS301"
                        />
                      </label>
                      <label className="block space-y-1 md:col-span-2">
                        <span className="text-sm font-medium text-foreground/85">Subject Syllabus Title</span>
                        <input
                          required
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                          value={courseTitle}
                          onChange={(e) => setCourseTitle(e.target.value)}
                          placeholder="Data Structures and Algorithms"
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-sm font-medium text-foreground/85">Course Type</span>
                        <select
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                          value={courseType}
                          onChange={(e) => setCourseType(e.target.value)}
                        >
                          <option value="THEORY">Theory</option>
                          <option value="LAB">Laboratory / Practical</option>
                          <option value="PROJECT">Project</option>
                          <option value="ELECTIVE">Elective</option>
                          <option value="INTERDISCIPLINARY">Interdisciplinary</option>
                        </select>
                      </label>
                      <label className="block space-y-1">
                        <span className="text-sm font-medium text-foreground/85">Assigned Credits</span>
                        <input
                          type="number"
                          step="0.5"
                          required
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                          value={courseCredits}
                          onChange={(e) => setCourseCredits(Number(e.target.value))}
                        />
                      </label>
                    </div>

                    <div className="border-t border-border/60 pt-4">
                      <div className="text-sm font-semibold text-foreground/80 mb-3">Teaching Scheme (Hrs/Week)</div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <label className="block space-y-1">
                          <span className="text-sm font-medium text-foreground/85">Lecture Hrs</span>
                          <input
                            type="number"
                            required
                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                            value={courseL}
                            onChange={(e) => setCourseL(Number(e.target.value))}
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-sm font-medium text-foreground/85">Tutorial Hrs</span>
                          <input
                            type="number"
                            required
                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                            value={courseT}
                            onChange={(e) => setCourseT(Number(e.target.value))}
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-sm font-medium text-foreground/85">Practical / Lab Hrs</span>
                          <input
                            type="number"
                            required
                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                            value={courseP}
                            onChange={(e) => setCourseP(Number(e.target.value))}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="border-t border-border/60 pt-4">
                      <div className="text-sm font-semibold text-foreground/80 mb-3">Syllabus Evaluation Scheme Marks</div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block space-y-1">
                          <span className="text-sm font-medium text-foreground/85">Internal / Term Work Marks</span>
                          <input
                            type="number"
                            required
                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                            value={courseInternal}
                            onChange={(e) => setCourseInternal(Number(e.target.value))}
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-sm font-medium text-foreground/85">External Theory Exam Marks</span>
                          <input
                            type="number"
                            required
                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                            value={courseExternal}
                            onChange={(e) => setCourseExternal(Number(e.target.value))}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                <Button type="submit" disabled={loading || semesters.length === 0} className="mt-2">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Course Shell
                </Button>
              </form>
            )}
          </main>
        </div>
      </div>
    </AppShell>
  );
}
