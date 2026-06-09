import requests
import sys
import random

API_URL = "http://127.0.0.1:8000"

def main():
    print("=== STARTING HOD DEPT ASSIGNMENT ENDPOINT TEST ===")
    
    # 1. Login as Admin
    print("\nLogging in as Admin...")
    login_res = requests.post(f"{API_URL}/api/auth/login", data={
        "username": "admin@iqra.edu.pk",
        "password": "admin123"
    })
    if login_res.status_code != 200:
        print(f"Error: Admin login failed (status={login_res.status_code}). Detail: {login_res.text}")
        sys.exit(1)
        
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Admin login successful!")

    rand_id = random.randint(1000, 9999)
    email_bad = f"hod_bad_{rand_id}@iqra.edu.pk"
    email_good = f"hod_good_{rand_id}@iqra.edu.pk"

    # 2. Try to create HOD user WITHOUT department_code (Should fail)
    print(f"\nAttempting to create HOD without department code ({email_bad})...")
    user_data_bad = {
        "full_name": "Test HOD Bad",
        "email": email_bad,
        "password": "password123",
        "role": "HOD"
    }
    res_bad = requests.post(f"{API_URL}/api/admin/users", headers=headers, json=user_data_bad)
    print(f"Status code received: {res_bad.status_code}")
    assert res_bad.status_code == 400
    print(f"Error message: {res_bad.json()['detail']}")
    assert "Department Code is required for HOD" in res_bad.json()['detail']
    
    # 3. Create HOD user WITH department_code (Should succeed)
    print(f"\nAttempting to create HOD with department code 'CS' ({email_good})...")
    user_data_good = {
        "full_name": "Test HOD Good",
        "email": email_good,
        "password": "password123",
        "role": "HOD",
        "department_code": "CS"
    }
    res_good = requests.post(f"{API_URL}/api/admin/users", headers=headers, json=user_data_good)
    print(f"Status code received: {res_good.status_code}")
    assert res_good.status_code == 200
    new_user = res_good.json()
    new_user_id = new_user["id"]
    print(f"HOD created successfully! User ID = {new_user_id}")

    # 4. Verify in the users list
    print("\nFetching users list...")
    res_list = requests.get(f"{API_URL}/api/admin/users", headers=headers)
    assert res_list.status_code == 200
    users = res_list.json()
    
    found_hod = None
    for u in users:
        if u["id"] == new_user_id:
            found_hod = u
            break
            
    assert found_hod is not None
    print(f"Found created HOD user in list: {found_hod['full_name']}")
    print(f"Department code in list: '{found_hod['department_code']}'")
    assert found_hod["department_code"] == "CS"

    # 5. Delete the HOD user (Should succeed)
    print(f"\nDeleting HOD user (ID={new_user_id})...")
    res_del = requests.delete(f"{API_URL}/api/admin/users/{new_user_id}", headers=headers)
    print(f"Status code received: {res_del.status_code}")
    assert res_del.status_code == 200
    print("User deleted successfully!")
    
    # 6. Verify HOD is removed from user list
    res_list_2 = requests.get(f"{API_URL}/api/admin/users", headers=headers)
    assert not any(u["id"] == new_user_id for u in res_list_2.json())
    print("Verified HOD user no longer exists in users list.")

    print("\n=== ALL HOD DEPT ASSIGNMENT TESTS PASSED SUCCESSFULLY! ===")

if __name__ == '__main__':
    main()
