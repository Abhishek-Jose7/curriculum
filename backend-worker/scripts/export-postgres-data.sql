-- Run from psql against Supabase/PostgreSQL.
-- Example:
-- psql "$DATABASE_URL" -f backend-worker/scripts/export-postgres-data.sql

\copy (select row_to_json(t) from departments t) to 'exports/departments.ndjson'
\copy (select row_to_json(t) from profiles t) to 'exports/profiles.ndjson'
\copy (select row_to_json(t) from academic_years t) to 'exports/academic_years.ndjson'
\copy (select row_to_json(t) from semesters t) to 'exports/semesters.ndjson'
\copy (select row_to_json(t) from courses t) to 'exports/courses.ndjson'
\copy (select row_to_json(t) from course_outcomes t) to 'exports/course_outcomes.ndjson'
\copy (select row_to_json(t) from modules t) to 'exports/modules.ndjson'
\copy (select row_to_json(t) from topics t) to 'exports/topics.ndjson'
\copy (select row_to_json(t) from experiments t) to 'exports/experiments.ndjson'
\copy (select row_to_json(t) from assessment_schemes t) to 'exports/assessment_schemes.ndjson'
\copy (select row_to_json(t) from reference_books t) to 'exports/reference_books.ndjson'
\copy (select row_to_json(t) from course_versions t) to 'exports/course_versions.ndjson'
\copy (select row_to_json(t) from course_invitations t) to 'exports/course_invitations.ndjson'
\copy (select row_to_json(t) from reviewer_comments t) to 'exports/reviewer_comments.ndjson'
\copy (select row_to_json(t) from approval_workflows t) to 'exports/approval_workflows.ndjson'
\copy (select row_to_json(t) from curriculum_templates t) to 'exports/curriculum_templates.ndjson'
\copy (select row_to_json(t) from published_curricula t) to 'exports/published_curricula.ndjson'
\copy (select row_to_json(t) from notifications t) to 'exports/notifications.ndjson'
\copy (select row_to_json(t) from audit_logs t) to 'exports/audit_logs.ndjson'
