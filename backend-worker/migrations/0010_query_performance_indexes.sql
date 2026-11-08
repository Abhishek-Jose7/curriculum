-- Migration 0010: High-performance composite indexes and expression index
-- Eliminates disk filesorts and table scans across course listings, booklet compilation,
-- scheme semester lookups, published curriculum archives, and course code prefix matching.

-- 1. Covering index for course outcomes ordered by sort_order and code
CREATE INDEX IF NOT EXISTS idx_course_outcomes_course_order 
  ON course_outcomes(course_id, sort_order ASC, code ASC);

-- 2. Covering index for assessment schemes ordered by sort_order
CREATE INDEX IF NOT EXISTS idx_assessment_schemes_course_sort 
  ON assessment_schemes(course_id, sort_order ASC);

-- 3. Covering index for reference books sorted by textbook first, then sort_order
CREATE INDEX IF NOT EXISTS idx_reference_books_course_textbook_sort 
  ON reference_books(course_id, is_textbook DESC, sort_order ASC);

-- 4. Covering index for topic lookup within modules ordered by sort_order
CREATE INDEX IF NOT EXISTS idx_topics_module_sort 
  ON topics(module_id, sort_order ASC);

-- 5. Covering index for reviewer comments by course, status, section, and date
CREATE INDEX IF NOT EXISTS idx_reviewer_comments_course_submitted 
  ON reviewer_comments(course_id, status, section_key, created_at DESC);

-- 6. Index for semesters ordered by number within a scheme
CREATE INDEX IF NOT EXISTS idx_semesters_scheme_number 
  ON semesters(scheme_id, number ASC);

-- 7. Composite index for filtering courses by semester and status
CREATE INDEX IF NOT EXISTS idx_courses_semester_status 
  ON courses(semester_id, status);

-- 8. Expression index for matching course code suffix (e.g. PCC11CE01) in findPreviousMatches
CREATE INDEX IF NOT EXISTS idx_courses_code_suffix 
  ON courses(substr(code, 3));

-- 9. Index for filtering published curricula by scheme_id in booklet archives
CREATE INDEX IF NOT EXISTS idx_published_curricula_scheme 
  ON published_curricula(scheme_id);

