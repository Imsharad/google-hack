# Quick Reference: Demo Day

## 🚀 Data Strategy: "3-Mode Demo"

You have **3 robust ways** to power your demo. Choose the one that fits your narrative:

### 🌟 Mode 1: "SOTA Synthetic" (Recommended)
**Story:** "We use advanced synthetic data to simulate a real user with 3 months of history."
- **Pros:** 13k+ transactions, realistic merchant names, perfect graphs.
- **Cons:** Not "live" from Plaid.

**Commands:**
```bash
# 1. Reset DB (Clear everything)
curl -X DELETE http://localhost:8001/reset

# 2. Load Sparkov Data
curl -X POST http://localhost:8001/seed/sparkov
```

---

### 🏦 Mode 2: "Plaid Sandbox"
**Story:** "Let's connect a live bank account right now."
- **Pros:** Shows the real integration flow.
- **Cons:** Data volume is small (50-100 txns), graphs might look sparse.

**Commands:**
```bash
# 1. Reset DB
curl -X DELETE http://localhost:8001/reset

# 2. In App: Click "Connect Bank" -> Use credentials:
#    User: user_good
#    Pass: pass_good
```

---

### 🎲 Mode 3: "Random Generator" (Fail-safe)
**Story:** "Generating some sample data to show the UI."
- **Pros:** Instant, no external dependencies.
- **Cons:** Generic names ("Netflix", "Uber"), less realistic patterns.

**Commands:**
```bash
# 1. Reset DB
curl -X DELETE http://localhost:8001/reset

# 2. Seed Data
curl -X POST http://localhost:8001/seed_transactions
```

## 🚨 Emergency: Restore Demo State
If everything breaks, restore the golden backup:

```bash
cp finance.db.backup finance.db
# Restart backend
```

## 📊 Verify Data Count
```bash
sqlite3 finance.db 'SELECT COUNT(*) FROM "transaction";'
# Sparkov: ~13,800
# Plaid: ~100
# Random: ~200
```
