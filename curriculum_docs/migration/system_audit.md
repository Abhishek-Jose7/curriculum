# Cloudflare Migration System Audit

Date: 2026-06-02

This audit treats the existing system as the source of truth. It does not propose a rebuild or UI redesign.

## Django Model Inventory

### accounts

| Model | Implemented fields | Notes |
| --- | --- | --- |
| `User` | Django `AbstractUser` fields, `role`, `department`, `designation`, `phone` | Roles are `ADMIN`, `HOD`, `FACULTY`, `REVIEWER`, `PUBLIC`. `is_academic_admin` is derived from role or `is_superuser`. |

### curriculum

| Model | Implemented fields | Relationships / constraints |
| --- | --- | --- |
| `Department` | `code`, `name`, `college_name`, `university_name`, `logo` | `code` unique. |
| `AcademicYear` | `name`, `starts_on`, `ends_on`, `is_active` | `name` unique. |
| `Semester` | `department`, `academic_year`, `number`, `title`, `ordinance` | Unique `(department, academic_year, number)`. Has computed totals from courses. |
| `Course` | `semester`, `faculty`, `code`, `title`, `course_type`, `status`, teaching hours, credits, marks, `duration_hours`, `pre_requisites`, `objectives`, `syllabus_intro`, `online_resources`, `section_order`, approval fields | Unique `(semester, code)`. Indexes on `status`, `course_type`. Computed exam marks. |
| `CourseOutcome` | `course`, `code`, `description`, `bloom_level`, `order` | Unique `(course, code)`. |
| `Module` | `course`, `number`, `title`, `contact_hours`, `content` | Unique `(course, number)`. |
| `Topic` | `module`, `title`, `description`, `order` | Ordered by `order`. |
| `Experiment` | `course`, `number`, `title`, `description`, `hours` | Unique `(course, number)`. |
| `AssessmentScheme` | `course`, `component`, `marks`, `description`, `order` | Ordered by `order`. |
| `ReferenceBook` | `course`, `title`, `authors`, `publisher`, `edition`, `year`, `is_textbook`, `order` | Ordered by `is_textbook`, `order`. |
| `CourseVersion` | `course`, `version_number`, `edited_by`, `previous_version`, `snapshot`, `change_summary` | Unique `(course, version_number)`. Snapshot is full nested JSON. |
| `CourseInvitation` | `course`, `email`, `token`, inviter/acceptance fields, expiry | Token unique, email/token indexes. |

### workflow

| Model | Implemented fields | Notes |
| --- | --- | --- |
| `ApprovalWorkflow` | `course`, `actor`, `from_status`, `to_status`, `decision`, `note` | Decisions: `REQUEST_CHANGES`, `APPROVE`, `REJECT`, `PUBLISH`. |
| `ReviewerComment` | `course`, `reviewer`, section fields, `body`, resolution fields | Index `(course, section_key, is_resolved)`. |

### publishing

| Model | Implemented fields | Notes |
| --- | --- | --- |
| `CurriculumTemplate` | `name`, `department`, `html_template`, `css`, `is_active`, `is_locked`, `version`, `template_pdf` | Save hook increments version on editable content changes and blocks content edits after lock. |
| `PublishedCurriculum` | `department`, `academic_year`, `template`, `published_by`, `pdf`, `docx`, `version_label`, `is_public`, `template_snapshot`, `render_metrics` | Unique `(department, academic_year, version_label)`. |

### notifications / audit

| Model | Implemented fields | Notes |
| --- | --- | --- |
| `Notification` | `user`, `title`, `body`, `link`, `is_read` | User-scoped read endpoint plus `mark_read`. |
| `AuditLog` | `user`, method/path/status/ip/user agent/timestamp | Model exists; middleware exists, but audit middleware registration was not confirmed in `settings` during this audit pass. |

## API Inventory

All current Django API routes are under `/api/`.

| Current Django endpoint | Implemented behavior | Worker equivalent |
| --- | --- | --- |
| `POST /auth/token/` | JWT login via SimpleJWT | `POST /api/auth/token/` migration bridge |
| `POST /auth/token/refresh/` | JWT refresh | Worker currently returns `501`; production needs durable refresh table or Cloudflare Access |
| `GET /auth/me/` | Current user profile | `GET /api/auth/me/` |
| CRUD `/users/` | Admin/HOD only | Worker repository route still to be added if user management is required in phase 2 |
| CRUD `/departments/` | Auth read, admin/HOD write | Implemented |
| CRUD `/academic-years/` | Auth read, admin/HOD write | Implemented |
| CRUD `/semesters/` | Auth read, admin/HOD write | Implemented |
| CRUD `/courses/` | List/detail/update/create with versions | Implemented core |
| `POST /courses/:id/submit/` | Sets `SUBMITTED`, creates version | Implemented |
| `POST /courses/:id/reopen/` | Sets `CHANGES_REQUESTED`, clears approval | Implemented |
| `GET /courses/:id/versions/` | Version history | Implemented |
| `POST /courses/:id/rollback/` | Restores top-level course fields from snapshot | Implemented |
| `POST /courses/:id/compare_versions/` | Field/list diff between snapshots | Implemented |
| `POST /courses/:id/autosave/` | Nested update/insert/delete in transaction, returns serialized course | Implemented with D1 statements; wrap in explicit transaction before production cutover |
| `GET /courses/:id/preview_pdf/` | WeasyPrint PDF | Replace with print route; not implemented as server PDF |
| `GET /courses/:id/reviewer_readonly_pdf/` | WeasyPrint PDF | Replace with print route; not implemented as server PDF |
| `GET /courses/:id/render_estimation/` | Heuristic page warnings | Logic documented; Worker endpoint can return same heuristic in phase 2 |
| CRUD child routes | Outcomes/modules/topics/experiments/assessments/references | Autosave covers nested writes; standalone CRUD can be wired with `crudRoute` if still used |
| `/course-invitations/:token/` + accept | Invitation retrieval/acceptance | Not yet implemented in Worker source; schema preserved |
| CRUD `/reviewer-comments/` | Reviewer comments and resolution | Implemented |
| CRUD `/approval-workflows/` | Reviewer/admin decisions | Implemented |
| `/notifications/`, `mark_read` | User notification reads | Generic route present; must filter to current user in production |
| CRUD `/curriculum-templates/` | Admin/HOD only, locked templates protected by serializer | Implemented basic CRUD; lock/version content guard should be completed |
| `GET /published-curricula/` | Public read | Implemented auth-protected in Worker currently; public read should be opened intentionally |
| `POST /published-curricula/publish/` | Server PDF generation, locks template, marks approved courses published | Implemented as Browser Print registration, locks template, marks courses published |

