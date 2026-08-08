# Task 1 Report: Backend Endpoint for Auto-Semester/Subject Pre-filling & Faculty List

## Status
DONE

## Commits
- `8699f97`: `feat(backend): auto-generate sem 1-8 and default subjects on fresh academic year creation + GET /profiles/faculty/ route`

## Changes Summary
1. **Updated `POST /academic-years/` & `POST /academic-years`**:
   - In `backend-worker/src/index.ts`, added `handleCreateAcademicYear` handler.
   - Requires `isAcademicAdmin(user)` permission check.
   - Inserts new academic year into `academic_years`.
   - Checks if any other academic year exists: `SELECT COUNT(*) AS count FROM academic_years WHERE id != ?`.
   - If `count === 0` (fresh database / first academic year):
     - Queries all departments (`SELECT id FROM departments`).
     - For each department, iterates semesters 1 through 8:
       - Creates semester (`INSERT INTO semesters (id, department_id, academic_year_id, number, title, ordinance)`).
       - Creates Course 1: `code = 'SUB' || semNumber || '01'`, `title = 'Subject ' || semNumber || '.1'`, `course_type = 'THEORY'`, `credits = 4`, `lecture_hours = 3`, `tutorial_hours = 1`, `status = 'DRAFT'`.
       - Creates Course 2: `code = 'SUB' || semNumber || '02'`, `title = 'Subject ' || semNumber || '.2 Lab'`, `course_type = 'LAB'`, `credits = 2`, `practical_hours = 4`, `status = 'DRAFT'`.
   - Returns created academic year object with HTTP status 201.

2. **Added `GET /api/profiles/faculty/` & `GET /api/profiles/faculty`**:
   - Requires `requireRole('ADMIN', 'HOD')` middleware.
   - Executes query: `SELECT id, email, first_name, last_name, role, department_id FROM profiles WHERE role IN ('FACULTY', 'HOD', 'ADMIN') AND is_active = 1 ORDER BY first_name, last_name`.
   - Returns active faculty/HOD/admin profiles sorted alphabetically by first name and last name.

## Test Summary
- **Type Checking**: Executed `npx tsc --noEmit` in `backend-worker` — **0 errors**.
- **End-to-End Integration Testing**:
  - Ran comprehensive integration test script against in-memory D1 database schema.
  - **Faculty List Endpoint Test**: Verified Admin token returns active ADMIN, HOD, and FACULTY profiles (ordered by first_name, last_name) and excludes inactive/reviewer profiles. Verified FACULTY token receives 403 Forbidden.
  - **Fresh Academic Year Creation Test**: Verified creating initial academic year automatically creates 16 semesters (8 per department) and 32 default course shells with exact course codes (`SUB101`, `SUB102`, etc.), titles, credits, lecture/practical hours, and `DRAFT` status.
  - **Subsequent Academic Year Creation Test**: Verified creating a 2nd academic year creates the record without re-generating default semesters or courses.

## Concerns
None.
