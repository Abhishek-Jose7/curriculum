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
  Plus,
  Loader2,
  CheckCircle,
  Pencil,
  Trash2,
  Wrench,
  ShieldCheck,
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
      <div className="space-y-6 animate-fade-in text-left">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
          <div className="space-y-1">
            <h1 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
              <div className="h-9 w-9 rounded bg-primary/10 flex items-center justify-center text-primary">
                <Wrench className="h-4.5 w-4.5" />
              </div>
              Administrative Controls
            </h1>
            <p className="text-xs text-muted-foreground font-semibold">
              Register semesters alignment, institutional department catalogs, and assign curriculum coordinators.
            </p>
          </div>
          <div className="flex gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-500/5 px-2.5 py-0.5 rounded-sm border border-emerald-500/10">
              <ShieldCheck className="h-3 w-3" /> Ledger Active
            </span>
          </div>
        </header>

        {/* Success / Error notification lists */}
        {successMsg && (
          <div className="p-4 rounded bg-emerald-500/5 border border-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in shadow-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded bg-rose-500/5 border border-rose-500/10 text-xs font-bold text-rose-600 dark:text-rose-400 animate-fade-in shadow-sm">
            {errorMsg}
          </div>
        )}

        {/* Dynamic Sidebar + Tab Panels grid */}
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-1 bg-card/20 border border-border rounded p-3 shadow-sm h-fit">
            <div className="text-[9px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest px-2 mb-2">Office ledger</div>
            <button
              onClick={() => setActiveTab("department")}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold transition-all text-left border border-transparent active:scale-[0.98]",
                activeTab === "department" ? "bg-secondary/40 text-primary font-serif-editorial text-[13px] border-l-primary rounded-l-none" : "hover:bg-muted text-foreground/75 hover:text-foreground"
              )}
            >
              <Building2 className="h-3.5 w-3.5" />
              Manage Departments
            </button>
            <button
              onClick={() => setActiveTab("academic-year")}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold transition-all text-left border border-transparent active:scale-[0.98]",
                activeTab === "academic-year" ? "bg-secondary/40 text-primary font-serif-editorial text-[13px] border-l-primary rounded-l-none" : "hover:bg-muted text-foreground/75 hover:text-foreground"
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              Manage Academic Years
            </button>
            <button
              onClick={() => setActiveTab("semester")}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold transition-all text-left border border-transparent active:scale-[0.98]",
                activeTab === "semester" ? "bg-secondary/40 text-primary font-serif-editorial text-[13px] border-l-primary rounded-l-none" : "hover:bg-muted text-foreground/75 hover:text-foreground"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              Manage Semesters
            </button>
            <button
              onClick={() => setActiveTab("invite")}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold transition-all text-left border border-dashed border-primary/20 active:scale-[0.98]",
                activeTab === "invite" ? "bg-secondary/40 text-primary font-serif-editorial text-[13px] border-l-primary rounded-l-none border-transparent" : "hover:bg-muted text-foreground/75 hover:text-foreground"
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Create Subject
            </button>
          </aside>

          {/* Main content ledger views */}
          <main className="space-y-6">
            {activeTab === "invite" && <InviteTeacherPanel />}

            {activeTab === "department" && (
              <div className="space-y-6">
                {/* Configured Departments List */}
                <div className="rounded border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-base font-serif font-bold text-foreground flex items-center gap-2 mb-4">
                    <Building2 className="h-4.5 w-4.5 text-primary" />
                    Existing Departments
                  </h3>
                  {loadingOptions ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-xs font-bold text-muted-foreground/60">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" /> Querying registry...
                    </div>
                  ) : departments.length === 0 ? (
                    <div className="text-xs font-semibold text-muted-foreground py-6 text-center">No departments registered. Add one using the catalog form.</div>
                  ) : (
                    <ul className="space-y-2">
                      {departments.map(d => (
                        <li key={d.id} className="text-xs font-bold p-3 bg-background rounded border border-border flex items-center justify-between shadow-sm hover:border-primary/20 transition-all duration-150 group">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-primary border border-border/60">{d.code}</span>
                            <span className="text-foreground/70">{d.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => handleEditDept(d)} className="h-8 w-8 rounded flex items-center justify-center hover:bg-blue-500/10 hover:text-blue-500 transition-colors" title="Edit department">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => handleDeleteDept(d.id)} className="h-8 w-8 rounded flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-colors" title="Delete department">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Form Registration Block */}
                <form onSubmit={handleSaveDept} className="rounded border border-border p-6 space-y-4 bg-card shadow-sm">
                  <div className="border-b border-border/80 pb-3.5 flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-serif font-bold flex items-center gap-2">
                        <Plus className="h-4.5 w-4.5 text-primary" />
                        {editingDeptId ? "Edit Department Catalog" : "Add New Department Catalog"}
                      </h3>
                      <p className="text-xs text-muted-foreground/60 font-semibold mt-0.5">{editingDeptId ? "Update existing department credentials." : "Register a new institutional department catalog."}</p>
                    </div>
                    {editingDeptId && (
                      <Button variant="ghost" size="sm" onClick={() => { setEditingDeptId(null); setDeptCode(""); setDeptName(""); }} className="h-8 text-xs font-bold border-border">Cancel Edit</Button>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Dept Code (e.g. COMP, MECH)</span>
                      <input
                        required
                        className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary focus:bg-primary/5"
                        value={deptCode}
                        onChange={(e) => setDeptCode(e.target.value)}
                        placeholder="COMP"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Department Name</span>
                      <input
                        required
                        className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary focus:bg-primary/5"
                        value={deptName}
                        onChange={(e) => setDeptName(e.target.value)}
                        placeholder="Department of Computer Engineering"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">College Affiliation Name</span>
                      <input
                        className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary focus:bg-primary/5"
                        value={deptCollege}
                        onChange={(e) => setDeptCollege(e.target.value)}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">University Affiliation</span>
                      <input
                        className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary focus:bg-primary/5"
                        value={deptUniv}
                        onChange={(e) => setDeptUniv(e.target.value)}
                      />
                    </label>
                  </div>
                  <Button type="submit" disabled={loading} className="mt-2 h-10 px-5 font-bold">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingDeptId ? "Update Department" : "Create Department"}
                  </Button>
                </form>
              </div>
            )}

            {activeTab === "academic-year" && (
              <div className="space-y-6">
                {/* Configured Academic Years List */}
                <div className="rounded border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-base font-serif font-bold text-foreground flex items-center gap-2 mb-4">
                    <Calendar className="h-4.5 w-4.5 text-primary" />
                    Existing Academic Years
                  </h3>
                  {loadingOptions ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-xs font-bold text-muted-foreground/60">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading sessions...
                    </div>
                  ) : academicYears.length === 0 ? (
                    <div className="text-xs font-semibold text-muted-foreground py-6 text-center">No academic year sessions registered.</div>
                  ) : (
                    <ul className="space-y-2">
                      {academicYears.map(y => (
                        <li key={y.id} className="text-xs font-bold p-3 bg-background rounded border border-border flex justify-between items-center shadow-sm hover:border-primary/20 transition-all duration-150 group">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-foreground/80">{y.name}</span>
                            {y.is_active ? (
                              <span className="inline-flex items-center rounded-sm px-2 py-0.5 text-[9px] font-bold bg-emerald-500/5 text-emerald-600 border border-emerald-500/10">Active</span>
                            ) : (
                              <span className="inline-flex items-center rounded-sm px-2 py-0.5 text-[9px] font-bold bg-zinc-500/5 text-zinc-500 border border-zinc-500/10 font-mono">Inactive</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => handleEditYear(y)} className="h-8 w-8 rounded flex items-center justify-center hover:bg-blue-500/10 hover:text-blue-500 transition-colors" title="Edit session">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => handleDeleteYear(y.id)} className="h-8 w-8 rounded flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-colors" title="Delete session">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Form Registration Block */}
                <form onSubmit={handleSaveYear} className="rounded border border-border p-6 space-y-4 bg-card shadow-sm">
                  <div className="border-b border-border/60 pb-3.5 flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-serif font-bold flex items-center gap-2">
                        <Plus className="h-4.5 w-4.5 text-primary" />
                        {editingYearId ? "Edit Academic Session" : "Add Academic Year Session"}
                      </h3>
                      <p className="text-xs text-muted-foreground/60 font-semibold mt-0.5">{editingYearId ? "Modify session calendar boundaries." : "Initialize a new academic workflow year."}</p>
                    </div>
                    {editingYearId && (
                      <Button variant="ghost" size="sm" onClick={() => { setEditingYearId(null); setYearName(""); }} className="h-8 text-xs font-bold border-border">Cancel Edit</Button>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="block space-y-1.5">
                      <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Academic Session Label</span>
                      <input
                        required
                        className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary focus:bg-primary/5"
                        value={yearName}
                        onChange={(e) => setYearName(e.target.value)}
                        placeholder="2026-2027"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Starts On</span>
                      <input
                        required
                        type="date"
                        className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary focus:bg-primary/5 cursor-pointer"
                        value={yearStart}
                        onChange={(e) => setYearStart(e.target.value)}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Ends On</span>
                      <input
                        required
                        type="date"
                        className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary focus:bg-primary/5 cursor-pointer"
                        value={yearEnd}
                        onChange={(e) => setYearEnd(e.target.value)}
                      />
                    </label>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-foreground/80 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={yearActive}
                      onChange={(e) => setYearActive(e.target.checked)}
                      className="rounded border-border text-primary cursor-pointer"
                    />
                    Mark as current Active Academic Year
                  </label>
                  <Button type="submit" disabled={loading} className="mt-2 h-10 px-5 font-bold">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingYearId ? "Update Academic Year" : "Create Academic Year"}
                  </Button>
                </form>
              </div>
            )}

            {activeTab === "semester" && (
              <div className="space-y-6">
                {/* Configured Semesters List */}
                <div className="rounded border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-base font-serif font-bold text-foreground flex items-center gap-2 mb-4">
                    <Layers className="h-4.5 w-4.5 text-primary" />
                    Existing Semesters
                  </h3>
                  {loadingOptions ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-xs font-bold text-muted-foreground/60">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" /> Querying semesters...
                    </div>
                  ) : semesters.length === 0 ? (
                    <div className="text-xs font-semibold text-muted-foreground py-6 text-center">No semesters mapped to departments. Use the catalog form below.</div>
                  ) : (
                    <ul className="space-y-2">
                      {semesters.map(s => (
                        <li key={s.id} className="text-xs font-bold p-3 bg-background rounded border border-border flex justify-between items-center shadow-sm hover:border-primary/20 transition-all duration-150 group">
                          <div>
                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-primary border border-border/60 mr-2">Sem {s.number}</span>
                            <span className="text-foreground/75">{s.title}</span>
                            <span className="text-[10px] text-muted-foreground/50 ml-2 font-medium">({s.academic_year_name})</span>
                          </div>
                          <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => handleEditSemester(s)} className="h-8 w-8 rounded flex items-center justify-center hover:bg-blue-500/10 hover:text-blue-500 transition-colors" title="Edit semester">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => handleDeleteSemester(s.id)} className="h-8 w-8 rounded flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-colors" title="Delete semester">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Form Registration Block */}
                <form onSubmit={handleSaveSemester} className="rounded border border-border p-6 space-y-4 bg-card shadow-sm">
                  <div className="border-b border-border/60 pb-3.5 flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-serif font-bold flex items-center gap-2">
                        <Plus className="h-4.5 w-4.5 text-primary" />
                        {editingSemId ? "Edit Semester Alignment" : "Add Semester Alignment"}
                      </h3>
                      <p className="text-xs text-muted-foreground/60 font-semibold mt-0.5">{editingSemId ? "Modify specific semester configurations." : "Align a new syllabus semester tier."}</p>
                    </div>
                    {editingSemId && (
                      <Button variant="ghost" size="sm" onClick={() => { setEditingSemId(null); setSemTitle(""); }} className="h-8 text-xs font-bold border-border">Cancel Edit</Button>
                    )}
                  </div>
                {loadingOptions ? (
                  <div className="py-8 text-center text-xs font-semibold text-muted-foreground/60 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> Checking schema validity...
                  </div>
                ) : departments.length === 0 || academicYears.length === 0 ? (
                  <div className="p-4 rounded bg-amber-500/5 border border-amber-500/10 text-xs font-semibold text-amber-500 text-center leading-relaxed">
                    Please ensure at least one active Department and Academic Year are registered before establishing Semester tiers.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Department Link</span>
                      <select
                        className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary focus:bg-primary/5 cursor-pointer"
                        value={semDept}
                        onChange={(e) => setSemDept(e.target.value)}
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id} className="bg-card text-foreground">
                            {d.code} - {d.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Academic Session Link</span>
                      <select
                        className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary focus:bg-primary/5 cursor-pointer"
                        value={semYear}
                        onChange={(e) => setSemYear(e.target.value)}
                      >
                        {academicYears.map((y) => (
                          <option key={y.id} value={y.id} className="bg-card text-foreground">
                            {y.name} {y.is_active ? "(Active)" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Semester Index (1 to 8)</span>
                      <input
                        required
                        type="number"
                        min="1"
                        max="8"
                        className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary focus:bg-primary/5"
                        value={semNumber}
                        onChange={(e) => setSemNumber(Number(e.target.value))}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Semester Title</span>
                      <input
                        required
                        className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary focus:bg-primary/5"
                        value={semTitle}
                        onChange={(e) => setSemTitle(e.target.value)}
                      />
                    </label>
                    <label className="block space-y-1.5 md:col-span-2">
                      <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Ordinance Code (e.g. O.3453, Optional)</span>
                      <input
                        className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary focus:bg-primary/5"
                        value={semOrdinance}
                        onChange={(e) => setSemOrdinance(e.target.value)}
                        placeholder="O.5432"
                      />
                    </label>
                  </div>
                )}
                <Button type="submit" disabled={loading || loadingOptions || departments.length === 0 || academicYears.length === 0} className="mt-2 h-10 px-5 font-bold">
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
