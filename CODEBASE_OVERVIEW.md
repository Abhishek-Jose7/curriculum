# CRCE Curriculum Management System — In-Depth Codebase Overview

This document explains the entire `CRCE-CURR` project file-by-file: what the site does, how the frontend is built, and — in detail — exactly how the backend worker functions end to end.

---

## 1. What This System Is

This is a **curriculum / syllabus management and publishing platform** for **Fr. Conceicao Rodrigues College of Engineering (Fr. CRCE, Autonomous College affiliated to University of Mumbai)**.

It digitizes the academic workflow of creating, reviewing, approving, and publishing official syllabus booklets:

1. **Admin/HOD** sets up the institutional structure (departments, academic years, semesters, subject shells).
2. **Faculty (course coordinators)** draft a full syllabus for each assigned course: objectives, outcomes, Bloom's levels, teaching scheme, exam scheme, modules, experiments, assessments, references, and CO–PO articulation matrices.
3. **Reviewers (internal & external)** annotate the draft section-by-section through a shared link, and the HOD/Admin approves or requests changes.
4. **HOD/Admin** compiles approved syllabi into a printable PDF curriculum booklet (by year of study FE/SE/TE/BE), which goes into a permanent archive with HOD sign-off.

**Tech stack:**
- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS, deployed on Vercel.
- **Backend:** Cloudflare Workers (Hono framework) + Cloudflare D1 (SQLite) database + Cloudflare R2 object storage, deployed via Wrangler.
- **Auth:** Custom JWT (access 15 min + refresh 7 days, HttpOnly cookies + Bearer headers), PBKDF2 password hashing.
- **PDF generation:** Async job triggered after publishing (background worker path via `executionCtx.waitUntil` and a Cloudflare Queue binding `publish-queue`).

The whole system lives in two top-level packages: `backend-worker/` and `frontend/`.

---

## 2. Repository Root

| Path | Purpose |
| --- | --- |
| `package.json` / `package-lock.json` | Root workspace metadata (minimal; the real packages live in subfolders). |
| `.env.example` | Example environment variables. |
| `.gitignore` | Git ignore rules. |
| `README.md` | Project readme. |
| `final_curriculum.pdf` | A sample/rendered output curriculum booklet. |
| `calibration_progress_report.md` | Internal progress notes about system calibration. |
| `security_fix_report.md` | Internal notes on a security remediation pass. |
| `curriculum_docs/` | Reference documents used to calibrate syllabus output. |
| `docs/` | Additional design documentation. |
| `scripts/` | Helper scripts. |
| `node_modules/` | Root dev dependencies. |
| `.claude/`, `.superpowers/` | Editor/agent configuration (not part of the app). |

---

## 3. The Backend — `backend-worker/`

The backend is a single **Cloudflare Worker** written with the **Hono** framework. There is no external Node server; everything runs on Cloudflare's edge runtime using D1 (SQLite) and R2 (object storage).

### 3.1 Configuration

#### `backend-worker/wrangler.json`
The Worker deployment config:
- **name:** `curriculum-backend`, entry point `src/index.ts`.
- **`compatibility_date: "2024-04-03"`** with the **`nodejs_compat`** flag (needed for `crypto` subtleties in the Workers runtime).
- **D1 binding `DB`** → database `curriculum-db` (ID `c4eb7d41-…`). This is the SQLite database all queries hit.
- **R2 binding `BUCKET`** → bucket `curriculum-files`. Stores generated PDFs and cached fonts.
- **Browser binding `BROWSER`** (remote) — the headless browser used for PDF rendering of published curricula.
- **Queue bindings:** producer `PUBLISH_QUEUE` → queue `publish-queue`, consumer with `max_batch_size: 1`. Publishing jobs are enqueued and consumed asynchronously.
- **`observability.enabled: true`** — Workers Logs / analytics.
- **`vars`:** CORS allow-list (`http://localhost:3000`, the Vercel production URL), `FRONTEND_URL`, and `ENVIRONMENT`. There's a `production` env override for the var values.
- Secrets (`AUTH_JWT_SECRET`, `BROWSERLESS_API_TOKEN`) are NOT here — they're supplied as Worker secrets (or `.dev.vars` in dev).

#### `backend-worker/.dev.vars`
Local development secrets file (contains `AUTH_JWT_SECRET` and `BROWSERLESS_API_TOKEN` for `wrangler dev`).

#### `backend-worker/package.json`
- Scripts: `dev` = `wrangler dev`, `deploy` = `wrangler deploy`.
- Only runtime dependency: **`hono`**.
- Dev deps: `@cloudflare/workers-types`, `typescript`, `wrangler`.

#### `backend-worker/tsconfig.json`
TypeScript config targeting Cloudflare Workers with `types: ["@cloudflare/workers-types"]`.

### 3.2 Database Schema — `schema.sql` & `migrations/`

