import sqlalchemy as sa
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
from backend.models import schemas, database
from backend.services import auth_service

load_dotenv('backend/.env')

def test_create_user():
    db = next(database.get_db())
    email = "test_new_user@iqra.edu.pk"
    
    # Check if exists
    existing = db.query(schemas.User).filter(schemas.User.email == email).first()
    if existing:
        print(f"User {email} already exists, deleting for test...")
        db.delete(existing)
        db.commit()
    
    try:
        print(f"Attempting to create user {email}...")
        hashed_password = auth_service.get_password_hash("password123")
        new_user = schemas.User(
            full_name="Test User",
            email=email,
            password_hash=hashed_password,
            role="FACULTY"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"Successfully created user with ID: {new_user.id}")
    except Exception as e:
        print(f"FAILED to create user: {e}")
        db.rollback()

if __name__ == "__main__":
    test_create_user()
