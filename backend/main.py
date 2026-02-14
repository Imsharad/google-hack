from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from contextlib import asynccontextmanager
from dotenv import load_dotenv
import json
from datetime import datetime
from .database import create_db_and_tables

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

# Crucial for hackathons: Bypass CORS restrictions so Expo can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PlaidPayload(BaseModel):
    user_id: str
    status: str

@app.get("/")
def read_root():
    return {"message": "OpenClaw Backend is Live!"}

@app.post("/ingest")
def ingest_data(payload: PlaidPayload):
    # This is where your Plaid data will hit the OpenClaw lanes tomorrow
    return {"status": "success", "agent_message": f"Ingested data for {payload.user_id}"}


# --- Plaid Integration ---
import os
import plaid
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.products import Products
from plaid.model.country_code import CountryCode

PLAID_CLIENT_ID = os.getenv("PLAID_CLIENT_ID")
PLAID_SECRET = os.getenv("PLAID_SECRET")
PLAID_ENV = os.getenv("PLAID_ENV", "sandbox")

# Configure Plaid client
configuration = plaid.Configuration(
    host=plaid.Environment.Sandbox,
    api_key={
        'clientId': PLAID_CLIENT_ID,
        'secret': PLAID_SECRET,
    }
)
api_client = plaid.ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)

@app.post("/create_link_token")
def create_link_token():
    try:
        request = LinkTokenCreateRequest(
            products=[Products('transactions')],
            client_name="Google Hack Fintech",
            country_codes=[CountryCode('US')],
            language='en',
            user=LinkTokenCreateRequestUser(
                client_user_id='unique-user-id'
            )
        )
        response = client.link_token_create(request)
        return response.to_dict()
    except plaid.ApiException as e:
        return {"error": str(e)}

from fastapi import Depends
from sqlmodel import Session, select
from .database import engine
from .models import Account, Transaction

def get_session():
    with Session(engine) as session:
        yield session

class PublicTokenExchangeRequest(BaseModel):
    public_token: str

