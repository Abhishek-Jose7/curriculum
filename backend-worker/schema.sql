-- Cloudflare D1 schema for the curriculum management and publishing system.
-- UUID values are stored as TEXT so Supabase exports can be imported without
-- lossy id remapping. Timestamps are ISO-8601 UTC strings.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  college_name TEXT NOT NULL DEFAULT '',
  university_name TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'FACULTY' CHECK (role IN ('ADMIN', 'HOD', 'FACULTY', 'REVIEWER', 'PUBLIC')),
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  designation TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  is_superuser INTEGER NOT NULL DEFAULT 0 CHECK (is_superuser IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_years (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  name TEXT NOT NULL UNIQUE,
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS semesters (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  academic_year_id TEXT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number > 0),
  title TEXT NOT NULL,
  ordinance TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (department_id, academic_year_id, number)
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  semester_id TEXT NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  faculty_user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  course_type TEXT NOT NULL DEFAULT 'THEORY' CHECK (course_type IN ('THEORY', 'LAB', 'THEORY_LAB', 'PROJECT', 'ELECTIVE', 'INTERDISCIPLINARY')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'LOCKED')),
  lecture_hours INTEGER NOT NULL DEFAULT 0 CHECK (lecture_hours >= 0),
  tutorial_hours INTEGER NOT NULL DEFAULT 0 CHECK (tutorial_hours >= 0),
  practical_hours INTEGER NOT NULL DEFAULT 0 CHECK (practical_hours >= 0),
  lecture_credits REAL NOT NULL DEFAULT 0,
  tutorial_credits REAL NOT NULL DEFAULT 0,
  practical_credits REAL NOT NULL DEFAULT 0,
  credits REAL NOT NULL DEFAULT 0,
  internal_marks INTEGER NOT NULL DEFAULT 0 CHECK (internal_marks >= 0),
  external_marks INTEGER NOT NULL DEFAULT 0 CHECK (external_marks >= 0),
  duration_hours REAL NOT NULL DEFAULT 3,
  passing_marks INTEGER NOT NULL DEFAULT 0 CHECK (passing_marks >= 0),
  pre_requisites TEXT NOT NULL DEFAULT '',
  objectives TEXT NOT NULL DEFAULT '',
  syllabus_intro TEXT NOT NULL DEFAULT '',
  online_resources TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(online_resources)),
  section_order TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(section_order)),
  approved_by_user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (semester_id, code)
);

CREATE INDEX IF NOT EXISTS courses_status_idx ON courses(status);
CREATE INDEX IF NOT EXISTS courses_faculty_user_idx ON courses(faculty_user_id);
CREATE INDEX IF NOT EXISTS courses_type_idx ON courses(course_type);
CREATE INDEX IF NOT EXISTS courses_semester_idx ON courses(semester_id);

CREATE TABLE IF NOT EXISTS course_outcomes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  bloom_level TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (course_id, code)
);

CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number > 0),
  title TEXT NOT NULL,
  contact_hours INTEGER NOT NULL DEFAULT 0 CHECK (contact_hours >= 0),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (course_id, number)
);

CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS experiments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number > 0),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  hours INTEGER NOT NULL DEFAULT 2 CHECK (hours >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (course_id, number)
);

