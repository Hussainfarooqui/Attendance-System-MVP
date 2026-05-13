
import sys
import os
# Add root to sys.path to import backend modules
sys.path.append(os.getcwd())

from backend.models.database import SessionLocal
from backend.models.schemas import User

def check_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Found {len(users)} users:")
        for user in users:
            print(f"ID: {user.id}, Full Name: {user.full_name}, Email: {user.email}, Role: {user.role}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
