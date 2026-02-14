import csv
import random
import datetime
import uuid

# Configuration
NUM_TRANSACTIONS = 500
START_DATE = datetime.date.today() - datetime.timedelta(days=90)
END_DATE = datetime.date.today()

# Realistic Merchants and Categories
# (merchant_name, min_amount, max_amount)
CATEGORIES = {
    "Food & Drink": [
        ("Starbucks", 5.00, 15.00),
        ("McDonald's", 8.00, 25.00),
        ("Whole Foods Market", 30.00, 150.00),
        ("Trader Joe's", 20.00, 100.00),
        ("Uber Eats", 20.00, 60.00),
        ("Sweetgreen", 12.00, 25.00),
        ("Blue Bottle Coffee", 6.00, 18.00),
    ],
    "Transportation": [
        ("Uber", 15.00, 45.00),
        ("Lyft", 12.00, 40.00),
        ("Chevron", 30.00, 70.00),
        ("Shell", 30.00, 70.00),
        ("Clipper Card", 20.00, 50.00),
    ],
    "Shopping": [
        ("Amazon", 15.00, 200.00),
        ("Target", 20.00, 150.00),
        ("Nike", 60.00, 200.00),
        ("Apple Store", 20.00, 1500.00),
        ("Uniqlo", 30.00, 100.00),
        ("Sephora", 40.00, 150.00),
    ],
    "Entertainment": [
        ("Netflix", 15.99, 15.99),
        ("Spotify", 10.99, 10.99),
        ("AMC Theatres", 20.00, 50.00),
        ("Steam", 10.00, 60.00),
        ("PlayStation Network", 10.00, 70.00),
    ],
    "Bills & Utilities": [
        ("PG&E", 80.00, 200.00),
        ("Comcast Xfinity", 60.00, 120.00),
        ("Verizon Wireless", 80.00, 150.00),
        ("City Water", 40.00, 100.00),
    ],
    "Housing": [
        ("Equity Residential", 2500.00, 3200.00),
    ],
    "Health": [
        ("CVS Pharmacy", 10.00, 60.00),
        ("Walgreens", 10.00, 60.00),
        ("One Medical", 20.00, 50.00),
    ],
}

INCOME_SOURCES = [
    ("Gusto Payroll", 3500.00, 4500.00),
    ("Venmo Cashout", 50.00, 200.00),
]

def random_date(start, end):
    return start + datetime.timedelta(
        days=random.randint(0, int((end - start).days)),
    )

def generate_transactions(filename):
    transactions = []
    
    # Generate regular expenses
    for _ in range(NUM_TRANSACTIONS):
        # Pick a random category
        category = random.choice(list(CATEGORIES.keys()))
        # Pick a merchant within that category
        merchant_data = random.choice(CATEGORIES[category])
        merchant_name = merchant_data[0]
        min_amt, max_amt = merchant_data[1], merchant_data[2]
        
        amount = round(random.uniform(min_amt, max_amt), 2)
        date = random_date(START_DATE, END_DATE)
        
        transactions.append({
            "transaction_id": str(uuid.uuid4()),
            "date": date.isoformat(),
            "merchant": merchant_name,
            "amount": -amount, # Expenses are negative
            "category": category,
            "status": "posted"
        })

    # Add recurring income (semi-monthly)
    current_date = START_DATE
    while current_date <= END_DATE:
        # Payday 15th and 28th roughly
        if current_date.day == 15 or current_date.day == 28:
             transactions.append({
                "transaction_id": str(uuid.uuid4()),
                "date": current_date.isoformat(),
                "merchant": "Gusto Payroll",
                "amount": round(random.uniform(3800.00, 4200.00), 2),
                "category": "Income",
                "status": "posted"
            })
        current_date += datetime.timedelta(days=1)

    # Sort by date descending (newest first)
    transactions.sort(key=lambda x: x['date'], reverse=True)

    # Write to CSV
    with open(filename, 'w', newline='') as csvfile:
        fieldnames = ['transaction_id', 'date', 'merchant', 'amount', 'category', 'status']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for txn in transactions:
            writer.writerow(txn)

    print(f"Generated {len(transactions)} transactions to {filename}")

if __name__ == "__main__":
    generate_transactions('data/transactions.csv')
