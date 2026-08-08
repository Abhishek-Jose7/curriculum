# Task 1 Brief: Backend Endpoint for Auto-Semester/Subject Pre-filling & Faculty List

## Context
Working repo: `d:/Coding/Projects/CRCE-CURR/curriculum/`
All paths relative to that root.

## Read First
- `backend-worker/src/index.ts` — understand how `ayRoute` / `POST /academic-years/` and `GET /profiles/` routes work

## Requirements

1. **Update `POST /academic-years/` in `backend-worker/src/index.ts`**:
   - Check if any other academic year exists: `SELECT COUNT(*) AS count FROM academic_years` (excluding the new id).
   - If count === 0 (or no other academic year exists):
     - Query all departments: `SELECT id FROM departments`.
     - For each department:
       - Loop `semNumber` from 1 to 8:
         - Create semester: `INSERT INTO semesters (id, department_id, academic_year_id, number, title, ordinance) VALUES (crypto.randomUUID(), dept.id, newAy.id, semNumber, 'Semester ' || semNumber, '')`.
         - Create 2 default sample course shells for that semester:
           - Course 1: `code = 'SUB' || semNumber || '01'`, `title = 'Subject ' || semNumber || '.1'`, `course_type = 'THEORY'`, `credits = 4`, `lecture_hours = 3`, `tutorial_hours = 1`, `status = 'DRAFT'`.
           - Course 2: `code = 'SUB' || semNumber || '02'`, `title = 'Subject ' || semNumber || '.2 Lab'`, `course_type = 'LAB'`, `credits = 2`, `practical_hours = 4`, `status = 'DRAFT'`.

2. **Add `GET /api/profiles/faculty/` in `backend-worker/src/index.ts`**:
   - Requires `requireRole('ADMIN', 'HOD')`
   - Returns active profiles with `role IN ('FACULTY', 'HOD', 'ADMIN')`:
     `SELECT id, email, first_name, last_name, role, department_id FROM profiles WHERE role IN ('FACULTY', 'HOD', 'ADMIN') AND is_active = 1 ORDER BY first_name, last_name`

## Commit Message
```powershell
git add backend-worker/src/index.ts
git commit -m "feat(backend): auto-generate sem 1-8 and default subjects on fresh academic year creation + GET /profiles/faculty/ route"
```

## Report Contract
Write report to: `d:/Coding/Projects/CRCE-CURR/curriculum/.superpowers/sdd/2026-08-08-academic-year-subject-config/task-1-report.md`
Reply with: Status (DONE / BLOCKED), Commits, Test summary, Concerns.
