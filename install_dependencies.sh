#!/bin/bash

# Image Ingestion Analysis - Dependency Installation Script

echo "=========================================="
echo "Installing Python Dependencies"
echo "=========================================="

# Check if pip3 is available
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 not found. Please install Python 3 and pip3 first."
    exit 1
fi

echo "✅ pip3 found: $(which pip3)"

# Install dependencies
echo "Installing required packages..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Run: python3 test_setup.py"
    echo "2. If tests pass, run: python3 image_ingestion_analysis.py"
else
    echo "❌ Failed to install dependencies. Please check the error messages above."
    exit 1
fi 