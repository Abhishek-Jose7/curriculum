import sqlite3
import json
import os

db_path = r"backend-worker\.wrangler\state\v3\d1\miniflare-D1DatabaseObject\ee405fe3690d0ebbc4c12dd173cba6f01492125044cb48e9b36e581a71b91f8b.sqlite"
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

scheme_id = "sch-ce-2025"

# 1. Scheme
cur.execute("SELECT * FROM curriculum_schemes WHERE id = ?", (scheme_id,))
scheme_row = dict(cur.fetchone())

# 2. Department
cur.execute("SELECT * FROM departments WHERE id = ?", (scheme_row["department_id"],))
dept_row = dict(cur.fetchone())

# 3. Preamble
cur.execute("SELECT content FROM department_preambles WHERE department_id = ?", (scheme_row["department_id"],))
preamble_row = cur.fetchone()
preamble = preamble_row["content"] if preamble_row else None

# 4. Semesters
cur.execute("SELECT * FROM semesters WHERE scheme_id = ? ORDER BY number ASC", (scheme_id,))
semesters = [dict(r) for r in cur.fetchall()]

# 5. Courses
cur.execute("""
    SELECT c.*, trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) AS faculty_name
    FROM courses c
    LEFT JOIN profiles p ON c.faculty_user_id = p.id
    WHERE c.semester_id IN (SELECT id FROM semesters WHERE scheme_id = ?)
    ORDER BY c.code ASC
""", (scheme_id,))
all_courses = [dict(r) for r in cur.fetchall()]

# 6. Teaching Components
cur.execute("""
    SELECT * FROM course_teaching_components
    WHERE course_id IN (SELECT id FROM courses WHERE semester_id IN (SELECT id FROM semesters WHERE scheme_id = ?))
    ORDER BY sort_order ASC
""", (scheme_id,))
components = [dict(r) for r in cur.fetchall()]

components_map = {}
for comp in components:
    cid = comp["course_id"]
    if cid not in components_map:
        components_map[cid] = []
    components_map[cid].append(comp)

# Group courses into semesters
formatted_semesters = []
for sem in semesters:
    sem_courses = []
    for c in all_courses:
        if c["semester_id"] == sem["id"]:
            c_copy = dict(c)
            c_copy["components"] = components_map.get(c["id"], [])
            sem_courses.append(c_copy)
    formatted_semesters.append({
        "id": sem["id"],
        "number": sem["number"],
        "title": sem["title"],
        "ordinance": sem["ordinance"] or "",
        "is_unlocked": bool(sem["is_unlocked"]),
        "courses": sem_courses
    })

# 7. Electives
cur.execute("SELECT * FROM scheme_electives WHERE scheme_id = ? ORDER BY sort_order ASC", (scheme_id,))
electives_rows = [dict(r) for r in cur.fetchall()]

electives = {
    "tracks": [r for r in electives_rows if r["category"] == "TRACK"],
    "labs": [r for r in electives_rows if r["category"] == "LAB"],
    "aec": [r for r in electives_rows if r["category"] == "AEC"],
}

# 8. Detailed Courses for SE (Sem 3 & 4)
target_sem_ids = [s["id"] for s in semesters if s["number"] in [3, 4]]
target_courses = [c for c in all_courses if c["semester_id"] in target_sem_ids]

# Fetch relations for detailed courses
detailed_course_ids = [c["id"] for c in target_courses]
placeholders = ",".join(["?"] * len(detailed_course_ids))

cur.execute(f"SELECT * FROM course_outcomes WHERE course_id IN ({placeholders}) ORDER BY sort_order ASC, code ASC", detailed_course_ids)
outcomes_rows = [dict(r) for r in cur.fetchall()]

cur.execute(f"SELECT * FROM modules WHERE course_id IN ({placeholders}) ORDER BY number ASC", detailed_course_ids)
modules_rows = [dict(r) for r in cur.fetchall()]

cur.execute(f"SELECT * FROM experiments WHERE course_id IN ({placeholders}) ORDER BY number ASC", detailed_course_ids)
experiments_rows = [dict(r) for r in cur.fetchall()]

cur.execute(f"SELECT * FROM reference_books WHERE course_id IN ({placeholders}) ORDER BY sort_order ASC, is_textbook DESC", detailed_course_ids)
references_rows = [dict(r) for r in cur.fetchall()]

cur.execute(f"SELECT * FROM assessment_schemes WHERE course_id IN ({placeholders}) ORDER BY sort_order ASC", detailed_course_ids)
assessments_rows = [dict(r) for r in cur.fetchall()]

outcomes_map = {}
for r in outcomes_rows:
    cid = r["course_id"]
    if cid not in outcomes_map: outcomes_map[cid] = []
    po = {}
    try:
        po = json.loads(r["po_map"]) if r["po_map"] else {}
    except:
        pass
    r_dict = dict(r)
    r_dict["po_map"] = po
    outcomes_map[cid].append(r_dict)

modules_map = {}
for r in modules_rows:
    cid = r["course_id"]
    if cid not in modules_map: modules_map[cid] = []
    topics = []
    try:
        topics = json.loads(r["topics"]) if r["topics"] else []
    except:
        pass
    r_dict = dict(r)
    r_dict["topics"] = topics
    modules_map[cid].append(r_dict)

experiments_map = {}
for r in experiments_rows:
    cid = r["course_id"]
    if cid not in experiments_map: experiments_map[cid] = []
    experiments_map[cid].append(dict(r))

references_map = {}
for r in references_rows:
    cid = r["course_id"]
    if cid not in references_map: references_map[cid] = []
    references_map[cid].append(dict(r))

assessments_map = {}
for r in assessments_rows:
    cid = r["course_id"]
    if cid not in assessments_map: assessments_map[cid] = []
    assessments_map[cid].append(dict(r))

detailed_courses = []
for c in target_courses:
    cid = c["id"]
    c_dict = dict(c)
    c_dict["components"] = components_map.get(cid, [])
    c_dict["outcomes"] = outcomes_map.get(cid, [])
    c_dict["modules"] = modules_map.get(cid, [])
    c_dict["experiments"] = experiments_map.get(cid, [])
    c_dict["reference_books"] = references_map.get(cid, [])
    c_dict["assessments"] = assessments_map.get(cid, [])
    c_dict["comments"] = []
    detailed_courses.append(c_dict)

booklet_data = {
    "scheme": scheme_row,
    "department": dept_row,
    "preamble": preamble,
    "year_of_study": "SE",
    "revision_label": "FRCRCE-2-25",
    "semesters": formatted_semesters,
    "electives": electives,
    "detailed_courses": detailed_courses,
}

out_ts_path = r"frontend\lib\default-booklet-data.ts"
with open(out_ts_path, "w", encoding="utf-8") as f:
    f.write("/* eslint-disable */\n")
    f.write("// Auto-generated from database seed for offline & initial SSR rendering\n")
    f.write("export const DEFAULT_BOOKLET_DATA = ")
    f.write(json.dumps(booklet_data, indent=2))
    f.write(";\n")

print(f"Successfully wrote {out_ts_path} with {len(detailed_courses)} detailed courses and {len(formatted_semesters)} semesters.")
