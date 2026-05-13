import sqlalchemy as sa
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
engine = sa.create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    res = conn.execute(sa.text("SELECT COUNT(*) FROM enrollments"))
    print(f"Total Enrollments in DB: {res.scalar()}")
    
    # Check top 5
    res = conn.execute(sa.text("SELECT TOP 5 student_id, course_id FROM enrollments"))
    for row in res:
        print(row)
