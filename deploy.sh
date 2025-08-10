#!/bin/bash

# Agent Trust Protocol - Production Deployment Script
# This script handles the complete deployment of ATP to production

set -euo pipefail  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="agent-trust-protocol"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"
BACKUP_DIR="/opt/atp/backups"
LOG_FILE="/var/log/atp-deployment.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if running as root or with sudo
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root. Consider using a dedicated user for deployment."
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if environment file exists
    if [[ ! -f "$ENV_FILE" ]]; then
        error "Environment file $ENV_FILE not found. Please copy .env.example to $ENV_FILE and configure it."
    fi
    
    # Check disk space (at least 10GB)
    AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
    if [[ $AVAILABLE_SPACE -lt 10485760 ]]; then  # 10GB in KB
        warning "Less than 10GB available disk space. Consider freeing up space."
    fi
    
    success "Prerequisites check completed"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    sudo mkdir -p /opt/atp/{data/{postgres,redis,ipfs,grafana,prometheus,loki},backups,logs,ssl}
    sudo mkdir -p /var/log/atp
    sudo mkdir -p ./nginx/ssl ./nginx/logs
    sudo mkdir -p ./database/{init,backups}
    sudo mkdir -p ./redis
    sudo mkdir -p ./monitoring/{grafana,prometheus}
    
    # Set proper permissions
    sudo chown -R $USER:$USER /opt/atp
    sudo chmod -R 755 /opt/atp
    
    success "Directories created successfully"
}

# Generate SSL certificates if they don't exist
generate_ssl_certificates() {
    log "Checking SSL certificates..."
    
    if [[ ! -f "./nginx/ssl/cert.pem" ]] || [[ ! -f "./nginx/ssl/key.pem" ]]; then
        log "Generating self-signed SSL certificates..."
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ./nginx/ssl/key.pem \
            -out ./nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        warning "Using self-signed certificates. For production, use certificates from a trusted CA."
    fi
    
    success "SSL certificates ready"
}

# Build Docker images
build_images() {
    log "Building Docker images..."
    
    # Build shared package first
    log "Building shared package..."
    cd packages/shared && npm run build && cd ../..
    
    # Build all services
    docker-compose -f "$COMPOSE_FILE" build --parallel
    
    success "Docker images built successfully"
}

# Database backup
backup_database() {
    log "Creating database backup..."
    
    # Only backup if containers are running
    if docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        BACKUP_FILE="$BACKUP_DIR/postgres-backup-$(date +%Y%m%d-%H%M%S).sql"
        
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U atp_user atp_production > "$BACKUP_FILE"
        gzip "$BACKUP_FILE"
        
        # Keep only last 30 days of backups
        find "$BACKUP_DIR" -name "postgres-backup-*.sql.gz" -mtime +30 -delete
        
        success "Database backup created: ${BACKUP_FILE}.gz"
    else
        log "Database not running, skipping backup"
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts"
        
        # Check all services
        local healthy=true
        
        # Check website
        if ! curl -f -s http://localhost/api/health > /dev/null 2>&1; then
            healthy=false
        fi
        
        # Check identity service
        if ! docker-compose -f "$COMPOSE_FILE" exec -T identity-service curl -f http://localhost:3001/health > /dev/null 2>&1; then
            healthy=false
        fi
        
        # Check permission service
        if ! docker-compose -f "$COMPOSE_FILE" exec -T permission-service curl -f http://localhost:3003/health > /dev/null 2>&1; then
            healthy=false
        fi
        
        # Check audit logger
        if ! docker-compose -f "$COMPOSE_FILE" exec -T audit-logger curl -f http://localhost:3005/health > /dev/null 2>&1; then
            healthy=false
        fi
        
        if [[ $healthy == true ]]; then
            success "All services are healthy"
            return 0
        fi
        
        log "Waiting for services to be ready..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Cleanup old containers and images
cleanup() {
    log "Cleaning up old containers and images..."
    
    # Remove stopped containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f
    
    success "Cleanup completed"
}

# Main deployment function
deploy() {
    log "Starting Agent Trust Protocol deployment..."
    
    # Create backup before deployment
    backup_database
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose -f "$COMPOSE_FILE" down
    
    # Build new images
    build_images
    
    # Start services
    log "Starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    log "Waiting for services to start..."
    sleep 30
    
    # Health check
    health_check
    
    # Display status
    docker-compose -f "$COMPOSE_FILE" ps
    
    success "Deployment completed successfully!"
    
    # Display useful information
    echo ""
    log "Service URLs:"
    echo "  Website: https://localhost"
    echo "  Grafana: http://localhost:3000"
    echo "  Prometheus: http://localhost:9090"
    echo ""
    log "To view logs: docker-compose -f $COMPOSE_FILE logs -f [service-name]"
    log "To stop services: docker-compose -f $COMPOSE_FILE down"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    # Stop current containers
    docker-compose -f "$COMPOSE_FILE" down
    
    # Restore from backup (implement as needed)
    warning "Automatic rollback not implemented. Manual intervention required."
    
    error "Rollback completed. Please restore from backup manually if needed."
}

# Main script
main() {
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            create_directories
            generate_ssl_certificates
            deploy
            ;;
        "rollback")
            rollback
            ;;
        "health")
            health_check
            ;;
        "backup")
            backup_database
            ;;
        "cleanup")
            cleanup
            ;;
        "logs")
            docker-compose -f "$COMPOSE_FILE" logs -f "${2:-}"
            ;;
        "status")
            docker-compose -f "$COMPOSE_FILE" ps
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|health|backup|cleanup|logs [service]|status}"
            echo ""
            echo "Commands:"
            echo "  deploy   - Full deployment (default)"
            echo "  rollback - Rollback deployment"
            echo "  health   - Check service health"
            echo "  backup   - Create database backup"
            echo "  cleanup  - Clean up old containers and images"
            echo "  logs     - View service logs"
            echo "  status   - Show service status"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"