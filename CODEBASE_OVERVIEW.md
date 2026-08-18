# CRCE Curriculum Management System — In-Depth Codebase Overview

This document explains the entire `CRCE-CURR` project file-by-file: what the site does, how the frontend is built, and — in detail — exactly how the backend worker functions end to end.

---

## 1. What This System Is

This is a **curriculum / syllabus management and publishing platform** for **Fr. Conceicao Rodrigues College of Engineering (Fr. CRCE, Autonomous College affiliated to University of Mumbai)**.

It digitizes the academic workflow of creating, reviewing, approving, and publishing official syllabus booklets:

1. **Admin/HOD** sets up the institutional structure (departments, academic years, semesters, subject shells) and manages faculty accounts.
2. **Faculty (course coordinators)** draft a full syllabus for each assigned course: objectives, outcomes, Bloom's levels, teaching scheme, exam scheme, modules, experiments, assessments, references, and CO–PO articulation matrices.
3. **Internal review** — HOD/Admin annotate the draft section-by-section in a dedicated review console, then approve or request changes. **External review** — the coordinator shares a capability link + 4-digit PIN; outside reviewers open a PIN-gated portal, comment section-by-section, and submit their draft comments, which notifies the faculty and HODs.
4. **HOD/Admin** compiles approved syllabi into a printable PDF curriculum booklet (by year of study FE/SE/TE/BE) via a headless-browser render, which goes into a permanent archive with HOD sign-off.

**Tech stack:**
- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS, deployed on Vercel.
- **Backend:** Cloudflare Workers (Hono framework) + Cloudflare D1 (SQLite) database + Cloudflare R2 object storage, deployed via Wrangler.
- **Auth:** Custom JWT (access 15 min + refresh 7 days, HttpOnly cookies + Bearer headers), PBKDF2 password hashing with a JIT migration bridge for legacy plaintext hashes.
- **PDF generation:** After publishing, a background task (fired via `executionCtx.waitUntil` and also wired to a Cloudflare Queue consumer `publish-queue`) calls the **Browserless** headless-chrome API to render the frontend print URL to a PDF, then stores it in R2.

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
| `curriculum_docs/` | Reference documents used to calibrate syllabus output. |
| `docs/` | Additional design documentation. |
| `scripts/` | Helper scripts (PDF pixel-compare / visual regression tooling, worker security integration tests). |
| `node_modules/` | Root dev dependencies. |
| `.claude/`, `.superpowers/` | Editor/agent configuration (not part of the app). |

> Note: `calibration_progress_report.md` and `security_fix_report.md` have been removed from the tree; this overview supersedes the security notes they contained.

---

## 3. The Backend — `backend-worker/`

The backend is a single **Cloudflare Worker** written with the **Hono** framework. There is no external Node server; everything runs on Cloudflare's edge runtime using D1 (SQLite), R2 (object storage), and the Browserless HTTP API for PDF rendering.

### 3.1 Configuration

#### `backend-worker/wrangler.json`
The Worker deployment config:
- **name:** `curriculum-backend`, entry point `src/index.ts`.
- **`compatibility_date: "2024-04-03"`** with the **`nodejs_compat`** flag (needed for `crypto` subtleties in the Workers runtime).
- **D1 binding `DB`** → database `curriculum-db` (ID `c4eb7d41-…`). This is the SQLite database all queries hit.
- **R2 binding `BUCKET`** → bucket `curriculum-files`. Stores generated PDFs and cached fonts.
- **Browser binding `BROWSER`** (remote) — declared but **not used by the current PDF path**; rendering goes through the Browserless HTTP API instead (see §4.2).
- **Queue bindings:** producer `PUBLISH_QUEUE` → queue `publish-queue`, consumer with `max_batch_size: 1`. The consumer handler exists in the default export; the publish endpoint currently fires the job inline via `executionCtx.waitUntil` rather than enqueueing (see §4.2 for the nuance).
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
| `0005_review_pin.sql` | Adds `review_pin`, `review_pin_failed_attempts`, `review_pin_locked_until`, `review_link_generated_at` to `courses`. |

#### Tables (what each stores)

