#!/bin/bash

# ATP Modern UI Demo Deployment Script
# This script deploys the modern UI with mock backend services for demonstration

set -e

echo "🚀 Starting ATP Modern UI Demo Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Set environment variables
export NODE_ENV=production

print_status "Setting up demo environment..."

# Create necessary directories
mkdir -p logs
mkdir -p ssl
mkdir -p mock-data

# Generate self-signed SSL certificates for demo
if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
    print_status "Generating SSL certificates for demo..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/key.pem -out ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=ATP/CN=localhost" 2>/dev/null || true
fi

# Build the modern UI
print_status "Building modern UI..."
cd ui-modern
npm ci --only=production
npm run build
cd ..

print_success "Modern UI build completed"

# Build and start the demo stack
print_status "Building and starting demo stack..."
docker-compose -f docker-compose.modern-ui-only.yml build
docker-compose -f docker-compose.modern-ui-only.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check if services are running
services=("atp-ui-modern" "mock-api" "mock-quantum" "postgres" "redis" "prometheus" "grafana" "nginx")

for service in "${services[@]}"; do
    if docker-compose -f docker-compose.modern-ui-only.yml ps | grep -q "$service.*Up"; then
        print_success "$service is running"
    else
        print_warning "$service is not running yet (may still be starting)"
    fi
done

# Run health checks
print_status "Running health checks..."

# Check UI
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success "Modern UI is accessible at http://localhost:3000"
else
    print_warning "Modern UI health check failed, but service may still be starting"
fi

# Check Mock API
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_success "Mock API is healthy"
else
    print_warning "Mock API health check failed, but service may still be starting"
fi

# Check Mock Quantum Service
if curl -f http://localhost:3008/health.json > /dev/null 2>&1; then
    print_success "Mock Quantum Service is healthy"
else
    print_warning "Mock Quantum Service health check failed, but service may still be starting"
fi

# Check PostgreSQL
if docker-compose -f docker-compose.modern-ui-only.yml exec -T postgres pg_isready -U atp_user > /dev/null 2>&1; then
    print_success "PostgreSQL is ready"
else
    print_warning "PostgreSQL health check failed, but service may still be starting"
fi

# Check Redis
if docker-compose -f docker-compose.modern-ui-only.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is ready"
else
    print_warning "Redis health check failed, but service may still be starting"
fi

# Display deployment information
echo ""
print_success "🎉 ATP Modern UI Demo Deployment Complete!"
echo ""
echo "📊 Service URLs:"
echo "   Modern UI:        http://localhost:3000"
echo "   Policy Editor:    http://localhost:3000/policy-editor"
echo "   Dashboard:        http://localhost:3000/dashboard"
echo "   Policy Management: http://localhost:3000/policies"
echo "   Mock API:         http://localhost:3001"
echo "   Mock Quantum:     http://localhost:3008"
echo "   Grafana:          http://localhost:3006 (admin/admin)"
echo "   Prometheus:       http://localhost:9090"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:        docker-compose -f docker-compose.modern-ui-only.yml logs -f"
echo "   Stop services:    docker-compose -f docker-compose.modern-ui-only.yml down"
echo "   Restart services: docker-compose -f docker-compose.modern-ui-only.yml restart"
echo ""
echo "📝 Demo Features:"
echo "   ✅ Modern UI with enterprise dashboard"
echo "   ✅ Visual Policy Editor with React Flow"
echo "   ✅ Policy Management interface"
echo "   ✅ Real-time metrics and monitoring"
echo "   ✅ Mock backend services for demonstration"
echo "   ✅ Production-ready infrastructure"
echo ""
echo "🎯 Next Steps:"
echo "   1. Open http://localhost:3000 to see the Modern UI"
echo "   2. Test the Visual Policy Editor at /policy-editor"
echo "   3. Explore the Enterprise Dashboard at /dashboard"
echo "   4. Check Policy Management at /policies"
echo "   5. Monitor services in Grafana at http://localhost:3006"
echo ""

# Save deployment info
cat > demo-deployment-info.txt << EOF
ATP Modern UI Demo Deployment
Deployed: $(date)
Services:
- Modern UI: http://localhost:3000
- Policy Editor: http://localhost:3000/policy-editor
- Dashboard: http://localhost:3000/dashboard
- Policy Management: http://localhost:3000/policies
- Mock API: http://localhost:3001
- Mock Quantum: http://localhost:3008
- Grafana: http://localhost:3006 (admin/admin)
- Prometheus: http://localhost:9090

Management:
- View logs: docker-compose -f docker-compose.modern-ui-only.yml logs -f
- Stop: docker-compose -f docker-compose.modern-ui-only.yml down
- Restart: docker-compose -f docker-compose.modern-ui-only.yml restart
EOF

print_success "Deployment information saved to demo-deployment-info.txt" 