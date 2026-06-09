import sys
import os
sys.path.append(os.getcwd())

from backend.models import database, schemas
from sqlalchemy.orm import Session

def main():
    db = Session(database.engine)
    try:
        # Check if classroom with room_number "Room 101" or ID=1 exists
        classroom = db.query(schemas.Classroom).filter(schemas.Classroom.room_number == "Room 101").first()
        if not classroom:
            print("Creating classroom 'Room 101'...")
            classroom = schemas.Classroom(
                room_number="Room 101",
                camera_url="rtsp://demo:1234@localhost:8554/mystream"
            )
            db.add(classroom)
            db.commit()
            db.refresh(classroom)
            print(f"Classroom created successfully with ID={classroom.id}!")
        else:
            print(f"Classroom already exists: ID={classroom.id}, Room Number={classroom.room_number}")
    except Exception as e:
        db.rollback()
        print(f"Error seeding classroom: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    main()
