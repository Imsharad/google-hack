#!/bin/bash

# Kill child processes when this script exits
trap 'kill $(jobs -p)' EXIT

echo "🚀 Starting Ledger Brain API Stack..."

# 1. Start Backend (8001)
echo "🔌 Starting FastAPI (Port 8001)..."
source venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload &
sleep 3

# 2. Start Agent Node (8002)
echo "🧠 Starting Pi Agent Node (Port 8002)..."
cd agent-node || exit
npm run dev &
cd ..
sleep 5

# Keep the script alive
echo "✅ APIs are running. Press Ctrl+C to stop."
wait
