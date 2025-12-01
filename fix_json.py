
import json

with open('indeed-applications.json', 'r') as f:
    try:
        data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        # Attempt to fix the JSON by removing trailing commas
        f.seek(0)
        file_content = f.read()
        # This is a bit of a hack, but it should work for this specific case
        file_content = file_content.replace('},]', '}]')
        data = json.loads(file_content)


with open('indeed-applications.json', 'w') as f:
    json.dump(data, f, indent=2)
