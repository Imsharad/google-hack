from fastapi import Depends
from sqlmodel import Session, select
from datetime import datetime, timedelta
import random
from backend.database import engine
from backend.models import Account, Transaction
import csv
import os


def get_session():
    with Session(engine) as session:
        yield session

def seed_demo_transactions(session: Session):
    """Generate synthetic transactions for demo purposes"""
    
    # Get the first account
    account = session.exec(select(Account)).first()
    if not account:
        print("ERROR: No account found. Connect a bank account first.")
        return {"error": "No account found. Connect a bank first."}
    
    merchants = [
        ("Netflix", 15.99, "Entertainment"),
        ("Spotify", 9.99, "Entertainment"),
        ("Amazon Prime", 14.99, "Shopping"),
        ("Amazon", 45.67, "Shopping"),
        ("Starbucks", 5.50, "Food and Drink"),
        ("Uber", 12.30, "Transportation"),
        ("Lyft", 18.45, "Transportation"),
        ("Whole Foods", 87.23, "Groceries"),
        ("Trader Joe's", 52.10, "Groceries"),
        ("Apple", 0.99, "Shopping"),
        ("Gym Membership", 50.00, "Recreation"),
        ("Electric Bill", 120.00, "Utilities"),
        ("Internet", 79.99, "Utilities"),
        ("Water Bill", 45.00, "Utilities"),
        ("Phone Bill", 65.00, "Utilities"),
        ("Chipotle", 12.50, "Food and Drink"),
        ("Target", 67.89, "Shopping"),
        ("Gas Station", 45.00, "Transportation"),
        ("Movie Theater", 25.00, "Entertainment"),
        ("Salary Deposit", -3500.00, "Income"),  # Negative = credit
    ]
    
    # Generate 90 days of transactions
    base_date = datetime.now()
    created = 0
    
    for days_ago in range(90):
        tx_date = base_date - timedelta(days=days_ago)
        
        # Random 1-4 transactions per day
        num_transactions = random.randint(1, 4)
        
        # Add salary every 15 days
        if days_ago % 15 == 0:
            salary_tx = Transaction(
                account_id=account.id,
                provider_transaction_id=f"synthetic_salary_{tx_date.strftime('%Y%m%d')}",
                amount=-3500.00,  # Credit
                date=tx_date,
                name="Payroll Deposit",
                merchant_name="Employer Inc",
                category_primary="Income",
                payment_channel="ach",
                pending=False
            )
            session.add(salary_tx)
            created += 1
        
        for _ in range(num_transactions):
            merchant, base_amount, category = random.choice(merchants)
            
            # Skip income transactions in random selection
            if base_amount < 0:
                continue
            
            # Add realistic variance
            amount = base_amount + random.uniform(-base_amount * 0.2, base_amount * 0.2)
            
            new_tx = Transaction(
                account_id=account.id,
                provider_transaction_id=f"synthetic_{tx_date.strftime('%Y%m%d')}_{created}",
                amount=round(amount, 2),
                date=tx_date,
                name=merchant,
                merchant_name=merchant,
                category_primary=category,
                payment_channel=random.choice(["online", "in store", "other"]),
                pending=random.random() < 0.05  # 5% pending
            )
            session.add(new_tx)
            created += 1
    
    session.commit()
    print(f"✅ Created {created} synthetic transactions")
    return {"status": "success", "transactions_created": created}


def seed_from_csv(session: Session, csv_path: str):
    """Load transactions from a CSV file (Sparkov format)"""
    
    # 1. Ensure Account Exists
    account = session.exec(select(Account).where(Account.name == "Sparkov Checking")).first()
    if not account:
        account = Account(
            provider_account_id="sparkov_main_01",
            name="Sparkov Checking",
            official_name="Sparkov Platinum Checking",
            type="depository",
            mask="0000",
            subtype="checking",
            data_provider="sparkov_synthetic"
        )
        session.add(account)
        session.commit()
        session.refresh(account)
        print(f"Created new account: {account.name}")
    
    # 2. Read CSV
    if not os.path.exists(csv_path):
        return {"error": f"File not found: {csv_path}"}
        
    created_count = 0
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        # CSV Headers: transaction_id,date,merchant,amount,category,status
        
        for row in reader:
            # Avoid duplicates
            existing = session.exec(select(Transaction).where(Transaction.provider_transaction_id == row['transaction_id'])).first()
            if existing:
                continue
                
            # Parse Date (YYYY-MM-DD HH:MM:SS)
            try:
                tx_date = datetime.strptime(row['date'], "%Y-%m-%d %H:%M:%S")
            except ValueError:
                # Fallback if needed
                tx_date = datetime.now()
            
            new_tx = Transaction(
                account_id=account.id,
                provider_transaction_id=row['transaction_id'],
                amount=float(row['amount']),
                date=tx_date,
                name=row['merchant'],
                merchant_name=row['merchant'],
                category_primary=row['category'],
                payment_channel="online", # Default
                pending=row['status'] == 'pending'
            )
            session.add(new_tx)
            created_count += 1
            
    session.commit()
    print(f"✅ Loaded {created_count} transactions from CSV")
    return {"status": "success", "transactions_loaded": created_count}

if __name__ == "__main__":
    # Run this script to seed the database
    with Session(engine) as session:
        # Check for arguments or default to random
        import sys
        if len(sys.argv) > 1 and sys.argv[1] == "csv":
             seed_from_csv(session, "data/transactions.csv")
        else:
             result = seed_demo_transactions(session)
             print(result)
