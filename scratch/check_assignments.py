import sqlalchemy as sa
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
engine = sa.create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    print('--- COURSE ASSIGNMENTS ---')
    res = conn.execute(sa.text('SELECT c.name, u.email FROM courses c LEFT JOIN users u ON c.faculty_id = u.id'))
    for row in res:
        print(f"Course: {row.name}, Faculty: {row.email}")
