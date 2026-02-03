"""
Data preprocessing utilities for construction material prediction
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

def clean_project_data(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """Clean and standardize project input data"""
    cleaned_data = {}
    
    # Map frontend field names to ML model expected names
    field_mapping = {
        'projectType': 'PROJECT_TYPE',
        'size': 'SIZE_BUILDINGSIZE', 
        'state': 'STATE',
        'city': 'PROJECT_CITY',
        'volume': 'MW',
        'numFloors': 'NUMFLOORS'
    }
    
    for frontend_key, ml_key in field_mapping.items():
        if frontend_key in raw_data:
            cleaned_data[ml_key] = raw_data[frontend_key]
    
    # Convert size descriptions to numeric values
    if 'SIZE_BUILDINGSIZE' not in cleaned_data and 'size' in raw_data:
        size_mapping = {
            'Small (<₹1Cr)': 5000,
            'Medium (₹1Cr–₹10Cr)': 25000, 
            'Large (>₹10Cr)': 100000
        }
        cleaned_data['SIZE_BUILDINGSIZE'] = size_mapping.get(raw_data['size'], 25000)
    
    # Set default values
    defaults = {
        'PROJECT_COUNTRY': 'India',
        'CORE_MARKET': 'Enterprise',
        'NUMFLOORS': 1,
        'MW': 1.0
    }
    
    for key, default_value in defaults.items():
        if key not in cleaned_data:
            cleaned_data[key] = default_value
    
    return cleaned_data

def extract_features_from_project(project_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract relevant features for ML model from project data"""
    features = {}
    
    # Numeric features
    numeric_fields = ['MW', 'SIZE_BUILDINGSIZE', 'NUMFLOORS', 'NUMROOMS', 'NUMBEDS']
    for field in numeric_fields:
        if field in project_data:
            try:
                features[field] = float(project_data[field])
            except (ValueError, TypeError):
                features[field] = 0.0
    
    # Categorical features
    categorical_fields = ['PROJECT_TYPE', 'CORE_MARKET', 'STATE', 'PROJECT_COUNTRY']
    for field in categorical_fields:
        if field in project_data:
            features[field] = str(project_data[field])
        else:
            features[field] = 'Unknown'
    
    return features