# Smart Buy Dashboard Backend

FastAPI backend service for vendor management and IndiaMART web scraping.

## Features

- **IndiaMART Web Scraping**: Automatically scrape vendor data from IndiaMART based on material and location
- **Vendor Management**: Store, search, and manage vendor information
- **RESTful API**: Clean API endpoints for frontend integration
- **SQLite Database**: Persistent storage for vendor data
- **CORS Support**: Configured for frontend integration

## Setup

### Prerequisites

- Python 3.8+
- pip or conda

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create environment file:
   ```bash
   cp env.example .env
   ```

5. Run the application:
   ```bash
   python run.py
   ```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
- `GET /` - API health and version info

### Vendor Management
- `GET /vendors?material={material}&location={location}` - Search vendors
- `POST /vendors/finalize/{vendor_id}` - Finalize a vendor
- `PATCH /vendors/{vendor_id}` - Update vendor information
- `GET /vendors/finalized` - Get all finalized vendors

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
RELOAD=true

# Database Configuration
DATABASE_URL=sqlite:///./vendors.db

# Scraping Configuration
SCRAPING_DELAY_MIN=1
SCRAPING_DELAY_MAX=3
MAX_VENDORS_PER_SEARCH=10

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173
```

## Database Schema

The SQLite database includes a `vendors` table with the following fields:

- `id`: Primary key
- `material`: Material type searched for
- `vendor_name`: Vendor company name
- `location`: Vendor location
- `contact`: Phone number
- `email`: Email address
- `url`: IndiaMART profile URL
- `finalized`: Boolean flag for finalized vendors
- `payment_status`: Payment status
- `delivery_status`: Delivery status
- `notes`: Additional notes
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Web Scraping

The application uses BeautifulSoup to scrape IndiaMART search results. The scraper:

1. Constructs search URLs based on material and location
2. Makes HTTP requests with proper headers and delays
3. Parses HTML to extract vendor information
4. Handles rate limiting and error cases
5. Stores results in the database

## Error Handling

- Graceful handling of network errors
- Fallback scraping methods
- Comprehensive logging
- User-friendly error messages

## Development

To run in development mode with auto-reload:

```bash
python run.py
```

The server will automatically reload when files change.

## Production Deployment

For production deployment:

1. Set `RELOAD=false` in environment variables
2. Use a production WSGI server like Gunicorn
3. Configure proper database (PostgreSQL recommended)
4. Set up proper logging and monitoring