D1 is SQLite. `schema.sql` is the canonical schema; `migrations/0001_d1_schema.sql` is the applied copy, plus small additive migrations:

| Migration | Change |
| --- | --- |
| `0001_d1_schema.sql` | Full base schema (identical to `schema.sql`). |
| `0002_year_of_study.sql` | Adds `year_of_study` (FE/SE/TE/BE), `hod_approved_at`, `hod_approved_by` to `published_curricula`. |
| `0003_external_review.sql` | No-op (already applied in `schema.sql`). |
| `0004_add_po_map.sql` | Adds `po_map` (JSON) column to `course_outcomes`. |

#### Tables (what each stores)

- **`departments`** — `code` (unique, e.g. COMP/CSE/ECS/MECH), name, college/university names, logo URL. Seed data has 4 departments.
- **`profiles`** — user accounts. Fields: `email` (unique), `username`, `password_hash`, `role` (`ADMIN`/`HOD`/`FACULTY`/`REVIEWER`/`PUBLIC`), `department_id`, names, designation, phone, `is_active`, `is_superuser`. Seed data includes demo accounts (see `seed.sql`).
- **`academic_years`** — e.g. "2026-27", start/end dates, `is_active`.
- **`semesters`** — belongs to a department + academic year, has a number (1–8) and title. Unique `(department_id, academic_year_id, number)`.
- **`courses`** — the core entity: code+title, `course_type` (THEORY/LAB/THEORY_LAB/PROJECT/ELECTIVE/INTERDISCIPLINARY), `status` (DRAFT → SUBMITTED → UNDER_REVIEW → CHANGES_REQUESTED → APPROVED → PUBLISHED → LOCKED), teaching scheme hours & credits, internal/external marks, duration, passing marks, prerequisites, objectives, syllabus intro, `online_resources` (JSON array), `section_order` (JSON), approval fields, and a unique `share_token` for external review. Unique `(semester_id, code)`.
- **`course_outcomes`** — CO rows per course with `code`, description, `bloom_level`, `sort_order`, `po_map` (JSON mapping CO → PO1..PO12/PSO1..PSO2 weights 1–3).
- **`modules`** — syllabus modules per course (number, title, contact hours, content, references). Unique `(course_id, number)`.
- **`topics`** — sub-topics under each module.
- **`experiments`** — lab experiment blocks (number, title, description, hours).
- **`assessment_schemes`** — assessment components (e.g. Continuous Assessment 40, ESE 60).
- **`reference_books`** — books with `is_textbook` flag.
- **`course_versions`** — versioned snapshots (full JSON snapshot of the course + children) with `version_number`, editor, change summary, linked `previous_version_id`.
- **`course_invitations`** — invite-to-coordinate tokens per course + email, 14-day expiry, accepted-by tracking.
- **`reviewer_comments`** — comments tied to a course + `section_key`/`section_label` (e.g. "outcomes", "modules"), with resolve tracking and external-reviewer name/email fields.
- **`approval_workflows`** — audit trail of status transitions (from_status → to_status, decision, note, actor).
- **`curriculum_templates`** — HTML/CSS templates for booklet layout, with `is_locked` after a publish uses them and a version number.
- **`published_curricula`** — the compiled booklets: dept + academic year + template snapshot, `pdf_url`/`docx_url`/`print_url`, `version_label`, `render_metrics` (JSON: status, page count, etc.), `year_of_study`, `hod_approved_at/by`.
- **`notifications`** — per-user in-app notifications (read/unread).
- **`audit_logs`** — request audit log (user, method, path, status, IP, UA).
- **`refresh_tokens`** — (created at runtime by `ensureRefreshTokensTable`, not in schema.sql) token `jti`, user, expiry, revoked flag, for JWT refresh rotation.

**Triggers:** `touch_*` triggers on each table keep `updated_at` fresh automatically when a row is updated but the app didn't set a new timestamp.

#### `backend-worker/seed.sql`
Seeds:
- 4 departments (COMP, CSE, ECS, MECH — all Fr. CRCE / University of Mumbai).
- Demo users: `admin@example.edu`, `faculty@example.edu`, `reviewer@example.edu`, `hod@example.edu` (+ 3 other HODs). All password `ChangeMe123!`. **Note:** these are plaintext placeholders; the login handler performs a JIT "migration bridge" that re-hashes them to PBKDF2 on first successful login.
- Academic year "2026-27", one semester (Sem III), one sample course "CS301 Data Structures and Algorithms" with outcomes, module, topic, assessments, reference book, and a curriculum template.

### 3.3 Backend source layout

