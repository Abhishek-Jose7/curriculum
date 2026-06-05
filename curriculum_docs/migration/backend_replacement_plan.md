# Worker Backend Replacement Plan

Worker source artifact: `backend-worker/src`.

## Endpoint Mapping

| Django endpoint | Worker route | Notes |
| --- | --- | --- |
| `POST /api/auth/token/` | `POST /api/auth/token/` | Migration bridge. Replace with Cloudflare Access or hardened password verification before production. |
| `POST /api/auth/token/refresh/` | `POST /api/auth/token/refresh/` | Stubbed as `501`; add durable refresh token storage or remove if Access is used. |
| `GET /api/auth/me/` | `GET /api/auth/me/` | Implemented. |
| `/api/departments/` | Same | Implemented generic CRUD. |
| `/api/academic-years/` | Same | Implemented generic CRUD. |
| `/api/semesters/` | Same | Implemented generic CRUD. |
| `/api/courses/` | Same | Implemented list/create/detail/update. |
| `/api/courses/:id/autosave/` | Same | Implemented nested sync. |
| `/api/courses/:id/submit/` | Same | Implemented. |
| `/api/courses/:id/reopen/` | Same | Implemented. |
| `/api/courses/:id/versions/` | Same | Implemented. |
| `/api/courses/:id/rollback/` | Same | Implemented top-level rollback. |
| `/api/courses/:id/compare_versions/` | Same | Implemented. |
| `/api/reviewer-comments/` | Same | Implemented list/create. |
| `/api/reviewer-comments/:id/resolve/` | Same | Implemented. |
| `/api/approval-workflows/` | Same | Implemented list/create and course state updates. |
| `/api/curriculum-templates/` | Same | Implemented base CRUD; add locked-template write guard. |
| `/api/published-curricula/` | Same | Implemented list. |
| `/api/published-curricula/publish/` | Same | Implemented browser-print publishing registration. |
| `/api/notifications/` | Same | Generic route exists; tighten current-user scoping. |
| `/api/course-invitations/` | Same | Schema preserved; route still pending. |
| PDF endpoints | Print routes | Replace with Next routes, not Worker PDF generation. |

## Authorization Matrix

| Capability | ADMIN | HOD | FACULTY | REVIEWER | PUBLIC |
| --- | --- | --- | --- | --- | --- |
| Read departments/years/semesters | Yes | Yes | Yes | Yes | No |
| Manage departments/years/semesters | Yes | Yes | No | No | No |
| Read assigned/public courses | Yes | Yes | Yes | Yes | Published only |
| Create/manage any course | Yes | Yes | No | No | No |
| Edit assigned editable course | Yes | Yes | Yes, if assigned and status in `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `CHANGES_REQUESTED` | No | No |
| Autosave assigned course | Yes | Yes | Yes, same status rule | No | No |
| Submit course | Yes | Yes | Assigned faculty | No | No |
| Reopen course | Yes | Yes | No | No | No |
| Add reviewer comment | Yes | Yes | No | Yes | No |
| Resolve reviewer comment | Yes | Yes | Own comment only | Own comment only | No |
| Workflow decision | Yes | Yes | No | Yes | No |
| Publish curriculum | Yes | Yes | No | No | No |
| Manage templates | Yes | Yes | No | No | No |
| Read published curricula | Yes | Yes | Yes | Yes | Public if `is_public` |

## Validation Parity

The Worker should preserve serializer validations:

- Required course fields: `semester_id`, `code`, `title`, `course_type`, `status`.
- Choice fields via D1 `CHECK`.
- Max lengths currently enforced in Django for objectives/pre-requisites/syllabus/module/topic text must move into Worker validators before cutover.
- Template edit protection must reject content edits when `is_locked = 1`.
- Course child writes must reject unauthorized parent course edits.

## Data Access Layer

Implemented repository classes:

- `CoursesRepository`
- `ModulesRepository`
- `TopicsRepository`
- `OutcomesRepository`
- `ReviewerRepository`
- `WorkflowRepository`
- Plus `ExperimentsRepository`, `AssessmentsRepository`, `ReferenceBooksRepository`, and generic `BaseRepository`.

## Autosave Migration

Current Django behavior:

- Updates top-level course via serializer.
- Syncs outcomes, experiments, assessments, reference books.
- Syncs modules, then nested topics.
- Deletes records missing from payload.
- Uses transaction.
- Returns fully serialized course.

Worker behavior:

- Same payload shape and endpoint.
- Syncs nested records by `id`, inserts missing records, deletes omitted records, preserves ordering through `sort_order`.
- Creates a version snapshot after autosave.

Production hardening:

- Wrap nested sync in D1 `batch()`/transaction pattern for atomicity.
- Enforce course edit permission before sync.
- Add optimistic concurrency using `updated_at` or explicit draft revision if collisions become visible.

## PDF Strategy

Remove server-side PDF generation:

1. Keep the existing HTML curriculum layout as source material.
2. Add Next print routes:
   - `/print/course/[id]`
   - `/print/reviewer/course/[id]`
   - `/print/final?department=...&academic_year=...&version=...`
3. Add `@media print` CSS:
   - A4 size
   - page margins
   - `break-before`, `break-inside: avoid`
   - stable table widths
   - repeating headers/footers through print-friendly layout
4. Publishing action records a `published_curricula` row, freezes template snapshot, locks template, marks courses `PUBLISHED`, and returns the final print URL.
5. Admin opens final page and uses Browser Print -> Save as PDF.

## Implemented Versus Pending

Implemented in this pass:

- D1 schema.
- Repository layer.
- Core Worker routes for curriculum editing, autosave, workflow, comments, publishing registration.
- Worker-level JWT middleware and role helpers.

Pending before production:

- Harden auth provider and password verification.
- Add invitation endpoints.
- Add child standalone CRUD routes if frontend still calls them outside autosave.
- Add exact serializer validations.
- Add Next print routes and print CSS.
- Add tests for endpoint parity and migration counts.
