-- =====================================================================
-- 0006_scheme_authoring.sql
-- Phase 2: scheme-based subject authoring, multi-cohort semester
-- unlocking, and compiled-booklet rework.
-- =====================================================================

-- Step 1 — department program-code correction.
UPDATE departments SET code = 'CE' WHERE code = 'COMP';
UPDATE departments SET code = 'CS' WHERE code = 'CSE';
UPDATE departments SET code = 'EC' WHERE code = 'ECS';
UPDATE departments SET code = 'ME' WHERE code = 'MECH';

-- Step 2 — curriculum_schemes
CREATE TABLE IF NOT EXISTS curriculum_schemes (
  id                  TEXT PRIMARY KEY,
  department_id       TEXT NOT NULL REFERENCES departments(id),
  entering_year       TEXT NOT NULL,                 -- e.g. "2026-27"
  scheme_year_code    TEXT NOT NULL,                  -- e.g. "26"
  status              TEXT NOT NULL DEFAULT 'draft_setup'
                         CHECK (status IN ('draft_setup','active','completed')),
  created_by_user_id  TEXT NOT NULL REFERENCES profiles(id),
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  UNIQUE (department_id, entering_year)
);

-- Step 3 — semesters: repoint from academic_years to curriculum_schemes
ALTER TABLE semesters ADD COLUMN scheme_id TEXT REFERENCES curriculum_schemes(id);
ALTER TABLE semesters ADD COLUMN is_unlocked INTEGER NOT NULL DEFAULT 0;      -- 0/1 boolean
ALTER TABLE semesters ADD COLUMN unlocked_at TEXT;
ALTER TABLE semesters ADD COLUMN shell_completed_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_semesters_scheme_number
  ON semesters(scheme_id, number);

-- Step 4 — courses: shell fields
ALTER TABLE courses ADD COLUMN vertical TEXT;
ALTER TABLE courses ADD COLUMN sub_vertical TEXT;
ALTER TABLE courses ADD COLUMN code_is_custom INTEGER NOT NULL DEFAULT 0;    -- 0/1 boolean
ALTER TABLE courses ADD COLUMN total_credits INTEGER;

-- Step 5 — course_teaching_components
CREATE TABLE IF NOT EXISTS course_teaching_components (
  id              TEXT PRIMARY KEY,
  course_id       TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  component_type  TEXT NOT NULL CHECK (component_type IN ('TH','TU','PR','SL')),
  hours           INTEGER NOT NULL,
  ise_marks       INTEGER,
  mse_marks       INTEGER,
  ese_min_marks   INTEGER,
  ese_max_marks   INTEGER,
  total_marks     INTEGER,
  credit_points   INTEGER,
  sort_order      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_teaching_components_course
  ON course_teaching_components(course_id);

-- Step 6 — department_preambles
CREATE TABLE IF NOT EXISTS department_preambles (
  department_id       TEXT PRIMARY KEY REFERENCES departments(id),
  content              TEXT NOT NULL DEFAULT '',
  updated_by_user_id   TEXT REFERENCES profiles(id),
  updated_at           TEXT NOT NULL
);

-- Step 7 — curriculum_compile_order
CREATE TABLE IF NOT EXISTS curriculum_compile_order (
  id                   TEXT PRIMARY KEY,
  scheme_id            TEXT NOT NULL REFERENCES curriculum_schemes(id),
  year_of_study        TEXT NOT NULL CHECK (year_of_study IN ('FE','SE','TE','BE')),
  course_order         TEXT NOT NULL,                 -- JSON array of course ids
  updated_by_user_id   TEXT REFERENCES profiles(id),
  updated_at           TEXT NOT NULL,
  UNIQUE (scheme_id, year_of_study)
);

-- Step 8 — published_curricula: scope to scheme instead of academic_year
ALTER TABLE published_curricula ADD COLUMN scheme_id TEXT REFERENCES curriculum_schemes(id);
