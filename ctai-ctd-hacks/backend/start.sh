#!/bin/bash

echo "Starting Smart Buy Dashboard Backend..."
echo

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements-prod.txt

# Start the server
echo "Starting FastAPI server..."
echo "Server will be available at: http://localhost:8000"
echo
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload