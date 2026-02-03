"""
Model Training Script
Run this to train the ML models from your Jupyter notebook data
"""

import sys
import logging
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from ml.models.material_predictor import MaterialPredictor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def main():
    """Train the ML models"""
    try:
        logger.info("🚀 Starting ML Model Training...")
        logger.info("=" * 50)
        
        # Initialize predictor
        predictor = MaterialPredictor()
        
        # Get model info
        info = predictor.get_model_info()
        logger.info(f"📊 Model Status: {info}")
        
        if info.get('training_data_available'):
            logger.info("📂 Training data found, starting model training...")
            success = predictor.train_models()
            
            if success:
                logger.info("✅ Models trained successfully!")
                logger.info("🎯 Your ML model is now ready for predictions")
                
                # Test prediction
                logger.info("🧪 Testing prediction...")
                test_project = {
                    'projectType': 'Commercial Construction',
                    'size': 'Medium (₹1Cr–₹10Cr)',
                    'state': 'Maharashtra',
                    'city': 'Mumbai',
                    'volume': '50000000'
                }
                
                predictions = predictor.predict_materials(test_project)
                logger.info(f"✅ Test prediction successful: {len(predictions)} materials predicted")
                
                for pred in predictions[:3]:  # Show first 3
                    logger.info(f"   • {pred['name']}: {pred['quantity']} {pred['unit']} - ₹{pred['cost']:,}")
                
            else:
                logger.error("❌ Model training failed")
                return False
        else:
            logger.warning("⚠️  No training data found - using fallback rules")
            
            # Test fallback
            test_project = {
                'projectType': 'Commercial Construction',
                'size': 'Medium (₹1Cr–₹10Cr)',
                'state': 'Maharashtra',
                'city': 'Mumbai',
                'volume': '50000000'
            }
            
            predictions = predictor.predict_materials(test_project)
            logger.info(f"✅ Fallback prediction works: {len(predictions)} materials predicted")
        
        logger.info("=" * 50)
        logger.info("🎉 Setup Complete! Your ML model is ready to use.")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error during setup: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)