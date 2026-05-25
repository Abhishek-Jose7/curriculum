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
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ActiveTab = "invite" | "department" | "academic-year" | "semester";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("department");

  // Options for selects
  const [departments, setDepartments] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // State for forms
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
  const [semNumber, setSemNumber] = useState(1);
  const [semTitle, setSemTitle] = useState("");
  const [semOrdinance, setSemOrdinance] = useState("");

  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingYearId, setEditingYearId] = useState<string | null>(null);
  const [editingSemId, setEditingSemId] = useState<string | null>(null);

  const getSemesterTitle = (num: number, deptId: string, depts: any[]) => {
    const dept = depts.find(d => String(d.id) === String(deptId));
    const deptName = dept ? dept.name : "Engineering";
    
    let yearStr = "First Year";
    if (num === 3 || num === 4) yearStr = "Second Year";
    if (num === 5 || num === 6) yearStr = "Third Year";
    if (num === 7 || num === 8) yearStr = "Fourth Year";

    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][num - 1] || num.toString();

    return `${yearStr} ${deptName} - Semester ${roman}`;
  };

  useEffect(() => {
    if (departments.length > 0 && semDept) {
      setSemTitle(getSemesterTitle(semNumber, semDept, departments));
    }
  }, [semNumber, semDept, departments]);

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

  const formatError = (err: any, fallback: string) => {
    let message = err.message || fallback;
    try {
      const parsed = JSON.parse(message);
      if (typeof parsed === "object") {
        message = Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(", ");
      }
    } catch (e) {}
    return message;
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const url = editingDeptId ? `/departments/${editingDeptId}/` : "/departments/";
      const method = editingDeptId ? "PUT" : "POST";
      await apiFetch(url, {
        method,
        body: JSON.stringify({
          code: deptCode,
          name: deptName,
          college_name: deptCollege,
          university_name: deptUniv,
        }),
      });
      setDeptCode("");
      setDeptName("");
      setEditingDeptId(null);
      triggerSuccess(`Department ${editingDeptId ? "updated" : "created"} successfully!`);
    } catch (err: any) {
      setErrorMsg(formatError(err, "Failed to save department"));
    } finally {
      setLoading(false);
    }
  };

  const handleEditDept = (d: any) => {
    setEditingDeptId(d.id);
    setDeptCode(d.code);
    setDeptName(d.name);
    setDeptCollege(d.college_name || "");
    setDeptUniv(d.university_name || "");
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await apiFetch(`/departments/${id}/`, { method: "DELETE" });
      triggerSuccess("Department deleted successfully!");
    } catch (err: any) {
      setErrorMsg(formatError(err, "Failed to delete department"));
    }
  };

  const handleSaveYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const url = editingYearId ? `/academic-years/${editingYearId}/` : "/academic-years/";
      const method = editingYearId ? "PUT" : "POST";
      await apiFetch(url, {
        method,
        body: JSON.stringify({
          name: yearName,
          starts_on: yearStart,
          ends_on: yearEnd,
          is_active: yearActive,
        }),
      });
      setEditingYearId(null);
      triggerSuccess(`Academic Year ${editingYearId ? "updated" : "created"} successfully!`);
    } catch (err: any) {
      setErrorMsg(formatError(err, "Failed to save academic year"));
    } finally {
      setLoading(false);
    }
  };

  const handleEditYear = (y: any) => {
    setEditingYearId(y.id);
    setYearName(y.name);
    setYearStart(y.starts_on || "");
    setYearEnd(y.ends_on || "");
    setYearActive(y.is_active);
  };

  const handleDeleteYear = async (id: string) => {
    if (!confirm("Are you sure you want to delete this academic year?")) return;
    try {
      await apiFetch(`/academic-years/${id}/`, { method: "DELETE" });
      triggerSuccess("Academic Year deleted successfully!");
    } catch (err: any) {
      setErrorMsg(formatError(err, "Failed to delete academic year"));
    }
  };

  const handleSaveSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semDept || !semYear) {
      setErrorMsg("Please ensure department and academic year are selected.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const url = editingSemId ? `/semesters/${editingSemId}/` : "/semesters/";
      const method = editingSemId ? "PUT" : "POST";
      await apiFetch(url, {
        method,
        body: JSON.stringify({
          department: Number(semDept),
          academic_year: Number(semYear),
          number: Number(semNumber),
          title: semTitle,
          ordinance: semOrdinance,
        }),
      });
      setEditingSemId(null);
      triggerSuccess(`Semester tier ${editingSemId ? "updated" : "created"} successfully!`);
    } catch (err: any) {
      setErrorMsg(formatError(err, "Failed to save semester"));
    } finally {
      setLoading(false);
    }
  };

  const handleEditSemester = (s: any) => {
    setEditingSemId(s.id);
    setSemDept(String(s.department));
    setSemYear(String(s.academic_year));
    setSemNumber(s.number);
    setSemTitle(s.title);
    setSemOrdinance(s.ordinance || "");
  };

  const handleDeleteSemester = async (id: string) => {
    if (!confirm("Are you sure you want to delete this semester?")) return;
    try {
      await apiFetch(`/semesters/${id}/`, { method: "DELETE" });
      triggerSuccess("Semester deleted successfully!");
    } catch (err: any) {
      setErrorMsg(formatError(err, "Failed to delete semester"));
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
              onClick={() => setActiveTab("department")}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === "department" ? "bg-primary text-white" : "hover:bg-muted text-foreground/70"
              )}
            >
              <Building2 className="h-4 w-4" />
              Manage Departments
            </button>
            <button
              onClick={() => setActiveTab("academic-year")}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === "academic-year" ? "bg-primary text-white" : "hover:bg-muted text-foreground/70"
              )}
            >
              <Calendar className="h-4 w-4" />
              Manage Academic Years
            </button>
            <button
              onClick={() => setActiveTab("semester")}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === "semester" ? "bg-primary text-white" : "hover:bg-muted text-foreground/70"
              )}
            >
              <Layers className="h-4 w-4" />
              Manage Semesters
            </button>
            <button
              onClick={() => setActiveTab("invite")}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === "invite" ? "bg-primary text-white" : "hover:bg-muted text-foreground/70"
              )}
            >
              <Plus className="h-4 w-4" />
              Create Subject
            </button>
          </aside>

          <main className="space-y-6">
            {activeTab === "invite" && <InviteTeacherPanel />}

            {activeTab === "department" && (
              <div className="space-y-6">
                <div className="rounded-md border border-border bg-zinc-900/10 p-5">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Building2 className="h-5 w-5 text-primary" />
                    Existing Departments
                  </h3>
                  {loadingOptions ? (
                    <div className="text-sm text-foreground/60">Loading...</div>
                  ) : departments.length === 0 ? (
                    <div className="text-sm text-foreground/60">No departments configured yet.</div>
                  ) : (
                    <ul className="space-y-2">
                      {departments.map(d => (
                        <li key={d.id} className="text-sm px-3 py-2 bg-background rounded border border-border flex items-center justify-between">
                          <div>
                            <span className="font-medium mr-2">{d.code}</span>
                            <span className="text-foreground/70">{d.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleEditDept(d)} className="text-blue-500 hover:text-blue-400">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => handleDeleteDept(d.id)} className="text-rose-500 hover:text-rose-400">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <form onSubmit={handleSaveDept} className="rounded-md border border-border p-5 space-y-4 bg-zinc-900/10">
                  <div className="border-b border-border pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        {editingDeptId ? "Edit Department" : "Add New Department"}
                      </h3>
                      <p className="text-sm text-foreground/60 mt-0.5">{editingDeptId ? "Update department details." : "Register a new engineering department tier."}</p>
                    </div>
                    {editingDeptId && (
                      <Button variant="ghost" size="sm" onClick={() => { setEditingDeptId(null); setDeptCode(""); setDeptName(""); }}>Cancel Edit</Button>
                    )}
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
                  {editingDeptId ? "Update Department" : "Create Department"}
                </Button>
                </form>
              </div>
            )}

            {activeTab === "academic-year" && (
              <div className="space-y-6">
                <div className="rounded-md border border-border bg-zinc-900/10 p-5">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-primary" />
                    Existing Academic Years
                  </h3>
                  {loadingOptions ? (
                    <div className="text-sm text-foreground/60">Loading...</div>
                  ) : academicYears.length === 0 ? (
                    <div className="text-sm text-foreground/60">No academic years configured yet.</div>
                  ) : (
                    <ul className="space-y-2">
                      {academicYears.map(y => (
                        <li key={y.id} className="text-sm px-3 py-2 bg-background rounded border border-border flex justify-between items-center">
                          <div>
                            <span className="font-medium mr-2">{y.name}</span>
                            <span className="text-foreground/70">{y.is_active ? "Active" : "Inactive"}</span>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleEditYear(y)} className="text-blue-500 hover:text-blue-400">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => handleDeleteYear(y.id)} className="text-rose-500 hover:text-rose-400">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <form onSubmit={handleSaveYear} className="rounded-md border border-border p-5 space-y-4 bg-zinc-900/10">
                  <div className="border-b border-border pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        {editingYearId ? "Edit Academic Year" : "Add Academic Year"}
                      </h3>
                      <p className="text-sm text-foreground/60 mt-0.5">{editingYearId ? "Update academic session details." : "Initialize a new academic calendar session."}</p>
                    </div>
                    {editingYearId && (
                      <Button variant="ghost" size="sm" onClick={() => { setEditingYearId(null); setYearName(""); }}>Cancel Edit</Button>
                    )}
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
                  {editingYearId ? "Update Academic Year" : "Create Academic Year"}
                </Button>
                </form>
              </div>
            )}

            {activeTab === "semester" && (
              <div className="space-y-6">
                <div className="rounded-md border border-border bg-zinc-900/10 p-5">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Layers className="h-5 w-5 text-primary" />
                    Existing Semesters
                  </h3>
                  {loadingOptions ? (
                    <div className="text-sm text-foreground/60">Loading...</div>
                  ) : semesters.length === 0 ? (
                    <div className="text-sm text-foreground/60">No semesters configured yet.</div>
                  ) : (
                    <ul className="space-y-2">
                      {semesters.map(s => (
                        <li key={s.id} className="text-sm px-3 py-2 bg-background rounded border border-border flex justify-between items-center">
                          <div>
                            <span className="font-medium mr-2">Sem {s.number} - {s.department_code}</span>
                            <span className="text-foreground/70">{s.academic_year_name}</span>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleEditSemester(s)} className="text-blue-500 hover:text-blue-400">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => handleDeleteSemester(s.id)} className="text-rose-500 hover:text-rose-400">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <form onSubmit={handleSaveSemester} className="rounded-md border border-border p-5 space-y-4 bg-zinc-900/10">
                  <div className="border-b border-border pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        {editingSemId ? "Edit Semester Tier" : "Add Semester Tier"}
                      </h3>
                      <p className="text-sm text-foreground/60 mt-0.5">{editingSemId ? "Update semester details." : "Map a new semester under a department and year."}</p>
                    </div>
                    {editingSemId && (
                      <Button variant="ghost" size="sm" onClick={() => { setEditingSemId(null); setSemTitle(""); }}>Cancel Edit</Button>
                    )}
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
                  {editingSemId ? "Update Semester Tier" : "Create Semester Tier"}
                </Button>
              </form>
              </div>
            )}

          </main>
        </div>
      </div>
    </AppShell>
  );
}
