import csv
import re
import sys

INPUT_FILE = '/Users/bruce/Downloads/venues.csv'

def is_online(row):
    text = (row.get('address', '') + ' ' + row.get('postcode', '')).lower()
    return 'online' in text

def parse_row(row):
    address = row.get('address', '').strip()
    postcode = row.get('postcode', '').strip()
    
    # Check if online
    if is_online(row):
        return 'IGNORED', None, None

    # Heuristic 1: Starts with digit -> likely address only (e.g. "316 High Road")
    # Need search
    if address and address[0].isdigit():
        return 'SEARCH', None, None

    # Heuristic 2: Contains comma
    # "Jamboree, 6 Saint Chad's Place, London" -> "Jamboree" | "6 Saint Chad's Place, London"
    if ',' in address:
        parts = address.split(',', 1)
        potential_name = parts[0].strip()
        potential_address = parts[1].strip()
        
        # Check if potential_name looks like a number range "1-5 High St"
        # If it starts with digit... handled by Heuristic 1? 
        # But "1, High St" -> "1" is name? No.
        
        # Assume if it starts with letter, it's a name
        return 'FOUND', potential_name, potential_address

    # Heuristic 3: No comma, starts with letter
    # "Vaulty Towers" -> Name="Vaulty Towers", Address=""?
    # Or "Surrey Quays Shopping Centre"
    # We might want to search to confirm address, but for extraction:
    return 'FOUND', address, ''

def main():
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            # fieldnames = reader.fieldnames
            
            ignored_rows = []
            search_rows = []
            processed_rows = []
            
            for row in reader:
                status, name, addr = parse_row(row)
                
                if status == 'IGNORED':
                    ignored_rows.append(row)
                elif status == 'SEARCH':
                    search_rows.append(row)
                elif status == 'FOUND':
                    row['name'] = name
                    row['address'] = addr
                    processed_rows.append(row)

        # Output stats
        print(f"Total Rows: {len(ignored_rows) + len(search_rows) + len(processed_rows)}")
        print(f"Ignored (Online): {len(ignored_rows)}")
        print(f"Processed (Heuristic): {len(processed_rows)}")
        print(f"To Search (Ambiguous/Address-only): {len(search_rows)}")
        
        # Dump search rows for Agent to see
        print("\n--- Rows to Search ---")
        for r in search_rows:
            print(f"ID: {r['id']} | Address: {r['address']} | Postcode: {r['postcode']}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
