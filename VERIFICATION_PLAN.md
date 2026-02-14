# Verification Plan - SOTA Data Integration

## Objective
Verify that the new `transactions.csv` can be loaded into the backend, correctly processed by the insights engine, and displayed in the frontend, while maintaining the ability to reset and use alternative data sources.

## Manual Verification Steps

### 1. Data Loading & Reset
- [ ] **Reset Database**: `curl -X DELETE http://localhost:8001/reset` -> Confirm 200 OK and DB is empty.
- [ ] **Load Sparkov Data**: `curl -X POST http://localhost:8001/seed_sparkov` -> Confirm 200 OK and ~13,800 transactions returned.
- [ ] **Check Backend Logs**: Ensure no errors during CSV parsing or insertion.

### 2. Insight Generation
- [ ] **Trigger Insights**: `curl -X POST http://localhost:8001/insights/generate` -> Confirm 200 OK.
- [ ] **Check Insight Cards**: `curl http://localhost:8001/insights` -> Confirm JSON response contains valid cards (e.g., "High Travel Spending").
- [ ] **Check Dashboard Data**: `curl http://localhost:8001/insights/v2` -> Confirm health score, spending velocity, and category breakdown are populated.

### 3. Frontend Experience
- [ ] **Launch App**: `npx expo start` -> Scan QR code.
- [ ] **View Transactions**: Navigate to "Transactions" tab -> Verify realistic merchant names (e.g., "Kessler Group") and categories.
- [ ] **View Dashboard**: Navigate to "Insights"/Home tab -> Verify graphs and metrics reflect the new data.
- [ ] **Chat with Agent**: Ask "How much did I spend on Travel?" -> Verify agent can query the new data and give a correct answer.

### 4. Data Swapping (Optional)
- [ ] **Switch to Random**:
    - `curl -X DELETE http://localhost:8000/reset`
    - `curl -X POST http://localhost:8000/seed_transactions`
    - Verify app shows "Netflix", "Uber", etc. created today.
