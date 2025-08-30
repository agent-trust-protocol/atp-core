#!/bin/bash

# Agent Trust Protocol™ - Secret Generation Script
# This script generates secure secrets for production deployment

set -euo pipefail

echo "🔐 Agent Trust Protocol - Secret Generation"
echo "==========================================="
echo ""

# Function to generate a secure random secret
generate_secret() {
    openssl rand -base64 32 | tr -d '\n'
}

# Function to generate hex key
generate_hex_key() {
    openssl rand -hex 32
}

# Check if .env.production exists
if [ ! -f ".env.production.example" ]; then
    echo "❌ Error: .env.production.example not found"
    echo "Please ensure you're running this from the project root"
    exit 1
fi

# Generate secrets
echo "Generating secure secrets..."
echo ""

# Database
DB_PASSWORD=$(generate_secret)
echo "✅ Generated DB_PASSWORD"

# Redis
REDIS_PASSWORD=$(generate_secret)
echo "✅ Generated REDIS_PASSWORD"

# Grafana
GRAFANA_PASSWORD=$(generate_secret)
echo "✅ Generated GRAFANA_PASSWORD"

# JWT
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "✅ Generated JWT_SECRET"

# Webhook
WEBHOOK_SECRET=$(generate_secret)
echo "✅ Generated WEBHOOK_SECRET"

# Encryption keys for private key storage
ATP_ENCRYPTION_KEY=$(generate_hex_key)
ATP_ENCRYPTION_IV=$(openssl rand -hex 16)
echo "✅ Generated encryption keys"

# Create secrets file
SECRETS_FILE=".env.secrets"
cat > "$SECRETS_FILE" << EOF
# Auto-generated secrets - $(date)
# ⚠️  NEVER commit this file to version control
# Use these values to configure your production environment

export DB_PASSWORD="$DB_PASSWORD"
export REDIS_PASSWORD="$REDIS_PASSWORD"
export GRAFANA_PASSWORD="$GRAFANA_PASSWORD"
export JWT_SECRET="$JWT_SECRET"
export WEBHOOK_SECRET="$WEBHOOK_SECRET"
export ATP_ENCRYPTION_KEY="$ATP_ENCRYPTION_KEY"
export ATP_ENCRYPTION_IV="$ATP_ENCRYPTION_IV"

# Additional configuration
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_NAME="atp_production"
export REDIS_HOST="redis"
export REDIS_PORT="6379"
EOF

echo ""
echo "✅ Secrets generated and saved to $SECRETS_FILE"
echo ""
echo "📝 Next steps:"
echo "1. Review the generated secrets in $SECRETS_FILE"
echo "2. Store these secrets in your secret management system"
echo "3. Source the secrets file when running locally: source $SECRETS_FILE"
echo "4. For production, inject these as environment variables"
echo ""
echo "⚠️  Security reminders:"
echo "- Never commit $SECRETS_FILE to version control"
echo "- Use a proper secret management system in production"
echo "- Rotate secrets regularly"
echo "- Use different secrets for each environment"

# Add to .gitignore if not already present
if ! grep -q "^\.env\.secrets$" .gitignore 2>/dev/null; then
    echo ".env.secrets" >> .gitignore
    echo "✅ Added $SECRETS_FILE to .gitignore"
fi