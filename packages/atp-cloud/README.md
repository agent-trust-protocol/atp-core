# ATP Cloud - Multi-tenant Agent Trust Protocol Platform

> ⚠️ **INTERNAL TESTING ONLY** - This is a development version not intended for production use.

ATP Cloud is a cloud-native, multi-tenant version of the Agent Trust Protocol services, designed to provide scalable identity, credentials, and permission management for multiple organizations.

## Architecture Overview

ATP Cloud consists of several key components:

### Core Services
- **Cloud Gateway** (Port 3010) - Central entry point for all tenant requests with authentication, rate limiting, and routing
- **Tenant Management Service** (Port 3011) - Handles tenant creation, billing, usage tracking, and API key management
- **Analytics Service** (Port 3012) - Provides usage analytics, performance metrics, and reporting
- **Cloud Dashboard** (Port 3013) - Web interface for managing cloud deployments

### ATP Core Services (Proxied)
- **Identity Service** (Port 3001) - Agent identity management
- **Credential Service** (Port 3002) - Verifiable credentials
- **Permission Service** (Port 3003) - Access control and policies  
- **Audit Logger** (Port 3006) - Security audit trails
- **Monitoring Service** (Port 3007) - System health monitoring

### Infrastructure
- **MongoDB** - Primary database for tenants, usage, and analytics
- **Redis** - Caching, rate limiting, and session storage
- **Docker** - Containerized deployment

## Features

### Multi-Tenancy
- Complete tenant isolation
- Per-tenant API keys and rate limiting
- Custom domain support
- Plan-based resource limits

### Billing & Usage
- Usage tracking and analytics
- Overage billing for requests, bandwidth, storage
- Stripe integration for payment processing
- Multiple subscription plans (Free, Starter, Professional, Enterprise)

### Security
- API key authentication
- JWT token management
- Rate limiting per tenant
- Request/response logging and audit trails

### Analytics & Reporting
- Real-time usage metrics
- Performance analytics
- Error tracking and alerting
- Custom report generation

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MongoDB (if running locally)
- Redis (if running locally)

### 1. Clone and Install

```bash
cd packages/atp-cloud
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Deploy with Docker

```bash
# Full deployment
./scripts/deploy-cloud.sh

# Check deployment status
./scripts/check-deployment.sh
```

### 4. Access Services

- **Cloud Dashboard**: http://localhost:3013
- **Cloud Gateway API**: http://localhost:3010/api
- **Tenant Management**: http://localhost:3011/api/v1
- **Analytics API**: http://localhost:3012/api/v1

## Development

### Running Individual Services

```bash
# Cloud Gateway
npm run dev:gateway

# Tenant Service  
npm run dev:tenant

# Analytics Service
npm run dev:analytics

# Dashboard
npm run dev:dashboard
```

### Building

```bash
# Build all services
npm run build

# Build specific components
npm run build:services
npm run build:dashboard
```

### Testing

```bash
# Run all tests
npm test

# Run service tests
npm run test:services

# Run dashboard tests
npm run test:dashboard
```

## API Documentation

### Cloud Gateway API

The Cloud Gateway provides a unified API for all ATP services with multi-tenant support.

**Base URL**: `http://localhost:3010/api/v1`

**Authentication**: Include API key in header:
```
X-API-Key: atp_your_api_key_here
```

#### Available Endpoints

- `/identity/*` - Identity service endpoints
- `/credentials/*` - Credential service endpoints  
- `/permissions/*` - Permission service endpoints
- `/audit/*` - Audit service endpoints
- `/monitoring/*` - Monitoring service endpoints

### Tenant Management API

**Base URL**: `http://localhost:3011/api/v1`

**Authentication**: JWT token required

#### Key Endpoints

```bash
# Create tenant
POST /tenants

# Get tenant
GET /tenants/{id}

# List tenants
GET /tenants?page=1&limit=20

# Generate API key
POST /tenants/{id}/api-keys

# Get usage data
GET /tenants/{id}/usage
```

### Analytics API

**Base URL**: `http://localhost:3012/api/v1`

#### For Tenants (API Key Auth)

