import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.mongodb import db_manager

def add_test_user():
    if not db_manager.connect():
        print("Failed to connect to MongoDB")
        return
        
    users_collection = db_manager.get_users_collection()
    
    # Check if user exists
    existing_user = users_collection.find_one({"username": "admin"})
    if existing_user:
        print("Test user 'admin' already exists! Updating password to 'admin'")
        users_collection.update_one({"username": "admin"}, {"$set": {"password": "admin"}})
    else:
        user_doc = {
            "username": "admin",
            "password": "admin"
        }
        users_collection.insert_one(user_doc)
        print("Created test user 'admin' with password 'admin'")
        
    db_manager.disconnect()

if __name__ == "__main__":
    add_test_user()
