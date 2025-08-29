#!/usr/bin/env python3
"""
Image Ingestion Analysis Script

This script fetches image ingestion IDs from the database, evaluates their eligibility
based on specified criteria, and exports the results to a CSV file.

Requirements:
- mysql-connector-python or pymysql
- pandas
- Access to the image_ingestion database
"""

import mysql.connector
import pandas as pd
import logging
from datetime import datetime
import sys
import os

# Import the GCS image URL functionality
sys.path.append('/Users/spurge/Downloads')
from gcs_originals_image import generate_presigned_url, init_s3_client

# Database Configuration
DB_CONFIG = {
    'host': 'prod-orchestration-db.heyalle.com',
    'database': 'image_ingestion',
    'user': 'stuti',
    'password': 'kutbyH-nynby0-buwwin'
}

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_original_image_url(alle_media_key: str, alle_ingestion_id: str, s3_client) -> str:
    """
    Get the original image URL using the existing GCS functionality.
    
    Args:
        alle_media_key (str): The media key identifier
        alle_ingestion_id (str): The ingestion ID
        s3_client: Initialized S3 client for GCS
        
    Returns:
        str: The presigned URL for the original image
    """
    try:
        # Use the existing function from gcs_originals_image.py
        # Construct the blob path as done in the original file
        blob_path = f"originals/{alle_ingestion_id}/{alle_media_key}"
        
        # Generate presigned URL
        presigned_url = generate_presigned_url(s3_client, blob_path)
        
        if presigned_url:
            return presigned_url
        else:
            logger.warning(f"Failed to generate URL for {alle_media_key}")
            return ""
            
    except Exception as e:
        logger.error(f"Error getting image URL for {alle_media_key}: {str(e)}")
        return ""


def connect_to_database():
    """Establish connection to the MySQL database."""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        logger.info("Successfully connected to database")
        return connection
    except mysql.connector.Error as err:
        logger.error(f"Error connecting to database: {err}")
        raise


def fetch_ingestion_data(connection):
    """
    Fetch all image ingestion data using the provided SQL query.
    
    Args:
        connection: MySQL database connection
        
    Returns:
        pandas.DataFrame: DataFrame containing the fetched data
    """
    sql_query = """
    WITH ids AS (
      SELECT
        a.alle_ingestion_id,
        MAX(a.updated_at) AS latest_attr_ts,
        MAX(CASE WHEN a.type = 'ingestion_query' THEN a.string_value END) AS ingestion_query
      FROM image_ingestion.alle_image_attributes_v2 a
      WHERE a.type = 'ingestion_query'
      GROUP BY a.alle_ingestion_id
    ),
    latest_img AS (
      SELECT
        ai.alle_ingestion_id,
        MAX(ai.updated_at) AS updated_at
      FROM image_ingestion.alle_images_v2 ai
      GROUP BY ai.alle_ingestion_id
    ),
    snap AS (
      SELECT
        i.alle_ingestion_id,
        ai.alle_media_key,
        ai.aspect_ratio,
        li.updated_at,
        MAX(CASE WHEN a2.type = 'store_rank' THEN a2.int_value END)              AS store_rank,
        MAX(CASE WHEN a2.type = 'brisque_score' THEN a2.float_value END)         AS brisque_score,
        MAX(CASE WHEN a2.type = 'syn_con_image_selection' THEN a2.int_value END) AS syn_con_image_selection,
        MAX(CASE WHEN a2.type = 'hero_category' THEN a2.string_value END)        AS hero_category,
        i.ingestion_query
      FROM ids i
      JOIN latest_img li
        ON li.alle_ingestion_id = i.alle_ingestion_id
      JOIN image_ingestion.alle_images_v2 ai
        ON ai.alle_ingestion_id = li.alle_ingestion_id
         AND ai.updated_at = li.updated_at
      LEFT JOIN image_ingestion.alle_image_attributes_v2 a2
        ON a2.alle_ingestion_id = i.alle_ingestion_id
      GROUP BY i.alle_ingestion_id, ai.alle_media_key, ai.aspect_ratio, li.updated_at, i.ingestion_query
    )
    SELECT
      s.alle_ingestion_id,
      s.alle_media_key,
      s.ingestion_query,
      s.store_rank,
      s.syn_con_image_selection,
      s.brisque_score,
      s.hero_category,
      s.aspect_ratio,
      CASE
        WHEN s.syn_con_image_selection = 1
         AND s.store_rank <= 50
         AND s.brisque_score <= 50
         AND (s.hero_category IS NULL OR s.hero_category <> 'jeans')
         AND s.aspect_ratio BETWEEN 0.5 AND 2
        THEN 'eligible'
        ELSE 'not eligible'
      END AS eligible
    FROM snap s;
    """
    
    try:
        logger.info("Executing SQL query to fetch ingestion data...")
        df = pd.read_sql(sql_query, connection)
        logger.info(f"Successfully fetched {len(df)} records from database")
        return df
    except Exception as e:
        logger.error(f"Error executing SQL query: {e}")
        raise


