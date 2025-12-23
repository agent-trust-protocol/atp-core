#!/bin/bash

# Agent Trust Protocol - Service Stopper Script
# Stops all ATP services

echo "🛑 Stopping Agent Trust Protocol Services..."

# Function to stop a service
stop_service() {
    local name=$1
    local pidfile="logs/$name.pid"
    
    if [ -f "$pidfile" ]; then
        local pid=$(cat "$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Stopping $name service (PID: $pid)..."
            kill "$pid"
            rm "$pidfile"
        else
            echo "$name service was not running"
            rm "$pidfile"
        fi
    else
        echo "$name service PID file not found"
    fi
}

# Stop all services
stop_service "identity"
stop_service "vc"
stop_service "permission"
stop_service "rpc-gateway"
stop_service "audit"

echo "✅ All services stopped!"