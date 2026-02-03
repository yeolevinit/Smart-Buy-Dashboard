#!/usr/bin/env python3
"""
Start script for Smart Buy Dashboard API
"""

import sys
import os
import logging

# Add the backend directory to the path
backend_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_path)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Start the FastAPI server"""
    try:
        logger.info("Starting Smart Buy Dashboard API...")
        logger.info(f"Backend path: {backend_path}")
        
        # Import and run the main application
        from main import app
        import uvicorn
        
        # Check if MongoDB is available
        try:
            from database.mongodb import db_manager
            from models.database_models import ProjectModel
            from database.crud import get_all_projects
            logger.info("MongoDB components are available")
        except ImportError as e:
            logger.warning(f"MongoDB components not available: {e}")
        
        # Run the server
        port = int(os.environ.get("PORT", 8000))
        logger.info(f"Starting server on port {port}")
        uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
        
    except Exception as e:
        logger.error(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()