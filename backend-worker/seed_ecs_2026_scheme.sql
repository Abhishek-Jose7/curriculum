-- =====================================================================
-- seed_ecs_2026_scheme.sql
-- Test fixture: Electronics and Computer Science (EC), 2026-27 scheme.
-- Source: FE_ECS_Syllabus_2026-27.pdf (uploaded), REVISION FRCRCE-3-26.
-- =====================================================================

-- Ensure profile usernames are set for lookup compatibility
UPDATE profiles SET username = 'hod_ecs' WHERE email = 'hod_ecs@example.edu' AND username IS NULL;
UPDATE profiles SET username = 'faculty' WHERE email = 'faculty@example.edu' AND username IS NULL;

-- ---------------------------------------------------------------------
-- 1. curriculum_schemes
-- ---------------------------------------------------------------------
INSERT INTO curriculum_schemes (
  id, department_id, entering_year, scheme_year_code, status,
  created_by_user_id, created_at, updated_at
) VALUES (
  'sch-ec-2026',
  (SELECT id FROM departments WHERE code = 'EC'),
  '2026-27',
  '26',
  'active',
  (SELECT id FROM profiles WHERE username = 'hod_ecs' OR email = 'hod_ecs@example.edu'),
  '2026-03-05T00:00:00Z',
  '2026-03-05T00:00:00Z'
);

-- ---------------------------------------------------------------------
-- 2. semesters — all 8, Sem 1-2 shelled + unlocked, Sem 3-8 empty/locked
-- ---------------------------------------------------------------------
INSERT INTO semesters (id, scheme_id, department_id, academic_year_id, number, title, is_unlocked, unlocked_at, shell_completed_at)
VALUES
  ('sem-ec-2026-1', 'sch-ec-2026', (SELECT id FROM departments WHERE code='EC'), (SELECT id FROM academic_years LIMIT 1), 1, 'Semester I',   1, '2026-03-10T00:00:00Z', '2026-03-09T00:00:00Z'),
  ('sem-ec-2026-2', 'sch-ec-2026', (SELECT id FROM departments WHERE code='EC'), (SELECT id FROM academic_years LIMIT 1), 2, 'Semester II',  1, '2026-03-10T00:00:00Z', '2026-03-09T00:00:00Z'),
  ('sem-ec-2026-3', 'sch-ec-2026', (SELECT id FROM departments WHERE code='EC'), (SELECT id FROM academic_years LIMIT 1), 3, 'Semester III', 0, NULL, NULL),
  ('sem-ec-2026-4', 'sch-ec-2026', (SELECT id FROM departments WHERE code='EC'), (SELECT id FROM academic_years LIMIT 1), 4, 'Semester IV',  0, NULL, NULL),
  ('sem-ec-2026-5', 'sch-ec-2026', (SELECT id FROM departments WHERE code='EC'), (SELECT id FROM academic_years LIMIT 1), 5, 'Semester V',   0, NULL, NULL),
  ('sem-ec-2026-6', 'sch-ec-2026', (SELECT id FROM departments WHERE code='EC'), (SELECT id FROM academic_years LIMIT 1), 6, 'Semester VI',  0, NULL, NULL),
  ('sem-ec-2026-7', 'sch-ec-2026', (SELECT id FROM departments WHERE code='EC'), (SELECT id FROM academic_years LIMIT 1), 7, 'Semester VII', 0, NULL, NULL),
  ('sem-ec-2026-8', 'sch-ec-2026', (SELECT id FROM departments WHERE code='EC'), (SELECT id FROM academic_years LIMIT 1), 8, 'Semester VIII',0, NULL, NULL);

