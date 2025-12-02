import os
import json
import re
from datetime import datetime, timedelta

# Try to import BeautifulSoup
try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Error: BeautifulSoup4 is not installed.")
    print("Please install it using: pip install beautifulsoup4")
    exit(1)

# --- Configuration ---
# Possible locations for the HTML file (relative to this script)
POSSIBLE_INPUTS = [
    '../extract/My jobs _ Indeed.html',
    '../My jobs _ Indeed.html',
    '../data/My jobs _ Indeed.html',
    'My jobs _ Indeed.html'
]
OUTPUT_FILE = '../data/indeed-applications.json'

def get_date_from_text(text):
    """
    Parses Indeed's relative date text into YYYY-MM-DD format.
    Examples of Indeed text: 
    - "Applied today on Indeed"
    - "Applied on Indeed on Sep 16"
    - "Applied on Indeed on Sun"
    """
    today = datetime.now()
    text = text.lower()
    
    # Clean the string
    clean_text = text.replace("applied", "").replace("on indeed", "").replace("on", "").strip()
    
    try:
        if "today" in clean_text:
            return today.strftime("%Y-%m-%d")
        
        if "yesterday" in clean_text:
            d = today - timedelta(days=1)
            return d.strftime("%Y-%m-%d")

        # Handle "Sep 16" format
        # We assume the current year. If the month is in the future relative to today, subtract a year.
        try:
            # Try parsing "Mon DD"
            dt = datetime.strptime(clean_text, "%b %d")
            dt = dt.replace(year=today.year)
            if dt > today:
                dt = dt.replace(year=today.year - 1)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass

        # Handle Day of Week (e.g., "Sun", "Mon")
        # This usually means the most recent occurrence of that day
        days_of_week = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        clean_text_abbr = clean_text[:3]
        if clean_text_abbr in days_of_week:
            target_idx = days_of_week.index(clean_text_abbr)
            current_idx = today.weekday()
            
            days_ago = (current_idx - target_idx) % 7
            if days_ago == 0:
                days_ago = 7 # Assume it wasn't today if it says "Sun" and today is Sun
            
            d = today - timedelta(days=days_ago)
            return d.strftime("%Y-%m-%d")

    except Exception as e:
        print(f"Warning: Could not parse date '{text}'. Using raw string.")
    
    return clean_text or datetime.now().strftime("%Y-%m-%d")

def main():
    # 1. Locate Input File
    input_path = None
    # Resolve script directory to ensure relative paths work
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    for path in POSSIBLE_INPUTS:
        full_path = os.path.join(script_dir, path)
        if os.path.exists(full_path):
            input_path = full_path
            break
    
    if not input_path:
        print("Error: Could not find 'My jobs _ Indeed.html'.")
        print(f"Checked paths: {POSSIBLE_INPUTS}")
        return

    print(f"Reading HTML from: {input_path}")
    
    with open(input_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')

    # 2. Extract Applications
    apps_list = []
    # Indeed uses 'atw-AppCard' class for the job cards
    cards = soup.find_all(class_='atw-AppCard')
    
    print(f"Found {len(cards)} job cards. Processing...")

    for index, card in enumerate(cards, 1):
        app_data = {}
        
        # ID: Use index or data-id attribute if available
        app_data['id'] = index
        
        # Job Title
        title_elem = card.find(class_='atw-JobInfo-jobTitle')
        app_data['title'] = title_elem.get_text(strip=True) if title_elem else "Unknown Title"
        
        # Company & Location
        # usually found in atw-JobInfo-companyLocation which has two spans
        company_loc_container = card.find(class_='atw-JobInfo-companyLocation')
        if company_loc_container:
            spans = company_loc_container.find_all('span')
            if len(spans) >= 1:
                app_data['company'] = spans[0].get_text(strip=True)
            else:
                app_data['company'] = "Unknown Company"
                
            if len(spans) >= 2:
                app_data['location'] = spans[1].get_text(strip=True)
            else:
                app_data['location'] = "Remote/Unknown"
        else:
            app_data['company'] = "Unknown Company"
            app_data['location'] = "Unknown"

        # Status
        status_elem = card.find(class_='atw-StatusTag-description')
        app_data['status'] = status_elem.get_text(strip=True) if status_elem else "Applied"

        # Date Applied
        # Often found in a generic text element or specifically marked with data-testid
        date_elem = card.find(attrs={"data-testid": "jobStatusDateShort"})
        raw_date = date_elem.get_text(strip=True) if date_elem else "today"
        app_data['date_applied'] = get_date_from_text(raw_date)

        apps_list.append(app_data)

    # 3. Construct Final JSON Structure
    final_data = {
        "meta": {
            "export_date": datetime.now().strftime("%Y-%m-%d"),
            "source": "Indeed Application History (HTML Extract)",
            "total_entries": len(apps_list),
            "creation_timestamp": datetime.now().isoformat()
        },
        "applications": apps_list
    }

    # 4. Save to File
    output_full_path = os.path.join(script_dir, OUTPUT_FILE)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_full_path), exist_ok=True)
    
    with open(output_full_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=2)

    print(f"Successfully extracted {len(apps_list)} applications.")
    print(f"Data saved to: {output_full_path}")

if __name__ == "__main__":
    main()