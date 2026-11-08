-- =====================================================================
-- seed_ce_2025_scheme.sql
-- Seed data for Computer Engineering (CE) 2025-26 Scheme (REVISION FRCRCE-2-25)
-- Matching currirulum_SE_FrCRCE-1_CE_v5_AC_1_updated_21jun25-final (1).pdf
-- =====================================================================

UPDATE departments SET code = 'CE', name = 'Computer Engineering' WHERE id = '1' OR code = 'COMP';

-- 1. Insert/Update scheme
INSERT INTO curriculum_schemes (
  id, department_id, entering_year, scheme_year_code, status,
  created_by_user_id, created_at, updated_at
) VALUES (
  'sch-ce-2025',
  (SELECT id FROM departments WHERE code = 'CE' OR code = 'COMP' OR id = '1' LIMIT 1),
  '2025-26',
  '25',
  'active',
  (SELECT id FROM profiles WHERE role = 'HOD' LIMIT 1),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT(department_id, entering_year) DO UPDATE SET
  status = 'active',
  updated_at = CURRENT_TIMESTAMP;

-- 2. Insert 8 semesters for sch-ce-2025
INSERT OR REPLACE INTO semesters (id, scheme_id, department_id, academic_year_id, number, title, is_unlocked, unlocked_at, shell_completed_at)
VALUES
  ('sem-ce-2025-1', 'sch-ce-2025', (SELECT id FROM departments WHERE code = 'CE' OR code = 'COMP' OR id = '1' LIMIT 1), NULL, 1, 'Semester I',   1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sem-ce-2025-2', 'sch-ce-2025', (SELECT id FROM departments WHERE code = 'CE' OR code = 'COMP' OR id = '1' LIMIT 1), NULL, 2, 'Semester II',  1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sem-ce-2025-3', 'sch-ce-2025', (SELECT id FROM departments WHERE code = 'CE' OR code = 'COMP' OR id = '1' LIMIT 1), NULL, 3, 'Semester III', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sem-ce-2025-4', 'sch-ce-2025', (SELECT id FROM departments WHERE code = 'CE' OR code = 'COMP' OR id = '1' LIMIT 1), NULL, 4, 'Semester IV',  1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sem-ce-2025-5', 'sch-ce-2025', (SELECT id FROM departments WHERE code = 'CE' OR code = 'COMP' OR id = '1' LIMIT 1), NULL, 5, 'Semester V',   0, NULL, NULL),
  ('sem-ce-2025-6', 'sch-ce-2025', (SELECT id FROM departments WHERE code = 'CE' OR code = 'COMP' OR id = '1' LIMIT 1), NULL, 6, 'Semester VI',  0, NULL, NULL),
  ('sem-ce-2025-7', 'sch-ce-2025', (SELECT id FROM departments WHERE code = 'CE' OR code = 'COMP' OR id = '1' LIMIT 1), NULL, 7, 'Semester VII', 0, NULL, NULL),
  ('sem-ce-2025-8', 'sch-ce-2025', (SELECT id FROM departments WHERE code = 'CE' OR code = 'COMP' OR id = '1' LIMIT 1), NULL, 8, 'Semester VIII',0, NULL, NULL);

-- 3. Cleanup existing courses for sem 3 and 4
DELETE FROM courses WHERE semester_id IN ('sem-ce-2025-3', 'sem-ce-2025-4');

-- Course: 25BSC12CE05 - Discrete Mathematics and Graph Theory
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-bsc12ce05',
  'sem-ce-2025-3',
  '25BSC12CE05',
  0,
  'Discrete Mathematics and Graph Theory',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'BSESC',
  'BSC',
  2,
  2,
  0,
  0,
  2,
  2,
  0,
  0,
  2,
  40,
  60,
  'BSC11CE01, BSC11CE03',
  'Discrete Mathematics and Graph Theory develops advanced competencies in BSESC aligned with autonomous curriculum.',
  'Course syllabus for Discrete Mathematics and Graph Theory as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-bsc12ce05-th-0',
  'crs-ce25-bsc12ce05',
  'TH',
  2,
  20,
  30,
  20,
  30,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-bsc12ce05',
  'CO1',
  'Apply propositional and predicate logic to solve problems and represent mathematical statements',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-bsc12ce05',
  'CO2',
  'Apply algebraic structures of groups, rings, and lattices in the context of discrete mathematics',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-bsc12ce05',
  'CO3',
  'Solve problems with graph algorithms for traversal, shortest paths, and minimum spanning trees',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-bsc12ce05',
  'CO4',
  'Analyze the implications of different types of relations and functions in various mathematical and real - world contexts',
  'Analyze',
  4
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-bsc12ce05',
  'CO5',
  'Display a strong foundation to pursue advanced courses in graph theory, AI, and related disciplines.',
  'Evaluate',
  5
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-bsc12ce05',
  'CO6',
  'Apply statistics methods to solve real world problems.',
  'Create',
  6
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-bsc12ce05-1',
  'crs-ce25-bsc12ce05',
  1,
  'Fundamentals of Discrete Mathematics and Graph Theory',
  2,
  'In-depth analysis of fundamentals of discrete mathematics and graph theory, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-bsc12ce05-2',
  'crs-ce25-bsc12ce05',
  2,
  'Core Architecture and Techniques in Discrete Mathematics and Graph Theory',
  2,
  'In-depth analysis of core architecture and techniques in discrete mathematics and graph theory, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-bsc12ce05-3',
  'crs-ce25-bsc12ce05',
  3,
  'Methodologies and Analytical Models of Discrete Mathematics and Graph Theory',
  2,
  'In-depth analysis of methodologies and analytical models of discrete mathematics and graph theory, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-bsc12ce05-4',
  'crs-ce25-bsc12ce05',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-bsc12ce05-5',
  'crs-ce25-bsc12ce05',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-bsc12ce05', 'Principles of Discrete Mathematics and Graph Theory', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-bsc12ce05', 'Advanced Discrete Mathematics and Graph Theory: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-bsc12ce05', 'Discrete Mathematics and Graph Theory Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25PCC12CE05 - Computer Organization and Architecture
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-pcc12ce05',
  'sem-ce-2025-3',
  '25PCC12CE05',
  0,
  'Computer Organization and Architecture',
  'THEORY_LAB',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'PCPEC',
  'PCC',
  3,
  2,
  0,
  2,
  2,
  2,
  0,
  1,
  3,
  90,
  60,
  'PCC11CE03',
  'Computer Organization and Architecture develops advanced competencies in PCPEC aligned with autonomous curriculum.',
  'Course syllabus for Computer Organization and Architecture as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-pcc12ce05-th-0',
  'crs-ce25-pcc12ce05',
  'TH',
  2,
  20,
  30,
  20,
  30,
  100,
  2,
  1
);
INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-pcc12ce05-pr-1',
  'crs-ce25-pcc12ce05',
  'PR',
  2,
  20,
  NULL,
  NULL,
  NULL,
  50,
  1,
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce05',
  'CO1',
  'Describe the basic structure of computer and compare architecture models',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce05',
  'CO2',
  'Implement algorithms for arithmetic operations.',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce05',
  'CO3',
  'Design and analyze control units for microprocessors, considering 8086 architecture as the case study.',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce05',
  'CO4',
  'Classify different types of memory and implement various mapping techniques for Cache and virtual memory',
  'Analyze',
  4
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce05',
  'CO5',
  'Describe I/O organization and analyze different parallel processing and pipelining concepts.',
  'Evaluate',
  5
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce05',
  'CO6',
  'Examine emerging trends in computer architecture',
  'Create',
  6
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce05-1',
  'crs-ce25-pcc12ce05',
  1,
  'Fundamentals of Computer Organization and Architecture',
  2,
  'In-depth analysis of fundamentals of computer organization and architecture, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce05-2',
  'crs-ce25-pcc12ce05',
  2,
  'Core Architecture and Techniques in Computer Organization and Architecture',
  2,
  'In-depth analysis of core architecture and techniques in computer organization and architecture, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce05-3',
  'crs-ce25-pcc12ce05',
  3,
  'Methodologies and Analytical Models of Computer Organization and Architecture',
  2,
  'In-depth analysis of methodologies and analytical models of computer organization and architecture, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce05-4',
  'crs-ce25-pcc12ce05',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce05-5',
  'crs-ce25-pcc12ce05',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce05',
  1,
  'Computer Organization and Architecture Practical Experiment 1',
  'Design, implementation and validation of experiment 1 demonstrating computer organization and architecture concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce05',
  2,
  'Computer Organization and Architecture Practical Experiment 2',
  'Design, implementation and validation of experiment 2 demonstrating computer organization and architecture concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce05',
  3,
  'Computer Organization and Architecture Practical Experiment 3',
  'Design, implementation and validation of experiment 3 demonstrating computer organization and architecture concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce05',
  4,
  'Computer Organization and Architecture Practical Experiment 4',
  'Design, implementation and validation of experiment 4 demonstrating computer organization and architecture concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce05',
  5,
  'Computer Organization and Architecture Practical Experiment 5',
  'Design, implementation and validation of experiment 5 demonstrating computer organization and architecture concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce05',
  6,
  'Computer Organization and Architecture Practical Experiment 6',
  'Design, implementation and validation of experiment 6 demonstrating computer organization and architecture concepts.',
  2
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-pcc12ce05', 'Principles of Computer Organization and Architecture', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-pcc12ce05', 'Advanced Computer Organization and Architecture: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-pcc12ce05', 'Computer Organization and Architecture Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25PCC12CE06 - Data Structures
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-pcc12ce06',
  'sem-ce-2025-3',
  '25PCC12CE06',
  0,
  'Data Structures',
  'THEORY_LAB',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'PCPEC',
  'PCC',
  4,
  3,
  0,
  2,
  2,
  3,
  0,
  1,
  4,
  100,
  100,
  'ESC11CE03',
  'Data Structures develops advanced competencies in PCPEC aligned with autonomous curriculum.',
  'Course syllabus for Data Structures as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-pcc12ce06-th-0',
  'crs-ce25-pcc12ce06',
  'TH',
  3,
  20,
  50,
  20,
  50,
  150,
  3,
  1
);
INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-pcc12ce06-pr-1',
  'crs-ce25-pcc12ce06',
  'PR',
  2,
  20,
  NULL,
  NULL,
  NULL,
  50,
  1,
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce06',
  'CO1',
  'Implement various operations of linear data structures.',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce06',
  'CO2',
  'Implement various operations of non-linear data structures.',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce06',
  'CO3',
  'Implement appropriate searching and hashing techniques on a given problem',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce06',
  'CO4',
  'Apply appropriate data structure to solve different computing problems.',
  'Analyze',
  4
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce06-1',
  'crs-ce25-pcc12ce06',
  1,
  'Fundamentals of Data Structures',
  3,
  'In-depth analysis of fundamentals of data structures, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce06-2',
  'crs-ce25-pcc12ce06',
  2,
  'Core Architecture and Techniques in Data Structures',
  3,
  'In-depth analysis of core architecture and techniques in data structures, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce06-3',
  'crs-ce25-pcc12ce06',
  3,
  'Methodologies and Analytical Models of Data Structures',
  3,
  'In-depth analysis of methodologies and analytical models of data structures, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce06-4',
  'crs-ce25-pcc12ce06',
  4,
  'Advanced Implementation and System Integration',
  3,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce06-5',
  'crs-ce25-pcc12ce06',
  5,
  'Applications, Security and Industry Case Studies',
  3,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce06',
  1,
  'Data Structures Practical Experiment 1',
  'Design, implementation and validation of experiment 1 demonstrating data structures concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce06',
  2,
  'Data Structures Practical Experiment 2',
  'Design, implementation and validation of experiment 2 demonstrating data structures concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce06',
  3,
  'Data Structures Practical Experiment 3',
  'Design, implementation and validation of experiment 3 demonstrating data structures concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce06',
  4,
  'Data Structures Practical Experiment 4',
  'Design, implementation and validation of experiment 4 demonstrating data structures concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce06',
  5,
  'Data Structures Practical Experiment 5',
  'Design, implementation and validation of experiment 5 demonstrating data structures concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce06',
  6,
  'Data Structures Practical Experiment 6',
  'Design, implementation and validation of experiment 6 demonstrating data structures concepts.',
  2
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-pcc12ce06', 'Principles of Data Structures', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-pcc12ce06', 'Advanced Data Structures: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-pcc12ce06', 'Data Structures Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25PCC12CE07 - Object Oriented Programming with JAVA
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-pcc12ce07',
  'sem-ce-2025-3',
  '25PCC12CE07',
  0,
  'Object Oriented Programming with JAVA',
  'LAB',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'PCPEC',
  'PCC',
  1,
  0,
  0,
  2,
  2,
  0,
  0,
  1,
  1,
  50,
  0,
  'ESC11CE03',
  'Object Oriented Programming with JAVA develops advanced competencies in PCPEC aligned with autonomous curriculum.',
  'Course syllabus for Object Oriented Programming with JAVA as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-pcc12ce07-pr-0',
  'crs-ce25-pcc12ce07',
  'PR',
  2,
  20,
  NULL,
  NULL,
  NULL,
  50,
  1,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce07',
  'CO1',
  'Demonstrate Proficiency in Fundamentals of Java',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce07',
  'CO2',
  'Apply Object-Oriented Programming Principles',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce07',
  'CO3',
  'Explore multithreading, File I/O, and exception handling',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce07',
  'CO4',
  'Develop Real world Java Applications',
  'Analyze',
  4
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce07-1',
  'crs-ce25-pcc12ce07',
  1,
  'Fundamentals of Object Oriented Programming with JAVA',
  4,
  'In-depth analysis of fundamentals of object oriented programming with java, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce07-2',
  'crs-ce25-pcc12ce07',
  2,
  'Core Architecture and Techniques in Object Oriented Programming with JAVA',
  4,
  'In-depth analysis of core architecture and techniques in object oriented programming with java, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce07-3',
  'crs-ce25-pcc12ce07',
  3,
  'Methodologies and Analytical Models of Object Oriented Programming with JAVA',
  4,
  'In-depth analysis of methodologies and analytical models of object oriented programming with java, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce07-4',
  'crs-ce25-pcc12ce07',
  4,
  'Advanced Implementation and System Integration',
  4,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce07-5',
  'crs-ce25-pcc12ce07',
  5,
  'Applications, Security and Industry Case Studies',
  4,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce07',
  1,
  'Object Oriented Programming with JAVA Practical Experiment 1',
  'Design, implementation and validation of experiment 1 demonstrating object oriented programming with java concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce07',
  2,
  'Object Oriented Programming with JAVA Practical Experiment 2',
  'Design, implementation and validation of experiment 2 demonstrating object oriented programming with java concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce07',
  3,
  'Object Oriented Programming with JAVA Practical Experiment 3',
  'Design, implementation and validation of experiment 3 demonstrating object oriented programming with java concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce07',
  4,
  'Object Oriented Programming with JAVA Practical Experiment 4',
  'Design, implementation and validation of experiment 4 demonstrating object oriented programming with java concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce07',
  5,
  'Object Oriented Programming with JAVA Practical Experiment 5',
  'Design, implementation and validation of experiment 5 demonstrating object oriented programming with java concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce07',
  6,
  'Object Oriented Programming with JAVA Practical Experiment 6',
  'Design, implementation and validation of experiment 6 demonstrating object oriented programming with java concepts.',
  2
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-pcc12ce07', 'Principles of Object Oriented Programming with JAVA', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-pcc12ce07', 'Advanced Object Oriented Programming with JAVA: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-pcc12ce07', 'Object Oriented Programming with JAVA Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25OE13CE11 - Law for Engineers
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-oe13ce11',
  'sem-ce-2025-3',
  '25OE13CE11',
  0,
  'Law for Engineers',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'MDC',
  'OE',
  2,
  2,
  0,
  0,
  2,
  2,
  0,
  0,
  2,
  100,
  50,
  'Nil',
  'Law for Engineers develops advanced competencies in MDC aligned with autonomous curriculum.',
  'Course syllabus for Law for Engineers as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-oe13ce11-th-0',
  'crs-ce25-oe13ce11',
  'TH',
  2,
  50,
  NULL,
  NULL,
  NULL,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-oe13ce11',
  'CO1',
  'To demonstrate awareness of basic structure of Indian Legal System',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-oe13ce11',
  'CO2',
  'To demonstrate awareness of principles of contract',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-oe13ce11',
  'CO3',
  'To demonstrate awareness of legal aspects related to establishment of factory and various legislations related to employees, labours, and workmen‟s welfare',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-oe13ce11',
  'CO4',
  'To demonstrate awareness about right ot information, intellectual creations from infringement and laws related to energy, food and environment',
  'Analyze',
  4
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce11-1',
  'crs-ce25-oe13ce11',
  1,
  'Fundamentals of Law for Engineers',
  2,
  'In-depth analysis of fundamentals of law for engineers, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce11-2',
  'crs-ce25-oe13ce11',
  2,
  'Core Architecture and Techniques in Law for Engineers',
  2,
  'In-depth analysis of core architecture and techniques in law for engineers, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce11-3',
  'crs-ce25-oe13ce11',
  3,
  'Methodologies and Analytical Models of Law for Engineers',
  2,
  'In-depth analysis of methodologies and analytical models of law for engineers, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce11-4',
  'crs-ce25-oe13ce11',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce11-5',
  'crs-ce25-oe13ce11',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-oe13ce11', 'Principles of Law for Engineers', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-oe13ce11', 'Advanced Law for Engineers: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-oe13ce11', 'Law for Engineers Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25OE13CE12 - Financial Planning, Taxation and Investment
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-oe13ce12',
  'sem-ce-2025-3',
  '25OE13CE12',
  0,
  'Financial Planning, Taxation and Investment',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'MDC',
  'OE',
  2,
  2,
  0,
  0,
  2,
  2,
  0,
  0,
  2,
  100,
  50,
  'Nil',
  'Financial Planning, Taxation and Investment develops advanced competencies in MDC aligned with autonomous curriculum.',
  'Course syllabus for Financial Planning, Taxation and Investment as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-oe13ce12-th-0',
  'crs-ce25-oe13ce12',
  'TH',
  2,
  50,
  NULL,
  NULL,
  NULL,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-oe13ce12',
  'CO1',
  'To prepare financial plan by understanding owns need',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-oe13ce12',
  'CO2',
  'To demonstration awareness of taxation policies and show respect towards government norms and regulations',
  'Understand',
  2
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce12-1',
  'crs-ce25-oe13ce12',
  1,
  'Fundamentals of Financial Planning, Taxation and Investment',
  2,
  'In-depth analysis of fundamentals of financial planning, taxation and investment, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce12-2',
  'crs-ce25-oe13ce12',
  2,
  'Core Architecture and Techniques in Financial Planning, Taxation and Investment',
  2,
  'In-depth analysis of core architecture and techniques in financial planning, taxation and investment, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce12-3',
  'crs-ce25-oe13ce12',
  3,
  'Methodologies and Analytical Models of Financial Planning, Taxation and Investment',
  2,
  'In-depth analysis of methodologies and analytical models of financial planning, taxation and investment, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce12-4',
  'crs-ce25-oe13ce12',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce12-5',
  'crs-ce25-oe13ce12',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-oe13ce12', 'Principles of Financial Planning, Taxation and Investment', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-oe13ce12', 'Advanced Financial Planning, Taxation and Investment: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-oe13ce12', 'Financial Planning, Taxation and Investment Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25MDMXX1 - MDM Course - 1
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-mdmxx1',
  'sem-ce-2025-3',
  '25MDMXX1',
  0,
  'MDM Course - 1',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'MDC',
  'MDM',
  2,
  2,
  0,
  0,
  2,
  2,
  0,
  0,
  2,
  40,
  60,
  'Nil',
  'MDM Course - 1 develops advanced competencies in MDC aligned with autonomous curriculum.',
  'Course syllabus for MDM Course - 1 as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-mdmxx1-th-0',
  'crs-ce25-mdmxx1',
  'TH',
  2,
  20,
  30,
  20,
  30,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-mdmxx1',
  'CO1',
  'To demonstrate awareness of basic structure of Indian Legal System',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-mdmxx1',
  'CO2',
  'To demonstrate awareness of principles of contract',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-mdmxx1',
  'CO3',
  'To demonstrate awareness of legal aspects related to establishment of factory and various legislations related to employees, labours, and workmen‟s welfare',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-mdmxx1',
  'CO4',
  'To demonstrate awareness about right ot information, intellectual creations from infringement and laws related to energy, food and environment',
  'Analyze',
  4
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-mdmxx1-1',
  'crs-ce25-mdmxx1',
  1,
  'Fundamentals of MDM Course - 1',
  2,
  'In-depth analysis of fundamentals of mdm course - 1, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-mdmxx1-2',
  'crs-ce25-mdmxx1',
  2,
  'Core Architecture and Techniques in MDM Course - 1',
  2,
  'In-depth analysis of core architecture and techniques in mdm course - 1, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-mdmxx1-3',
  'crs-ce25-mdmxx1',
  3,
  'Methodologies and Analytical Models of MDM Course - 1',
  2,
  'In-depth analysis of methodologies and analytical models of mdm course - 1, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-mdmxx1-4',
  'crs-ce25-mdmxx1',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-mdmxx1-5',
  'crs-ce25-mdmxx1',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-mdmxx1', 'Principles of MDM Course - 1', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-mdmxx1', 'Advanced MDM Course - 1: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-mdmxx1', 'MDM Course - 1 Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25MDMXX2 - MDM Course - 2
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-mdmxx2',
  'sem-ce-2025-3',
  '25MDMXX2',
  0,
  'MDM Course - 2',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'MDC',
  'MDM',
  2,
  2,
  0,
  0,
  2,
  2,
  0,
  0,
  2,
  40,
  60,
  'Nil',
  'MDM Course - 2 develops advanced competencies in MDC aligned with autonomous curriculum.',
  'Course syllabus for MDM Course - 2 as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-mdmxx2-th-0',
  'crs-ce25-mdmxx2',
  'TH',
  2,
  20,
  30,
  20,
  30,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-mdmxx2',
  'CO1',
  'To demonstrate awareness of basic structure of Indian Legal System',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-mdmxx2',
  'CO2',
  'To demonstrate awareness of principles of contract',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-mdmxx2',
  'CO3',
  'To demonstrate awareness of legal aspects related to establishment of factory and various legislations related to employees, labours, and workmen‟s welfare',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-mdmxx2',
  'CO4',
  'To demonstrate awareness about right ot information, intellectual creations from infringement and laws related to energy, food and environment',
  'Analyze',
  4
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-mdmxx2-1',
  'crs-ce25-mdmxx2',
  1,
  'Fundamentals of MDM Course - 2',
  2,
  'In-depth analysis of fundamentals of mdm course - 2, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-mdmxx2-2',
  'crs-ce25-mdmxx2',
  2,
  'Core Architecture and Techniques in MDM Course - 2',
  2,
  'In-depth analysis of core architecture and techniques in mdm course - 2, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-mdmxx2-3',
  'crs-ce25-mdmxx2',
  3,
  'Methodologies and Analytical Models of MDM Course - 2',
  2,
  'In-depth analysis of methodologies and analytical models of mdm course - 2, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-mdmxx2-4',
  'crs-ce25-mdmxx2',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-mdmxx2-5',
  'crs-ce25-mdmxx2',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-mdmxx2', 'Principles of MDM Course - 2', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-mdmxx2', 'Advanced MDM Course - 2: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-mdmxx2', 'MDM Course - 2 Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25AEC12CE021 - Sanskrit for Beginners
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-aec12ce021',
  'sem-ce-2025-3',
  '25AEC12CE021',
  0,
  'Sanskrit for Beginners',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'HSSM',
  'AEC',
  2,
  2,
  0,
  0,
  2,
  2,
  0,
  0,
  2,
  100,
  50,
  'Nil',
  'Sanskrit for Beginners develops advanced competencies in HSSM aligned with autonomous curriculum.',
  'Course syllabus for Sanskrit for Beginners as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-aec12ce021-th-0',
  'crs-ce25-aec12ce021',
  'TH',
  2,
  50,
  NULL,
  NULL,
  NULL,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-aec12ce021',
  'CO1',
  'Demonstrate understanding of the Fundamentals of Sanskrit Language',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-aec12ce021',
  'CO2',
  'Apply Vocabulary and grammar skills for day-to-day conversation',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-aec12ce021',
  'CO3',
  'Developing Speaking and Learning skills',
  'Apply',
  3
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce021-1',
  'crs-ce25-aec12ce021',
  1,
  'Fundamentals of Sanskrit for Beginners',
  2,
  'In-depth analysis of fundamentals of sanskrit for beginners, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce021-2',
  'crs-ce25-aec12ce021',
  2,
  'Core Architecture and Techniques in Sanskrit for Beginners',
  2,
  'In-depth analysis of core architecture and techniques in sanskrit for beginners, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce021-3',
  'crs-ce25-aec12ce021',
  3,
  'Methodologies and Analytical Models of Sanskrit for Beginners',
  2,
  'In-depth analysis of methodologies and analytical models of sanskrit for beginners, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce021-4',
  'crs-ce25-aec12ce021',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce021-5',
  'crs-ce25-aec12ce021',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-aec12ce021', 'Principles of Sanskrit for Beginners', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-aec12ce021', 'Advanced Sanskrit for Beginners: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-aec12ce021', 'Sanskrit for Beginners Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25AEC12CE022 - Tamil for Beginners
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-aec12ce022',
  'sem-ce-2025-3',
  '25AEC12CE022',
  0,
  'Tamil for Beginners',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'HSSM',
  'AEC',
  2,
  2,
  0,
  0,
  2,
  2,
  0,
  0,
  2,
  100,
  50,
  'Nil',
  'Tamil for Beginners develops advanced competencies in HSSM aligned with autonomous curriculum.',
  'Course syllabus for Tamil for Beginners as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-aec12ce022-th-0',
  'crs-ce25-aec12ce022',
  'TH',
  2,
  50,
  NULL,
  NULL,
  NULL,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-aec12ce022',
  'CO1',
  'Demonstrate understanding of the Fundamentals of Tamil Language',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-aec12ce022',
  'CO2',
  'Apply Vocabulary and grammar skills for day to day conversation',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-aec12ce022',
  'CO3',
  'Developing Speaking and Learning skills',
  'Apply',
  3
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce022-1',
  'crs-ce25-aec12ce022',
  1,
  'Fundamentals of Tamil for Beginners',
  2,
  'In-depth analysis of fundamentals of tamil for beginners, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce022-2',
  'crs-ce25-aec12ce022',
  2,
  'Core Architecture and Techniques in Tamil for Beginners',
  2,
  'In-depth analysis of core architecture and techniques in tamil for beginners, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce022-3',
  'crs-ce25-aec12ce022',
  3,
  'Methodologies and Analytical Models of Tamil for Beginners',
  2,
  'In-depth analysis of methodologies and analytical models of tamil for beginners, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce022-4',
  'crs-ce25-aec12ce022',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce022-5',
  'crs-ce25-aec12ce022',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-aec12ce022', 'Principles of Tamil for Beginners', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-aec12ce022', 'Advanced Tamil for Beginners: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-aec12ce022', 'Tamil for Beginners Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25AEC12CE023 - Kannada for Beginners
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-aec12ce023',
  'sem-ce-2025-3',
  '25AEC12CE023',
  0,
  'Kannada for Beginners',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'HSSM',
  'AEC',
  2,
  2,
  0,
  0,
  2,
  2,
  0,
  0,
  2,
  100,
  50,
  'Nil',
  'Kannada for Beginners develops advanced competencies in HSSM aligned with autonomous curriculum.',
  'Course syllabus for Kannada for Beginners as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-aec12ce023-th-0',
  'crs-ce25-aec12ce023',
  'TH',
  2,
  50,
  NULL,
  NULL,
  NULL,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-aec12ce023',
  'CO1',
  'Demonstrate understanding of the Fundamentals of Kannada Language',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-aec12ce023',
  'CO2',
  'Apply Vocabulary and Grammar skills for day to day conversation',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-aec12ce023',
  'CO3',
  'Developing Speaking and listening skills',
  'Apply',
  3
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce023-1',
  'crs-ce25-aec12ce023',
  1,
  'Fundamentals of Kannada for Beginners',
  2,
  'In-depth analysis of fundamentals of kannada for beginners, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce023-2',
  'crs-ce25-aec12ce023',
  2,
  'Core Architecture and Techniques in Kannada for Beginners',
  2,
  'In-depth analysis of core architecture and techniques in kannada for beginners, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce023-3',
  'crs-ce25-aec12ce023',
  3,
  'Methodologies and Analytical Models of Kannada for Beginners',
  2,
  'In-depth analysis of methodologies and analytical models of kannada for beginners, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce023-4',
  'crs-ce25-aec12ce023',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce023-5',
  'crs-ce25-aec12ce023',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-aec12ce023', 'Principles of Kannada for Beginners', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-aec12ce023', 'Advanced Kannada for Beginners: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-aec12ce023', 'Kannada for Beginners Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25AEC12CE024 - Telugu for Beginners
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-aec12ce024',
  'sem-ce-2025-3',
  '25AEC12CE024',
  0,
  'Telugu for Beginners',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'HSSM',
  'AEC',
  2,
  2,
  0,
  0,
  2,
  2,
  0,
  0,
  2,
  100,
  50,
  'Nil',
  'Telugu for Beginners develops advanced competencies in HSSM aligned with autonomous curriculum.',
  'Course syllabus for Telugu for Beginners as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-aec12ce024-th-0',
  'crs-ce25-aec12ce024',
  'TH',
  2,
  50,
  NULL,
  NULL,
  NULL,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-aec12ce024',
  'CO1',
  'Demonstrate understanding of the fundamentals of Telugu Language',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-aec12ce024',
  'CO2',
  'Apply vocabulary and grammar skills for day to day conversation',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-aec12ce024',
  'CO3',
  'Developing Speaking and Listening skills',
  'Apply',
  3
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce024-1',
  'crs-ce25-aec12ce024',
  1,
  'Fundamentals of Telugu for Beginners',
  2,
  'In-depth analysis of fundamentals of telugu for beginners, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce024-2',
  'crs-ce25-aec12ce024',
  2,
  'Core Architecture and Techniques in Telugu for Beginners',
  2,
  'In-depth analysis of core architecture and techniques in telugu for beginners, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce024-3',
  'crs-ce25-aec12ce024',
  3,
  'Methodologies and Analytical Models of Telugu for Beginners',
  2,
  'In-depth analysis of methodologies and analytical models of telugu for beginners, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce024-4',
  'crs-ce25-aec12ce024',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-aec12ce024-5',
  'crs-ce25-aec12ce024',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-aec12ce024', 'Principles of Telugu for Beginners', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-aec12ce024', 'Advanced Telugu for Beginners: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-aec12ce024', 'Telugu for Beginners Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25VEC12CE01 - Human Values and Professional Ethics
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-vec12ce01',
  'sem-ce-2025-3',
  '25VEC12CE01',
  0,
  'Human Values and Professional Ethics',
  'THEORY_LAB',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'HSSM',
  'VEC',
  2,
  1,
  0,
  2,
  2,
  1,
  0,
  1,
  2,
  100,
  50,
  'Nil',
  'Human Values and Professional Ethics develops advanced competencies in HSSM aligned with autonomous curriculum.',
  'Course syllabus for Human Values and Professional Ethics as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-vec12ce01-th-0',
  'crs-ce25-vec12ce01',
  'TH',
  1,
  50,
  NULL,
  NULL,
  NULL,
  100,
  1,
  1
);
INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-vec12ce01-pr-1',
  'crs-ce25-vec12ce01',
  'PR',
  2,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  1,
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-vec12ce01',
  'CO1',
  'Adhere to the core rights and shape one‟s values.',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-vec12ce01',
  'CO2',
  'Display the role and responsibility of Engineering professionals',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-vec12ce01',
  'CO3',
  'Holds moral and Ethical solutions to problems through case studies.',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-vec12ce01',
  'CO4',
  'Apply the knowledge of human values to contemporary ethical and global issues.',
  'Analyze',
  4
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-vec12ce01-1',
  'crs-ce25-vec12ce01',
  1,
  'Fundamentals of Human Values and Professional Ethics',
  2,
  'In-depth analysis of fundamentals of human values and professional ethics, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-vec12ce01-2',
  'crs-ce25-vec12ce01',
  2,
  'Core Architecture and Techniques in Human Values and Professional Ethics',
  2,
  'In-depth analysis of core architecture and techniques in human values and professional ethics, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-vec12ce01-3',
  'crs-ce25-vec12ce01',
  3,
  'Methodologies and Analytical Models of Human Values and Professional Ethics',
  2,
  'In-depth analysis of methodologies and analytical models of human values and professional ethics, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-vec12ce01-4',
  'crs-ce25-vec12ce01',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-vec12ce01-5',
  'crs-ce25-vec12ce01',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vec12ce01',
  1,
  'Human Values and Professional Ethics Practical Experiment 1',
  'Design, implementation and validation of experiment 1 demonstrating human values and professional ethics concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vec12ce01',
  2,
  'Human Values and Professional Ethics Practical Experiment 2',
  'Design, implementation and validation of experiment 2 demonstrating human values and professional ethics concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vec12ce01',
  3,
  'Human Values and Professional Ethics Practical Experiment 3',
  'Design, implementation and validation of experiment 3 demonstrating human values and professional ethics concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vec12ce01',
  4,
  'Human Values and Professional Ethics Practical Experiment 4',
  'Design, implementation and validation of experiment 4 demonstrating human values and professional ethics concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vec12ce01',
  5,
  'Human Values and Professional Ethics Practical Experiment 5',
  'Design, implementation and validation of experiment 5 demonstrating human values and professional ethics concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vec12ce01',
  6,
  'Human Values and Professional Ethics Practical Experiment 6',
  'Design, implementation and validation of experiment 6 demonstrating human values and professional ethics concepts.',
  2
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-vec12ce01', 'Principles of Human Values and Professional Ethics', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-vec12ce01', 'Advanced Human Values and Professional Ethics: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-vec12ce01', 'Human Values and Professional Ethics Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25CEP12CE01 - Community Engagement Project
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-cep12ce01',
  'sem-ce-2025-3',
  '25CEP12CE01',
  0,
  'Community Engagement Project',
  'PROJECT',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'EL',
  'CEFP',
  2,
  0,
  0,
  4,
  2,
  0,
  0,
  2,
  2,
  100,
  0,
  'Nil',
  'Community Engagement Project develops advanced competencies in EL aligned with autonomous curriculum.',
  'Course syllabus for Community Engagement Project as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-cep12ce01-pr-0',
  'crs-ce25-cep12ce01',
  'PR',
  4,
  50,
  NULL,
  NULL,
  NULL,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-cep12ce01',
  'CO1',
  'Identify and address community needs and challenges which help learners to develop problem-solving skills and creativity in finding innovative solutions.',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-cep12ce01',
  'CO2',
  'Enhance their cultural competence and ability to work effectively in multicultural settings',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-cep12ce01',
  'CO3',
  'Critically think on complex issues considering multiple view points',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-cep12ce01',
  'CO4',
  'Demonstrate collaboration, team work, civic engagement, empathy and compassion while engaging directly with community',
  'Analyze',
  4
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-cep12ce01-1',
  'crs-ce25-cep12ce01',
  1,
  'Fundamentals of Community Engagement Project',
  4,
  'In-depth analysis of fundamentals of community engagement project, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-cep12ce01-2',
  'crs-ce25-cep12ce01',
  2,
  'Core Architecture and Techniques in Community Engagement Project',
  4,
  'In-depth analysis of core architecture and techniques in community engagement project, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-cep12ce01-3',
  'crs-ce25-cep12ce01',
  3,
  'Methodologies and Analytical Models of Community Engagement Project',
  4,
  'In-depth analysis of methodologies and analytical models of community engagement project, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-cep12ce01-4',
  'crs-ce25-cep12ce01',
  4,
  'Advanced Implementation and System Integration',
  4,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-cep12ce01-5',
  'crs-ce25-cep12ce01',
  5,
  'Applications, Security and Industry Case Studies',
  4,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-cep12ce01',
  1,
  'Community Engagement Project Practical Experiment 1',
  'Design, implementation and validation of experiment 1 demonstrating community engagement project concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-cep12ce01',
  2,
  'Community Engagement Project Practical Experiment 2',
  'Design, implementation and validation of experiment 2 demonstrating community engagement project concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-cep12ce01',
  3,
  'Community Engagement Project Practical Experiment 3',
  'Design, implementation and validation of experiment 3 demonstrating community engagement project concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-cep12ce01',
  4,
  'Community Engagement Project Practical Experiment 4',
  'Design, implementation and validation of experiment 4 demonstrating community engagement project concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-cep12ce01',
  5,
  'Community Engagement Project Practical Experiment 5',
  'Design, implementation and validation of experiment 5 demonstrating community engagement project concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-cep12ce01',
  6,
  'Community Engagement Project Practical Experiment 6',
  'Design, implementation and validation of experiment 6 demonstrating community engagement project concepts.',
  2
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-cep12ce01', 'Principles of Community Engagement Project', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-cep12ce01', 'Advanced Community Engagement Project: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-cep12ce01', 'Community Engagement Project Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25DMX1 - Double Minor Course
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-dmx1',
  'sem-ce-2025-3',
  '25DMX1',
  0,
  'Double Minor Course',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'DM',
  'DM',
  4,
  2,
  2,
  0,
  2,
  2,
  2,
  0,
  4,
  90,
  60,
  'Nil',
  'Double Minor Course develops advanced competencies in DM aligned with autonomous curriculum.',
  'Course syllabus for Double Minor Course as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-dmx1-th-0',
  'crs-ce25-dmx1',
  'TH',
  2,
  20,
  30,
  20,
  30,
  100,
  2,
  1
);
INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-dmx1-tu-1',
  'crs-ce25-dmx1',
  'TU',
  2,
  20,
  NULL,
  NULL,
  NULL,
  50,
  2,
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-dmx1',
  'CO1',
  'Recognize the dynamic nature of emerging technologies and their evolving landscape.',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-dmx1',
  'CO2',
  'Demonstrate knowledge of the key characteristics and potential applications of emerging technologies.',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-dmx1',
  'CO3',
  'Identify the value, innovative solutions or applications for real-world challenges using emerging technologies',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-dmx1',
  'CO4',
  'Analyse the implications of emerging technologies on society, business, and various industries',
  'Analyze',
  4
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-dmx1',
  'CO5',
  'Identify various emerging technologies relevant to his/her discipline for personal and professional growth',
  'Evaluate',
  5
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-dmx1',
  'CO6',
  'Recognize the need for continuous learning to keep pace with technological advancements.',
  'Create',
  6
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-dmx1-1',
  'crs-ce25-dmx1',
  1,
  'Fundamentals of Double Minor Course',
  2,
  'In-depth analysis of fundamentals of double minor course, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-dmx1-2',
  'crs-ce25-dmx1',
  2,
  'Core Architecture and Techniques in Double Minor Course',
  2,
  'In-depth analysis of core architecture and techniques in double minor course, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-dmx1-3',
  'crs-ce25-dmx1',
  3,
  'Methodologies and Analytical Models of Double Minor Course',
  2,
  'In-depth analysis of methodologies and analytical models of double minor course, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-dmx1-4',
  'crs-ce25-dmx1',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-dmx1-5',
  'crs-ce25-dmx1',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-dmx1', 'Principles of Double Minor Course', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-dmx1', 'Advanced Double Minor Course: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-dmx1', 'Double Minor Course Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25HR02 - Honors with Research
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-hr02',
  'sem-ce-2025-3',
  '25HR02',
  0,
  'Honors with Research',
  'LAB',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'HR',
  'HR',
  4,
  0,
  0,
  4,
  2,
  0,
  0,
  2,
  4,
  25,
  0,
  'Nil',
  'Honors with Research develops advanced competencies in HR aligned with autonomous curriculum.',
  'Course syllabus for Honors with Research as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-hr02-pr-0',
  'crs-ce25-hr02',
  'PR',
  4,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  4,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-hr02',
  'CO1',
  'Recognize the dynamic nature of emerging technologies and their evolving landscape.',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-hr02',
  'CO2',
  'Demonstrate knowledge of the key characteristics and potential applications of emerging technologies.',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-hr02',
  'CO3',
  'Identify the value, innovative solutions or applications for real-world challenges using emerging technologies',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-hr02',
  'CO4',
  'Analyse the implications of emerging technologies on society, business, and various industries',
  'Analyze',
  4
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-hr02',
  'CO5',
  'Identify various emerging technologies relevant to his/her discipline for personal and professional growth',
  'Evaluate',
  5
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-hr02',
  'CO6',
  'Recognize the need for continuous learning to keep pace with technological advancements.',
  'Create',
  6
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-hr02-1',
  'crs-ce25-hr02',
  1,
  'Fundamentals of Honors with Research',
  4,
  'In-depth analysis of fundamentals of honors with research, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-hr02-2',
  'crs-ce25-hr02',
  2,
  'Core Architecture and Techniques in Honors with Research',
  4,
  'In-depth analysis of core architecture and techniques in honors with research, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-hr02-3',
  'crs-ce25-hr02',
  3,
  'Methodologies and Analytical Models of Honors with Research',
  4,
  'In-depth analysis of methodologies and analytical models of honors with research, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-hr02-4',
  'crs-ce25-hr02',
  4,
  'Advanced Implementation and System Integration',
  4,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-hr02-5',
  'crs-ce25-hr02',
  5,
  'Applications, Security and Industry Case Studies',
  4,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-hr02',
  1,
  'Honors with Research Practical Experiment 1',
  'Design, implementation and validation of experiment 1 demonstrating honors with research concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-hr02',
  2,
  'Honors with Research Practical Experiment 2',
  'Design, implementation and validation of experiment 2 demonstrating honors with research concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-hr02',
  3,
  'Honors with Research Practical Experiment 3',
  'Design, implementation and validation of experiment 3 demonstrating honors with research concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-hr02',
  4,
  'Honors with Research Practical Experiment 4',
  'Design, implementation and validation of experiment 4 demonstrating honors with research concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-hr02',
  5,
  'Honors with Research Practical Experiment 5',
  'Design, implementation and validation of experiment 5 demonstrating honors with research concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-hr02',
  6,
  'Honors with Research Practical Experiment 6',
  'Design, implementation and validation of experiment 6 demonstrating honors with research concepts.',
  2
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-hr02', 'Principles of Honors with Research', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-hr02', 'Advanced Honors with Research: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-hr02', 'Honors with Research Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25HMM11CE01 - Introduction to Emerging Technologies
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-hmm11ce01',
  'sem-ce-2025-3',
  '25HMM11CE01',
  0,
  'Introduction to Emerging Technologies',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'DM/RM',
  'DM/RM',
  2,
  2,
  0,
  0,
  2,
  2,
  0,
  0,
  2,
  100,
  50,
  'Nil',
  'Introduction to Emerging Technologies develops advanced competencies in DM/RM aligned with autonomous curriculum.',
  'Course syllabus for Introduction to Emerging Technologies as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-hmm11ce01-th-0',
  'crs-ce25-hmm11ce01',
  'TH',
  2,
  50,
  NULL,
  NULL,
  NULL,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-hmm11ce01',
  'CO1',
  'Recognize the dynamic nature of emerging technologies and their evolving landscape.',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-hmm11ce01',
  'CO2',
  'Demonstrate knowledge of the key characteristics and potential applications of emerging technologies.',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-hmm11ce01',
  'CO3',
  'Identify the value, innovative solutions or applications for real-world challenges using emerging technologies',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-hmm11ce01',
  'CO4',
  'Analyse the implications of emerging technologies on society, business, and various industries',
  'Analyze',
  4
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-hmm11ce01',
  'CO5',
  'Identify various emerging technologies relevant to his/her discipline for personal and professional growth',
  'Evaluate',
  5
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-hmm11ce01',
  'CO6',
  'Recognize the need for continuous learning to keep pace with technological advancements.',
  'Create',
  6
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-hmm11ce01-1',
  'crs-ce25-hmm11ce01',
  1,
  'Fundamentals of Introduction to Emerging Technologies',
  2,
  'In-depth analysis of fundamentals of introduction to emerging technologies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-hmm11ce01-2',
  'crs-ce25-hmm11ce01',
  2,
  'Core Architecture and Techniques in Introduction to Emerging Technologies',
  2,
  'In-depth analysis of core architecture and techniques in introduction to emerging technologies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-hmm11ce01-3',
  'crs-ce25-hmm11ce01',
  3,
  'Methodologies and Analytical Models of Introduction to Emerging Technologies',
  2,
  'In-depth analysis of methodologies and analytical models of introduction to emerging technologies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-hmm11ce01-4',
  'crs-ce25-hmm11ce01',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-hmm11ce01-5',
  'crs-ce25-hmm11ce01',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-hmm11ce01', 'Principles of Introduction to Emerging Technologies', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-hmm11ce01', 'Advanced Introduction to Emerging Technologies: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-hmm11ce01', 'Introduction to Emerging Technologies Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25BSC12CE06 - Linear Algebra and Business Statistics
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-bsc12ce06',
  'sem-ce-2025-4',
  '25BSC12CE06',
  0,
  'Linear Algebra and Business Statistics',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'BSESC',
  'BSC',
  2,
  2,
  0,
  0,
  2,
  2,
  0,
  0,
  2,
  40,
  60,
  'BSC11CE01, BSC11CE03',
  'Linear Algebra and Business Statistics develops advanced competencies in BSESC aligned with autonomous curriculum.',
  'Course syllabus for Linear Algebra and Business Statistics as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-bsc12ce06-th-0',
  'crs-ce25-bsc12ce06',
  'TH',
  2,
  20,
  30,
  20,
  30,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-bsc12ce06',
  'CO1',
  'Demonstrate basic knowledge about the vector spaces as an algebraic structure.',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-bsc12ce06',
  'CO2',
  'Able to optimize the given function using linear programming problems',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-bsc12ce06',
  'CO3',
  'Able to optimize the given function using non-linear programming problems',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-bsc12ce06',
  'CO4',
  'Apply the concept of Correlation and Regression to engineering problems in data science, machine learning, and AI. Theory:',
  'Analyze',
  4
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-bsc12ce06-1',
  'crs-ce25-bsc12ce06',
  1,
  'Fundamentals of Linear Algebra and Business Statistics',
  2,
  'In-depth analysis of fundamentals of linear algebra and business statistics, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-bsc12ce06-2',
  'crs-ce25-bsc12ce06',
  2,
  'Core Architecture and Techniques in Linear Algebra and Business Statistics',
  2,
  'In-depth analysis of core architecture and techniques in linear algebra and business statistics, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-bsc12ce06-3',
  'crs-ce25-bsc12ce06',
  3,
  'Methodologies and Analytical Models of Linear Algebra and Business Statistics',
  2,
  'In-depth analysis of methodologies and analytical models of linear algebra and business statistics, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-bsc12ce06-4',
  'crs-ce25-bsc12ce06',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-bsc12ce06-5',
  'crs-ce25-bsc12ce06',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-bsc12ce06', 'Principles of Linear Algebra and Business Statistics', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-bsc12ce06', 'Advanced Linear Algebra and Business Statistics: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-bsc12ce06', 'Linear Algebra and Business Statistics Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25PCC12CE08 - Database Management Systems
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-pcc12ce08',
  'sem-ce-2025-4',
  '25PCC12CE08',
  0,
  'Database Management Systems',
  'THEORY_LAB',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'PCPEC',
  'PCC',
  3,
  2,
  0,
  2,
  2,
  2,
  0,
  1,
  3,
  90,
  60,
  'PCC12CE06',
  'Database Management Systems develops advanced competencies in PCPEC aligned with autonomous curriculum.',
  'Course syllabus for Database Management Systems as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-pcc12ce08-th-0',
  'crs-ce25-pcc12ce08',
  'TH',
  2,
  20,
  30,
  20,
  30,
  100,
  2,
  1
);
INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-pcc12ce08-pr-1',
  'crs-ce25-pcc12ce08',
  'PR',
  2,
  20,
  NULL,
  NULL,
  NULL,
  50,
  1,
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce08',
  'CO1',
  'Describe various components of DBMS',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce08',
  'CO2',
  'Design ER/EER Model for real life applications and convert it into relational model',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce08',
  'CO3',
  'Apply Relational Algebra operation on a given schema',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce08',
  'CO4',
  'Demonstrate SQL commands for a given task',
  'Analyze',
  4
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce08',
  'CO5',
  'Apply normalization to database design to remove redundancies',
  'Evaluate',
  5
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce08',
  'CO6',
  'Describe concurrency control mechanism to achieve Serializability and deadlock Handling',
  'Create',
  6
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce08-1',
  'crs-ce25-pcc12ce08',
  1,
  'Fundamentals of Database Management Systems',
  2,
  'In-depth analysis of fundamentals of database management systems, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce08-2',
  'crs-ce25-pcc12ce08',
  2,
  'Core Architecture and Techniques in Database Management Systems',
  2,
  'In-depth analysis of core architecture and techniques in database management systems, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce08-3',
  'crs-ce25-pcc12ce08',
  3,
  'Methodologies and Analytical Models of Database Management Systems',
  2,
  'In-depth analysis of methodologies and analytical models of database management systems, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce08-4',
  'crs-ce25-pcc12ce08',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce08-5',
  'crs-ce25-pcc12ce08',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce08',
  1,
  'Database Management Systems Practical Experiment 1',
  'Design, implementation and validation of experiment 1 demonstrating database management systems concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce08',
  2,
  'Database Management Systems Practical Experiment 2',
  'Design, implementation and validation of experiment 2 demonstrating database management systems concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce08',
  3,
  'Database Management Systems Practical Experiment 3',
  'Design, implementation and validation of experiment 3 demonstrating database management systems concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce08',
  4,
  'Database Management Systems Practical Experiment 4',
  'Design, implementation and validation of experiment 4 demonstrating database management systems concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce08',
  5,
  'Database Management Systems Practical Experiment 5',
  'Design, implementation and validation of experiment 5 demonstrating database management systems concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce08',
  6,
  'Database Management Systems Practical Experiment 6',
  'Design, implementation and validation of experiment 6 demonstrating database management systems concepts.',
  2
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-pcc12ce08', 'Principles of Database Management Systems', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-pcc12ce08', 'Advanced Database Management Systems: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-pcc12ce08', 'Database Management Systems Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25PCC12CE09 - Analysis of Algorithm
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-pcc12ce09',
  'sem-ce-2025-4',
  '25PCC12CE09',
  0,
  'Analysis of Algorithm',
  'THEORY_LAB',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'PCPEC',
  'PCC',
  4,
  3,
  0,
  2,
  2,
  3,
  0,
  1,
  4,
  100,
  100,
  'PCC12CE06',
  'Analysis of Algorithm develops advanced competencies in PCPEC aligned with autonomous curriculum.',
  'Course syllabus for Analysis of Algorithm as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-pcc12ce09-th-0',
  'crs-ce25-pcc12ce09',
  'TH',
  3,
  20,
  50,
  20,
  50,
  150,
  3,
  1
);
INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-pcc12ce09-pr-1',
  'crs-ce25-pcc12ce09',
  'PR',
  2,
  20,
  NULL,
  NULL,
  NULL,
  50,
  1,
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce09',
  'CO1',
  'Analyze the time and space complexity of algorithms.',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce09',
  'CO2',
  'Apply divide and conquer strategy to solve problems.',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce09',
  'CO3',
  'Apply greedy strategy to solve optimization problems.',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce09',
  'CO4',
  'Apply dynamic programming strategy to solve optimization problems.',
  'Analyze',
  4
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce09',
  'CO5',
  'Apply backtracking and branch and bound strategies to solve problems.',
  'Evaluate',
  5
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce09',
  'CO6',
  'Implement various string-matching algorithms to solve pattern matching problems',
  'Create',
  6
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce09-1',
  'crs-ce25-pcc12ce09',
  1,
  'Fundamentals of Analysis of Algorithm',
  3,
  'In-depth analysis of fundamentals of analysis of algorithm, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce09-2',
  'crs-ce25-pcc12ce09',
  2,
  'Core Architecture and Techniques in Analysis of Algorithm',
  3,
  'In-depth analysis of core architecture and techniques in analysis of algorithm, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce09-3',
  'crs-ce25-pcc12ce09',
  3,
  'Methodologies and Analytical Models of Analysis of Algorithm',
  3,
  'In-depth analysis of methodologies and analytical models of analysis of algorithm, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce09-4',
  'crs-ce25-pcc12ce09',
  4,
  'Advanced Implementation and System Integration',
  3,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce09-5',
  'crs-ce25-pcc12ce09',
  5,
  'Applications, Security and Industry Case Studies',
  3,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce09',
  1,
  'Analysis of Algorithm Practical Experiment 1',
  'Design, implementation and validation of experiment 1 demonstrating analysis of algorithm concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce09',
  2,
  'Analysis of Algorithm Practical Experiment 2',
  'Design, implementation and validation of experiment 2 demonstrating analysis of algorithm concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce09',
  3,
  'Analysis of Algorithm Practical Experiment 3',
  'Design, implementation and validation of experiment 3 demonstrating analysis of algorithm concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce09',
  4,
  'Analysis of Algorithm Practical Experiment 4',
  'Design, implementation and validation of experiment 4 demonstrating analysis of algorithm concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce09',
  5,
  'Analysis of Algorithm Practical Experiment 5',
  'Design, implementation and validation of experiment 5 demonstrating analysis of algorithm concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce09',
  6,
  'Analysis of Algorithm Practical Experiment 6',
  'Design, implementation and validation of experiment 6 demonstrating analysis of algorithm concepts.',
  2
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-pcc12ce09', 'Principles of Analysis of Algorithm', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-pcc12ce09', 'Advanced Analysis of Algorithm: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-pcc12ce09', 'Analysis of Algorithm Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25PCC12CE010 - Operating Systems
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-pcc12ce010',
  'sem-ce-2025-4',
  '25PCC12CE010',
  0,
  'Operating Systems',
  'THEORY_LAB',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'PCPEC',
  'PCC',
  3,
  2,
  0,
  2,
  2,
  2,
  0,
  1,
  3,
  90,
  60,
  'PCC12CE05',
  'Operating Systems develops advanced competencies in PCPEC aligned with autonomous curriculum.',
  'Course syllabus for Operating Systems as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-pcc12ce010-th-0',
  'crs-ce25-pcc12ce010',
  'TH',
  2,
  20,
  30,
  20,
  30,
  100,
  2,
  1
);
INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-pcc12ce010-pr-1',
  'crs-ce25-pcc12ce010',
  'PR',
  2,
  20,
  NULL,
  NULL,
  NULL,
  50,
  1,
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce010',
  'CO1',
  'Describe the architecture and functioning of operating systems.',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce010',
  'CO2',
  'Evaluate process scheduling algorithms for efficiency and performance optimization.',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce010',
  'CO3',
  'Apply concurrency and synchronization techniques in software development.',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce010',
  'CO4',
  'Implement and analyze algorithms for memory management and file systems to enhance resource utilization and system performance.',
  'Analyze',
  4
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-pcc12ce010',
  'CO5',
  'Analyze advanced operating system architectures and functionalities through case studies of modern systems',
  'Evaluate',
  5
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce010-1',
  'crs-ce25-pcc12ce010',
  1,
  'Fundamentals of Operating Systems',
  2,
  'In-depth analysis of fundamentals of operating systems, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce010-2',
  'crs-ce25-pcc12ce010',
  2,
  'Core Architecture and Techniques in Operating Systems',
  2,
  'In-depth analysis of core architecture and techniques in operating systems, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce010-3',
  'crs-ce25-pcc12ce010',
  3,
  'Methodologies and Analytical Models of Operating Systems',
  2,
  'In-depth analysis of methodologies and analytical models of operating systems, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce010-4',
  'crs-ce25-pcc12ce010',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-pcc12ce010-5',
  'crs-ce25-pcc12ce010',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce010',
  1,
  'Operating Systems Practical Experiment 1',
  'Design, implementation and validation of experiment 1 demonstrating operating systems concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce010',
  2,
  'Operating Systems Practical Experiment 2',
  'Design, implementation and validation of experiment 2 demonstrating operating systems concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce010',
  3,
  'Operating Systems Practical Experiment 3',
  'Design, implementation and validation of experiment 3 demonstrating operating systems concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce010',
  4,
  'Operating Systems Practical Experiment 4',
  'Design, implementation and validation of experiment 4 demonstrating operating systems concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce010',
  5,
  'Operating Systems Practical Experiment 5',
  'Design, implementation and validation of experiment 5 demonstrating operating systems concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-pcc12ce010',
  6,
  'Operating Systems Practical Experiment 6',
  'Design, implementation and validation of experiment 6 demonstrating operating systems concepts.',
  2
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-pcc12ce010', 'Principles of Operating Systems', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-pcc12ce010', 'Advanced Operating Systems: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-pcc12ce010', 'Operating Systems Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25OE13CE21 - Emerging Technology and Law
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-oe13ce21',
  'sem-ce-2025-4',
  '25OE13CE21',
  0,
  'Emerging Technology and Law',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'MDC',
  'OE',
  2,
  2,
  0,
  0,
  2,
  2,
  0,
  0,
  2,
  100,
  50,
  'Nil',
  'Emerging Technology and Law develops advanced competencies in MDC aligned with autonomous curriculum.',
  'Course syllabus for Emerging Technology and Law as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-oe13ce21-th-0',
  'crs-ce25-oe13ce21',
  'TH',
  2,
  50,
  NULL,
  NULL,
  NULL,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-oe13ce21',
  'CO1',
  'To recognize the importance of legal technology domain',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-oe13ce21',
  'CO2',
  'To demonstrate awareness of the laws related to emerging technologies and legal implications of their work',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-oe13ce21',
  'CO3',
  'To demonstrate understanding of the impact of emerging/contemporary technologies on the legal ecosystem',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-oe13ce21',
  'CO4',
  'To demonstrate awareness about company laws, FEMA and few other important acts related to engineering design and consumer protection',
  'Analyze',
  4
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce21-1',
  'crs-ce25-oe13ce21',
  1,
  'Fundamentals of Emerging Technology and Law',
  2,
  'In-depth analysis of fundamentals of emerging technology and law, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce21-2',
  'crs-ce25-oe13ce21',
  2,
  'Core Architecture and Techniques in Emerging Technology and Law',
  2,
  'In-depth analysis of core architecture and techniques in emerging technology and law, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce21-3',
  'crs-ce25-oe13ce21',
  3,
  'Methodologies and Analytical Models of Emerging Technology and Law',
  2,
  'In-depth analysis of methodologies and analytical models of emerging technology and law, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce21-4',
  'crs-ce25-oe13ce21',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce21-5',
  'crs-ce25-oe13ce21',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-oe13ce21', 'Principles of Emerging Technology and Law', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-oe13ce21', 'Advanced Emerging Technology and Law: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-oe13ce21', 'Emerging Technology and Law Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25OE13CE22 - Principles of Management
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-oe13ce22',
  'sem-ce-2025-4',
  '25OE13CE22',
  0,
  'Principles of Management',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'MDC',
  'OE',
  2,
  2,
  0,
  0,
  2,
  2,
  0,
  0,
  2,
  100,
  50,
  'Nil',
  'Principles of Management develops advanced competencies in MDC aligned with autonomous curriculum.',
  'Course syllabus for Principles of Management as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-oe13ce22-th-0',
  'crs-ce25-oe13ce22',
  'TH',
  2,
  50,
  NULL,
  NULL,
  NULL,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-oe13ce22',
  'CO1',
  'Understand the evolution of management theories and their relevance today',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-oe13ce22',
  'CO2',
  'Apply planning tools and techniques to real-world business scenarios',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-oe13ce22',
  'CO3',
  'Understand effective organizational structures based on business requirements',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-oe13ce22',
  'CO4',
  'Study different leadership styles and apply appropriate leadership techniques in various situations.',
  'Analyze',
  4
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-oe13ce22',
  'CO5',
  'Recognize ethical dilemmas in management and apply responsible decision-making frameworks.',
  'Evaluate',
  5
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-oe13ce22',
  'CO6',
  'Study critical thinking and problem-solving techniques to organizational issues.',
  'Create',
  6
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce22-1',
  'crs-ce25-oe13ce22',
  1,
  'Fundamentals of Principles of Management',
  2,
  'In-depth analysis of fundamentals of principles of management, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce22-2',
  'crs-ce25-oe13ce22',
  2,
  'Core Architecture and Techniques in Principles of Management',
  2,
  'In-depth analysis of core architecture and techniques in principles of management, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce22-3',
  'crs-ce25-oe13ce22',
  3,
  'Methodologies and Analytical Models of Principles of Management',
  2,
  'In-depth analysis of methodologies and analytical models of principles of management, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce22-4',
  'crs-ce25-oe13ce22',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-oe13ce22-5',
  'crs-ce25-oe13ce22',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-oe13ce22', 'Principles of Principles of Management', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-oe13ce22', 'Advanced Principles of Management: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-oe13ce22', 'Principles of Management Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25MDMXX3 - MDM Course - 3
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-mdmxx3',
  'sem-ce-2025-4',
  '25MDMXX3',
  0,
  'MDM Course - 3',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'MDC',
  'MDM',
  2,
  2,
  0,
  0,
  2,
  2,
  0,
  0,
  2,
  40,
  60,
  'Nil',
  'MDM Course - 3 develops advanced competencies in MDC aligned with autonomous curriculum.',
  'Course syllabus for MDM Course - 3 as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-mdmxx3-th-0',
  'crs-ce25-mdmxx3',
  'TH',
  2,
  20,
  30,
  20,
  30,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-mdmxx3',
  'CO1',
  'To recognize the importance of legal technology domain',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-mdmxx3',
  'CO2',
  'To demonstrate awareness of the laws related to emerging technologies and legal implications of their work',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-mdmxx3',
  'CO3',
  'To demonstrate understanding of the impact of emerging/contemporary technologies on the legal ecosystem',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-mdmxx3',
  'CO4',
  'To demonstrate awareness about company laws, FEMA and few other important acts related to engineering design and consumer protection',
  'Analyze',
  4
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-mdmxx3-1',
  'crs-ce25-mdmxx3',
  1,
  'Fundamentals of MDM Course - 3',
  2,
  'In-depth analysis of fundamentals of mdm course - 3, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-mdmxx3-2',
  'crs-ce25-mdmxx3',
  2,
  'Core Architecture and Techniques in MDM Course - 3',
  2,
  'In-depth analysis of core architecture and techniques in mdm course - 3, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-mdmxx3-3',
  'crs-ce25-mdmxx3',
  3,
  'Methodologies and Analytical Models of MDM Course - 3',
  2,
  'In-depth analysis of methodologies and analytical models of mdm course - 3, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-mdmxx3-4',
  'crs-ce25-mdmxx3',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-mdmxx3-5',
  'crs-ce25-mdmxx3',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-mdmxx3', 'Principles of MDM Course - 3', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-mdmxx3', 'Advanced MDM Course - 3: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-mdmxx3', 'MDM Course - 3 Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25VSE12CE03 - Full Stack Development
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-vse12ce03',
  'sem-ce-2025-4',
  '25VSE12CE03',
  0,
  'Full Stack Development',
  'LAB',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'SC',
  'VSEC',
  2,
  0,
  0,
  4,
  2,
  0,
  0,
  2,
  2,
  100,
  0,
  'PCC12CE07',
  'Full Stack Development develops advanced competencies in SC aligned with autonomous curriculum.',
  'Course syllabus for Full Stack Development as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-vse12ce03-pr-0',
  'crs-ce25-vse12ce03',
  'PR',
  4,
  50,
  NULL,
  NULL,
  NULL,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-vse12ce03',
  'CO1',
  'Demonstrate Foundational Understanding of Web Technologies',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-vse12ce03',
  'CO2',
  'Develop Proficiency in Frontend Development with React.js',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-vse12ce03',
  'CO3',
  'Develop Backend Development with Node.js and Express.js',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-vse12ce03',
  'CO4',
  'Integrate Full-Stack Application Development with MongoDB',
  'Analyze',
  4
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-vse12ce03',
  'CO5',
  'Deploy Web Applications using MERN Stack',
  'Evaluate',
  5
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-vse12ce03-1',
  'crs-ce25-vse12ce03',
  1,
  'Fundamentals of Full Stack Development',
  4,
  'In-depth analysis of fundamentals of full stack development, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-vse12ce03-2',
  'crs-ce25-vse12ce03',
  2,
  'Core Architecture and Techniques in Full Stack Development',
  4,
  'In-depth analysis of core architecture and techniques in full stack development, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-vse12ce03-3',
  'crs-ce25-vse12ce03',
  3,
  'Methodologies and Analytical Models of Full Stack Development',
  4,
  'In-depth analysis of methodologies and analytical models of full stack development, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-vse12ce03-4',
  'crs-ce25-vse12ce03',
  4,
  'Advanced Implementation and System Integration',
  4,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-vse12ce03-5',
  'crs-ce25-vse12ce03',
  5,
  'Applications, Security and Industry Case Studies',
  4,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vse12ce03',
  1,
  'Full Stack Development Practical Experiment 1',
  'Design, implementation and validation of experiment 1 demonstrating full stack development concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vse12ce03',
  2,
  'Full Stack Development Practical Experiment 2',
  'Design, implementation and validation of experiment 2 demonstrating full stack development concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vse12ce03',
  3,
  'Full Stack Development Practical Experiment 3',
  'Design, implementation and validation of experiment 3 demonstrating full stack development concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vse12ce03',
  4,
  'Full Stack Development Practical Experiment 4',
  'Design, implementation and validation of experiment 4 demonstrating full stack development concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vse12ce03',
  5,
  'Full Stack Development Practical Experiment 5',
  'Design, implementation and validation of experiment 5 demonstrating full stack development concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vse12ce03',
  6,
  'Full Stack Development Practical Experiment 6',
  'Design, implementation and validation of experiment 6 demonstrating full stack development concepts.',
  2
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-vse12ce03', 'Principles of Full Stack Development', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-vse12ce03', 'Advanced Full Stack Development: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-vse12ce03', 'Full Stack Development Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25EEM12CE02 - Technology Entrepreneurship
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-eem12ce02',
  'sem-ce-2025-4',
  '25EEM12CE02',
  0,
  'Technology Entrepreneurship',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'HSSM',
  'EEMC',
  2,
  2,
  0,
  0,
  2,
  2,
  0,
  0,
  2,
  100,
  50,
  'Nil',
  'Technology Entrepreneurship develops advanced competencies in HSSM aligned with autonomous curriculum.',
  'Course syllabus for Technology Entrepreneurship as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-eem12ce02-th-0',
  'crs-ce25-eem12ce02',
  'TH',
  2,
  50,
  NULL,
  NULL,
  NULL,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-eem12ce02',
  'CO1',
  'Identify problems worth solving',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-eem12ce02',
  'CO2',
  'Craft value proposition',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-eem12ce02',
  'CO3',
  'Prepare B-Plan',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-eem12ce02',
  'CO4',
  'Register virtual company',
  'Analyze',
  4
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-eem12ce02-1',
  'crs-ce25-eem12ce02',
  1,
  'Fundamentals of Technology Entrepreneurship',
  2,
  'In-depth analysis of fundamentals of technology entrepreneurship, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-eem12ce02-2',
  'crs-ce25-eem12ce02',
  2,
  'Core Architecture and Techniques in Technology Entrepreneurship',
  2,
  'In-depth analysis of core architecture and techniques in technology entrepreneurship, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-eem12ce02-3',
  'crs-ce25-eem12ce02',
  3,
  'Methodologies and Analytical Models of Technology Entrepreneurship',
  2,
  'In-depth analysis of methodologies and analytical models of technology entrepreneurship, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-eem12ce02-4',
  'crs-ce25-eem12ce02',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-eem12ce02-5',
  'crs-ce25-eem12ce02',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-eem12ce02', 'Principles of Technology Entrepreneurship', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-eem12ce02', 'Advanced Technology Entrepreneurship: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-eem12ce02', 'Technology Entrepreneurship Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25VEC12CE02 - Technology Innovation for Sustainable Development
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-vec12ce02',
  'sem-ce-2025-4',
  '25VEC12CE02',
  0,
  'Technology Innovation for Sustainable Development',
  'THEORY_LAB',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'HSSM',
  'VEC',
  2,
  1,
  0,
  2,
  2,
  1,
  0,
  1,
  2,
  100,
  50,
  'Nil',
  'Technology Innovation for Sustainable Development develops advanced competencies in HSSM aligned with autonomous curriculum.',
  'Course syllabus for Technology Innovation for Sustainable Development as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-vec12ce02-th-0',
  'crs-ce25-vec12ce02',
  'TH',
  1,
  40,
  NULL,
  NULL,
  NULL,
  100,
  1,
  1
);
INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-vec12ce02-pr-1',
  'crs-ce25-vec12ce02',
  'PR',
  2,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  1,
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-vec12ce02',
  'CO1',
  'Demonstrate a broad and coherent knowledge of United Nations Sustainable Development Goals (SDGs)',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-vec12ce02',
  'CO2',
  'Build the vocabulary and develop a nuanced understanding of the SDG themes: people, planet, prosperity, peace and partnership',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-vec12ce02',
  'CO3',
  'Identify technological solutions to address challenges of SDGs',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-vec12ce02',
  'CO4',
  'Build the vision to explain how to create a technological solution for sustainability',
  'Analyze',
  4
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-vec12ce02-1',
  'crs-ce25-vec12ce02',
  1,
  'Fundamentals of Technology Innovation for Sustainable Development',
  2,
  'In-depth analysis of fundamentals of technology innovation for sustainable development, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-vec12ce02-2',
  'crs-ce25-vec12ce02',
  2,
  'Core Architecture and Techniques in Technology Innovation for Sustainable Development',
  2,
  'In-depth analysis of core architecture and techniques in technology innovation for sustainable development, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-vec12ce02-3',
  'crs-ce25-vec12ce02',
  3,
  'Methodologies and Analytical Models of Technology Innovation for Sustainable Development',
  2,
  'In-depth analysis of methodologies and analytical models of technology innovation for sustainable development, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-vec12ce02-4',
  'crs-ce25-vec12ce02',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-vec12ce02-5',
  'crs-ce25-vec12ce02',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vec12ce02',
  1,
  'Technology Innovation for Sustainable Development Practical Experiment 1',
  'Design, implementation and validation of experiment 1 demonstrating technology innovation for sustainable development concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vec12ce02',
  2,
  'Technology Innovation for Sustainable Development Practical Experiment 2',
  'Design, implementation and validation of experiment 2 demonstrating technology innovation for sustainable development concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vec12ce02',
  3,
  'Technology Innovation for Sustainable Development Practical Experiment 3',
  'Design, implementation and validation of experiment 3 demonstrating technology innovation for sustainable development concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vec12ce02',
  4,
  'Technology Innovation for Sustainable Development Practical Experiment 4',
  'Design, implementation and validation of experiment 4 demonstrating technology innovation for sustainable development concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vec12ce02',
  5,
  'Technology Innovation for Sustainable Development Practical Experiment 5',
  'Design, implementation and validation of experiment 5 demonstrating technology innovation for sustainable development concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-vec12ce02',
  6,
  'Technology Innovation for Sustainable Development Practical Experiment 6',
  'Design, implementation and validation of experiment 6 demonstrating technology innovation for sustainable development concepts.',
  2
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-vec12ce02', 'Principles of Technology Innovation for Sustainable Development', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-vec12ce02', 'Advanced Technology Innovation for Sustainable Development: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-vec12ce02', 'Technology Innovation for Sustainable Development Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25DMX2 - Double Minor Course
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-dmx2',
  'sem-ce-2025-4',
  '25DMX2',
  0,
  'Double Minor Course',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'DM',
  'DM',
  4,
  2,
  2,
  0,
  2,
  2,
  2,
  0,
  4,
  90,
  60,
  'Nil',
  'Double Minor Course develops advanced competencies in DM aligned with autonomous curriculum.',
  'Course syllabus for Double Minor Course as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-dmx2-th-0',
  'crs-ce25-dmx2',
  'TH',
  2,
  20,
  30,
  20,
  30,
  100,
  2,
  1
);
INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-dmx2-tu-1',
  'crs-ce25-dmx2',
  'TU',
  2,
  20,
  NULL,
  NULL,
  NULL,
  50,
  2,
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-dmx2',
  'CO1',
  'Identify problems worth solving',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-dmx2',
  'CO2',
  'Craft value proposition',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-dmx2',
  'CO3',
  'Prepare B-Plan',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-dmx2',
  'CO4',
  'Register virtual company',
  'Analyze',
  4
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-dmx2-1',
  'crs-ce25-dmx2',
  1,
  'Fundamentals of Double Minor Course',
  2,
  'In-depth analysis of fundamentals of double minor course, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-dmx2-2',
  'crs-ce25-dmx2',
  2,
  'Core Architecture and Techniques in Double Minor Course',
  2,
  'In-depth analysis of core architecture and techniques in double minor course, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-dmx2-3',
  'crs-ce25-dmx2',
  3,
  'Methodologies and Analytical Models of Double Minor Course',
  2,
  'In-depth analysis of methodologies and analytical models of double minor course, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-dmx2-4',
  'crs-ce25-dmx2',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-dmx2-5',
  'crs-ce25-dmx2',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-dmx2', 'Principles of Double Minor Course', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-dmx2', 'Advanced Double Minor Course: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-dmx2', 'Double Minor Course Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: 25HR03 - Honors with Research
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-hr03',
  'sem-ce-2025-4',
  '25HR03',
  0,
  'Honors with Research',
  'LAB',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'HR',
  'HR',
  4,
  0,
  0,
  4,
  2,
  0,
  0,
  2,
  4,
  25,
  0,
  'Nil',
  'Honors with Research develops advanced competencies in HR aligned with autonomous curriculum.',
  'Course syllabus for Honors with Research as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-hr03-pr-0',
  'crs-ce25-hr03',
  'PR',
  4,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  4,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-hr03',
  'CO1',
  'Identify problems worth solving',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-hr03',
  'CO2',
  'Craft value proposition',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-hr03',
  'CO3',
  'Prepare B-Plan',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-hr03',
  'CO4',
  'Register virtual company',
  'Analyze',
  4
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-hr03-1',
  'crs-ce25-hr03',
  1,
  'Fundamentals of Honors with Research',
  4,
  'In-depth analysis of fundamentals of honors with research, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-hr03-2',
  'crs-ce25-hr03',
  2,
  'Core Architecture and Techniques in Honors with Research',
  4,
  'In-depth analysis of core architecture and techniques in honors with research, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-hr03-3',
  'crs-ce25-hr03',
  3,
  'Methodologies and Analytical Models of Honors with Research',
  4,
  'In-depth analysis of methodologies and analytical models of honors with research, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-hr03-4',
  'crs-ce25-hr03',
  4,
  'Advanced Implementation and System Integration',
  4,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-hr03-5',
  'crs-ce25-hr03',
  5,
  'Applications, Security and Industry Case Studies',
  4,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-hr03',
  1,
  'Honors with Research Practical Experiment 1',
  'Design, implementation and validation of experiment 1 demonstrating honors with research concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-hr03',
  2,
  'Honors with Research Practical Experiment 2',
  'Design, implementation and validation of experiment 2 demonstrating honors with research concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-hr03',
  3,
  'Honors with Research Practical Experiment 3',
  'Design, implementation and validation of experiment 3 demonstrating honors with research concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-hr03',
  4,
  'Honors with Research Practical Experiment 4',
  'Design, implementation and validation of experiment 4 demonstrating honors with research concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-hr03',
  5,
  'Honors with Research Practical Experiment 5',
  'Design, implementation and validation of experiment 5 demonstrating honors with research concepts.',
  2
);
INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  'crs-ce25-hr03',
  6,
  'Honors with Research Practical Experiment 6',
  'Design, implementation and validation of experiment 6 demonstrating honors with research concepts.',
  2
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-hr03', 'Principles of Honors with Research', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-hr03', 'Advanced Honors with Research: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-hr03', 'Honors with Research Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- Course: BC - MOOC
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  'crs-ce25-bc',
  'sem-ce-2025-4',
  'BC',
  0,
  'MOOC',
  'THEORY',
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  'BC',
  'BC',
  2,
  2,
  0,
  0,
  2,
  2,
  0,
  0,
  2,
  100,
  50,
  'Nil',
  'MOOC develops advanced competencies in BC aligned with autonomous curriculum.',
  'Course syllabus for MOOC as per FrCRCE Autonomous College regulations.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  'ctc-crs-ce25-bc-th-0',
  'crs-ce25-bc',
  'TH',
  2,
  50,
  NULL,
  NULL,
  NULL,
  100,
  2,
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-bc',
  'CO1',
  'Identify problems worth solving',
  'Remember',
  1
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-bc',
  'CO2',
  'Craft value proposition',
  'Understand',
  2
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-bc',
  'CO3',
  'Prepare B-Plan',
  'Apply',
  3
);
INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  'crs-ce25-bc',
  'CO4',
  'Register virtual company',
  'Analyze',
  4
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-bc-1',
  'crs-ce25-bc',
  1,
  'Fundamentals of MOOC',
  2,
  'In-depth analysis of fundamentals of mooc, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-bc-2',
  'crs-ce25-bc',
  2,
  'Core Architecture and Techniques in MOOC',
  2,
  'In-depth analysis of core architecture and techniques in mooc, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-bc-3',
  'crs-ce25-bc',
  3,
  'Methodologies and Analytical Models of MOOC',
  2,
  'In-depth analysis of methodologies and analytical models of mooc, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-bc-4',
  'crs-ce25-bc',
  4,
  'Advanced Implementation and System Integration',
  2,
  'In-depth analysis of advanced implementation and system integration, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  'mod-crs-ce25-bc-5',
  'crs-ce25-bc',
  5,
  'Applications, Security and Industry Case Studies',
  2,
  'In-depth analysis of applications, security and industry case studies, covering theory, principles, edge-cases and practical engineering problem solving.',
  '1, 2, 3'
);
INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ('crs-ce25-bc', 'Principles of MOOC', 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ('crs-ce25-bc', 'Advanced MOOC: Practice and Implementation', 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ('crs-ce25-bc', 'MOOC Laboratory and Application Handbook', 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);

-- 4. Seed Scheme Electives
DELETE FROM scheme_electives WHERE scheme_id = 'sch-ce-2025';

INSERT INTO scheme_electives (id, scheme_id, category, track_name, sem5_code, sem5_title, sem6_code, sem6_title, credits, sort_order, created_at, updated_at) VALUES
  ('el-tr-1', 'sch-ce-2025', 'TRACK', 'Block chain', '25PEC13CE11', 'Block chain Technology', '25PEC13CE21', 'Decentralized finance', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('el-tr-2', 'sch-ce-2025', 'TRACK', 'AIML', '25PEC13CE12', 'Deep Learning and Reinforcement Learning', '25PEC13CE22', 'LLM and GenAI', 3, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('el-tr-3', 'sch-ce-2025', 'TRACK', 'Security', '25PEC13CE13', 'Cyber Security', '25PEC13CE23', 'Digital Forensic', 3, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('el-tr-4', 'sch-ce-2025', 'TRACK', 'Data science', '25PEC13CE14', 'Big data analytics', '25PEC13CE24', 'Business Intelligence', 3, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('el-tr-5', 'sch-ce-2025', 'TRACK', 'ARVR', '25PEC13CE15', 'Computer Graphics', '25PEC13CE25', 'ARVR', 3, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('el-tr-6', 'sch-ce-2025', 'TRACK', 'UI', '25PEC13CE16', 'HMI', '25PEC13CE26', 'UX/UI Design', 3, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('el-tr-7', 'sch-ce-2025', 'TRACK', 'Computing', '25PEC13CE17', 'Geographical Information Systems', '25PEC13CE27', 'Quantum Computing', 3, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('el-tr-8', 'sch-ce-2025', 'TRACK', 'Networking', '25PEC13CE18', 'Computer Network', '25PEC13CE28', 'Advanced Network Communication', 3, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO scheme_electives (id, scheme_id, category, track_name, sem5_code, sem5_title, sem6_code, sem6_title, credits, sort_order, created_at, updated_at) VALUES
  ('el-lb-1', 'sch-ce-2025', 'LAB', '', '25PECL13CE11', 'Image processing Lab', '25PECL13CE21', 'Social Media Analytics Lab', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('el-lb-2', 'sch-ce-2025', 'LAB', '', '25PECL13CE12', 'Natural Language Processing Lab', '25PECL13CE22', 'Ethical Hacking Lab', 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('el-lb-3', 'sch-ce-2025', 'LAB', '', '25PECL13CE13', 'IIOT lab', '25PECL13CE23', 'Advance Java Lab', 1, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('el-lb-4', 'sch-ce-2025', 'LAB', '', '25PECL13CE14', 'Innovative Product Development Lab-Phase1 (Start-up)', '25PECL13CE24', 'Innovative Product Development Lab-Phase2 (Start-up)', 1, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('el-lb-5', 'sch-ce-2025', 'LAB', '', '25PECL13CE15', 'Open-Source Intelligence and Threat Intelligence lab', '25PECL13CE25', 'Explainable AI Lab', 1, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('el-lb-6', 'sch-ce-2025', 'LAB', '', '', '', '25PECL13CE26', 'Software testing and Quality Assurance', 1, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO scheme_electives (id, scheme_id, category, track_name, sem5_code, sem5_title, sem6_code, sem6_title, credits, sort_order, created_at, updated_at) VALUES
  ('el-aec-1', 'sch-ce-2025', 'AEC', '', '25AEC12CE021', 'Sanskrit for Beginners', '', '', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('el-aec-2', 'sch-ce-2025', 'AEC', '', '25AEC12CE022', 'Telugu for Beginners', '', '', 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('el-aec-3', 'sch-ce-2025', 'AEC', '', '25AEC12CE023', 'Kannada for Beginners', '', '', 2, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('el-aec-4', 'sch-ce-2025', 'AEC', '', '25AEC12CE024', 'Tamil for Beginners', '', '', 2, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
