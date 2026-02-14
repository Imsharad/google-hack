# 🚀 Hackathon Demo Setup Guide

## Current Status ✅

Your fintech app is **ready for demo** with:
- ✅ **290 transactions** persisted in `finance.db`
- ✅ **Plaid integration** working (token exchange fixed)
- ✅ **Backend API** running on port 8001
- ✅ **Synthetic data** seeded for 90 days

## Quick Start Tomorrow

### 1. Start the Backend
```bash
cd /Users/sharad/Projects/labs/google-hack
./venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
```

### 2. Start the Mobile App
```bash
cd my-fintech-app
npx expo start
```

### 3. Verify Data is Persisted
```bash
# Check transaction count
sqlite3 finance.db 'SELECT COUNT(*) FROM "transaction";'
# Should show: 290

# View recent transactions
sqlite3 finance.db 'SELECT date, name, amount FROM "transaction" ORDER BY date DESC LIMIT 10;'
```

## Demo Flow

### Option A: Show Existing Data (Recommended)
The 290 transactions are **already in the database** and will persist across restarts. Just:
1. Start backend
2. Start mobile app
3. Navigate to insights/transactions tab
4. Data will load automatically

### Option B: Fresh Demo with Live Plaid Connection
If you want to show the live Plaid integration:
1. Delete database: `rm finance.db`
2. Start backend (auto-creates new DB)
3. Connect bank account through Plaid
4. Seed more data: `curl -X POST http://localhost:8001/seed_transactions`

## Key Endpoints

```bash
# Health check
curl http://localhost:8001/

# Get all transactions
curl http://localhost:8001/transactions

# Get insights
curl http://localhost:8001/insights

# Generate new insights
curl -X POST http://localhost:8001/insights/generate

# Seed more transactions (if needed)
curl -X POST http://localhost:8001/seed_transactions
```

## Database Backup (Safety First!)

```bash
# Backup your data before the hackathon
cp finance.db finance.db.backup

# Restore if needed
cp finance.db.backup finance.db
```

## Troubleshooting

### Backend won't start?
```bash
# Check if port is in use
lsof -ti:8001 | xargs kill -9

# Restart
./venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
```

### No transactions showing?
```bash
# Verify database exists
ls -lh finance.db

# Check transaction count
sqlite3 finance.db 'SELECT COUNT(*) FROM "transaction";'

# Re-seed if needed
curl -X POST http://localhost:8001/seed_transactions
```

### Mobile app can't connect?
- iOS Simulator: Use `http://localhost:8001`
- Android Emulator: Use `http://10.0.2.2:8001`
- Physical device: Use your computer's IP address

## What's Persisted

✅ **Database (`finance.db`)**:
- 290 transactions across 8 categories
- Account information
- Generated insights

✅ **Code Changes**:
- Fixed Plaid token exchange bug
- Added `/seed_transactions` endpoint
- All changes committed to files

## Demo Talking Points

1. **"We fixed the Plaid integration"** - Show the token exchange working
2. **"We have 90 days of realistic data"** - Show transaction variety
3. **"AI insights are auto-generated"** - Show the insights endpoint
4. **"Subscription detection works"** - Point out recurring Netflix, Spotify
5. **"Cashflow forecasting is ready"** - Show income vs expenses

---

**Everything is ready! Your data is persisted and will be there tomorrow. Good luck with the hackathon! 🎯**
