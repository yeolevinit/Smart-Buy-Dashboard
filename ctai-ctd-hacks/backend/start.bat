@echo off
echo Starting Smart Buy Dashboard Backend...
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements-prod.txt

REM Start the server
echo Starting FastAPI server...
echo Server will be available at: http://localhost:8000
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause