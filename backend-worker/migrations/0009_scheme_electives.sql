-- =====================================================================
-- 0009_scheme_electives.sql
-- Adds scheme_electives table for dynamic Program Elective Courses,
-- Program Elective Labs, and Modern Indian Languages (AEC).
-- =====================================================================

CREATE TABLE IF NOT EXISTS scheme_electives (
  id              TEXT PRIMARY KEY,
  scheme_id       TEXT NOT NULL REFERENCES curriculum_schemes(id) ON DELETE CASCADE,
  category        TEXT NOT NULL CHECK (category IN ('TRACK', 'LAB', 'AEC')),
  track_name      TEXT NOT NULL DEFAULT '',
  sem5_code       TEXT NOT NULL DEFAULT '',
  sem5_title      TEXT NOT NULL DEFAULT '',
  sem6_code       TEXT NOT NULL DEFAULT '',
  sem6_title      TEXT NOT NULL DEFAULT '',
  credits         REAL NOT NULL DEFAULT 3,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scheme_electives_scheme ON scheme_electives(scheme_id, category, sort_order);

