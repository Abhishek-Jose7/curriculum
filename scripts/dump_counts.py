import sqlite3

db_path = 'backend-worker/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/ee405fe3690d0ebbc4c12dd173cba6f01492125044cb48e9b36e581a71b91f8b.sqlite'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
tables = ['departments', 'profiles', 'academic_years', 'curriculum_schemes', 'semesters', 'courses', 'course_teaching_components', 'course_outcomes', 'modules', 'experiments', 'curriculum_templates', 'published_curricula']

for t in tables:
    try:
        cur.execute(f"SELECT count(*) FROM {t}")
        print(f"{t}: {cur.fetchone()[0]}")
    except Exception as e:
        print(f"{t}: error {e}")
conn.close()

