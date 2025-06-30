#!/bin/bash

# ATP™ Secrets Generation Script
# ==============================
# Generates secure secrets for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

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
    echo -e "${BOLD}${CYAN}🔐 $1${NC}"
}

echo -e "${BOLD}${CYAN}🔐 Agent Trust Protocol™ - Secrets Generator${NC}"
echo -e "${CYAN}==============================================${NC}"
echo ""

# Check for required tools
log_step "Checking Required Tools"

if ! command -v openssl &> /dev/null; then
    log_error "OpenSSL is required but not installed. Please install OpenSSL."
    exit 1
fi

if ! command -v node &> /dev/null; then
    log_warning "Node.js not found. Some features may not work."
fi

log_success "Required tools verified"

# Function to generate secure random string
generate_secret() {
    local length=${1:-64}
    openssl rand -hex $length
}

# Function to generate JWT secret
generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-64
}

# Function to generate password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-24
}

# Create environment file
ENV_FILE=${1:-.env.production}
log_step "Generating Secrets for $ENV_FILE"

# Create backup if file exists
if [ -f "$ENV_FILE" ]; then
    log_warning "Backing up existing $ENV_FILE to ${ENV_FILE}.backup"
    cp "$ENV_FILE" "${ENV_FILE}.backup"
fi

# Generate all secrets
log_info "Generating encryption keys..."
AUDIT_KEY=$(generate_secret 32)
SERVICE_KEY=$(generate_secret 32)
MASTER_KEY=$(generate_secret 32)

log_info "Generating authentication secrets..."
JWT_SECRET=$(generate_jwt_secret)
SESSION_SECRET=$(generate_secret 64)

log_info "Generating database credentials..."
DB_PASSWORD=$(generate_password)
GRAFANA_PASSWORD=$(generate_password)

log_info "Generating IPFS cluster secret..."
IPFS_SECRET=$(generate_secret 32)

log_info "Generating CA passphrase..."
CA_PASSPHRASE=$(generate_password)

# Write to environment file
cat > "$ENV_FILE" << EOF
# ATP™ Production Environment Configuration
# Generated on $(date)
# WARNING: Keep this file secure and never commit to version control

# ============================================================================
# CORE ATP™ CONFIGURATION
# ============================================================================

NODE_ENV=production
ATP_ENVIRONMENT=production

# ============================================================================
# SERVICE PORTS
# ============================================================================

IDENTITY_SERVICE_PORT=3001
VC_SERVICE_PORT=3002
PERMISSION_SERVICE_PORT=3003
RPC_GATEWAY_PORT=3000
RPC_GATEWAY_HTTPS_PORT=3443
AUDIT_LOGGER_PORT=3005
PROTOCOL_INTEGRATIONS_PORT=3006

POSTGRES_PORT=5432
IPFS_API_PORT=5001
IPFS_GATEWAY_PORT=8080
PROMETHEUS_PORT=9090
GRAFANA_PORT=3090

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

POSTGRES_HOST=postgres
POSTGRES_DB=atp_production
POSTGRES_USER=atp_user
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_MAX_CONNECTIONS=20
POSTGRES_CONNECTION_TIMEOUT=30000

DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@\${POSTGRES_HOST}:\${POSTGRES_PORT}/\${POSTGRES_DB}
IDENTITY_DB_URL=\${DATABASE_URL}
VC_DB_URL=\${DATABASE_URL}
PERMISSION_DB_URL=\${DATABASE_URL}
AUDIT_DB_URL=\${DATABASE_URL}

# ============================================================================
# SECURITY & ENCRYPTION
# ============================================================================

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

AUDIT_ENCRYPTION_KEY=${AUDIT_KEY}
SERVICE_ENCRYPTION_KEY=${SERVICE_KEY}
MASTER_ENCRYPTION_KEY=${MASTER_KEY}

# DID & Certificate Authority
DID_METHOD=atp
DID_NETWORK=mainnet
CA_PRIVATE_KEY_PATH=/secrets/ca-private-key.pem
CA_CERTIFICATE_PATH=/secrets/ca-certificate.pem
CA_PASSPHRASE=${CA_PASSPHRASE}

