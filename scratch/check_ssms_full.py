
import sys
import os
sys.path.append(os.getcwd())

from backend.models.database import engine
from sqlalchemy import inspect

def check_ssms():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables in SSMS: {tables}")
    
    from backend.models.database import SessionLocal
    from sqlalchemy import text
    
    db = SessionLocal()
    try:
        for table in tables:
            result = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            print(f"Table {table}: {result} rows")
    finally:
        db.close()

if __name__ == "__main__":
    check_ssms()
