# Academic Year Setup, Auto-Semester Generation, Subject Config & Teacher Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide auto-creation of Semesters 1-8 and pre-filled default subject shells on fresh Academic Year creation, an inline Subject Configuration drawer per semester, and 1-click teacher assignment/re-assignment for HODs and Admins.

**Architecture:** Extend backend Worker `index.ts` with auto-seeding logic for new academic years, a faculty listing endpoint, and a quick faculty assignment PATCH route. Update frontend `admin/page.tsx` with an inline Subject Drawer inside semester cards featuring an instant teacher dropdown.

**Tech Stack:** Next.js, Cloudflare Worker (Hono), SQLite D1, Tailwind CSS, Lucide icons.

## Global Constraints

- Repo root: `d:/Coding/Projects/CRCE-CURR/curriculum/`
- All PowerShell commands use semicolons `;` instead of `&&`
- Roles: `ADMIN`, `HOD`, `FACULTY`
- No breaking changes to existing routes or data models

---

### Task 1: Backend Endpoint for Auto-Semester/Subject Pre-filling & Faculty List

**Files:**
- Modify: `backend-worker/src/index.ts`

**Interfaces:**
- Produces: `POST /api/academic-years/` auto-generation, `GET /api/profiles/faculty/`

- [ ] **Step 1: Update POST /api/academic-years/ in backend-worker/src/index.ts**

In `backend-worker/src/index.ts`, intercept `POST /academic-years/` or update `ayRoute`:

Add a custom handler for `POST /academic-years/` (or update `ayRoute`) so that after creating the academic year:
1. Check if any other academic year exists (`SELECT COUNT(*) FROM academic_years WHERE id != ?`).
2. If count === 0 (first/fresh setup):
   - Query all departments: `SELECT id FROM departments`.
   - For each department:
     - For semester numbers 1 to 8:
       - Generate semester `id = crypto.randomUUID()`.
       - Title = `Semester ${semNumber}`.
       - Insert into `semesters (id, department_id, academic_year_id, number, title, ordinance)`.
       - Create 2-3 default subject shells for that semester (e.g. `CS101` - Programming Fundamentals for Sem 1, `CS201` - Data Structures for Sem 3, etc.).
       - Set `status = 'DRAFT'`, `faculty_user_id = NULL`.

- [ ] **Step 2: Add GET /api/profiles/faculty/ endpoint**

In `backend-worker/src/index.ts`, add:
```typescript
api.get("/profiles/faculty/", requireRole("ADMIN", "HOD"), async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id, email, first_name, last_name, role, department_id FROM profiles WHERE role IN ('FACULTY', 'HOD', 'ADMIN') AND is_active = 1 ORDER BY first_name, last_name"
  ).all();
  return c.json(rows.results ?? []);
});
```

- [ ] **Step 3: Commit Task 1**

```powershell
git add backend-worker/src/index.ts
git commit -m "feat(backend): auto-generate sem 1-8 and default subjects on fresh academic year creation + GET /profiles/faculty/ route"
```

---

### Task 2: Backend Endpoint for Quick 1-Click Faculty Re-assignment

**Files:**
- Modify: `backend-worker/src/index.ts`

- [ ] **Step 1: Add PATCH /api/courses/:id/assign-faculty/ in backend-worker/src/index.ts**

```typescript
api.patch("/courses/:id/assign-faculty/", requireRole("ADMIN", "HOD"), async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{ faculty_user_id: string | null }>();
  const course = await c.env.DB.prepare(
    "UPDATE courses SET faculty_user_id = ? WHERE id = ? RETURNING *"
  ).bind(body.faculty_user_id ?? null, id).first<any>();
  if (!course) return c.json({ detail: "Course not found." }, 404);
  return c.json(course);
});
```

- [ ] **Step 2: Commit Task 2**

```powershell
git add backend-worker/src/index.ts
git commit -m "feat(backend): PATCH /courses/:id/assign-faculty/ for 1-click teacher assignment"
```

---

### Task 3: Frontend Inline Subject Drawer & Faculty Dropdown in Admin Page

**Files:**
- Modify: `frontend/app/admin/page.tsx`

- [ ] **Step 1: Load Faculty list on mount in admin/page.tsx**

Add state for `facultyUsers: { id: string; email: string; first_name: string; last_name: string; role: string }[]`.
Fetch `GET /profiles/faculty/` on mount.

- [ ] **Step 2: Add Inline Subject Drawer & Faculty Dropdown inside Semester cards**

Add state:
```typescript
const [expandedSemId, setExpandedSemId] = useState<string | null>(null);
const [semCourses, setSemCourses] = useState<Record<string, any[]>>({});
```

In each Semester card in the Semester List section:
- Add a **"Configure Subjects"** button with a count badge.
- When expanded, render the **Subject Drawer**:
  - **Quick Add Subject Form**: Code, Title, Course Type (`THEORY`, `LAB`, `PROJECT`), Credits, and Teacher Dropdown.
  - **Subject Cards List**: Code, Title, Credits, Course Type, and a **Teacher Selector Dropdown** (`<select value={course.faculty_user_id || ''} onChange={...}>`).
  - Selecting a teacher calls `PATCH /courses/:id/assign-faculty/` directly and updates the state.

- [ ] **Step 3: Test TypeScript build**

Run `npx tsc --noEmit` in `frontend/` to ensure zero errors.

- [ ] **Step 4: Commit Task 3**

```powershell
git add frontend/app/admin/page.tsx
git commit -m "feat(frontend): inline subject drawer in semester cards with 1-click faculty assignment dropdown"
```
