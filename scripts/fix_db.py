import sqlite3

db_path = 'backend-worker/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/ee405fe3690d0ebbc4c12dd173cba6f01492125044cb48e9b36e581a71b91f8b.sqlite'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("PRAGMA writable_schema=ON;")

# Backup first!
import shutil
shutil.copyfile(db_path, db_path + '.bak')
print("Backup created.")

# Delete the old entry (rootpage 12 and its autoindexes 13, 14)
cur.execute("DELETE FROM sqlite_master WHERE tbl_name='semesters' AND rootpage=12 AND type='table'")
cur.execute("DELETE FROM sqlite_master WHERE tbl_name='semesters' AND rootpage IN (13, 14) AND type='index' AND name LIKE 'sqlite_autoindex%'")
conn.commit()
conn.close()

# Reopen normally without writable_schema to verify
conn2 = sqlite3.connect(db_path)
cur2 = conn2.cursor()
cur2.execute("SELECT count(*) FROM semesters")
print("Semesters count:", cur2.fetchone()[0])
cur2.execute("PRAGMA integrity_check;")
print("Integrity check:", cur2.fetchall())
conn2.close()

