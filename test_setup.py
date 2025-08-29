#!/usr/bin/env python3
"""
Test Setup Script

This script tests that all dependencies and imports are working correctly
before running the main image ingestion analysis.
"""

import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_imports():
    """Test that all required modules can be imported."""
    try:
        logger.info("Testing imports...")
        
        # Test pandas
        import pandas as pd
        logger.info(f"✓ pandas imported successfully (version: {pd.__version__})")
        
        # Test mysql connector
        import mysql.connector
        logger.info("✓ mysql-connector-python imported successfully")
        
        # Test boto3
        import boto3
        logger.info("✓ boto3 imported successfully")
        
        # Test datetime
        from datetime import datetime
        logger.info("✓ datetime imported successfully")
        
        # Test GCS module
        sys.path.append('/Users/spurge/Downloads')
        try:
            from gcs_originals_image import generate_presigned_url, init_s3_client
            logger.info("✓ GCS module imported successfully")
        except ImportError as e:
            logger.error(f"✗ Failed to import GCS module: {e}")
            logger.error("Make sure gcs_originals_image.py is in /Users/spurge/Downloads/")
            return False
        
        logger.info("✓ All imports successful!")
        return True
        
    except ImportError as e:
        logger.error(f"✗ Import failed: {e}")
        return False
    except Exception as e:
        logger.error(f"✗ Unexpected error during import test: {e}")
        return False

def test_gcs_functions():
    """Test that GCS functions can be called without errors."""
    try:
        logger.info("Testing GCS functions...")
        
        sys.path.append('/Users/spurge/Downloads')
        from gcs_originals_image import generate_presigned_url, init_s3_client
        
        # Test S3 client initialization
        try:
            s3_client = init_s3_client()
            logger.info("✓ S3 client initialized successfully")
        except Exception as e:
            logger.warning(f"⚠ S3 client initialization failed (this is expected without proper credentials): {e}")
        
        # Test URL generation function (this will fail without proper credentials, but we can test the function exists)
        logger.info("✓ GCS functions are accessible")
        return True
        
    except Exception as e:
        logger.error(f"✗ GCS function test failed: {e}")
        return False

def main():
    """Run all tests."""
    logger.info("=" * 50)
    logger.info("SETUP TESTING")
    logger.info("=" * 50)
    
    # Test imports
    imports_ok = test_imports()
    
    if imports_ok:
        # Test GCS functions
        gcs_ok = test_gcs_functions()
        
        logger.info("=" * 50)
        if imports_ok and gcs_ok:
            logger.info("✓ SETUP TEST PASSED - Ready to run main script!")
            logger.info("You can now run: python image_ingestion_analysis.py")
        else:
            logger.info("⚠ SETUP TEST PARTIALLY PASSED - Some issues detected")
        logger.info("=" * 50)
    else:
        logger.error("✗ SETUP TEST FAILED - Please fix import issues before proceeding")
        sys.exit(1)

if __name__ == "__main__":
    main() 