-- ---------------------------------------------------------------------
-- 3. courses — Semester I (7 courses)
-- ---------------------------------------------------------------------
INSERT INTO courses (id, semester_id, code, code_is_custom, title, course_type, status, faculty_user_id, vertical, sub_vertical, total_credits, created_at, updated_at)
VALUES
  ('crs-ec26-bsc11ec01', 'sem-ec-2026-1', '26BSC11EC01', 0, 'Matrices and Differential Calculus',            'THEORY',      'APPROVED', (SELECT id FROM profiles WHERE username='faculty' OR email='faculty@example.edu'), 'BSESC', 'BSC',  3, '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z'),
  ('crs-ec26-bsc11ec04', 'sem-ec-2026-1', '26BSC11EC04', 0, 'Engineering Physics',                            'THEORY_LAB',  'DRAFT',    NULL, 'BSESC', 'BSC',  3, '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z'),
  ('crs-ec26-pcc11ec01', 'sem-ec-2026-1', '26PCC11EC01', 0, 'Programming Fundamentals (C)',                   'THEORY_LAB',  'APPROVED', (SELECT id FROM profiles WHERE username='faculty' OR email='faculty@example.edu'), 'PCPEC', 'PCC',  4, '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z'),
  ('crs-ec26-esc11ec03', 'sem-ec-2026-1', '26ESC11EC03', 0, 'Basic Electrical and Electronics Engineering',   'THEORY_LAB',  'DRAFT',    NULL, 'BSESC', 'ESC',  4, '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z'),
  ('crs-ec26-esc11ec02', 'sem-ec-2026-1', '26ESC11EC02', 0, 'Engineering Graphics',                           'THEORY_LAB',  'DRAFT',    NULL, 'BSESC', 'ESC',  3, '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z'),
  ('crs-ec26-vse11ec02', 'sem-ec-2026-1', '26VSE11EC02', 0, 'Skill Laboratory - 2',                           'LAB',         'DRAFT',    NULL, 'SC',    'VSEC', 1, '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z'),
  ('crs-ec26-llc1x',     'sem-ec-2026-1', '26LLC1X',     0, 'One Course from CC',                             'ELECTIVE',    'DRAFT',    NULL, 'LLC',   'CC',   2, '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z');

-- ---------------------------------------------------------------------
-- 4. courses — Semester II (9 courses)
-- ---------------------------------------------------------------------
INSERT INTO courses (id, semester_id, code, code_is_custom, title, course_type, status, faculty_user_id, vertical, sub_vertical, total_credits, created_at, updated_at)
VALUES
  ('crs-ec26-bsc11ec03', 'sem-ec-2026-2', '26BSC11EC03', 0, 'Integral Calculus and Probability Theory', 'THEORY',      'DRAFT', NULL, 'BSESC', 'BSC',  3, '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z'),
  ('crs-ec26-bsc11ec02', 'sem-ec-2026-2', '26BSC11EC02', 0, 'Engineering Chemistry',                    'THEORY_LAB',  'DRAFT', NULL, 'BSESC', 'BSC',  3, '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z'),
  ('crs-ec26-pcc11ec02', 'sem-ec-2026-2', '26PCC11EC02', 0, 'Innovation and Design Thinking',           'LAB',         'DRAFT', NULL, 'PCPEC', 'PCC',  1, '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z'),
  ('crs-ec26-iks11ec01', 'sem-ec-2026-2', '26IKS11EC01', 0, 'Indian Knowledge System',                  'THEORY',      'DRAFT', NULL, 'HSSM',  'IKS',  2, '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z'),
  ('crs-ec26-esc11ec01', 'sem-ec-2026-2', '26ESC11EC01', 0, 'Digital Electronics',                       'THEORY_LAB',  'DRAFT', NULL, 'BSESC', 'ESC',  4, '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z'),
  ('crs-ec26-aec11ec01', 'sem-ec-2026-2', '26AEC11EC01', 0, 'Object Oriented Programming with JAVA',    'LAB',         'DRAFT', NULL, 'HSSM',  'AEC',  2, '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z'),
  ('crs-ec26-vse11ec01', 'sem-ec-2026-2', '26VSE11EC01', 0, 'Skill Laboratory -1',                       'LAB',         'DRAFT', NULL, 'SC',    'VSEC', 1, '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z'),
  ('crs-ec26-aec11ec02', 'sem-ec-2026-2', '26AEC11EC02', 0, 'Art of Communication',                      'THEORY_LAB',  'DRAFT', NULL, 'HSSM',  'AEC',  2, '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z'),
  ('crs-ec26-llc2x',     'sem-ec-2026-2', '26LLC2X',     0, 'One Course From CC',                        'ELECTIVE',    'DRAFT', NULL, 'LLC',   'CC',   2, '2026-03-09T00:00:00Z', '2026-03-09T00:00:00Z');

