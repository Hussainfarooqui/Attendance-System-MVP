import sqlalchemy as sa
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
engine = sa.create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    res = conn.execute(sa.text("SELECT email, password_hash FROM users"))
    for row in res:
        h = row.password_hash
        prefix = h[:15] if h else "None"
        print(f"User: {row.email}, Prefix: {prefix}")