- **`departments`** — `code` (unique, e.g. COMP/CSE/ECS/MECH), name, college/university names, logo URL. Seed data has 4 departments.
- **`profiles`** — user accounts. Fields: `email` (unique), `username`, `password_hash`, `role` (`ADMIN`/`HOD`/`FACULTY`/`PUBLIC`), `department_id`, names, designation, phone, `is_active`, `is_superuser`. Seed data includes demo accounts (see `seed.sql`). There is **no `REVIEWER` role** — internal review is done by HOD/ADMIN, external review by PIN-gated anonymous visitors.
- **`academic_years`** — e.g. "2026-27", start/end dates, `is_active`.
- **`semesters`** — belongs to a department + academic year, has a number (1–8) and title. Unique `(department_id, academic_year_id, number)`.
- **`courses`** — the core entity: code+title, `course_type` (THEORY/LAB/THEORY_LAB/PROJECT/ELECTIVE/INTERDISCIPLINARY), `status` (DRAFT → SUBMITTED → UNDER_REVIEW → CHANGES_REQUESTED → APPROVED → PUBLISHED → LOCKED), teaching scheme hours & credits, internal/external marks, duration, passing marks, prerequisites, objectives, syllabus intro, `online_resources` (JSON array), `section_order` (JSON), approval fields, and the external-review fields: unique `share_token` (the capability link), `review_pin` (4-digit PIN), `review_pin_failed_attempts`, `review_pin_locked_until`, `review_link_generated_at`. Unique `(semester_id, code)`.
- **`course_outcomes`** — CO rows per course with `code`, description, `bloom_level`, `sort_order`, `po_map` (JSON mapping CO → PO1..PO12/PSO1..PSO2 weights 1–3).
- **`modules`** — syllabus modules per course (number, title, contact hours, content, references). Unique `(course_id, number)`.
- **`topics`** — sub-topics under each module.
- **`experiments`** — lab experiment blocks (number, title, description, hours).
- **`assessment_schemes`** — assessment components (e.g. ISE 20 / MSE 30 / ESE 50).
- **`reference_books`** — books with `is_textbook` flag.
- **`course_versions`** — versioned snapshots (full JSON snapshot of the course + children) with `version_number`, editor, change summary, linked `previous_version_id`.
- **`course_invitations`** — invite-to-coordinate tokens per course + email, 14-day expiry. **Legacy/unused by the current API and frontend** (no routes or pages reference it anymore), but the table remains in the schema.
- **`reviewer_comments`** — comments tied to a course + `section_key`/`section_label` (e.g. "overview", "outcomes", "modules", "experiments", "assessment_references"). Fields include `is_resolved`/`resolved_by_user_id`/`resolved_at`, `is_external` (1 for external portal comments), `reviewer_name`/`reviewer_email`, and a `status` of `DRAFT` → `SUBMITTED` (external comments start as drafts and are batch-submitted).
- **`approval_workflows`** — audit trail of status transitions (from_status → to_status, decision, note, actor).
- **`curriculum_templates`** — HTML/CSS templates for booklet layout, with `is_locked` after a publish uses them and a version number.
- **`published_curricula`** — the compiled booklets: dept + academic year + template snapshot, `pdf_url`/`docx_url`/`print_url`, `version_label`, `render_metrics` (JSON: status, page count, etc.), `year_of_study`, `hod_approved_at/by`.
- **`notifications`** — per-user in-app notifications (read/unread). Used by the external-review submit flow to ping faculty + HODs.
- **`audit_logs`** — request audit log (user, method, path, status, IP, UA). Declared in schema; not written by the current request path.
- **`refresh_tokens`** — (created at runtime by `ensureRefreshTokensTable`, not in schema.sql) token `jti`, user, expiry, revoked flag, for JWT refresh rotation.

**Triggers:** `touch_*` triggers on each table keep `updated_at` fresh automatically when a row is updated but the app didn't set a new timestamp.

#### `backend-worker/seed.sql`
Seeds:
- 4 departments (COMP, CSE, ECS, MECH — all Fr. CRCE / University of Mumbai).
- Demo users: `admin@example.edu`, `faculty@example.edu`, `hod@example.edu`, three other HODs (`hod_cse`, `hod_ecs`, `hod_mech`), and two more faculty (`rohan.faculty`, `meera.faculty`). All passwords are `ChangeMe123!`, stored **as plaintext placeholders** (`password_hash = 'ChangeMe123!'`); the login handler's JIT "migration bridge" re-hashes them to PBKDF2 on first successful login.
- Academic year "2026-27", one semester (Sem III), a sample course "25PEC13CE14 Big Data Analytics" with 6 outcomes, 6 modules, an assessment scheme, reference books, and a curriculum template.

### 3.3 Backend source layout

```
backend-worker/src/
├── index.ts                 # THE app — all routes & handlers (~1400 lines)
├── types.ts                 # Shared TS types (Role, CourseStatus, Env, AuthUser, CourseRow…)
├── middleware/auth.ts       # JWT sign/verify + auth/permission guards
├── repositories/
│   ├── base.ts              # Generic CRUD repository + value normalizers
│   └── curriculum.ts        # Courses/Modules/Topics/… repositories + serializers
├── routes/generic.ts        # Factory for generic CRUD sub-routers
└── services/
    ├── auth.ts              # PBKDF2 password hashing / verification
    ├── courseVersions.ts    # Version snapshot creation + diffing
    └── reviewSession.ts     # PIN generation, lockout logic, review-session JWTs
```

---

## 4. Backend Behavior, Endpoint by Endpoint

### 4.1 `src/index.ts` — the Hono app

Two routers:
- **`app`** — root app. Registers CORS, static font serving, the public PIN-gated review endpoints, and the global error handler. Mounts `api` under `/api`.
- **`api`** — all authenticated JSON endpoints.

#### CORS setup (top of file)
`app.use("*", cors(...))` allows `CORS_ALLOWED_ORIGINS` (comma list), plus any `*.vercel.app` origin or any `http://localhost:*` origin (dev convenience). `credentials: true` so the HttpOnly cookies flow cross-origin. In development, requests with no Origin get `*`.

#### Font serving — `GET /api/fonts/:name` and `GET /fonts/:name`
Serves `.ttf` fonts for PDF/print rendering. Caches in R2 (`fonts/<name>`); on a miss, fetches Liberation Serif TTFs from GitHub raw (mapping `times.ttf` → `LiberationSerif-Regular.ttf` and `timesbd.ttf` → `LiberationSerif-Bold.ttf`), stores them in R2, and returns with `Cache-Control: public, max-age=31536000`. Rejects non-`.ttf` names.

#### Authentication — JWT + refresh rotation

`ensureRefreshTokensTable(db)` lazily creates the `refresh_tokens` table if it doesn't exist (idempotent, called on every token endpoint).

- **`POST /api/auth/token/`** — login.
  1. Reads `{username|email, password}`.
  2. Looks up an active profile by email or username (`is_active = 1`).
  3. `verifyPassword` against the stored hash (supports both `pbkdf2_sha256$` and legacy plaintext).
  4. **Migration bridge:** if the stored hash is NOT `pbkdf2_sha256$…`, it re-hashes the given password with PBKDF2 (100k iterations) and writes it back — upgrading plaintext seeds to secure hashes on first login.
  5. Inserts a `refresh_tokens` row (random `jti` UUID, 7-day expiry).
  6. Signs two JWTs: access (15 min, claims `sub`, `role`, `email`) and refresh (7 days, `typ: "refresh"`, `jti`).
  7. Returns both tokens in the JSON body **and** sets HttpOnly cookies `curriculum_access` (Max-Age 900 s) and `curriculum_refresh` (Max-Age 604800 s) with `SameSite=None; Secure`.
