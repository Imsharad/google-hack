
import json
import random
from datetime import datetime, timedelta

def generate_custom_user(days_history=730):
    """
    Generates a Plaid Custom User JSON configuration with rich transaction history.
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_history)
    
    transactions = []
    
    # Recurring Income
    def add_salary(date):
        transactions.append({
            "date": date.strftime("%Y-%m-%d"),
            "amount": -3200.50,
            "description": "Gusto Payroll",
            "category": ["Transfer", "Payroll", "Deposit"],
            "currency": "USD"
        })

    # Recurring Expenses
    subscriptions = [
        {"name": "Netflix", "amount": 15.99, "category": ["Service", "Entertainment"]},
        {"name": "Spotify", "amount": 9.99, "category": ["Service", "Entertainment"]},
        {"name": "Gym", "amount": 45.00, "category": ["Recreation", "Gyms and Fitness Centers"]},
        {"name": "AWS", "amount": 24.50, "category": ["Service", "Internet Services"]}
    ]
    
    rent = {"name": "Equity Residential", "amount": 1850.00, "category": ["Payment", "Rent"]}
    utilities = {"name": "PG&E", "amount": 120.00, "category": ["Service", "Utilities"]}

    # Random Expenses
    coffees = [
        {"name": "Starbucks", "amount": 5.50},
        {"name": "Blue Bottle", "amount": 6.75},
        {"name": "Peet's Coffee", "amount": 4.95}
    ]
    
    groceries = [
        {"name": "Whole Foods", "amount": 85.00},
        {"name": "Trader Joe's", "amount": 45.00},
        {"name": "Safeway", "amount": 60.00}
    ]
    
    dining = [
        {"name": "Chipotle", "amount": 14.50},
        {"name": "Sweetgreen", "amount": 18.25},
        {"name": "Local Pizza", "amount": 25.00},
        {"name": "Sushi Bar", "amount": 65.00}
    ]
    
    # Generate Daily Data
    current_date = start_date
    while current_date <= end_date:
        day_of_month = current_date.day
        is_weekend = current_date.weekday() >= 5
        
        # Salary: 1st and 15th
        if day_of_month == 1 or day_of_month == 15:
            add_salary(current_date)
            
        # Rent: 1st
        if day_of_month == 1:
            transactions.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "amount": rent["amount"],
                "description": rent["name"],
                "category": rent["category"],
                "currency": "USD"
            })
            
        # Utilities: 10th
        if day_of_month == 10:
             transactions.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "amount": utilities["amount"] + random.uniform(-10, 20),
                "description": utilities["name"],
                "category": utilities["category"],
                "currency": "USD"
            })
            
        # Subscriptions: Random days but consistent
        for i, sub in enumerate(subscriptions):
            if day_of_month == (5 + i):
                transactions.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "amount": sub["amount"],
                    "description": sub["name"],
                    "category": sub["category"],
                    "currency": "USD"
                })

        # Variable Spending
        # Coffee: 60% chance daily
        if random.random() < 0.6:
            coffee = random.choice(coffees)
            transactions.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "amount": coffee["amount"] + random.uniform(-0.5, 0.5), # Slight variance
                "description": coffee["name"],
                "category": ["Food and Drink", "Coffee Shop"],
                "currency": "USD"
            })
            
        # Groceries: Weekly-ish (20% daily chance)
        if random.random() < 0.2:
            grocery = random.choice(groceries)
            transactions.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "amount": grocery["amount"] + random.uniform(-15, 30),
                "description": grocery["name"],
                "category": ["Food and Drink", "Groceries"],
                "currency": "USD"
            })
            
        # Dining: More on weekends
        dining_chance = 0.5 if is_weekend else 0.2
        if random.random() < dining_chance:
            dinner = random.choice(dining)
            transactions.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "amount": dinner["amount"] + random.uniform(-5, 15),
                "description": dinner["name"],
                "category": ["Food and Drink", "Restaurants"],
                "currency": "USD"
            })

        current_date += timedelta(days=1)
        
    # Construct final object
    custom_user = {
        "override_accounts": [
            {
                "type": "depository",
                "subtype": "checking",
                "numbers": {
                    "account": "1111222233330000",
                    "routing": "011401533"
                },
                "starting_balance": 5000,
                "force_available_balance": 4500,
                "meta": {
                    "name": "Plaid Gold Checking",
                    "limit": None
                },
                "transactions": transactions
            }
        ]
    }
    
    return custom_user

if __name__ == "__main__":
    user_data = generate_custom_user()
    output_path = "custom_user.json"
    with open(output_path, "w") as f:
        json.dump(user_data, f, indent=2)
    
    print(f"Generated {len(user_data['override_accounts'][0]['transactions'])} transactions.")
    print(f"Saved to {output_path}")
