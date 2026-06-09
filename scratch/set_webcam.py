import sys
import os
sys.path.append(os.getcwd())

from backend.models import database, schemas
from sqlalchemy.orm import Session

def main():
    db = Session(database.engine)
    try:
        classroom = db.query(schemas.Classroom).filter(schemas.Classroom.id == 1).first()
        if classroom:
            print(f"Changing camera_url from '{classroom.camera_url}' to '0'...")
            classroom.camera_url = "0"
            db.commit()
            print("Webcam configured successfully!")
        else:
            print("Classroom with ID=1 not found!")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    main()
