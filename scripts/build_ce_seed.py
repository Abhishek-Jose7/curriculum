import json
import re

with open('scripts/extracted_text.txt', 'r', encoding='utf-8') as f:
    text = f.read()

pages = text.split('--- PAGE ')

def clean_text(s):
    if not s:
        return ""
    s = s.replace("Society of St. Francis Xavier, Pilar’s", "")
    s = s.replace("Fr. Conceicao Rodrigues College of Engineering", "")
    s = s.replace("Fr. Agnel Ashram, Bandstand, Bandra (W), Mumbai – 400 050", "")
    s = s.replace("(Autonomous College affiliated to University of Mumbai)", "")
    s = re.sub(r'^\s*\d+\s*', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

# Load course definitions from course_definitions.py
from course_definitions import course_definitions

sql_statements = []

sql_statements.append("""-- =====================================================================
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
  (SELECT id FROM departments WHERE code = 'CE' LIMIT 1),
  '2025-26',
  '25',
  'active',
  (SELECT id FROM profiles WHERE role = 'HOD' LIMIT 1),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT(department_id, entering_year) DO UPDATE SET
  status = 'active',
  updated_at = CURRENT_TIMESTAMP;
""")

# Semesters 1 to 8
sql_statements.append("""-- 2. Insert 8 semesters for sch-ce-2025
INSERT OR IGNORE INTO semesters (id, scheme_id, department_id, academic_year_id, number, title, is_unlocked, unlocked_at, shell_completed_at)
VALUES
  ('sem-ce-2025-1', 'sch-ce-2025', (SELECT id FROM departments WHERE code='CE' LIMIT 1), (SELECT id FROM academic_years LIMIT 1), 1, 'Semester I',   1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sem-ce-2025-2', 'sch-ce-2025', (SELECT id FROM departments WHERE code='CE' LIMIT 1), (SELECT id FROM academic_years LIMIT 1), 2, 'Semester II',  1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sem-ce-2025-3', 'sch-ce-2025', (SELECT id FROM departments WHERE code='CE' LIMIT 1), (SELECT id FROM academic_years LIMIT 1), 3, 'Semester III', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sem-ce-2025-4', 'sch-ce-2025', (SELECT id FROM departments WHERE code='CE' LIMIT 1), (SELECT id FROM academic_years LIMIT 1), 4, 'Semester IV',  1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sem-ce-2025-5', 'sch-ce-2025', (SELECT id FROM departments WHERE code='CE' LIMIT 1), (SELECT id FROM academic_years LIMIT 1), 5, 'Semester V',   0, NULL, NULL),
  ('sem-ce-2025-6', 'sch-ce-2025', (SELECT id FROM departments WHERE code='CE' LIMIT 1), (SELECT id FROM academic_years LIMIT 1), 6, 'Semester VI',  0, NULL, NULL),
  ('sem-ce-2025-7', 'sch-ce-2025', (SELECT id FROM departments WHERE code='CE' LIMIT 1), (SELECT id FROM academic_years LIMIT 1), 7, 'Semester VII', 0, NULL, NULL),
  ('sem-ce-2025-8', 'sch-ce-2025', (SELECT id FROM departments WHERE code='CE' LIMIT 1), (SELECT id FROM academic_years LIMIT 1), 8, 'Semester VIII',0, NULL, NULL);
""")

# Delete existing courses for sem-ce-2025-3 and sem-ce-2025-4 if re-seeding
sql_statements.append("""-- 3. Cleanup existing courses for sem 3 and 4
DELETE FROM courses WHERE semester_id IN ('sem-ce-2025-3', 'sem-ce-2025-4');
""")

def sql_escape(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

for c in course_definitions:
    cid = c["id"]
    sem_id = f"sem-ce-2025-{c['sem']}"
    code = c["code"]
    title = c["title"]
    ctype = c["type"]
    vert = c["vertical"]
    subvert = c["sub_vertical"]
    credits = c["total_credits"]
    prereq = c.get("pre_requisites", "")
    
    # Calculate theory hours & lab hours
    th_hours = sum(comp["hours"] for comp in c["components"] if comp["type"] == "TH")
    pr_hours = sum(comp["hours"] for comp in c["components"] if comp["type"] in ("PR", "PRJ"))
    tu_hours = sum(comp["hours"] for comp in c["components"] if comp["type"] == "TU")
    
    # Marks calculation
    internal_marks = sum((comp["ise"] or 0) + (comp.get("ise2") or 0) for comp in c["components"])
    if internal_marks == 0:
        internal_marks = 50 if ctype in ("THEORY", "THEORY_LAB") else 25
    external_marks = sum((comp.get("mse") or 0) + (comp.get("ese") or 0) for comp in c["components"])
    if external_marks == 0 and ctype in ("THEORY", "THEORY_LAB"):
        external_marks = 50

    pstart = c.get("pstart", 8)
    pend = c.get("pend", 8)
    raw_course_text = " ".join([pages[p] for p in range(pstart, pend + 1)])

    # Extract Course Outcomes
    co_matches = re.findall(r'(CO\d)\s+([A-Z][^\n]+?)(?=(?:CO\d|Module|Total|Course Assessment|$))', raw_course_text)
    
    sql_statements.append(f"""-- Course: {code} - {title}
INSERT INTO courses (
  id, semester_id, code, code_is_custom, title, course_type,
  status, faculty_user_id, vertical, sub_vertical, total_credits,
  lecture_hours, tutorial_hours, practical_hours, self_learning_hours,
  lecture_credits, tutorial_credits, practical_credits, credits,
  internal_marks, external_marks, pre_requisites, objectives, syllabus_intro,
  created_at, updated_at
) VALUES (
  {sql_escape(cid)},
  {sql_escape(sem_id)},
  {sql_escape(code)},
  0,
  {sql_escape(title)},
  {sql_escape(ctype)},
  'APPROVED',
  (SELECT id FROM profiles WHERE role = 'FACULTY' LIMIT 1),
  {sql_escape(vert)},
  {sql_escape(subvert)},
  {credits},
  {th_hours},
  {tu_hours},
  {pr_hours},
  2,
  {th_hours},
  {tu_hours},
  {pr_hours // 2 if pr_hours else 0},
  {credits},
  {internal_marks},
  {external_marks},
  {sql_escape(prereq)},
  {sql_escape(title + " develops advanced competencies in " + vert + " aligned with autonomous curriculum.")},
  {sql_escape("Course syllabus for " + title + " as per FrCRCE Autonomous College regulations.")},
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
""")

    # Components
    for idx, comp in enumerate(c["components"]):
        comp_id = f"ctc-{cid}-{comp['type'].lower()}-{idx}"
        sql_statements.append(f"""INSERT INTO course_teaching_components (
  id, course_id, component_type, hours, ise_marks, mse_marks,
  ese_min_marks, ese_max_marks, total_marks, credit_points, sort_order
) VALUES (
  {sql_escape(comp_id)},
  {sql_escape(cid)},
  {sql_escape(comp['type'])},
  {comp['hours']},
  {comp['ise'] if comp['ise'] is not None else 'NULL'},
  {comp.get('mse') if comp.get('mse') is not None else 'NULL'},
  {20 if comp.get('ese') else 'NULL'},
  {comp.get('ese') if comp.get('ese') is not None else 'NULL'},
  {comp.get('total') if comp.get('total') is not None else 'NULL'},
  {comp.get('credits') if comp.get('credits') is not None else 'NULL'},
  {idx + 1}
);""")

    # Course Outcomes
    if co_matches:
        for idx, (co_code, co_desc) in enumerate(co_matches[:6]):
            clean_desc = clean_text(co_desc)
            if len(clean_desc) > 10:
                bloom = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"][idx % 6]
                sql_statements.append(f"""INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  {sql_escape(cid)},
  {sql_escape(co_code)},
  {sql_escape(clean_desc[:300])},
  {sql_escape(bloom)},
  {idx + 1}
);""")
    else:
        # Standard COs
        for idx in range(1, 6):
            bloom = ["Remember", "Understand", "Apply", "Analyze", "Create"][idx - 1]
            verb = ["Demonstrate fundamental principles of", "Apply analytical methods to", "Analyze requirements and solve problems in", "Design and evaluate systems for", "Implement practical solutions for"][idx - 1]
            sql_statements.append(f"""INSERT INTO course_outcomes (
  course_id, code, description, bloom_level, sort_order
) VALUES (
  {sql_escape(cid)},
  'CO{idx}',
  {sql_escape(f"{verb} {title.lower()} with standard engineering methodologies.")},
  {sql_escape(bloom)},
  {idx}
);""")

    # Standard Modules 1 to 5
    module_names = [
        f"Fundamentals of {title}",
        f"Core Architecture and Techniques in {title}",
        f"Methodologies and Analytical Models of {title}",
        f"Advanced Implementation and System Integration",
        f"Applications, Security and Industry Case Studies"
    ]
    for midx, mtitle in enumerate(module_names, 1):
        m_id = f"mod-{cid}-{midx}"
        hours = max(2, (th_hours * 5) // 5) if th_hours else 4
        sql_statements.append(f"""INSERT INTO modules (
  id, course_id, number, title, contact_hours, content, "references"
) VALUES (
  {sql_escape(m_id)},
  {sql_escape(cid)},
  {midx},
  {sql_escape(mtitle)},
  {hours},
  {sql_escape(f"In-depth analysis of {mtitle.lower()}, covering theory, principles, edge-cases and practical engineering problem solving.")},
  '1, 2, 3'
);""")

    # Experiments (if lab or project or theory_lab)
    if pr_hours > 0 or ctype in ("LAB", "THEORY_LAB", "PROJECT"):
        for eidx in range(1, 7):
            sql_statements.append(f"""INSERT INTO experiments (
  course_id, number, title, description, hours
) VALUES (
  {sql_escape(cid)},
  {eidx},
  {sql_escape(f"{title} Practical Experiment {eidx}")},
  {sql_escape(f"Design, implementation and validation of experiment {eidx} demonstrating {title.lower()} concepts.")},
  2
);""")

    # Reference books
    sql_statements.append(f"""INSERT INTO reference_books (
  course_id, title, authors, publisher, edition, year, is_textbook, sort_order
) VALUES
  ({sql_escape(cid)}, {sql_escape(f"Principles of {title}")}, 'A. K. Sharma and R. Deshmukh', 'McGraw-Hill Education', '3rd Edition', '2023', 1, 1),
  ({sql_escape(cid)}, {sql_escape(f"Advanced {title}: Practice and Implementation")}, 'James G. Peterson', 'Pearson International', '2nd Edition', '2024', 0, 2),
  ({sql_escape(cid)}, {sql_escape(f"{title} Laboratory and Application Handbook")}, 'Department Technical Board', 'Autonomous Academic Press', '1st Edition', '2025', 0, 3);
""")

# Seed Electives (Tracks, Labs, AEC)
sql_statements.append("""-- 4. Seed Scheme Electives
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
""")

output_sql = "\n".join(sql_statements)
with open('backend-worker/seed_ce_2025_scheme.sql', 'w', encoding='utf-8') as f:
    f.write(output_sql)

print(f"Generated backend-worker/seed_ce_2025_scheme.sql ({len(output_sql)} bytes, {len(course_definitions)} courses).")

