# Incremental Migration Execution Plan

## Phase 1: D1 Schema Migration

Files affected:

- `backend-worker/schema.sql`
- `backend-worker/migrations/*`
- `backend-worker/scripts/*`

Risks:

- UUID vs integer ID mismatch between Supabase schema and Django runtime.
- JSONB query behavior changes.
- Decimal precision no longer enforced by database.

Rollback:

- Keep Supabase/PostgreSQL read-write as source of truth.
- Drop/recreate D1 staging database.
- Do not point frontend to Worker until count checks pass.

Verification:

- Apply schema locally with Wrangler.
- Import sample data.
- Compare row counts per table.
- Run orphan foreign-key queries.
- Fetch a course with nested modules/topics/outcomes.

## Phase 2: Worker API Implementation

Files affected:

- `backend-worker/src/index.ts`
- `backend-worker/src/repositories/*`
- `backend-worker/src/middleware/*`
- `backend-worker/src/services/*`

Risks:

- DRF response shape differences.
- Missing serializer validations.
- Pagination differences.

Rollback:

- Keep `NEXT_PUBLIC_API_URL` pointed at Django.
- Disable Worker route in Cloudflare Pages environment.

Verification:

- `GET /api/auth/me/`
- Course list/detail.
- Autosave no-op payload.
- Reviewer comment create/resolve.
- Workflow approve/request changes.

## Phase 3: Frontend API Replacement

Files affected:

- `frontend/lib/api.ts`
- Environment variables only for first cutover.

Risks:

- Assumption that IDs are numeric in route parsing.
- API payload naming mismatches: `faculty` vs `faculty_user_id`, `order` vs `sort_order`.

Rollback:

- Restore `NEXT_PUBLIC_API_URL` to Django.

Verification:

- Existing editor opens the same course.
- Autosave status reaches `saved`.
- Review page loads comments.
- Publishing page lists templates and published items.

## Phase 4: Authorization Migration

Files affected:

- `backend-worker/src/middleware/auth.ts`
- Worker route guards.

Risks:

- RLS rules accidentally broadened.
- Public published curriculum access blocked or overexposed.

Rollback:

- Put Worker behind admin-only staging access.
- Return frontend to Django auth.

Verification:

- Permission matrix tests for each role.
- Faculty cannot edit unassigned course.
- Reviewer cannot edit course content.
- Public can only read public published output.

## Phase 5: Autosave Migration

Files affected:

- `backend-worker/src/index.ts`
- `backend-worker/src/services/courseVersions.ts`
- `frontend/hooks/use-autosave.ts` only if conflict handling is added.

Risks:

- Partial nested writes if transaction handling is incomplete.
- Delete-by-omission can remove records if frontend payload omits a section unintentionally.

Rollback:

- Feature flag autosave route to Django.
- Restore D1 from pre-autosave snapshot/export.

Verification:

- Update course scalar.
- Add/update/delete outcome.
- Add/update/delete module topic.
- Add/update/delete assessment/reference.
- Confirm version snapshot after save.

## Phase 6: Versioning Migration

Files affected:

- `backend-worker/src/services/courseVersions.ts`
- `backend-worker/src/index.ts`

Risks:

- Snapshot shape drift from Django.
- Rollback remains top-level only unless intentionally expanded.

Rollback:

- Keep version history read-only until parity confirmed.

Verification:

- Version created on create/update/submit/workflow/autosave.
- Compare versions returns same categories.
- Rollback creates a new version.

## Phase 7: Publishing Migration

Files affected:

- `frontend/app/print/**` new routes
- `frontend/app/globals.css` print CSS
- `backend-worker/src/index.ts` publish endpoint

Risks:

- Browser print output differs from historical WeasyPrint output.
- Headers/footers/page breaks differ by browser.

Rollback:

- Keep Django PDF endpoints until final print route acceptance.
- Keep historical PDFs in R2 or existing media storage.

Verification:

- A4 output.
- Tables stable.
- Page breaks at course/section boundaries.
- Header/footer behavior accepted.
- Published courses become `PUBLISHED`.
- Template locks after publish.

## Phase 8: Django Removal

Files affected:

- Docker compose.
- Backend deployment pipeline.
- Environment variables.
- Docs.

Risks:

- Hidden operational dependency on Django admin, email, media serving, or WeasyPrint.

Rollback:

- Keep final Django deployment image and DB backup for one release cycle.

Verification:

- No frontend route calls Django URL.
- No worker route depends on Django.
- No server PDF generation required.
- Admin/faculty/reviewer flows complete end to end on Cloudflare.

## Final Success Criteria

- Identical curriculum editing.
- Identical workflow states.
- Identical reviewer process.
- Identical versioning behavior.
- Identical publishing workflow at business-process level.
- Identical final curriculum content, exported through Browser Print.
- Runtime stack is Next.js, Cloudflare Pages, Workers, D1, and R2, with no Django dependency.
