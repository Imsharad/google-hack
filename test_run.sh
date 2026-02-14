#!/bin/bash

# Kill child processes when this script exits
trap 'kill $(jobs -p)' EXIT

echo "🚀 Starting Full Ledger Brain Stack..."

# 1. Start Backend (8001)
echo "🔌 Starting FastAPI (Port 8001)..."
source venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload &
sleep 3

# 2. Start Agent Node (8002)
echo "🧠 Starting Pi Agent Node (Port 8002)..."
cd agent-node || exit
npm run dev & # I need to add this script to package.json
cd ..
sleep 3

# 3. Start Frontend (8081)
echo "📱 Starting Expo (Port 8081)..."
cd my-fintech-app || exit
npx expo start --web
