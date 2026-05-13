import sqlalchemy as sa
from backend.models import schemas, database
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
engine = sa.create_engine(os.getenv('DATABASE_URL'))

def test_enrollments_api_logic():
    db = next(database.get_db())
    enrollments = db.query(schemas.Enrollment).all()
    print(f"Total Enrollments queried: {len(enrollments)}")
    for e in enrollments[:5]:
        student = db.query(schemas.Student).filter(schemas.Student.id == e.student_id).first()
        course = db.query(schemas.Course).filter(schemas.Course.id == e.course_id).first()
        print(f"E: {e.student_id} -> {e.course_id} | S: {student.full_name if student else 'None'} | C: {course.name if course else 'None'}")

if __name__ == "__main__":
    test_enrollments_api_logic()
