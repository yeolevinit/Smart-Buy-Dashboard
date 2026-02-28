from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import logging

logger = logging.getLogger(name)

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    try:
        logger.info("Connecting to MongoDB...")
        db_instance.client = AsyncIOMotorClient(settings.MONGODB_CONNECTION_STRING)
        await db_instance.client.admin.command('ping')
        db_instance.db = db_instance.client[settings.MONGODB_DATABASE_NAME]
        logger.info(f"Successfully connected to {settings.MONGODB_DATABASE_NAME}")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        raise e

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    return db_instance.db