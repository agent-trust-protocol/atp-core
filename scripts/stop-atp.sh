#!/bin/bash

echo "🛑 Stopping ATP™ services..."

# Stop ATP™ services
if [ -f atp-services.pid ]; then
    ATP_PID=$(cat atp-services.pid)
    if ps -p $ATP_PID > /dev/null; then
        kill $ATP_PID
        echo "✅ ATP™ services stopped"
    fi
    rm -f atp-services.pid
fi

# Stop docs server
if [ -f docs-server.pid ]; then
    DOCS_PID=$(cat docs-server.pid)
    if ps -p $DOCS_PID > /dev/null; then
        kill $DOCS_PID
        echo "✅ Documentation server stopped"
    fi
    rm -f docs-server.pid
fi

# Stop infrastructure
docker compose -f docker-compose.simple.yml down
echo "✅ Infrastructure stopped"

echo "🎉 ATP™ shutdown complete!"
