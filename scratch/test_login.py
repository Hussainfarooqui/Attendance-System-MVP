
import requests

def test_login():
    url = "http://localhost:8000/api/auth/login"
    data = {
        "username": "hussain@gmail.com",
        "password": "password123"  # Just guessing a default
    }
    try:
        response = requests.post(url, data=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()
