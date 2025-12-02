import json
import logging
import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

logging.info("Starting clean_json.py script.")

try:
    with open('../data/indeed-applications.json', 'r') as f:
        logging.info("Reading '../data/indeed-applications.json'.")
        data = json.load(f)
except FileNotFoundError:
    logging.error("'../data/indeed-applications.json' not found.")
    exit()
except json.JSONDecodeError:
    logging.error("Error decoding JSON from '../data/indeed-applications.json'.")
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
    with open('../data/indeed-applications.json', 'w') as f:
        logging.info("Writing cleaned data to '../data/indeed-applications.json'.")
        json.dump(data, f, indent=2)
except IOError:
    logging.error("Could not write to 'indeed-applications.json'.")

logging.info("clean_json.py script finished successfully.")