```
backend-worker/src/
├── index.ts                 # THE app — all routes & handlers (60 KB)
├── types.ts                 # Shared TS types (Role, Env, AuthUser, CourseRow…)
├── middleware/auth.ts       # JWT sign/verify + auth/permission guards
├── repositories/
│   ├── base.ts              # Generic CRUD repository + value normalizers
│   └── curriculum.ts        # Courses/Modules/Topics/… repositories + serializers
├── routes/generic.ts        # Factory for generic CRUD sub-routers
└── services/
    ├── auth.ts              # PBKDF2 password hashing / verification
    └── courseVersions.ts    # Version snapshot creation + diffing
```

---

## 4. Backend Behavior, Endpoint by Endpoint

### 4.1 `src/index.ts` — the Hono app

Two routers:
- **`app`** — root app. Registers CORS, static font serving, public review endpoints, and the global error handler. Mounts `api` under `/api`.
- **`api`** — all authenticated JSON endpoints.

#### CORS setup (top of file)
`app.use("*", cors(...))` allows `CORS_ALLOWED_ORIGINS` (comma list), plus any `*.vercel.app` origin or any `http://localhost:*` origin (dev convenience). `credentials: true` so the HttpOnly cookies flow cross-origin.

#### Font serving — `GET /api/fonts/:name` and `GET /fonts/:name`
Serves `.ttf` fonts for PDF/print rendering. Caches in R2 (`fonts/<name>`); on a miss, fetches Liberation Serif TTFs from GitHub raw, stores them in R2, and returns with `Cache-Control: public, max-age=31536000`.

#### Authentication — JWT + refresh rotation

`ensureRefreshTokensTable(db)` lazily creates the `refresh_tokens` table if it doesn't exist.

- **`POST /api/auth/token/`** — login.
  1. Reads `{username|email, password}`.
  2. Looks up active profile by email or username.
  3. `verifyPassword` against stored hash.
  4. **Migration bridge:** if the stored hash is NOT `pbkdf2_sha256$…`, it re-hashes the given password with PBKDF2 and writes it back (upgrading plaintext seeds to secure hashes).
  5. Inserts a refresh-token row (jti UUID, 7-day expiry).
  6. Signs two JWTs: access (15 min, claims `sub`, `role`, `email`) and refresh (7 days, `typ: "refresh"`, `jti`).
  7. Returns both tokens in the JSON body **and** sets HttpOnly cookies `curriculum_access` (900 s) and `curriculum_refresh` (604800 s) with `SameSite=None; Secure`.
- **`POST /api/auth/token/refresh/`** — refresh rotation.
  - Verifies refresh JWT, checks it has `sub`, `typ: "refresh"`, `jti`.
  - Loads the stored token row; if it's already revoked, **reuse is detected** → revokes *all* of that user's tokens and returns 401 (token-theft mitigation).
  - Checks expiry, validates the user still exists/active, marks the old token revoked, issues a new pair and inserts a new refresh row.
- **`POST /api/auth/token/revoke/`** — revoke a specific refresh token (used by logout flow).
- **`POST /api/auth/logout/`** — clears both cookies via `Max-Age=0` Set-Cookie headers.

#### Public (unauthenticated) endpoints
- **`GET /course-invitations/:token/`** — returns invitation metadata (course code/title, email, accepted/expired booleans) for the invite landing page.
- **`GET /public/review/:token/`** — fetches a course by its `share_token`. Returns 404 `TOKEN_INVALID` if the token is unknown, or 400 `SYLLABUS_DRAFT` if the course is still `DRAFT` (not ready for review).
- **`GET /public/review/:token/comments/`** — all comments for the token's course.
- **`POST /public/review/:token/comments/`** — external reviewer adds a comment (`section_key`, `section_label`, `body`, `reviewer_name`, optional email). These rows get `is_external = 1`. Name and body are required (`FEEDBACK_INVALID` otherwise).

#### Auth middleware gate
`api.use("*", requireAuth)` — everything below `/api/` (except the token/logout routes, which `requireAuth` explicitly lets through) requires a valid token from the `Authorization: Bearer …` header or the `curriculum_access` cookie. The middleware loads the profile (must be `is_active = 1`) and stores it in `c.set("user", …)`.

#### Session
- **`GET /api/auth/me/`** — returns the authenticated user.

#### Profiles
- **`GET /api/profiles/faculty` and `/faculty/`** (ADMIN or HOD only) — list active FACULTY/HOD/ADMIN profiles (id, email, name, role, dept).

#### Generic CRUD via `crudRoute` (`routes/generic.ts`)
Used for **departments**, **academic-years**, **semesters**, and **curriculum-templates**. The factory builds a Hono sub-router with:
- `GET /` — list with optional filter query params (only the declared `filters` columns).
- `GET /:id/` — single row.
- `POST /`, `PATCH /:id/`, `PUT /:id/` — create/update, guarded by `isAcademicAdmin` when `adminWrite` is true.
- `DELETE /:id/` — delete (guarded).
- UNIQUE/SQLITE constraint errors are mapped to friendly 400 messages.

