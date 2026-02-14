from typing import List, Dict, Any
from collections import defaultdict
from datetime import datetime, timedelta
import statistics
import math

from models import Transaction

def compute_financial_dna(transactions: List[Transaction]) -> Dict[str, Any]:
    """
    Computes Shannon entropy of spending, top merchants, velocity, and concentration.
    """
    if not transactions:
        return {
            "entropy": 0,
            "velocity": 0,
            "top_merchants": [],
            "concentration": 0
        }

    # 1. Access core data
    amounts = [t.amount for t in transactions if t.amount > 0] # Filter out credits/refunds for spending DNA
    categories = [t.category_primary or "Uncategorized" for t in transactions if t.amount > 0]
    merchants = [t.merchant_name or t.name for t in transactions if t.amount > 0]
    
    if not amounts:
        return {
             "entropy": 0,
            "velocity": 0,
            "top_merchants": [],
            "concentration": 0
        }

    total_spend = sum(amounts)
    
    # 2. Compute Entropy (Diversity of spending)
    category_counts = defaultdict(float)
    for cat, amt in zip(categories, amounts):
        category_counts[cat] += amt
    
    entropy = 0
    for cat_total in category_counts.values():
        p = cat_total / total_spend
        if p > 0:
            entropy -= p * math.log2(p)

    # 3. Compute Velocity ($/day)
    dates = [t.date for t in transactions]
    if dates:
        date_range = (max(dates) - min(dates)).days + 1
        velocity = total_spend / date_range if date_range > 0 else total_spend
    else:
        velocity = 0

    # 4. Top Merchants
    merchant_counts = defaultdict(float)
    for merch, amt in zip(merchants, amounts):
        merchant_counts[merch] += amt
    
    top_merchants = sorted(merchant_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    top_merchants_list = [{"name": m, "amount": round(v, 2)} for m, v in top_merchants]

    # 5. Concentration Ratio (Top 3 categories / Total Spend)
    top_categories_sum = sum(sorted(category_counts.values(), reverse=True)[:3])
    concentration = top_categories_sum / total_spend if total_spend > 0 else 0

    return {
        "entropy": round(entropy, 2),
        "velocity": round(velocity, 2),
        "top_merchants": top_merchants_list,
        "concentration": round(concentration, 2)
    }

def detect_anomalies(transactions: List[Transaction]) -> Dict[str, Any]:
    """
    Z-score based anomaly detection for transactions > 2 sigma.
    Also detects absence anomalies (not implemented fully in this MVP step but structured).
    """
    if len(transactions) < 5:
        return {"spikes": [], "absences": []}

    # Group by merchant to find merchant-specific anomalies
    merchant_txns = defaultdict(list)
    for t in transactions:
        if t.amount > 0:
             merchant_txns[t.merchant_name or t.name].append(t)

    spikes = []
    
    # Global Z-score for simplicity in this MVP, or per-category? 
    # Let's do a simple global high-value detection first, then per-merchant.
    
    # Per-merchant Z-score is better for "Why is this Uber ride $500?"
    for merchant, txns in merchant_txns.items():
        if len(txns) < 3: continue # Need history to establish baseline
        
        amounts = [t.amount for t in txns]
        mean = statistics.mean(amounts)
        try:
            stdev = statistics.stdev(amounts)
        except statistics.StatisticsError:
            continue
            
        if stdev == 0: continue

        for t in txns:
            z_score = (t.amount - mean) / stdev
            if z_score > 2: # 2 Sigma
                spikes.append({
                    "transaction_id": t.id,
                    "merchant": merchant,
                    "amount": t.amount,
                    "mean": round(mean, 2),
                    "z_score": round(z_score, 2),
                    "date": t.date.isoformat()
                })

    return {
        "spikes": spikes,
        "absences": [] # Placeholder for T1.2 full scope
    }

def detect_subscriptions(transactions: List[Transaction]) -> Dict[str, Any]:
    """
    Finds recurring charges: same merchant, similar amount, regular intervals.
    """
    subscriptions = []
    merchant_txns = defaultdict(list)
    
    # Filter for standard sub amounts (usually < $500, exact amounts often)
    for t in transactions:
        if 0 < t.amount < 1000:
             merchant_txns[t.merchant_name or t.name].append(t)
             
    for merchant, txns in merchant_txns.items():
        if len(txns) < 2: continue
        
        # Sort by date
        txns.sort(key=lambda x: x.date)
        
        # Check intervals
        intervals = []
        for i in range(1, len(txns)):
            delta = (txns[i].date - txns[i-1].date).days
            intervals.append(delta)
            
        if not intervals: continue
        
        avg_interval = statistics.mean(intervals)
        
        # Check if interval is "monthly-ish" (28-31 days) OR "yearly-ish" (360-370)
        is_monthly = 25 <= avg_interval <= 35
        is_yearly = 360 <= avg_interval <= 370
        
        if is_monthly or is_yearly:
            # Check amount stability
            amounts = [t.amount for t in txns]
            amount_variance = statistics.variance(amounts) if len(amounts) > 1 else 0
            
            if amount_variance < 5: # Low variance in subscription prices
                avg_amount = statistics.mean(amounts)
                if is_monthly:
                    annual_cost = avg_amount * 12
                else:
                    annual_cost = avg_amount
                    
                subscriptions.append({
                    "merchant": merchant,
                    "amount": round(avg_amount, 2),
                    "interval_days": round(avg_interval),
                    "annual_cost": round(annual_cost, 2),
                    "five_year_cost": round(annual_cost * 5, 2)
                })
                
    return {
        "subscriptions": subscriptions
    }

def forecast_cashflow(transactions: List[Transaction], days: int = 30) -> Dict[str, Any]:
    """
    Simple moving average forecast for next 30 days.
    """
    if not transactions:
        return {"daily_forecast": [], "danger_dates": [], "surplus_windows": []}
        
    dates = sorted([t.date for t in transactions])
    if not dates: return {}
    
    last_date = dates[-1]
    
    # Calculate daily burn rate (simple average for now)
    total_spend = sum(t.amount for t in transactions if t.amount > 0)
    days_history = (last_date - dates[0]).days + 1
    if days_history < 1: days_history = 1
    daily_burn = total_spend / days_history
    
    forecast = []
    current_burn = 0
    
    for i in range(1, days + 1):
        future_date = last_date + timedelta(days=i)
        forecast.append({
            "date": future_date.isoformat(),
            "projected_spend": round(daily_burn, 2)
        })
        
    return {
        "daily_forecast": forecast,
        "danger_dates": [], # Needs balance data to compute
        "surplus_windows": []
    }

def compute_spending_velocity(transactions: List[Transaction]) -> Dict[str, Any]:
    """
    Current $/day vs Historical Average.
    """
    if not transactions:
        return {"current_pace": 0, "average_pace": 0, "zone": "green"}
        
    sorted_txns = sorted(transactions, key=lambda x: x.date)
    
    # Split into "Current Month" and "History"
    last_date = sorted_txns[-1].date
    start_of_current_month = last_date.replace(day=1)
    
    current_month_txns = [t for t in sorted_txns if t.date >= start_of_current_month]
    history_txns = [t for t in sorted_txns if t.date < start_of_current_month]
    
    # Calculate Current Pace
    days_in_current = (last_date - start_of_current_month).days + 1
    current_spend = sum(t.amount for t in current_month_txns if t.amount > 0)
    current_pace = current_spend / days_in_current if days_in_current > 0 else 0
    
    # Calculate Historical Pace
    if history_txns:
        history_spend = sum(t.amount for t in history_txns if t.amount > 0)
        history_days = (start_of_current_month - sorted_txns[0].date).days
        average_pace = history_spend / history_days if history_days > 0 else 0
    else:
         average_pace = current_pace # Fallback if no history
         
    # Determine Zone
    if average_pace > 0:
        ratio = current_pace / average_pace
        if ratio < 1.2:
            zone = "green"
        elif ratio < 1.5:
            zone = "yellow"
        else:
            zone = "red"
    else:
        zone = "green"

    return {
        "current_pace": round(current_pace, 2),
        "average_pace": round(average_pace, 2),
        "zone": zone
    }

def compute_health_score(velocity: Dict[str, Any], anomalies: Dict[str, Any], subscriptions: Dict[str, Any], dna: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes a 0-100 financial health score based on 4 components.
    """
    # 1. Velocity Score
    velocity_zone = velocity.get("zone", "green")
    velocity_score = {"green": 100, "yellow": 60, "red": 30}.get(velocity_zone, 100)

    # 2. Anomaly Score
    spike_count = len(anomalies.get("spikes", []))
    anomaly_score = max(0, min(100, 100 - (spike_count * 15)))

    # 3. Subscription Score
    sub_count = len(subscriptions.get("subscriptions", []))
    subscription_score = max(0, min(100, 100 - (sub_count * 5)))

    # 4. Diversity Score
    entropy = dna.get("entropy", 0)
    diversity_score = max(0, min(100, (entropy / 3.0) * 100))

    # Composite Score
    # weights: velocity 35%, anomaly 25%, subscription 15%, diversity 25%
    composite = (velocity_score * 0.35) + \
                (anomaly_score * 0.25) + \
                (subscription_score * 0.15) + \
                (diversity_score * 0.25)
    
    final_score = int(composite)
    
    if final_score >= 80:
        zone = "green"
    elif final_score >= 50:
        zone = "amber"
    else:
        zone = "red"

    return {
        "score": final_score,
        "zone": zone,
        "components": {
            "velocity": velocity_score,
            "anomaly": anomaly_score,
            "subscription": subscription_score,
            "diversity": diversity_score
        }
    }

def compute_month_summary(transactions: List[Transaction]) -> Dict[str, Any]:
    """
    Aggregates spending for the current month vs previous.
    """
    if not transactions:
        return {
            "total_spent": 0,
            "daily_average": 0,
            "top_category": {"category": "None", "amount": 0},
            "anomalies_found": 0,
            "days_elapsed": 0,
            "deltas": {"spend": 0}
        }

    now = datetime.now()
    current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Python 3.7+ way to get previous month
    last_month_end = current_month_start - timedelta(days=1)
    prev_month_start = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    current_txns = [t for t in transactions if t.date >= current_month_start and t.amount > 0]
    prev_txns = [t for t in transactions if prev_month_start <= t.date < current_month_start and t.amount > 0]
    
    current_spent = sum(t.amount for t in current_txns)
    prev_spent = sum(t.amount for t in prev_txns)
    
    days_elapsed = (now - current_month_start).days + 1
    daily_avg = current_spent / days_elapsed if days_elapsed > 0 else 0
    
    # Top Category
    cat_counts = defaultdict(float)
    for t in current_txns:
        cat_counts[t.category_primary or "Uncategorized"] += t.amount
    
    if cat_counts:
        top_cat = sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)[0]
    else:
        top_cat = ("None", 0)
    
    # Delta
    delta = 0
    if prev_spent > 0:
        delta = ((current_spent - prev_spent) / prev_spent) * 100
        
    return {
        "total_spent": round(current_spent, 2),
        "daily_average": round(daily_avg, 2),
        "top_category": {"category": top_cat[0], "amount": round(top_cat[1], 2)},
        "anomalies_found": 0, # Will be filled by caller using detect_anomalies result
        "days_elapsed": days_elapsed,
        "deltas": {"spend": round(delta, 1)}
    }

CATEGORY_COLORS = {
    # Modern Fintech Palette (Slate/Indigo compatible)
    "Food and Drink": "#F59E0B",   # Amber 500 (Warm)
    "Shopping": "#6366F1",         # Indigo 500 (Brand Accent)
    "Transportation": "#0EA5E9",   # Sky 500
    "Entertainment": "#8B5CF6",    # Violet 500
    "Groceries": "#10B981",        # Emerald 500
    "Recreation": "#EC4899",       # Pink 500
    "Income": "#22C55E",           # Green 500
    "Travel": "#F43F5E",           # Rose 500
    "Utilities": "#64748B",        # Slate 500
    "Uncategorized": "#94A3B8",    # Slate 400
    "Personal Care": "#EC4899",    # Pink 500
    "Health": "#EC4899",           # Pink 500
    "General Services": "#64748B", # Slate 500
    "Misc": "#94A3B8"              # Slate 400
}

def compute_category_breakdown(transactions: List[Transaction]) -> List[Dict[str, Any]]:
    """
    Groups current month spending by category with colors.
    """
    now = datetime.now()
    current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    current_txns = [t for t in transactions if t.date >= current_month_start and t.amount > 0]
    
    total_spent = sum(t.amount for t in current_txns)
    if total_spent == 0: return []
    
    cat_counts = defaultdict(float)
    for t in current_txns:
        cat_counts[t.category_primary or "Uncategorized"] += t.amount
        
    breakdown = []
    for cat, amount in cat_counts.items():
        # Try exact match first
        color = CATEGORY_COLORS.get(cat)
        
        # If no exact match, try fuzzy match
        if not color:
            for key, val in CATEGORY_COLORS.items():
                if key in cat:
                    color = val
                    break
        
        # Fallback
        if not color:
            color = "#94A3B8"
            
        breakdown.append({
            "category": cat,
            "amount": round(amount, 2),
            "percentage": round((amount / total_spent) * 100, 1),
            "color": color
        })
        
    return sorted(breakdown, key=lambda x: x["amount"], reverse=True)

def compute_daily_trend(transactions: List[Transaction], days: int = 30) -> Dict[str, Any]:
    """
    Returns daily spending for the last N days for charting.
    """
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days-1)
    
    # Initialize all days with 0
    daily_totals = {}
    for i in range(days):
        d = start_date + timedelta(days=i)
        daily_totals[d.isoformat()] = 0.0
        
    for t in transactions:
        t_date_str = t.date.date().isoformat()
        if t.amount > 0 and start_date <= t.date.date() <= end_date:
            daily_totals[t_date_str] = daily_totals.get(t_date_str, 0) + t.amount
            
    data = [{"date": d, "amount": round(amt, 2)} for d, amt in daily_totals.items()]
    data.sort(key=lambda x: x["date"])
    
    total_period_spend = sum(d["amount"] for d in data)
    average_line = total_period_spend / days if days > 0 else 0
    
    return {
        "period": f"{days}d",
        "data": data,
        "average_line": round(average_line, 2)
    }
