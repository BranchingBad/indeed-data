import json
import logging
import datetime
import os

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

logging.info("Starting clean_json.py script.")

# Determine the absolute path to the data file relative to this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, '../data/indeed-applications.json')

try:
    with open(DATA_FILE, 'r') as f:
        logging.info(f"Reading '{DATA_FILE}'.")
        data = json.load(f)
except FileNotFoundError:
    logging.error(f"'{DATA_FILE}' not found.")
    exit()
except json.JSONDecodeError:
    logging.error(f"Error decoding JSON from '{DATA_FILE}'.")
    exit()


logging.info(f"Processing {len(data['applications'])} applications.")

# Add creation timestamp to meta
if 'meta' not in data:
    data['meta'] = {}

data['meta']['creation_timestamp'] = datetime.datetime.now().isoformat()
logging.info(f"Added creation_timestamp: {data['meta']['creation_timestamp']}")

for application in data['applications']:
    if 'original_date_text' in application:
        del application['original_date_text']
    if 'sub_status' in application:
        del application['sub_status']

try:
    with open(DATA_FILE, 'w') as f:
        logging.info(f"Writing cleaned data to '{DATA_FILE}'.")
        json.dump(data, f, indent=2)
except IOError:
    logging.error(f"Could not write to '{DATA_FILE}'.")

logging.info("clean_json.py script finished successfully.")