# TLS/SSL Configuration
TLS_CERT_PATH=/ssl/atp-certificate.pem
TLS_KEY_PATH=/ssl/atp-private-key.pem
TLS_CA_PATH=/ssl/ca-certificate.pem
ENABLE_MTLS=true

# ============================================================================
# SERVICE ENDPOINTS
# ============================================================================

IDENTITY_SERVICE_URL=http://identity-service:3001
VC_SERVICE_URL=http://vc-service:3002
PERMISSION_SERVICE_URL=http://permission-service:3003
RPC_GATEWAY_URL=http://rpc-gateway:3000
AUDIT_SERVICE_URL=http://audit-logger:3005
PROTOCOL_INTEGRATIONS_URL=http://protocol-integrations:3006

EXTERNAL_GATEWAY_URL=https://api.atp.dev
EXTERNAL_DOCS_URL=https://docs.atp.dev

# ============================================================================
# INFRASTRUCTURE SERVICES
# ============================================================================

IPFS_HOST=ipfs
IPFS_API_URL=http://ipfs:5001
IPFS_GATEWAY_URL=http://ipfs:8080
IPFS_CLUSTER_SECRET=${IPFS_SECRET}

PROMETHEUS_URL=http://prometheus:9090
GRAFANA_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
GRAFANA_SECRET_KEY=$(generate_secret 32)

# ============================================================================
# SECURITY POLICIES
# ============================================================================

CORS_ORIGIN=https://app.atp.dev,https://dashboard.atp.dev
CORS_CREDENTIALS=true

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=20

SESSION_SECRET=${SESSION_SECRET}
SESSION_TIMEOUT=3600000

# ============================================================================
# OPERATIONAL CONFIGURATION
# ============================================================================

LOG_LEVEL=info
LOG_FORMAT=json
LOG_MAX_SIZE=10MB
LOG_MAX_FILES=5
LOG_COMPRESS=true

HEALTH_CHECK_INTERVAL=30s
HEALTH_CHECK_TIMEOUT=10s
HEALTH_CHECK_RETRIES=3

MAX_REQUEST_SIZE=10MB
REQUEST_TIMEOUT=30000
KEEP_ALIVE_TIMEOUT=5000

# ============================================================================
# PRODUCTION SETTINGS
# ============================================================================

DEBUG_MODE=false
ENABLE_SWAGGER=false
ENABLE_METRICS_ENDPOINT=true
MOCK_SERVICES=false
EOF

# Set secure permissions
chmod 600 "$ENV_FILE"

log_success "Secrets generated and saved to $ENV_FILE"

# Display summary
echo ""
log_step "🔐 Security Summary"
echo -e "${CYAN}================================================${NC}"
echo -e "📁 Environment file: ${BOLD}$ENV_FILE${NC}"
echo -e "🔒 File permissions: ${BOLD}600 (owner read/write only)${NC}"
echo -e "🔑 Generated secrets:"
echo -e "   • JWT Secret: ${GREEN}64 characters${NC}"
echo -e "   • Encryption Keys: ${GREEN}3 x 64 hex characters${NC}"
echo -e "   • Database Password: ${GREEN}24 characters${NC}"
echo -e "   • Session Secret: ${GREEN}128 hex characters${NC}"
echo -e "   • IPFS Cluster Secret: ${GREEN}64 hex characters${NC}"
echo -e "   • CA Passphrase: ${GREEN}24 characters${NC}"
echo ""

log_warning "IMPORTANT SECURITY NOTES:"
echo -e "• ${YELLOW}Keep the $ENV_FILE file secure${NC}"
echo -e "• ${YELLOW}Never commit this file to version control${NC}"
echo -e "• ${YELLOW}Use a proper secrets management system in production${NC}"
echo -e "• ${YELLOW}Regularly rotate secrets for security${NC}"
echo -e "• ${YELLOW}Generate SSL certificates before deployment${NC}"
echo ""

if [ "$ENV_FILE" = ".env.production" ]; then
    log_info "Next steps:"
    echo -e "1. Review and customize the generated configuration"
    echo -e "2. Generate SSL certificates: ${CYAN}./scripts/generate-ssl-certs.sh${NC}"
    echo -e "3. Deploy with: ${CYAN}docker-compose --env-file .env.production up -d${NC}"
fi

log_success "🚀 ATP™ Production secrets ready!" 