import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import hashlib
import secrets

# Load environment variables
load_dotenv()

# Get connection string
connection_string = os.getenv('MONGODB_CONNECTION_STRING')
database_name = os.getenv('MONGODB_DATABASE_NAME', 'smartbuy_dashboard')

def hash_password(password: str, salt: str = None) -> tuple:
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

try:
    # Connect to MongoDB
    client = MongoClient(
        connection_string,
        serverSelectionTimeoutMS=5000  # 5 second timeout
    )
    client.admin.command('ping')
    print("MongoDB connection successful!")
    
    # Access the database and users collection
    db = client[database_name]
    users_collection = db['users']
    
    # Find the admin user
    user = users_collection.find_one({"username": "admin"})
    if user:
        print(f"Found user: {user}")
        
        # Hash the password
        hashed_password, salt = hash_password("admin@123")
        password_hash = f"{hashed_password}:{salt}"
        
        # Update the user with required fields
        result = users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "email": "admin@example.com",
                    "password_hash": password_hash
                }
            }
        )
        
        if result.modified_count > 0:
            print("User updated successfully!")
        else:
            print("No changes made to user.")
    else:
        print("Admin user not found!")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    if 'client' in locals():
        client.close()