import sqlite3

try:
    conn = sqlite3.connect('attendance_mvp.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"Tables in SQLite: {tables}")
    
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
        count = cursor.fetchone()[0]
        print(f"Table {table[0]}: {count} rows")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
