# Tools Definition

> Agent tools designed per [Anthropic's best practices](https://www.anthropic.com/engineering/writing-tools-for-agents): namespaced, enriched descriptions, token-efficient responses, actionable errors.

## `ledger_transactions_search`
**Description:** Search the user's bank transaction history with filters. Returns date, merchant, amount, category per transaction.

**When to use:** Specific spending questions — "How much at Starbucks?", "food spending last week", "purchases over $50".

**Schema:**
```json
{
  "name": "ledger_transactions_search",
  "parameters": {
    "type": "object",
    "properties": {
      "merchant": { "type": "string", "description": "Fuzzy match merchant name" },
      "category": { "type": "string", "description": "Primary category (e.g. 'Food and Drink', 'Transportation')" },
      "start_date": { "type": "string", "description": "YYYY-MM-DD" },
      "end_date": { "type": "string", "description": "YYYY-MM-DD" },
      "min_amount": { "type": "number" },
      "max_amount": { "type": "number" },
      "limit": { "type": "integer", "default": 25 },
      "response_format": { "type": "string", "enum": ["concise", "detailed"], "default": "concise" }
    }
  }
}
```

---

## `ledger_subscriptions_detect`
**Description:** Identify recurring payments and subscriptions. Returns merchant, estimated monthly cost, frequency, confidence.

**When to use:** "subscriptions", "recurring charges", "monthly bills", "cancel suggestions".

**Schema:**
```json
{
  "name": "ledger_subscriptions_detect",
  "parameters": { "type": "object", "properties": {} }
}
```

---

## `ledger_anomalies_detect`
**Description:** Detect unusual spending patterns, outliers, and spikes. Returns flagged transactions with reason.

**When to use:** "unusual charges", "weird spending", "spikes", "fraud check".

**Schema:**
```json
{
  "name": "ledger_anomalies_detect",
  "parameters": { "type": "object", "properties": {} }
}
```

---

## `ledger_cashflow_forecast`
**Description:** Project cashflow (income minus spending) for the next N days. Returns daily projections and trend.

**When to use:** "forecast", "projection", "next month", "will I run out?", "budget outlook".

**Schema:**
```json
{
  "name": "ledger_cashflow_forecast",
  "parameters": {
    "type": "object",
    "properties": {
      "days": { "type": "integer", "default": 30, "description": "Forecast window (7–90 days)" }
    }
  }
}
```

---

## `ledger_spending_velocity`
**Description:** Check current burn rate vs historical average. Returns daily rate, comparison, and risk assessment.

**When to use:** "burn rate", "spending speed", "pacing", "am I spending too fast?".

**Schema:**
```json
{
  "name": "ledger_spending_velocity",
  "parameters": { "type": "object", "properties": {} }
}
```

---

## `ledger_bank_sync`
**Description:** Trigger manual bank re-sync. Sandbox mode only — returns placeholder.

**When to use:** ONLY when user explicitly asks to refresh/sync. Data is already synced on bank connection.

**Schema:**
```json
{
  "name": "ledger_bank_sync",
  "parameters": { "type": "object", "properties": {} }
}
```

---

## `ledger_financial_snapshot`
**Description:** Complete financial health check in one call. Combines velocity, subscriptions, anomalies, and 30-day forecast.

**When to use:** "how am I doing?", "financial health", "full picture", "summary of my finances".

**Schema:**
```json
{
  "name": "ledger_financial_snapshot",
  "parameters": { "type": "object", "properties": {} }
}
```
