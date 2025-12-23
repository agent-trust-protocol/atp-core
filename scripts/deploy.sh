#!/bin/bash

# 🛡️ Agent Trust Protocol™ - Production Deployment Script
# Automated deployment for enterprise environments

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-production}"
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if running as root in production
    if [ "$ENVIRONMENT" = "production" ] && [ "$EUID" -eq 0 ]; then
        log_warning "Running as root in production is not recommended"
    fi
    
    log_success "Prerequisites check passed"
}

setup_secrets() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Setting up Docker secrets for production..."
        
        # Create secrets if they don't exist
        secrets=(
            "postgres_user"
            "postgres_password"
            "redis_password"
            "database_url"
            "redis_url"
            "jwt_secret"
            "encryption_key"
            "atp_license_key"
            "grafana_password"
            "grafana_secret"
        )
        
        for secret in "${secrets[@]}"; do
            if ! docker secret ls | grep -q "$secret"; then
                log_warning "Secret '$secret' not found. Please create it manually:"
                echo "  echo 'your_secret_value' | docker secret create $secret -"
            fi
        done
    fi
}

build_images() {
    log_info "Building Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Build the main application image
    docker build -t atp/quantum-safe-server:latest .
    
    # Tag for production if needed
    if [ "$ENVIRONMENT" = "production" ]; then
        docker tag atp/quantum-safe-server:latest atp/quantum-safe-server:production
    fi
    
    log_success "Docker images built successfully"
}

deploy_services() {
    log_info "Deploying services with $COMPOSE_FILE..."
    
    cd "$PROJECT_ROOT"
    
    # Pull latest images
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Deploy services
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_success "Services deployed successfully"
}

wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    # Wait for quantum-safe server
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3008/health &> /dev/null; then
            log_success "Quantum-Safe server is healthy"
            break
        fi
        
        log_info "Attempt $attempt/$max_attempts: Waiting for services..."
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "Services failed to become healthy within timeout"
        exit 1
    fi
}

run_health_checks() {
    log_info "Running comprehensive health checks..."
    
    # Check quantum-safe server
    if ! curl -f http://localhost:3008/health; then
        log_error "Quantum-Safe server health check failed"
        exit 1
    fi
    
    # Check other services if in production
    if [ "$ENVIRONMENT" = "production" ]; then
        # Check Prometheus
        if ! curl -f http://localhost:9090/-/healthy; then
            log_warning "Prometheus health check failed"
        fi
        
        # Check Grafana
        if ! curl -f http://localhost:3000/api/health; then
            log_warning "Grafana health check failed"
        fi
    fi
    
    log_success "Health checks completed"
}

show_deployment_info() {
    log_success "🛡️ Agent Trust Protocol™ Deployment Complete!"
    echo
    echo "🚀 Services Available:"
    echo "  • Quantum-Safe MCP Server: http://localhost:3008"
    echo "  • Health Check: http://localhost:3008/health"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "  • Grafana Dashboard: http://localhost:3000"
        echo "  • Prometheus Metrics: http://localhost:9090"
        echo "  • Nginx Proxy: http://localhost"
    fi
    
    echo
    echo "📊 Monitoring:"
    echo "  • View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  • Check status: docker-compose -f $COMPOSE_FILE ps"
    echo "  • Stop services: docker-compose -f $COMPOSE_FILE down"
    echo
    echo "🛡️ Production Ready: World's First Quantum-Safe AI Agent Protocol"
}

cleanup_on_failure() {
    log_error "Deployment failed. Cleaning up..."
    docker-compose -f "$COMPOSE_FILE" down
    exit 1
}

# Main deployment flow
main() {
    log_info "🛡️ Starting Agent Trust Protocol™ deployment ($ENVIRONMENT)..."
    
    # Set up error handling
    trap cleanup_on_failure ERR
    
    # Run deployment steps
    check_prerequisites
    setup_secrets
    build_images
    deploy_services
    wait_for_services
    run_health_checks
    show_deployment_info
    
    log_success "🎉 Deployment completed successfully!"
}

# Show usage if no arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 [environment]"
    echo "Environments: development, staging, production"
    echo "Example: $0 production"
    exit 1
fi

# Run main function
main "$@"