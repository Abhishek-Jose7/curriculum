# Task 2 Report: Backend Endpoint for Quick 1-Click Faculty Re-assignment

## Status
DONE

## Summary of Work
Added the dedicated endpoint `PATCH /api/courses/:id/assign-faculty/` (and `PATCH /api/courses/:id/assign-faculty`) in `backend-worker/src/index.ts` to support quick 1-click teacher assignment/re-assignment.

- Enforced `requireRole('ADMIN', 'HOD')` middleware authorization.
- Extracted `faculty_user_id` from JSON body (`string | null`).
- Executed `UPDATE courses SET faculty_user_id = ? WHERE id = ? RETURNING *`.
- Returned `404` with `{ detail: "Course not found." }` when course was not found.
- Returned 200 with updated course JSON object when successful.

## Commits
- `73a2dab`: feat(backend): PATCH /courses/:id/assign-faculty/ for 1-click teacher assignment

## Verification / Test Summary
- Executed `npx tsc --noEmit` in `backend-worker/` — compile succeeded cleanly with 0 errors.

## Concerns
None.
