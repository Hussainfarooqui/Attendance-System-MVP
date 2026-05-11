import requests

try:
    # We can't easily check /users without auth, but we can check if data is in the DB directly
    # Or just assume success since health check passed and migration script reported success.
    # I'll check DB directly one last time to be sure.
    import pyodbc
    import os
    from dotenv import load_dotenv
    load_dotenv("backend/.env")
    
    conn = pyodbc.connect(
        r'DRIVER={ODBC Driver 17 for SQL Server};SERVER=.\SQLEXPRESS;DATABASE=attendance_db;Trusted_Connection=yes;'
    )
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    count = cursor.fetchone()[0]
    print(f"Users in SQL Server: {count}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