- **`POST /api/auth/token/refresh/`** — refresh rotation.
  - Verifies the refresh JWT (must have `sub`, `typ: "refresh"`, `jti`).
  - Loads the stored row; **if it's already revoked, reuse is detected** → revokes *all* of that user's tokens and returns 401 (token-theft mitigation).
  - Checks expiry and that the user still exists and is active.
  - Marks the old row revoked, issues a new access + refresh pair, inserts a fresh refresh row.
- **`POST /api/auth/token/revoke/`** — revoke a specific refresh token (given `refresh_token` in the body); used by logout flows.
- **`POST /api/auth/logout/`** — clears both cookies via `Max-Age=0` Set-Cookie headers.

#### Auth middleware gate
`api.use("*", requireAuth)` — everything below `/api/` (except the token/logout routes, which `requireAuth` explicitly lets through) requires a valid token from the `Authorization: Bearer …` header **or** the `curriculum_access` cookie. The middleware verifies the JWT, loads the profile fresh from the DB (must be `is_active = 1`, so deactivation takes effect immediately), and stores it in `c.set("user", …)`.

#### Session
- **`GET /api/auth/me/`** — returns the authenticated user (used by the frontend's AuthContext to hydrate/validate the session).

#### Teacher & profile management
- **`GET /api/profiles/faculty[/]`** (ADMIN or HOD only) — lists active FACULTY/HOD/ADMIN profiles with optional `role` and `department_id` filters, ordered by name.
- **`POST /api/teachers/`** (ADMIN/HOD) — creates a FACULTY account: requires `name`, `email`, `password` (≥ 8 chars); splits the name into first/last; hashes the password with PBKDF2. HODs are pinned to their own `department_id`; email uniqueness is enforced (`EMAIL_EXISTS`).
- **`PATCH /api/teachers/:id/status/`** (ADMIN/HOD) — activates/deactivates a FACULTY account (`is_active`). HODs may only toggle teachers in their own department.

#### Generic CRUD via `crudRoute` (`routes/generic.ts`)
Used for **departments**, **academic-years**, **semesters**, and **curriculum-templates**. The factory builds a Hono sub-router with:
- `GET /` — list with optional filter query params (only the declared `filters` columns).
- `GET /:id/` — single row (404 if missing).
- `POST /`, `PATCH /:id/`, `PUT /:id/` — create/update, guarded by `isAcademicAdmin` when `adminWrite` is true.
- `DELETE /:id/` — delete (guarded), returns 204.
- UNIQUE/SQLITE constraint errors are mapped to friendly 400 messages.

`BaseRepository` (`repositories/base.ts`) implements the generic SQL: builds INSERT/UPDATE from `writableColumns`, auto-generates UUID ids, translates `{department: x}` → `department_id`, `{semester: x}` → `semester_id`, `{academic_year: x}` → `academic_year_id`, and serializes arrays/objects/booleans via `normalizeValue` (arrays/objects → JSON string, booleans → 1/0).

#### Academic year creation + auto-bootstrap — `POST /api/academic-years[/]`
A custom handler (not generic) that, on creating the **first** academic year (i.e. no other rows exist yet), also generates for every department 8 semesters (1–8) and 2 course shells per semester (a THEORY subject `SUB<sem>01` and a LAB `SUB<sem>02`), all batched via `db.batch`. Returns 201 or a constraint-mapped 400.

#### Rollover — `POST /api/academic-years/:id/rollover/` (ADMIN)
Clones the *most recent prior* academic year into the target year:
- Re-creates each semester (`ON CONFLICT(department_id, academic_year_id, number) DO NOTHING`).
- For each prior course, clones the course row with status reset to `DRAFT`, `faculty_user_id`/`approved_by_user_id` cleared, then deep-clones its `course_outcomes`, `assessment_schemes`, `reference_books`, `modules` (with a module id remap), and module `topics` (batched in chunks of 100).
- Returns a summary `{source_academic_year, target_academic_year, semesters_cloned, courses_cloned}`.

#### Notifications
- `GET /api/notifications/` — list the user's notifications (newest first).
- `GET /api/notifications/:id/` — single notification (owner only).
- `POST /api/notifications/` — create; Admin/HOD may target another user, otherwise the user only creates for themselves.
- `PATCH/PUT /api/notifications/:id/` — mark read / edit (owner only).
- `DELETE /api/notifications/:id/` — owner-only delete.

#### Courses
- **`GET /api/courses/`** — list via `CoursesRepository.list`, supporting filters: `semester_id`, `faculty_user_id`, `course_type`, `status`, `department_id`/`department`, `academic_year_id`/`academic_year`. The list query joins semesters + faculty name, computes child-row counts (`outcomes_count`, `modules_count`, …), and maps those counts into lightweight placeholder arrays (`[{code: "CO1"}, …]`) so the frontend can render completeness badges without N+1 detail calls.
- **`POST /api/courses/`** (admin) — create course; validates the assigned teacher exists, is active FACULTY, and belongs to the same department as the semester. Calls `generateReviewLinkIfMissing` (auto-creates `share_token` + PIN), then snapshots version "Course created".
- **`GET /api/courses/:id/`** — full detail: the course row plus `outcomes`, `modules` (with nested `topics`), `experiments`, `assessments`, `reference_books`, and only `SUBMITTED` comments, serialized by `serializeCourse` (adds `faculty`, `approved_by`, `last_modified`, `total_marks`, parsed `online_resources`/`section_order`/`po_map`).
- **`PUT/PATCH /api/courses/:id/`** → `updateCourse(c)` — update the course row, then snapshot a version with `body.change_summary ?? "Course updated"`, and return the re-fetched detail.
- **`PATCH /api/courses/:id/assign-faculty[/]`** (ADMIN/HOD) — sets `faculty_user_id` (with the same teacher-validity checks as course creation); also triggers `generateReviewLinkIfMissing` so a review link/PIN exists as soon as a coordinator is assigned.
- **`POST /api/courses/:id/submit/`** — flips status → `SUBMITTED` and snapshots "Submitted for review". (Any authenticated user can trigger this.)
- **`POST /api/courses/:id/reopen/`** (admin) — flips to `CHANGES_REQUESTED`, clears `approved_by_user_id`/`approved_at`, snapshots "Reopened by administrator".
- **`GET /api/courses/:id/review-link/`** — returns `{url, pin, generatedAt}` for the external review link. Visible to ADMIN/HOD or the course's assigned faculty; 400 `NO_REVIEW_LINK` if the token hasn't been generated yet.
- **`POST /api/courses/:id/review-pin/reset/`** — generates a fresh PIN (and resets failed-attempt/lockout state). Same access rules as review-link.
- **`GET /api/courses/:id/versions/`** — lists `course_versions` newest-first with the editor's display name.
- **`POST /api/courses/:id/compare_versions/`** — given `version_a`/`version_b` ids, returns their metadata + `diffSnapshots(left, right)` + the full snapshots.
- **`GET /api/courses/:id/compare_previous_year/`** — finds the most recent prior academic year with a course of the same `code` in the same department, loads both full details, returns `{current, previous, previous_academic_year_name, changes}` via `diffSnapshots`.
- **`POST /api/courses/:id/rollback/`** (admin) — restores the course from a version snapshot and snapshots "Rolled back to version N".
- **`POST /api/courses/:id/autosave/`** → `syncCourse(db, id, data)` — the **most important write path** (see below), then snapshots a version with `data.change_summary ?? "Autosaved draft"` and returns the re-fetched detail.

#### `syncCourse` — deep upsert (index.ts, near bottom)
1. Updates the `courses` row via `CoursesRepository.update`.
2. For each child collection (`outcomes`, `experiments`, `assessments`, `reference_books`) it:
   - Loads existing child ids for that parent.
   - Upserts each incoming item: keeps the client's `id` if provided (UPDATE) or generates a UUID (INSERT) — this is why the frontend merges server-returned ids back into state.
   - Collects INSERT/UPDATE statements into a `statements[]` batch.
3. **Deletes** child rows whose ids existed before but are no longer in the payload (so removals persist).
4. For `modules`, it repeats the same upsert/delete pattern and, per module, recurses into nested `topics` via `collectSyncStatements`.
5. Runs everything in a single `db.batch(statements)` (atomic-ish, one round trip), then returns.

#### Reviewer comments & approval workflow
- `GET /api/reviewer-comments/` — list (filter by course/section/resolved/status). **DRAFT external comments are filtered out** for authenticated callers unless an explicit `status` filter is passed — they're only visible through the PIN-gated public portal until submitted.
- `POST /api/reviewer-comments/` (academic admin) — create, tagging the authenticated user as `reviewer_user_id`.
- `POST /api/reviewer-comments/:id/resolve/` — mark resolved with resolver + timestamp.
- `GET /api/approval-workflows/` — list workflow events.
- `POST /api/approval-workflows/` (academic admin) — the **state machine**:
  - decision → target status: `REQUEST_CHANGES`/`REJECT` → `CHANGES_REQUESTED`, `APPROVE` → `APPROVED`, `PUBLISH` → `PUBLISHED`.
  - Updates the course status; on APPROVE also records `approved_by_user_id` + `approved_at`.
  - Writes an `approval_workflows` audit row (from → to + decision + note) and snapshots a version "Workflow decision: …".

#### Publishing pipeline
- **`GET /api/published-curricula/`** — list published curricula (filters: department, academic_year, is_public, year_of_study).
- **`GET /api/published-curricula/archive/`** (HOD/ADMIN) — archived booklets joined with academic year and department names, ordered by year then year-of-study. HODs see only their own department.
- **`GET /api/published-curricula/:id/download/`** — streams the PDF from R2 (`published/<id>.pdf`) as an attachment (`Content-Disposition: attachment`).
- **`POST /api/published-curricula/publish/`** (admin) — the publish entry point:
  1. Validates `year_of_study` (FE/SE/TE/BE → semester pairs).
  2. Loads the template; counts approved/published courses in the two semesters.
  3. Builds the frontend `print_url` (`/print/final?department=…&academic_year=…&year_of_study=…&version=…`).
  4. Inserts a `published_curricula` row with a template snapshot + `render_metrics` starting at `{status:"queued", course_count, export:"pdf-render"}`.
  5. Marks the covered courses `PUBLISHED` and **locks the template** (`is_locked = 1`).
  6. Fires the background job: `c.executionCtx.waitUntil(generatePdfTask(...))` — the actual headless-browser PDF render runs off-request (see §4.2).
  7. Returns 202 (accepted).
- **`POST /api/published-curricula/:id/hod-approve/`** (HOD/ADMIN) — records HOD sign-off (`hod_approved_at`/`hod_approved_by`); HODs may only approve their own department's booklets.

#### Global error handler
`app.onError` logs the error and maps UNIQUE/SQLITE constraint errors to a friendly 400; everything else returns `{detail: message}` with 400.

### 4.2 PDF generation — `generatePdfTask`

Defined near the bottom of `index.ts`. It:
1. Runs **in the background** after the publish response is returned.
2. Sets `render_metrics.status = "processing"` with a `started_at` timestamp via `json_patch`.
3. Requires `BROWSERLESS_API_TOKEN` (secret). Builds the frontend `targetUrl` (`${FRONTEND_URL}/print/final?…`).
4. POSTs to **Browserless** (`https://chrome.browserless.io/pdf?token=…`) with a JSON body specifying A4 format, `printBackground: true`, display header/footer (institutional letterhead header, "Page X of Y" footer), margins (28/18/12/12 mm), `waitUntil: networkidle0`, and a `waitFor` selector (`main[data-fonts-loaded="true"]`) so fonts load before render.
5. Uploads the returned PDF to **R2** at `published/<id>.pdf`.
6. Updates the `published_curricula` row: sets `pdf_url` to the R2-backed download endpoint and `render_metrics` to `{status:"completed", completed_at}` — or, on error, `{status:"failed", error, failed_at}`.

**Why both `waitUntil` and a Queue?** The default export also implements a `queue()` handler that consumes `publish-queue` messages (`{publishedId, departmentId, academicYearId, versionLabel, yearOfStudy}`) and calls `generatePdfTask` with `message.ack()`/`message.retry()` semantics. Today the publish endpoint calls the task directly through `executionCtx.waitUntil`, so the queue consumer is wired and ready but idle — it exists so long-running renders can be retried reliably rather than lost if the Worker is recycled mid-`waitUntil`.

### 4.3 `middleware/auth.ts` — auth helpers & guards

- `requireAuth` — described above; also fetches the fresh user row from DB on every request (so deactivation takes effect immediately).
- `signJwt(payload, secret, ttl)` / `verifyJwt(token, secret)` — HS256 HMAC-SHA256 JWT, base64url encoding, `iat`/`exp` checks.
- `isAcademicAdmin(user)` — `is_superuser === 1 || role ADMIN || HOD`.
- `requireRole(...roles)` — Hono middleware returning 403 if the user's role isn't in the list.
- `requireSameDepartment(getCourseId)` — HOD-only cross-department guard (joins course → semester → department).

### 4.4 `services/auth.ts` — password hashing

- `hashPassword(password, iterations = 100000)` → `pbkdf2_sha256$<iterations>$<saltB64>$<hashB64>` via WebCrypto PBKDF2 (16-byte salt, 256-bit key).
- `verifyPassword(password, storedHash)` — supports both the modern `pbkdf2_sha256$` format (constant-time-ish re-derivation + comparison) and legacy plaintext comparison (used by the migration bridge).

### 4.5 `services/courseVersions.ts` — versioning

- `createCourseVersion(db, courseId, user, changeSummary)` — gets the latest version number for the course, snapshots the full course via `CoursesRepository.detail` (JSON), and inserts a new `course_versions` row linked to the previous one.
- `diffSnapshots(left, right)` — compares two snapshots and returns a list of `{section, field, old, new}` changes, skipping id/timestamps and treating each child collection (`outcomes`, `modules`, `experiments`, `assessments`, `reference_books`) as one change if its JSON differs.

### 4.6 `services/reviewSession.ts` — external review PIN + session

This is the security layer for the **external reviewer portal**:

- `generatePin()` — 2 random bytes mapped into `0000–9999` (zero-padded 4 digits).
- `isLocked(course)` / `lockoutSecondsRemaining(course)` — evaluate the `review_pin_locked_until` timestamp.
- `signReviewSession(secret, courseId, shareToken)` — signs a short-lived (4 h) JWT with `typ: "review_session"`, `course_id`, and the current `share_token`.
- `verifyReviewSession(secret, token, courseId, currentShareToken)` — validates typ, course, and that the share token hasn't rotated (so a PIN reset doesn't extend old sessions on next request).
- `generateReviewLinkIfMissing(db, courseId)` — lazily creates `share_token` + `review_pin` + `review_link_generated_at` on a course (called on course creation and faculty assignment).
- Constants: `MAX_ATTEMPTS = 5`, `LOCKOUT_MINUTES = 15`, `SESSION_TTL_SECONDS = 4 h`.

