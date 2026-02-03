# Use Python 3.11.10 slim image
FROM python:3.11.10-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements-prod.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements-prod.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=8000
ENV RELOAD=false

# Run the application
CMD ["python", "run.py"]