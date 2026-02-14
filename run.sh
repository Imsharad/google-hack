#!/bin/bash

# 🚀 OpenClaw: Full Demo Launch Script

# Kill child processes (backend) when this script exits
trap 'pkill -P $$; exit' SIGINT SIGTERM EXIT

echo "=================================================="
echo "   🚀  OpenClaw Fintech Demo Launcher  🚀"
echo "=================================================="
echo ""

# 1. Environment Check
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment 'venv' not found."
    echo "   Please run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi
source venv/bin/activate

# 2. Cleanup Ports
echo "🧹 Cleaning up port 8001..."
lsof -ti:8001 | xargs kill -9 2>/dev/null

# 3. Start Backend
echo "🔥 Starting Backend (FastAPI on Port 8001)..."
nohup uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend..."
sleep 3
if ! ps -p $BACKEND_PID > /dev/null; then
    echo "❌ Backend failed to start. Check backend.log:"
    cat backend.log
    exit 1
fi
echo "✅ Backend is LIVE at http://localhost:8001"

# 4. Print Cheat Sheet
echo ""
echo "=================================================="
echo "         🎓  DEMO CHEAT SHEET  🎓"
echo "=================================================="
echo "👉 Mode 1: SOTA Synthetic (Recommended)"
echo "   Reset: curl -X DELETE http://localhost:8001/reset"
echo "   Load:  curl -X POST http://localhost:8001/seed/sparkov"
echo ""
echo "👉 Mode 2: Plaid Sandbox (Real Flow)"
echo "   Reset: curl -X DELETE http://localhost:8001/reset"
echo "   App:   Connect Bank -> user_good / pass_good"
echo ""
echo "👉 Mode 3: Random Backup"
echo "   Reset: curl -X DELETE http://localhost:8001/reset"
echo "   Load:  curl -X POST http://localhost:8001/seed_transactions"
echo "=================================================="
echo ""

# 5. Start Frontend
echo "📱 Starting Mobile App (Expo)..."
echo "   Scan the QR code below with your phone!"
echo ""
cd my-fintech-app || exit
npx expo start

# The script stops here and waits for Expo to close.
# When Expo closes, the 'trap' will kill the backend using $BACKEND_PID (via pkill -P $$)
