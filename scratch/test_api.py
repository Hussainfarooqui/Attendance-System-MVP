import requests

def test_api():
    base_url = "http://127.0.0.1:8000/api"
    
    # 1. Login
    print("Testing Login...")
    login_data = {
        "username": "admin@iqra.edu.pk",
        "password": "password123" # I'll try common passwords
    }
    # Wait, I don't know the password.
    # I'll try to find it in the code or logs.
    # Actually, I'll just check if the endpoint EXISTS.
    
    try:
        res = requests.get(f"{base_url}/health")
        print(f"Health Check: {res.json()}")
        
        # Try to get students WITHOUT auth to see if it returns 401 (correct)
        res = requests.get(f"{base_url}/admin/students")
        print(f"Admin Students (no auth): {res.status_code}")
    except Exception as e:
        print(f"API Error: {e}")

if __name__ == "__main__":
    test_api()
