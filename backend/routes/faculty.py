from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from ..models import database, schemas
from ..services import auth_service, attendance_service
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/faculty", tags=["Faculty"])

class SessionStart(BaseModel):
    course_id: int
    room_id: int
    week_number: int
    session_number: int

class AttendanceOverride(BaseModel):
    session_id: int
    student_id: str
    new_status: schemas.AttendanceStatus
    reason: str

@router.get("/courses")
def get_my_courses(db: Session = Depends(database.get_db), faculty: schemas.User = Depends(auth_service.check_faculty)):
    if faculty.role == schemas.UserRole.ADMIN:
        return db.query(schemas.Course).all()
    return db.query(schemas.Course).filter(schemas.Course.faculty_id == faculty.id).all()

@router.post("/sessions/start")
async def start_session(
    data: SessionStart, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(database.get_db), 
    faculty: schemas.User = Depends(auth_service.check_faculty)
):
    # Create session
    new_session = schemas.Session(
        course_id=data.course_id,
        room_id=data.room_id,
        week_number=data.week_number,
        session_number=data.session_number,
        actual_start_time=datetime.now()
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    # Pre-create attendance records so the UI shows the student list immediately
    enrolled_students = db.query(schemas.Enrollment).filter(schemas.Enrollment.course_id == data.course_id).all()
    for enrollment in enrolled_students:
        record = schemas.AttendanceRecord(
            session_id=new_session.id,
            student_id=enrollment.student_id,
            hit_1_present=None,
            hit_2_present=None,
            final_status=schemas.AttendanceStatus.ABSENT
        )
        db.add(record)
    db.commit()

    # Schedule hits in background
    background_tasks.add_task(attendance_service.schedule_hits, new_session.id)
    
    return {"status": "success", "session_id": new_session.id, "message": "Attendance session started and hits scheduled."}

@router.get("/sessions/{session_id}/results")
def get_session_results(
    session_id: int, 
    db: Session = Depends(database.get_db), 
    faculty: schemas.User = Depends(auth_service.check_faculty)
):
    results = db.query(schemas.AttendanceRecord).filter(schemas.AttendanceRecord.session_id == session_id).all()
    # Also get student names for display
    student_results = []
    for r in results:
        student = db.query(schemas.Student).filter(schemas.Student.id == r.student_id).first()
        student_results.append({
            "student_id": r.student_id,
            "full_name": student.full_name if student else "Unknown",
            "hit_1": r.hit_1_present,
            "hit_2": r.hit_2_present,
            "status": r.final_status,
            "is_override": r.is_manual_override,
            "reason": r.override_reason
        })
    return student_results

@router.post("/attendance/override")
def override_attendance(
    data: AttendanceOverride, 
    db: Session = Depends(database.get_db), 
    faculty: schemas.User = Depends(auth_service.check_faculty)
):
    record = db.query(schemas.AttendanceRecord).filter(
        schemas.AttendanceRecord.session_id == data.session_id,
        schemas.AttendanceRecord.student_id == data.student_id
    ).first()
    
    if not record:
        record = schemas.AttendanceRecord(
            session_id=data.session_id, 
            student_id=data.student_id
        )
        db.add(record)
    
    record.final_status = data.new_status
    record.is_manual_override = True
    record.override_reason = data.reason
    db.commit()
    return {"status": "success", "message": "Attendance status overridden."}

@router.get("/courses/{course_id}/cumulative")
def get_cumulative_report(
    course_id: int, 
    db: Session = Depends(database.get_db), 
    faculty: schemas.User = Depends(auth_service.check_faculty)
):
    # Get all students enrolled in this course
    enrollments = db.query(schemas.Enrollment).filter(schemas.Enrollment.course_id == course_id).all()
    # Get all sessions for this course
    sessions = db.query(schemas.Session).filter(schemas.Session.course_id == course_id).all()
    session_ids = [s.id for s in sessions]
    
    report = []
    for enr in enrollments:
        student = db.query(schemas.Student).filter(schemas.Student.id == enr.student_id).first()
        # Get attendance records for this student in these sessions
        records = db.query(schemas.AttendanceRecord).filter(
            schemas.AttendanceRecord.session_id.in_(session_ids),
            schemas.AttendanceRecord.student_id == enr.student_id
        ).all()
        
        present_count = sum(1 for r in records if r.final_status == schemas.AttendanceStatus.PRESENT)
        total_sessions = len(session_ids)
        percentage = (present_count / total_sessions * 100) if total_sessions > 0 else 0
        
        report.append({
            "student_id": enr.student_id,
            "full_name": student.full_name if student else "Unknown",
            "total_sessions": total_sessions,
            "present_count": present_count,
            "percentage": f"{percentage:.1f}%",
            "alert": "Below 75%" if percentage < 75 else "Good"
        })
    
    return report
