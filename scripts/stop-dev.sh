#!/bin/bash

echo "🛑 Stopping Agent Trust Protocol Services"
echo "========================================"

for service in identity vc permission rpc-gateway; do
    if [ -f "./data/${service}.pid" ]; then
        pid=$(cat "./data/${service}.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🔴 Stopping $service (PID: $pid)"
            kill "$pid"
        fi
        rm -f "./data/${service}.pid"
    fi
done

echo "✅ All services stopped"
