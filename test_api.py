import requests
import json

BASE_URL = "http://127.0.0.1:5000"

print("Starting automated API and Database verification...")

# Create a session to maintain cookies
session = requests.Session()

# 1. Register a test user
print("\n--- Test 1: Registering new student ---")
register_payload = {
    "name": "Jane Smith",
    "email": "jane.smith@apex.edu",
    "password": "password123",
    "department": "Computer Science"
}
res = session.post(f"{BASE_URL}/api/auth/register", json=register_payload)
print(f"Status Code: {res.status_code}")
try:
    print(res.json())
except Exception:
    print(res.text)

if res.status_code not in [201, 409]:
    print("Failed to register!")
    exit(1)

# If user already exists, let's login
if res.status_code == 409:
    print("\nAccount already exists. Logging in...")
    login_payload = {
        "email": "jane.smith@apex.edu",
        "password": "password123"
    }
    res = session.post(f"{BASE_URL}/api/auth/login", json=login_payload)
    print(f"Status Code: {res.status_code}")
    print(res.json())

# 2. Get list of courses
print("\n--- Test 2: Getting courses ---")
res = session.get(f"{BASE_URL}/api/courses")
print(f"Status Code: {res.status_code}")
courses = res.json()
print(f"Found {len(courses)} courses in catalog.")

# Let's map course code to course_id
course_map = {c['course_code']: c for c in courses}
print("Available course codes:", list(course_map.keys()))

# 3. Get my current enrollments
print("\n--- Test 3: Get current enrollments ---")
res = session.get(f"{BASE_URL}/api/enrollments/my-courses")
my_courses = res.json()
print("My courses:", my_courses)
current_credits = my_courses.get('total_credits', 0)

# Clear enrollments if any exists to start tests fresh
if my_courses.get('courses'):
    print("Clearing pre-existing enrollments for clean test...")
    for c in my_courses['courses']:
        session.post(f"{BASE_URL}/api/enrollments/drop", json={"course_id": c['course_id']})
    res = session.get(f"{BASE_URL}/api/enrollments/my-courses")
    my_courses = res.json()
    print("Cleared courses. Current credits:", my_courses.get('total_credits', 0))
    current_credits = 0

# 4. Enroll in CS-101 (4 credits)
print("\n--- Test 4: Enrolling in CS-101 ---")
cs101_id = course_map['CS-101']['course_id']
res = session.post(f"{BASE_URL}/api/enrollments/register", json={"course_id": cs101_id})
print(f"Status Code: {res.status_code}")
print(res.json())
assert res.status_code == 200, "Should successfully register"

# 5. Try enrolling in CS-101 again (should fail)
print("\n--- Test 5: Try duplicate enrollment in CS-101 ---")
res = session.post(f"{BASE_URL}/api/enrollments/register", json={"course_id": cs101_id})
print(f"Status Code: {res.status_code}")
print(res.json())
assert res.status_code == 409, "Should fail with duplicate block (409)"

# 6. Check credit limit by enrolling in many courses
# CS-101 (4), CS-201 (4), CS-301 (4), CS-401 (4) = 16 credits.
# Adding PHYS-101 (4) would be 20 credits (limit is 18).
print("\n--- Test 6: Enrolling up to credit limit (18 cr) ---")
for code in ['CS-201', 'CS-301', 'CS-401']:
    c_id = course_map[code]['course_id']
    res = session.post(f"{BASE_URL}/api/enrollments/register", json={"course_id": c_id})
    print(f"Enrolled in {code}: {res.status_code} - {res.json().get('message', res.json().get('error'))}")

# Get status
res = session.get(f"{BASE_URL}/api/enrollments/my-courses")
print("Status after 4 courses:", res.json())

# Now try PHYS-101 (4 credits) - should fail due to credit limit!
print("\n--- Test 7: Exceeding credit limit (PHYS-101 - 4 credits) ---")
phys_id = course_map['PHYS-101']['course_id']
res = session.post(f"{BASE_URL}/api/enrollments/register", json={"course_id": phys_id})
print(f"Status Code: {res.status_code}")
print(res.json())
assert res.status_code == 400, "Should block enrollment due to credit limit"

# Try MATH-101 (3 credits) - should also fail (16 + 3 = 19 > 18)
print("\n--- Test 8: Exceeding credit limit (MATH-101 - 3 credits) ---")
math_id = course_map['MATH-101']['course_id']
res = session.post(f"{BASE_URL}/api/enrollments/register", json={"course_id": math_id})
print(f"Status Code: {res.status_code}")
print(res.json())
assert res.status_code == 400, "Should block enrollment due to credit limit"

# 9. Drop CS-101 and register again
print("\n--- Test 9: Dropping CS-101 ---")
res = session.post(f"{BASE_URL}/api/enrollments/drop", json={"course_id": cs101_id})
print(f"Status Code: {res.status_code}")
print(res.json())
assert res.status_code == 200, "Should successfully drop CS-101"

# Check status
res = session.get(f"{BASE_URL}/api/enrollments/my-courses")
print("Status after drop:", res.json())
assert res.json()['total_credits'] == 12, "Credits should decrease to 12"

print("\nAll automated backend checks completed successfully! The database constraints and transactional boundaries function exactly as designed.")
