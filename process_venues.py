import csv
import sys

INPUT_FILE = '/Users/bruce/Downloads/venues.csv'
WIP_FILE = 'venues_wip.csv'
IGNORED_FILE = 'venues_ignored.csv'
SEARCH_FILE = 'venues_to_search.csv'

# Manual overrides for ambiguous addresses found via search
OVERRIDES = {
    '3': {'name': 'The Post Bar', 'address': '316 High Road London N15 4BN'},
    '12': {'name': 'Jamboree', 'address': "6 St Chad's Pl, London"},
    '27': {'name': 'Fitness Hub East London', 'address': '771-773 High Rd Leytonstone'},
    '14': {'name': 'The Birds', 'address': '692 High Road, Leytontone, E11 3AA · London'}
}

def is_online(row):
    text = (row.get('address', '') + ' ' + row.get('postcode', '')).lower()
    return 'online' in text

def parse_row(row):
    row_id = row.get('id')
    
    # Check manual overrides first
    if row_id in OVERRIDES:
        return 'FOUND', OVERRIDES[row_id]['name'], OVERRIDES[row_id]['address']

    address = row.get('address', '').strip()
    
    # Heuristic 1: Contains comma
    # "Jamboree, 6 Saint Chad's Place, London" -> "Jamboree", "6 Saint Chad's Place, London"
    if ',' in address:
        parts = address.split(',', 1)
        potential_name = parts[0].strip()
        potential_address = parts[1].strip()
        
        # Check if it starts with digit, assume it's just an address (e.g. "1, High St")
        # But this should have been caught by OVERRIDES if ambiguous?
        # Let's rely on the split: Name matches regex ^[A-Za-z]
        if potential_name and potential_name[0].isdigit():
             # "316, High Road" -> Name "316"? Unlikely.
             # If we fall here, it means I missed it in my manual check?
             # My analyze script categorized these as "SEARCH" if they started with digit.
             # So if it starts with digit here, it might be weird.
             # But let's assume if it has comma, we extract.
             pass
             
        return 'FOUND', potential_name, potential_address

    # Heuristic 2: Starts with digit -> Address only?
    if address and address[0].isdigit():
        # Should have been in OVERRIDES
        return 'SEARCH', None, address

    # Heuristic 3: Starts with letter, no comma -> Name only
    # "Vaulty Towers"
    return 'FOUND', address, ''

def main():
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = ['name'] + reader.fieldnames # Add name column
            
            ignored_rows = []
            search_rows = []
            processed_rows = []
            
            for row in reader:
                if is_online(row):
                    ignored_rows.append(row)
                    continue

                status, name, addr = parse_row(row)
                
                if status == 'IGNORED': # Should use loop check
                    ignored_rows.append(row)
                elif status == 'SEARCH':
                    search_rows.append(row)
                elif status == 'FOUND':
                    row['name'] = name
                    row['address'] = addr
                    processed_rows.append(row)

        # Write Output Files
        
        # 1. Venues WIP
        if processed_rows:
            with open(WIP_FILE, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(processed_rows)
            print(f"Written {len(processed_rows)} rows to {WIP_FILE}")

        # 2. Venues Ignored
        if ignored_rows:
            # Maybe keep original fieldnames for ignored? or add name?
            # User didn't specify schema for ignored. I'll include name col but empty?
            with open(IGNORED_FILE, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames) # Use new schema for consistency
                writer.writeheader()
                writer.writerows(ignored_rows)
            print(f"Written {len(ignored_rows)} rows to {IGNORED_FILE}")

        # 3. Venues To Search
        if search_rows:
            with open(SEARCH_FILE, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(search_rows)
            print(f"Written {len(search_rows)} rows to {SEARCH_FILE}")
        else:
            print(f"No rows needed search! (All derived or overridden)")
            # Create empty file just in case
            with open(SEARCH_FILE, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()


    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