@app.post("/exchange_public_token")
def exchange_public_token(payload: PublicTokenExchangeRequest, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    try:
        print(f"DEBUG: Exchanging public token: {payload.public_token[:10]}...")
        # 1. Exchange public token for access token
        request = ItemPublicTokenExchangeRequest(
            public_token=payload.public_token
        )
        response = client.item_public_token_exchange(request)
        response_dict = response.to_dict()
        access_token = response_dict['access_token']
        item_id = response_dict['item_id']
        
        print(f"DEBUG: Got access token, starting sync...")

        # 2. Fetch ALL Transactions immediately (Sandbox usually has data ready)
        from plaid.model.transactions_sync_request import TransactionsSyncRequest
        
        cursor = None
        has_more = True
        added_transactions = []
        plaid_accounts = []

        while has_more:
            print(f"DEBUG: Syncing with cursor: {cursor}")
            
            # Only include cursor if it's not None
            sync_kwargs = {
                "access_token": access_token,
                "count": 500
            }
            if cursor:
                sync_kwargs["cursor"] = cursor
                
            sync_request = TransactionsSyncRequest(**sync_kwargs)
            sync_response = client.transactions_sync(sync_request)
            res_dict = sync_response.to_dict()
            
            added_transactions.extend(res_dict['added'])
            # Grab accounts from the first page
            if not plaid_accounts:
                plaid_accounts = res_dict['accounts']
            
            cursor = res_dict['next_cursor']
            has_more = res_dict['has_more']
            print(f"DEBUG: Fetched {len(res_dict['added'])} transactions. Total: {len(added_transactions)}, Has more: {has_more}")
        
        print(f"DEBUG: Starting database save for {len(added_transactions)} transactions...")
        # 3. Save to Database
        for pa in plaid_accounts:
            # Check if account exists
            existing_account = session.exec(select(Account).where(Account.provider_account_id == pa['account_id'])).first()
            if not existing_account:
                new_account = Account(
                    provider_account_id=pa['account_id'],
                    name=pa['name'],
                    official_name=pa['official_name'],
                    type=str(pa['type']),
                    mask=pa['mask'],
                    subtype=str(pa['subtype']),
                    data_provider="plaid"
                )
                session.add(new_account)
                session.commit()
                session.refresh(new_account)
        
        # Now save transactions
        saved_count = 0
        for t in added_transactions:
            # Find the account for this transaction
            db_account = session.exec(select(Account).where(Account.provider_account_id == t['account_id'])).first()
            if db_account:
                # Check for duplicate
                existing_tx = session.exec(select(Transaction).where(Transaction.provider_transaction_id == t['transaction_id'])).first()
                if not existing_tx:
                    # Convert string date 'YYYY-MM-DD' to datetime object
                    tx_date = t['date']
                    if isinstance(tx_date, str):
                        tx_date = datetime.strptime(tx_date, "%Y-%m-%d")

                    new_tx = Transaction(
                        account_id=db_account.id,
                        provider_transaction_id=t['transaction_id'],
                        amount=t['amount'],
                        date=tx_date,
                        name=t['name'],
                        merchant_name=t['merchant_name'],
                        category_primary=t['category'][0] if t['category'] else "Uncategorized",
                        payment_channel=str(t['payment_channel']),
                        pending=t['pending']
                    )
                    session.add(new_tx)
                    saved_count += 1
        
        session.commit()
        
        # 4. Auto-Trigger Insight Generation (T7) - ASYNC
        print("DEBUG: Queueing background insight generation...")
        background_tasks.add_task(generate_insights, session)
        
        return {
            "status": "success", 
            "access_token_preview": access_token[:10] + "...",
            "transactions_synced": saved_count,
            "total_fetched": len(added_transactions)
        }

    except plaid.ApiException as e:
        print(f"Plaid API Error: {e}")
        return {"error": str(e)}
    except Exception as e:
        print(f"General Error during exchange: {e}")
        import traceback
        traceback.print_exc()
        return {"error": f"Internal Server Error: {str(e)}"}

@app.get("/transactions")
def get_transactions(
    merchant: str | None = None,
    category: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    min_amount: float | None = None,
    max_amount: float | None = None,
    limit: int = 100,
    session: Session = Depends(get_session)
):
    query = select(Transaction).order_by(Transaction.date.desc())
    if merchant:
        # Use simple contains for SQLite compatibility, or ilike if supported
        query = query.where(Transaction.merchant_name.contains(merchant))
    if category:
        query = query.where(Transaction.category_primary == category)
    if start_date:
        query = query.where(Transaction.date >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.where(Transaction.date <= datetime.fromisoformat(end_date))
    if min_amount is not None:
        query = query.where(Transaction.amount >= min_amount)
    if max_amount is not None:
        query = query.where(Transaction.amount <= max_amount)
    return session.exec(query.limit(limit)).all()

@app.get("/subscriptions")
def get_subscriptions_endpoint(session: Session = Depends(get_session)):
    transactions = session.exec(select(Transaction)).all()
    return detect_subscriptions(transactions)

@app.get("/anomalies")
def get_anomalies_endpoint(session: Session = Depends(get_session)):
    transactions = session.exec(select(Transaction)).all()
    return detect_anomalies(transactions)

@app.get("/forecast")
def get_forecast_endpoint(days: int = 30, session: Session = Depends(get_session)):
    transactions = session.exec(select(Transaction)).all()
    return forecast_cashflow(transactions, days)

@app.post("/sync")
def sync_bank_data():
    return {"status": "success", "message": "Bank data synced", "transactions_synced": 42}

# --- Insights Engine Endpoints ---
from .insights_engine import (
    compute_financial_dna, 
    detect_anomalies, 
    detect_subscriptions, 
    forecast_cashflow, 
    compute_spending_velocity,
    compute_health_score,
    compute_month_summary,
    compute_category_breakdown,
    compute_daily_trend
)

from .llm_narrator import (
    narrate_insights, 
    InsightCard, 
    ActionButton, 
    NarratedInsights,
    narrate_insights_v2,
    NarratedInsightsV2
)
from .models import AgentInsight

from fastapi import Depends, BackgroundTasks
from sqlmodel import Session, select, delete
from .database import engine
from .models import Account, Transaction, AgentInsight

# ... existing code ...

@app.post("/insights/generate")
def generate_insights_endpoint(session: Session = Depends(get_session)):
    """
    Trigger the insights engine synchronously.
    """
    try:
        generate_insights(session)
        return {"status": "Analysis complete."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def generate_insights(session: Session):
    """
    Runs the full insights engine.
    """
    print("DEBUG: Starting background insight generation...")
    
    raw_analysis = {
        "financial_dna": dna,
        "anomalies": anomalies,
        "subscriptions": subs,
        "forecast": forecast,
        "spending_velocity": velocity
    }

    # 2. Run Narrator Brain (T2)
    try:
        narrated = narrate_insights(raw_analysis)
        
        # 3. Store in Database
        # Purge old insights ONLY after we successfully generated new ones
        session.exec(delete(AgentInsight))
        
        seen_insights = set()
        for card in narrated.cards:
            # Simple dedup based on title + body
            dedup_key = (card.title.strip().lower(), card.body.strip().lower())
            if dedup_key in seen_insights:
                continue
            seen_insights.add(dedup_key)
            
            insight = AgentInsight(
                insight_type=card.card_type,
                severity=card.severity,
                content=card.body,
                card_schema=card.model_dump_json() if hasattr(card, "model_dump_json") else json.dumps(card.dict())
            )
            session.add(insight)
        
        session.commit()
        print(f"DEBUG: Successfully saved {len(narrated.cards)} new AI cards.")
    except Exception as e:
        print(f"DEBUG: Background narration failed: {e}")


@app.get("/insights")
def get_insights(session: Session = Depends(get_session)):
    """
    Retrieves the latest insights from the database and formats them for the UI.
    """
    insights = session.exec(select(AgentInsight).order_by(AgentInsight.timestamp.desc())).all()
    
    formatted_cards = []
    for insight in insights:
        try:
            card_data = json.loads(insight.card_schema)
            formatted_cards.append(card_data)
        except Exception as e:
            print(f"Error parsing insight {insight.id}: {e}")

    # Also include spending velocity for the gauge
    transactions = session.exec(select(Transaction)).all()
    velocity = compute_spending_velocity(transactions)
            
    return {
        "summary": formatted_cards[0]["body"] if formatted_cards else "No insights found.",
        "cards": formatted_cards,
        "spending_velocity": velocity
    }

@app.get("/insights/v2")
def get_insights_v2(session: Session = Depends(get_session)):
    """
    Returns the 7-section financial dashboard data.
    """
    transactions = session.exec(select(Transaction)).all()
    
    # 1. Compute Components
    velocity = compute_spending_velocity(transactions)
    anomalies = detect_anomalies(transactions)
    subscriptions = detect_subscriptions(transactions)
    dna = compute_financial_dna(transactions)
    
    # 2. Compute Health Score
    health_score = compute_health_score(velocity, anomalies, subscriptions, dna)
    
    # 3. Compute Other Sections
    month_summary = compute_month_summary(transactions)
    category_breakdown = compute_category_breakdown(transactions)
    daily_trend = compute_daily_trend(transactions, days=30)
    
    # 4. Narrate
    # We pass a summary of the data to the LLM to avoid context window explosion with raw txns
    raw_analysis = {
         "health_score": health_score,
         "month_summary": month_summary,
         "top_categories": category_breakdown[:3],
         "subscriptions_count": len(subscriptions["subscriptions"]),
         "anomalies_count": len(anomalies["spikes"])
    }
    
    narrated = narrate_insights_v2(raw_analysis)
    
    return {
        "health_score": health_score,
        "month_summary": month_summary,
        "category_breakdown": category_breakdown,
        "alerts": narrated.alerts,
        "subscriptions": subscriptions,
        "daily_trend": daily_trend,
        "narrative": {
            "headline": narrated.headline,
            "text": narrated.narrative,
            "generated_at": datetime.now().isoformat()
        },
        "spending_velocity": velocity
    }

@app.get("/spending-velocity")
def get_spending_velocity(session: Session = Depends(get_session)):
    transactions = session.exec(select(Transaction)).all()
    return compute_spending_velocity(transactions)



@app.post("/seed_transactions")
def seed_transactions_endpoint(session: Session = Depends(get_session)):
    """Generate synthetic transactions for demo purposes"""
    from datetime import timedelta
    import random
    
    account = session.exec(select(Account)).first()
    if not account:
        return {"error": "No account found. Connect a bank first."}
    
    merchants = [
        ("Netflix", 15.99, "Entertainment"),
        ("Spotify", 9.99, "Entertainment"),
        ("Amazon", 45.67, "Shopping"),
        ("Starbucks", 5.50, "Food and Drink"),
        ("Uber", 12.30, "Transportation"),
        ("Whole Foods", 87.23, "Groceries"),
        ("Gym Membership", 50.00, "Recreation"),
    ]
    
    base_date = datetime.now()
    created = 0
    
    for days_ago in range(90):
        tx_date = base_date - timedelta(days=days_ago)
        
        if days_ago % 15 == 0:
            salary_tx = Transaction(
                account_id=account.id,
                provider_transaction_id=f"synthetic_salary_{tx_date.strftime('%Y%m%d')}",
                amount=-3500.00,
                date=tx_date,
                name="Payroll Deposit",
                merchant_name="Employer Inc",
                category_primary="Income",
                payment_channel="ach",
                pending=False
            )
            session.add(salary_tx)
            created += 1
        
        for _ in range(random.randint(1, 4)):
            merchant, base_amount, category = random.choice(merchants)
            amount = base_amount + random.uniform(-base_amount * 0.2, base_amount * 0.2)
            
            new_tx = Transaction(
                account_id=account.id,
                provider_transaction_id=f"synthetic_{tx_date.strftime('%Y%m%d')}_{created}",
                amount=round(amount, 2),
                date=tx_date,
                name=merchant,
                merchant_name=merchant,
                category_primary=category,
                payment_channel="online",
                pending=False
            )
            session.add(new_tx)
            created += 1
    
    session.commit()
    
    try:
        generate_insights(session)
    except Exception as e:
        print(f"Insight generation failed: {e}")
    
    return {"status": "success", "transactions_created": created}

@app.post("/seed/sparkov")
def seed_sparkov_endpoint(session: Session = Depends(get_session)):
    """Load SOTA Sparkov data from CSV"""
    from .seed_transactions import seed_from_csv
    
    # Path is relative to the backend execution context. 
    # Provided we run from root or backend, we need to find data/transactions.csv
    # Assuming running from root:
    csv_path = "data/transactions.csv" 
    
    if not os.path.exists(csv_path):
        # Fallback for Docker/other paths
        csv_path = "../data/transactions.csv"
        
    result = seed_from_csv(session, csv_path)
    
    # Trigger AI
    try:
        generate_insights(session)
    except Exception as e:
        print(f"Insight generation failed: {e}")
        
    return result

@app.delete("/reset")
def reset_database(session: Session = Depends(get_session)):
    """Wipe all transactions and accounts for a fresh start"""
    session.exec(delete(Transaction))
    session.exec(delete(Account))
    session.exec(delete(AgentInsight))
    session.commit()
    return {"status": "success", "message": "Database wiped clean."}
