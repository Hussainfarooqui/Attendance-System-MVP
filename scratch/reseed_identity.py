import sqlalchemy as sa
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
engine = sa.create_engine(os.getenv('DATABASE_URL'))

tables = ['users', 'courses', 'enrollments', 'sessions', 'attendance_records']

with engine.connect() as conn:
    for table in tables:
        try:
            # Check if table has identity column and what's the max ID
            res = conn.execute(sa.text(f"SELECT MAX(id) FROM {table}"))
            max_id = res.scalar()
            if max_id is not None:
                print(f"Reseeding {table} to {max_id}")
                conn.execute(sa.text(f"DBCC CHECKIDENT ('{table}', RESEED, {max_id})"))
            else:
                print(f"Table {table} is empty, no reseed needed.")
        except Exception as e:
            print(f"Error reseeding {table}: {e}")
    conn.commit()
