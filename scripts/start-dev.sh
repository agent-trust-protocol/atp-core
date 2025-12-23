#!/bin/bash

# Agent Trust Protocol - Development Startup Script

echo "🚀 Starting Agent Trust Protocol Services"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build all packages
echo "🔨 Building packages..."
npm run build

# Create data directories
echo "📁 Creating data directories..."
mkdir -p data/identity data/vc data/permission

# Function to start a service in the background
start_service() {
    local service=$1
    local port=$2
    local workspace=$3
    
    echo "🟢 Starting $service on port $port..."
    DB_PATH="./data/${service}.db" npm run dev --workspace="$workspace" &
    local pid=$!
    echo $pid > "./data/${service}.pid"
    
    # Wait a moment for service to start
    sleep 2
    
    # Check if service is responding
    if curl -s -f "http://localhost:$port/health" > /dev/null; then
        echo "✅ $service is healthy"
    else
        echo "⚠️  $service may not be ready yet"
    fi
}

# Start services
start_service "identity" 3001 "@atp/identity-service"
start_service "vc" 3002 "@atp/vc-service"  
start_service "permission" 3003 "@atp/permission-service"
start_service "rpc-gateway" 3000 "@atp/rpc-gateway"

echo ""
echo "🎉 All services started!"
echo ""
echo "Service Status:"
echo "- Identity Service:    http://localhost:3001/health"
echo "- VC Service:          http://localhost:3002/health"  
echo "- Permission Service:  http://localhost:3003/health"
echo "- RPC Gateway:         http://localhost:3000/health"
echo "- WebSocket Endpoint:  ws://localhost:8080/rpc"
echo ""
echo "🧪 Try the demo:"
echo "  cd examples/demo-workflow && npm run demo"
echo ""
echo "🛑 To stop all services:"
echo "  ./scripts/stop-dev.sh"

# Create stop script
cat > ./scripts/stop-dev.sh << 'EOF'
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
EOF

chmod +x ./scripts/stop-dev.sh