-- ---------------------------------------------------------------------
-- 5. course_teaching_components
-- ---------------------------------------------------------------------

-- Matrices and Differential Calculus (26BSC11EC01) — credits 3
INSERT INTO course_teaching_components (id, course_id, component_type, hours, ise_marks, mse_marks, ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order) VALUES
  ('ctc-bsc11ec01-th', 'crs-ec26-bsc11ec01', 'TH', 2, 20, 30, 20, 50, 100, 2, 1),
  ('ctc-bsc11ec01-tu', 'crs-ec26-bsc11ec01', 'TU', 1, 50, NULL, NULL, NULL, 50, 1, 2),
  ('ctc-bsc11ec01-sl', 'crs-ec26-bsc11ec01', 'SL', 3, NULL, NULL, NULL, NULL, NULL, NULL, 4);

-- Engineering Physics (26BSC11EC04) — credits 3
INSERT INTO course_teaching_components (id, course_id, component_type, hours, ise_marks, mse_marks, ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order) VALUES
  ('ctc-bsc11ec04-th', 'crs-ec26-bsc11ec04', 'TH', 2, 20, 30, 20, 50, 100, 2, 1),
  ('ctc-bsc11ec04-pr', 'crs-ec26-bsc11ec04', 'PR', 2, 50, NULL, NULL, NULL, 50, 1, 3),
  ('ctc-bsc11ec04-sl', 'crs-ec26-bsc11ec04', 'SL', 2, NULL, NULL, NULL, NULL, NULL, NULL, 4);

-- Programming Fundamentals (C) (26PCC11EC01) — credits 4
INSERT INTO course_teaching_components (id, course_id, component_type, hours, ise_marks, mse_marks, ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order) VALUES
  ('ctc-pcc11ec01-th', 'crs-ec26-pcc11ec01', 'TH', 2, 20, 30, 20, 50, 100, 2, 1),
  ('ctc-pcc11ec01-tu', 'crs-ec26-pcc11ec01', 'TU', 1, 50, NULL, NULL, NULL, 50, 1, 2),
  ('ctc-pcc11ec01-pr', 'crs-ec26-pcc11ec01', 'PR', 2, 50, NULL, NULL, NULL, 50, 1, 3),
  ('ctc-pcc11ec01-sl', 'crs-ec26-pcc11ec01', 'SL', 3, NULL, NULL, NULL, NULL, NULL, NULL, 4);

-- Basic Electrical and Electronics Engineering (26ESC11EC03) — credits 4
INSERT INTO course_teaching_components (id, course_id, component_type, hours, ise_marks, mse_marks, ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order) VALUES
  ('ctc-esc11ec03-th', 'crs-ec26-esc11ec03', 'TH', 2, 20, 30, 20, 50, 100, 2, 1),
  ('ctc-esc11ec03-tu', 'crs-ec26-esc11ec03', 'TU', 1, 50, NULL, NULL, NULL, 50, 1, 2),
  ('ctc-esc11ec03-pr', 'crs-ec26-esc11ec03', 'PR', 2, 50, NULL, NULL, NULL, 50, 1, 3),
  ('ctc-esc11ec03-sl', 'crs-ec26-esc11ec03', 'SL', 3, NULL, NULL, NULL, NULL, NULL, NULL, 4);

-- Engineering Graphics (26ESC11EC02) — credits 3
INSERT INTO course_teaching_components (id, course_id, component_type, hours, ise_marks, mse_marks, ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order) VALUES
  ('ctc-esc11ec02-th', 'crs-ec26-esc11ec02', 'TH', 2, 20, 30, 20, 50, 100, 2, 1),
  ('ctc-esc11ec02-pr', 'crs-ec26-esc11ec02', 'PR', 2, 50, NULL, NULL, NULL, 50, 1, 3),
  ('ctc-esc11ec02-sl', 'crs-ec26-esc11ec02', 'SL', 2, NULL, NULL, NULL, NULL, NULL, NULL, 4);

