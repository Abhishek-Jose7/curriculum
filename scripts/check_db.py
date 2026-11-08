import sqlite3

db_path = 'backend-worker/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/ee405fe3690d0ebbc4c12dd173cba6f01492125044cb48e9b36e581a71b91f8b.sqlite'
try:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("PRAGMA writable_schema=ON;")
    cur.execute("SELECT type, name, tbl_name, rootpage, sql FROM sqlite_master WHERE tbl_name LIKE '%semester%'")
    for r in cur.fetchall():
        print(r)
except Exception as e:
    print('Error:', e)

