# 🦈 OpenShark: AI-Powered Fintech Intelligence

OpenShark is a next-generation fintech platform built for the Google Hackathon. It combines real-time banking data (via Plaid) with an advanced AI insights engine to provide users with a "Financial DNA" analysis, anomaly detection, subscription tracking, and cashflow forecasting.

![OpenShark Chat Demo](docs/chat_demo.png)

## 🏗 Project Architecture

The project is divided into three main components:

- **Backend (`/backend`)**: A FastAPI (Python) server that manages the SQLite database, handles Plaid integrations, and runs the analytical insights engine.
- **Mobile App (`/my-fintech-app`)**: A cross-platform React Native (Expo) application providing a sleek, Material Design-inspired dashboard for transactions and AI insights.
- **AI Agent (`/agent-node`)**: Powered by **Ledger**, an autonomous financial forensic analyst. Ledger uses `pi-agent-core` to analyze raw data, detect "leaks" in cash flow, and provide dry, professional, and action-oriented financial advice directly from the database.

## ✨ Key Features

- **🏦 Plaid Integration**: Seamlessly connect bank accounts to sync real-time transaction data.
- **🧠 AI Insights Engine**: 
  - **Financial DNA**: Categorizes spending patterns.
  - **Anomaly Detection**: Flags unusual transactions.
  - **Subscription Tracking**: Identifies recurring charges (Netflix, Spotify, etc.).
  - **Cashflow Forecasting**: Predicts future balances based on historical trends.
- **🎙 Narrated Insights**: LLM-generated summaries that explain financial data in plain English.
- **📊 Real-time Dashboard**: Visual representations of spending velocity and financial health.
- **🧪 Synthetic Data Seeding**: A built-in tool to generate realistic 90-day transaction history for testing and demos.

## 🚀 Quick Start

### Prerequisites
- Python 3.14+
- Node.js & npm
- [Expo Go](https://expo.dev/go) app (for mobile testing)

### 1. Backend Setup
```bash
# Setup virtual environment
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start the server
./venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
```

### 2. Mobile App Setup
```bash
cd my-fintech-app
npm install
npx expo start
```

### 3. AI Agent (Optional)
```bash
cd agent-node
npm install
npm run dev
```

## 🛠 Useful Commands

- **Seed Demo Data**: `curl -X POST http://localhost:8001/seed_transactions`
- **Force Generate Insights**: `curl -X POST http://localhost:8001/insights/generate`
- **Check DB Status**: `sqlite3 finance.db 'SELECT COUNT(*) FROM "transaction";'`

## 📝 Configuration

Ensure you have a `.env` file in the root and/or `backend/` directory with:
- `PLAID_CLIENT_ID`
- `PLAID_SECRET`
- `PLAID_ENV` (sandbox/development/production)
- `OPENAI_API_KEY` (for narrated insights)

## 🛡 Safety & Data
- **Demo Mode**: The project includes `start_demo.sh` to quickly launch the environment with pre-seeded data.
- **Backups**: Use `cp finance.db finance.db.backup` to save your current state.

---
Built with ❤️ for the Google Hackathon.
