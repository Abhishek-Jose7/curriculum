import sqlite3

db_path = 'backend-worker/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/ee405fe3690d0ebbc4c12dd173cba6f01492125044cb48e9b36e581a71b91f8b.sqlite'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]
print("Tables in DB:", tables)

for t in tables:
    try:
        cur.execute(f"SELECT * FROM \"{t}\"")
        rows = cur.fetchall()
        print(f"Table {t}: {len(rows)} rows")
    except Exception as e:
        print(f"Table {t} FAILED: {e}")
conn.close()

