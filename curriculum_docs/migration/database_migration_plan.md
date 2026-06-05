# D1 Database Migration Plan

Primary artifact: `backend-worker/schema.sql`.

## Strategy

1. Preserve Supabase table names and UUID identities by storing UUIDs as `TEXT`.
2. Preserve Django-only fields that were missing or incomplete in Supabase where they are required by current code, including `THEORY_LAB`, lecture/tutorial/practical credits, template lock/version, template snapshots, and render metrics.
3. Preserve relationships with D1 foreign keys.
4. Preserve indexes and unique constraints where D1 supports them.
5. Replace RLS with Worker authorization middleware.
6. Store JSONB as validated JSON `TEXT`.
7. Store files in R2 and keep object keys/URLs in D1.

## PostgreSQL To D1 Compatibility

| PostgreSQL feature | Impact | D1-compatible replacement |
| --- | --- | --- |
| Enums | D1 has no enum type. | `TEXT CHECK (...)` constraints in `schema.sql`. |
| UUID defaults | D1 has no `gen_random_uuid()`. | TEXT UUID expression using `randomblob()`, or preserve exported UUIDs during import. |
| JSONB | No binary JSONB or JSONB indexes. | `TEXT CHECK(json_valid(...))`; parse/stringify in repository layer. Add expression indexes later for specific JSON paths only if required. |
| `timestamptz` | No timezone-aware type. | ISO UTC `TEXT` timestamps with `CURRENT_TIMESTAMP`. |
| `numeric(4,1)` | D1 does not enforce decimal precision. | `REAL`; precision validation in Worker validators. |
| `inet` | No network address type. | `TEXT` for `audit_logs.ip_address`. |
| Triggers/functions | D1 supports simpler SQLite triggers, not PL/pgSQL functions. | Per-table SQLite `touch_*` triggers. |
| RLS policies | D1 has no row-level security. | Worker middleware and repository authorization checks. |
| Supabase `auth.uid()` / JWT policies | Not available in D1. | Worker verifies JWT/Cloudflare Access identity and loads `profiles` row. |
| Advanced indexes | No GIN/GiST JSONB indexes. Current schema does not use them. | Preserve b-tree indexes. Add normalized columns if JSON search becomes necessary. |
| Generated columns | None found in current Supabase schema. | If introduced later, use explicit Worker-maintained columns. |

## Migration Scripts

Recommended migration pipeline:

1. Freeze Django writes.
2. Export Supabase data in table dependency order as NDJSON or CSV.
3. Transform PostgreSQL booleans/JSON/timestamps into D1-compatible values.
4. Import into D1 using `backend-worker/scripts/import-ndjson-to-d1.mjs`.
5. Run verification counts and relationship checks.
6. Point a staging Worker at the migrated D1 database.
7. Run frontend smoke tests against Worker API.

## Table Import Order

1. `departments`
2. `profiles`
3. `academic_years`
4. `semesters`
5. `courses`
6. `course_outcomes`
7. `modules`
8. `topics`
9. `experiments`
10. `assessment_schemes`
11. `reference_books`
12. `course_versions`
13. `course_invitations`
14. `reviewer_comments`
15. `approval_workflows`
16. `curriculum_templates`
17. `published_curricula`
18. `notifications`
19. `audit_logs`

## Compatibility Report

| Area | Status | Notes |
| --- | --- | --- |
| Table preservation | Preserved | All Supabase tables are represented in D1 schema. |
| Django-only behavior | Preserved where schema-backed | Template lock/version, render metrics, lecture/tutorial/practical credits are included. |
| Relationships | Preserved | Foreign keys are present. Ensure `PRAGMA foreign_keys=ON` for local validation. |
| Constraints | Mostly preserved | Checks/unique constraints preserved. Decimal precision becomes Worker validation. |
| Indexes | Preserved plus additions | Supabase indexes are preserved; `courses_semester_idx` added for common queries. |
| RLS | Replaced | Worker middleware is required before production traffic. |
| Server PDF | Removed by design | Final export becomes print route registration and browser Save as PDF. |
| Existing integer IDs | Migration risk | Django models use integer IDs while Supabase schema uses UUIDs. Confirm production source of truth. If live data is Django PostgreSQL integer-keyed, either keep integer-compatible D1 IDs for phase 1 or generate UUID mapping tables. |

## Verification Queries

Run these after import:

```sql
SELECT 'departments', count(*) FROM departments
UNION ALL SELECT 'profiles', count(*) FROM profiles
UNION ALL SELECT 'courses', count(*) FROM courses
UNION ALL SELECT 'course_versions', count(*) FROM course_versions
UNION ALL SELECT 'reviewer_comments', count(*) FROM reviewer_comments
UNION ALL SELECT 'approval_workflows', count(*) FROM approval_workflows
UNION ALL SELECT 'published_curricula', count(*) FROM published_curricula;

SELECT c.id, c.code
FROM courses c
LEFT JOIN semesters s ON s.id = c.semester_id
WHERE s.id IS NULL;

SELECT m.id
FROM modules m
LEFT JOIN courses c ON c.id = m.course_id
WHERE c.id IS NULL;
```