CREATE TABLE IF NOT EXISTS assessment_schemes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  component TEXT NOT NULL,
  marks INTEGER NOT NULL CHECK (marks >= 0),
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reference_books (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  authors TEXT NOT NULL DEFAULT '',
  publisher TEXT NOT NULL DEFAULT '',
  edition TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  is_textbook INTEGER NOT NULL DEFAULT 0 CHECK (is_textbook IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_versions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  edited_by_user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  previous_version_id TEXT REFERENCES course_versions(id) ON DELETE SET NULL,
  snapshot TEXT NOT NULL CHECK (json_valid(snapshot)),
  change_summary TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (course_id, version_number)
);

CREATE TABLE IF NOT EXISTS course_invitations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  invited_by_user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  accepted_by_user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TEXT NOT NULL DEFAULT (datetime('now', '+14 days')),
  accepted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS course_invitations_email_idx ON course_invitations(email);
CREATE INDEX IF NOT EXISTS course_invitations_token_idx ON course_invitations(token);
CREATE INDEX IF NOT EXISTS course_invitations_course_idx ON course_invitations(course_id);

CREATE TABLE IF NOT EXISTS reviewer_comments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  reviewer_user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  section_key TEXT NOT NULL,
  section_label TEXT NOT NULL,
  body TEXT NOT NULL,
  is_resolved INTEGER NOT NULL DEFAULT 0 CHECK (is_resolved IN (0, 1)),
  resolved_by_user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS reviewer_comments_section_idx ON reviewer_comments(course_id, section_key, is_resolved);

CREATE TABLE IF NOT EXISTS approval_workflows (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  from_status TEXT NOT NULL CHECK (from_status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'LOCKED')),
  to_status TEXT NOT NULL CHECK (to_status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'LOCKED')),
  decision TEXT NOT NULL CHECK (decision IN ('REQUEST_CHANGES', 'APPROVE', 'REJECT', 'PUBLISH')),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS curriculum_templates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  html_template TEXT NOT NULL,
  css TEXT NOT NULL,
  template_pdf_url TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  is_locked INTEGER NOT NULL DEFAULT 0 CHECK (is_locked IN (0, 1)),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS published_curricula (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  academic_year_id TEXT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES curriculum_templates(id) ON DELETE RESTRICT,
  published_by_user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  pdf_url TEXT NOT NULL DEFAULT '',
  docx_url TEXT NOT NULL DEFAULT '',
  print_url TEXT NOT NULL DEFAULT '',
  version_label TEXT NOT NULL,
  is_public INTEGER NOT NULL DEFAULT 1 CHECK (is_public IN (0, 1)),
  template_snapshot TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(template_snapshot)),
  render_metrics TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(render_metrics)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (department_id, academic_year_id, version_label)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '',
  is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,
  ip_address TEXT,
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS audit_logs_user_created_idx ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS audit_logs_path_idx ON audit_logs(path);

CREATE TRIGGER IF NOT EXISTS touch_departments AFTER UPDATE ON departments WHEN NEW.updated_at = OLD.updated_at BEGIN UPDATE departments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS touch_profiles AFTER UPDATE ON profiles WHEN NEW.updated_at = OLD.updated_at BEGIN UPDATE profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS touch_academic_years AFTER UPDATE ON academic_years WHEN NEW.updated_at = OLD.updated_at BEGIN UPDATE academic_years SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS touch_semesters AFTER UPDATE ON semesters WHEN NEW.updated_at = OLD.updated_at BEGIN UPDATE semesters SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS touch_courses AFTER UPDATE ON courses WHEN NEW.updated_at = OLD.updated_at BEGIN UPDATE courses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS touch_course_outcomes AFTER UPDATE ON course_outcomes WHEN NEW.updated_at = OLD.updated_at BEGIN UPDATE course_outcomes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS touch_modules AFTER UPDATE ON modules WHEN NEW.updated_at = OLD.updated_at BEGIN UPDATE modules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS touch_topics AFTER UPDATE ON topics WHEN NEW.updated_at = OLD.updated_at BEGIN UPDATE topics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS touch_experiments AFTER UPDATE ON experiments WHEN NEW.updated_at = OLD.updated_at BEGIN UPDATE experiments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS touch_assessment_schemes AFTER UPDATE ON assessment_schemes WHEN NEW.updated_at = OLD.updated_at BEGIN UPDATE assessment_schemes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS touch_reference_books AFTER UPDATE ON reference_books WHEN NEW.updated_at = OLD.updated_at BEGIN UPDATE reference_books SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS touch_course_invitations AFTER UPDATE ON course_invitations WHEN NEW.updated_at = OLD.updated_at BEGIN UPDATE course_invitations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS touch_reviewer_comments AFTER UPDATE ON reviewer_comments WHEN NEW.updated_at = OLD.updated_at BEGIN UPDATE reviewer_comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS touch_curriculum_templates AFTER UPDATE ON curriculum_templates WHEN NEW.updated_at = OLD.updated_at BEGIN UPDATE curriculum_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS touch_published_curricula AFTER UPDATE ON published_curricula WHEN NEW.updated_at = OLD.updated_at BEGIN UPDATE published_curricula SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS touch_notifications AFTER UPDATE ON notifications WHEN NEW.updated_at = OLD.updated_at BEGIN UPDATE notifications SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; END;
