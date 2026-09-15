import requests

BASE_URL = "http://localhost:8080/api"

# Health
r = requests.get(f"{BASE_URL.replace('/api', '/health')}")
print(f"Health: {r.status_code} {r.text}")

# Register
session = requests.Session()
import random
username = f"test_{random.randint(1,1000)}"
email = f"{username}@example.com"
r = session.post(f"{BASE_URL}/auth/register", json={
    "username": username,
    "email": email,
    "password": "password123",
    "confirm_password": "password123"
})
print(f"Register: {r.status_code} {r.text}")

# Login
r = session.post(f"{BASE_URL}/auth/login", json={
    "email": email,
    "password": "password123"
})
print(f"Login: {r.status_code} {r.text}")

# Me
r = session.get(f"{BASE_URL}/auth/me")
print(f"Me: {r.status_code} {r.text}")

# Logout
r = session.post(f"{BASE_URL}/auth/logout")
print(f"Logout: {r.status_code} {r.text}")