`BaseRepository` (`repositories/base.ts`) implements the generic SQL: builds INSERT/UPDATE from `writableColumns`, auto-generates UUID ids, translates `{department: x}` → `department_id`, serializes arrays/objects/booleans via `normalizeValue` (arrays/objects → JSON string, booleans → 1/0).

#### Academic year creation + auto-bootstrap — `POST /api/academic-years/`
A custom handler (not generic) that, on creating the **first** academic year, also generates for every department 8 semesters and 2 course shells per semester (a THEORY subject `SUB<sem>01` and a LAB `SUB<sem>02`). Returns 201 or a constraint-mapped 400.

#### Rollover — `POST /api/academic-years/:id/rollover/` (ADMIN)
Clones the *most recent prior* academic year into the target year:
- Re-creates each semester (ON CONFLICT DO NOTHING).
- For each prior course, clones the course row with status reset to `DRAFT` and faculty/approvals cleared, then deep-clones its `course_outcomes`, `assessment_schemes`, `reference_books`, `modules`, and module `topics`.
- Returns a summary `{semesters_cloned, courses_cloned}`.

#### Notifications
- `GET /api/notifications/` — list the user's notifications (newest first).
- `GET/POST /api/notifications/:id/` and `/` — read/create. Admin can create for another user; otherwise a user only manages their own.
- `PATCH/PUT /api/notifications/:id/` — mark read / edit (owner only).
- `DELETE /api/notifications/:id/` — owner-only delete.

#### Courses
- **`GET /api/courses/`** — list via `CoursesRepository.list`, supporting filters: `semester_id`, `faculty_user_id`, `course_type`, `status`, `department_id`/`department`, `academic_year_id`/`academic_year`. The list query joins semesters + faculty name + pending invite, and computes child-row counts (`outcomes_count`, `modules_count`, …). The repository maps those counts into lightweight placeholder arrays so the frontend can render completeness badges without N+1 detail calls.
- **`POST /api/courses/`** (admin) — create course, then immediately snapshots a version ("Course created").
- **`GET /api/courses/:id/`** — full detail: the course row plus `outcomes`, `modules` (with nested `topics`), `experiments`, `assessments`, `reference_books`, and `comments`, serialized by `serializeCourse` (adds `faculty`, `approved_by`, `last_modified`, `total_marks`, parsed `online_resources`/`section_order`).
- **`PUT/PATCH /api/courses/:id/`** → `updateCourse(c)` — update the course, snapshot a version with a `change_summary`.
- **`PATCH /api/courses/:id/assign-faculty/`** (ADMIN/HOD) — sets `faculty_user_id`.
- **`POST /api/courses/:id/invite_teacher/`** (ADMIN/HOD) — creates a `course_invitations` row (14-day token) and returns the frontend invite URL.
- **`POST /api/course-invitations/:token/accept/`** — authenticated user accepts: marks invitation accepted, assigns `faculty_user_id`, and snapshots a version ("Coordinator assigned via invite link").
- **`GET /api/departments/:id/previous-subjects/`** — returns a hardcoded catalog (`PREVIOUS_SUBJECTS`) of known course codes/titles for COMP/CSE/ECS/MECH used to seed historical context.
- **`POST /api/semesters/initialize-year/`** (ADMIN/HOD) — creates missing semesters for a year-of-study (FE→[1,2], SE→[3,4], TE→[5,6], BE→[7,8]).
- **`POST /api/courses/:id/submit/`** — flips status → `SUBMITTED` and snapshots "Submitted for review".
- **`POST /api/courses/:id/reopen/`** (admin) — flips to `CHANGES_REQUESTED`, clears approval fields, snapshots "Reopened by administrator".
- **`POST /api/courses/:id/share/`** (reviewer/admin) — sets a fresh `share_token` for external review.
- **`GET /api/courses/:id/versions/`** — lists `course_versions` with editor display name.
- **`POST /api/courses/:id/compare_versions/`** — given `version_a`/`version_b`, returns metadata + `diffSnapshots(left, right)` + the full snapshots.
- **`GET /api/courses/:id/compare_previous_year/`** — finds the same course code in the most recent prior academic year (same department), loads both full details, and returns `{current, previous, previous_academic_year_name, changes}` via `diffSnapshots`.
- **`POST /api/courses/:id/rollback/`** (admin) — restores the course from a version snapshot and snapshots "Rolled back to version N".
- **`POST /api/courses/:id/autosave/`** → `syncCourse(db, id, data)` — the **most important write path** (see below).

#### `syncCourse` — deep upsert (index.ts, near bottom)
1. Updates the `courses` row via `CoursesRepository.update`.
2. For each child collection (`outcomes`, `modules`, `experiments`, `assessments`, `reference_books`) it:
   - Loads existing child ids for that parent.
   - Upserts each incoming item: keeps the client's `id` if provided (UPDATE) or generates a UUID (INSERT) — this is why the frontend merges server-returned ids back into state.
   - Collects INSERT/UPDATE statements into a `statements[]` batch.
