#!/usr/bin/env python3
"""
Test script to verify CORS configuration
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_cors_configuration():
    """Test that CORS is properly configured"""
    try:
        from main import app
        from fastapi.middleware.cors import CORSMiddleware
        
        # Check if CORS middleware is installed
        cors_middleware_found = False
        allowed_origins = []
        
        for middleware in app.user_middleware:
            if isinstance(middleware.cls, type) and issubclass(middleware.cls, CORSMiddleware):
                cors_middleware_found = True
                # Check allowed origins
                if hasattr(middleware, 'options'):
                    allowed_origins = middleware.options.get('allow_origins', [])
                break
        
        if cors_middleware_found:
            print("✓ CORS middleware is properly configured")
            print(f"Allowed origins: {allowed_origins}")
            
            # Check if our frontend URL is in the allowed origins
            frontend_urls = [
                "https://ctai-ctd-hacks.onrender.com",
                "https://smartbuy-dashboard-frontend.onrender.com"
            ]
            
            found_urls = [url for url in frontend_urls if url in allowed_origins]
            if found_urls:
                print(f"✓ Frontend URLs found in allowed origins: {found_urls}")
                return True
            else:
                print("⚠ Frontend URLs not found in allowed origins")
                print("  This might cause CORS issues with your frontend")
                return False
        else:
            print("✗ CORS middleware not found")
            return False
            
    except Exception as e:
        print(f"Error testing CORS configuration: {e}")
        return False

if __name__ == "__main__":
    print("Testing CORS configuration...")
    print("=" * 40)
    success = test_cors_configuration()
    print("=" * 40)
    if success:
        print("CORS configuration test passed!")
    else:
        print("CORS configuration test failed!")
    sys.exit(0 if success else 1)