### 4.7 `repositories/curriculum.ts` — course-specific data access

- `CoursesRepository.list` — the joined listing query described above, plus count subqueries and placeholder-array shaping.
- `CoursesRepository.detail` — single row + all child tables in parallel (`Promise.all`), including only `SUBMITTED` comments with reviewer names, then `serializeCourse`.
- `ModulesRepository.forCourse` — modules with their topics attached (single IN query, grouped by module).
- `TopicsRepository`, `OutcomesRepository`, `ExperimentsRepository`, `AssessmentsRepository`, `ReferenceBooksRepository`, `ReviewerRepository`, `WorkflowRepository` — thin typed CRUD wrappers over `BaseRepository`.
- `serializeCourse` — adds convenience aliases (`faculty`, `approved_by`, `last_modified`, `total_marks`) and parses JSON columns.

### 4.8 `routes/generic.ts` — generic CRUD router factory

Explained in §4.1. This is what powers most "manage X" admin endpoints with only ~10 lines of setup per resource.

### 4.9 The public (unauthenticated) surface — external review portal

The public review routes live on the **`app` router** (not behind `requireAuth`) and are protected by a two-step capability mechanism: **share-token URL + 4-digit PIN → short-lived session JWT**.

- **`POST /public/review/:token/verify/`** — the PIN gate.
  - Looks up the course by `share_token` (404 `TOKEN_INVALID` if unknown).
  - If `review_pin_locked_until` is in the future → 429 `LOCKED` with `retryAfterSeconds`.
  - If the submitted PIN is wrong → increments `review_pin_failed_attempts`; after `MAX_ATTEMPTS` (5) sets `review_pin_locked_until` (15 min) and returns 429 `LOCKED`; otherwise 401 `PIN_INVALID` with `attemptsRemaining`.
  - On success → resets attempts/lockout, signs a 4-hour review-session JWT, and returns `{sessionToken, expiresAt, course: {code, title}}`.
