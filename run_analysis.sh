#!/bin/bash

# Image Ingestion Analysis - Run Script

echo "=========================================="
echo "Starting Image Ingestion Analysis"
echo "=========================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run install_dependencies.sh first."
    exit 1
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check if main script exists
if [ ! -f "image_ingestion_analysis.py" ]; then
    echo "❌ Main script not found: image_ingestion_analysis.py"
    exit 1
fi

echo "✅ Virtual environment activated"
echo "🚀 Starting analysis..."
echo ""

# Run the main script
python image_ingestion_analysis.py

# Deactivate virtual environment
deactivate

echo ""
echo "=========================================="
echo "Analysis Complete!"
echo "==========================================" 