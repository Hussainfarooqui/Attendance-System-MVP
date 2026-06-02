from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date, Boolean, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    FACULTY = "FACULTY"
    HOD = "HOD"
    DEAN = "DEAN"

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

class Department(Base):
    __tablename__ = "departments"
    code = Column(String(10), primary_key=True, index=True)
    name = Column(String(255))

class HodAssignment(Base):
    __tablename__ = "hod_assignments"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    department_code = Column(String(10), ForeignKey("departments.code"))
    
    user = relationship("User")
    department = relationship("Department")

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

class CourseType(str, enum.Enum):
    TYPE_3HR = "3hr"
    TYPE_1_5HR = "1.5hr"

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(50))
    name = Column(String(255))
    cluster_id = Column(Integer, ForeignKey("clusters.id"), nullable=True)
    faculty_id = Column(Integer, ForeignKey("users.id"))
    total_weeks = Column(Integer, default=16)
    
    semester = Column(String(20), nullable=False)
    department = Column(String(10), ForeignKey("departments.code"), nullable=False)
    slot = Column(String(5), nullable=False, default="-")
    course_type = Column(String(10), nullable=False, default="3hr")
    schedule_days = Column(String(50), nullable=True)
    time_slot = Column(String(50), nullable=True)
    
    cluster = relationship("Cluster", back_populates="courses")
    faculty = relationship("User")
    dept = relationship("Department")

    __table_args__ = (
        UniqueConstraint('code', 'semester', name='uix_course_sem_sec'),
    )

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

class SessionType(str, enum.Enum):
    LECTURE = "lecture"
    LAB = "lab"

class SessionStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONDUCTED = "conducted"
    CANCELLED = "cancelled"

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    room_id = Column(Integer, ForeignKey("classrooms.id"), nullable=True)
    week_number = Column(Integer)
    session_number = Column(Integer)
    session_date = Column(Date, nullable=True)
    session_type = Column(String(20), default="lecture")
    status = Column(String(20), default="scheduled")
    actual_start_time = Column(DateTime, nullable=True)

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

