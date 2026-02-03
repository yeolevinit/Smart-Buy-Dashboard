# Deployment Guide

## Render Deployment Configuration

This project is configured for deployment on Render with separate services for frontend and backend.

## Python Version Requirements

**Important**: Use Python 3.11 for deployment. Python 3.13 has compatibility issues with pandas and other ML packages that cause build failures.

The [render.yaml](file:///d:/Projects/smart-buy-dash/render.yaml) file specifies Python 3.11:
```yaml
envVars:
  - key: PYTHON_VERSION
    value: 3.11
```

## Requirements Files

The project uses different requirements files for different purposes:

1. [requirements.txt](file:///d:/Projects/smart-buy-dash/backend/requirements.txt) - For local development with ML capabilities
2. [requirements-prod.txt](file:///d:/Projects/smart-buy-dash/backend/requirements-prod.txt) - For production deployment (excludes ML packages)
3. [requirements-render.txt](file:///d:/Projects/smart-buy-dash/backend/requirements-render.txt) - Specifically for Render deployment

### Why Separate Requirements Files?

1. **Build Time**: ML packages like pandas and scikit-learn require compilation which significantly increases build time
2. **Compatibility**: These packages often have compatibility issues with newer Python versions
3. **Necessity**: The production backend doesn't actually need these packages for normal operation

## Deployment Steps

1. Fork this repository to your GitHub account
2. Create a new Web Service on Render
3. Connect it to your forked repository
4. Ensure the build command uses [requirements-render.txt](file:///d:/Projects/smart-buy-dash/backend/requirements-render.txt):
   ```bash
   pip install --upgrade pip && pip install -r backend/requirements-render.txt
   ```
5. Configure the following environment variables in your Render dashboard:
   - `MONGODB_CONNECTION_STRING` - Your MongoDB connection string
   - `MONGODB_DATABASE_NAME` - Database name (should be `ctd`)
   - `VITE_API_URL` - The URL of your deployed backend service

## Troubleshooting

### Build Failures with Pandas

If you encounter build failures related to pandas, ensure:
1. You're using Python 3.11 (not 3.13)
2. You're installing from [requirements-render.txt](file:///d:/Projects/smart-buy-dash/backend/requirements-render.txt) (not [requirements.txt](file:///d:/Projects/smart-buy-dash/backend/requirements.txt))

### Import Path Issues

Render may have issues with Python import paths. The deployment configuration uses:
```
PYTHONPATH=/opt/render/project/src/backend python backend/main.py
```

This ensures that local modules can be imported correctly.

### Startup Checks

Before starting the server, a startup check script verifies:
- Python version compatibility
- Environment variables are set
- Required files exist
- Key modules can be imported

If any of these checks fail, the deployment will stop and provide detailed error information.

### Alternative Solutions for ML Functionality

If you need ML functionality in production, consider:
1. Using pre-compiled wheels with a constraints file
2. Implementing a separate ML service
3. Using cloud-based ML APIs

## Debugging Deployment Issues

If you're still experiencing deployment issues:

1. Check the Render logs for specific error messages
2. Verify that all environment variables are set correctly
3. Ensure your MongoDB connection string is valid
4. Run the [test_imports.py](file:///d:/Projects/smart-buy-dash/backend/test_imports.py) script locally to verify imports work
5. Run the [startup_check.py](file:///d:/Projects/smart-buy-dash/backend/startup_check.py) script locally to verify all configurations