3. **Deletes** child rows whose ids existed before but are no longer in the payload (so removals persist).
4. For `modules`, it also handles the nested `topics` with the same upsert/delete pattern.
5. Runs everything in `db.batch(...)`, then snapshots a version ("Autosaved draft" or a provided `change_summary`).

#### Reviewer comments & approval workflow
- `GET /api/reviewer-comments/` — list (filter by course/section/resolved).
- `POST /api/reviewer-comments/` (reviewer/admin) — create, tagging the authenticated user as reviewer.
- `POST /api/reviewer-comments/:id/resolve/` — mark resolved with resolver + timestamp.
- `GET /api/approval-workflows/` — list workflow events.
- `POST /api/approval-workflows/` (reviewer/admin) — the **state machine**:
  - decision → target status: `REQUEST_CHANGES`/`REJECT` → `CHANGES_REQUESTED`, `APPROVE` → `APPROVED`, `PUBLISH` → `PUBLISHED`.
  - Updates the course status; on APPROVE also records `approved_by_user_id` + `approved_at`.
  - Writes an `approval_workflows` audit row and snapshots a version.

#### Publishing pipeline
- **`GET /api/published-curricula/`** — list published curricula (with filter params).
- **`GET /api/published-curricula/archive/`** (HOD/ADMIN) — archived booklets joined with academic year and department names; HODs see only their own department.
- **`GET /api/published-curricula/:id/download/`** — streams the PDF from R2 (`published/<id>.pdf`) as an attachment.
- **`POST /api/published-curricula/publish/`** (admin) — the publish entry point:
  1. Validates `year_of_study` (FE/SE/TE/BE → semester pairs).
  2. Loads the template; counts approved/published courses in the two semesters.
  3. Builds the frontend `print_url` (`/print/final?department=…&academic_year=…&year_of_study=…&version=…`).
  4. Inserts a `published_curricula` row with a template snapshot + `render_metrics` starting at `{status:"queued", course_count}`.
  5. Marks the covered courses `PUBLISHED` and **locks the template** (`is_locked = 1`).
  6. Fires the background job: `c.executionCtx.waitUntil(generatePdfTask(...))` — the actual headless-browser PDF render runs off-request (see §4.2).
  7. Returns 202 (accepted).
- **`POST /api/published-curricula/:id/hod-approve/`** (HOD/ADMIN) — records HOD sign-off (`hod_approved_at`/`hod_approved_by`); HODs may only approve their own department's booklets.

#### Global error handler
`app.onError` logs and maps UNIQUE/SQLITE constraint errors to a friendly 400; everything else returns `{detail: message}` with 400.

### 4.2 PDF generation — `generatePdfTask`

Defined near the bottom of `index.ts` (not shown in the first read window). It:
1. Runs **in the background** via `executionCtx.waitUntil` after the publish response is returned (and via the Cloudflare Queue consumer binding).
2. Uses the remote **browser binding (`BROWSER`)** to navigate to the frontend `print_url`, wait for the page to render the full booklet, and print it to PDF (A4).
3. Uploads the resulting PDF to **R2** at `published/<id>.pdf`.
4. Updates the `published_curricula` row: sets `pdf_url` to the R2-backed download endpoint and `render_metrics` to `{status:"completed", page_count, course_count}` (or `{status:"failed", error}`).

The `publish-queue` binding exists so long-running renders can be retried reliably rather than lost if the Worker is recycled mid-`waitUntil`.

### 4.3 `middleware/auth.ts` — auth helpers & guards

- `requireAuth` — described above; also fetches the fresh user row from DB on every request (so deactivation takes effect immediately).
- `signJwt(payload, secret, ttl)` / `verifyJwt(token, secret)` — HS256 HMAC-SHA256 JWT, base64url encoding, expiry check.
- `isAcademicAdmin(user)` — `is_superuser === 1 || role ADMIN || HOD`.
- `isReviewerOrAdmin(user)` — academic admin OR `REVIEWER`.
- `requireRole(...roles)` — Hono middleware returning 403 if the user's role isn't in the list.
- `requireSameDepartment(getCourseId)` — HOD-only cross-department guard (joins course → semester → department).

### 4.4 `services/auth.ts` — password hashing

- `hashPassword(password, iterations = 100000)` → `pbkdf2_sha256$<iterations>$<saltB64>$<hashB64>` via WebCrypto PBKDF2 (16-byte salt, 256-bit key).
- `verifyPassword(password, storedHash)` — supports both the modern `pbkdf2_sha256$` format and legacy plaintext comparison (used by the migration bridge).

### 4.5 `services/courseVersions.ts` — versioning