-- Skill Laboratory - 2 (26VSE11EC02) — credits 1
INSERT INTO course_teaching_components (id, course_id, component_type, hours, ise_marks, mse_marks, ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order) VALUES
  ('ctc-vse11ec02-pr', 'crs-ec26-vse11ec02', 'PR', 2, 50, NULL, NULL, NULL, 50, 1, 3);

-- One Course from CC — Sem I (26LLC1X) — credits 2
INSERT INTO course_teaching_components (id, course_id, component_type, hours, ise_marks, mse_marks, ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order) VALUES
  ('ctc-llc1x-pr', 'crs-ec26-llc1x', 'PR', 2, 100, NULL, NULL, NULL, 100, 2, 3),
  ('ctc-llc1x-sl', 'crs-ec26-llc1x', 'SL', 2, NULL, NULL, NULL, NULL, NULL, NULL, 4);

-- Integral Calculus and Probability Theory (26BSC11EC03) — credits 3
INSERT INTO course_teaching_components (id, course_id, component_type, hours, ise_marks, mse_marks, ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order) VALUES
  ('ctc-bsc11ec03-th', 'crs-ec26-bsc11ec03', 'TH', 2, 20, 30, 20, 50, 100, 2, 1),
  ('ctc-bsc11ec03-tu', 'crs-ec26-bsc11ec03', 'TU', 1, 50, NULL, NULL, NULL, 50, 1, 2),
  ('ctc-bsc11ec03-sl', 'crs-ec26-bsc11ec03', 'SL', 3, NULL, NULL, NULL, NULL, NULL, NULL, 4);

-- Engineering Chemistry (26BSC11EC02) — credits 3
INSERT INTO course_teaching_components (id, course_id, component_type, hours, ise_marks, mse_marks, ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order) VALUES
  ('ctc-bsc11ec02-th', 'crs-ec26-bsc11ec02', 'TH', 2, 20, 30, 20, 50, 100, 2, 1),
  ('ctc-bsc11ec02-pr', 'crs-ec26-bsc11ec02', 'PR', 2, 50, NULL, NULL, NULL, 50, 1, 3),
  ('ctc-bsc11ec02-sl', 'crs-ec26-bsc11ec02', 'SL', 2, NULL, NULL, NULL, NULL, NULL, NULL, 4);

-- Innovation and Design Thinking (26PCC11EC02) — credits 1
INSERT INTO course_teaching_components (id, course_id, component_type, hours, ise_marks, mse_marks, ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order) VALUES
  ('ctc-pcc11ec02-pr', 'crs-ec26-pcc11ec02', 'PR', 2, 50, NULL, NULL, NULL, 50, 1, 3);

-- Indian Knowledge System (26IKS11EC01) — credits 2
INSERT INTO course_teaching_components (id, course_id, component_type, hours, ise_marks, mse_marks, ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order) VALUES
  ('ctc-iks11ec01-th', 'crs-ec26-iks11ec01', 'TH', 2, 100, NULL, NULL, NULL, 100, 2, 1),
  ('ctc-iks11ec01-sl', 'crs-ec26-iks11ec01', 'SL', 2, NULL, NULL, NULL, NULL, NULL, NULL, 4);

-- Digital Electronics (26ESC11EC01) — credits 4
INSERT INTO course_teaching_components (id, course_id, component_type, hours, ise_marks, mse_marks, ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order) VALUES
  ('ctc-esc11ec01-th', 'crs-ec26-esc11ec01', 'TH', 2, 20, 30, 20, 50, 100, 2, 1),
  ('ctc-esc11ec01-tu', 'crs-ec26-esc11ec01', 'TU', 1, 50, NULL, NULL, NULL, 50, 1, 2),
  ('ctc-esc11ec01-pr', 'crs-ec26-esc11ec01', 'PR', 2, 50, NULL, NULL, NULL, 50, 1, 3),
  ('ctc-esc11ec01-sl', 'crs-ec26-esc11ec01', 'SL', 3, NULL, NULL, NULL, NULL, NULL, NULL, 4);

