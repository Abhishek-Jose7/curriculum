"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  BookOpen,
  CheckCircle2,
  Clock,
  FileEdit,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  GraduationCap,
  Sparkles,
  ChevronRight,
  UserCheck,
  UserX,
  TrendingUp,
  Award,
  Layers,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Department {
  id: string | number;
  code: string;
  name: string;
  college_name?: string;
  university_name?: string;
}

interface Semester {
  id: string | number;
  number: number;
  title: string;
  department: string | number;
  department_id?: string | number;
  academic_year_name?: string;
}

interface FacultyProfile {
  id: string | number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  department_id?: string | number;
  department_code?: string;
}

interface Course {
  id: string;
  code: string;
  title: string;
  course_type?: string;
  credits?: number;
  status: string;
  semester?: string | number;
  semester_id?: string | number;
  department_id?: string | number;
  faculty_name?: string;
  faculty_user_id?: string | number;
  faculty_id?: string | number;
  last_modified?: string;
}

const YEAR_STAGES = [
  { key: "FE", name: "First Year (FE)", sems: [1, 2], bg: "from-blue-500/10 to-indigo-500/5", border: "border-blue-500/30", text: "text-blue-600 dark:text-blue-400", bar: "bg-blue-500" },
  { key: "SE", name: "Second Year (SE)", sems: [3, 4], bg: "from-purple-500/10 to-pink-500/5", border: "border-purple-500/30", text: "text-purple-600 dark:text-purple-400", bar: "bg-purple-500" },
  { key: "TE", name: "Third Year (TE)", sems: [5, 6], bg: "from-amber-500/10 to-orange-500/5", border: "border-amber-500/30", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
  { key: "BE", name: "Final Year (BE)", sems: [7, 8], bg: "from-emerald-500/10 to-teal-500/5", border: "border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
];

export function AdminDashboardPanel() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptsRes, semsRes, facultyRes, coursesRes] = await Promise.all([
        apiFetch<any>("/departments/"),
        apiFetch<any>("/semesters/"),
        apiFetch<any>("/profiles/faculty/"),
        apiFetch<any>("/courses/"),
      ]);

      const depts = Array.isArray(deptsRes) ? deptsRes : deptsRes.results ?? [];
      const sems = Array.isArray(semsRes) ? semsRes : semsRes.results ?? [];
      const faculty = Array.isArray(facultyRes) ? facultyRes : facultyRes.results ?? [];
      const crs = Array.isArray(coursesRes) ? coursesRes : coursesRes.results ?? [];

      setDepartments(depts);
      setSemesters(sems);
      setFacultyList(faculty);
      setCourses(crs);
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleAssignFaculty = async (courseId: string, facultyId: string | null) => {
    try {
      await apiFetch(`/courses/${courseId}/assign-faculty/`, {
        method: "PATCH",
        body: JSON.stringify({ faculty_user_id: facultyId || null }),
      });
      await loadData();
    } catch (err: any) {
      alert("Failed to assign faculty: " + (err?.message ?? "Error"));
    }
  };

  // Maps semId to sem number
  const semNumberMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const sem of semesters) {
      map[String(sem.id)] = Number(sem.number);
    }
    return map;
  }, [semesters]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const approved = courses.filter(c => c.status === "APPROVED" || c.status === "PUBLISHED" || c.status === "LOCKED").length;
    const submitted = courses.filter(c => c.status === "SUBMITTED").length;
    const draft = courses.filter(c => c.status === "DRAFT").length;
    const assignedCount = courses.filter(c => !!(c.faculty_user_id || c.faculty_id || c.faculty_name)).length;
    const unassignedCount = totalCourses - assignedCount;

    const overallRate = totalCourses > 0 ? Math.round((approved / totalCourses) * 100) : 0;

    return {
      totalCourses,
      approved,
      submitted,
      draft,
      assignedCount,
      unassignedCount,
      overallRate,
    };
  }, [courses]);

  // Year Progress Rates (FE, SE, TE, BE)
  const yearProgressRates = useMemo(() => {
    return YEAR_STAGES.map((stage) => {
      const stageCourses = courses.filter((c) => {
        const semNum = c.semester_id ? semNumberMap[String(c.semester_id)] : undefined;
        return semNum ? stage.sems.includes(semNum) : false;
      });

      const total = stageCourses.length;
      const approved = stageCourses.filter(c => ["APPROVED", "PUBLISHED", "LOCKED"].includes(c.status)).length;
      const rate = total > 0 ? Math.round((approved / total) * 100) : 0;

      return {
        ...stage,
        total,
        approved,
        rate,
      };
    });
  }, [courses, semNumberMap]);

  // HODs lookup per department
  const departmentHodMap = useMemo(() => {
    const map: Record<string, FacultyProfile[]> = {};
    for (const f of facultyList) {
      if (f.role === "HOD" && f.department_id) {
        const deptId = String(f.department_id);
        if (!map[deptId]) map[deptId] = [];
        map[deptId].push(f);
      }
    }
    return map;
  }, [facultyList]);

  // Department metrics
  const departmentMetrics = useMemo(() => {
    return departments.map((dept) => {
      const deptCourses = courses.filter((c) => String(c.department_id) === String(dept.id));
      const total = deptCourses.length;
      const approved = deptCourses.filter(c => ["APPROVED", "PUBLISHED", "LOCKED"].includes(c.status)).length;
      const submitted = deptCourses.filter(c => c.status === "SUBMITTED").length;
      const draft = deptCourses.filter(c => c.status === "DRAFT").length;
      const hods = departmentHodMap[String(dept.id)] || [];
      const rate = total > 0 ? Math.round((approved / total) * 100) : 0;

      return {
        dept,
        total,
        approved,
        submitted,
        draft,
        hods,
        rate,
      };
    });
  }, [departments, courses, departmentHodMap]);

  // Filtered courses for the main matrix table
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // Dept filter
      if (selectedDept !== "ALL" && String(c.department_id) !== String(selectedDept)) {
        return false;
      }
      // Status filter
      if (selectedStatus !== "ALL") {
        if (selectedStatus === "APPROVED" && !["APPROVED", "PUBLISHED", "LOCKED"].includes(c.status)) return false;
        if (selectedStatus === "SUBMITTED" && c.status !== "SUBMITTED") return false;
        if (selectedStatus === "DRAFT" && c.status !== "DRAFT") return false;
      }
      // Year filter
      if (selectedYear !== "ALL") {
        const semNum = c.semester_id ? semNumberMap[String(c.semester_id)] : undefined;
        if (!semNum) return false;
        const stage = YEAR_STAGES.find((s) => s.key === selectedYear);
        if (stage && !stage.sems.includes(semNum)) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const codeMatch = c.code.toLowerCase().includes(q);
        const titleMatch = c.title.toLowerCase().includes(q);
        const facultyMatch = (c.faculty_name || "").toLowerCase().includes(q);
        if (!codeMatch && !titleMatch && !facultyMatch) return false;
      }
      return true;
    });
  }, [courses, selectedDept, selectedStatus, selectedYear, searchQuery, semNumberMap]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Generating Executive Curriculum Matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* 1. Executive Top Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Departments</span>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-foreground">{departments.length}</div>
            <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
              {facultyList.filter(f => f.role === "HOD").length} HODs Assigned
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Total Subjects</span>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-foreground">{stats.totalCourses}</div>
            <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
              <span className="text-emerald-600 font-bold">{stats.assignedCount}</span> assigned · <span className="text-amber-600 font-bold">{stats.unassignedCount}</span> pending teacher
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Approved (Accepted)</span>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400">{stats.approved}</div>
            <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
              {stats.submitted} in review · {stats.draft} in draft
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-xs flex flex-col justify-between space-y-3 bg-gradient-to-br from-card to-primary/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary font-mono">Completion Rate</span>
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-primary">{stats.overallRate}%</div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${stats.overallRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Curriculum Completion Progress Rate by Year of Study */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div>
            <h2 className="text-base font-serif font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Curriculum Progress Rate by Academic Year
            </h2>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              Real-time syllabus completion progress across First Year (FE), Second Year (SE), Third Year (TE), and Final Year (BE).
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {yearProgressRates.map((yr) => (
            <div key={yr.key} className={cn("rounded-lg border bg-gradient-to-b p-5 space-y-3 shadow-xs transition-all hover:shadow-md", yr.bg, yr.border)}>
              <div className="flex items-center justify-between">
                <span className={cn("text-xs font-bold uppercase tracking-wider font-mono", yr.text)}>{yr.name}</span>
                <span className={cn("text-xs font-mono font-bold px-2 py-0.5 rounded bg-background border", yr.border, yr.text)}>
                  {yr.rate}%
                </span>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1.5">
                  <span>Approved Syllabi</span>
                  <span className="font-mono font-bold text-foreground">{yr.approved} / {yr.total}</span>
                </div>
                <div className="w-full bg-background/80 rounded-full h-2 overflow-hidden border border-border/40">
                  <div className={cn("h-2 rounded-full transition-all duration-500", yr.bar)} style={{ width: `${yr.rate}%` }} />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/75 font-semibold">
                Semesters {yr.sems.join(" & ")} catalog courses
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Departments & HOD Governance Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div>
            <h2 className="text-base font-serif font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Departments &amp; HOD Governance
            </h2>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              Overview of registered academic departments, assigned Heads of Department, and subject approval metrics.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departmentMetrics.map(({ dept, total, approved, submitted, draft, hods, rate }) => (
            <div key={dept.id} className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-xs hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                    {dept.code}
                  </span>
                  <h3 className="font-serif font-bold text-sm text-foreground truncate max-w-[180px]" title={dept.name}>
                    {dept.name}
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {rate}%
                </span>
              </div>

              {/* HOD info */}
              <div className="p-3 rounded bg-muted/40 border border-border/60 text-xs space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <UserCheck className="h-3 w-3 text-primary" /> Head of Department (HOD)
                </div>
                {hods.length > 0 ? (
                  hods.map((h) => (
                    <div key={h.id} className="font-bold text-foreground flex items-center justify-between">
                      <span>{h.first_name || h.last_name ? `${h.first_name} ${h.last_name}` : h.email}</span>
                      <span className="text-[10px] font-mono text-muted-foreground font-normal">({h.email})</span>
                    </div>
                  ))
                ) : (
                  <div className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <UserX className="h-3 w-3" /> No HOD Assigned
                  </div>
                )}
              </div>

              {/* Status pills */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/15">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{approved}</div>
                  <div className="text-[9px] font-bold uppercase text-muted-foreground">Approved</div>
                </div>
                <div className="p-2 rounded bg-amber-500/5 border border-amber-500/15">
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400">{submitted}</div>
                  <div className="text-[9px] font-bold uppercase text-muted-foreground">Review</div>
                </div>
                <div className="p-2 rounded bg-zinc-500/5 border border-zinc-500/15">
                  <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{draft}</div>
                  <div className="text-[9px] font-bold uppercase text-muted-foreground">Draft</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Interactive Subjects & Faculty Assignment Matrix */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-3">
          <div>
            <h2 className="text-base font-serif font-bold text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Subjects &amp; Faculty Coordinators Matrix
            </h2>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              Live status tracking of all subjects, assigned faculty teachers, and syllabus sign-offs.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs font-bold bg-muted/60 px-3 py-1.5 rounded border border-border">
            <span>Showing {filteredCourses.length} of {courses.length} subjects</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 p-4 rounded-lg bg-card border border-border shadow-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search code, title, teacher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded border border-border bg-background pl-9 pr-3 text-xs font-medium focus:outline-none focus:border-primary"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-9 rounded border border-border bg-background px-3 text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={String(d.id)}>{d.code} - {d.name}</option>
            ))}
          </select>

          {/* Academic Year Stage Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="h-9 rounded border border-border bg-background px-3 text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="ALL">All Years of Study</option>
            {YEAR_STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 rounded border border-border bg-background px-3 text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="ALL">All Approval Statuses</option>
            <option value="APPROVED">Approved / Accepted</option>
            <option value="SUBMITTED">Submitted for Review</option>
            <option value="DRAFT">In Draft</option>
          </select>
        </div>

        {/* Subjects Matrix Table */}
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-xs">
          <table className="w-full border-collapse text-xs text-left min-w-[700px]">
            <thead>
              <tr className="bg-muted/80 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Subject Code &amp; Title</th>
                <th className="py-3 px-4">Department &amp; Sem</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Assigned Teacher</th>
                <th className="py-3 px-4 text-center">Approval Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs font-semibold text-muted-foreground italic">
                    No subject records matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => {
                  const dept = departments.find(d => String(d.id) === String(c.department_id));
                  const semNum = c.semester_id ? semNumberMap[String(c.semester_id)] : undefined;
                  const isApproved = ["APPROVED", "PUBLISHED", "LOCKED"].includes(c.status);
                  const isSubmitted = c.status === "SUBMITTED";

                  // Faculty dropdown choices (faculty in this subject's department)
                  const deptFaculty = facultyList.filter(f => f.role === "FACULTY" && String(f.department_id) === String(c.department_id));

                  return (
                    <tr key={c.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                            {c.code}
                          </span>
                          <span className="font-bold text-foreground text-xs">{c.title}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-foreground">{dept?.code || "ENG"}</span>
                          <span>·</span>
                          <span>Sem {semNum || "?"}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[10px] font-bold uppercase text-muted-foreground">
                        {c.course_type || "THEORY"}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={c.faculty_user_id ?? c.faculty_id ?? ""}
                          onChange={(e) => void handleAssignFaculty(c.id, e.target.value || null)}
                          className="h-8 rounded border border-border bg-background px-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary cursor-pointer max-w-[200px]"
                        >
                          <option value="">-- No Teacher Assigned --</option>
                          {deptFaculty.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.first_name || f.last_name ? `${f.first_name} ${f.last_name}` : f.email}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 font-mono text-[9px] font-bold uppercase">
                            <CheckCircle2 className="h-3 w-3" /> Approved
                          </span>
                        ) : isSubmitted ? (
                          <span className="inline-flex items-center gap-1 rounded-sm bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 font-mono text-[9px] font-bold uppercase">
                            <Clock className="h-3 w-3" /> Under Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-sm bg-zinc-500/10 text-zinc-600 border border-zinc-500/20 px-2 py-0.5 font-mono text-[9px] font-bold uppercase">
                            <FileEdit className="h-3 w-3" /> Draft
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Link
                          href={`/courses/${c.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-primary hover:underline font-mono"
                        >
                          <Eye className="h-3 w-3" /> {isApproved ? "View" : "Draft"}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
