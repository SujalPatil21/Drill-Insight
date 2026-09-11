import os
import psycopg
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL").replace("+psycopg", "")

try:
    with psycopg.connect(db_url, autocommit=True) as conn:
        print("Connected to PostgreSQL successfully.")
        with conn.cursor() as cur:
            # Check PostGIS
            cur.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
            cur.execute("SELECT PostGIS_Version();")
            postgis_version = cur.fetchone()[0]
            print(f"PostGIS Version: {postgis_version}")
            
            # Check pgvector
            try:
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                cur.execute("SELECT extversion FROM pg_extension WHERE extname = 'vector';")
                vector_ver = cur.fetchone()
                if vector_ver:
                    print(f"pgvector Version: {vector_ver[0]}")
                else:
                    print("pgvector is unavailable but that is fine.")
            except Exception as e:
                print(f"pgvector check failed (acceptable for now): {e}")

except Exception as e:
    print(f"Database connection or extension verification failed: {e}")