- `createCourseVersion(db, courseId, user, changeSummary)` — gets the latest version number for the course, snapshots the full course via `CoursesRepository.detail` (JSON), and inserts a new `course_versions` row linked to the previous one.
- `diffSnapshots(left, right)` — compares two snapshots and returns a list of `{section, field, old, new}` changes, skipping id/timestamps and treating each child collection (`outcomes`, `modules`, `experiments`, `assessments`, `reference_books`) as one change if its JSON differs.

### 4.6 `repositories/curriculum.ts` — course-specific data access

- `CoursesRepository.list` — the joined listing query described above, plus count subqueries and placeholder-array shaping.
- `CoursesRepository.detail` — single row + all child tables in parallel (`Promise.all`), including comments with reviewer names, then `serializeCourse`.
- `ModulesRepository.forCourse` — modules with their topics attached (single IN query, grouped by module).
- `TopicsRepository`, `OutcomesRepository`, `ExperimentsRepository`, `AssessmentsRepository`, `ReferenceBooksRepository`, `ReviewerRepository`, `WorkflowRepository` — thin typed CRUD wrappers over `BaseRepository`.
- `serializeCourse` — adds convenience aliases (`faculty`, `approved_by`, `last_modified`, `total_marks`) and parses JSON columns.

### 4.7 `routes/generic.ts` — generic CRUD router factory

Explained in §4.1. This is what powers most "manage X" admin endpoints with only ~10 lines of setup per resource.

---

## 5. The Frontend — `frontend/`

Next.js 15 App Router app. Client components (`"use client"`) everywhere; auth is cookie-based with an AuthContext that hydrates from `localStorage`.

### 5.1 Config files

