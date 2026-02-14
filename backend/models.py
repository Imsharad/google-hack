from typing import Optional, List
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship

class AccountBase(SQLModel):
    """
    Represents a financial container (Bank Account, Wallet, etc.)
    Designed to be provider-agnostic.
    """
    name: str
    official_name: Optional[str] = None
    type: str  # e.g., 'depository', 'credit', 'investment'
    mask: Optional[str] = None
    subtype: Optional[str] = None
    currency_code: Optional[str] = Field(default="USD")
    
    # Abstraction Fields: Critical for the Indian Market Pitch
    data_provider: str = Field(index=True) # Values: "plaid" or "setu_aa"
    provider_account_id: str = Field(index=True, unique=True)
    
    # Metadata for AA consent handles (India specific)
    consent_handle_id: Optional[str] = None

class Account(AccountBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    transactions: List["Transaction"] = Relationship(back_populates="account")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TransactionBase(SQLModel):
    """
    Normalized transaction record.
    Plaid data is mapped here directly.
    AA data is parsed and mapped here after decryption.
    """
    amount: float
    date: datetime
    name: str # Merchant name or narration
    merchant_name: Optional[str] = None
    
    # Categorization: Plaid provides this; for AA, the Agent computes it.
    category_primary: Optional[str] = None 
    category_detailed: Optional[str] = None
    
    pending: bool = False
    payment_channel: str # "online", "in_store", "upi", "ach"
    
    # Audit trail: Store the raw JSON/XML from the provider
    raw_payload: Optional[str] = None

class Transaction(TransactionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    account_id: int = Field(foreign_key="account.id")
    account: Account = Relationship(back_populates="transactions")
    # Provider-specific ID to prevent duplicates
    provider_transaction_id: str = Field(unique=True, index=True)

class AgentInsight(SQLModel, table=True):
    """
    Stores the output of the Agent's reasoning.
    The frontend polls this table to show 'AI Insight Alerts'.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    insight_type: str # "spending_spike", "subscription_risk", "liquidity_warning"
    severity: str # "low", "medium", "high"
    content: str
    card_schema: Optional[str] = None # JSON string for Generative UI
    related_transaction_id: Optional[str] = None

