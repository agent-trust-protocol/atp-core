#!/bin/bash

# Load environment variables from .env.development
set -a
source .env.development
set +a

# Construct DATABASE_URL
export DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"

# Additional environment variables
export CORS_ORIGIN="http://localhost:3000"
export SERVICE_ENCRYPTION_KEY="dev-service-encryption-key-32-chars"
export SESSION_SECRET="dev-session-secret-change-in-production"

echo "Environment loaded:"
echo "DATABASE_URL=$DATABASE_URL"
echo "NODE_ENV=$NODE_ENV"
echo "Services configured for development"