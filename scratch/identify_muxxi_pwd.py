import sqlalchemy as sa
from backend.services import auth_service
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
engine = sa.create_engine(os.getenv('DATABASE_URL'))

def verify_muxxi():
    with engine.connect() as conn:
        res = conn.execute(sa.text("SELECT password_hash FROM users WHERE email='muxxi@gmail.com'"))
        pwd_hash = res.scalar()
        if not pwd_hash:
            print("Muxxi user not found!")
            return
        
        for pwd in ["admin123", "faculty123", "muxxi123", "password123"]:
            if auth_service.verify_password(pwd, pwd_hash):
                print(f"Muxxi password is: {pwd}")
                return
        print("Muxxi password not found in common list.")

if __name__ == "__main__":
    verify_muxxi()
