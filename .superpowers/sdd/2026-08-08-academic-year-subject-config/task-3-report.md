# Task 3 Report: Frontend Inline Subject Drawer & Faculty Dropdown in Admin Page

## Status
DONE

## Commits
- `d9b376d`: feat(frontend): inline subject drawer in semester cards with 1-click faculty assignment dropdown

## Files Changed
- `frontend/app/admin/page.tsx`

## Implementation Details

1. **Faculty Data Fetching**:
   - Added state `facultyUsers` to store active faculty profiles fetched from `/profiles/faculty/`.
   - Populated automatically inside `loadAllOptions` on page load.

2. **Inline Subject Drawer State & Handlers**:
   - Added state for tracking expanded semester card (`expandedSemId`), course mapping (`semCourses`), loading indicators (`loadingSemCourses`), and quick-add subject form state (`newSubjectCode`, `newSubjectTitle`, `newSubjectType`, `newSubjectCredits`, `newSubjectFaculty`, `addingSubject`).
   - Implemented helper `loadSemesterCourses(semId)` to query `/courses/?semester=${semId}`.
   - Implemented helper `handleAddSubject(semId)` to POST new subject shells with status `DRAFT`.
   - Implemented helper `handleAssignFaculty(courseId, facultyId, semId)` to PATCH `/courses/${courseId}/assign-faculty/`.

3. **Semester Card UI Enhancements**:
   - Added "Configure Subjects ({count})" button with `BookOpen` icon next to each semester item.
   - Designed and rendered the expanded Inline Subject Drawer containing:
     - Interactive list of subject cards showing subject code badge, title, course type, credits, and a live teacher dropdown select (`<select>`).
     - Quick Add Subject Shell form allowing 1-click creation of new subjects directly into the active semester context.

## Test & Build Summary
- Production build ran cleanly (`next build`):
  - Next.js 15.5.18 compilation succeeded (`✓ Compiled successfully`).
  - TypeScript type check succeeded with 0 errors (`Checking validity of types ...`).
  - Static page generation succeeded (`✓ Generating static pages (11/11)`).

## Concerns
None. All requirements implemented and verified.
