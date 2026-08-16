const fs = require('fs');

let sql = `
-- 1. Insert Academic Year 2025-26
INSERT OR IGNORE INTO academic_years (id, name, starts_on, ends_on, is_active)
VALUES ('2', '2025-26', '2025-07-01', '2026-06-30', 0);

-- 2. Insert Semester for 2025-26
INSERT OR IGNORE INTO semesters (id, department_id, academic_year_id, number, title, ordinance)
VALUES ('2', '1', '2', 3, 'Semester III', '');

-- 3. Insert Previous Year Course (Electronic Devices)
DELETE FROM courses WHERE id = '5';
DELETE FROM course_outcomes WHERE course_id = '5';
DELETE FROM modules WHERE course_id = '5';
DELETE FROM experiments WHERE course_id = '5';
DELETE FROM assessment_schemes WHERE course_id = '5';
DELETE FROM reference_books WHERE course_id = '5';

INSERT INTO courses (id, semester_id, faculty_user_id, code, title, course_type, status, lecture_hours, tutorial_hours, practical_hours, self_learning_hours, credits, internal_marks, external_marks, objectives, pre_requisites, syllabus_intro)
VALUES ('5', '2', '8', '25PCC12EC05', 'Electronic Devices', 'THEORY', 'PUBLISHED', 2, 0, 2, 0, 3, 50, 50, 'Explain working of semiconductor devices.', 'Basic Electrical and Electronics Engineering, Fundamentals of Electromagnetics and Semiconductor Devices', 'Syllabus covering BJT, FET, MOS, Optoelectronic and Power Semiconductor devices.');

INSERT INTO course_outcomes (course_id, code, description, bloom_level, sort_order) VALUES
('5', 'CO1', 'Explain the working of semiconductor devices.', 'Understand', 1),
('5', 'CO2', 'Interpret the characteristics of semiconductor devices.', 'Understand', 2),
('5', 'CO3', 'Explain characteristics of power electronics and optoelectronic devices.', 'Understand', 3),
('5', 'CO4', 'Apply the optoelectronic and power electronic devices for various applications.', 'Apply', 4);

INSERT INTO modules (course_id, number, title, contact_hours, content, "references") VALUES
('5', 1, 'Bipolar Junction Transistors', 5, 'Minority carrier distributions and terminal currents, Generalized Biasing: The Coupled-Diode Model, Charge control analysis; switching, drift in base region, base narrowing, avalanche breakdown, thermal effects, Kirk effect. Uni-junction Transistor (UJT)', '1, 3'),
('5', 2, 'Field Effect Transistors', 5, 'JFET (characteristics), MOS capacitor (threshold voltage, C-V characteristics). MOSFET: I-V characteristics, Equivalent circuits for the MOSFET.', '4'),
('5', 3, 'MOS Transistor', 5, 'MOS Transistor under Static Conditions, Dynamic Behaviour, Secondary Effects. SPICE Models for MOS Transistor, Technology Scaling', '2, 4'),
('5', 4, 'Optoelectronic Devices', 5, 'Photodiodes: I-V characteristics in an illuminated junction, Solar Cells, Photodetectors. LEDs, Semiconductor LASER', '1, 2, 4'),
('5', 5, 'Power Semiconductor Devices', 6, 'SCR (Silicon Controlled Rectifier): two transistor model, protection circuits, series and parallel operation of SCR, triggering and commutation circuits. GTO, TRIAC, DIAC, Power Diode, Power BJT, Power MOSFET, IGBT.', '2');

INSERT INTO experiments (course_id, number, title, description, hours) VALUES
('5', 1, 'BJT Input & Output Characteristics (CE)', 'Input & Output Characteristics of BJT in Common Emitter (CE) Configuration', 2),
('5', 2, 'BJT Simulation (CE)', 'Simulation of Input & Output Characteristics of BJT (CE Configuration)', 2),
('5', 3, 'UJT V-I Characteristics', 'Uni-junction Transistor (UJT) V-I Characteristics', 2),
('5', 4, 'UJT Relaxation Oscillator', 'UJT as Relaxation Oscillator', 2),
('5', 5, 'JFET V-I & Transfer Characteristics', 'Junction Field Effect Transistor (JFET) V-I & Transfer Characteristics', 2),
('5', 6, 'MOSFET Characteristics Simulation', 'Simulation of MOSFET Transfer & Output Characteristics', 2),
('5', 7, 'Channel Length Modulation Simulation', 'Simulation of Channel Length Modulation for MOSFET (Secondary Effects)', 2),
('5', 8, 'SCR V-I Characteristics', 'Silicon Controlled Rectifier (SCR) V-I Characteristics', 2);

INSERT INTO assessment_schemes (course_id, component, marks, description, sort_order) VALUES
('5', 'ISE-1 (Theory)', 20, 'Quiz/crossword (10M) + Poster making (10M)', 1),
('5', 'ISE-2 (Theory)', 20, '3D model making (10M) + Open Book Test (10M)', 2),
('5', 'MSE (Theory)', 30, '90 Minutes written examination based on 50% syllabus', 3),
('5', 'ESE (Theory)', 30, '90 Minutes written examination based on remaining 50% syllabus', 4),
('5', 'ISE-1 (Lab)', 20, 'Continuous pre-defined rubrics-based evaluation for 4 experiments', 5),
('5', 'ISE-2 (Lab & Viva)', 30, '4 experiments rubrics (20M) + Viva-voce based on syllabus (10M)', 6);

INSERT INTO reference_books (course_id, title, authors, publisher, edition, year, is_textbook, sort_order) VALUES
('5', 'Solid State Electronic Devices', 'B.G. Streetman, S. K. Banerjee', 'Pearson India', '7th Edition', '2017', 1, 1),
('5', 'Power Electronics: Circuits, Devices & Applications', 'M.H. Rashid', 'Pearson India', '4th Edition', '2017', 1, 2),
('5', 'Physics of Semiconductor Devices', 'S. M. Sze', 'John Wiley & Sons', '3rd Edition', '2007', 0, 3),
('5', 'Semiconductor Physics and Devices: Basic Principles', 'Donald. A. Neamen', 'McGraw Hill Higher Education', '4th Edition', '2011', 0, 4);
`;

fs.writeFileSync('seed_prior_year.sql', sql);
console.log('Created seed_prior_year.sql');