- **`requireReviewSession` middleware** (used by every other `/public/review/:token/…` route) — loads the course by `share_token` (404 if unknown) and requires a `Bearer` session JWT that verifies via `verifyReviewSession` (correct typ, course id, and current share token); otherwise 401 `SESSION_INVALID`.
- **`GET /public/review/:token/`** — full course detail (via `CoursesRepository.detail`) once the session is valid.
- **`GET /public/review/:token/comments/`** — all comments for the course, newest first.
- **`POST /public/review/:token/comments/`** — adds an external comment: requires `reviewer_name` and `body` (400 `FEEDBACK_INVALID` otherwise); `section_key` must be one of `overview | outcomes | modules | experiments | assessment_references`. Rows are stored with `is_external = 1` and `status = 'DRAFT'`.
- **`PATCH /public/review/:token/comments/:commentId/`** — edit a **DRAFT** comment's body (400 `COMMENT_LOCKED` once submitted).
- **`DELETE /public/review/:token/comments/:commentId/`** — delete a **DRAFT** comment.
- **`POST /public/review/:token/submit/`** — flips all of the course's DRAFT comments to `SUBMITTED` with a `submitted_at` timestamp (400 `NOTHING_TO_SUBMIT` if none), then creates **notifications** for the course's faculty coordinator and every active HOD of the course's department ("New reviewer comments on CODE — Title").

