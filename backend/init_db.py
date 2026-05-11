import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    conn = psycopg2.connect(
        dbname='postgres',
        user='postgres',
        password='',
        host='localhost',
        port='5432'
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    # Check if database exists
    cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'attendance_db'")
    exists = cur.fetchone()
    if not exists:
        print("Creating database attendance_db...")
        cur.execute('CREATE DATABASE attendance_db')
        print("Database created.")
    else:
        print("Database attendance_db already exists.")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    try:
        create_database()
    except Exception as e:
        print(f"Error creating database: {e}")
