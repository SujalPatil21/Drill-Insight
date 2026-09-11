import psycopg2
import sys

try:
    conn = psycopg2.connect(
        dbname="postgres",
        user="postgres",
        password="password",  # Trying common default or just to see error
        host="localhost",
        port="5432"
    )
    print("Connection successful")
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
    sys.exit(1)