---

## 5. The Frontend — `frontend/`

Next.js 15 App Router app. Client components (`"use client"`) everywhere; auth is cookie + localStorage based with an AuthContext that hydrates from `localStorage`.

### 5.1 Config files

| File | Purpose |
| --- | --- |
| `next.config.js` | Minimal Next config. |
| `postcss.config.js`, `tailwind.config.ts` | Tailwind v3 + autoprefixer. |
| `tsconfig.json` | TS config, path alias `@/*` → root. |
| `vitest.config.ts` | Vitest setup for unit tests. |
| `middleware.ts` | Next middleware: allows `/login`, `/print/*`, `/public/*` (PIN-gated external portal), `/_next`, `/favicon.ico` publicly; otherwise redirects to `/login?next=…` when the `curriculum_access` cookie is missing. |
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
- **`login/page.tsx`** — login form (email + password) posting to `/auth/token/`, storing the access token in `localStorage` (`accessToken`), hydrating the user via `/auth/me/`, then navigating to `/`. Includes **quick-login demo account buttons** (admin/faculty/hod, all `ChangeMe123!`).
- **`admin/page.tsx`** — the administrative console (`RoleGuard` ADMIN/HOD):
  - Tabs: **Manage Departments**, **Manage Academic Years** (with **rollover** into a newly created year), **Manage Semesters** (grid by FE/SE/TE/BE, per-semester "Configure Subjects" expansion to list subjects, assign faculty via dropdown, and a "Quick Add Subject Shell" form), **Manage Teachers** (create faculty accounts + activate/deactivate), and **Create Subject**.
  - Drives `POST /academic-years/`, `/rollover/`, `POST /semesters/`, `POST /courses/`, `PATCH /courses/:id/assign-faculty/`, `POST /teachers/`, `PATCH /teachers/:id/status/` and related endpoints.
- **`courses/page.tsx`** — the course directory table: code, title, coordinator, status badge, last modified, a computed **validation** status (Clear/Warnings/Incomplete based on presence of outcomes, modules, assessments, references), and links to the editor and review board.
- **`courses/[id]/page.tsx`** — (dynamic route that wraps the editor) renders `<CurriculumEditor courseId={id} />`.
- **`review/page.tsx`** — the internal peer-review console (`RoleGuard` HOD/ADMIN):
  - Left: the A4 print preview in `reviewMode` (sections are clickable and set the focus section).
  - Right: an annotation thread for the selected section, a comment composer (posts to `/reviewer-comments/`), resolve buttons, **Send Feedback** (`REQUEST_CHANGES` with a prompt note) and **Sign & Approve** (`APPROVE`, disabled while open comments exist) via `/approval-workflows/`.
- **`publishing/page.tsx`** — the booklet publisher (`RoleGuard` HOD/ADMIN):
  - Form: department, academic year, year of study, template, version label → `POST /published-curricula/publish/`.
  - Warns when the selected template is locked.
  - Lists previously published booklets with render status, page/course counts, HOD approval state, **Approve as HOD**, and **Download Booklet** (uses the R2 download endpoint).
- **`archive/page.tsx`** — the historical register (`RoleGuard` HOD/ADMIN):
  - Fetches `/published-curricula/archive/`, filters by year-of-study tabs + academic-year dropdown (admin), groups by academic year, shows HOD approval status and render-status badge, links to Print Preview and Download PDF.
- **`public/review/[token]/page.tsx`** — the **external reviewer portal** (public, no login, PIN-gated):
  - Stage machine `pin → reviewing → submitted`.
  - `PinGate`: 4-digit PIN entry with attempts-remaining countdown, lockout timer (`retryAfterSeconds`), posts to `/public/review/:token/verify/` and stores the returned session JWT in memory (never persisted).
  - Once unlocked, the same split A4-preview + comment-thread UX as `/review`, but every request carries `Authorization: Bearer <sessionToken>`; comments are created as **DRAFT** (`Save Draft Comment`), editable/deletable while draft, and a **Submit Review (n)** button posts to `/public/review/:token/submit/`.