-- Object Oriented Programming with JAVA (26AEC11EC01) — credits 2
INSERT INTO course_teaching_components (id, course_id, component_type, hours, ise_marks, mse_marks, ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order) VALUES
  ('ctc-aec11ec01-pr', 'crs-ec26-aec11ec01', 'PR', 4, 100, NULL, NULL, NULL, 100, 2, 3);

-- Skill Laboratory -1 (26VSE11EC01) — credits 1
INSERT INTO course_teaching_components (id, course_id, component_type, hours, ise_marks, mse_marks, ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order) VALUES
  ('ctc-vse11ec01-pr', 'crs-ec26-vse11ec01', 'PR', 2, 50, NULL, NULL, NULL, 50, 1, 3);

-- Art of Communication (26AEC11EC02) — credits 2
INSERT INTO course_teaching_components (id, course_id, component_type, hours, ise_marks, mse_marks, ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order) VALUES
  ('ctc-aec11ec02-th', 'crs-ec26-aec11ec02', 'TH', 1, 100, NULL, NULL, NULL, 100, 1, 1),
  ('ctc-aec11ec02-pr', 'crs-ec26-aec11ec02', 'PR', 2, NULL, NULL, NULL, NULL, NULL, 1, 3),
  ('ctc-aec11ec02-sl', 'crs-ec26-aec11ec02', 'SL', 1, NULL, NULL, NULL, NULL, NULL, NULL, 4);

-- One Course From CC — Sem II (26LLC2X) — credits 2
INSERT INTO course_teaching_components (id, course_id, component_type, hours, ise_marks, mse_marks, ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order) VALUES
  ('ctc-llc2x-pr', 'crs-ec26-llc2x', 'PR', 2, 100, NULL, NULL, NULL, 100, 2, 3),
  ('ctc-llc2x-sl', 'crs-ec26-llc2x', 'SL', 2, NULL, NULL, NULL, NULL, NULL, NULL, 4);

-- ---------------------------------------------------------------------
-- 6. department_preambles
-- ---------------------------------------------------------------------
INSERT INTO department_preambles (department_id, content, updated_by_user_id, updated_at)
VALUES (
  (SELECT id FROM departments WHERE code = 'EC'),
  'Fr Conceicao Rodrigues College of Engineering an autonomous institute from the year 2024-25. University Grant Commission vide letter No. F. 2-10/2023(AC-Policy) dated 23rd Nov 2023 conferred the autonomous status to Fr. Conceicao Rodrigues College of Engineering, Fr. Agnel Ashram, Bandstand, Bandra (West), Mumbai 400050 affiliated to University of Mumbai for a period of 10 years from the academic year 2024-2025 to 2033-2034 as per clause 7.5 of the UGC (Conferment of Autonomous Status Upon Colleges and Measures for Maintenance of Standards in Autonomous Colleges) Regulations,2023. We look towards autonomy as a great opportunity to design and implement curriculum sensitive to needs of Learner, Indian Society, and Industries. We commit to ourselves to the effective implementation of UGC Regulations and NEP 2020 in its spirit. Government of Maharashtra has directed Autonomous Colleges to revise their curriculum in line with National Education Policy (NEP) 2020 through Government Resolution dated 4th July 2023. Accordingly, degree options are given to the students admitted from academic year 2024-25 based on UGC circulars and DTE guidelines ref no. 17/DTE/NEP-2020/2024/111 dated 4th June 2024 related to implementation of NEP.

Based on recent recommendations of the GR, we are pleased to offer our holistic curriculum, a "H-Tree Model" of Engineering Education. A unique "H-Tree Model" of Engineering Education Curriculum is carefully designed to systematically develop IQ (Intelligence Quotient), PQ (Physical Quotient), EQ (Emotional Quotient) and SQ (Spiritual Quotient) of a learner. This curriculum aims at the development of an all-rounded personality with holistic approach to education in which learner receives 25% teacher-led learning, 25% peer learning, 25% self-learning and 25% experiential learning. The curriculum model is outcome based that focuses on learning by doing. Curriculum is designed to provide multiple learning opportunities for students to acquire and demonstrate competencies for rewarding careers. It ensures multiple choices to leaner acquiring skills through systematic planning. It has 7 verticals aligned to GR recommendations with strong science, and mathematics foundation and program core, sequel of electives, Multidisciplinary Minor courses, humanities & management courses and sufficient experiential learning through projects and semester-long industry / research internship along with employable skill-based courses. Learner gets an opportunity to acquire skills through NSDC aligned courses during summer vacations. Learner also gets additional option to choose the kind of degree i.e. Built in Multidisciplinary minor or Double Minor in emerging field or Honors with Research.

The curriculum is designed to give a glimpse of trends in the industry under vocational and enhanced skill practices, the pool is offered to nurture and develop creative skills in contemporary industrial practices. Criteria met in the structure is the opportunity for learners to choose the course of their interest in all disciplines. Program Core Course Cover Electronics and Computer Engineering based core courses. (Department Specific)

Various steps are taken to transform teaching learning process to make learning a joyful experience for students. We believe that this curriculum will raise the bar of academic standards with the active involvement and cooperation from students, academic and administrative units.',
  (SELECT id FROM profiles WHERE username = 'hod_ecs' OR email = 'hod_ecs@example.edu'),
  '2026-03-05T00:00:00Z'
);

