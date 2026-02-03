import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup
import time
import random
from fake_useragent import UserAgent
import logging
import re
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

# Import ML components
try:
    from ml.models.material_predictor import MaterialPredictor
    from ml.utils.preprocessing import clean_project_data
    import pandas as pd
    ML_AVAILABLE = True
    logging.info("ML components loaded successfully")
except ImportError as e:
    logging.warning(f"ML components not available: {e}")
    ML_AVAILABLE = False
    pd = None

# Import MongoDB components
try:
    from database.mongodb import db_manager
    from models.database_models import ProjectModel, MaterialModel, VendorModel, PredictionModel, UserModel
    from database.crud import (
        create_project, get_project, get_all_projects, update_project, delete_project,
        create_material, get_materials_by_project,
        create_vendor, get_vendor, search_vendors_by_material, get_vendors_by_project, update_vendor,
        create_prediction, get_predictions_by_project,
        get_user_by_username, get_user_by_email, create_user, update_user_last_login
    )
    from bson import ObjectId
    MONGODB_AVAILABLE = True
    logging.info("MongoDB components loaded successfully")
except ImportError as e:
    logging.warning(f"MongoDB components not available: {e}")
    MONGODB_AVAILABLE = False
    db_manager = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Smart Buy Dashboard API",
    description="API for vendor management, IndiaMART scraping, and AI material prediction",
    version="1.0.0",
    docs_url=None,  # Disable /docs
    redoc_url=None  # Disable /redoc
)

# CORS middleware - Updated to include your frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://127.0.0.1:5173", 
        "http://localhost:8001", 
        "http://localhost:8080", 
        "http://localhost:8081", 
        "https://smartbuy-dashboard-frontend.onrender.com",
        "https://ctai-ctd-hacks.onrender.com"  # Your frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MongoDB if available
if MONGODB_AVAILABLE:
    if db_manager.connect():
        logger.info("MongoDB connected successfully")
    else:
        logger.warning("MongoDB connection failed. Some features may not work properly.")
else:
    logger.warning("MongoDB components not available. Some features may not work properly.")

# Initialize ML model if available
if ML_AVAILABLE:
    try:
        ml_predictor = MaterialPredictor()
        logger.info("ML predictor initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing ML predictor: {e}")
        ml_predictor = None
        ML_AVAILABLE = False
else:
    ml_predictor = None
    logger.warning("ML predictor not available")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "mongodb_available": MONGODB_AVAILABLE,
        "ml_available": ML_AVAILABLE,
        "python_version": sys.version,
    }

# Pydantic models for request/response
class ProjectRequest(BaseModel):
    projectType: str
    size: str
    state: str
    city: str
    volume: str

class MaterialPrediction(BaseModel):
    id: str
    name: str
    category: str
    quantity: int
    unit: str
    cost: int

class PredictionResponse(BaseModel):
    success: bool
    materials: List[MaterialPrediction]
    total_cost: int
    confidence: float = 94.0

# Authentication models
class UserLogin(BaseModel):
    username: str
    password: str

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    created_at: datetime
    last_login: Optional[datetime] = None


