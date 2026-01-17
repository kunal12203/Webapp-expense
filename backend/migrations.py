import os
import psycopg2
import csv
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load DATABASE_URL from .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set")

# Parse DB name (for folder naming)
db_name = urlparse(DATABASE_URL).path.lstrip("/") or "postgres"

OUTPUT_DIR = f"supabase_export_{db_name}"
os.makedirs(OUTPUT_DIR, exist_ok=True)

print(f"📦 Exporting database → {OUTPUT_DIR}")

# Connect
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Get all public tables
cur.execute("""
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
""")

tables = [row[0] for row in cur.fetchall()]

if not tables:
    print("⚠️ No tables found in public schema")
    exit(0)

print(f"🗂️ Found tables: {tables}")

for table in tables:
    print(f"➡️ Exporting {table}...")

    with open(f"{OUTPUT_DIR}/{table}.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        # Fetch column names
        cur.execute(f'SELECT * FROM "{table}" LIMIT 0')
        colnames = [desc[0] for desc in cur.description]
        writer.writerow(colnames)

        # Fetch data
        cur.execute(f'SELECT * FROM "{table}"')
        for row in cur.fetchall():
            writer.writerow(row)

print("✅ Export complete")

cur.close()
conn.close()
