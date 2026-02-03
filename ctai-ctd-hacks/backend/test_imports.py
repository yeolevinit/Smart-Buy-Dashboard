#!/usr/bin/env python3
"""
Test script to verify all required imports work correctly
This helps identify import issues during deployment
"""

def test_imports():
    """Test all imports needed for the application"""
    imports = {
        'fastapi': 'from fastapi import FastAPI',
        'uvicorn': 'import uvicorn',
        'pymongo': 'import pymongo',
        'python-dotenv': 'from dotenv import load_dotenv',
        'beautifulsoup4': 'from bs4 import BeautifulSoup',
        'requests': 'import requests',
        'fake-useragent': 'from fake_useragent import UserAgent',
        'pydantic': 'from pydantic import BaseModel',
        'logging': 'import logging',
        'os': 'import os',
        'sys': 'import sys',
        'datetime': 'from datetime import datetime',
        'typing': 'from typing import List, Optional',
        'bson': 'from bson import ObjectId',
        're': 'import re',
        'time': 'import time',
        'random': 'import random'
    }
    
    # Test external imports
    failed_imports = []
    successful_imports = []
    
    for package, import_statement in imports.items():
        try:
            exec(import_statement)
            successful_imports.append(package)
            print(f"✓ {package}")
        except Exception as e:
            failed_imports.append((package, str(e)))
            print(f"✗ {package}: {e}")
    
    # Test local imports
    local_imports = {
        'database.mongodb': 'from database.mongodb import db_manager',
        'models.database_models': 'from models.database_models import ProjectModel',
        'database.crud': 'from database.crud import create_project'
    }
    
    for module, import_statement in local_imports.items():
        try:
            exec(import_statement)
            successful_imports.append(module)
            print(f"✓ {module}")
        except Exception as e:
            failed_imports.append((module, str(e)))
            print(f"✗ {module}: {e}")
    
    print(f"\nSummary:")
    print(f"Successful imports: {len(successful_imports)}")
    print(f"Failed imports: {len(failed_imports)}")
    
    if failed_imports:
        print("\nFailed imports:")
        for package, error in failed_imports:
            print(f"  {package}: {error}")
        return False
    else:
        print("\nAll imports successful!")
        return True

if __name__ == "__main__":
    test_imports()