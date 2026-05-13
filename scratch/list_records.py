import sqlalchemy as sa
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
engine = sa.create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    print('--- USERS ---')
    res = conn.execute(sa.text('SELECT full_name, email FROM users'))
    for row in res:
        print(f"Name: {row.full_name}, Email: {row.email}")
    
    print('\n--- STUDENTS ---')
    res = conn.execute(sa.text('SELECT id, full_name FROM students'))
    for row in res:
        print(f"ID: {row.id}, Name: {row.full_name}")
