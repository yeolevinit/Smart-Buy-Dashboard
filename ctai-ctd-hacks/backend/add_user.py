import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pymongo import MongoClient
from datetime import datetime
import hashlib
import secrets

def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    """
    Hash a password with a salt.
    If no salt is provided, generate a new one.
    Returns tuple of (hashed_password, salt)
    """
    if salt is None:
        salt = secrets.token_hex(16)
    
    # Combine password and salt
    salted_password = password + salt
    
    # Hash the salted password
    hashed = hashlib.sha256(salted_password.encode()).hexdigest()
    
    return hashed, salt

def add_admin_user():
    """Add admin user to MongoDB"""
    # MongoDB connection
    client = MongoClient('mongodb+srv://vebs:vebs#23@ctd.gnfgh2l.mongodb.net/?retryWrites=true&w=majority&appName=ctd')
    db = client['smartbuy_dashboard']
    users_collection = db['users']
    
    # Check if user already exists
    existing_user = users_collection.find_one({"username": "admin"})
    if existing_user:
        print("Admin user already exists!")
        return
    
    # Hash the password
    password = "admin@123"
    hashed_password, salt = hash_password(password)
    password_hash = f"{hashed_password}:{salt}"
    
    # Create user document
    user_doc = {
        "username": "admin",
        "email": "admin@example.com",
        "password_hash": password_hash,
        "created_at": datetime.utcnow()
    }
    
    # Insert user
    result = users_collection.insert_one(user_doc)
    print(f"User 'admin' created successfully with ID: {result.inserted_id}")

if __name__ == "__main__":
    add_admin_user()