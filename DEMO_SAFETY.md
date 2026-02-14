# 🚨 DEMO DAY SAFETY GUIDE

## ⚠️ CRITICAL: What Happens If You Reconnect Plaid During Demo?

### Current Data Status
- **222 synthetic transactions** (safe, won't be touched)
- **68 Plaid transactions** (from your first connection)
- **Total: 290 transactions**

### What Happens on Reconnect?

**GOOD NEWS**: Your synthetic data is **SAFE** ✅
- The code has deduplication logic
- Synthetic transactions have IDs like `synthetic_20260213_0`
- Plaid transactions have different IDs like `18BD17BD4yFPmNBd5WMpfp3wy8J6nqFZ9Ejdb`
- They won't conflict!

**POTENTIAL ISSUE**: You'll ADD more transactions ⚠️
- Reconnecting Plaid will fetch 18-50 NEW transactions
- These will be ADDED to your existing 290
- You'll end up with 308-340 transactions (not a problem, but unexpected)

## Recommended Demo Strategy

### Option 1: DON'T Reconnect Plaid (Safest)
Just show the existing data:
```bash
# Start backend
./start_demo.sh

# Show transactions in mobile app
# All 290 transactions are already there!
```

**Demo talking points**:
- "We already connected to Plaid Sandbox"
- "Here are 290 transactions across 90 days"
- "The AI has analyzed all this data"

### Option 2: Demo Plaid Connection in Separate Database
If you MUST show live Plaid connection:

```bash
# 1. Backup current database
cp finance.db finance_demo_backup.db

# 2. Create fresh database for Plaid demo
rm finance.db

# 3. Start backend (creates new DB)
./start_demo.sh

# 4. Connect through Plaid (gets 18-50 transactions)

# 5. Seed synthetic data
curl -X POST http://localhost:8001/seed_transactions

# 6. After demo, restore original
cp finance_demo_backup.db finance.db
```

### Option 3: Show Plaid Connection WITHOUT Token Exchange
Just show the Plaid Link UI opening, then cancel:
- Tap "Connect Bank Account"
- Show the Plaid interface
- Select a bank
- **CANCEL before entering credentials**
- Say: "We've already connected this earlier, here's the data"

## Emergency Recovery

If you accidentally reconnect and get unwanted data:

```bash
# Restore from backup
cp finance.db.backup finance.db

# Restart backend
# Your original 290 transactions are back!
```

## Pre-Demo Checklist

- [ ] Verify backup exists: `ls -lh finance.db.backup`
- [ ] Verify transaction count: `sqlite3 finance.db 'SELECT COUNT(*) FROM "transaction";'` (should be 290)
- [ ] Test backend: `curl http://localhost:8001/transactions | jq 'length'`
- [ ] **DON'T** tap "Connect Bank Account" during demo (unless using Option 2)

## Safe Demo Flow

1. **Start**: `./start_demo.sh`
2. **Show**: Navigate to Transactions/Insights tab
3. **Explain**: "We've connected to Plaid and have 90 days of data"
4. **Highlight**: Point out subscriptions, categories, patterns
5. **Show AI**: Display generated insights

**No need to reconnect Plaid - your data is already perfect for the demo!**
