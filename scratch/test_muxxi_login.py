import sqlalchemy as sa
import os
from dotenv import load_dotenv
from backend.services import auth_service

load_dotenv('backend/.env')
engine = sa.create_engine(os.getenv('DATABASE_URL'))

def test_muxxi_login():
    with engine.connect() as conn:
        res = conn.execute(sa.text("SELECT password_hash FROM users WHERE email='muxxi@gmail.com'"))
        pwd_hash = res.scalar()
        print(f"Hash: {pwd_hash}")
        
        # Test with common passwords if known, or just check hash format
        if pwd_hash:
            if pwd_hash.startswith('$2b$'):
                print("Format: bcrypt")
            elif pwd_hash.startswith('$pbkdf2-sha256$'):
                print("Format: pbkdf2")
            else:
                print("Format: Unknown")
            
            # Try a dummy verify to see if it crashes
            try:
                auth_service.verify_password("password123", pwd_hash)
                print("Verify call succeeded (even if result is False)")
            except Exception as e:
                print(f"Verify call CRASHED: {e}")

if __name__ == "__main__":
    test_muxxi_login()
