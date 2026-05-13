
import sys
import os
sys.path.append(os.getcwd())
from backend.models.database import SessionLocal
from backend.models.schemas import User
from sqlalchemy import text

def normalize_roles():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        for user in users:
            old_role = user.role
            new_role = old_role.upper()
            if old_role != new_role:
                print(f"Updating user {user.email}: {old_role} -> {new_role}")
                user.role = new_role
        db.commit()
        print("Role normalization complete.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    normalize_roles()
