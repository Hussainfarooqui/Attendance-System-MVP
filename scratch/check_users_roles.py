import sqlalchemy as sa
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
engine = sa.create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    res = conn.execute(sa.text('SELECT email, role FROM users'))
    users = [dict(row._mapping) for row in res]
    print(users)
