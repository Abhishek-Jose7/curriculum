# Task 2 Brief: Backend Endpoint for Quick 1-Click Faculty Re-assignment

## Context
Working repo: `d:/Coding/Projects/CRCE-CURR/curriculum/`
All paths relative to that root.

## Read First
- `backend-worker/src/index.ts` — search for `/courses/:id` routes and `requireRole` usage

## Requirements

Add a dedicated endpoint for quick 1-click teacher assignment in `backend-worker/src/index.ts`:

`PATCH /api/courses/:id/assign-faculty/` (and `PATCH /api/courses/:id/assign-faculty`):
- Requires `requireRole('ADMIN', 'HOD')`
- Expects JSON body: `{ faculty_user_id: string | null }`
- Executes SQL:
  ```sql
  UPDATE courses SET faculty_user_id = ? WHERE id = ? RETURNING *
  ```
- If course not found (no row returned) → return `c.json({ detail: "Course not found." }, 404)`
- Return updated course object JSON `c.json(course)`

## Commit Message
```powershell
git add backend-worker/src/index.ts
git commit -m "feat(backend): PATCH /courses/:id/assign-faculty/ for 1-click teacher assignment"
```

## Report Contract
Write report to: `d:/Coding/Projects/CRCE-CURR/curriculum/.superpowers/sdd/2026-08-08-academic-year-subject-config/task-2-report.md`
Reply with: Status (DONE / BLOCKED), Commits, Test summary, Concerns.