- **`print/`** — print preview routes (`/print/course/:id`, `/print/final`, `/print/reviewer/course/:id`) used by the PDF generator and by the A4 component's print button. `print/layout.tsx` + `print/print.css` hold the pixel-calibrated A4 print styles (Times New Roman, scaled margins/typography tuned to match the official booklet baseline).
- **`globals.css`** — Tailwind layers, custom fonts/theme tokens, print CSS, scrollbar styling.

### 5.3 Shared components (`components/`)

- **`layout/app-shell.tsx`** — the authenticated app frame: collapsible sidebar (role-aware nav), breadcrumb header, theme toggle, user footer with sign-out. Nav items differ per role (FACULTY: My Courses; HOD/ADMIN: All Courses, Review Board, PDF Publisher, Curriculum Archive, Admin Controls).
- **`layout/role-guard.tsx`** — component that only renders children if the current user's role is in `allowed`.
- **`layout/theme-provider.tsx`** — wraps `next-themes`.
- **`curriculum/curriculum-editor.tsx`** — the heart of the faculty experience:
  - Two-column layout: left = tabbed form editor, right = live **A4 print preview**.
  - Macro category bar (Overview & Schemes, Outcomes & Content, Assessment & References, Review & History) with sub-tabs: basic, teaching, exam, blooms, outcomes, modules, experiments, assessments, references, comments, versions, compare_previous, preview, and **reviewer-link**.
  - **Autosave** (`useAutosave`) posts the whole draft to `/courses/:id/autosave/` 1.5 s after edits; it merges server-assigned child ids back into local state to keep upserts stable.
  - Validates drafts (objectives length, outcome descriptions, module content length, etc.) and shows a "Compliant / N missing" chip.
  - **Submit review** → `/courses/:id/submit/`.
  - Outcome editor includes a **CO–PO articulation matrix** (PO1–PO12, PSO1–PSO2, weights 1–3).
  - **Reviewer Link panel** — fetches `/courses/:id/review-link/`, shows the share URL + current PIN with Copy + Reset PIN buttons (POST `/courses/:id/review-pin/reset/`).
  - Comments panel, version history with diff compare + restore (rollback), and compare-with-previous-year panel.
- **`curriculum/a4-preview.tsx`** — the pixel-faithful A4 syllabus renderer:
  - Institutional letterhead, teaching scheme table, exam scheme (ISE/MSE/ESE) table, outcomes, module tables with unit rows, self-learning paragraph, assessment description, experiments table (with CO mapping), references, video lectures, and the CO–PO matrix + Bloom's level row.
  - `reviewMode` + `selectedSection` make each block clickable for section-anchored comments.
  - **Export to Word (.doc)** — clones the DOM, embeds the logo as a data URI, adds Word-compatible table attributes, and downloads a `.doc` blob.
  - Print button opens `/print/course/:id/`.
- **`admin/`** — `invite-teacher-panel.tsx`, `create-subject-panel.tsx`, `manage-teachers-panel.tsx`, `hod-curriculum-workspace.tsx`, `admin-dashboard-panel.tsx` — the admin console sub-panels.
- **`print/`** — `course-print.tsx`, `curriculum-print.tsx` — print-page components for `/print` routes.
- **`ui/`** — `button.tsx` (CVA + Radix Slot), `badge.tsx` (`StatusBadge` mapping each course status to a color), and other primitives.

### 5.4 State & utilities

- **`context/AuthContext.tsx`** — `AuthProvider`:
  - On mount, hydrates user from `localStorage["curriculum_user"]`, then calls `/auth/me/` (with `credentials: "include"` and any Bearer token) to validate.
  - Skips validation entirely on `/public/*` pages (the PIN-gated portal must not bounce to login).
  - On failure clears `localStorage` + cookies and redirects to `/login`.
  - Exposes `user`, `loading`, `logout()` (POSTs `/auth/logout/`, clears storage/cookies), `refetch()`.
  - Note: the `AuthUser` type only includes ADMIN/HOD/FACULTY roles (the app UI is built for those three).
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

## 6. The Entire Logic Flow of the Site

### 6.1 Request lifecycle (how one request traverses the backend)

1. Browser → **Next.js middleware** (`frontend/middleware.ts`): allows `/login`, `/print/*`, `/public/*`, static assets; otherwise requires the `curriculum_access` cookie or redirects to `/login?next=…`.
2. Client component calls `apiFetch` → `fetch(API_URL + path)` with `Authorization: Bearer <accessToken>` (localStorage) and `credentials: "include"` (HttpOnly cookie as fallback).
3. Worker **CORS middleware** validates the origin against `CORS_ALLOWED_ORIGINS` (+ `*.vercel.app` + `localhost:*`), enabling credentials.
4. Hono routes the request: public routes (`/public/review/…`, `/fonts/…`, auth token routes) skip auth; everything under `/api/` passes through **`requireAuth`**, which verifies the JWT and loads the live profile.
5. The handler runs repository/service logic against **D1** (and R2 for files/PDFs), then returns JSON.
6. Errors fall to the global `onError` handler (friendly constraint messages, logged to Workers Logs).

### 6.2 Login & session refresh

`login/page.tsx` → `POST /api/auth/token/` → backend verifies the password (with the plaintext→PBKDF2 migration bridge), inserts a refresh-token row, issues access (15 min) + refresh (7 day) JWTs, sets HttpOnly cookies → frontend stores `accessToken`, calls `/auth/me/`, stores the user, redirects to `/`. When the access token expires, the client hits `/auth/token/refresh/` to rotate: the old refresh row is revoked and a new pair issued; **reusing a revoked refresh token revokes all of the user's tokens** (theft detection). Logout calls `/auth/logout/` (cookie clearing) and optionally `/auth/token/revoke/`.