## Supabase Schema Inventory

Supabase tables present in `supabase/schema.sql`:

`departments`, `profiles`, `academic_years`, `semesters`, `courses`, `course_outcomes`, `modules`, `topics`, `experiments`, `assessment_schemes`, `reference_books`, `course_versions`, `course_invitations`, `reviewer_comments`, `approval_workflows`, `curriculum_templates`, `published_curricula`, `notifications`, `audit_logs`.

Supabase PostgreSQL features present:

| Feature | Present use |
| --- | --- |
| Extensions | `uuid-ossp`, `pgcrypto` |
| Enums | `app_role`, `course_type`, `course_status`, `workflow_decision` |
| UUID primary keys | All domain tables except `audit_logs` |
| JSONB | `online_resources`, `section_order`, `snapshot`, `template_snapshot`, `render_metrics` |
| Triggers | `touch_updated_at` trigger on most tables |
| RLS | Enabled on all domain tables with role-aware policies |
| Functions | `auth_user_role()`, `is_academic_admin()` |
| Advanced types | `inet`, `timestamptz`, `numeric(p,s)` |

## Business Logic Inventory

| Logic | Location | Implemented vs mocked |
| --- | --- | --- |
| Course total/exam mark calculations | `Course` model properties and `publishing.services.official_course_context` | Implemented, duplicated in frontend preview |
| Snapshot version creation | `curriculum.services.create_course_version` | Implemented |
| Snapshot serialization | `curriculum.services.serialize_course_snapshot` | Implemented |
| Version compare | `CourseViewSet.compare_versions` | Implemented but shallow for list sections |
| Rollback | `CourseViewSet.rollback` | Implemented for top-level course fields only; child restoration is not implemented |
| Nested autosave | `CourseViewSet.autosave` | Implemented for course, outcomes, modules/topics, experiments, assessments, reference books |
| Workflow transition | `workflow.services.apply_decision` | Implemented but permissive: no legal from-state validation |
| Reviewer comments | `ReviewerCommentViewSet` | Implemented |
| Comment resolve | `ReviewerCommentViewSet.resolve` | Implemented |
| Course invitations | `CourseInvitationViewSet`, `invite_teacher` action | Implemented, including email send |
| Template versioning/locking | `CurriculumTemplate.save`, serializer validation | Implemented |
| Publish assembly | `publishing.services.assemble_curriculum_pdf` | Implemented with WeasyPrint server PDF |
| Render estimation | `publishing.services.get_render_estimation` | Implemented heuristic |
| Audit logging | `audit` app | Model/middleware present; runtime registration needs verification |

## Workflow Inventory

Statuses preserved:

`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `LOCKED`.

Decisions preserved:

| Decision | Current resulting status |
| --- | --- |
| `REQUEST_CHANGES` | `CHANGES_REQUESTED` |
| `REJECT` | `CHANGES_REQUESTED` |
| `APPROVE` | `APPROVED`, sets `approved_by`, `approved_at` |
| `PUBLISH` | `PUBLISHED` |

Important behavior: current backend does not validate from-state transitions. The Worker preserves this permissive behavior for compatibility.

## Versioning Inventory

Version snapshots are created on:

- Course create
- Course update
- Course submit
- Course reopen
- Workflow decision
- Course outcome creation
- Autosave should be versioned in the Worker because the frontend treats autosave as draft persistence

Snapshot shape includes:

- Course scalar fields
- `faculty_id`
- `approved_by_id`
- Outcomes
- Modules with nested topics
- Experiments
- Assessments
- Reference books

Gaps:

- Django rollback only restores top-level course fields, not nested collections.
- Version diff treats list sections as whole-list changes.

## PDF Generation Inventory

Implemented server PDF paths:

- `render_course_preview_pdf(course)` uses `templates/course_detail.html`, `templates/pdf/base.html`, PDF partials, `static/css/print.css`, WeasyPrint.
- `render_reviewer_readonly_pdf(course)` appends reviewer comments using `templates/reviewer_readonly.html`.
- `assemble_curriculum_pdf(...)` uses `templates/pdf/curriculum_book.html`, freezes template snapshot, saves PDF, marks courses `PUBLISHED`, locks template.

Mocked / frontend-only PDF behavior:

- `frontend/components/curriculum/a4-preview.tsx` renders an A4-like preview in HTML/CSS, but it is not currently the final export workflow.

Target replacement:

- Keep the HTML curriculum presentation and convert final curriculum output to Next print routes using print CSS.
- Register `published_curricula.print_url`/`pdf_url` as the print route for browser Print -> Save as PDF.