```bash
# Current usage metrics
GET /analytics/usage/current

# Usage history
GET /analytics/usage/history?period=30d

# Performance metrics
GET /analytics/performance?period=7d
```

#### For Admins (JWT Auth)

```bash
# Platform overview
GET /admin/analytics/platform/overview

# Revenue analytics  
GET /admin/analytics/revenue?period=30d
```

## Configuration

### Environment Variables

Key environment variables for configuration:

```bash
# Core Configuration
NODE_ENV=development
MONGODB_URL=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-here

# Service URLs
ATP_IDENTITY_SERVICE_URL=http://localhost:3001
ATP_CREDENTIALS_SERVICE_URL=http://localhost:3002
# ... other services

# Billing (Optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Limits
DEFAULT_RATE_LIMIT_REQUESTS=1000
MAX_TENANTS=1000
```

### Tenant Plans

| Plan | Agents | Requests/Month | Storage | Bandwidth | Price |
|------|--------|----------------|---------|-----------|--------|
| Free | 5 | 1,000 | 100 MB | 1 GB | $0 |
| Starter | 25 | 10,000 | 1 GB | 10 GB | $29 |
| Professional | 100 | 100,000 | 10 GB | 100 GB | $99 |
| Enterprise | 1,000 | 1,000,000 | 100 GB | 1 TB | $499 |

## Monitoring & Observability

### Health Checks

All services expose `/health` endpoints:

```bash
curl http://localhost:3010/health  # Cloud Gateway
curl http://localhost:3011/health  # Tenant Service
curl http://localhost:3012/health  # Analytics Service
```

### Logging

Structured JSON logging with tenant context:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "service": "cloud-gateway",
  "tenantId": "tenant_123",
  "message": "Request processed",
  "responseTime": 45,
  "statusCode": 200
}
```

### Metrics

Key metrics tracked:
- Request count and latency per tenant
- Error rates and types
- Resource usage (CPU, memory, storage)
- Billing and usage metrics

## Docker Deployment

### Docker Compose

The included `docker-compose.yml` sets up the full stack:

```bash
# Start all services
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down
```

### Individual Containers

```bash
# Build specific service
docker build -f docker/services/Dockerfile.cloud-gateway .

# Run with environment
docker run -e NODE_ENV=development -p 3010:3010 atp-cloud-gateway
```

## Security Considerations

### API Key Management
- API keys are generated with secure randomness
- Keys include tenant prefix and expiration support
- Rate limiting applied per key

### Data Isolation
- Tenant data is strictly isolated in database queries
- All database operations include tenant filtering
- No cross-tenant data access possible

### Authentication Flow
1. Client provides API key in request header
2. Cloud Gateway validates key and extracts tenant info
3. Tenant context added to all downstream requests
4. Usage tracked and rate limits applied

## Troubleshooting

### Common Issues

**Services not starting**
```bash
# Check Docker status
docker-compose -f docker/docker-compose.yml ps

# View service logs  
docker-compose -f docker/docker-compose.yml logs [service-name]
```

**Database connection issues**
```bash
# Check MongoDB
docker exec -it atp-cloud-mongodb-1 mongosh

# Check Redis
docker exec -it atp-cloud-redis-1 redis-cli ping
```

**API authentication errors**
```bash
# Verify API key format
echo "API Key should start with: atp_"

# Check tenant status in database
mongosh atp_cloud --eval "db.tenants.find({status: 'active'})"
```

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=debug
npm run dev:gateway
```

## Contributing

This is an internal testing version. For the production-ready version, please refer to the main ATP repository.

### Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Run tests: `npm test`
5. Start development servers: `npm run dev`

### Code Standards

- TypeScript for all services
- ESLint + Prettier for formatting
- Comprehensive error handling
- Structured logging throughout
- API input validation with Zod schemas

## License

This internal testing version is proprietary. The production version will be released under an appropriate open-source license.

## Support

For internal testing support, please contact the ATP development team.

---

**⚠️ INTERNAL TESTING ONLY - NOT FOR PRODUCTION USE**

This version includes development features, debug logging, and simplified security measures not suitable for production environments.