def add_image_urls(df):
    """
    Add image URLs to the DataFrame using the GCS functionality.
    
    Args:
        df (pandas.DataFrame): DataFrame containing ingestion data
        
    Returns:
        pandas.DataFrame: DataFrame with image URLs added
    """
    try:
        logger.info("Initializing S3 client for GCS...")
        s3_client = init_s3_client()
        
        logger.info("Adding image URLs to records...")
        image_urls = []
        
        for index, row in df.iterrows():
            alle_media_key = row['alle_media_key']
            alle_ingestion_id = row['alle_ingestion_id']
            
            # Get image URL
            image_url = get_original_image_url(alle_media_key, alle_ingestion_id, s3_client)
            image_urls.append(image_url)
            
            # Log progress every 100 items
            if (index + 1) % 100 == 0:
                logger.info(f"Processed {index + 1}/{len(df)} records for image URLs")
        
        # Add image URLs to DataFrame
        df['image_url'] = image_urls
        logger.info("Successfully added image URLs to all records")
        
        return df
        
    except Exception as e:
        logger.error(f"Error adding image URLs: {e}")
        raise


def export_to_csv(df, filename=None):
    """
    Export the DataFrame to a CSV file.
    
    Args:
        df (pandas.DataFrame): DataFrame to export
        filename (str, optional): Custom filename. If None, generates timestamped filename.
        
    Returns:
        str: Path to the exported CSV file
    """
    if filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        filename = f"eligible_image_report_{timestamp}.csv"
    
    try:
        # Ensure we have exactly 8 columns as specified
        expected_columns = [
            'alle_ingestion_id', 'alle_media_key', 'ingestion_query', 
            'store_rank', 'syn_con_image_selection', 'brisque_score', 
            'eligible', 'image_url'
        ]
        
        # Select only the required columns in the correct order
        df_export = df[expected_columns]
        
        # Export to CSV
        df_export.to_csv(filename, index=False)
        logger.info(f"Successfully exported data to {filename}")
        logger.info(f"Exported {len(df_export)} records with {len(df_export.columns)} columns")
        
        return filename
        
    except Exception as e:
        logger.error(f"Error exporting to CSV: {e}")
        raise


def main():
    """Main function to orchestrate the entire process."""
    connection = None
    
    try:
        logger.info("Starting Image Ingestion Analysis...")
        
        # Step 1: Connect to database
        connection = connect_to_database()
        
        # Step 2: Fetch ingestion data
        df = fetch_ingestion_data(connection)
        
        # Step 3: Add image URLs
        df = add_image_urls(df)
        
        # Step 4: Export to CSV
        output_file = export_to_csv(df)
        
        # Step 5: Print summary
        eligible_count = len(df[df['eligible'] == 'eligible'])
        total_count = len(df)
        
        logger.info("=" * 50)
        logger.info("ANALYSIS COMPLETE")
        logger.info("=" * 50)
        logger.info(f"Total records processed: {total_count}")
        logger.info(f"Eligible records: {eligible_count}")
        logger.info(f"Not eligible records: {total_count - eligible_count}")
        logger.info(f"Eligibility rate: {(eligible_count/total_count)*100:.2f}%")
        logger.info(f"Output file: {output_file}")
        logger.info("=" * 50)
        
    except Exception as e:
        logger.error(f"Fatal error in main process: {e}")
        sys.exit(1)
        
    finally:
        if connection and connection.is_connected():
            connection.close()
            logger.info("Database connection closed")


if __name__ == "__main__":
    main() 