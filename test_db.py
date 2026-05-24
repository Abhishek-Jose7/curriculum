import psycopg
users = ["curriculum", "postgres"]
passwords = ["curriculum", "welovecats", "postgres", "admin", "password"]

for user in users:
    for pwd in passwords:
        try:
            conn = psycopg.connect(f"host=localhost port=5432 user={user} password={pwd} dbname=postgres", connect_timeout=2)
            print(f"SUCCESS: user={user}, password={pwd}")
            conn.close()
            exit(0)
        except Exception:
            pass
print("All attempts failed.")
