#!/bin/bash

# ATP™ Public Launch Script
# =========================
# Complete launch sequence for Agent Trust Protocol™ public release

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}🚀 Agent Trust Protocol™ - Public Launch${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${BOLD}${BLUE}📋 $1${NC}"
}

# Step 1: Verify prerequisites
log_step "Step 1: Verifying Prerequisites"

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    log_error "Docker Compose is not available. Please install Docker Desktop with Compose v2."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    log_warning "Node.js not found. Some features may not work."
else
    NODE_VERSION=$(node --version)
    log_success "Node.js $NODE_VERSION detected"
fi

# Check Python for docs server
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    log_success "Python3 detected: $PYTHON_VERSION"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version)
    log_success "Python detected: $PYTHON_VERSION"
else
    log_warning "Python not found. Documentation server may not work."
fi

log_success "Prerequisites verified"

# Step 2: Launch ATP™ Infrastructure
log_step "Step 2: Launching ATP™ Infrastructure"

log_info "Starting PostgreSQL, IPFS, and Prometheus..."
docker compose -f docker-compose.simple.yml up -d

log_info "Waiting for services to initialize..."
sleep 15

# Verify infrastructure health
log_info "Verifying infrastructure health..."

# Check PostgreSQL
if docker compose -f docker-compose.simple.yml exec -T postgres pg_isready -U atp_user -d atp_staging > /dev/null 2>&1; then
    log_success "PostgreSQL is healthy"
else
    log_warning "PostgreSQL is still starting..."
fi

# Check IPFS
if curl -sf http://localhost:5001/api/v0/version > /dev/null 2>&1; then
    log_success "IPFS is healthy"
else
    log_warning "IPFS is still starting..."
fi

# Check Prometheus
if curl -sf http://localhost:9090/-/healthy > /dev/null 2>&1; then
    log_success "Prometheus is healthy"
else
    log_warning "Prometheus is still starting..."
fi

log_success "Infrastructure launched successfully"

# Step 3: Launch ATP™ Services
log_step "Step 3: Launching ATP™ Core Services"

log_info "Starting ATP™ mock services for demonstration..."

# Check if Node.js is available for mock services
if command -v node &> /dev/null; then
    # Start mock services in background
    nohup node atp-mock-service.js > logs/atp-services.log 2>&1 &
    ATP_PID=$!
    echo $ATP_PID > atp-services.pid
    
    # Wait for services to start
    sleep 5
    
    # Test service health
    if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
        log_success "ATP™ services are running (PID: $ATP_PID)"
    else
        log_warning "ATP™ services are starting up..."
    fi
else
    log_warning "Node.js not available. Skipping ATP™ service startup."
fi

# Step 4: Launch Documentation Site
log_step "Step 4: Launching Documentation Site"

log_info "Starting documentation server..."

# Make sure docs server script is executable
chmod +x scripts/serve-docs.sh

# Start docs server in background
nohup scripts/serve-docs.sh > logs/docs-server.log 2>&1 &
DOCS_PID=$!
echo $DOCS_PID > docs-server.pid

sleep 3

# Test docs server
if curl -sf http://localhost:8000 > /dev/null 2>&1; then
    log_success "Documentation site is live (PID: $DOCS_PID)"
else
    log_warning "Documentation server is starting up..."
fi

# Step 5: Run comprehensive health check
log_step "Step 5: Final Health Check"

echo ""
log_info "Testing complete ATP™ stack..."

# Test infrastructure
echo -e "${CYAN}Infrastructure Services:${NC}"
curl -sf http://localhost:5432 > /dev/null && echo "  ✅ PostgreSQL responding" || echo "  ⚠️  PostgreSQL not ready"
curl -sf http://localhost:5001/api/v0/version > /dev/null && echo "  ✅ IPFS API responding" || echo "  ⚠️  IPFS not ready"
curl -sf http://localhost:9090/-/healthy > /dev/null && echo "  ✅ Prometheus responding" || echo "  ⚠️  Prometheus not ready"

# Test ATP™ services
echo -e "${CYAN}ATP™ Services:${NC}"
curl -sf http://localhost:3001/health > /dev/null && echo "  ✅ Identity Service responding" || echo "  ⚠️  Identity Service not ready"
curl -sf http://localhost:3000/health > /dev/null && echo "  ✅ RPC Gateway responding" || echo "  ⚠️  RPC Gateway not ready"
curl -sf http://localhost:3005/health > /dev/null && echo "  ✅ Audit Logger responding" || echo "  ⚠️  Audit Logger not ready"

