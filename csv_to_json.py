import csv
import json

INPUT_FILE = '/Users/bruce/Projects/github/neon/venues_wip.csv'
OUTPUT_FILE = '/Users/bruce/Projects/github/neon/venues_wip.json'

def main():
    try:
        data = []
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                data.append(row)
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
            
        print(f"Successfully converted {len(data)} rows to {OUTPUT_FILE}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
