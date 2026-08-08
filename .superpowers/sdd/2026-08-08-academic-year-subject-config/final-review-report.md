## Spec Compliance
- Fresh Academic Year creation auto-generates semesters 1 to 8 & default subjects: PASS
- Rollover Academic Year creation leaves rollover handling to the rollover endpoint: PASS
- `GET /api/profiles/faculty/` returning active profiles sorted alphabetically: PASS
- `PATCH /api/courses/:id/assign-faculty/` updates `faculty_user_id` and returns course: PASS
- Frontend Admin page loads faculty users, adds "Configure Subjects" toggle, opens inline drawer, and allows quick add & 1-click assignment: PASS

## Security Findings
- None (All new routes are properly protected with role guards and `isAcademicAdmin` check).

## Code Quality
- **Important**: In `frontend/app/admin/page.tsx`, the Quick Add Subject Form `POST /courses/` request sends `semester: semId` instead of `semester_id: semId`. The backend `CoursesRepository` relies on `courseFields` which expects `semester_id`, and `BaseRepository.create` does not alias `semester` to `semester_id`. This causes the property to be ignored, resulting in the course being created with a `NULL` `semester_id` and failing to appear in the semester's subject list.
- **Minor**: Duplicate route registrations for `GET /profiles/faculty` and `GET /profiles/faculty/` in `backend-worker/src/index.ts`. This is harmless but redundant.

## Verdict
NEEDS_FIXES