-- ---------------------------------------------------------------------
-- 7. DETAILED SYLLABUS — course 1 of 2: Matrices and Differential Calculus (26BSC11EC01)
-- ---------------------------------------------------------------------
INSERT INTO course_outcomes (id, course_id, code, description, sort_order) VALUES
  ('co-bsc11ec01-1', 'crs-ec26-bsc11ec01', 'CO1', 'Apply eigenvalue and eigenvector techniques to diagonalize a given square matrix.', 1),
  ('co-bsc11ec01-2', 'crs-ec26-bsc11ec01', 'CO2', 'Apply differentiation techniques to evaluate higher-order derivatives of functions.', 2),
  ('co-bsc11ec01-3', 'crs-ec26-bsc11ec01', 'CO3', 'Apply partial differentiation technique to obtain the extremum of the given function.', 3),
  ('co-bsc11ec01-4', 'crs-ec26-bsc11ec01', 'CO4', 'Apply the concepts of analytic functions to solve well-defined engineering problems.', 4);

INSERT INTO modules (id, course_id, number, title, contact_hours, content) VALUES
  ('mod-bsc11ec01-1', 'crs-ec26-bsc11ec01', 1, 'Matrices', 9, ''),
  ('mod-bsc11ec01-2', 'crs-ec26-bsc11ec01', 2, 'Successive Differentiation', 3, ''),
  ('mod-bsc11ec01-3', 'crs-ec26-bsc11ec01', 3, 'Integral Calculus: Partial Differentiation', 6, ''),
  ('mod-bsc11ec01-4', 'crs-ec26-bsc11ec01', 4, 'Analytic Functions', 8, '');

