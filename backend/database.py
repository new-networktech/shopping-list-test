import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import logging

logger = logging.getLogger(__name__)

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://admin:mongopass123@mongodb:27017/shopping_list_auth?authSource=admin")

class MongoDB:
    client = None
    db = None

    @classmethod
    def connect(cls):
        """Connect to MongoDB"""
        try:
            cls.client = MongoClient(MONGODB_URL)
            # Test connection
            cls.client.admin.command('ping')
            cls.db = cls.client.get_database()
            logger.info("Successfully connected to MongoDB")
            
            # Create indexes
            cls.db.users.create_index("username", unique=True)
            cls.db.shopping_lists.create_index("user_id")
            
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    @classmethod
    def get_database(cls):
        """Get database instance"""
        if cls.db is None:
            cls.connect()
        return cls.db

    @classmethod
    def close(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed")

