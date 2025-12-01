import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

logging.info("Starting clean_json.py script.")

try:
    with open('Indeed meta export date 01-12-2025.json', 'r') as f:
        logging.info("Reading 'Indeed meta export date 01-12-2025.json'.")
        data = json.load(f)
except FileNotFoundError:
    logging.error("'Indeed meta export date 01-12-2025.json' not found.")
    exit()
except json.JSONDecodeError:
    logging.error("Error decoding JSON from 'Indeed meta export date 01-12-2025.json'.")
    exit()


logging.info(f"Processing {len(data['applications'])} applications.")
for application in data['applications']:
    if 'original_date_text' in application:
        del application['original_date_text']
    if 'sub_status' in application:
        del application['sub_status']

try:
    with open('indeed-applications.json', 'w') as f:
        logging.info("Writing cleaned data to 'indeed-applications.json'.")
        json.dump(data, f, indent=2)
except IOError:
    logging.error("Could not write to 'indeed-applications.json'.")

logging.info("clean_json.py script finished successfully.")