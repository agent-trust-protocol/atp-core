#!/bin/bash

# 🛡️ Agent Trust Protocol™ - Secrets Management Script
# Generate and manage production secrets securely

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

generate_random_string() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "=+/"
}

generate_encryption_key() {
    openssl rand -base64 32
}

create_docker_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if docker secret ls | grep -q "$secret_name"; then
        log_warning "Secret '$secret_name' already exists, skipping..."
        return 0
    fi
    
    echo "$secret_value" | docker secret create "$secret_name" -
    log_success "Created secret: $secret_name"
}

setup_database_secrets() {
    log_info "Setting up database secrets..."
    
    # Generate database credentials
    local postgres_user="atp_user"
    local postgres_password=$(generate_random_string 32)
    local database_url="postgresql://${postgres_user}:${postgres_password}@postgres:5432/atp_production"
    
    create_docker_secret "postgres_user" "$postgres_user"
    create_docker_secret "postgres_password" "$postgres_password"
    create_docker_secret "database_url" "$database_url"
    
    log_success "Database secrets configured"
}

setup_redis_secrets() {
    log_info "Setting up Redis secrets..."
    
    local redis_password=$(generate_random_string 32)
    local redis_url="redis://:${redis_password}@redis:6379"
    
    create_docker_secret "redis_password" "$redis_password"
    create_docker_secret "redis_url" "$redis_url"
    
    log_success "Redis secrets configured"
}

setup_application_secrets() {
    log_info "Setting up application secrets..."
    
    # JWT Secret
    local jwt_secret=$(generate_jwt_secret)
    create_docker_secret "jwt_secret" "$jwt_secret"
    
    # Encryption Key
    local encryption_key=$(generate_encryption_key)
    create_docker_secret "encryption_key" "$encryption_key"
    
    # ATP License Key (placeholder - replace with actual license)
    local atp_license_key="atp_enterprise_license_$(generate_random_string 16)"
    create_docker_secret "atp_license_key" "$atp_license_key"
    
    log_success "Application secrets configured"
}

setup_monitoring_secrets() {
    log_info "Setting up monitoring secrets..."
    
    # Grafana credentials
    local grafana_password=$(generate_random_string 16)
    local grafana_secret=$(generate_random_string 32)
    
    create_docker_secret "grafana_password" "$grafana_password"
    create_docker_secret "grafana_secret" "$grafana_secret"
    
    log_success "Monitoring secrets configured"
    log_info "Grafana admin password: $grafana_password"
}

backup_secrets() {
    log_info "Creating secrets backup..."
    
    local backup_dir="./secrets-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Export secrets (encrypted)
    docker secret ls --format "table {{.Name}}" | tail -n +2 > "$backup_dir/secret-names.txt"
    
    log_warning "Secrets backup created in: $backup_dir"
    log_warning "Store this backup securely and encrypt it!"
}

verify_secrets() {
    log_info "Verifying secrets..."
    
    local required_secrets=(
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
    
    local missing_secrets=()
    
    for secret in "${required_secrets[@]}"; do
        if ! docker secret ls | grep -q "$secret"; then
            missing_secrets+=("$secret")
        fi
    done
    
    if [ ${#missing_secrets[@]} -eq 0 ]; then
        log_success "All required secrets are present"
    else
        log_error "Missing secrets: ${missing_secrets[*]}"
        exit 1
    fi
}

show_secrets_info() {
    log_success "🛡️ Agent Trust Protocol™ Secrets Setup Complete!"
    echo
    echo "📋 Created Secrets:"
    docker secret ls
    echo
    echo "🔐 Security Notes:"
    echo "  • All secrets are stored in Docker's encrypted secret store"
    echo "  • Secrets are only accessible to authorized containers"
    echo "  • Rotate secrets regularly for enhanced security"
    echo "  • Monitor secret access in production logs"
    echo
    echo "🚀 Next Steps:"
    echo "  • Run deployment: ./scripts/deploy.sh production"
    echo "  • Verify services: docker-compose -f docker-compose.prod.yml ps"
    echo "  • Check health: curl http://localhost:3008/health"
}

# Main function
main() {
    log_info "🛡️ Setting up Agent Trust Protocol™ production secrets..."
    
    # Check if Docker Swarm is initialized
    if ! docker info | grep -q "Swarm: active"; then
        log_info "Initializing Docker Swarm for secrets management..."
        docker swarm init
    fi
    
    # Setup all secrets
    setup_database_secrets
    setup_redis_secrets
    setup_application_secrets
    setup_monitoring_secrets
    
    # Verify and backup
    verify_secrets
    backup_secrets
    
    # Show completion info
    show_secrets_info
    
    log_success "🎉 Secrets setup completed successfully!"
}

# Show usage
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    echo "Usage: $0"
    echo "Sets up all required Docker secrets for production deployment"
    echo
    echo "This script will:"
    echo "  • Generate secure random passwords and keys"
    echo "  • Create Docker secrets for all services"
    echo "  • Backup secret names for reference"
    echo "  • Verify all required secrets are present"
    echo
    echo "Requirements:"
    echo "  • Docker with Swarm mode enabled"
    echo "  • OpenSSL for key generation"
    exit 0
fi

# Run main function
main "$@"