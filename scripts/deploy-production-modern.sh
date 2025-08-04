#!/bin/bash

# ATP Production Deployment Script with Modern UI
# This script deploys the complete ATP system with the new modern UI

set -e

echo "🚀 Starting ATP Production Deployment with Modern UI..."

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
export JWT_SECRET=${JWT_SECRET:-"your-super-secret-jwt-key-change-in-production"}

print_status "Setting up production environment..."

# Create necessary directories
mkdir -p logs
mkdir -p ssl
mkdir -p data

# Build the modern UI
print_status "Building modern UI..."
cd ui-modern
npm ci --only=production
npm run build
cd ..

print_success "Modern UI build completed"

# Build all ATP services
print_status "Building ATP services..."
docker-compose -f docker-compose.production.modern.yml build

print_success "All services built successfully"

# Start the production stack
print_status "Starting production stack..."
docker-compose -f docker-compose.production.modern.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check if services are running
services=("atp-ui-modern" "atp-gateway" "atp-identity" "atp-permission" "atp-vc" "atp-audit" "atp-quantum" "postgres" "redis")

for service in "${services[@]}"; do
    if docker-compose -f docker-compose.production.modern.yml ps | grep -q "$service.*Up"; then
        print_success "$service is running"
    else
        print_error "$service is not running"
        exit 1
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

# Check Gateway
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_success "ATP Gateway is healthy"
else
    print_warning "ATP Gateway health check failed, but service may still be starting"
fi

# Check Quantum Service
if curl -f http://localhost:3008/health > /dev/null 2>&1; then
    print_success "ATP Quantum Service is healthy"
else
    print_warning "ATP Quantum Service health check failed, but service may still be starting"
fi

# Check PostgreSQL
if docker-compose -f docker-compose.production.modern.yml exec -T postgres pg_isready -U atp_user > /dev/null 2>&1; then
    print_success "PostgreSQL is ready"
else
    print_warning "PostgreSQL health check failed, but service may still be starting"
fi

# Check Redis
if docker-compose -f docker-compose.production.modern.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is ready"
else
    print_warning "Redis health check failed, but service may still be starting"
fi

# Display deployment information
echo ""
print_success "🎉 ATP Production Deployment with Modern UI Complete!"
echo ""
echo "📊 Service URLs:"
echo "   Modern UI:        http://localhost:3000"
echo "   ATP Gateway:      http://localhost:3001"
echo "   Identity Service: http://localhost:3002"
echo "   Permission Service: http://localhost:3003"
echo "   VC Service:       http://localhost:3004"
echo "   Audit Logger:     http://localhost:3005"
echo "   Quantum Service:  http://localhost:3008"
echo "   Prometheus:       http://localhost:9090"
echo "   Grafana:          http://localhost:3006 (admin/admin)"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:        docker-compose -f docker-compose.production.modern.yml logs -f"
echo "   Stop services:    docker-compose -f docker-compose.production.modern.yml down"
echo "   Restart services: docker-compose -f docker-compose.production.modern.yml restart"
echo ""
echo "📝 Next Steps:"
echo "   1. Access the Modern UI at http://localhost:3000"
echo "   2. Test the Visual Policy Editor at http://localhost:3000/policy-editor"
echo "   3. Check the Enterprise Dashboard at http://localhost:3000/dashboard"
echo "   4. Monitor services in Grafana at http://localhost:3006"
echo ""

# Save deployment info
cat > deployment-info.txt << EOF
ATP Production Deployment with Modern UI
Deployed: $(date)
Services:
- Modern UI: http://localhost:3000
- ATP Gateway: http://localhost:3001
- Identity Service: http://localhost:3002
- Permission Service: http://localhost:3003
- VC Service: http://localhost:3004
- Audit Logger: http://localhost:3005
- Quantum Service: http://localhost:3008
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3006 (admin/admin)

Management:
- View logs: docker-compose -f docker-compose.production.modern.yml logs -f
- Stop: docker-compose -f docker-compose.production.modern.yml down
- Restart: docker-compose -f docker-compose.production.modern.yml restart
EOF

print_success "Deployment information saved to deployment-info.txt" 