INSERT INTO topics (id, module_id, title, description, sort_order) VALUES
  ('top-bsc11ec01-1-1', 'mod-bsc11ec01-1', '1.1', 'Types of Matrices (symmetric, skew-symmetric, Hermitian, Skew Hermitian, Unitary, Orthogonal Matrices and their properties). Rank of a Matrix using Echelon forms, reduction to normal form.', 1),
  ('top-bsc11ec01-1-2', 'mod-bsc11ec01-1', '1.2', 'System of Linear equations, their consistency and solutions.', 2),
  ('top-bsc11ec01-1-3', 'mod-bsc11ec01-1', '1.3', 'Eigenvalues and Eigenvectors of a square matrix and their Properties (without proof).', 3),
  ('top-bsc11ec01-1-4', 'mod-bsc11ec01-1', '1.4', 'Cayley-Hamilton Theorem (without proof), verification and reduction of higher degree polynomials.', 4),
  ('top-bsc11ec01-1-5', 'mod-bsc11ec01-1', '1.5', 'Similarity of matrices, diagonalizable and non-diagonalizable matrices.', 5),
  ('top-bsc11ec01-2-1', 'mod-bsc11ec01-2', '2.1', 'Successive differentiation: nth derivative of standard functions.', 1),
  ('top-bsc11ec01-2-2', 'mod-bsc11ec01-2', '2.2', 'Leibnitz''s Theorem (without proof) and problems.', 2),
  ('top-bsc11ec01-3-1', 'mod-bsc11ec01-3', '3.1', 'Partial Differentiation: Function of several variables, Partial derivatives of first and higher order. Differentiation of composite function.', 1),
  ('top-bsc11ec01-3-2', 'mod-bsc11ec01-3', '3.2', 'Euler''s Theorem on Homogeneous functions with two independent variables (with proof). Deductions from Euler''s Theorem. Maxima and Minima of a function of two independent variables.', 2),
  ('top-bsc11ec01-4-1', 'mod-bsc11ec01-4', '4.1', 'Analytic Functions: Function f(z) of complex variable, Limit, Continuity and Differentiability of f(z), Analytic function: Necessary and sufficient conditions for f(z) to be analytic (without proof).', 1),
  ('top-bsc11ec01-4-2', 'mod-bsc11ec01-4', '4.2', 'Cauchy-Riemann equations in Cartesian coordinates (without proof).', 2),
  ('top-bsc11ec01-4-3', 'mod-bsc11ec01-4', '4.3', 'Milne-Thomson method: Determine analytic function f(z) when real part (u), imaginary part (v) or its combination au+bv is given.', 3),
  ('top-bsc11ec01-4-4', 'mod-bsc11ec01-4', '4.4', 'Harmonic function, Harmonic conjugate and Orthogonal trajectories.', 4);

INSERT INTO reference_books (id, course_id, title, is_textbook, sort_order) VALUES
  ('ref-bsc11ec01-1', 'crs-ec26-bsc11ec01', 'Dr B.S. Grewal, "Higher Engineering Mathematics", Khanna Publications, 4th Edition.', 1, 1),
  ('ref-bsc11ec01-2', 'crs-ec26-bsc11ec01', 'H. K. Das, "Advanced Engineering Mathematics", S. Chand, 28th Edition.', 0, 2),
  ('ref-bsc11ec01-3', 'crs-ec26-bsc11ec01', 'Erwin Kreysizg, "Advanced Engineering Mathematics", John Wiley & Sons, 10th Edition.', 0, 3),
  ('ref-bsc11ec01-4', 'crs-ec26-bsc11ec01', 'Jain and Iyengar, "Advanced Engineering Mathematics", Narosa Publications, 4th Edition.', 0, 4),
  ('ref-bsc11ec01-5', 'crs-ec26-bsc11ec01', 'Rajan Goyal, Mansi Dhingra, "Programming in SCILAB", Narosa Publication.', 0, 5);

-- ---------------------------------------------------------------------
-- 8. DETAILED SYLLABUS — course 2 of 2: Programming Fundamentals (C) (26PCC11EC01)
-- ---------------------------------------------------------------------
INSERT INTO course_outcomes (id, course_id, code, description, sort_order) VALUES
  ('co-pcc11ec01-1', 'crs-ec26-pcc11ec01', 'CO1', 'Formulate simple algorithms for arithmetic, logical problems and translate them to programs in C language.', 1),
  ('co-pcc11ec01-2', 'crs-ec26-pcc11ec01', 'CO2', 'Illustrate programming principles, decision making statements, looping constructs.', 2),
  ('co-pcc11ec01-3', 'crs-ec26-pcc11ec01', 'CO3', 'Demonstrate modular programming using functions.', 3),
  ('co-pcc11ec01-4', 'crs-ec26-pcc11ec01', 'CO4', 'Demonstrate the applications of derived data types such as arrays, strings and structures.', 4),
  ('co-pcc11ec01-5', 'crs-ec26-pcc11ec01', 'CO5', 'Implement Programs based on pointers in C.', 5);

