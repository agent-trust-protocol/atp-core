# Database Migration Guide: SQLite → PostgreSQL

This guide walks you through migrating the Agent Trust Protocol™ from SQLite to PostgreSQL for production-ready scalability and reliability.

## Overview

The ATP™ system supports both SQLite (for development) and PostgreSQL (for production). This migration process ensures:

- **Data Preservation**: All existing audit logs and data are migrated
- **Zero Downtime**: Rolling deployment strategy minimizes service interruption
- **Backward Compatibility**: Services can still fall back to SQLite if needed

## Prerequisites

1. **PostgreSQL Database**: Ensure PostgreSQL 15+ is running and accessible
2. **Environment Variables**: Configure proper DATABASE_URL
3. **Backup**: Create backups of existing SQLite databases

## Migration Steps

### 1. Prepare PostgreSQL Database

First, ensure your PostgreSQL database is initialized with the ATP™ schema:

```bash
# The init-db.sql script runs automatically when PostgreSQL starts
# Check database connection
psql ${DATABASE_URL} -c "SELECT schemaname FROM pg_catalog.pg_tables WHERE schemaname LIKE 'atp_%';"
```

### 2. Set Environment Variables

Update your `.env.production` file:

```bash
# PostgreSQL Configuration
DATABASE_URL=postgresql://atp_user:YOUR_SECURE_PASSWORD@postgres:5432/atp_production
POSTGRES_DB=atp_production
POSTGRES_USER=atp_user
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD

# Enable PostgreSQL for all services
USE_POSTGRES=true
NODE_ENV=production
```

### 3. Run Data Migration

Migrate existing SQLite data to PostgreSQL:

```bash
# Run migration for audit logs
cd packages/audit-logger
npm run migrate

# Or run migration script directly
DATABASE_URL="postgresql://..." tsx ../../scripts/migrate-sqlite-to-postgres.ts ./audit.db
```

### 4. Verify Migration

Check that data was migrated successfully:

```bash
# Connect to PostgreSQL
psql ${DATABASE_URL}

# Check migrated audit events
SELECT COUNT(*) FROM atp_audit.events;
SELECT * FROM atp_audit.events ORDER BY timestamp DESC LIMIT 5;

# Verify chain integrity
SELECT integrity_status FROM atp_audit.chain_state;
```

### 5. Deploy Updated Services

Deploy the updated services with PostgreSQL support:

```bash
# Stop current services
docker-compose down

# Pull latest changes and rebuild
git pull
docker-compose -f docker-compose.production.yml up --build -d

# Monitor service health
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs -f audit-logger
```

## Service-Specific Migration Details

### Audit Logger Service
- **SQLite File**: `packages/audit-logger/audit.db`
- **PostgreSQL Schema**: `atp_audit.events`
- **Migration Script**: `scripts/migrate-sqlite-to-postgres.ts`
- **Backward Compatibility**: Automatically detects DATABASE_URL and switches to PostgreSQL

### Identity Service
- **Already PostgreSQL**: Uses shared database module
- **Schema**: `atp_identity.agents`, `atp_identity.did_documents`
- **No Migration Needed**: Already configured for PostgreSQL

### Verifiable Credentials Service
- **Already PostgreSQL**: Uses shared database module
- **Schema**: `atp_credentials.credentials`, `atp_credentials.schemas`
- **No Migration Needed**: Already configured for PostgreSQL

### Permission Service
- **Updated**: Now uses PostgreSQL instead of SQLite
- **Schema**: `atp_permissions.policies`, `atp_permissions.grants`
- **Migration**: Handled by database initialization

## Rollback Strategy

If issues occur, you can rollback to SQLite:

```bash
# Remove DATABASE_URL from environment
unset DATABASE_URL
export USE_POSTGRES=false

# Restart services with SQLite
docker-compose -f docker-compose.yml up -d
```

## Performance Considerations

### PostgreSQL Optimizations

1. **Connection Pooling**: Services use connection pools (max 20 connections)
2. **Indexing**: Comprehensive indexes on frequently queried columns
3. **Partitioning**: Consider partitioning large audit tables by date
4. **Monitoring**: Use built-in PostgreSQL monitoring and Prometheus metrics

### Expected Performance Improvements

- **Concurrent Access**: PostgreSQL handles multiple concurrent writes better
- **Query Performance**: Advanced query optimization and indexing
- **Scalability**: Horizontal scaling capabilities
- **ACID Compliance**: Full transaction support with rollback capabilities

## Monitoring and Verification

### Health Checks

All services include health checks that verify database connectivity:

```bash
# Check service health
curl http://localhost:3005/health  # Audit Logger
curl http://localhost:3001/health  # Identity Service
curl http://localhost:3002/health  # VC Service
curl http://localhost:3003/health  # Permission Service
```

### Database Monitoring

Monitor PostgreSQL performance:

```bash
# Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

# Monitor query performance
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname LIKE 'atp_%' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Security Considerations

1. **Connection Security**: Use SSL/TLS for database connections in production
2. **Password Management**: Store database passwords in secure secret management
3. **Network Security**: Restrict PostgreSQL access to ATP™ services only
4. **Audit Trail**: PostgreSQL operations are logged for compliance

## Troubleshooting

### Common Issues

1. **Connection Failures**
   ```bash
   # Check PostgreSQL status
   docker-compose exec postgres pg_isready -U atp_user
   
   # Check service logs
   docker-compose logs postgres
   docker-compose logs audit-logger
   ```

2. **Migration Errors**
   ```bash
   # Verify SQLite database exists
   ls -la packages/audit-logger/audit.db
   
   # Check PostgreSQL schema
   psql ${DATABASE_URL} -c "\d atp_audit.events"
   ```

3. **Performance Issues**
   ```bash
   # Monitor PostgreSQL performance
   docker-compose exec postgres psql -U atp_user -d atp_production -c "SELECT * FROM pg_stat_activity;"
   ```

## Support

For migration assistance or troubleshooting:

1. Check service logs: `docker-compose logs [service-name]`
2. Verify database connectivity: Health check endpoints
3. Review PostgreSQL logs: `docker-compose logs postgres`
4. Consult ATP™ documentation for service-specific guidance

## Post-Migration Checklist

- [ ] All services start successfully
- [ ] Health checks pass for all services
- [ ] Audit chain integrity verified
- [ ] Performance monitoring active
- [ ] Backup strategy implemented
- [ ] SSL/TLS configured for production
- [ ] Access controls verified
- [ ] Documentation updated