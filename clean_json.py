import json

with open('Indeed meta export date 01-12-2025.json', 'r') as f:
    data = json.load(f)

for application in data['applications']:
    if 'original_date_text' in application:
        del application['original_date_text']
    if 'sub_status' in application:
        del application['sub_status']

with open('indeed-applications.json', 'w') as f:
    json.dump(data, f, indent=2)