INSERT INTO modules (id, course_id, number, title, contact_hours, content) VALUES
  ('mod-pcc11ec01-1', 'crs-ec26-pcc11ec01', 1, 'C Programming Fundamentals', 8, ''),
  ('mod-pcc11ec01-2', 'crs-ec26-pcc11ec01', 2, 'Control Flow Statements', 6, ''),
  ('mod-pcc11ec01-3', 'crs-ec26-pcc11ec01', 3, 'Functions', 6, ''),
  ('mod-pcc11ec01-4', 'crs-ec26-pcc11ec01', 4, 'Arrays and Strings', 6, ''),
  ('mod-pcc11ec01-5', 'crs-ec26-pcc11ec01', 5, 'Structure', 6, ''),
  ('mod-pcc11ec01-6', 'crs-ec26-pcc11ec01', 6, 'Pointers', 7, '');

INSERT INTO topics (id, module_id, title, description, sort_order) VALUES
  ('top-pcc11ec01-1-1', 'mod-pcc11ec01-1', '1.1', 'The von Neumann Architecture, Introduction to operating system and system programs, Structured programming Approaches.', 1),
  ('top-pcc11ec01-1-2', 'mod-pcc11ec01-1', '1.2', 'Steps for Problem Solving: Algorithm and Flowchart.', 2),
  ('top-pcc11ec01-1-3', 'mod-pcc11ec01-1', '1.3', 'Variables, keywords, Data types, Operators: Arithmetic, Relational and Logical, Assignment, Unary, Conditional, Bitwise, Expression, Statements. Operator Precedence and Expression evaluation, formatted input and output.', 3),
  ('top-pcc11ec01-2-1', 'mod-pcc11ec01-2', '2.1', 'If statement, if-else statement, multi-way decision, switch statement.', 1),
  ('top-pcc11ec01-2-2', 'mod-pcc11ec01-2', '2.2', 'while, do-while, for, nested loops, Jump control statements, continue statement, break statement.', 2),
  ('top-pcc11ec01-3-1', 'mod-pcc11ec01-3', '3.1', 'Defining a Function, accessing a Function, Function Prototype.', 1),
  ('top-pcc11ec01-3-2', 'mod-pcc11ec01-3', '3.2', 'Passing Arguments to a Function, call by value, call by reference, Recursion.', 2),
  ('top-pcc11ec01-4-1', 'mod-pcc11ec01-4', '4.1', 'Introduction to Arrays, Declaration, initialization and accessing elements of one dimensional and two-dimensional arrays, Passing one-dimensional array to functions.', 1),
  ('top-pcc11ec01-4-2', 'mod-pcc11ec01-4', '4.2', 'Basics of strings in C, String operations and functions, Passing strings to functions.', 2),
  ('top-pcc11ec01-5-1', 'mod-pcc11ec01-5', '5.1', 'Concept of Structure, Declaration and Initialization of structure, Nested structures, Array of Structures.', 1),
  ('top-pcc11ec01-6-1', 'mod-pcc11ec01-6', '6.1', 'Fundamentals of pointers, Declaration, initialization and de-referencing of pointers, Void and Null Pointers, Pointer Arithmetic.', 1),
  ('top-pcc11ec01-6-2', 'mod-pcc11ec01-6', '6.2', 'Concept of dynamic memory allocation, DMA functions - Malloc(), Calloc(), Realloc(), Free().', 2);

INSERT INTO reference_books (id, course_id, title, is_textbook, sort_order) VALUES
  ('ref-pcc11ec01-1', 'crs-ec26-pcc11ec01', 'Yashavant Kanetkar, "Let Us C", BPB publication, Sixteenth Edition.', 1, 1),
  ('ref-pcc11ec01-2', 'crs-ec26-pcc11ec01', 'E. Balaguruswamy, "Programming in ANSI C", McGraw-Hill.', 0, 2),
  ('ref-pcc11ec01-3', 'crs-ec26-pcc11ec01', 'Kernighan, Ritchie, "The C Programming Language", Prentice Hall of India.', 0, 3),
  ('ref-pcc11ec01-4', 'crs-ec26-pcc11ec01', 'Pradeep Dey and Manas Ghosh, "Programming in C", Oxford University Press.', 0, 4);
