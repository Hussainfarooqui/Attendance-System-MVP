import sys
import os
sys.path.append(os.getcwd())

from backend.models import database, schemas
from sqlalchemy.orm import Session

def main():
    db = Session(database.engine)
    try:
        classrooms = db.query(schemas.Classroom).all()
        print(f"Total classrooms: {len(classrooms)}")
        for cr in classrooms:
            print(f"Classroom: ID={cr.id}, Room Number={cr.room_number}, Camera={cr.camera_url}")
            
        sessions = db.query(schemas.Session).all()
        print(f"Total sessions: {len(sessions)}")
        for s in sessions:
            print(f"Session: ID={s.id}, Course ID={s.course_id}, Room ID={s.room_id}, Status={s.status}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    main()
