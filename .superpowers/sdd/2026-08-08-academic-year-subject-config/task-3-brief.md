# Task 3 Brief: Frontend Inline Subject Drawer & Faculty Dropdown in Admin Page

## Context
Working repo: `d:/Coding/Projects/CRCE-CURR/curriculum/`
All paths relative to that root.

## Read First
- `frontend/app/admin/page.tsx` — read the FULL file (~820 lines). Understand the semester list rendering, existing state, form submit handlers, and modal/drawer patterns.
- `frontend/lib/api.ts` — `apiFetch<T>(path, options?)`

## Requirements

1. **Load Faculty list on mount in `frontend/app/admin/page.tsx`**:
   - Add state: `const [facultyUsers, setFacultyUsers] = useState<any[]>([]);`
   - In `useEffect` on mount, fetch `apiFetch<any[]>("/profiles/faculty/")` and set `facultyUsers`.

2. **Add Inline Subject Configuration Drawer inside Semester cards**:
   - Add state:
     ```typescript
     const [expandedSemId, setExpandedSemId] = useState<string | null>(null);
     const [semCourses, setSemCourses] = useState<Record<string, any[]>>({});
     const [loadingSemCourses, setLoadingSemCourses] = useState<string | null>(null);

     // Quick add subject form state
     const [newSubjectCode, setNewSubjectCode] = useState("");
     const [newSubjectTitle, setNewSubjectTitle] = useState("");
     const [newSubjectType, setNewSubjectType] = useState("THEORY");
     const [newSubjectCredits, setNewSubjectCredits] = useState("4");
     const [newSubjectFaculty, setNewSubjectFaculty] = useState("");
     const [addingSubject, setAddingSubject] = useState(false);
     ```

   - Helper to load courses for a semester:
     ```typescript
     async function loadSemesterCourses(semId: string) {
       setLoadingSemCourses(semId);
       try {
         const res = await apiFetch<any[]>(`/courses/?semester=${semId}`);
         const list = Array.isArray(res) ? res : (res as any).results ?? [];
         setSemCourses((prev) => ({ ...prev, [semId]: list }));
       } catch (err) {
         console.error("Failed to load semester courses", err);
       } finally {
         setLoadingSemCourses(null);
       }
     }
     ```

   - Helper to add a subject shell directly to a semester:
     ```typescript
     async function handleAddSubject(semId: string) {
       if (!newSubjectCode.trim() || !newSubjectTitle.trim()) return;
       setAddingSubject(true);
       try {
         await apiFetch("/courses/", {
           method: "POST",
           body: JSON.stringify({
             semester: semId,
             code: newSubjectCode.trim(),
             title: newSubjectTitle.trim(),
             course_type: newSubjectType,
             credits: Number(newSubjectCredits) || 4,
             faculty_user_id: newSubjectFaculty || null,
             status: "DRAFT",
           }),
         });
         setNewSubjectCode("");
         setNewSubjectTitle("");
         setNewSubjectFaculty("");
         await loadSemesterCourses(semId);
       } catch (err: any) {
         alert("Failed to add subject: " + (err?.message ?? "Error"));
       } finally {
         setAddingSubject(false);
       }
     }
     ```

   - Helper to assign/re-assign faculty for a course:
     ```typescript
     async function handleAssignFaculty(courseId: string, facultyId: string | null, semId: string) {
       try {
         await apiFetch(`/courses/${courseId}/assign-faculty/`, {
           method: "PATCH",
           body: JSON.stringify({ faculty_user_id: facultyId || null }),
         });
         await loadSemesterCourses(semId);
       } catch (err: any) {
         alert("Failed to assign faculty: " + (err?.message ?? "Error"));
       }
     }
     ```

3. **In the Render for each Semester Card**:
   - Next to semester title, show a button:
     ```tsx
     <Button
       variant="outline"
       size="sm"
       onClick={() => {
         if (expandedSemId === semester.id) {
           setExpandedSemId(null);
         } else {
           setExpandedSemId(semester.id);
           void loadSemesterCourses(semester.id);
         }
       }}
       className="h-7 text-[10px] font-bold uppercase tracking-wider gap-1 border-primary/30 text-primary hover:bg-primary/10"
     >
       <BookOpen className="h-3 w-3" />
       Configure Subjects ({(semCourses[semester.id] ?? []).length})
     </Button>
     ```
   - When `expandedSemId === semester.id`, render the **Inline Subject Drawer**:
     - **Subject List**: Cards showing Code, Title, Course Type badge, Credits, and a **Faculty Select Dropdown**:
       ```tsx
       <select
         value={course.faculty_user_id ?? ""}
         onChange={(e) => void handleAssignFaculty(course.id, e.target.value || null, semester.id)}
         className="h-8 rounded border border-border bg-background px-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
       >
         <option value="">-- No Teacher Assigned --</option>
         {facultyUsers.map((f) => (
           <option key={f.id} value={f.id}>
             {f.first_name} {f.last_name} ({f.email})
           </option>
         ))}
       </select>
       ```
     - **Quick Add Subject Form**: Fields for Code, Title, Type (`THEORY`/`LAB`/`PROJECT`), Credits, Teacher Select, and **Add Subject Shell** button.

## Commit Message
```powershell
git add frontend/app/admin/page.tsx
git commit -m "feat(frontend): inline subject drawer in semester cards with 1-click faculty assignment dropdown"
```

## Report Contract
Write report to: `d:/Coding/Projects/CRCE-CURR/curriculum/.superpowers/sdd/2026-08-08-academic-year-subject-config/task-3-report.md`
Reply with: Status (DONE / BLOCKED), Commits, Test summary, Concerns.
