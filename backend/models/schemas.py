from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    FACULTY = "Faculty"

class AttendanceStatus(str, enum.Enum):
    PRESENT = "Present"
    ABSENT = "Absent"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(Enum(UserRole))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Cluster(Base):
    __tablename__ = "clusters"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    courses = relationship("Course", back_populates="cluster")

class Classroom(Base):
    __tablename__ = "classrooms"
    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String, unique=True)
    camera_url = Column(String)

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True)
    name = Column(String)
    cluster_id = Column(Integer, ForeignKey("clusters.id"))
    faculty_id = Column(Integer, ForeignKey("users.id"))
    total_weeks = Column(Integer, default=14)
    
    cluster = relationship("Cluster", back_populates="courses")
    faculty = relationship("User")

class Student(Base):
    __tablename__ = "students"
    id = Column(String, primary_key=True)  # University ID
    full_name = Column(String)
    enrollment_date = Column(DateTime(timezone=True), server_default=func.now())
    image_path = Column(String)
    face_embedding = Column(JSON)  # Store 512-d vector

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    room_id = Column(Integer, ForeignKey("classrooms.id"))
    week_number = Column(Integer)
    session_number = Column(Integer)
    actual_start_time = Column(DateTime(timezone=True))

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    student_id = Column(String, ForeignKey("students.id"))
    hit_1_present = Column(Boolean, nullable=True)
    hit_2_present = Column(Boolean, nullable=True)
    final_status = Column(Enum(AttendanceStatus), default=AttendanceStatus.ABSENT)
    is_manual_override = Column(Boolean, default=False)
    override_reason = Column(String, nullable=True)
