---
name: analyze-spending
description: Analyzes transaction history to identify spending categories, recurring subscriptions, and anomalies over a specific date range.
---

# Analyze Spending Skill

## Context
The user needs to understand their cash flow. They may ask broad questions like "Where did my money go?" or specific ones like "How much did I spend on Uber?".

## procedure
1.  **Data Retrieval:** 
    *   For broad questions ("Where did my money go?"), use `get_insights` (fallback) or `query_transactions` with `limit`.
    *   For specific analysis, use specialized tools: `get_subscriptions`, `get_anomalies`, `check_velocity`.
2.  **Filtering:** Use `query_transactions` with filters (`merchant`, `category`, `date`) to drill down.
3.  **Normalization:** Backend handles categorization. Trust the tool output unless clearly wrong.
4.  **Reporting:** Output a summary table. Highlight anomalies with 🚨.

## Guardrails
*   If no transactions are found, suggest running the `sync_bank_data` tool.
*   Do not hallucinate merchant names. If unknown, list as "Uncategorized".

## Example Usage
**User:** "Analyze my food spending."
**Action:** `query_transactions(category='Food and Drink', start_date='2023-10-01')`
**Output:** "You spent $450 on dining. Major outlier: $120 at 'Le Bernardin' on Oct 12."

**User:** "Any weird charges?"
**Action:** `get_anomalies()`
**Output:** "Yes, a $500 charge to 'United Airlines' is usually high for you."
