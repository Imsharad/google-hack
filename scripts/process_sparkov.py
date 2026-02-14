import csv
import glob
import os

OUTPUT_FILE = 'data/transactions.csv'
INPUT_DIR = 'data/sparkov_output'

def process_data():
    files = glob.glob(os.path.join(INPUT_DIR, '*.csv'))
    
    if not files:
        print("No CSV files found in", INPUT_DIR)
        return

    all_transactions = []
    
    for file in files:
        with open(file, 'r') as f:
            # Inspect first line to determine format/headers if needed
            first_line = f.readline()
            f.seek(0)
            
            # Sparkov output is pipe separated
            reader = csv.DictReader(f, delimiter='|')
            # Sparkov columns: cc_num, amt, zip, lat, long, city, state, zip, job, dob, trans_num, trans_date, trans_time, unix_time, category, merchant, is_fraud
            # Note: Columns might vary by version. We'll inspect header.
            
            for row in reader:
                # Skip empty or malformed rows
                if not row.get('category') or not row.get('merchant'):
                    continue

                # Clean merchant name
                merchant = row.get('merchant', '').replace('fraud_', '').strip()
                
                # Format date
                # Sparkov provides 'trans_date' (YYYY-MM-DD) and 'trans_time' (HH:MM:SS) or 'trans_date_trans_time'
                date_str = row.get('trans_date_trans_time', '')
                if not date_str:
                     date_str = f"{row.get('trans_date')} {row.get('trans_time')}"
                
                # Transaction ID
                txn_id = row.get('trans_num')

                # Category
                category = row.get('category').replace('_', ' ').title()

                all_transactions.append({
                    'transaction_id': txn_id,
                    'date': date_str,
                    'merchant': merchant,
                    'amount': float(row['amt']), # Expenses are positive in Plaid/App model
                    'category': category,
                    'status': 'posted'
                })

    # Sort by date
    all_transactions.sort(key=lambda x: x['date'], reverse=True)

    # Write to final CSV
    with open(OUTPUT_FILE, 'w', newline='') as f:
        fieldnames = ['transaction_id', 'date', 'merchant', 'amount', 'category', 'status']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_transactions)

    print(f"Merged {len(files)} files into {OUTPUT_FILE} with {len(all_transactions)} transactions.")

if __name__ == "__main__":
    process_data()
