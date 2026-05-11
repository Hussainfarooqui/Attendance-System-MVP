import sqlite3
import pyodbc
from sqlalchemy import create_engine, MetaData, Table, select
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join("backend", ".env")
load_dotenv(dotenv_path=env_path)

# MSSQL Connection
MSSQL_URL = os.getenv("DATABASE_URL")
mssql_engine = create_engine(MSSQL_URL)

# SQLite Connection
sqlite_engine = create_engine("sqlite:///attendance_mvp.db")

# Reflect both databases
metadata_mssql = MetaData()
metadata_mssql.reflect(bind=mssql_engine)

metadata_sqlite = MetaData()
metadata_sqlite.reflect(bind=sqlite_engine)

# Order of tables for migration (respecting foreign keys)
tables_to_migrate = [
    "users",
    "clusters",
    "classrooms",
    "students",
    "courses",
    "enrollments",
    "sessions",
    "attendance_records"
]

def migrate_data():
    with sqlite_engine.connect() as sqlite_conn:
        with mssql_engine.connect() as mssql_conn:
            for table_name in tables_to_migrate:
                print(f"Migrating table: {table_name}...")
                
                # Get tables
                sqlite_table = metadata_sqlite.tables[table_name]
                mssql_table = metadata_mssql.tables[table_name]
                
                # Clear target table first (optional, but good for fresh start)
                # mssql_conn.execute(mssql_table.delete())
                
                # Select data from SQLite
                results = sqlite_conn.execute(select(sqlite_table)).fetchall()
                
                if not results:
                    print(f"  No data found in {table_name}. Skipping.")
                    continue
                
                # Insert data into MSSQL
                # We need to handle identity columns (autoincrement) if they are primary keys
                # pyodbc/MSSQL might need IDENTITY_INSERT ON for some tables if we preserve IDs
                
                data_to_insert = [dict(row._mapping) for row in results]
                
                try:
                    # Try direct insert
                    mssql_conn.execute(mssql_table.insert(), data_to_insert)
                    mssql_conn.commit()
                    print(f"  Successfully migrated {len(results)} rows.")
                except Exception as e:
                    print(f"  Error migrating {table_name}: {e}")
                    # If it fails due to identity, we might need a more complex approach or let them re-generate IDs
                    # But for MVP migration, we usually want to preserve IDs.
                    mssql_conn.rollback()

if __name__ == "__main__":
    migrate_data()
