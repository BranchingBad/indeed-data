import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

logging.info("Starting fix_json.py script.")

try:
    with open('indeed-applications.json', 'r') as f:
        logging.info("Reading 'indeed-applications.json'.")
        try:
            data = json.load(f)
        except json.JSONDecodeError as e:
            logging.error(f"Error decoding JSON: {e}")
            logging.info("Attempting to fix JSON by removing trailing commas.")
            f.seek(0)
            file_content = f.read()
            # This is a bit of a hack, but it should work for this specific case
            file_content = file_content.replace('},]', '}]')
            data = json.loads(file_content)
except FileNotFoundError:
    logging.error("'indeed-applications.json' not found.")
    exit()


try:
    with open('indeed-applications.json', 'w') as f:
        logging.info("Writing fixed data back to 'indeed-applications.json'.")
        json.dump(data, f, indent=2)
except IOError:
    logging.error("Could not write to 'indeed-applications.json'.")

logging.info("fix_json.py script finished successfully.")
