# Design Spec: Academic Year Setup, Auto-Semester Generation, Subject Configuration & Teacher Assignment

**Date:** 2026-08-08  
**Status:** Approved by User  

---

## 1. Overview & Goals

This specification outlines the complete workflow for managing Academic Years, Semesters, Subject Shells, and Faculty Assignments in the Curriculum Management System:

1. **Academic Year Setup**:
   - **With Prior Year**: Rollover automatically clones all semesters, course shells, and child structures from the prior academic year into the new academic year (courses set to `DRAFT`, faculty assignments cleared).
   - **Fresh Setup (No Prior Year)**: Automatically generates **Semesters 1 through 8** for all departments AND seeds standard initial subject shells for each semester so the system is pre-populated out-of-the-box.

2. **Inline Subject Configuration**:
   - Inside each Semester card on the Admin Office Controls page (`/admin`), an **"Inline Subject Configuration"** panel enables Admins/HODs to view, add, and configure subjects directly for that semester.

3. **Teacher Assignment & Faculty Re-assignment**:
   - Subject cards and subject creation forms include a **Teacher Selector Dropdown** populated with registered faculty users.
   - Admins/HODs can assign or change the teacher assigned to any course in 1 click.
   - Assigned courses immediately appear on the teacher's dashboard under **"My Assigned Courses"** and under **"My Courses"** (`/courses`).

---

## 2. Architecture & Database Updates

### Backend Endpoints (`backend-worker/src/index.ts`)

1. **`POST /api/academic-years/` (Updated)**:
   - When a new Academic Year is created, check if a prior academic year exists.
   - If **NO prior year exists**: Automatically insert Semesters 1–8 for all departments AND insert default subject shells (e.g. CS101, CS201, CS301, etc.) into those semesters.
   - Return initial creation summary `{ academic_year, auto_created_semesters: N, auto_created_courses: N }`.

2. **`GET /api/profiles/faculty/`**:
   - Returns all active profiles with role `FACULTY`, `HOD`, or `ADMIN` (`id`, `email`, `first_name`, `last_name`, `role`, `department_id`) for populating teacher dropdowns.

3. **`PATCH /api/courses/:id/assign-faculty/`**:
   - Updates `faculty_user_id` for a specific course. Accessible to `HOD` and `ADMIN`.

---

## 3. Frontend UI Components (`frontend/app/admin/page.tsx`)

### Semester List & Subject Drawer
- Each Semester card displays a **"Configure Subjects (N)"** toggle button.
- Clicking the toggle opens an inline **Subject Drawer**:
  - **Quick Add Subject Form**: `code`, `title`, `course_type` (`THEORY`, `LAB`, `PROJECT`), `credits`, and `faculty_user_id` dropdown.
  - **Subject Cards List**: Displays subject code, title, credits, course type badge, and a **Teacher Selector Dropdown** for 1-click re-assignment.

---

## 4. Teacher Dashboard Verification

- When a user logged in with `FACULTY` role views `/` or `/courses`:
  - `GET /courses/` filters by `faculty_user_id === user.id`.
  - Assigned courses immediately display under **My Assigned Courses**.

---

## 5. Verification Plan

1. **Fresh Academic Year Creation**: Create a brand new Academic Year when database is clean → Verify Semesters 1–8 and default subject shells are auto-generated.
2. **Rollover Creation**: Create a new Academic Year when prior year exists → Verify rollover prompt appears and clones prior year data.
3. **Inline Subject Configuration**: Open a semester's Subject Drawer in `/admin` → Add a subject and assign a teacher via the dropdown.
4. **Teacher Visibility**: Log in as the assigned teacher → Verify the newly assigned course appears on the home dashboard.
