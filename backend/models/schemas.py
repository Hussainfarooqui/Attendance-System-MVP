from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text
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
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(255))
    email = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255))
    role = Column(String(50))  # Store enum as string for SQL Server
    created_at = Column(DateTime, server_default=func.now())

class Cluster(Base):
    __tablename__ = "clusters"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), unique=True)
    courses = relationship("Course", back_populates="cluster")

class Classroom(Base):
    __tablename__ = "classrooms"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    room_number = Column(String(100), unique=True)
    camera_url = Column(String(500))

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(50), unique=True)
    name = Column(String(255))
    cluster_id = Column(Integer, ForeignKey("clusters.id"))
    faculty_id = Column(Integer, ForeignKey("users.id"))
    total_weeks = Column(Integer, default=14)
    
    cluster = relationship("Cluster", back_populates="courses")
    faculty = relationship("User")

class Student(Base):
    __tablename__ = "students"
    id = Column(String(50), primary_key=True)  # University ID
    full_name = Column(String(255))
    enrollment_date = Column(DateTime, server_default=func.now())
    image_path = Column(String(500))
    face_embedding = Column(Text)  # Store as JSON text for SQL Server

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String(50), ForeignKey("students.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    room_id = Column(Integer, ForeignKey("classrooms.id"))
    week_number = Column(Integer)
    session_number = Column(Integer)
    actual_start_time = Column(DateTime)

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    student_id = Column(String(50), ForeignKey("students.id"))
    hit_1_present = Column(Boolean, nullable=True)
    hit_2_present = Column(Boolean, nullable=True)
    final_status = Column(String(50), default="Absent")  # Store enum as string
    is_manual_override = Column(Boolean, default=False)
    override_reason = Column(String(500), nullable=True)

