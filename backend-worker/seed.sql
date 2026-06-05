-- Seed data for D1 Database

-- 1. Departments
INSERT OR IGNORE INTO departments (id, code, name, college_name, university_name, logo_url) 
VALUES (1, 'COMP', 'Computer Engineering', 'College of Engineering', 'Official University', '');

-- 2. Profiles (Users)
-- Development-only password verifier for the Worker migration bridge.
-- Production should replace this with Cloudflare Access or hardened password
-- verification plus durable refresh-token storage.
INSERT OR IGNORE INTO profiles (id, email, password_hash, role, department_id, first_name, last_name, designation, phone, is_active)
VALUES 
(1, 'admin@example.edu', 'ChangeMe123!', 'ADMIN', 1, 'System', 'Admin', 'Administrator', '9999999999', 1),
(2, 'faculty@example.edu', 'ChangeMe123!', 'FACULTY', 1, 'Faculty', 'Coordinator', 'Assistant Professor', '8888888888', 1),
(3, 'reviewer@example.edu', 'ChangeMe123!', 'REVIEWER', 1, 'Peer', 'Reviewer', 'Associate Professor', '7777777777', 1);

UPDATE profiles SET password_hash = 'ChangeMe123!' WHERE id IN ('1', '2', '3');

-- 3. Academic Years
INSERT OR IGNORE INTO academic_years (id, name, starts_on, ends_on, is_active)
VALUES (1, '2026-27', '2026-07-01', '2027-06-30', 1);

-- 4. Semesters
INSERT OR IGNORE INTO semesters (id, department_id, academic_year_id, number, title, ordinance)
VALUES (1, 1, 1, 3, 'Semester III', '');

-- 5. Courses
INSERT OR IGNORE INTO courses (id, semester_id, faculty_user_id, code, title, course_type, status, lecture_hours, tutorial_hours, practical_hours, credits, internal_marks, external_marks, objectives, pre_requisites, syllabus_intro)
VALUES (1, 1, 2, 'CS301', 'Data Structures and Algorithms', 'THEORY', 'DRAFT', 3, 1, 0, 4.0, 40, 60, 'Introduce abstract data types, algorithm design, and complexity analysis.', 'Nil', 'This course builds core foundational concepts for computing.');

-- 6. Course Outcomes
INSERT OR IGNORE INTO course_outcomes (id, course_id, code, description, bloom_level, sort_order)
VALUES 
(1, 1, 'CO1', 'Apply linear and non-linear data structures.', 'Apply', 1),
(2, 1, 'CO2', 'Analyze algorithmic complexity for common operations.', 'Analyze', 2);

-- 7. Modules
INSERT OR IGNORE INTO modules (id, course_id, number, title, contact_hours, content)
VALUES (1, 1, 1, 'Linear Data Structures', 10, 'Arrays, linked lists, stacks, queues, and applications.');

-- 8. Topics
INSERT OR IGNORE INTO topics (id, module_id, title, description, sort_order)
VALUES (1, 1, 'Stacks and Queues', 'ADT operations and applications.', 1);

-- 9. Assessment Schemes
INSERT OR IGNORE INTO assessment_schemes (id, course_id, component, marks, description, sort_order)
VALUES 
(1, 1, 'Continuous Assessment', 40, 'Assignments, quizzes, and internal tests.', 1),
(2, 1, 'End Semester Examination', 60, 'University theory examination.', 2);

-- 10. Reference Books
INSERT OR IGNORE INTO reference_books (id, course_id, title, authors, publisher, edition, year, is_textbook, sort_order)
VALUES (1, 1, 'Data Structures and Algorithm Analysis', 'Mark Allen Weiss', 'Pearson', '3rd', '2012', 1, 1);

-- 11. Curriculum Templates
INSERT OR IGNORE INTO curriculum_templates (id, department_id, name, html_template, css, is_active)
VALUES (1, 1, 'Official University Template', 'templates/pdf/curriculum_book.html', '/* CANONICAL CSS */', 1);
