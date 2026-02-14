#!/bin/bash

# 🚀 OpenClaw: Full Web Stack Launcher
# Launches: Backend (8001), Agent (8002), Frontend (3030)

# Kill child processes when this script exits
trap 'pkill -P $$; exit' SIGINT SIGTERM EXIT

echo "=================================================="
echo "   🚀  OpenClaw Web Stack Launcher  🚀"
echo "=================================================="
echo ""

# 1. Environment Check
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment 'venv' not found."
    echo "   Creating and installing dependencies..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# 2. Cleanup Ports
echo "🧹 Cleaning up ports 8001, 8002, 3030..."
lsof -ti:8001 | xargs kill -9 2>/dev/null
lsof -ti:8002 | xargs kill -9 2>/dev/null
lsof -ti:3030 | xargs kill -9 2>/dev/null

# 3. Start Backend
echo "🔥 Starting Backend (FastAPI on Port 8001)..."
# Run from backend directory to ensure imports work
cd backend
nohup uvicorn main:app --host 0.0.0.0 --port 8001 --reload > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "⏳ Waiting for backend..."
sleep 3
if ! ps -p $BACKEND_PID > /dev/null; then
    echo "❌ Backend failed to start. Check backend.log:"
    tail -n 20 backend.log
    exit 1
fi
echo "✅ Backend is LIVE at http://localhost:8001"

# 4. Start Agent
echo "🤖 Starting Ledger Agent (Node on Port 8002)..."
cd agent-node
nohup npm run dev > ../agent.log 2>&1 &
AGENT_PID=$!
cd ..

echo "⏳ Waiting for agent..."
sleep 3
if ! ps -p $AGENT_PID > /dev/null; then
    echo "❌ Agent failed to start. Check agent.log:"
    tail -n 20 agent.log
    exit 1
fi
echo "✅ Agent is LIVE at http://localhost:8002"

# 5. Start Frontend
echo "💻 Starting Web Frontend (Vite on Port 3030)..."
echo "   Opening dashboard..."
echo ""

# 6. Print Cheat Sheet
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
echo "👉 Mode 3: Demo Data (Quick Start)"
echo "   Reset: curl -X DELETE http://localhost:8001/reset"
echo "   Load:  curl -X POST http://localhost:8001/seed/demo"
echo "=================================================="
echo ""

cd openshark-fintech
npm run dev

# The script stops here and waits for Vite to close.
# When Vite closes, the 'trap' will kill the backend and agent.
