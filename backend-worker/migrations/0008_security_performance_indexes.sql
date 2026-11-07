-- =====================================================================
-- 0008_security_performance_indexes.sql
-- Indexes for the hot read paths (course detail, course list, comments,
-- notifications, archive) and the sign-in / review-PIN throttle table.
-- All statements are idempotent.
-- =====================================================================

-- Topics are loaded by module id for every course detail render.
CREATE INDEX IF NOT EXISTS idx_topics_module ON topics(module_id);

-- Flat child collections are queried by course id; several tables had no
-- index at all (unlike course_outcomes/modules/experiments, whose UNIQUE
-- constraints already provide one).
CREATE INDEX IF NOT EXISTS idx_assessment_schemes_course ON assessment_schemes(course_id);
CREATE INDEX IF NOT EXISTS idx_reference_books_course ON reference_books(course_id);

-- Course lists and picks by code (previous-year matching, code generation).
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);

-- Comment threads and workflow history are read per course.
CREATE INDEX IF NOT EXISTS idx_approval_workflows_course ON approval_workflows(course_id);

-- Notification bell: newest-first per user.
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at);

-- Archive listing and per-department filters.
CREATE INDEX IF NOT EXISTS idx_published_curricula_dept_year ON published_curricula(department_id, academic_year_id);

-- Faculty directory and HOD department scoping.
CREATE INDEX IF NOT EXISTS idx_profiles_department_role ON profiles(department_id, role);

-- Scheme-scoped semester lookups (added by migration 0006).
CREATE INDEX IF NOT EXISTS idx_semesters_scheme ON semesters(scheme_id);

-- Sign-in and external-review PIN throttling. Created lazily by the Worker as
-- well, but defined here so fresh databases have it from the start.
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL,
  locked_until INTEGER
);