### 6.3 Institutional setup & rollover

Admin creates the first academic year → the backend auto-bootstraps 8 semesters + 2 subject shells per department → admin "rolls over" into a new year → `/academic-years/:id/rollover/` clones prior semesters, courses (status reset to DRAFT, faculty cleared), and all child syllabus content (outcomes, assessments, references, modules, topics). Teachers are created via `/teachers/` and activated/deactivated via `/teachers/:id/status/`.

### 6.4 Faculty drafts a syllabus

`courses/[id]/page.tsx` → `CurriculumEditor` loads `GET /api/courses/:id/` → edits trigger `useAutosave` → `POST /api/courses/:id/autosave/` → `syncCourse` deep-upserts the course + children (upsert by client id, delete removed rows, `db.batch`) and snapshots a version → editor merges returned ids → "Submit review" → `POST /api/courses/:id/submit/` (status → SUBMITTED). Every meaningful change is versioned, diffable, and restorable via `/courses/:id/rollback/`.

### 6.5 Internal review

`review/page.tsx` (`RoleGuard` HOD/ADMIN) → loads course + comments → reviewer clicks a section in `A4Preview` (reviewMode) → comment posted to `POST /api/reviewer-comments/` (tagged with the reviewer) → HOD resolves comments (`/resolve/`) → "Sign & Approve" → `POST /api/approval-workflows/` (decision APPROVE → status APPROVED, approval recorded) or "Send Feedback" (REQUEST_CHANGES → CHANGES_REQUESTED so the faculty can edit and resubmit).

### 6.6 External review (PIN-gated portal)

1. **Link generation:** when a course is created or a faculty coordinator is assigned, `generateReviewLinkIfMissing` creates the `share_token` + 4-digit PIN. The coordinator opens the editor's **Reviewer Link** panel (`GET /courses/:id/review-link/`), copies the URL, and shares the PIN out-of-band (can reset via `/review-pin/reset/`).
2. **Gate:** the reviewer opens `/public/review/:token` → `PinGate` → `POST /public/review/:token/verify/` checks the PIN (5-attempt / 15-minute lockout) and returns a **4-hour session JWT**.
3. **Reviewing:** all subsequent requests carry `Bearer <sessionToken>`; the reviewer clicks sections of the A4 preview and saves **DRAFT** comments (editable/deletable), scoped to `overview | outcomes | modules | experiments | assessment_references`.
4. **Submit:** `POST /public/review/:token/submit/` flips all drafts to `SUBMITTED` and pushes **notifications** to the course faculty + all HODs of that department.
5. **Back inside:** HOD/Admin sees the submitted external comments in the internal review console (authenticated `GET /reviewer-comments/` excludes DRAFT rows unless explicitly filtered), resolves them, and approves.

### 6.7 Publishing & PDF generation

`publishing/page.tsx` → `POST /api/published-curricula/publish/` → backend inserts the booklet row (render status "queued"), locks the template, marks covered courses PUBLISHED, and kicks off `generatePdfTask` in the background (`executionCtx.waitUntil`) → the task marks status "processing", calls the **Browserless** PDF API against the frontend `/print/final?...` URL (A4, letterhead header, page-number footer, network-idle + fonts-loaded waits) → PDF uploaded to **R2** at `published/<id>.pdf` → row updated with `pdf_url` + status "completed" (or "failed" with the error). The `publish-queue` consumer handler is wired to retry the same task if it were ever enqueued. HOD approves the booklet (`hod-approve/`) → it appears in `archive/page.tsx` and is downloadable from the R2-backed download endpoint. `final_curriculum.pdf` at the repo root is a sample of this output.

### 6.8 Cross-year comparison

The editor's "Compare with previous year" panel calls `/courses/:id/compare_previous_year/`: the backend finds the most recent prior academic year with the same course code in the same department and runs `diffSnapshots` (skipping ids/timestamps, comparing each child collection wholesale) so faculty can see exactly what changed.

---

## 7. Security Notes & Known Shortcuts

- **Password migration bridge:** seed hashes are plaintext; first successful login re-hashes to PBKDF2 (100k iterations, per-user salt).
- **JWT:** HS256 with the Worker secret; access tokens live 15 min, refresh 7 days, with server-side rotation and reuse-detection revocation (revokes *all* of the user's refresh tokens on reuse).
- **CORS:** locked to configured origins + `*.vercel.app` + localhost; credentials enabled.
- **External review security model:** capability-based `share_token` URL **plus** a 4-digit PIN with failed-attempt lockout, exchanged for a short-lived (4 h) session JWT bound to the course id and current share token. The link alone is useless without the PIN; a PIN reset invalidates new entry attempts (existing tabs keep working until reload).
- **Role guards:** enforced server-side in `requireRole`/`isAcademicAdmin`/`requireReviewSession` and reflected client-side via `RoleGuard`.
- **Comment draft privacy:** external DRAFT comments are invisible to authenticated API callers unless a `status` filter is supplied; they surface only after `submit`.
- **Noted shortcuts / scaffolding:** hardcoded demo credentials (`ChangeMe123!`) and quick-login buttons for dev; the fixed `PREVIOUS_SUBJECTS` catalog in `index.ts`; `audit_logs` and `course_invitations` tables exist in the schema but are not wired into the current request path; the publish flow calls `generatePdfTask` inline via `waitUntil` rather than enqueueing onto `publish-queue` (the consumer is ready but unused). These would be moved to config/DB and completed before wide rollout.

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