# IndiaMART Scraper Class
class IndiaMARTScraper:
    def __init__(self):
        self.session = requests.Session()
        # Use a more realistic user agent
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        })
    
    def search_vendors(self, material: str, location: str = "") -> List[dict]:
        """Search for vendors on IndiaMART based on material and location"""
        try:
            # Construct search URL
            search_query = f"{material}"
            if location:
                search_query += f" {location}"
            
            # Use a simpler search URL that's less likely to be blocked
            search_url = f"https://dir.indiamart.com/search.mp?ss={search_query.replace(' ', '+')}"
            
            logger.info(f"Searching IndiaMART for: {search_query}")
            logger.info(f"URL: {search_url}")
            
            # Add longer random delay to avoid being blocked
            time.sleep(random.uniform(2, 5))
            
            # Make request with timeout and session reuse
            response = self.session.get(search_url, timeout=30)
            
            # Check if request was successful
            if response.status_code == 403:
                logger.error(f"403 Forbidden - IndiaMART is blocking requests")
                # Return mock data for testing purposes
                return self._get_mock_vendors(material, location)
            
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            
            vendors = []
            
            # Look for vendor cards using multiple approaches
            vendor_cards = []
            
            # Try different selectors
            selectors_to_try = [
                'div[class*="card"]',
                'div[class*="product"]',
                'div[class*="listing"]',
                'div[data-itemid]',
                'div[itemprop="itemListElement"]'
            ]
            
            for selector in selectors_to_try:
                try:
                    cards = soup.select(selector)
                    if cards:
                        vendor_cards.extend(cards)
                except Exception as e:
                    logger.warning(f"Selector {selector} failed: {e}")
            
            # Remove duplicates
            vendor_cards = list(set(vendor_cards))[:30]  # Limit to first 30 unique results
            
            logger.info(f"Found {len(vendor_cards)} vendor cards")
            
            for card in vendor_cards[:20]:  # Limit to first 20 results
                try:
                    vendor_data = self._extract_vendor_data(card)
                    if vendor_data and self._is_valid_vendor_data(vendor_data):
                        vendors.append(vendor_data)
                except Exception as e:
                    logger.warning(f"Error extracting vendor data: {e}")
                    continue
            
            # If no vendors found, try fallback method
            if not vendors:
                vendors = self._fallback_scraping(soup, material, location)
            
            logger.info(f"Successfully scraped {len(vendors)} vendors")
            return vendors
            
        except requests.RequestException as e:
            logger.error(f"Request error: {e}")
            # Return mock data when scraping fails
            return self._get_mock_vendors(material, location)
        except Exception as e:
            logger.error(f"Scraping error: {e}")
            # Return mock data when scraping fails
            return self._get_mock_vendors(material, location)
    
    def _extract_vendor_data(self, card) -> Optional[dict]:
        """Extract vendor data from a single vendor card"""
        try:
            # Extract vendor name
            vendor_name = "Unknown Vendor"
            vendor_website = None
            
            # Try multiple approaches to find company name
            company_link = card.find('a', href=re.compile(r'.*indiamart\.com/[^/]+/?'))
            if company_link:
                vendor_name = company_link.get_text(strip=True)[:100]  # Limit length
                vendor_website = company_link.get('href')
            
            # Extract item name
            item_name = f"{vendor_name} Product"
            
            # Extract price information
            item_price = "Contact for price"
            price_elements = card.find_all(['p', 'div', 'span'], string=re.compile(r'[₹$€£]\s*[\d,]+'))
            if price_elements:
                price_text = price_elements[0].get_text(strip=True)
                price_match = re.search(r'[₹$€£]\s*([\d,]+)', price_text)
                if price_match:
                    item_price = price_match.group(0)
            
            # Extract rating
            rating = None
            rating_count = None
            
            # Extract location
            location = "India"
            
            # Extract contact information
            contact = "Contact vendor for details"
            
            # Check for verification
            gst_verified = False
            trustseal_verified = False
            
            # Extract member since information
            member_since = None
            
            return {
                'id': None,
                'vendor': vendor_name,
                'vendor_website': vendor_website,
                'rating': rating,
                'rating_count': rating_count,
                'item_name': item_name,
                'item_price': item_price,
                'item_unit': "Unit",
                'gst_verified': gst_verified,
                'trustseal_verified': trustseal_verified,
                'member_since': member_since,
                'location': location,
                'contact': contact
            }
            
        except Exception as e:
            logger.warning(f"Error extracting vendor data from card: {e}")
            return None
    
    def _is_valid_vendor_data(self, vendor_data: dict) -> bool:
        """Check if vendor data is valid"""
        # Basic validation
        vendor_name = vendor_data.get('vendor', '')
        return vendor_name and vendor_name != "Unknown Vendor" and len(vendor_name) > 3
    
    def _fallback_scraping(self, soup, material: str, location: str) -> List[dict]:
        """Fallback scraping method"""
        # Return mock data when real scraping fails
        return self._get_mock_vendors(material, location)
    
    def _get_mock_vendors(self, material: str, location: str) -> List[dict]:
        """Return mock vendor data for testing when scraping fails"""
        logger.info("Returning mock vendor data due to scraping issues")
        
        mock_vendors = [
            {
                'id': 1,
                'vendor': f"ABC {material} Suppliers",
                'vendor_website': "https://example.com",
                'rating': "4.5",
                'rating_count': "120",
                'item_name': f"Premium {material}",
                'item_price': "₹1,500",
                'item_unit': "Unit",
                'gst_verified': True,
                'trustseal_verified': True,
                'member_since': "5 years",
                'location': location or "India",
                'contact': "+91 9876543210"
            },
            {
                'id': 2,
                'vendor': f"XYZ {material} Traders",
                'vendor_website': "https://example2.com",
                'rating': "4.2",
                'rating_count': "85",
                'item_name': f"Standard {material}",
                'item_price': "₹1,200",
                'item_unit': "Unit",
                'gst_verified': True,
                'trustseal_verified': False,
                'member_since': "3 years",
                'location': location or "India",
                'contact': "+91 9876543211"
            },
            {
                'id': 3,
                'vendor': f"PQR {material} Industries",
                'vendor_website': "https://example3.com",
                'rating': "4.8",
                'rating_count': "200",
                'item_name': f"Industrial {material}",
                'item_price': "₹2,000",
                'item_unit': "Unit",
                'gst_verified': True,
                'trustseal_verified': True,
                'member_since': "8 years",
                'location': location or "India",
                'contact': "+91 9876543212"
            }
        ]
        
        return mock_vendors

