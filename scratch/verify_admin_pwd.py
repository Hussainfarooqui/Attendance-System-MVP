import sqlalchemy as sa
from backend.services import auth_service
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
engine = sa.create_engine(os.getenv('DATABASE_URL'))

def verify_admin():
    with engine.connect() as conn:
        res = conn.execute(sa.text("SELECT password_hash FROM users WHERE email='admin@iqra.edu.pk'"))
        pwd_hash = res.scalar()
        if not pwd_hash:
            print("Admin user not found!")
            return
        
        print(f"Testing password 'admin123' against hash {pwd_hash[:15]}...")
        result = auth_service.verify_password("admin123", pwd_hash)
        print(f"Verification Result: {result}")

if __name__ == "__main__":
    verify_admin()
