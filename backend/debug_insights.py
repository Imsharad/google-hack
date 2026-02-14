import sys
import os
import json
from sqlmodel import Session, select
from backend.database import engine
from backend.models import Transaction, Account, AgentInsight

# Import the logic we want to debug
from backend.insights_engine import (
    compute_financial_dna,
    detect_anomalies,
    detect_subscriptions,
    forecast_cashflow,
    compute_spending_velocity
)
from backend.llm_narrator import narrate_insights

def debug_insights():
    print("🔍 --- DEBUGGING INSIGHTS ENGINE ---")
    
    with Session(engine) as session:
        # 1. Check Data source
        transactions = session.exec(select(Transaction)).all()
        print(f"📊 Loaded {len(transactions)} transactions from Database.")
        
        if not transactions:
            print("❌ No transactions found! Run seeding first.")
            return

        # 2. Run Deterministic Math (The "Under the hood" Analysis)
        print("\n🧮 --- STEP 1: MATH & STATS (Deterministic) ---")
        
        print("  > Computing Financial DNA...")
        dna = compute_financial_dna(transactions)
        print(f"    Entropy: {dna['entropy']}, Velocity: ${dna['velocity']}/day")
        
        print("  > Detecting Anomalies...")
        anomalies = detect_anomalies(transactions)
        print(f"    Found {len(anomalies['spikes'])} spikes.")
        if anomalies['spikes']:
            print(f"    Example: {anomalies['spikes'][0]['merchant']} (${anomalies['spikes'][0]['amount']})")
            
        print("  > Detecting Subscriptions...")
        subs = detect_subscriptions(transactions)
        print(f"    Found {len(subs['subscriptions'])} subscriptions.")
        for s in subs['subscriptions'][:2]:
            print(f"    - {s['merchant']}: ${s['amount']} / {s['interval_days']} days")

        print("  > Forecasting Cashflow...")
        forecast = forecast_cashflow(transactions, days=5)
        print(f"    Next 5 days projected spend: {[f['projected_spend'] for f in forecast['daily_forecast']]}")

        raw_analysis = {
            "financial_dna": dna,
            "anomalies": anomalies,
            "subscriptions": subs,
            "forecast": forecast,
            "spending_velocity": compute_spending_velocity(transactions)
        }

        # 3. Run LLM Narration (The "Agent" part)
        print("\n🤖 --- STEP 2: LLM NARRATION (Generative) ---")
        print("Sending raw analysis to Gemini (Vertex AI)...")
        
        try:
            narrated = narrate_insights(raw_analysis)
            print("\n📝 GENERAETD CARDS:")
            for i, card in enumerate(narrated.cards):
                print(f"  [{i+1}] {card.title} ({card.card_type})")
                print(f"      {card.body}")
                print(f"      Severity: {card.severity}")
                print("      ---")
                
            print(f"\nSummary Sentence: {narrated.summary_sentence}")
            
        except Exception as e:
            print(f"\n❌ LLM Error: {e}")
            
        print("\n✅ Debug Complete.")

if __name__ == "__main__":
    # Ensure we can import backend modules from root
    sys.path.append(os.getcwd())
    debug_insights()
