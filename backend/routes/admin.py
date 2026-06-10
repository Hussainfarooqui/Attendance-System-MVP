from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
import json
from ..models import database, schemas
from ..services import auth_service, ai_service
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["Admin"])

class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role: schemas.UserRole
    department_code: Optional[str] = None

class StudentCreate(BaseModel):
    id: str
    full_name: str
    image_path: Optional[str] = None
    face_embedding: Optional[list] = None

class ClusterCreate(BaseModel):
    name: str

class CourseAssign(BaseModel):
    course_id: int
    faculty_id: int

class AcademicEnrollment(BaseModel):
    student_id: str
    course_id: int

@router.post("/users")
def create_user(user: UserCreate, db: Session = Depends(database.get_db), admin: schemas.User = Depends(auth_service.check_admin)):
    db_user = db.query(schemas.User).filter(schemas.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check Associate Dean uniqueness
    if user.role == schemas.UserRole.ASSOCIATE_DEAN:
        existing_ad = db.query(schemas.User).filter(schemas.User.role == schemas.UserRole.ASSOCIATE_DEAN).first()
        if existing_ad:
            raise HTTPException(status_code=400, detail="An Associate Dean already exists. Only one is allowed.")
            
    # Check HOD department requirement
    if user.role == schemas.UserRole.HOD:
        if not user.department_code:
            raise HTTPException(status_code=400, detail="Department Code is required for HOD")
        
        # Ensure department exists
        dept = db.query(schemas.Department).filter(schemas.Department.code == user.department_code).first()
        if not dept:
            dept = schemas.Department(code=user.department_code, name=user.department_code)
            db.add(dept)
            db.flush()

    hashed_password = auth_service.get_password_hash(user.password)
    new_user = schemas.User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role
    )
    db.add(new_user)
    db.flush()

    if user.role == schemas.UserRole.HOD:
        hod_assignment = schemas.HodAssignment(user_id=new_user.id, department_code=user.department_code)
        db.add(hod_assignment)

    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/users")
def get_users(db: Session = Depends(database.get_db), admin: schemas.User = Depends(auth_service.check_admin)):
    users = db.query(schemas.User).all()
    result = []
    for u in users:
        dept_code = None
        if u.role == schemas.UserRole.HOD:
            assignment = db.query(schemas.HodAssignment).filter(schemas.HodAssignment.user_id == u.id).first()
            if assignment:
                dept_code = assignment.department_code
        result.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at,
            "department_code": dept_code
        })
    return result

