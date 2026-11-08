PRAGMA foreign_keys=off;
CREATE TABLE semesters_new (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  academic_year_id TEXT REFERENCES academic_years(id) ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number > 0),
  title TEXT NOT NULL,
  ordinance TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  scheme_id TEXT REFERENCES curriculum_schemes(id),
  is_unlocked INTEGER NOT NULL DEFAULT 0,
  unlocked_at TEXT,
  shell_completed_at TEXT
);
INSERT INTO semesters_new (id, department_id, academic_year_id, number, title, ordinance, created_at, updated_at, scheme_id, is_unlocked, unlocked_at, shell_completed_at)
SELECT id, department_id, academic_year_id, number, title, ordinance, created_at, updated_at, scheme_id, is_unlocked, unlocked_at, shell_completed_at FROM semesters;
DROP TABLE semesters;
ALTER TABLE semesters_new RENAME TO semesters;
CREATE UNIQUE INDEX idx_semesters_dept_ay_number ON semesters(department_id, academic_year_id, number) WHERE academic_year_id IS NOT NULL;
CREATE UNIQUE INDEX idx_semesters_scheme_number ON semesters(scheme_id, number) WHERE scheme_id IS NOT NULL;
PRAGMA foreign_keys=on;
