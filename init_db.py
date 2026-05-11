from backend.models import schemas, database
import os
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join("backend", ".env")
load_dotenv(dotenv_path=env_path)

print(f"Connecting to: {database.DATABASE_URL}")

try:
    schemas.Base.metadata.create_all(bind=database.engine)
    print("All tables created successfully in SQL Server!")
except Exception as e:
    print(f"Error creating tables: {e}")
