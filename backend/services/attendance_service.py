import cv2
import numpy as np
import random
from sqlalchemy.orm import Session
from datetime import datetime
import time
from ..models import schemas, database
from .ai_service import get_ai_engine


def _get_fresh_db() -> Session:
    """Open a fresh DB session, fully independent of request scope."""
    return database.SessionLocal()


def process_attendance_hit(session_id: int, hit_number: int):
    """
    Process one attendance hit for a session.
    Opens and closes its own DB session so it is safe to call from a background thread.
    """
    print(f"Starting Attendance Hit {hit_number} for Session {session_id}...")
    db = _get_fresh_db()
    try:
        # 1. Get Session and Room Info
        session = db.query(schemas.Session).filter(schemas.Session.id == session_id).first()
        if not session:
            print(f"Error: Session {session_id} not found.")
            return

        classroom = db.query(schemas.Classroom).filter(schemas.Classroom.id == session.room_id).first()
        camera_url = classroom.camera_url if classroom else None

        # 2. Try to capture a frame from the classroom camera
        print(f"DEBUG: Session {session_id} using Camera URL: '{camera_url}'")
        frame = None
        if camera_url:
            # Handle local webcam (index 0) vs string URL
            if camera_url == "0":
                print("DEBUG: Opening local webcam (0) with DSHOW...")
                cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
            else:
                print(f"DEBUG: Opening camera stream: {camera_url}")
                cap = cv2.VideoCapture(camera_url)
            
            ret, frame = cap.read()
            cap.release()
            
            if not ret:
                print(f"ERROR: Could not capture from '{camera_url}'. Ret was False.")
                frame = None
            else:
                print("DEBUG: Frame captured successfully.")
                # Show the frame on screen for the demo
                cv2.imshow(f"Live Monitoring - Session {session_id}", frame)
                cv2.waitKey(5000) 
                cv2.destroyAllWindows()
        else:
            print("DEBUG: No camera_url found for this classroom.")

        # 3a. DEMO MODE — no real camera, mark randomly
        if frame is None:
            print("Demo Mode: randomly marking students present...")
            enrolled_students = (
                db.query(schemas.Student)
                .join(schemas.Enrollment)
                .filter(schemas.Enrollment.course_id == session.course_id)
                .all()
            )
            for student in enrolled_students:
                record = (
                    db.query(schemas.AttendanceRecord)
                    .filter(
                        schemas.AttendanceRecord.session_id == session_id,
                        schemas.AttendanceRecord.student_id == student.id,
                    )
                    .first()
                )
                if not record:
                    record = schemas.AttendanceRecord(session_id=session_id, student_id=student.id)
                    db.add(record)
                    db.flush()

                present = random.random() > 0.3  # 70 % chance present
                if hit_number == 1:
                    record.hit_1_present = present
                else:
                    record.hit_2_present = present

                record.final_status = (
                    schemas.AttendanceStatus.PRESENT
                    if record.hit_1_present or record.hit_2_present
                    else schemas.AttendanceStatus.ABSENT
                )

            db.commit()
            print(f"Demo Hit {hit_number} complete.")
            return

        # 3b. REAL MODE — use the AI engine
        ai = get_ai_engine()
        
        # ─── Live Monitoring Loop (5 seconds) ───
        # This shows the "Live" feed on the laptop screen as requested
        cap_source = 0 if camera_url == "0" else camera_url
        cap = cv2.VideoCapture(cap_source, cv2.CAP_DSHOW if camera_url == "0" else None)
        
        start_time = time.time()
        final_matched_ids = set()
        last_frame = None

        print(f"DEBUG: Starting 5s live feed for Session {session_id}...")
        while (time.time() - start_time) < 5.0:
            ret, frame = cap.read()
            if not ret:
                break
            
            last_frame = frame.copy()
            # Detect and Annotate in Real-Time
            detection_results = ai.detect_and_embed(frame)
            
            course_id = session.course_id
            enrolled_students = (
                db.query(schemas.Student)
                .join(schemas.Enrollment)
                .filter(schemas.Enrollment.course_id == course_id)
                .all()
            )

            current_frame_matches = []
            for det in detection_results:
                d_emb = det['embedding']
                bbox = det['bbox']
                
                match_found = False
                student_label = "Unknown"
                
                for student in enrolled_students:
                    if not student.face_embedding:
                        continue
                    score = ai.compare_faces(student.face_embedding, d_emb)
                    if score > 0.363:
                        final_matched_ids.add(student.id)
                        student_label = f"{student.full_name} ({student.id})"
                        match_found = True
                        break
                
                color = (0, 255, 0) if match_found else (0, 0, 255)
                x, y, w, h = bbox
                cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                cv2.putText(frame, student_label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

            cv2.imshow(f"IQRA LIVE MONITORING - Session {session_id}", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()

        # ─── Update DB Records ───
        # Reload enrolled students to ensure fresh session
        enrolled_students = (
            db.query(schemas.Student)
            .join(schemas.Enrollment)
            .filter(schemas.Enrollment.course_id == session.course_id)
            .all()
        )

        for student in enrolled_students:
            record = (
                db.query(schemas.AttendanceRecord)
                .filter(
                    schemas.AttendanceRecord.session_id == session_id,
                    schemas.AttendanceRecord.student_id == student.id,
                )
                .first()
            )
            if not record:
                record = schemas.AttendanceRecord(session_id=session_id, student_id=student.id)
                db.add(record)
                db.flush()

            present = student.id in final_matched_ids
            if hit_number == 1:
                record.hit_1_present = present
            else:
                record.hit_2_present = present

            # Calculate final status: Present if either hit was True
            h1 = record.hit_1_present if record.hit_1_present is not None else False
            h2 = record.hit_2_present if record.hit_2_present is not None else False
            
            record.final_status = (
                schemas.AttendanceStatus.PRESENT
                if h1 or h2
                else schemas.AttendanceStatus.ABSENT
            )

        db.commit()
        print(f"Hit {hit_number} complete. {len(final_matched_ids)} students detected.")

    except Exception as exc:
        import traceback
        error_msg = f"ERROR in Hit {hit_number} for Session {session_id}: {exc}\n{traceback.format_exc()}\n"
        print(error_msg)
        with open("backend_error.log", "a") as f:
            f.write(f"[{datetime.now()}] {error_msg}")
        db.rollback()
    finally:
        db.close()


def schedule_hits(session_id: int):
    """
    Called as a FastAPI BackgroundTask.
    Fires Hit 1 after 30s and Hit 2 after 60s total (30s more).
    """
    time.sleep(30)
    process_attendance_hit(session_id, 1)

    time.sleep(30)
    process_attendance_hit(session_id, 2)