| File | Purpose |
| --- | --- |
| `next.config.js` | Minimal Next config. |
| `postcss.config.js`, `tailwind.config.ts` | Tailwind v3 + autoprefixer. |
| `tsconfig.json` | TS config, path alias `@/*` → root. |
| `vitest.config.ts` | Vitest setup for unit tests. |
| `middleware.ts` | Next middleware: allows `/login`, `/invite`, `/print`, `/_next`, `/favicon.ico` publicly; otherwise redirects to `/login?next=…` when the `curriculum_access` cookie is missing. |
| `package.json` | Scripts `dev/build/start/lint/test`. Deps: Next 15, React 19, `@radix-ui` (dialog, dropdown, label, slot), `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `next-themes`, `react-hook-form`, `zod`. |
| `Dockerfile` | Container build for the Next app. |
| `.env`, `.env.local` | `NEXT_PUBLIC_API_URL` etc. |
| `next-env.d.ts`, `tsconfig.tsbuildinfo` | Generated. |

### 5.2 App pages (`app/`)

- **`layout.tsx`** — root layout: `<ThemeProvider>` (next-themes) wrapping `<AuthProvider>`, imports `globals.css`.
- **`page.tsx`** (home/dashboard) — role-aware dashboard:
  - Header title depends on role (`ADMIN` → "System Overview", `HOD` → "Department Syllabi", `FACULTY` → "My Assigned Courses").
  - Fetches `/courses/` and, for FACULTY, filters to their own `faculty_user_id`.
  - Renders a stats ledger (Draft / Under Review / Approved / Published) and the 4-step workflow pipeline sidebar.
- **`login/page.tsx`** — login form (email + password) posting to `/auth/token/`, storing `accessToken` in localStorage and `curriculum_access` cookie, hydrating user via `/auth/me/`, then navigating to `/`. Includes **quick-login demo account buttons** (admin/faculty/hod/reviewer, all `ChangeMe123!`).
- **`admin/page.tsx`** (1139 lines) — the administrative console (`RoleGuard` ADMIN/HOD):
  - Tabs: **Manage Departments**, **Manage Academic Years** (with **rollover** into a newly created year), **Manage Semesters** (grid by FE/SE/TE/BE, per-semester "Configure Subjects" expansion to list subjects, assign faculty via dropdown, and a "Quick Add Subject Shell" form), and **Create Subject** (invite-teacher panel).
  - Drives the `POST /academic-years/`, `/rollover/`, `POST /semesters/`, `POST /courses/`, `PATCH /courses/:id/assign-faculty/`, `POST /courses/:id/invite_teacher/` endpoints.
- **`courses/page.tsx`** — the course directory table: code, title, coordinator, status badge, last modified, a computed **validation** status (Clear/Warnings/Incomplete based on presence of outcomes, modules, assessments, references), and links to the editor and review board.
- **`courses/[id]/page.tsx`** — (dynamic route that wraps the editor) renders `<CurriculumEditor courseId={id} />`.
- **`review/page.tsx`** — the internal peer-review console (`RoleGuard` HOD/ADMIN):
  - Left: the A4 print preview in `reviewMode` (sections are clickable).
  - Right: annotation thread for the selected section, a comment composer (posts to `/reviewer-comments/`), resolve buttons, **Share Link** (creates `share_token`), **Send Feedback** (`REQUEST_CHANGES`) and **Sign & Approve** (`APPROVE`, disabled while open comments exist) via `/approval-workflows/`.
- **`publishing/page.tsx`** — the booklet publisher (`RoleGuard` HOD/ADMIN):
  - Form: department, academic year, year of study, template, version label → `POST /published-curricula/publish/`.
  - Warns when the selected template is locked.
  - Lists previously published booklets with render status, page/course counts, HOD approval state, **Approve as HOD**, and **Download Booklet** (uses the R2 download endpoint).
- **`archive/page.tsx`** — the historical register (`RoleGuard` HOD/ADMIN):
  - Fetches `/published-curricula/archive/`, filters by year-of-study tabs + academic-year dropdown (admin), groups by academic year, shows HOD approval status and render-status badge, links to Print Preview and Download PDF.
- **`invite/[token]/page.tsx`** — invitation landing (public). Fetches `/course-invitations/:token/`, shows course + assigned faculty email, and an **Accept Assignment** button. Accepting auto-authenticates with the demo faculty account if no token is present (hardcoded `faculty@example.edu` / `ChangeMe123!` — a dev shortcut), then posts to `/course-invitations/:token/accept/` and redirects to the course.
- **`public/review/[token]/page.tsx`** — the **external reviewer portal** (public, no login): same annotation UX as `/review`, but comments are posted to the unauthenticated `/public/review/:token/comments/` endpoint with a required name field.
- **`print/`** — print preview routes (`/print/course/:id`, `/print/final`) used by the PDF generator and by the A4 component's print button. (See the `print-fixture.ts` helper.)
- **`globals.css`** — Tailwind layers, custom fonts/theme tokens, print CSS, scrollbar styling.

### 5.3 Shared components (`components/`)

- **`layout/app-shell.tsx`** — the authenticated app frame: collapsible sidebar (role-aware nav), breadcrumb header, theme toggle, user footer with sign-out. Nav items differ per role (FACULTY: My Courses; HOD/ADMIN: All Courses, Review Board, PDF Publisher, Curriculum Archive, Admin Controls).
- **`layout/role-guard.tsx`** — component that only renders children if the current user's role is in `allowed`.
- **`layout/theme-provider.tsx`** — wraps `next-themes`.
- **`curriculum/curriculum-editor.tsx`** (1088 lines) — the heart of the faculty experience:
  - Two-column layout: left = tabbed form editor, right = live **A4 print preview**.
  - Macro category bar (Overview & Schemes, Outcomes & Content, Assessment & References, Review & History) with sub-tabs: basic, teaching, exam, blooms, outcomes, modules, experiments, assessments, references, comments, versions, compare_previous, preview.
  - **Autosave** (`useAutosave`) posts the whole draft to `/courses/:id/autosave/` 1.5 s after edits; it merges server-assigned child ids back into local state to keep upserts stable.
  - Validates drafts (objectives length, outcome descriptions, module content length, etc.) and shows a "Compliant / N missing" chip.
  - **Submit review** → `/courses/:id/submit/`.
  - Outcome editor includes a **CO–PO articulation matrix** (PO1–PO12, PSO1–PSO2, weights 1–3).
  - Comments panel, version history with diff compare + restore (rollback), and compare-with-previous-year panel.
- **`curriculum/a4-preview.tsx`** (645 lines) — the pixel-faithful A4 syllabus renderer:
  - Institutional letterhead, teaching scheme table, exam scheme (ISE/MSE/ESE) table, outcomes, module tables with unit rows, self-learning paragraph, assessment description, experiments table (with CO mapping), references, video lectures, and the CO–PO matrix + Bloom's level row.
  - `reviewMode` + `selectedSection` make each block clickable for section-anchored comments.
  - **Export to Word (.doc)** — clones the DOM, embeds the logo as a data URI, adds Word-compatible table attributes, and downloads a `.doc` blob.
  - Print button opens `/print/course/:id/`.
- **`admin/invite-teacher-panel.tsx`** — UI for inviting a faculty coordinator to a course (uses `/courses/:id/invite_teacher/`).
- **`admin/hod-curriculum-workspace.tsx`** — HOD's curriculum setup workspace (semester/subject shell management for their department).
- **`print/`** — print-page components for `/print` routes.
- **`ui/`** — `button.tsx` (CVA + Radix Slot), `badge.tsx` (`StatusBadge` mapping each course status to a color), and other primitives.

### 5.4 State & utilities

- **`context/AuthContext.tsx`** — `AuthProvider`:
  - On mount, hydrates user from `localStorage["curriculum_user"]`, then calls `/auth/me/` (with `credentials: "include"` and any Bearer token) to validate.
  - On failure clears storage/cookies and redirects to `/login`.
  - Exposes `user`, `loading`, `logout()`, `refetch()`.
  - Note: the `AuthUser` type here only includes ADMIN/HOD/FACULTY roles (the frontend UI is built for those three).
- **`context/index.ts`** — re-exports.
- **`hooks/use-autosave.ts`** — debounced save hook (1.5 s) with status string ("Idle" / "Saving…" / "Saved").
- **`lib/api.ts`** — `apiFetch<T>(path, options)`:
  - Base URL from `NEXT_PUBLIC_API_URL` (default `https://curriculum-backend.collacou.workers.dev/api`).
  - Sets JSON content-type, attaches `Authorization: Bearer <localStorage accessToken>` when present, `credentials: "include"`, `cache: "no-store"`.
  - On 401: clears token + cookie and redirects to `/login`.
