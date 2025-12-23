#!/bin/bash
# ATP Cloud Deployment Script
# ⚠️  INTERNAL TESTING ONLY - NOT FOR PRODUCTION USE

set -e

echo "🔐 ATP Cloud Deployment Script"
echo "⚠️  INTERNAL TESTING ONLY - NOT FOR PRODUCTION USE"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${ENVIRONMENT:-development}
BUILD_DASHBOARD=${BUILD_DASHBOARD:-true}
SKIP_TESTS=${SKIP_TESTS:-false}

echo -e "${BLUE}Configuration:${NC}"
echo "  Environment: $ENVIRONMENT"
echo "  Build Dashboard: $BUILD_DASHBOARD"
echo "  Skip Tests: $SKIP_TESTS"
echo ""

# Check dependencies
check_dependencies() {
    echo -e "${BLUE}Checking dependencies...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is not installed${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}Error: npm is not installed${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All dependencies found${NC}"
}

# Install npm dependencies
install_dependencies() {
    echo -e "${BLUE}Installing npm dependencies...${NC}"
    npm ci --only=production
    
    if [ "$BUILD_DASHBOARD" = true ]; then
        echo -e "${BLUE}Installing dashboard dependencies...${NC}"
        cd dashboard
        npm ci --only=production
        cd ..
    fi
    
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = false ]; then
        echo -e "${BLUE}Running tests...${NC}"
        npm test
        echo -e "${GREEN}✓ Tests passed${NC}"
    else
        echo -e "${YELLOW}⚠ Skipping tests${NC}"
    fi
}

# Build services
build_services() {
    echo -e "${BLUE}Building services...${NC}"
    npm run build:services
    
    if [ "$BUILD_DASHBOARD" = true ]; then
        echo -e "${BLUE}Building dashboard...${NC}"
        npm run build:dashboard
    fi
    
    echo -e "${GREEN}✓ Services built${NC}"
}

# Build Docker images
build_docker() {
    echo -e "${BLUE}Building Docker images...${NC}"
    docker-compose -f docker/docker-compose.yml build --parallel
    echo -e "${GREEN}✓ Docker images built${NC}"
}

# Deploy services
deploy_services() {
    echo -e "${BLUE}Deploying services...${NC}"
    
    # Stop any existing services
    docker-compose -f docker/docker-compose.yml down --remove-orphans
    
    # Start services
    docker-compose -f docker/docker-compose.yml up -d
    
    echo -e "${GREEN}✓ Services deployed${NC}"
}

# Health check
health_check() {
    echo -e "${BLUE}Performing health checks...${NC}"
    
    # Wait for services to start
    sleep 10
    
    # Check Cloud Gateway
    if curl -f http://localhost:3010/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Cloud Gateway is healthy${NC}"
    else
        echo -e "${RED}✗ Cloud Gateway health check failed${NC}"
    fi
    
    # Check Tenant Service
    if curl -f http://localhost:3011/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Tenant Service is healthy${NC}"
    else
        echo -e "${RED}✗ Tenant Service health check failed${NC}"
    fi
    
    # Check Analytics Service
    if curl -f http://localhost:3012/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Analytics Service is healthy${NC}"
    else
        echo -e "${RED}✗ Analytics Service health check failed${NC}"
    fi
}

# Show deployment summary
show_summary() {
    echo ""
    echo -e "${GREEN}🎉 ATP Cloud deployment completed!${NC}"
    echo ""
    echo "Services:"
    echo "  Cloud Gateway:    http://localhost:3010"
    echo "  Tenant Service:   http://localhost:3011"
    echo "  Analytics Service: http://localhost:3012"
    echo "  Cloud Dashboard:  http://localhost:3013"
    echo ""
    echo "API Endpoints:"
    echo "  Gateway API:      http://localhost:3010/api/v1"
    echo "  Tenant API:       http://localhost:3011/api/v1"
    echo "  Analytics API:    http://localhost:3012/api/v1"
    echo ""
    echo "Databases:"
    echo "  MongoDB:          mongodb://localhost:27017"
    echo "  Redis:            redis://localhost:6379"
    echo ""
    echo -e "${YELLOW}⚠️  INTERNAL TESTING ONLY - NOT FOR PRODUCTION USE${NC}"
}

# Main deployment flow
main() {
    echo "Starting ATP Cloud deployment..."
    
    check_dependencies
    install_dependencies
    run_tests
    build_services
    build_docker
    deploy_services
    health_check
    show_summary
}

# Handle script interruption
trap 'echo -e "\n${RED}Deployment interrupted${NC}"; exit 1' INT

# Run main function
main

echo ""
echo "Use './scripts/check-deployment.sh' to verify the deployment"
echo "Use 'docker-compose -f docker/docker-compose.yml logs' to view logs"
echo ""