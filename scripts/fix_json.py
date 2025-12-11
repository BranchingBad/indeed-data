import json
import logging
import re
import os
import sys

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Determine the absolute path to the data file relative to this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TARGET_FILE = os.path.join(BASE_DIR, '../data/indeed-applications.json')

def clean_json_string(content):
    """
    Attempts to clean common JSON syntax errors:
    1. Trailing commas
    2. Comments (// or /* */)
    """
    # Remove single line comments // ...
    content = re.sub(r'//.*', '', content)
    # Remove multi-line comments /* ... */
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    # Remove trailing commas before closing braces/brackets
    # Matches a comma, followed by whitespace (optional), followed by } or ]
    content = re.sub(r',(\s*[}\]])', r'\1', content)
    
    return content

def main():
    logging.info("Starting fix_json.py script.")

    if not os.path.exists(TARGET_FILE):
        logging.error(f"'{TARGET_FILE}' not found.")
        sys.exit(1)

    try:
        with open(TARGET_FILE, 'r', encoding='utf-8') as f:
            logging.info(f"Reading '{TARGET_FILE}'.")
            file_content = f.read()
            
        try:
            # 1. Try standard parse first
            data = json.loads(file_content)
            logging.info("JSON is already valid. No fixes needed.")
        except json.JSONDecodeError as e:
            logging.warning(f"JSON Error detected: {e}")
            logging.info("Attempting to fix syntax errors (trailing commas, comments)...")
            
            # 2. Clean content
            fixed_content = clean_json_string(file_content)
            
            # 3. Try parsing again
            data = json.loads(fixed_content)
            logging.info("JSON successfully fixed and parsed.")

            # 4. Save cleaned version
            with open(TARGET_FILE, 'w', encoding='utf-8') as f:
                logging.info(f"Writing sanitized data to '{TARGET_FILE}'.")
                json.dump(data, f, indent=2)

    except json.JSONDecodeError as e:
        logging.error("Failed to fix JSON automatically. The file may be too corrupted.")
        logging.error(f"Details: {e}")
    except Exception as e:
        logging.error(f"Critical error: {e}")

    logging.info("fix_json.py script finished.")

if __name__ == "__main__":
    main()