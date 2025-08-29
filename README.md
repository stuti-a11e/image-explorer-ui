# Image Explorer App

A web application for analyzing and exploring image ingestion data with interactive analytics and image browsing capabilities.

## Features

- **Analytics Tab**: View eligibility statistics, store rank distributions, and brisque score analysis
- **Explorer Tab**: Browse images with advanced filtering by query, store rank, brisque score, and eligibility
- **Interactive Charts**: Visualize data with Chart.js powered charts
- **Image Modal**: Full-size image viewing with zoom capabilities
- **Info Popup**: Detailed metadata display for each image

## Files

- `index.html` - Main application interface
- `styles.css` - Application styling
- `app.js` - Application logic and functionality
- `vercel.json` - Vercel deployment configuration

## Usage

1. Load a CSV file with image ingestion data
2. Use the Analytics tab to view data insights
3. Use the Explorer tab to browse and filter images
4. Click on images to view full-size versions
5. Use the info button (ℹ️) to view detailed metadata

## Data Format

The app expects CSV files with the following columns:
- alle_ingestion_id
- alle_media_key
- ingestion_query
- store_rank
- syn_con_image_selection
- brisque_score
- eligible
- image_url 