- **`lib/utils.ts`** — `cn()` (clsx + tailwind-merge) and similar.
- **`lib/validation.ts`** — form validators.
- **`lib/print-fixture.ts`** — sample data used to render print previews when no live course exists.
- **`lib/sample-course.ts`** — a full sample `CourseDraft` fixture for demos/design.

### 5.5 Types & tests

- **`types/curriculum.ts`** — the frontend's `CourseStatus`, `Course`, `CourseDraft`, `CourseOutcome`, `CourseModule`, `CourseTopic`, `Experiment`, `Assessment`, `ReferenceBook`, `ReviewerComment` types (mirrors the backend's serialized shape).
- **`tests/`** — Vitest + Testing Library unit tests for components/hooks.

---

## 6. End-to-End Request Flows (how the pieces connect)

### 6.1 Login
`login/page.tsx` → `POST /api/auth/token/` → backend verifies (with hash migration bridge), issues access + refresh JWTs, sets HttpOnly cookies and returns tokens → frontend stores `accessToken`, calls `/auth/me/`, stores user, redirects to `/`.

### 6.2 Faculty drafts a syllabus
`courses/[id]/page.tsx` → `CurriculumEditor` loads `GET /api/courses/:id/` → edits trigger `useAutosave` → `POST /api/courses/:id/autosave/` → `syncCourse` deep-upserts the course + children and snapshots a version → editor merges returned ids → "Submit review" → `POST /api/courses/:id/submit/` (status → SUBMITTED).

### 6.3 Internal review
`review/page.tsx` → loads course + comments → reviewers click a section in `A4Preview` (reviewMode) → comment posted to `POST /api/reviewer-comments/` → HOD resolves comments (`/resolve/`) → "Sign & Approve" → `POST /api/approval-workflows/` (status → APPROVED, recorded approval).

### 6.4 External review
HOD clicks "Share Link" → `POST /api/courses/:id/share/` → token URL → reviewer opens `/public/review/:token` → unauthenticated `GET /public/review/:token/` returns the course (only if not DRAFT) → reviewer comments via `POST /public/review/:token/comments/` (stored as `is_external = 1`).

### 6.5 Publishing
`publishing/page.tsx` → `POST /api/published-curricula/publish/` → backend inserts the booklet row (status "queued"), locks the template, marks courses PUBLISHED, and kicks off `generatePdfTask` in the background → headless browser renders `print_url` → PDF stored in R2 → row updated with `pdf_url` + metrics → HOD approves (`hod-approve/`) → visible in `archive/page.tsx` and downloadable from the R2 endpoint.

### 6.6 Rollover
Admin creates a new academic year → prompted to rollover → `POST /api/academic-years/:id/rollover/` clones prior year's semesters, course shells, and all child syllabus content (statuses reset to DRAFT).

---

## 7. Security Notes & Known Shortcuts

- **Password migration bridge:** seed hashes are plaintext; first successful login re-hashes to PBKDF2 (100k iterations). The invite-accept page hardcodes a demo faculty login to auto-authenticate (dev convenience, should be replaced by real credential flow in production).
- **JWT:** HS256 with the Worker secret; access tokens live 15 min, refresh 7 days, with server-side rotation and reuse-detection revocation.
- **CORS:** locked to configured origins + `*.vercel.app` + localhost; credentials enabled.
- **Role guards:** enforced server-side in `requireRole`/`isAcademicAdmin`/`isReviewerOrAdmin` and reflected client-side via `RoleGuard`.
- **External review links** are capability-based (`share_token`) — possession of the link grants read/comment access but nothing else.
- Hardcoded demo credentials and the fixed `PREVIOUS_SUBJECTS` catalog are scaffolding for the Fr. CRCE pilot and would be moved to DB/config before wider rollout.

---

## 8. Development Commands

**Backend**
```
cd backend-worker
npm run dev        # wrangler dev (local D1/R2 via .dev.vars)
npm run deploy     # wrangler deploy
npx wrangler d1 execute curriculum-db --local --file=./migrations/000X_*.sql   # apply migrations
```

**Frontend**
```
cd frontend
npm run dev        # next dev
npm run build      # next build
npm run lint       # next lint
npm test           # vitest run
```
