#!/bin/bash

# ATP™ Environment Validation Script
# ==================================
# Validates environment configuration for security and completeness

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
    echo -e "${BOLD}${CYAN}🔍 $1${NC}"
}

echo -e "${BOLD}${CYAN}🔍 Agent Trust Protocol™ - Environment Validation${NC}"
echo -e "${CYAN}===================================================${NC}"
echo ""

# Environment file to validate
ENV_FILE=${1:-.env.production}

if [ ! -f "$ENV_FILE" ]; then
    log_error "Environment file $ENV_FILE not found!"
    log_info "Generate it with: ./scripts/generate-secrets.sh $ENV_FILE"
    exit 1
fi

log_step "Validating Environment File: $ENV_FILE"

# Source the environment file
set -a
source "$ENV_FILE"
set +a

ERRORS=0
WARNINGS=0

check_required_var() {
    local var_name=$1
    local var_value=${!var_name}
    local description=$2
    
    if [ -z "$var_value" ]; then
        log_error "Missing required variable: $var_name ($description)"
        ((ERRORS++))
        return 1
    else
        log_success "$var_name is set"
        return 0
    fi
}

check_secret_strength() {
    local var_name=$1
    local var_value=${!var_name}
    local min_length=$2
    local description=$3
    
    if [ -z "$var_value" ]; then
        return 1  # Already handled by check_required_var
    fi
    
    if [ ${#var_value} -lt $min_length ]; then
        log_warning "$var_name is too short (${#var_value} chars, minimum $min_length) - $description"
        ((WARNINGS++))
        return 1
    fi
    
    # Check for common weak values
    case "$var_value" in
        *"password"*|*"secret"*|*"key"*|*"admin"*|*"test"*|*"dev"*|*"staging"*)
            log_warning "$var_name appears to contain weak/common terms - $description"
            ((WARNINGS++))
            return 1
            ;;
    esac
    
    log_success "$var_name has sufficient strength"
    return 0
}

check_file_exists() {
    local var_name=$1
    local file_path=${!var_name}
    local description=$2
    
    if [ -n "$file_path" ] && [ ! -f "$file_path" ]; then
        log_warning "File not found: $file_path ($var_name - $description)"
        ((WARNINGS++))
        return 1
    elif [ -n "$file_path" ]; then
        log_success "File exists: $file_path ($var_name)"
        return 0
    fi
    return 0
}

# Core Configuration
log_step "Checking Core Configuration"
check_required_var "NODE_ENV" "Runtime environment"
check_required_var "ATP_ENVIRONMENT" "ATP environment identifier"

# Database Configuration
log_step "Checking Database Configuration"
check_required_var "POSTGRES_DB" "PostgreSQL database name"
check_required_var "POSTGRES_USER" "PostgreSQL username"
check_required_var "POSTGRES_PASSWORD" "PostgreSQL password"
check_required_var "DATABASE_URL" "PostgreSQL connection URL"

check_secret_strength "POSTGRES_PASSWORD" 16 "Database password"

# Security & Encryption
log_step "Checking Security Configuration"
check_required_var "JWT_SECRET" "JWT signing secret"
check_required_var "AUDIT_ENCRYPTION_KEY" "Audit encryption key"
check_required_var "SERVICE_ENCRYPTION_KEY" "Service encryption key"
check_required_var "MASTER_ENCRYPTION_KEY" "Master encryption key"
check_required_var "SESSION_SECRET" "Session secret"

check_secret_strength "JWT_SECRET" 64 "JWT secret"
check_secret_strength "AUDIT_ENCRYPTION_KEY" 64 "Audit encryption key"
check_secret_strength "SERVICE_ENCRYPTION_KEY" 64 "Service encryption key"
check_secret_strength "MASTER_ENCRYPTION_KEY" 64 "Master encryption key"
check_secret_strength "SESSION_SECRET" 64 "Session secret"

# Certificate Authority
log_step "Checking Certificate Authority Configuration"
check_required_var "CA_PASSPHRASE" "CA private key passphrase"
check_secret_strength "CA_PASSPHRASE" 16 "CA passphrase"

check_file_exists "CA_PRIVATE_KEY_PATH" "CA private key file"
check_file_exists "CA_CERTIFICATE_PATH" "CA certificate file"

# TLS/SSL Configuration
log_step "Checking TLS/SSL Configuration"
if [ "$ENABLE_MTLS" = "true" ]; then
    check_file_exists "TLS_CERT_PATH" "TLS certificate file"
    check_file_exists "TLS_KEY_PATH" "TLS private key file"
    check_file_exists "TLS_CA_PATH" "TLS CA certificate file"
fi

# Service URLs
log_step "Checking Service Configuration"
check_required_var "IDENTITY_SERVICE_URL" "Identity service endpoint"
check_required_var "VC_SERVICE_URL" "VC service endpoint"
check_required_var "PERMISSION_SERVICE_URL" "Permission service endpoint"
check_required_var "RPC_GATEWAY_URL" "RPC Gateway endpoint"
check_required_var "AUDIT_SERVICE_URL" "Audit service endpoint"

# Infrastructure
log_step "Checking Infrastructure Configuration"
check_required_var "IPFS_API_URL" "IPFS API endpoint"
check_required_var "GRAFANA_ADMIN_PASSWORD" "Grafana admin password"

check_secret_strength "GRAFANA_ADMIN_PASSWORD" 12 "Grafana admin password"

# Security Policies
log_step "Checking Security Policies"
check_required_var "CORS_ORIGIN" "CORS allowed origins"

if [ "$NODE_ENV" = "production" ]; then
    # Production-specific checks
    log_step "Checking Production-Specific Configuration"
    
    if [[ "$CORS_ORIGIN" == *"localhost"* ]] || [[ "$CORS_ORIGIN" == *"127.0.0.1"* ]]; then
        log_warning "CORS_ORIGIN contains localhost in production environment"
        ((WARNINGS++))
    fi
    
    if [ "$DEBUG_MODE" = "true" ]; then
        log_warning "DEBUG_MODE is enabled in production"
        ((WARNINGS++))
    fi
    
    if [ "$ENABLE_SWAGGER" = "true" ]; then
        log_warning "Swagger is enabled in production (potential security risk)"
        ((WARNINGS++))
    fi
    
    if [ "$LOG_LEVEL" = "debug" ]; then
        log_warning "Debug logging enabled in production (may expose sensitive data)"
        ((WARNINGS++))
    fi
fi

# File permissions check
log_step "Checking File Permissions"
ENV_PERMS=$(stat -f "%A" "$ENV_FILE" 2>/dev/null || stat -c "%a" "$ENV_FILE" 2>/dev/null || echo "unknown")
if [ "$ENV_PERMS" != "600" ]; then
    log_warning "Environment file permissions: $ENV_PERMS (should be 600)"
    ((WARNINGS++))
else
    log_success "Environment file has secure permissions (600)"
fi

# Summary
echo ""
log_step "🏁 Validation Summary"
echo -e "${CYAN}=================================================${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    log_success "🎉 Environment validation passed with no issues!"
    echo -e "${GREEN}✨ Configuration is ready for deployment${NC}"
elif [ $ERRORS -eq 0 ]; then
    log_warning "⚠️  Environment validation passed with $WARNINGS warnings"
    echo -e "${YELLOW}🔧 Consider addressing warnings before deployment${NC}"
else
    log_error "❌ Environment validation failed with $ERRORS errors and $WARNINGS warnings"
    echo -e "${RED}🚫 Fix errors before deployment${NC}"
fi

echo ""
echo -e "${BOLD}📊 Validation Results:${NC}"
echo -e "• Errors: ${RED}$ERRORS${NC}"
echo -e "• Warnings: ${YELLOW}$WARNINGS${NC}"
echo -e "• Environment: ${CYAN}$NODE_ENV${NC}"
echo -e "• File: ${CYAN}$ENV_FILE${NC}"

if [ $ERRORS -gt 0 ]; then
    echo ""
    log_error "🔧 To fix errors:"
    echo -e "1. Regenerate secrets: ${CYAN}./scripts/generate-secrets.sh $ENV_FILE${NC}"
    echo -e "2. Update missing configuration values"
    echo -e "3. Generate SSL certificates if needed"
    exit 1
fi

if [ $WARNINGS -gt 0 ]; then
    echo ""
    log_warning "💡 To address warnings:"
    echo -e "1. Review security policies for production"
    echo -e "2. Generate stronger secrets if needed"
    echo -e "3. Verify file paths and permissions"
    exit 2
fi

echo ""
log_success "🚀 Environment is ready for ATP™ deployment!"
exit 0 