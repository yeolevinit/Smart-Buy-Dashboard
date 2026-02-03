from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import logging
from typing import Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MongoDBManager:
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db = None
        self.connection_string = os.getenv('MONGODB_CONNECTION_STRING', 'mongodb://localhost:27017/')
        self.database_name = os.getenv('MONGODB_DATABASE_NAME', 'smartbuy_dashboard')
        self.enabled = os.getenv('MONGODB_ENABLED', 'true').lower() == 'true'
    
    def connect(self):
        """Establish connection to MongoDB"""
        if not self.enabled:
            logger.info("MongoDB is disabled")
            return False
            
        try:
            self.client = MongoClient(
                self.connection_string,
                serverSelectionTimeoutMS=5000  # 5 second timeout
            )
            # Test the connection
            self.client.admin.command('ping')
            self.db = self.client[self.database_name]
            logger.info(f"Successfully connected to MongoDB database: {self.database_name}")
            return True
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.warning(f"Failed to connect to MongoDB: {e}")
            logger.warning("MongoDB features will be disabled")
            return False
        except Exception as e:
            logger.error(f"Unexpected error connecting to MongoDB: {e}")
            return False
    
    def disconnect(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    def get_collection(self, collection_name: str):
        """Get a collection from the database"""
        if self.db is None:
            raise Exception("Database not connected. Call connect() first.")
        return self.db[collection_name]
    
    # Collection getters
    def get_projects_collection(self):
        return self.get_collection('projects')
    
    def get_materials_collection(self):
        return self.get_collection('materials')
    
    def get_vendors_collection(self):
        return self.get_collection('vendors')
    
    def get_procurement_timeline_collection(self):
        return self.get_collection('procurement_timeline')
    
    def get_users_collection(self):
        return self.get_collection('users')
    
    def get_predictions_collection(self):
        return self.get_collection('predictions')
    
    def get_chat_history_collection(self):
        return self.get_collection('chat_history')

# Global instance
db_manager = MongoDBManager()