@router.post("/students")
def create_student(student: StudentCreate, db: Session = Depends(database.get_db), admin: schemas.User = Depends(auth_service.check_admin)):
    db_student = db.query(schemas.Student).filter(schemas.Student.id == student.id).first()
    if db_student:
        raise HTTPException(status_code=400, detail="Student ID already exists")
    
    new_student = schemas.Student(
        id=student.id,
        full_name=student.full_name,
        image_path=student.image_path,
        face_embedding=json.dumps(student.face_embedding) if student.face_embedding else None
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student

@router.get("/students")
def get_students(db: Session = Depends(database.get_db), admin: schemas.User = Depends(auth_service.check_admin)):
    return db.query(schemas.Student).all()

@router.post("/enroll-student")
async def enroll_student(
    student_id: str = Form(...), 
    full_name: str = Form(...),
    file: Optional[UploadFile] = File(None), 
    db: Session = Depends(database.get_db), 
    admin: schemas.User = Depends(auth_service.check_admin)
):
    embedding = None
    file_path = None

    if file:
        # Read image
        contents = await file.read()
        
        # Generate embedding
        ai = ai_service.get_ai_engine()
        embedding = ai.get_face_embedding(contents)
        
        if embedding is None:
            raise HTTPException(status_code=400, detail="No face detected in the image")
        
        # Save image file
        file_ext = file.filename.split(".")[-1]
        file_name = f"{student_id}_{uuid.uuid4().hex}.{file_ext}"
        upload_dir = "backend/uploads/profiles"
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        file_path = os.path.join(upload_dir, file_name)
        
        with open(file_path, "wb") as f:
            f.write(contents)
    
    # Save to DB
    db_student = db.query(schemas.Student).filter(schemas.Student.id == student_id).first()
    if db_student:
        db_student.full_name = full_name
        if file_path: db_student.image_path = file_path
        if embedding: db_student.face_embedding = json.dumps(embedding)
    else:
        db_student = schemas.Student(
            id=student_id,
            full_name=full_name,
            image_path=file_path,
            face_embedding=json.dumps(embedding) if embedding else None
        )
        db.add(db_student)
    
    db.commit()
    db.refresh(db_student)
    return {"status": "success", "student_id": student_id, "has_biometric": embedding is not None}

@router.post("/clusters")
def create_cluster(cluster: ClusterCreate, db: Session = Depends(database.get_db), admin: schemas.User = Depends(auth_service.check_admin)):
    new_cluster = schemas.Cluster(name=cluster.name)
    db.add(new_cluster)
    db.commit()
    db.refresh(new_cluster)
    return new_cluster

@router.post("/assign-course")
def assign_course(data: CourseAssign, db: Session = Depends(database.get_db), admin: schemas.User = Depends(auth_service.check_admin)):
    course = db.query(schemas.Course).filter(schemas.Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    faculty = db.query(schemas.User).filter(schemas.User.id == data.faculty_id, schemas.User.role == schemas.UserRole.FACULTY).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")
    
    course.faculty_id = data.faculty_id
    db.commit()
    return {"status": "success", "message": f"Course {course.name} assigned to {faculty.full_name}"}

@router.get("/clusters")
def get_clusters(db: Session = Depends(database.get_db), admin: schemas.User = Depends(auth_service.check_admin)):
    return db.query(schemas.Cluster).all()

# ─── Course Management ────────────────────────────────────────────────────────

class CourseCreate(BaseModel):
    name: str
    code: str
    faculty_id: Optional[int] = None
    semester: str
    department: str
    course_type: str = "3hr"
    schedule_days: Optional[str] = None
    time_slot: Optional[str] = None

@router.get("/courses")
def get_courses(db: Session = Depends(database.get_db), current_user: schemas.User = Depends(auth_service.check_leadership)):
    if current_user.role == schemas.UserRole.HOD:
        hod_assignment = db.query(schemas.HodAssignment).filter(schemas.HodAssignment.user_id == current_user.id).first()
        dept_code = hod_assignment.department_code if hod_assignment else None
        courses = db.query(schemas.Course).filter(schemas.Course.department == dept_code).all()
    else:
        courses = db.query(schemas.Course).all()
    
    result = []
    for c in courses:
        faculty = db.query(schemas.User).filter(schemas.User.id == c.faculty_id).first() if c.faculty_id else None
        result.append({
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "semester": c.semester,
            "department": c.department,
            "course_type": c.course_type,
            "schedule_days": c.schedule_days,
            "time_slot": c.time_slot,
            "faculty_id": c.faculty_id,
            "faculty_name": faculty.full_name if faculty else "Unassigned",
        })
    return result

@router.post("/courses")
def create_course(course: CourseCreate, db: Session = Depends(database.get_db), admin: schemas.User = Depends(auth_service.check_admin)):
    dept = db.query(schemas.Department).filter(schemas.Department.code == course.department).first()
    if not dept:
        dept = schemas.Department(code=course.department, name=course.department)
        db.add(dept)
        db.flush()
        
    existing = db.query(schemas.Course).filter(
        schemas.Course.code == course.code,
        schemas.Course.semester == course.semester
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Course with same code and semester already exists")
        
    new_course = schemas.Course(
        name=course.name, 
        code=course.code, 
        faculty_id=course.faculty_id,
        semester=course.semester,
        department=course.department,
        course_type=course.course_type,
        schedule_days=course.schedule_days,
        time_slot=course.time_slot,
        total_weeks=16
    )
    db.add(new_course)
    db.flush()
    
    # Generate sessions based on course type
    total_sessions = 32 if course.course_type == "1.5hr" else 16
    
    for i in range(1, total_sessions + 1):
        # If 32 sessions (2/week), week is ((i-1)//2)+1. If 16 sessions (1/week), week is i.
        week = ((i - 1) // 2) + 1 if total_sessions == 32 else i
        session = schemas.Session(
            course_id=new_course.id,
            week_number=week,
            session_number=i,
            session_type="lecture",
            status="scheduled"
        )
        db.add(session)
        
    db.commit()
    db.refresh(new_course)
    return new_course

# ─── Academic Enrollment ──────────────────────────────────────────────────────

@router.post("/enroll-academic")
def enroll_academic(data: AcademicEnrollment, db: Session = Depends(database.get_db), admin: schemas.User = Depends(auth_service.check_admin)):
    existing = db.query(schemas.Enrollment).filter(
        schemas.Enrollment.student_id == data.student_id,
        schemas.Enrollment.course_id == data.course_id
    ).first()
    if existing:
        return {"status": "info", "message": "Student already enrolled in this course"}
    
    new_enrollment = schemas.Enrollment(student_id=data.student_id, course_id=data.course_id)
    db.add(new_enrollment)
    db.commit()
    return {"status": "success", "message": "Student enrolled in course successfully"}

@router.get("/enrollments")
def get_enrollments(db: Session = Depends(database.get_db), admin: schemas.User = Depends(auth_service.check_admin)):
    enrollments = db.query(schemas.Enrollment).all()
    result = []
    for e in enrollments:
        student = db.query(schemas.Student).filter(schemas.Student.id == e.student_id).first()
        course = db.query(schemas.Course).filter(schemas.Course.id == e.course_id).first()
        result.append({
            "student_id": e.student_id,
            "student_name": student.full_name if student else "Unknown",
            "course_id": e.course_id,
            "course_name": course.name if course else "Unknown",
            "course_code": course.code if course else "Unknown"
        })
    return result

# ─── Delete Functionality ──────────────────────────────────────────────────

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db), admin: schemas.User = Depends(auth_service.check_admin)):
    user = db.query(schemas.User).filter(schemas.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is trying to delete themselves
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    
    # Check if user is faculty and assigned to courses
    assigned_courses = db.query(schemas.Course).filter(schemas.Course.faculty_id == user_id).all()
    for course in assigned_courses:
        course.faculty_id = None  # Unassign faculty instead of deleting course
    
    # Delete related HOD assignment if exists
    db.query(schemas.HodAssignment).filter(schemas.HodAssignment.user_id == user_id).delete()
    
    db.delete(user)
    db.commit()
    return {"status": "success", "message": f"User {user.full_name} deleted successfully"}

@router.delete("/students/{student_id}")
def delete_student(student_id: str, db: Session = Depends(database.get_db), admin: schemas.User = Depends(auth_service.check_admin)):
    student = db.query(schemas.Student).filter(schemas.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Delete related enrollments and attendance records first
    db.query(schemas.Enrollment).filter(schemas.Enrollment.student_id == student_id).delete()
    db.query(schemas.AttendanceRecord).filter(schemas.AttendanceRecord.student_id == student_id).delete()
    
    db.delete(student)
    db.commit()
    return {"status": "success", "message": f"Student {student.full_name} deleted successfully"}
@router.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(database.get_db), admin: schemas.User = Depends(auth_service.check_admin)):
    course = db.query(schemas.Course).filter(schemas.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Delete related enrollments, sessions, and attendance records first
    db.query(schemas.Enrollment).filter(schemas.Enrollment.course_id == course_id).delete()
    
    sessions = db.query(schemas.Session).filter(schemas.Session.course_id == course_id).all()
    session_ids = [s.id for s in sessions]
    db.query(schemas.AttendanceRecord).filter(schemas.AttendanceRecord.session_id.in_(session_ids)).delete()
    db.query(schemas.Session).filter(schemas.Session.course_id == course_id).delete()
    
    db.delete(course)
    db.commit()
    return {"status": "success", "message": f"Course {course.name} deleted successfully"}
