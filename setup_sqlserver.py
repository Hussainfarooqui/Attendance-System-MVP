import pyodbc

conn = pyodbc.connect(
    r'DRIVER={ODBC Driver 17 for SQL Server};SERVER=.\SQLEXPRESS;Trusted_Connection=yes;',
    autocommit=True
)
cursor = conn.cursor()

# Create database if it doesn't exist
cursor.execute("""
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name='attendance_db')
    CREATE DATABASE attendance_db
""")
print("Database 'attendance_db' created/verified on SQL Server Express!")
conn.close()
