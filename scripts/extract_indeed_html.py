#!/usr/bin/env python3
"""
Enhanced Indeed Job Application HTML Extractor
Extracts job application data from saved Indeed HTML pages with improved error handling.
"""

import os
import json
import sys
import logging
import argparse
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('extraction.log', mode='a')
    ]
)

logger = logging.getLogger(__name__)

# Try to import BeautifulSoup
try:
    from bs4 import BeautifulSoup
except ImportError:
    logger.error("BeautifulSoup4 is not installed.")
    print("Please install it using: pip install beautifulsoup4")
    sys.exit(1)

# --- Configuration ---
POSSIBLE_INPUTS = [
    '../extract/My jobs _ Indeed.html',
    '../My jobs _ Indeed.html',
    '../data/My jobs _ Indeed.html',
    'My jobs _ Indeed.html'
]
OUTPUT_FILE = '../src/data/indeed-applications.json'


class DateParser:
    """Handles parsing of Indeed's relative date formats."""
    
    @staticmethod
    def parse(text: str) -> str:
        """
        Parses Indeed's date text into YYYY-MM-DD format.
        """
        today = datetime.now()
        text_lower = text.lower()
        
        # Clean the string
        clean_text = text_lower.replace("applied", "").replace("on indeed", "").replace("on", "").strip()
        
        if not clean_text:
            return today.strftime("%Y-%m-%d")
        
        try:
            # Handle "today"
            if "today" in clean_text:
                return today.strftime("%Y-%m-%d")
            
            # Handle "yesterday"
            if "yesterday" in clean_text:
                return (today - timedelta(days=1)).strftime("%Y-%m-%d")
            
            # Handle "Mon DD" format (e.g., "Sep 16")
            try:
                dt = datetime.strptime(clean_text, "%b %d")
                dt = dt.replace(year=today.year)
                
                # If date is in future, assume previous year
                if dt > today:
                    dt = dt.replace(year=today.year - 1)
                
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                pass
            
            # Handle day of week (e.g., "Mon", "Tue")
            days_map = {
                'mon': 0, 'tue': 1, 'wed': 2, 'thu': 3,
                'fri': 4, 'sat': 5, 'sun': 6
            }
            
            day_abbr = clean_text[:3]
            if day_abbr in days_map:
                target_weekday = days_map[day_abbr]
                current_weekday = today.weekday()
                
                days_ago = (current_weekday - target_weekday) % 7
                if days_ago == 0:
                    days_ago = 7  # Assume last week if same day
                
                return (today - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        
        except Exception as e:
            logger.warning(f"Date parsing error for '{text}': {e}")
        
        # Fallback
        return today.strftime("%Y-%m-%d")


class IndeedExtractor:
    """Extracts job application data from Indeed HTML."""
    
    def __init__(self, html_path: str):
        self.html_path = html_path
        self.soup = None
        self.stats = {
            'total_cards': 0,
            'successful': 0,
            'warnings': 0,
            'errors': 0
        }
    
    def load_html(self) -> bool:
        """Load and parse HTML file."""
        try:
            with open(self.html_path, 'r', encoding='utf-8') as f:
                content = f.read()
                self.soup = BeautifulSoup(content, 'html.parser')
            logger.info(f"Successfully loaded HTML from: {self.html_path}")
            return True
        except FileNotFoundError:
            logger.error(f"File not found: {self.html_path}")
            return False
        except Exception as e:
            logger.error(f"Error loading HTML: {e}")
            return False
    
    def extract_title(self, card) -> str:
        """Extract job title from card."""
        try:
            title_elem = card.find(class_='atw-JobInfo-jobTitle')
            if title_elem:
                raw_title = title_elem.get_text(strip=True)
                # Remove accessibility text
                return raw_title.replace("job description opens in a new window", "").strip()
        except Exception as e:
            logger.warning(f"Error extracting title: {e}")
        return "Unknown Title"
    
    def extract_company_location(self, card) -> Tuple[str, str]:
        """Extract company and location from card."""
        company = "Unknown Company"
        location = "Unknown Location"
        
        try:
            container = card.find(class_='atw-JobInfo-companyLocation')
            if container:
                spans = container.find_all('span')
                if len(spans) >= 1:
                    company = spans[0].get_text(strip=True)
                if len(spans) >= 2:
                    location = spans[1].get_text(strip=True)
        except Exception as e:
            logger.warning(f"Error extracting company/location: {e}")
        
        return company, location
    
    def extract_status(self, card) -> str:
        """Extract application status from card."""
        try:
            status_elem = card.find(class_='atw-StatusTag-description')
            if status_elem:
                return status_elem.get_text(strip=True)
        except Exception as e:
            logger.warning(f"Error extracting status: {e}")
        return "Applied"
    
    def extract_date(self, card) -> str:
        """Extract and parse application date from card."""
        try:
            date_elem = card.find(attrs={"data-testid": "jobStatusDateShort"})
            if date_elem:
                raw_date = date_elem.get_text(strip=True)
                return DateParser.parse(raw_date)
        except Exception as e:
            logger.warning(f"Error extracting date: {e}")
        
        return datetime.now().strftime("%Y-%m-%d")
    
    def extract_applications(self) -> List[Dict]:
        """Extract all job applications from HTML."""
        if not self.soup:
            logger.error("HTML not loaded. Call load_html() first.")
            return []
        
        cards = self.soup.find_all(class_='atw-AppCard')
        self.stats['total_cards'] = len(cards)
        
        logger.info(f"Found {len(cards)} job cards. Processing...")
        
        applications = []
        
        for index, card in enumerate(cards, 1):
            try:
                app_data = {
                    'id': index,
                    'title': self.extract_title(card),
                    'status': self.extract_status(card),
                    'date_applied': self.extract_date(card)
                }
                
                company, location = self.extract_company_location(card)
                app_data['company'] = company
                app_data['location'] = location
                
                applications.append(app_data)
                self.stats['successful'] += 1
                
            except Exception as e:
                logger.error(f"Error processing card {index}: {e}")
                self.stats['errors'] += 1
        
        return applications
    
    def print_stats(self):
        """Print extraction statistics."""
        logger.info("=" * 50)
        logger.info("EXTRACTION STATISTICS")
        logger.info("=" * 50)
        logger.info(f"Total cards found: {self.stats['total_cards']}")
        logger.info(f"Successfully extracted: {self.stats['successful']}")
        logger.info(f"Warnings: {self.stats['warnings']}")
        logger.info(f"Errors: {self.stats['errors']}")
        logger.info("=" * 50)


def backup_existing_data(output_path: str) -> bool:
    """Create backup of existing data file."""
    if os.path.exists(output_path):
        try:
            import shutil
            backup_path = output_path.replace('.json', f'.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
            shutil.copy2(output_path, backup_path)
            logger.info(f"Created backup: {backup_path}")
            return True
        except Exception as e:
            logger.warning(f"Could not create backup: {e}")
            return False
    return True


def save_json(data: Dict, output_path: str) -> bool:
    """Save data to JSON file with validation."""
    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Validate JSON before saving
        json_str = json.dumps(data, indent=2, ensure_ascii=False)
        
        # Write to file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(json_str)
        
        logger.info(f"Data saved to: {output_path}")
        return True
        
    except Exception as e:
        logger.error(f"Error saving JSON: {e}")
        return False


def find_input_file() -> Optional[str]:
    """Locate the HTML input file."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    for path in POSSIBLE_INPUTS:
        full_path = os.path.join(script_dir, path)
        if os.path.exists(full_path):
            return full_path
    
    logger.error("Could not find 'My jobs _ Indeed.html'")
    logger.error(f"Checked paths: {POSSIBLE_INPUTS}")
    return None


def main():
    """Main extraction workflow."""
    logger.info("Starting Indeed Application Data Extraction")
    
    # NEW: Command line argument parsing
    parser = argparse.ArgumentParser(description='Extract job application data from Indeed HTML.')
    parser.add_argument('input_file', nargs='?', help='Path to the Indeed HTML file')
    args = parser.parse_args()

    # 1. Determine input file path
    input_path = None
    if args.input_file:
        if os.path.exists(args.input_file):
            input_path = args.input_file
        else:
            logger.error(f"Provided input file not found: {args.input_file}")
            sys.exit(1)
    else:
        input_path = find_input_file()
    
    if not input_path:
        sys.exit(1)
    
    # 2. Initialize extractor
    extractor = IndeedExtractor(input_path)
    
    if not extractor.load_html():
        sys.exit(1)
    
    # 3. Extract applications
    applications = extractor.extract_applications()
    
    if not applications:
        logger.error("No applications extracted. Exiting.")
        sys.exit(1)
    
    # 4. Create output structure
    output_data = {
        "meta": {
            "export_date": datetime.now().strftime("%Y-%m-%d"),
            "source": "Indeed Application History (HTML Extract)",
            "total_entries": len(applications),
            "creation_timestamp": datetime.now().isoformat(),
            "extractor_version": "2.0"
        },
        "applications": applications
    }
    
    # 5. Backup existing data
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, OUTPUT_FILE)
    backup_existing_data(output_path)
    
    # 6. Save to file
    if save_json(output_data, output_path):
        extractor.print_stats()
        logger.info(f"✓ Successfully extracted {len(applications)} applications")
    else:
        logger.error("Failed to save data")
        sys.exit(1)


if __name__ == "__main__":
    main()