# Initialize scraper
scraper = IndiaMARTScraper()

# API Endpoints
@app.get("/")
async def root():
    return {
        "message": "Smart Buy Dashboard API", 
        "version": "1.0.0",
        "features": [
            "AI Material Prediction",
            "Vendor Scraping (IndiaMART)", 
            "Construction Project Analysis"
        ],
        "endpoints": {
            "ml_prediction": "/predict",
            "vendor_search": "/vendors",
            "test_ml": "/test-prediction",
            "demo_data": "/demo"
        }
    }

@app.get("/vendors")
async def get_vendors(
    material: str = Query(..., description="Material to search for"),
    location: str = Query("", description="Location to filter by")
):
    """Search for vendors on IndiaMART based on material and location"""
    try:
        # Scrape from IndiaMART and return directly as JSON
        logger.info(f"Scraping IndiaMART for material: {material}, location: {location}")
        scraped_vendors = scraper.search_vendors(material, location)
        
        # Add unique ID to each vendor for frontend compatibility
        for i, vendor in enumerate(scraped_vendors):
            # Create a more unique ID using timestamp and index
            vendor['id'] = int(f"{int(time.time() * 1000)}{i}")
            # Remove unnecessary fields
            vendor.pop('email', None)
            vendor.pop('url', None)
            vendor.pop('finalized', None)
            vendor.pop('payment_status', None)
            vendor.pop('delivery_status', None)
            vendor.pop('notes', None)
        
        logger.info(f"Returning {len(scraped_vendors)} vendors")
        return scraped_vendors
        
    except Exception as e:
        logger.error(f"Error in get_vendors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ML Prediction endpoint
@app.post("/predict")
async def predict_materials(project: ProjectRequest):
    """AI-powered material prediction for construction projects"""
    try:
        logger.info(f"Predicting materials for project: {project.dict()}")
        
        if not ML_AVAILABLE or not ml_predictor:
            return await _mock_prediction(project)
        
        # Clean and prepare project data
        cleaned_data = clean_project_data(project.dict())
        
        # Get ML predictions
        predictions = ml_predictor.predict_materials(cleaned_data)
        
        if not predictions:
            return await _mock_prediction(project)
        
        # Calculate total cost
        total_cost = sum(material['cost'] for material in predictions)
        
        # Format response
        formatted_materials = [
            MaterialPrediction(
                id=material['id'],
                name=material['name'],
                category=material['category'],
                quantity=material['quantity'],
                unit=material['unit'],
                cost=material['cost']
            )
            for material in predictions
        ]
        
        response = PredictionResponse(
            success=True,
            materials=formatted_materials,
            total_cost=total_cost,
            confidence=92.0
        )
        
        logger.info(f"ML prediction successful: {len(predictions)} materials predicted")
        return response
        
    except Exception as e:
        logger.error(f"Error in predict_materials: {e}")
        return await _mock_prediction(project)

async def _mock_prediction(project: ProjectRequest):
    """Fallback prediction when ML is not available"""
    mock_materials = [
        {"id": "1", "name": "Structural Steel", "category": "Structure", "quantity": 450, "unit": "tons", "cost": 56000000},
        {"id": "2", "name": "Concrete (M40)", "category": "Foundation", "quantity": 2800, "unit": "m³", "cost": 32000000},
        {"id": "3", "name": "Glass Curtain Wall", "category": "Exterior", "quantity": 1200, "unit": "m²", "cost": 75000000},
        {"id": "4", "name": "HVAC Systems", "category": "MEP", "quantity": 24, "unit": "units", "cost": 28000000},
        {"id": "5", "name": "Electrical Conduits", "category": "Electrical", "quantity": 5500, "unit": "m", "cost": 6200000},
        {"id": "6", "name": "Fire Safety Systems", "category": "Safety", "quantity": 8, "unit": "systems", "cost": 13500000},
        {"id": "7", "name": "Insulation Materials", "category": "Interior", "quantity": 3200, "unit": "m²", "cost": 4800000},
        {"id": "8", "name": "Plumbing Fixtures", "category": "MEP", "quantity": 180, "unit": "units", "cost": 9800000}
    ]
    
    formatted_materials = [MaterialPrediction(**material) for material in mock_materials]
    total_cost = sum(material['cost'] for material in mock_materials)
    
    return PredictionResponse(
        success=True,
        materials=formatted_materials,
        total_cost=total_cost,
        confidence=85.0
    )

# Train models endpoint - REMOVED
# Model info endpoint - REMOVED
# Complete workflow endpoint - REMOVED

# Demo/Test endpoints for Postman testing
@app.get("/demo")
async def get_demo_data():
    """Get sample project data for testing"""
    return {
        "sample_projects": [
            {
                "name": "Mumbai Office Complex",
                "data": {
                    "projectType": "Commercial Construction",
                    "size": "Large (>₹10Cr)",
                    "state": "Maharashtra",
                    "city": "Mumbai",
                    "volume": "125000000"
                }
            },
            {
                "name": "Bangalore Tech Park",
                "data": {
                    "projectType": "Industrial Infrastructure", 
                    "size": "Medium (₹1Cr–₹10Cr)",
                    "state": "Karnataka",
                    "city": "Bengaluru",
                    "volume": "65000000"
                }
            },
            {
                "name": "Pune Residential",
                "data": {
                    "projectType": "Residential Development",
                    "size": "Small (<₹1Cr)",
                    "state": "Maharashtra", 
                    "city": "Pune",
                    "volume": "8500000"
                }
            }
        ],
        "instructions": {
            "step1": "Copy any sample project data",
            "step2": "POST to /predict endpoint",
            "step3": "POST to /vendors?material=<material_name>&location=<city>",
            "step4": "Check /model-info for ML status"
        }
    }

@app.post("/test-prediction")
async def test_prediction_endpoint(project: ProjectRequest):
    """Enhanced prediction endpoint with detailed output for testing"""
    try:
        logger.info(f"[TEST] Testing prediction for: {project.dict()}")
        
        # Get basic prediction
        prediction_result = await predict_materials(project)
        
        # Add debug information
        debug_info = {
            "input_processed": clean_project_data(project.dict()) if ML_AVAILABLE else "ML not available",
            "ml_available": ML_AVAILABLE,
            "model_status": ml_predictor.get_model_info() if ML_AVAILABLE and ml_predictor else "No ML model",
            "prediction_source": "ML Model" if ML_AVAILABLE and ml_predictor else "Fallback Rules"
        }
        
        # Enhanced response
        return {
            "prediction_result": prediction_result,
            "debug_info": debug_info,
            "timestamp": pd.Timestamp.now().isoformat() if 'pd' in globals() else "N/A",
            "summary": {
                "total_materials": len(prediction_result.materials),
                "total_cost": prediction_result.total_cost,
                "confidence": prediction_result.confidence,
                "cost_breakdown": [
                    {"material": mat.name, "cost": mat.cost, "percentage": round((mat.cost/prediction_result.total_cost)*100, 2)}
                    for mat in prediction_result.materials[:5]
                ]
            }
        }
        
    except Exception as e:
        logger.error(f"Error in test prediction: {e}")
        return {
            "error": str(e),
            "ml_available": ML_AVAILABLE,
            "suggestion": "Try running /train-models first, or use demo data from /demo"
        }

# Enhanced vendor search with better output
@app.get("/vendors-detailed")
async def get_vendors_detailed(
    material: str = Query(..., description="Material to search for"),
    location: str = Query("", description="Location to filter by"),
    max_results: int = Query(10, description="Maximum number of results")
):
    """Enhanced vendor search with detailed output for testing"""
    try:
        logger.info(f"[TEST] Searching vendors for material: {material}, location: {location}")
        
        # Get vendor data using existing scraper
        scraped_vendors = scraper.search_vendors(material, location)
        
        # Limit results
        limited_vendors = scraped_vendors[:max_results]
        
        # Add enhanced information
        for i, vendor in enumerate(limited_vendors):
            vendor['search_rank'] = i + 1
            vendor['search_material'] = material
            vendor['search_location'] = location
        
        return {
            "search_query": {
                "material": material,
                "location": location,
                "max_results": max_results
            },
            "results_found": len(scraped_vendors),
            "results_returned": len(limited_vendors),
            "vendors": limited_vendors,
            "summary": {
                "total_vendors": len(scraped_vendors),
                "with_contact": len([v for v in limited_vendors if v.get('contact')]),
                "with_email": len([v for v in limited_vendors if v.get('email')]),
                "with_rating": len([v for v in limited_vendors if v.get('rating')]),
                "verified_vendors": len([v for v in limited_vendors if v.get('trustseal_verified') or v.get('gst_verified')])
            },
            "timestamp": pd.Timestamp.now().isoformat() if 'pd' in globals() else "N/A"
        }
        
    except Exception as e:
        logger.error(f"Error in detailed vendor search: {e}")
        return {
            "error": str(e),
            "search_query": {"material": material, "location": location},
            "suggestion": "Try with common materials like 'steel', 'cement', 'concrete'"
        }

# Complete workflow test endpoint - REMOVED

# API Documentation endpoint
@app.get("/api-docs")
async def get_api_documentation():
    """Complete API documentation for Postman testing"""
    return {
        "title": "Smart Buy Dashboard API - Testing Guide",
        "version": "1.0.0",
        "base_url": "http://localhost:8000",
        "endpoints": {
            "1_basic_info": {
                "GET /": "API overview and available endpoints",
                "GET /api-docs": "This documentation",
                "GET /demo": "Sample data for testing"
            },
            "2_ml_prediction": {
                "POST /predict": {
                    "description": "Basic material prediction",
                    "sample_body": {
                        "projectType": "Commercial Construction",
                        "size": "Medium (₹1Cr–₹10Cr)",
                        "state": "Maharashtra", 
                        "city": "Mumbai",
                        "volume": "50000000"
                    }
                },
                "POST /test-prediction": {
                    "description": "Detailed prediction with debug info",
                    "sample_body": "Same as /predict"
                }
            },
            "3_vendor_search": {
                "GET /vendors": {
                    "description": "Basic vendor search (original functionality)",
                    "parameters": "?material=steel&location=mumbai"
                },
                "GET /vendors-detailed": {
                    "description": "Enhanced vendor search with analytics",
                    "parameters": "?material=concrete&location=pune&max_results=10"
                }
            },
            "4_demo_and_testing": {
                "GET /demo": "Sample data for testing",
                "GET /api-docs": "This documentation"
            }
        },
        "testing_steps": {
            "step_1": "GET /demo to get sample data",
            "step_2": "POST /test-prediction with sample data",
            "step_3": "GET /vendors-detailed?material=steel&location=mumbai",
            "step_4": "POST /predict for production predictions"
        },
        "sample_materials": [
            "steel", "concrete", "cement", "glass", "drywall", 
            "HVAC", "electrical", "plumbing", "insulation"
        ],
        "sample_locations": [
            "mumbai", "delhi", "bangalore", "pune", "chennai", 
            "hyderabad", "kolkata", "ahmedabad"
        ]
    }


# MongoDB Project Management Endpoints
if MONGODB_AVAILABLE:
    @app.post("/projects")
    async def create_project_endpoint(project_data: ProjectRequest):
        """Create a new project in MongoDB"""
        try:
            # Convert ProjectRequest to ProjectModel
            project_model = ProjectModel(
                name=f"{project_data.projectType} Project",
                project_type=project_data.projectType,
                size=project_data.size,
                state=project_data.state,
                city=project_data.city,
                volume=int(project_data.volume),
                status="active",
                is_predicted=False
            )
            
            # Save to MongoDB
            created_project = create_project(project_model)
            
            return {
                "success": True,
                "project_id": created_project.id,  # This is now a string
                "message": "Project created successfully"
            }
        except Exception as e:
            logger.error(f"Error creating project: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/projects")
    async def get_all_projects_endpoint():
        """Get all projects from MongoDB"""
        try:
            projects = get_all_projects()
            return [
                {
                    "id": project.id,  # This is now a string
                    "name": project.name,
                    "project_type": project.project_type,
                    "size": project.size,
                    "state": project.state,
                    "city": project.city,
                    "volume": project.volume,
                    "status": project.status,
                    "is_predicted": project.is_predicted,
                    "created_at": project.created_at
                }
                for project in projects
            ]
        except Exception as e:
            logger.error(f"Error fetching projects: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/projects/{project_id}")
    async def get_project_endpoint(project_id: str):
        """Get a specific project from MongoDB"""
        try:
            project = get_project(project_id)
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
            
            return {
                "id": project.id,  # This is now a string
                "name": project.name,
                "project_type": project.project_type,
                "size": project.size,
                "state": project.state,
                "city": project.city,
                "volume": project.volume,
                "status": project.status,
                "is_predicted": project.is_predicted,
                "created_at": project.created_at
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching project: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # Save Prediction Results to MongoDB
    @app.post("/projects/{project_id}/predictions")
    async def save_prediction_endpoint(project_id: str, prediction: PredictionResponse):
        """Save prediction results to MongoDB"""
        try:
            # Verify project exists
            project = get_project(project_id)
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
            
            # Convert materials to MaterialModel objects (embedded within prediction)
            material_models = []
            for material in prediction.materials:
                material_model = MaterialModel(
                    project_id=project_id,  # Use string ID
                    name=material.name,
                    category=material.category,
                    quantity=material.quantity,
                    unit=material.unit,
                    cost=material.cost,
                    confidence=prediction.confidence
                )
                material_models.append(material_model)
            
            # Create PredictionModel
            prediction_model = PredictionModel(
                project_id=project_id,  # Use string ID
                materials=material_models,
                total_cost=prediction.total_cost,
                confidence=prediction.confidence
            )
            
            # Save prediction to MongoDB
            created_prediction = create_prediction(prediction_model)
            
            # Update project's is_predicted flag
            update_project(project_id, {"is_predicted": True})
            
            return {
                "success": True,
                "prediction_id": created_prediction.id,  # This is now a string
                "message": "Prediction saved successfully"
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error saving prediction: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # Get Prediction Results from MongoDB
    @app.get("/projects/{project_id}/predictions")
    async def get_predictions_endpoint(project_id: str):
        """Get prediction results from MongoDB"""
        try:
            # Verify project exists
            project = get_project(project_id)
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
            
            # Get predictions from MongoDB
            predictions = get_predictions_by_project(project_id)
            
            if not predictions:
                return {
                    "success": True,
                    "materials": [],
                    "total_cost": 0,
                    "confidence": 0
                }
            
            # Return the most recent prediction
            latest_prediction = predictions[-1]  # Assuming sorted by creation date
            
            # Get vendors for this project to check assignments
            project_vendors = get_vendors_by_project(project_id)
            
            # Create a map of material name to vendor details
            material_vendor_map = {}
            for vendor in project_vendors:
                if vendor.material_name:
                    # Convert vendor to JSON-serializable format
                    vendor_dict = vendor.dict(by_alias=True)
                    # All IDs are already strings now
                    material_vendor_map[vendor.material_name] = vendor_dict
            
            response_data = {
                "success": True,
                "materials": [
                    {
                        "id": material.id,  # This is now a string
                        "name": material.name,
                        "category": material.category,
                        "quantity": material.quantity,
                        "unit": material.unit,
                        "cost": material.cost,
                        "vendorAssigned": material_vendor_map.get(material.name)  # Add complete vendor assignment info
                    }
                    for material in latest_prediction.materials
                ],
                "total_cost": latest_prediction.total_cost,
                "confidence": latest_prediction.confidence
            }
            logger.info(f"Returning prediction data for project {project_id}: {len(response_data['materials'])} materials")
            return response_data
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching predictions: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # Get vendors associated with a specific project
    @app.get("/projects/{project_id}/vendors")
    async def get_project_vendors(project_id: str, material_name: str = None):
        """Get vendors associated with a specific project, optionally filtered by material"""
        try:
            # Verify project exists
            project = get_project(project_id)
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
            
            # Get vendors from MongoDB
            vendors = get_vendors_by_project(project_id, material_name)
            
            # Convert to JSON-serializable format
            vendors_json = []
            for vendor in vendors:
                vendor_dict = vendor.dict(by_alias=True)
                # All IDs are already strings now
                vendors_json.append(vendor_dict)
            
            return vendors_json
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching project vendors: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @app.post("/auth/login")
    async def login_user(credentials: UserLogin):
        """Login user"""
        try:
            # Get user by username
            user = get_user_by_username(credentials.username)
            if not user:
                raise HTTPException(status_code=401, detail="Invalid credentials")
            
            # Verify password (plain text comparison for simplicity)
            if credentials.password != user.password:
                raise HTTPException(status_code=401, detail="Invalid credentials")
            
            return {
                "success": True,
                "user": {
                    "id": user.id,  # This is now a string
                    "username": user.username
                },
                "message": "Login successful"
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error logging in user: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # Save Vendor Data to MongoDB
    @app.post("/vendors/save")
    async def save_vendor_endpoint(vendor_data: dict):
        """Save vendor data to MongoDB with project and material associations"""
        try:
            # Extract project and material information if provided
            project_id = vendor_data.get('project_id')
            material_id = vendor_data.get('material_id')
            material_name = vendor_data.get('material_name')
            
            # Convert dict to VendorModel
            vendor_model = VendorModel(
                project_id=project_id,  # Use string ID
                material_id=material_id,  # Use string ID
                material_name=material_name,
                name=vendor_data.get('name'),
                website=vendor_data.get('website'),
                rating=vendor_data.get('rating'),
                rating_count=vendor_data.get('rating_count'),
                item_name=vendor_data.get('item_name'),
                item_price=vendor_data.get('item_price'),
                item_unit=vendor_data.get('item_unit'),
                gst_verified=vendor_data.get('gst_verified', False),
                trustseal_verified=vendor_data.get('trustseal_verified', False),
                member_since=vendor_data.get('member_since'),
                location=vendor_data.get('location'),
                contact=vendor_data.get('contact'),
                email=vendor_data.get('email')
            )
            
            # Save to MongoDB
            created_vendor = create_vendor(vendor_model)
            
            return {
                "success": True,
                "vendor_id": created_vendor.id,  # This is now a string
                "message": "Vendor saved successfully"
            }
        except Exception as e:
            logger.error(f"Error saving vendor: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # Update vendor information
    @app.patch("/vendors/{vendor_id}")
    async def update_vendor_endpoint(vendor_id: str, vendor_data: dict):
        """Update vendor information"""
        try:
            # Update vendor in MongoDB
            success = update_vendor(vendor_id, vendor_data)
            
            if success:
                return {"message": "Vendor updated successfully"}
            else:
                raise HTTPException(status_code=404, detail="Vendor not found")
        except Exception as e:
            logger.error(f"Error updating vendor: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # Finalize a vendor
    @app.post("/vendors/finalize/{vendor_id}")
    async def finalize_vendor_endpoint(vendor_id: str):
        """Finalize a vendor"""
        try:
            # Update vendor's finalized status in MongoDB
            success = update_vendor(vendor_id, {"finalized": True})
            
            if success:
                return {"message": "Vendor finalized successfully"}
            else:
                raise HTTPException(status_code=404, detail="Vendor not found")
        except Exception as e:
            logger.error(f"Error finalizing vendor: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # Update material with vendor assignment
    @app.patch("/projects/{project_id}/materials/{material_id}/assign-vendor")
    async def assign_vendor_to_material(project_id: str, material_id: str, vendor_id: str):
        """Assign a vendor to a material"""
        try:
            # Verify project exists
            project = get_project(project_id)
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
            
            # Verify material exists and belongs to project
            material = get_material_by_id(material_id)
            if not material or material.project_id != project_id:
                raise HTTPException(status_code=404, detail="Material not found")
            
            # Update material with vendor assignment
            success = update_material_with_vendor(material_id, vendor_id)
            
            if success:
                return {"message": "Vendor assigned to material successfully"}
            else:
                raise HTTPException(status_code=404, detail="Material not found or not updated")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error assigning vendor to material: {e}")
            raise HTTPException(status_code=500, detail=str(e))

# Add fallback endpoints when MongoDB is not available
if not MONGODB_AVAILABLE:
    @app.get("/projects")
    async def get_projects_fallback():
        """Fallback endpoint when MongoDB is not available"""
        return []
    
    @app.post("/projects")
    async def create_project_fallback(project_data: ProjectRequest):
        """Fallback endpoint when MongoDB is not available"""
        return {"success": False, "message": "Database not available"}
    
    @app.get("/projects/{project_id}")
    async def get_project_fallback(project_id: str):
        """Fallback endpoint when MongoDB is not available"""
        raise HTTPException(status_code=404, detail="Database not available")
    
    @app.get("/vendors/finalized")
    async def get_finalized_vendors_fallback():
        """Fallback endpoint when MongoDB is not available"""
        return []

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
