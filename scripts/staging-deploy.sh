#!/bin/bash

# ATP™ Staging Deployment Script
# ==============================

set -e

echo "🚀 ATP™ Staging Deployment Starting..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

# Check prerequisites
log_info "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

# Check Docker Compose (v2 syntax)
if ! docker compose version &> /dev/null; then
    log_error "Docker Compose is not available"
    exit 1
fi

log_success "Docker and Docker Compose are available"

# Check if staging environment file exists
if [ ! -f ".env.staging" ]; then
    log_error "Missing .env.staging file"
    exit 1
fi

log_success "Environment configuration found"

# Load staging environment
log_info "Loading staging environment..."
set -a
source .env.staging
set +a

log_success "Staging environment loaded"

# Create necessary directories
log_info "Creating directory structure..."

mkdir -p nginx/ssl
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p scripts
mkdir -p logs

log_success "Directory structure created"

# Generate self-signed SSL certificates for staging
log_info "Generating SSL certificates for staging..."

if [ ! -f "nginx/ssl/atp-staging.crt" ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/atp-staging.key \
        -out nginx/ssl/atp-staging.crt \
        -subj "/C=US/ST=Staging/L=Staging/O=ATP/OU=Staging/CN=localhost"
    
    log_success "SSL certificates generated"
else
    log_info "SSL certificates already exist"
fi

# Create monitoring configuration
log_info "Setting up monitoring configuration..."

cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'atp-services'
    static_configs:
      - targets: 
          - 'identity-service:3001'
          - 'vc-service:3002' 
          - 'permission-service:3003'
          - 'rpc-gateway:3000'
          - 'audit-logger:3005'
          - 'protocol-integrations:3006'
    metrics_path: '/metrics'
    scrape_interval: 30s
EOF

log_success "Monitoring configuration created"

# Build and start services
log_info "Building ATP™ services..."

# Stop any existing containers
docker compose -f docker-compose.staging.yml down --remove-orphans 2>/dev/null || true

# Build services (build shared first)
log_info "Building shared package..."
cd packages/shared && npm run build && cd ../..

# Build all services
docker compose -f docker-compose.staging.yml build --parallel

log_success "Services built successfully"

# Start infrastructure services first
log_info "Starting infrastructure services..."

docker compose -f docker-compose.staging.yml up -d postgres ipfs

# Wait for infrastructure to be ready
log_info "Waiting for infrastructure services to be ready..."

# Wait for PostgreSQL
while ! docker compose -f docker-compose.staging.yml exec -T postgres pg_isready -U atp_user -d atp_staging > /dev/null 2>&1; do
    log_info "Waiting for PostgreSQL..."
    sleep 2
done

log_success "PostgreSQL is ready"

# Wait for IPFS
while ! curl -sf http://localhost:5001/api/v0/version > /dev/null 2>&1; do
    log_info "Waiting for IPFS..."
    sleep 2
done

log_success "IPFS is ready"

# Start core ATP™ services
log_info "Starting ATP™ core services..."

docker compose -f docker-compose.staging.yml up -d \
    identity-service \
    vc-service \
    permission-service \
    audit-logger

# Wait for core services
log_info "Waiting for core services to be ready..."

services=("identity-service:3001" "vc-service:3002" "permission-service:3003" "audit-logger:3005")

for service in "${services[@]}"; do
    while ! curl -sf http://localhost:${service#*:}/health > /dev/null 2>&1; do
        log_info "Waiting for ${service%:*}..."
        sleep 3
    done
    log_success "${service%:*} is ready"
done

# Start gateway and protocol integrations
log_info "Starting gateway and protocol services..."

docker compose -f docker-compose.staging.yml up -d \
    rpc-gateway \
    protocol-integrations

# Wait for gateway and protocols
log_info "Waiting for gateway and protocol services..."

while ! curl -sf http://localhost:3000/health > /dev/null 2>&1; do
    log_info "Waiting for RPC Gateway..."
    sleep 3
done

log_success "RPC Gateway is ready"

while ! curl -sf http://localhost:3006/health > /dev/null 2>&1; do
    log_info "Waiting for Protocol Integrations..."
    sleep 3
done

log_success "Protocol Integrations are ready"

# Start monitoring and load balancer
log_info "Starting monitoring and load balancer..."

docker compose -f docker-compose.staging.yml up -d \
    prometheus \
    grafana \
    nginx

log_success "All services started successfully"

# Run health checks
log_info "Running comprehensive health checks..."

# Test all service endpoints
services_health=(
    "http://localhost:3001/health:Identity Service"
    "http://localhost:3002/health:VC Service" 
    "http://localhost:3003/health:Permission Service"
    "http://localhost:3005/health:Audit Logger"
    "http://localhost:3000/health:RPC Gateway"
    "http://localhost:3006/health:Protocol Integrations"
)

all_healthy=true

for service_health in "${services_health[@]}"; do
    url="${service_health%:*}"
    name="${service_health#*:}"
    
    if curl -sf "$url" > /dev/null 2>&1; then
        log_success "$name health check passed"
    else
        log_error "$name health check failed"
        all_healthy=false
    fi
done

# Test load balancer
if curl -sf http://localhost/health > /dev/null 2>&1; then
    log_success "Load balancer health check passed"
else
    log_error "Load balancer health check failed"
    all_healthy=false
fi

# Display deployment summary
echo ""
echo "🏆 ATP™ Staging Deployment Summary"
echo "=================================="
echo ""

if [ "$all_healthy" = true ]; then
    log_success "All services are healthy and running!"
    echo ""
    echo "📋 Service URLs:"
    echo "• Load Balancer: http://localhost"
    echo "• RPC Gateway: http://localhost:3000" 
    echo "• Identity Service: http://localhost:3001"
    echo "• VC Service: http://localhost:3002"
    echo "• Permission Service: http://localhost:3003"
    echo "• Audit Logger: http://localhost:3005"
    echo "• Protocol Integrations: http://localhost:3006"
    echo ""
    echo "📊 Monitoring:"
    echo "• Prometheus: http://localhost:9090"
    echo "• Grafana: http://localhost:3001 (admin/staging-grafana-admin-password)"
    echo ""
    echo "🔍 IPFS:"
    echo "• Gateway: http://localhost:8080"
    echo "• API: http://localhost:5001"
    echo ""
    echo "🚀 ATP™ Staging Environment is LIVE!"
    echo ""
    echo "Next steps:"
    echo "1. Run integration tests: ./scripts/integration-test.sh"
    echo "2. Test protocol integrations"
    echo "3. Validate monitoring dashboards"
    echo "4. Proceed with live user testing"
    
    exit 0
else
    log_error "Some services failed health checks"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "• Check logs: docker compose -f docker-compose.staging.yml logs [service]"
    echo "• Check status: docker compose -f docker-compose.staging.yml ps"
    echo "• Restart services: docker compose -f docker-compose.staging.yml restart [service]"
    
    exit 1
fi