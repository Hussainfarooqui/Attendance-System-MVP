import sys
import os
sys.path.append(os.getcwd())

from backend.models import database, schemas

print("Attempting to drop all tables...")
try:
    schemas.Base.metadata.drop_all(bind=database.engine)
    print("Tables dropped successfully.")
except Exception as e:
    print(f"Error dropping tables: {e}")

print("Attempting to recreate all tables...")
try:
    schemas.Base.metadata.create_all(bind=database.engine)
    print("Tables created successfully.")
    
    # Seed an admin user
    from backend.services.auth_service import get_password_hash
    from sqlalchemy.orm import Session
    
    with Session(database.engine) as session:
        admin_email = "admin@iqra.edu.pk"
        existing_admin = session.query(schemas.User).filter(schemas.User.email == admin_email).first()
        if not existing_admin:
            print("Seeding default admin user...")
            admin_user = schemas.User(
                full_name="System Administrator",
                email=admin_email,
                password_hash=get_password_hash("admin123"),
                role="ADMIN"
            )
            session.add(admin_user)
            session.commit()
            print(f"Created admin user: {admin_email} / admin123")
except Exception as e:
    print(f"Error creating tables: {e}")
