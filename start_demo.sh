#!/bin/bash

# 🚀 Quick Start Script for Hackathon Demo
# Run this tomorrow to start everything

echo "🎯 Starting Fintech App for Hackathon Demo..."
echo ""

# Check if database exists
if [ -f "finance.db" ]; then
    TRANSACTION_COUNT=$(sqlite3 finance.db 'SELECT COUNT(*) FROM "transaction";' 2>/dev/null || echo "0")
    echo "✅ Database found with $TRANSACTION_COUNT transactions"
else
    echo "⚠️  No database found. Will create on first run."
fi

echo ""
echo "📊 Starting Backend on port 8001..."
echo "   Access at: http://localhost:8001"
echo ""

# Kill any existing process on port 8001
lsof -ti:8001 | xargs kill -9 2>/dev/null

# Start backend in background
./venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Test backend
if curl -s http://localhost:8001/ > /dev/null; then
    echo "✅ Backend is running!"
    echo ""
    echo "📱 Next steps:"
    echo "   1. Open another terminal"
    echo "   2. cd my-fintech-app"
    echo "   3. npx expo start"
    echo ""
    echo "🔧 Useful commands:"
    echo "   - View transactions: curl http://localhost:8001/transactions | jq ."
    echo "   - View insights: curl http://localhost:8001/insights | jq ."
    echo "   - Seed more data: curl -X POST http://localhost:8001/seed_transactions"
    echo ""
    echo "Press Ctrl+C to stop the backend"
    
    # Keep script running
    wait $BACKEND_PID
else
    echo "❌ Backend failed to start. Check the logs above."
    exit 1
fi
