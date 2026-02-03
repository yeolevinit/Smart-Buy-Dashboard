import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

# Load environment variables
load_dotenv()

# Get connection string
connection_string = os.getenv('MONGODB_CONNECTION_STRING')
database_name = os.getenv('MONGODB_DATABASE_NAME', 'smartbuy_dashboard')

try:
    # Test the connection
    client = MongoClient(
        connection_string,
        serverSelectionTimeoutMS=5000  # 5 second timeout
    )
    client.admin.command('ping')
    print("MongoDB connection successful!")
    
    # Access the database and users collection
    db = client[database_name]
    users_collection = db['users']
    
    # Find all users
    users = list(users_collection.find())
    print(f"Found {len(users)} users in the database:")
    
    for user in users:
        print(f"- Username: {user.get('username')}, Email: {user.get('email')}, Created: {user.get('created_at')}")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'client' in locals():
        client.close()