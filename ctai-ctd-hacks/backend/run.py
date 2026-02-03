#!/usr/bin/env python3
"""
Production runner for Smart Buy Dashboard Backend
"""
import os
import uvicorn
from main import app

if __name__ == "__main__":
    # Get configuration from environment variables
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("RELOAD", "false").lower() == "true"
    
    # Run the server
    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )
