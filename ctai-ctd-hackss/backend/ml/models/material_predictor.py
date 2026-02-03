"""
Production ML Model for Construction Material Prediction
Adapted from Jupyter notebook for web application use
"""

import pandas as pd
import numpy as np
import joblib
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
import warnings
warnings.filterwarnings("ignore")

# Try to import ML libraries
try:
    from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder
    from sklearn.metrics import mean_absolute_error, accuracy_score
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

logger = logging.getLogger(__name__)

class MaterialPredictor:
    """
    Production ML Model for predicting construction materials and quantities
    Based on trained models from the Jupyter notebook
    """
    
    def __init__(self, model_path: Optional[Path] = None):
        self.model_path = model_path or Path(__file__).parent / "trained_models"
        self.model_path.mkdir(parents=True, exist_ok=True)
        
        # Load data files
        self.data_path = Path(__file__).parent.parent / "data"
        
        # Models
        self.material_classifier = None
        self.quantity_regressor = None
        
        # Label encoders
        self.label_encoders = {}
        self.material_mapping = {}
        
        # Load material mapping
        self._load_material_mapping()
        
        # Material cost database (based on your training data)
        self.material_costs = {
            'Steel': {'base_cost': 125000, 'unit': 'tons'},
            'Drywall': {'base_cost': 11400, 'unit': 'm³'},
            'HVAC': {'base_cost': 1166667, 'unit': 'units'},
            'Electrical Equipment': {'base_cost': 15000, 'unit': 'units'},
            'Hardware & Fasteners': {'base_cost': 5000, 'unit': 'kg'},
            'Cables': {'base_cost': 3000, 'unit': 'm'},
            'Plumbing Fixtures': {'base_cost': 54444, 'unit': 'units'},
            'Glass & Windows': {'base_cost': 62500, 'unit': 'm²'},
            'Flooring': {'base_cost': 2500, 'unit': 'm²'},
            'Wood & Carpentry': {'base_cost': 8000, 'unit': 'm³'},
            'Cement': {'base_cost': 15000, 'unit': 'tons'},
            'Misc': {'base_cost': 2000, 'unit': 'units'}
        }
        
        # Try to load existing models
        self._load_models()
    
    def _load_material_mapping(self):
        """Load material cluster to category mapping"""
        try:
            mapping_file = self.data_path / "final_cluster_to_material_mapping.csv"
            if mapping_file.exists():
                df = pd.read_csv(mapping_file)
                self.material_mapping = dict(zip(df['cluster'], df['material_key']))
                logger.info(f"Loaded material mapping: {len(self.material_mapping)} clusters")
            else:
                # Fallback mapping
                self.material_mapping = {
                    0: 'Electrical Equipment', 1: 'Steel', 2: 'Drywall', 3: 'Steel',
                    4: 'Cables', 5: 'Steel', 6: 'Steel', 7: 'HVAC', 8: 'Drywall',
                    9: 'Hardware & Fasteners', 10: 'Hardware & Fasteners', 11: 'Drywall',
                    12: 'Steel', 13: 'Cables', 14: 'Misc', 15: 'Misc', 16: 'Steel',
                    17: 'Drywall', 18: 'Electrical Equipment', 19: 'Electrical Equipment'
                }
        except Exception as e:
            logger.error(f"Error loading material mapping: {e}")
            self.material_mapping = {}
    
    def _load_models(self):
        """Load existing models if available"""
        try:
            classifier_path = self.model_path / "material_classifier.joblib"
            regressor_path = self.model_path / "quantity_regressor.joblib"
            
            if classifier_path.exists() and regressor_path.exists():
                self.material_classifier = joblib.load(classifier_path)
                self.quantity_regressor = joblib.load(regressor_path)
                logger.info("Loaded existing ML models")
                
        except Exception as e:
            logger.error(f"Error loading models: {e}")
    
    def train_models(self):
        """Train ML models using available training data"""
        if not ML_AVAILABLE:
            logger.error("ML libraries not available")
            return False
            
        try:
            # Load training data
            train_file = self.data_path / "col_material_key.csv"
            if not train_file.exists():
                logger.error("Training data not found")
                return False
            
            logger.info("Loading training data...")
            train_df = pd.read_csv(train_file)
            
            # Prepare features
            features = self._prepare_features(train_df)
            
            if features.empty:
                logger.error("Feature preparation failed")
                return False
            
            # Train material classifier
            if 'cluster' in train_df.columns:
                y_material = train_df['cluster'].fillna(14)
                
                self.material_classifier = RandomForestClassifier(
                    n_estimators=100,
                    random_state=42,
                    n_jobs=-1
                )
                
                self.material_classifier.fit(features, y_material)
                logger.info("Material classifier trained successfully")
            
            # Train quantity regressor
            if 'QtyShipped' in train_df.columns:
                y_quantity = train_df['QtyShipped'].fillna(1)
                y_quantity_log = np.log1p(y_quantity)
                
                self.quantity_regressor = RandomForestRegressor(
                    n_estimators=100,
                    random_state=42,
                    n_jobs=-1
                )
                
                self.quantity_regressor.fit(features, y_quantity_log)
                logger.info("Quantity regressor trained successfully")
            
            # Save models
            self._save_models()
            return True
            
        except Exception as e:
            logger.error(f"Error training models: {e}")
            return False
    
    def _prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for ML model"""
        try:
            features_df = df.copy()
            
            # Numeric columns
            numeric_columns = ['SIZE_BUILDINGSIZE', 'NUMFLOORS', 'NUMROOMS', 'NUMBEDS']
            for col in numeric_columns:
                if col in features_df.columns:
                    features_df[col] = pd.to_numeric(features_df[col], errors='coerce').fillna(0)
                else:
                    features_df[col] = 0
            
            # Categorical columns
            categorical_columns = ['PROJECT_TYPE', 'STATE', 'CORE_MARKET']
            for col in categorical_columns:
                if col in features_df.columns:
                    features_df[col] = features_df[col].fillna('Unknown')
                    
                    # Encode categorical variables
                    if col not in self.label_encoders:
                        self.label_encoders[col] = LabelEncoder()
                        features_df[col] = self.label_encoders[col].fit_transform(features_df[col].astype(str))
                    else:
                        try:
                            features_df[col] = self.label_encoders[col].transform(features_df[col].astype(str))
                        except ValueError:
                            # Handle unknown categories
                            features_df[col] = 0
                else:
                    features_df[col] = 0
            
            # Create size categories
            features_df['SIZE_CAT'] = pd.cut(
                features_df['SIZE_BUILDINGSIZE'],
                bins=[0, 5000, 20000, 50000, 100000, float('inf')],
                labels=[0, 1, 2, 3, 4]
            ).astype(float).fillna(2)
            
            # Select features
            feature_columns = numeric_columns + categorical_columns + ['SIZE_CAT']
            return features_df[feature_columns].fillna(0)
            
        except Exception as e:
            logger.error(f"Error preparing features: {e}")
            return pd.DataFrame()
    
    def predict_materials(self, project_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Predict materials for a construction project"""
        try:
            # Convert input format
            input_df = self._convert_input_to_model_format(project_data)
            
            # Prepare features
            features = self._prepare_features(input_df)
            
            if features.empty or self.material_classifier is None:
                return self._fallback_prediction(project_data)
            
            # Predict material clusters
            material_probs = self.material_classifier.predict_proba(features)
            top_materials = np.argsort(material_probs[0])[-8:][::-1]
            
            predictions = []
            
            for i, cluster_id in enumerate(top_materials):
                probability = material_probs[0][cluster_id]
                
                if probability < 0.05:
                    continue
                
                # Get material info
                material_category = self.material_mapping.get(cluster_id, 'Misc')
                material_name = self._generate_material_name(material_category)
                
                # Predict quantity
                if self.quantity_regressor:
                    base_quantity = max(1, int(np.expm1(self.quantity_regressor.predict(features)[0])))
                else:
                    base_quantity = 10
                
                # Scale by building size and probability
                size_mult = self._get_size_multiplier(project_data.get('SIZE_BUILDINGSIZE', 10000))
                quantity = max(1, int(base_quantity * size_mult * probability * 5))
                
                # Get cost
                cost_info = self.material_costs.get(material_category, {'base_cost': 5000, 'unit': 'units'})
                total_cost = int(cost_info['base_cost'] * quantity)
                
                predictions.append({
                    'id': str(i + 1),
                    'name': material_name,
                    'category': material_category,
                    'quantity': quantity,
                    'unit': cost_info['unit'],
                    'cost': total_cost
                })
            
            # Ensure minimum materials
            if len(predictions) < 4:
                predictions.extend(self._get_essential_materials(project_data))
            
            # Sort by cost and limit
            predictions = sorted(predictions, key=lambda x: x['cost'], reverse=True)[:8]
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error in ML prediction: {e}")
            return self._fallback_prediction(project_data)
    
    def _convert_input_to_model_format(self, project_data: Dict[str, Any]) -> pd.DataFrame:
        """Convert web input to model format"""
        model_data = {
            'SIZE_BUILDINGSIZE': 10000,
            'NUMFLOORS': 1,
            'NUMROOMS': 0,
            'NUMBEDS': 0,
            'PROJECT_TYPE': 'Commercial',
            'STATE': 'Maharashtra',
            'CORE_MARKET': 'Enterprise'
        }
        
        # Map from frontend
        if 'projectType' in project_data:
            model_data['PROJECT_TYPE'] = project_data['projectType']
        if 'state' in project_data:
            model_data['STATE'] = project_data['state']
            
        # Handle size
        if 'size' in project_data:
            size_mapping = {
                'Small (<₹1Cr)': 5000,
                'Medium (₹1Cr–₹10Cr)': 25000,
                'Large (>₹10Cr)': 100000
            }
            model_data['SIZE_BUILDINGSIZE'] = size_mapping.get(project_data['size'], 25000)
        
        return pd.DataFrame([model_data])
    
    def _get_size_multiplier(self, building_size: float) -> float:
        """Get size multiplier"""
        if building_size < 5000:
            return 0.5
        elif building_size < 25000:
            return 1.0
        elif building_size < 100000:
            return 2.0
        else:
            return 3.0
    
    def _generate_material_name(self, category: str) -> str:
        """Generate material names"""
        names = {
            'Steel': ['Structural Steel Beams', 'Steel Reinforcement', 'Metal Framing'][np.random.randint(0, 3)],
            'Drywall': ['Gypsum Drywall', 'Ceiling Tiles', 'Joint Compound'][np.random.randint(0, 3)],
            'HVAC': ['HVAC System', 'Air Conditioning', 'Ventilation'][np.random.randint(0, 3)],
            'Electrical Equipment': ['Electrical Panel', 'Wiring System', 'Circuit Breakers'][np.random.randint(0, 3)],
            'Hardware & Fasteners': ['Construction Screws', 'Bolts & Nuts', 'Metal Brackets'][np.random.randint(0, 3)],
            'Cables': ['Power Cables', 'Network Cables', 'Control Cables'][np.random.randint(0, 3)],
            'Plumbing Fixtures': ['Plumbing System', 'Water Supply', 'Drainage'][np.random.randint(0, 3)],
            'Glass & Windows': ['Glass Panels', 'Window Systems', 'Curtain Wall'][np.random.randint(0, 3)],
            'Cement': ['Concrete Mix', 'Portland Cement', 'Precast Elements'][np.random.randint(0, 3)],
            'Misc': ['Construction Tools', 'Safety Equipment', 'General Supplies'][np.random.randint(0, 3)]
        }
        return names.get(category, 'Construction Material')
    
    def _get_essential_materials(self, project_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Essential materials for any project"""
        building_size = project_data.get('SIZE_BUILDINGSIZE', 10000)
        size_mult = self._get_size_multiplier(building_size)
        
        essentials = [
            {'name': 'Concrete Foundation', 'category': 'Cement', 'qty': 50, 'cost': 8000},
            {'name': 'Basic Steel Structure', 'category': 'Steel', 'qty': 10, 'cost': 120000}
        ]
        
        result = []
        for i, mat in enumerate(essentials):
            quantity = max(1, int(mat['qty'] * size_mult))
            result.append({
                'id': str(len(result) + 10),
                'name': mat['name'],
                'category': mat['category'],
                'quantity': quantity,
                'unit': 'tons' if mat['category'] == 'Steel' else 'm³',
                'cost': mat['cost'] * quantity
            })
        
        return result
    
    def _fallback_prediction(self, project_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Rule-based fallback prediction"""
        try:
            building_size = project_data.get('SIZE_BUILDINGSIZE', 25000)
            if isinstance(building_size, str):
                size_mapping = {
                    'Small (<₹1Cr)': 5000,
                    'Medium (₹1Cr–₹10Cr)': 25000,
                    'Large (>₹10Cr)': 100000
                }
                building_size = size_mapping.get(building_size, 25000)
            
            base_materials = [
                {'name': 'Structural Steel', 'category': 'Steel', 'ratio': 0.15, 'unit': 'tons'},
                {'name': 'Concrete (M40)', 'category': 'Cement', 'ratio': 0.8, 'unit': 'm³'},
                {'name': 'Drywall Sheets', 'category': 'Drywall', 'ratio': 2.0, 'unit': 'm²'},
                {'name': 'HVAC Systems', 'category': 'HVAC', 'ratio': 0.0002, 'unit': 'units'},
                {'name': 'Electrical Work', 'category': 'Electrical Equipment', 'ratio': 0.5, 'unit': 'm'},
                {'name': 'Hardware Items', 'category': 'Hardware & Fasteners', 'ratio': 0.02, 'unit': 'kg'},
                {'name': 'Plumbing Work', 'category': 'Plumbing Fixtures', 'ratio': 0.0015, 'unit': 'units'},
                {'name': 'Glass Work', 'category': 'Glass & Windows', 'ratio': 0.3, 'unit': 'm²'}
            ]
            
            predictions = []
            for i, material in enumerate(base_materials):
                quantity = max(1, int(building_size * material['ratio']))
                cost_info = self.material_costs.get(material['category'], {'base_cost': 5000})
                
                predictions.append({
                    'id': str(i + 1),
                    'name': material['name'],
                    'category': material['category'],
                    'quantity': quantity,
                    'unit': material['unit'],
                    'cost': cost_info['base_cost'] * quantity
                })
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error in fallback prediction: {e}")
            return []
    
    def _save_models(self):
        """Save models to disk"""
        try:
            if self.material_classifier:
                joblib.dump(self.material_classifier, self.model_path / "material_classifier.joblib")
            if self.quantity_regressor:
                joblib.dump(self.quantity_regressor, self.model_path / "quantity_regressor.joblib")
            if self.label_encoders:
                joblib.dump(self.label_encoders, self.model_path / "label_encoders.joblib")
            logger.info("Models saved successfully")
        except Exception as e:
            logger.error(f"Error saving models: {e}")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information"""
        return {
            'models_available': ML_AVAILABLE,
            'classifier_trained': self.material_classifier is not None,
            'regressor_trained': self.quantity_regressor is not None,
            'material_categories': len(self.material_mapping),
            'training_data_available': (self.data_path / "col_material_key.csv").exists()
        }