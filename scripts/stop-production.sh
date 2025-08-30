#!/bin/bash

# ATP Production Stop Script
# Gracefully stops all ATP services

echo "🛑 Stopping Agent Trust Protocol™ Production Services"
echo "===================================================="

if [ -f .atp-pids ]; then
    PIDS=$(cat .atp-pids)
    echo "📋 Found running services, stopping..."
    
    for PID in $PIDS; do
        if kill -0 $PID 2>/dev/null; then
            echo "  🔄 Stopping process $PID..."
            kill -TERM $PID
        fi
    done
    
    # Wait for graceful shutdown
    sleep 5
    
    # Force kill if still running
    for PID in $PIDS; do
        if kill -0 $PID 2>/dev/null; then
            echo "  ⚡ Force stopping process $PID..."
            kill -KILL $PID
        fi
    done
    
    rm .atp-pids
    echo "✅ All ATP services stopped"
else
    echo "📋 No PID file found, checking for running processes..."
    
    # Kill any remaining ATP processes
    pkill -f "identity-service" || true
    pkill -f "vc-service" || true
    pkill -f "permission-service" || true
    pkill -f "audit-logger" || true
    pkill -f "rpc-gateway" || true
    pkill -f "quantum-safe-server" || true
    
    echo "✅ Cleanup complete"
fi

echo "🏁 ATP Production services stopped"