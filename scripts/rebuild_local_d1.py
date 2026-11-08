import sqlite3
import glob
import os
import shutil

target_db = 'backend-worker/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/ee405fe3690d0ebbc4c12dd173cba6f01492125044cb48e9b36e581a71b91f8b.sqlite'
temp_db = 'backend-worker/temp_rebuild.sqlite'

if os.path.exists(temp_db):
    os.remove(temp_db)

conn = sqlite3.connect(temp_db)

# 1. Apply all migrations
migrations = sorted(glob.glob('backend-worker/migrations/*.sql'))
print("Applying migrations:")
for m in migrations:
    print(" -", os.path.basename(m))
    with open(m, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())

# 2. Apply baseline seed
print("Applying baseline seed...")
with open('backend-worker/seed.sql', 'r', encoding='utf-8') as f:
    conn.executescript(f.read())

# 3. Apply CE 2025 scheme seed
print("Applying CE 2025 Scheme seed...")
with open('backend-worker/seed_ce_2025_scheme.sql', 'r', encoding='utf-8') as f:
    conn.executescript(f.read())

cur = conn.cursor()
cur.execute("PRAGMA integrity_check;")
res = cur.fetchall()
print("Integrity check:", res)
assert res == [('ok',)], "Integrity check failed!"

# Verify table counts
tables = ['departments', 'profiles', 'academic_years', 'curriculum_schemes', 'semesters', 'courses', 'course_teaching_components', 'course_outcomes', 'modules', 'experiments', 'reference_books', 'scheme_electives']
for t in tables:
    cur.execute(f"SELECT count(*) FROM {t}")
    print(f"Table {t}: {cur.fetchone()[0]} rows")

conn.close()

# Replace target_db
print(f"Replacing {target_db}...")
if os.path.exists(target_db):
    # Remove wal / shm if any
    for ext in ['-wal', '-shm']:
        p = target_db + ext
        if os.path.exists(p):
            os.remove(p)
    os.remove(target_db)

shutil.move(temp_db, target_db)
print("Rebuild complete and verified successfully!")

