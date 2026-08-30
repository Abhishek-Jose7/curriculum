"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Layers,
  Loader2,
  Plus,
  ArrowRight,
  HelpCircle,
  Building2,
  GraduationCap,
  Sparkles,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SubjectType = "THEORY" | "LAB" | "THEORY_LAB" | "PROJECT" | "ELECTIVE";

interface PreviousSubject {
  code: string;
  title: string;
  course_type: string;
  credits: number;
  semester: number;
}

interface SemesterData {
  id: string;
  number: number;
  title: string;
  courses?: any[];
}

const YEAR_OF_STUDY_OPTIONS = [
  { label: "FE", fullName: "First Year", sems: [1, 2], color: "blue" },
  { label: "SE", fullName: "Second Year", sems: [3, 4], color: "purple" },
  { label: "TE", fullName: "Third Year", sems: [5, 6], color: "amber" },
  { label: "BE", fullName: "Final Year", sems: [7, 8], color: "green" },
];

export function HodCurriculumWorkspace() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedYearOfStudy, setSelectedYearOfStudy] = useState("SE"); // default to Second Year
  
  const [semesters, setSemesters] = useState<SemesterData[]>([]);
  const [previousSubjects, setPreviousSubjects] = useState<PreviousSubject[]>([]);
  const [facultyUsers, setFacultyUsers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [initializingSems, setInitializingSems] = useState(false);
  const [addingSubject, setAddingSubject] = useState<string | null>(null); // semesterId when adding custom
  
  // Custom Subject Form
  const [customCode, setCustomCode] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customType, setCustomType] = useState<SubjectType>("THEORY");
  const [customCredits, setCustomCredits] = useState("3");
  const [customFacultyId, setCustomFacultyId] = useState("");
  
  // Teacher selection for previous-subject quick adds (keyed by semester-number-index)
  const [prevSubjectTeacher, setPrevSubjectTeacher] = useState<Record<string, string>>({});
  
  // Active Year creation
  const [showAddYear, setShowAddYear] = useState(false);
  const [newYearName, setNewYearName] = useState("2026-27");
  const [newYearStart, setNewYearStart] = useState("2026-07-01");
  const [newYearEnd, setNewYearEnd] = useState("2027-06-30");
  const [creatingYear, setCreatingYear] = useState(false);

  // Initialize department dropdown or load HOD details
  useEffect(() => {
    async function loadInitialData() {
      try {
        const depts = await apiFetch<any>("/departments/");
        const deptsList = Array.isArray(depts) ? depts : depts.results ?? [];
        setDepartments(deptsList);
        
        // Default to HOD's department
        if (user?.department_id) {
          setSelectedDeptId(String(user.department_id));
        } else if (deptsList.length > 0) {
          setSelectedDeptId(String(deptsList[0].id));
        }

        const years = await apiFetch<any>("/academic-years/");
        const yearsList = Array.isArray(years) ? years : years.results ?? [];
        setAcademicYears(yearsList);
        if (yearsList.length > 0) {
          const activeYear = yearsList.find((y: any) => y.is_active) || yearsList[0];
          setSelectedYearId(String(activeYear.id));
        }

        try {
          const faculty = await apiFetch<any>("/profiles/faculty/");
          setFacultyUsers(Array.isArray(faculty) ? faculty : faculty.results ?? []);
        } catch (err) {
          console.error("Failed to load faculty list", err);
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoading(false);
      }
    }
    void loadInitialData();
  }, [user]);

  // Load semesters and previous subjects when selection changes
  useEffect(() => {
    if (!selectedDeptId || !selectedYearId) return;

    async function loadWorkspaceData() {
      try {
        // Load semesters for this department + academic year
        const semRes = await apiFetch<any>(`/semesters/?department_id=${selectedDeptId}&academic_year_id=${selectedYearId}`);
        const semList: SemesterData[] = Array.isArray(semRes) ? semRes : semRes.results ?? [];
        
        // Filter by the selected Year of Study
        const activeSems = YEAR_OF_STUDY_OPTIONS.find(y => y.label === selectedYearOfStudy)?.sems || [];

        // Load subjects for each semester (with placeholders if not configured)
        const semsWithCourses = await Promise.all(
          activeSems.map(async (semNum) => {
            const sem = semList.find(s => s.number === semNum);
            if (sem) {
              const courseRes = await apiFetch<any>(`/courses/?semester_id=${sem.id}`);
              const courses = Array.isArray(courseRes) ? courseRes : courseRes.results ?? [];
              return { ...sem, courses };
            } else {
              return {
                id: `placeholder-${semNum}`,
                number: semNum,
                title: `Semester ${["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][semNum - 1]}`,
                courses: []
              };
            }
          })
        );
        
        setSemesters(semsWithCourses);

        // Load previous subjects
        const prevRes = await apiFetch<PreviousSubject[]>(`/departments/${selectedDeptId}/previous-subjects/`);
        setPreviousSubjects(prevRes || []);
      } catch (err) {
        console.error("Failed to load workspace semesters", err);
      }
    }

    void loadWorkspaceData();
  }, [selectedDeptId, selectedYearId, selectedYearOfStudy]);

  const activeDept = departments.find(d => String(d.id) === selectedDeptId);

  // Initialize semesters for chosen Year of Study
  const handleInitializeYear = async () => {
    if (!selectedDeptId || !selectedYearId) return;
    setInitializingSems(true);
    try {
      await apiFetch("/semesters/initialize-year/", {
        method: "POST",
        body: JSON.stringify({
          department_id: selectedDeptId,
          academic_year_id: selectedYearId,
          year_of_study: selectedYearOfStudy
        })
      });
      
      // Reload sems
      const semRes = await apiFetch<any>(`/semesters/?department_id=${selectedDeptId}&academic_year_id=${selectedYearId}`);
      const semList: SemesterData[] = Array.isArray(semRes) ? semRes : semRes.results ?? [];
      const activeSems = YEAR_OF_STUDY_OPTIONS.find(y => y.label === selectedYearOfStudy)?.sems || [];

      const semsWithCourses = await Promise.all(
        activeSems.map(async (semNum) => {
          const sem = semList.find(s => s.number === semNum);
          if (sem) {
            const courseRes = await apiFetch<any>(`/courses/?semester_id=${sem.id}`);
            const courses = Array.isArray(courseRes) ? courseRes : courseRes.results ?? [];
            return { ...sem, courses };
          } else {
            return {
              id: `placeholder-${semNum}`,
              number: semNum,
              title: `Semester ${["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][semNum - 1]}`,
              courses: []
            };
          }
        })
      );
      setSemesters(semsWithCourses);
      alert(`${selectedYearOfStudy} Semesters initialized successfully!`);
    } catch (err: any) {
      alert("Initialization failed: " + (err?.message ?? "Error"));
    } finally {
      setInitializingSems(false);
    }
  };

  // Add Subject (either custom or from previous subjects)
  const handleCreateSubject = async (
    semId: string, 
    code: string, 
    title: string, 
    type: string, 
    credits: number, 
    facultyUserId: string
  ) => {
    try {
      let actualSemId = semId;
      if (semId.startsWith("placeholder-")) {
        const semNum = Number(semId.split("-")[1]);
        const semTitle = `Semester ${["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][semNum - 1]}`;
        const newSem = await apiFetch<any>("/semesters/", {
          method: "POST",
          body: JSON.stringify({
            department: Number(selectedDeptId),
            academic_year: Number(selectedYearId),
            department_id: Number(selectedDeptId),
            academic_year_id: Number(selectedYearId),
            number: semNum,
            title: semTitle,
            ordinance: ""
          })
        });
        actualSemId = String(newSem.id);
      }

      // Create course shell with the teacher already attached
      await apiFetch<any>("/courses/", {
        method: "POST",
        body: JSON.stringify({
          semester_id: actualSemId,
          code,
          title,
          course_type: type,
          credits,
          faculty_user_id: facultyUserId,
          status: "DRAFT"
        })
      });

      // Reload sems and courses
      const semRes = await apiFetch<any>(`/semesters/?department_id=${selectedDeptId}&academic_year_id=${selectedYearId}`);
      const semList: SemesterData[] = Array.isArray(semRes) ? semRes : semRes.results ?? [];
      const activeSems = YEAR_OF_STUDY_OPTIONS.find(y => y.label === selectedYearOfStudy)?.sems || [];
      const semsWithCourses = await Promise.all(
        activeSems.map(async (semNum) => {
          const sem = semList.find(s => s.number === semNum);
          if (sem) {
            const courseRes = await apiFetch<any>(`/courses/?semester_id=${sem.id}`);
            const courses = Array.isArray(courseRes) ? courseRes : courseRes.results ?? [];
            return { ...sem, courses };
          } else {
            return {
              id: `placeholder-${semNum}`,
              number: semNum,
              title: `Semester ${["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][semNum - 1]}`,
              courses: []
            };
          }
        })
      );
      setSemesters(semsWithCourses);
      
      // Clear forms
      setCustomCode("");
      setCustomTitle("");
      setCustomFacultyId("");
      setAddingSubject(null);
      
      alert(`Subject "${title}" created successfully.`);
    } catch (err: any) {
      alert("Failed to create subject: " + (err?.message ?? "Error"));
    }
  };

  // Quick initialize academic year
  const handleCreateAcademicYear = async () => {
    if (!newYearName.trim()) return;
    setCreatingYear(true);
    try {
      const year = await apiFetch<any>("/academic-years/", {
        method: "POST",
        body: JSON.stringify({
          name: newYearName.trim(),
          starts_on: newYearStart,
          ends_on: newYearEnd,
          is_active: 1
        })
      });
      setAcademicYears(prev => [...prev, year]);
      setSelectedYearId(String(year.id));
      setShowAddYear(false);
      alert(`Academic Year ${newYearName} initialized!`);
    } catch (err: any) {
      alert("Failed to create academic year: " + (err?.message ?? "Error"));
    } finally {
      setCreatingYear(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground uppercase font-mono tracking-widest">Loading workspace docket...</p>
      </div>
    );
  }

  // Teachers scoped to the currently selected department
  const deptFaculty = facultyUsers.filter((f: any) => f.role === "FACULTY" && String(f.department_id) === String(selectedDeptId));

  const handleAssignFaculty = async (courseId: string, facultyId: string | null, semId: string) => {
    try {
      await apiFetch(`/courses/${courseId}/assign-faculty/`, {
        method: "PATCH",
        body: JSON.stringify({ faculty_user_id: facultyId || null }),
      });
      const updatedCourses = await apiFetch<any>(`/courses/?semester_id=${semId}`);
      setSemesters(prev => prev.map(s => s.id === semId ? { ...s, courses: Array.isArray(updatedCourses) ? updatedCourses : updatedCourses.results ?? [] } : s));
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("SEMESTER_LOCKED")) {
        alert("This semester isn't unlocked yet — unlock the semester pair in the Scheme Unlock Console first.");
      } else {
        alert("Failed to assign faculty: " + msg);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Top Banner Details */}
      <section className="bg-card/30 border border-border p-6 rounded relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-primary pointer-events-none">
          <Building2 className="h-44 w-44" />
        </div>
        <div className="space-y-4 max-w-2xl relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-sm uppercase tracking-wider font-mono">
              HOD workspace
            </span>
            {activeDept && (
              <span className="text-[10px] font-bold text-muted-foreground font-mono">
                {activeDept.college_name}
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground tracking-tight leading-tight">
            Curriculum Office Dashboard: <br className="hidden md:inline" />
            <span className="italic font-normal text-muted-foreground">
              {activeDept ? activeDept.name : "Department Curriculum"}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
            Manage academic years, initialize semesters for years of study, and coordinate syllabus drafting with teachers.
          </p>
        </div>
      </section>

      {/* Control Panel Grid */}
      <section className="grid gap-6 md:grid-cols-3 bg-card border border-border rounded p-6 shadow-sm">
        {/* Department Selector (Only shown to admin/cross-department roles, read-only for department HOD) */}
        <label className="block space-y-1.5">
          <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 text-primary" /> Department
          </span>
          <select
            disabled={!!user?.department_id}
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold transition-all focus:outline-none focus:border-primary disabled:opacity-75 cursor-pointer"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </label>

        {/* Academic Year Selection */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-primary" /> Academic Year</span>
            {!showAddYear && (
              <button onClick={() => setShowAddYear(true)} className="text-primary text-[9px] hover:underline font-mono uppercase tracking-wider">
                + Init New
              </button>
            )}
          </span>
          {showAddYear ? (
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="2026-27"
                value={newYearName}
                onChange={(e) => setNewYearName(e.target.value)}
                className="h-10 flex-1 rounded-sm border border-border bg-background px-3.5 text-xs font-bold"
              />
              <Button size="sm" onClick={handleCreateAcademicYear} disabled={creatingYear} className="h-10 px-3 shrink-0 font-bold">
                {creatingYear ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Init"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAddYear(false)} className="h-10 px-3 shrink-0 border-border">
                Esc
              </Button>
            </div>
          ) : (
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold transition-all focus:outline-none focus:border-primary cursor-pointer"
            >
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.is_active ? "(Active)" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Year of Study Selection */}
        <label className="block space-y-1.5">
          <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-primary" /> Active Year of Study
          </span>
          <select
            value={selectedYearOfStudy}
            onChange={(e) => setSelectedYearOfStudy(e.target.value)}
            className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold transition-all focus:outline-none focus:border-primary cursor-pointer"
          >
            {YEAR_OF_STUDY_OPTIONS.map((y) => (
              <option key={y.label} value={y.label}>
                {y.label} — {y.fullName}
              </option>
            ))}
          </select>
        </label>
      </section>

      {/* Initialize Button if Semesters are missing */}
      {semesters.every(s => s.id.startsWith("placeholder-")) && selectedYearId && (
        <div className="rounded border border-dashed border-border/80 p-12 text-center bg-card/10 space-y-4">
          <div className="flex justify-center">
            <Layers className="h-12 w-12 text-muted-foreground/30" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-serif font-bold text-foreground">Semesters Not Mapped</h3>
            <p className="text-[11px] text-muted-foreground/80 max-w-md mx-auto">
              Semesters for {selectedYearOfStudy} ({YEAR_OF_STUDY_OPTIONS.find(y => y.label === selectedYearOfStudy)?.fullName}) are not initialized for this academic year yet.
            </p>
          </div>
          <Button onClick={handleInitializeYear} disabled={initializingSems} className="h-10 px-5 font-bold tracking-tight">
            {initializingSems ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Initializing sems...
              </>
            ) : (
              <>
                Initialize {selectedYearOfStudy} Semesters <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Main Semester Curriculum List */}
      {!semesters.every(s => s.id.startsWith("placeholder-")) && semesters.length > 0 && (
        <div className="space-y-12">
          {semesters.map((sem) => {
            const activeColor = YEAR_OF_STUDY_OPTIONS.find(y => y.label === selectedYearOfStudy)?.color || "blue";
            const borderCls = {
              blue: "border-l-blue-500",
              purple: "border-l-purple-500",
              amber: "border-l-amber-500",
              green: "border-l-emerald-500"
            }[activeColor];

            const chipCls = {
              blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
              purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
              amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
              green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
            }[activeColor];

            // Filter previous subjects for this semester
            const filteredPrevSubjects = previousSubjects.filter(ps => ps.semester === sem.number);

            return (
              <div key={sem.id} className="space-y-6">
                {/* Semester Header */}
                <div className={cn("flex items-center justify-between px-4 py-2 bg-secondary/35 border-l-4 rounded-r font-bold text-xs text-foreground", borderCls)}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-muted border border-border/80 px-2 py-0.5 rounded text-primary text-[10px]">
                      Sem {sem.number}
                    </span>
                    <span className="text-sm font-serif font-extrabold">{sem.title}</span>
                  </div>
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border", chipCls)}>
                    {selectedYearOfStudy}
                  </span>
                </div>

                {/* Course Shells Cards */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/80 font-mono">
                      Active Subjects
                    </h4>
                    {sem.courses?.length === 0 ? (
                      <div className="rounded border border-dashed border-border p-8 text-center text-xs font-semibold text-muted-foreground bg-card/20 italic">
                        No subjects added to this semester yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sem.courses?.map((course: any) => {
                          return (
                            <div key={course.id} className="p-4 bg-card rounded border border-border space-y-3.5 shadow-xs hover:border-primary/20 transition-all group">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 font-bold">
                                      {course.code}
                                    </span>
                                    <span className="text-xs font-bold text-foreground">
                                      {course.title}
                                    </span>
                                  </div>
                                  <div className="flex gap-2 text-[10px] font-semibold text-muted-foreground mt-1.5">
                                    <span>{course.course_type}</span>
                                    <span>•</span>
                                    <span>{course.credits} Credits</span>
                                  </div>
                                </div>
                                <span className={cn("text-[9px] font-extrabold uppercase px-1.5 py-0.5 border rounded-sm",
                                  course.status === "APPROVED" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                                  course.status === "PUBLISHED" && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                                  course.status === "DRAFT" && "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                                )}>
                                  {course.status}
                                </span>
                              </div>

                              {/* Faculty coordinator details */}
                              <div className="pt-3 border-t border-border/50 text-xs">
                                {course.faculty_name ? (
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-muted-foreground font-semibold">Coordinator Assigned:</span>
                                    <span className="font-bold text-foreground">{course.faculty_name}</span>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-semibold text-muted-foreground leading-relaxed">
                                      Assign a coordinator teacher to delegate syllabus drafting credentials.
                                    </p>
                                    {deptFaculty.length === 0 ? (
                                      <p className="text-[10px] font-bold text-amber-600">No active teachers in this department yet.</p>
                                    ) : (
                                      <select
                                        value={course.faculty_user_id ?? ""}
                                        onChange={(e) => void handleAssignFaculty(course.id, e.target.value || null, sem.id)}
                                        className="h-8 w-full rounded border border-border bg-background px-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary cursor-pointer"
                                      >
                                        <option value="">-- Assign Teacher --</option>
                                        {deptFaculty.map((f: any) => (
                                          <option key={f.id} value={f.id}>
                                            {f.first_name || f.last_name ? `${f.first_name} ${f.last_name}` : f.email} ({f.email})
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Previous subjects & Adding Custom subject */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/80 font-mono">
                        Previous Curriculum Subjects
                      </h4>
                      {addingSubject !== sem.id && (
                        <button
                          onClick={() => setAddingSubject(sem.id)}
                          className="text-primary text-[9px] font-bold hover:underline font-mono uppercase tracking-wider flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Custom Subject
                        </button>
                      )}
                    </div>

                    {/* Adding Subject Form / Panel */}
                    {addingSubject === sem.id && (
                      <div className="p-4 bg-muted/30 border border-border/80 rounded-sm space-y-3.5 animate-fade-in text-xs">
                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                          <span className="font-serif font-bold text-foreground">Add Custom Subject</span>
                          <button onClick={() => setAddingSubject(null)} className="text-[10px] font-semibold text-muted-foreground hover:text-foreground">
                            Cancel
                          </button>
                        </div>
                        <div className="grid gap-2.5 grid-cols-2">
                          <label className="block space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Code</span>
                            <input
                              type="text"
                              value={customCode}
                              onChange={(e) => setCustomCode(e.target.value)}
                              placeholder="e.g. CS301"
                              className="h-8 w-full rounded border border-border bg-background px-2"
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Title</span>
                            <input
                              type="text"
                              value={customTitle}
                              onChange={(e) => setCustomTitle(e.target.value)}
                              placeholder="e.g. Data Structures"
                              className="h-8 w-full rounded border border-border bg-background px-2"
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Type</span>
                            <select
                              value={customType}
                              onChange={(e) => setCustomType(e.target.value as SubjectType)}
                              className="h-8 w-full rounded border border-border bg-background px-1.5 cursor-pointer"
                            >
                              <option value="THEORY">THEORY</option>
                              <option value="LAB">LAB</option>
                              <option value="THEORY_LAB">THEORY & LAB</option>
                              <option value="PROJECT">PROJECT</option>
                              <option value="ELECTIVE">ELECTIVE</option>
                            </select>
                          </label>
                          <label className="block space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Credits</span>
                            <input
                              type="number"
                              value={customCredits}
                              onChange={(e) => setCustomCredits(e.target.value)}
                              className="h-8 w-full rounded border border-border bg-background px-2"
                            />
                          </label>
                        </div>
                        <label className="block space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Coordinator Teacher (Required)</span>
                          {deptFaculty.length === 0 ? (
                            <p className="text-[10px] font-bold text-amber-600">No active teachers in this department yet.</p>
                          ) : (
                            <select
                              value={customFacultyId}
                              onChange={(e) => setCustomFacultyId(e.target.value)}
                              className="h-8 w-full rounded border border-border bg-background px-1.5 cursor-pointer"
                            >
                              <option value="">-- Select Teacher --</option>
                              {deptFaculty.map((f: any) => (
                                <option key={f.id} value={f.id}>
                                  {f.first_name || f.last_name ? `${f.first_name} ${f.last_name}` : f.email} ({f.email})
                                </option>
                              ))}
                            </select>
                          )}
                        </label>
                        <Button
                          disabled={!customCode.trim() || !customTitle.trim() || !customFacultyId}
                          onClick={() => void handleCreateSubject(sem.id, customCode.trim(), customTitle.trim(), customType, Number(customCredits) || 3, customFacultyId)}
                          className="h-8 w-full text-xs font-bold uppercase tracking-wider mt-1"
                        >
                          Create Subject Shell
                        </Button>
                      </div>
                    )}

                    {/* Previous Subjects List */}
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {filteredPrevSubjects.length === 0 ? (
                        <div className="rounded border border-dashed border-border/80 p-8 text-center text-xs font-semibold text-muted-foreground/60 bg-card/20 italic">
                          No previous curriculum subjects recorded for Sem {sem.number}.
                        </div>
                      ) : (
                        filteredPrevSubjects.map((prevSub, index) => {
                          const isAlreadyCreated = sem.courses?.some(
                            c => c.code.toLowerCase() === prevSub.code.toLowerCase()
                          );

                          return (
                            <div
                              key={index}
                              className={cn(
                                "p-3 rounded border flex items-center justify-between gap-3 text-xs shadow-inner",
                                isAlreadyCreated
                                  ? "bg-muted/30 border-border/50 opacity-60"
                                  : "bg-background border-border hover:border-primary/20 transition-all"
                              )}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono text-[9px] bg-muted px-1.5 py-0.5 rounded text-primary font-bold border border-border/60">
                                    {prevSub.code}
                                  </span>
                                  <span className="font-bold text-foreground/80 truncate max-w-[200px]">
                                    {prevSub.title}
                                  </span>
                                </div>
                                <div className="flex gap-2 text-[9px] font-semibold text-muted-foreground/60 mt-1">
                                  <span>{prevSub.course_type}</span>
                                  <span>•</span>
                                  <span>{prevSub.credits} Credits</span>
                                </div>
                              </div>

                              {isAlreadyCreated ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 shrink-0 font-mono">
                                  <CheckCircle2 className="h-3 w-3" /> Added
                                </span>
                              ) : (
                                <div className="flex items-center gap-1 shrink-0">
                                  <select
                                    value={prevSubjectTeacher[`${sem.number}-${index}`] ?? ""}
                                    onChange={(e) => setPrevSubjectTeacher(prev => ({ ...prev, [`${sem.number}-${index}`]: e.target.value }))}
                                    className="h-8 w-40 rounded border border-border bg-background px-1.5 text-[10px] font-semibold cursor-pointer"
                                  >
                                    <option value="">-- Teacher --</option>
                                    {deptFaculty.map((f: any) => (
                                      <option key={f.id} value={f.id}>
                                        {f.first_name || f.last_name ? `${f.first_name} ${f.last_name}` : f.email}
                                      </option>
                                    ))}
                                  </select>
                                  <Button
                                    size="sm"
                                    disabled={!prevSubjectTeacher[`${sem.number}-${index}`]}
                                    onClick={() => {
                                      void handleCreateSubject(
                                        sem.id, 
                                        prevSub.code, 
                                        prevSub.title, 
                                        prevSub.course_type, 
                                        prevSub.credits, 
                                        prevSubjectTeacher[`${sem.number}-${index}`] ?? ""
                                      );
                                      setPrevSubjectTeacher(prev => ({ ...prev, [`${sem.number}-${index}`]: "" }));
                                    }}
                                    className="h-8 px-2.5 text-[10px] font-bold uppercase"
                                  >
                                    Add
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
