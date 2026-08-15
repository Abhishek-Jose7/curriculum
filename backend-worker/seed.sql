-- Clean existing curriculum data
DELETE FROM reference_books;
DELETE FROM topics;
DELETE FROM modules;
DELETE FROM course_outcomes;
DELETE FROM assessment_schemes;
DELETE FROM courses;

-- Baseline configuration
INSERT OR IGNORE INTO departments (id, code, name, college_name, university_name, logo_url) 
VALUES 
(1, 'COMP', 'Computer Engineering', 'Fr. Conceicao Rodrigues College of Engineering', 'University of Mumbai', ''),
(2, 'CSE', 'Computer Science and Engineering', 'Fr. Conceicao Rodrigues College of Engineering', 'University of Mumbai', ''),
(3, 'ECS', 'Electronics and Computer Science', 'Fr. Conceicao Rodrigues College of Engineering', 'University of Mumbai', ''),
(4, 'MECH', 'Mechanical Engineering', 'Fr. Conceicao Rodrigues College of Engineering', 'University of Mumbai', '');

INSERT OR IGNORE INTO profiles (id, email, password_hash, role, department_id, first_name, last_name, designation, phone, is_active)
VALUES 
(1, 'admin@example.edu', 'ChangeMe123!', 'ADMIN', 1, 'System', 'Admin', 'Administrator', '9999999999', 1),
(2, 'faculty@example.edu', 'ChangeMe123!', 'FACULTY', 1, 'Faculty', 'Coordinator', 'Assistant Professor', '8888888888', 1),
(4, 'hod@example.edu', 'ChangeMe123!', 'HOD', 1, 'Head', 'Department', 'Professor', '6666666666', 1),
(5, 'hod_cse@example.edu', 'ChangeMe123!', 'HOD', 2, 'Head', 'CSE', 'Professor', '5555555555', 1),
(6, 'hod_ecs@example.edu', 'ChangeMe123!', 'HOD', 3, 'Head', 'ECS', 'Professor', '4444444444', 1),
(7, 'hod_mech@example.edu', 'ChangeMe123!', 'HOD', 4, 'Head', 'Mechanical', 'Professor', '3333333333', 1),
(8, 'rohan.faculty@example.edu', 'ChangeMe123!', 'FACULTY', 2, 'Prof. Rohan', 'Deshmukh', 'Assistant Professor', '2222222222', 1),
(9, 'meera.faculty@example.edu', 'ChangeMe123!', 'FACULTY', 4, 'Prof. Meera', 'Iyer', 'Assistant Professor', '1111111111', 1);

UPDATE profiles SET password_hash = 'ChangeMe123!' WHERE id IN ('1', '2', '4', '5', '6', '7', '8', '9');

INSERT OR IGNORE INTO academic_years (id, name, starts_on, ends_on, is_active)
VALUES (1, '2026-27', '2026-07-01', '2027-06-30', 1);

INSERT OR IGNORE INTO semesters (id, department_id, academic_year_id, number, title, ordinance)
VALUES (1, 1, 1, 3, 'Semester III', '');

INSERT OR IGNORE INTO curriculum_templates (id, department_id, name, html_template, css, is_active)
VALUES (1, 1, 'Official University Template', 'templates/pdf/curriculum_book.html', '/* CANONICAL CSS */', 1);

-- New Course: Big Data Analytics
INSERT INTO courses (id, semester_id, faculty_user_id, code, title, course_type, status, lecture_hours, tutorial_hours, practical_hours, self_learning_hours, credits, internal_marks, external_marks, objectives, pre_requisites, syllabus_intro)
VALUES (1, 1, 8, '25PEC13CE14', 'Big Data Analytics', 'THEORY', 'DRAFT', 2, 0, 2, 2, 3, 50, 50, 'Provide fundamental knowledge of Big Data, Hadoop, NoSQL, Stream Mining, and Analytics with R.', '25PCC12CE08, 25VSE11CE02', 'This course introduces modern big data storage, processing, and analytical ecosystems.');

-- Course Outcomes
INSERT INTO course_outcomes (id, course_id, code, description, bloom_level, sort_order)
VALUES 
(1, 1, 'CO1', 'Explain building blocks of Big Data Analytics.', 'Understand', 1),
(2, 1, 'CO2', 'Apply fundamental enabling techniques like Hadoop and MapReduce in solving real world problems.', 'Apply', 2),
(3, 1, 'CO3', 'Analyze different NoSQL systems with a given case study.', 'Analyze', 3),
(4, 1, 'CO4', 'Apply advanced techniques for emerging applications like stream analytics.', 'Apply', 4),
(5, 1, 'CO5', 'Apply adequate perspectives of big data analytics in various applications like recommender systems.', 'Apply', 5),
(6, 1, 'CO6', 'Apply statistical computing techniques and graphics for analyzing big data.', 'Apply', 6);

-- Modules & Topics
INSERT INTO modules (id, course_id, number, title, contact_hours, content) VALUES
(1, 1, 1, 'Introduction to Big Data and Hadoop', 4, 'Sources, characteristics, Hadoop core components, MapReduce.'),
(2, 1, 2, 'Big Data Storage and Processing', 4, 'HDFS, MapReduce Algorithms.'),
(3, 1, 3, 'NoSQL', 6, 'NoSQL Business Drivers, Architecture Patterns, variations.'),
(4, 1, 4, 'Mining Data Streams', 4, 'Stream Processing, Apache Kafka, Bloom Filters.'),
(5, 1, 5, 'Real-Time Big Data Models', 4, 'Recommendation Systems, Collaborative Filtering.'),
(6, 1, 6, 'Data Analytics with R', 4, 'R GUI, Scripts, Reading Datasets, plotting.');

-- Assessment Scheme
INSERT INTO assessment_schemes (id, course_id, component, marks, description, sort_order) VALUES
(1, 1, 'ISE', 20, 'Based on self-learning / formative assessment', 1),
(2, 1, 'MSE', 30, '90 minutes written examination based on 50% syllabus', 2),
(3, 1, 'ESE', 50, 'Written summative examination for 120 minutes', 3);

-- Reference Books
INSERT INTO reference_books (id, course_id, title, authors, publisher, edition, year, is_textbook, sort_order) VALUES
(1, 1, 'Mining of Massive Datasets', 'Anand Rajaraman and Jeff Ullman', 'Cambridge University Press', '1st', '2011', 0, 1),
(2, 1, 'Hadoop in Practice', 'Alex Holmes', 'Manning Press', '1st', '2012', 0, 2);
