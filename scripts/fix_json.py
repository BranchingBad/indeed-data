import json
import logging
import re
import os

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

TARGET_FILE = '../data/indeed-applications.json'

logging.info("Starting fix_json.py script.")

if not os.path.exists(TARGET_FILE):
    logging.error(f"'{TARGET_FILE}' not found.")
    exit()

try:
    with open(TARGET_FILE, 'r') as f:
        logging.info(f"Reading '{TARGET_FILE}'.")
        file_content = f.read()
        
    try:
        data = json.loads(file_content)
        logging.info("JSON is already valid. No fixes needed.")
    except json.JSONDecodeError as e:
        logging.warning(f"JSON Error detected: {e}")
        logging.info("Attempting to fix trailing commas using Regex...")
        
        # Regex to remove trailing commas before closing braces/brackets
        # Matches a comma, followed by whitespace, followed by } or ]
        fixed_content = re.sub(r',(\s*[}\]])', r'\1', file_content)
        
        data = json.loads(fixed_content)
        logging.info("JSON successfully fixed and parsed.")

    with open(TARGET_FILE, 'w') as f:
        logging.info(f"Writing sanitized data to '{TARGET_FILE}'.")
        json.dump(data, f, indent=2)

except Exception as e:
    logging.error(f"Critical error: {e}")

logging.info("fix_json.py script finished.")