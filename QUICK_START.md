# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
./install_dependencies.sh
```

### Step 2: Test Setup
```bash
source venv/bin/activate
python test_setup.py
```

### Step 3: Run Analysis
```bash
./run_analysis.sh
```

## 📁 What You Get

After running the analysis, you'll get:
- **CSV Report**: `eligible_image_report_YYYYMMDD_HHMM.csv`
- **8 Columns**: alle_ingestion_id, alle_media_key, ingestion_query, store_rank, syn_con_image_selection, brisque_score, eligible, image_url
- **Eligibility Status**: Each record tagged as 'eligible' or 'not eligible'

## 🔧 Manual Commands

If you prefer to run commands manually:

```bash
# Activate virtual environment
source venv/bin/activate

# Run analysis
python image_ingestion_analysis.py

# Deactivate when done
deactivate
```

## 📊 What the Script Does

1. **Connects** to your MySQL database
2. **Fetches** all image ingestion records
3. **Evaluates** eligibility based on your criteria
4. **Generates** GCS image URLs
5. **Exports** results to CSV

## ❓ Need Help?

- Check the logs for detailed information
- Review `README.md` for comprehensive documentation
- Run `python test_setup.py` to verify setup 