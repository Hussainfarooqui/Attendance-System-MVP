import sys
import os
sys.path.append(os.getcwd())

from backend.models import database, schemas
from sqlalchemy.orm import Session

def main():
    db = Session(database.engine)
    try:
        users = db.query(schemas.User).all()
        print(f"Total users: {len(users)}")
        for u in users:
            print(f"User: ID={u.id}, Email={u.email}, Role={u.role}, Name={u.full_name}")
            
        courses = db.query(schemas.Course).all()
        print(f"Total courses: {len(courses)}")
        for c in courses:
            print(f"Course: ID={c.id}, Code={c.code}, Name={c.name}, Faculty ID={c.faculty_id}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    main()