# Test documentation
echo -e "${CYAN}Documentation:${NC}"
curl -sf http://localhost:8000 > /dev/null && echo "  ✅ Documentation site responding" || echo "  ⚠️  Documentation site not ready"

echo ""

# Step 6: Display launch summary
log_step "🎉 ATP™ Public Launch Complete!"

echo ""
echo -e "${BOLD}${GREEN}🏆 Agent Trust Protocol™ is now LIVE!${NC}"
echo ""
echo -e "${BOLD}📋 Access Your ATP™ Environment:${NC}"
echo ""
echo -e "${CYAN}📚 Documentation Site:${NC}"
echo -e "• Main Site: ${GREEN}http://localhost:8000${NC}"
echo -e "• Developer Guide: ${GREEN}http://localhost:8000/DEVELOPER_ONBOARDING.md${NC}"
echo -e "• API Reference: ${GREEN}http://localhost:8000/API_REFERENCE.md${NC}"
echo ""
echo -e "${CYAN}🔧 ATP™ API Services:${NC}"
echo -e "• Identity Service: ${GREEN}http://localhost:3001${NC}"
echo -e "• RPC Gateway: ${GREEN}http://localhost:3000${NC}"
echo -e "• Audit Logger: ${GREEN}http://localhost:3005${NC}"
echo -e "• Protocol Integrations: ${GREEN}http://localhost:3006${NC}"
echo ""
echo -e "${CYAN}🏗️ Infrastructure Services:${NC}"
echo -e "• PostgreSQL Database: ${GREEN}localhost:5432${NC}"
echo -e "• IPFS Storage: ${GREEN}localhost:5001${NC} (API), ${GREEN}localhost:8080${NC} (Gateway)"
echo -e "• Prometheus Monitoring: ${GREEN}http://localhost:9090${NC}"
echo ""
echo -e "${BOLD}🚀 Quick Start Commands:${NC}"
echo -e "${CYAN}# Test ATP™ services${NC}"
echo -e "curl http://localhost:3001/health"
echo -e "curl http://localhost:3001/identity"
echo ""
echo -e "${CYAN}# Register a new agent${NC}"
echo -e "curl -X POST http://localhost:3001/identity/register \\\\"
echo -e "  -H \"Content-Type: application/json\" \\\\"
echo -e "  -d '{\"publicKey\":\"test-key\",\"metadata\":{\"name\":\"My Agent\"}}'"
echo ""
echo -e "${CYAN}# View audit events${NC}"
echo -e "curl http://localhost:3005/audit/events"
echo ""
echo -e "${BOLD}📁 Project Files:${NC}"
echo -e "• Developer Examples: ${CYAN}examples/quick-start/${NC}"
echo -e "• Configuration: ${CYAN}.env.development${NC}"
echo -e "• Test Script: ${CYAN}./test-atp.sh${NC}"
echo ""
echo -e "${BOLD}🔍 Monitoring & Management:${NC}"
echo -e "• View logs: ${CYAN}docker compose -f docker-compose.simple.yml logs${NC}"
echo -e "• Check status: ${CYAN}docker compose -f docker-compose.simple.yml ps${NC}"
echo -e "• Stop services: ${CYAN}./scripts/stop-atp.sh${NC}"
echo ""
echo -e "${BOLD}💬 Community & Support:${NC}"
echo -e "• GitHub: ${CYAN}https://github.com/agent-trust-protocol/atp${NC}"
echo -e "• Documentation: ${CYAN}http://localhost:8000${NC}"
echo -e "• Developer Guide: ${CYAN}http://localhost:8000/DEVELOPER_ONBOARDING.md${NC}"
echo ""
echo -e "${GREEN}🎊 Welcome to the ATP™ developer community!${NC}"
echo -e "${GREEN}Build secure, trustworthy AI agents with confidence.${NC}"
echo ""

# Create stop script
cat > scripts/stop-atp.sh << 'EOF'
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
EOF

chmod +x scripts/stop-atp.sh

log_success "Stop script created: scripts/stop-atp.sh"