# 🛡️ Agent Trust Protocol™ - Troubleshooting Guide

## Overview

This comprehensive troubleshooting guide helps enterprise administrators diagnose and resolve common issues with Agent Trust Protocol™ deployments. Designed for Fortune 500 IT teams, this guide provides step-by-step solutions for production environments.

**Support Levels:**
- 🟢 **Self-Service**: Common issues with documented solutions
- 🟡 **Professional Support**: Complex issues requiring expert assistance
- 🔴 **Enterprise Support**: Critical issues with 4-hour SLA

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Connection Issues](#connection-issues)
3. [Authentication Problems](#authentication-problems)
4. [Performance Issues](#performance-issues)
5. [Security Alerts](#security-alerts)
6. [Docker Deployment Issues](#docker-deployment-issues)
7. [Database Problems](#database-problems)
8. [Network Configuration](#network-configuration)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Emergency Procedures](#emergency-procedures)

---

## Quick Diagnostics

### Health Check Commands

**Basic Health Check:**
```bash
# Check ATP server status
curl -f http://localhost:3008/health

# Expected response:
{
  "status": "healthy",
  "service": "ATP Quantum-Safe MCP Server",
  "version": "1.0.0",
  "timestamp": "2025-07-05T15:48:34.516Z",
  "connections": 42,
  "quantumSafe": true
}
```

**Comprehensive System Check:**
```bash
#!/bin/bash
# ATP System Health Check Script

echo "🛡️ ATP System Health Check"
echo "=========================="

# Check ATP Server
echo "1. ATP Server Status:"
if curl -f http://localhost:3008/health >/dev/null 2>&1; then
    echo "   ✅ ATP Server: HEALTHY"
else
    echo "   ❌ ATP Server: DOWN"
fi

# Check Database
echo "2. Database Status:"
if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "   ✅ PostgreSQL: HEALTHY"
else
    echo "   ❌ PostgreSQL: DOWN"
fi

# Check Redis
echo "3. Redis Status:"
if redis-cli ping >/dev/null 2>&1; then
    echo "   ✅ Redis: HEALTHY"
else
    echo "   ❌ Redis: DOWN"
fi

# Check Docker Services
echo "4. Docker Services:"
docker-compose ps | grep -E "(Up|healthy)" && echo "   ✅ Docker Services: HEALTHY" || echo "   ❌ Docker Services: ISSUES"

# Check Disk Space
echo "5. Disk Space:"
df -h / | awk 'NR==2 {if ($5+0 < 80) print "   ✅ Disk Space: OK ("$5" used)"; else print "   ⚠️ Disk Space: WARNING ("$5" used)"}'

# Check Memory
echo "6. Memory Usage:"
free -h | awk 'NR==2 {if ($3/$2*100 < 80) print "   ✅ Memory: OK ("int($3/$2*100)"% used)"; else print "   ⚠️ Memory: HIGH ("int($3/$2*100)"% used)"}'

echo "=========================="
echo "Health check complete!"
```

### Log Analysis Commands

**View Recent Logs:**
```bash
# ATP Server logs
docker-compose logs --tail=100 quantum-safe-server

# All services logs
docker-compose logs --tail=50

# Filter for errors
docker-compose logs | grep -i error

# Real-time monitoring
docker-compose logs -f quantum-safe-server
```

---

## Connection Issues

### Problem: Cannot Connect to ATP Server

**Symptoms:**
- Connection refused errors
- Timeout when connecting to port 3008
- WebSocket connection failures

**Diagnostic Steps:**

1. **Check if server is running:**
```bash
# Check process
ps aux | grep quantum-safe-server

# Check port binding
netstat -tlnp | grep 3008
# or
lsof -i :3008
```

2. **Verify Docker container status:**
```bash
docker-compose ps quantum-safe-server
docker-compose logs quantum-safe-server
```

3. **Test network connectivity:**
```bash
# Local connection test
telnet localhost 3008

# Network connectivity test
curl -v http://localhost:3008/health
```

**Solutions:**

**Solution 1: Restart Services**
```bash
# Restart ATP server only
docker-compose restart quantum-safe-server

# Restart all services
docker-compose down && docker-compose up -d

# Check status
docker-compose ps
```

**Solution 2: Check Configuration**
```bash
# Verify environment variables
docker-compose config

# Check port conflicts
sudo netstat -tlnp | grep 3008
```

**Solution 3: Firewall Issues**
```bash
# Check firewall rules (Ubuntu/CentOS)
sudo ufw status
sudo iptables -L

# Allow ATP port
sudo ufw allow 3008/tcp
```

### Problem: WebSocket Connection Drops

**Symptoms:**
- Frequent disconnections
- Connection timeouts
- Intermittent connectivity

**Diagnostic Steps:**
```bash
# Check connection stability
while true; do
  curl -f http://localhost:3008/health || echo "Connection failed at $(date)"
  sleep 5
done

# Monitor WebSocket connections
ss -tuln | grep 3008
```

**Solutions:**

**Solution 1: Increase Timeouts**
```yaml
# docker-compose.yml
environment:
  - ATP_WEBSOCKET_TIMEOUT=60000
  - ATP_KEEPALIVE_INTERVAL=30000
```

**Solution 2: Load Balancer Configuration**
```nginx
# nginx.conf
upstream atp_backend {
    server localhost:3008;
    keepalive 32;
}

location /ws {
    proxy_pass http://atp_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
}
```

---

## Authentication Problems

### Problem: Quantum-Safe Signature Verification Failed

**Symptoms:**
- "SIGNATURE_INVALID" errors
- Authentication failures
- Trust level downgrades

**Diagnostic Steps:**

1. **Verify signature components:**
```bash
# Check if both Ed25519 and Dilithium signatures are present
echo "Signature: $ATP_SIGNATURE" | base64 -d | hexdump -C
```

2. **Test signature generation:**
```javascript
// Test signature generation
const testMessage = "test-message";
const signature = await generateHybridSignature(testMessage, privateKeys);
console.log("Generated signature:", signature);
```

**Solutions:**

**Solution 1: Key Regeneration**
```bash
# Generate new key pairs
openssl genpkey -algorithm Ed25519 -out ed25519-private.pem
openssl pkey -in ed25519-private.pem -pubout -out ed25519-public.pem

# Generate Dilithium keys (using custom tool)
./generate-dilithium-keys.sh
```

**Solution 2: Clock Synchronization**
```bash
# Sync system clock
sudo ntpdate -s time.nist.gov

# Check time drift
timedatectl status
```

**Solution 3: Signature Format Validation**
```python
# Validate signature format
def validate_signature_format(signature):
    try:
        decoded = base64.b64decode(signature)
        if len(decoded) < 64:  # Minimum for Ed25519
            return False, "Signature too short"
        
        ed25519_sig = decoded[:64]
        dilithium_sig = decoded[64:]
        
        if len(dilithium_sig) == 0:
            return False, "Missing Dilithium signature"
            
        return True, "Valid format"
    except Exception as e:
        return False, f"Invalid base64: {e}"
```

### Problem: Trust Level Issues

**Symptoms:**
- Insufficient trust level errors
- Cannot access required tools
- Trust level downgrades

**Diagnostic Steps:**
```bash
# Check current trust level
curl -H "Authorization: Bearer $JWT_TOKEN" \
     http://localhost:3008/api/trust/current

# Review trust evaluation logs
docker-compose logs quantum-safe-server | grep "trust_evaluation"
```

**Solutions:**

**Solution 1: Trust Level Upgrade Request**
```bash
# Request trust level upgrade
curl -X POST http://localhost:3008/api/trust/upgrade \
  -H "Content-Type: application/json" \
  -d '{
    "requestedLevel": "verified",
    "justification": "Enterprise agent requiring extended access",
    "credentials": {
      "certificate": "base64-cert",
      "attestation": "base64-attestation"
    }
  }'
```

**Solution 2: Behavioral Score Improvement**
```javascript
// Improve behavioral score through consistent good behavior
const improveTrustScore = async () => {
  // Make regular, legitimate requests
  for (let i = 0; i < 10; i++) {
    await client.callTool('weather_info', { location: 'San Francisco' });
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
  }
};
```

---

## Performance Issues

### Problem: High Latency

**Symptoms:**
- Slow response times (>1000ms)
- Tool execution timeouts
- Poor user experience

**Diagnostic Steps:**

1. **Measure response times:**
```bash
# Test API response time
time curl http://localhost:3008/health

# Detailed timing
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3008/health

# curl-format.txt content:
#     time_namelookup:  %{time_namelookup}\n
#        time_connect:  %{time_connect}\n
#     time_appconnect:  %{time_appconnect}\n
#    time_pretransfer:  %{time_pretransfer}\n
#       time_redirect:  %{time_redirect}\n
#  time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#          time_total:  %{time_total}\n
```

2. **Monitor resource usage:**
```bash
# CPU and memory usage
docker stats quantum-safe-server

# Detailed system monitoring
top -p $(pgrep -f quantum-safe-server)
```

**Solutions:**

**Solution 1: Resource Scaling**
```yaml
# docker-compose.yml - Increase resources
services:
  quantum-safe-server:
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 4G
        reservations:
          cpus: '2.0'
          memory: 2G
```

**Solution 2: Database Optimization**
```sql
-- Optimize database queries
CREATE INDEX CONCURRENTLY idx_agent_did ON connections(agent_did);
CREATE INDEX CONCURRENTLY idx_timestamp ON audit_logs(timestamp);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM connections WHERE agent_did = 'did:atp:agent-123';
```

**Solution 3: Caching Implementation**
```javascript
// Implement Redis caching
const redis = require('redis');
const client = redis.createClient();

const cacheResult = async (key, data, ttl = 300) => {
  await client.setex(key, ttl, JSON.stringify(data));
};

const getCachedResult = async (key) => {
  const cached = await client.get(key);
  return cached ? JSON.parse(cached) : null;
};
```

### Problem: High Memory Usage

**Symptoms:**
- Memory usage >80%
- Out of memory errors
- Container restarts

**Diagnostic Steps:**
```bash
# Check memory usage
free -h
docker stats --no-stream

# Analyze memory leaks
node --inspect quantum-safe-server-improved.js
# Then use Chrome DevTools for memory profiling
```

**Solutions:**

**Solution 1: Memory Limits**
```yaml
# docker-compose.yml
services:
  quantum-safe-server:
    deploy:
      resources:
        limits:
          memory: 2G
    environment:
      - NODE_OPTIONS="--max-old-space-size=1536"
```

**Solution 2: Garbage Collection Tuning**
```bash
# Environment variables for Node.js
export NODE_OPTIONS="--max-old-space-size=1536 --gc-interval=100"
```

---

## Security Alerts

### Problem: Quantum Threat Detection

**Symptoms:**
- "QUANTUM_THREAT_DETECTED" alerts
- Automatic quantum-safe mode activation
- Security incident notifications

**Immediate Response:**
```bash
# 1. Verify quantum-safe mode is active
curl http://localhost:3008/api/security/status

# 2. Check recent security events
docker-compose logs quantum-safe-server | grep -i quantum

# 3. Audit recent connections
psql -d atp_production -c "
  SELECT agent_did, timestamp, quantum_safe_verified 
  FROM connections 
  WHERE timestamp > NOW() - INTERVAL '1 hour'
  ORDER BY timestamp DESC;
"
```

**Investigation Steps:**
```bash
# Analyze threat indicators
grep "quantum_threat" /var/log/atp/security.log

# Check signature verification failures
grep "signature_verification_failed" /var/log/atp/audit.log

# Review network traffic
tcpdump -i any -w quantum-threat-$(date +%Y%m%d-%H%M%S).pcap port 3008
```

### Problem: Suspicious Agent Behavior

**Symptoms:**
- Anomaly detection alerts
- Trust level downgrades
- Rate limiting triggers

**Investigation Queries:**
```sql
-- Check for unusual patterns
SELECT 
  agent_did,
  COUNT(*) as request_count,
  COUNT(DISTINCT tool_name) as unique_tools,
  MIN(timestamp) as first_request,
  MAX(timestamp) as last_request
FROM tool_usage_logs 
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY agent_did
HAVING COUNT(*) > 100
ORDER BY request_count DESC;

-- Analyze failed authentications
SELECT 
  agent_did,
  source_ip,
  COUNT(*) as failed_attempts,
  MAX(timestamp) as last_attempt
FROM failed_authentications
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY agent_did, source_ip
HAVING COUNT(*) > 5;
```

---

## Docker Deployment Issues

### Problem: Container Won't Start

**Symptoms:**
- Container exits immediately
- "Exited (1)" status
- Service unavailable

**Diagnostic Steps:**
```bash
# Check container logs
docker-compose logs quantum-safe-server

# Inspect container configuration
docker-compose config

# Check for port conflicts
netstat -tlnp | grep 3008

# Verify image build
docker images | grep atp
```

**Solutions:**

**Solution 1: Rebuild Container**
```bash
# Clean rebuild
docker-compose down
docker-compose build --no-cache quantum-safe-server
docker-compose up -d quantum-safe-server
```

**Solution 2: Check Dependencies**
```bash
# Verify all dependencies are available
docker-compose up postgres redis
# Wait for databases to be ready
docker-compose up quantum-safe-server
```

**Solution 3: Environment Variables**
```bash
# Check required environment variables
docker-compose exec quantum-safe-server env | grep ATP_

# Validate configuration
docker-compose exec quantum-safe-server node -e "
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('ATP_PORT:', process.env.ATP_PORT);
  console.log('ATP_QUANTUM_SAFE:', process.env.ATP_QUANTUM_SAFE);
"
```

### Problem: Docker Compose Issues

**Symptoms:**
- Services won't start together
- Network connectivity issues
- Volume mount problems

**Solutions:**

**Solution 1: Network Issues**
```bash
# Recreate network
docker network rm atp-network
docker network create atp-network

# Restart with network recreation
docker-compose down
docker-compose up -d
```

**Solution 2: Volume Issues**
```bash
# Check volume mounts
docker volume ls | grep atp

# Recreate volumes if needed
docker-compose down -v
docker-compose up -d
```

---

## Database Problems

### Problem: PostgreSQL Connection Issues

**Symptoms:**
- "Connection refused" errors
- Database timeout errors
- Authentication failures

**Diagnostic Steps:**
```bash
# Test database connection
pg_isready -h localhost -p 5432

# Check database logs
docker-compose logs postgres

# Test authentication
psql -h localhost -U atp_user -d atp_production -c "SELECT version();"
```

**Solutions:**

**Solution 1: Connection Pool Issues**
```javascript
// Adjust connection pool settings
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'atp_production',
  user: 'atp_user',
  password: process.env.DB_PASSWORD,
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Solution 2: Database Maintenance**
```sql
-- Analyze database performance
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del 
FROM pg_stat_user_tables 
ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;

-- Vacuum and analyze
VACUUM ANALYZE;

-- Reindex if needed
REINDEX DATABASE atp_production;
```

---

## Network Configuration

### Problem: Firewall Blocking Connections

**Symptoms:**
- External connections fail
- Internal services can't communicate
- Timeout errors

**Solutions:**

**Ubuntu/Debian:**
```bash
# Check firewall status
sudo ufw status

# Allow ATP ports
sudo ufw allow 3008/tcp
sudo ufw allow 5432/tcp  # PostgreSQL
sudo ufw allow 6379/tcp  # Redis

# Allow from specific networks
sudo ufw allow from 10.0.0.0/8 to any port 3008
```

**CentOS/RHEL:**
```bash
# Check firewall
sudo firewall-cmd --list-all

# Add ATP ports
sudo firewall-cmd --permanent --add-port=3008/tcp
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --permanent --add-port=6379/tcp
sudo firewall-cmd --reload
```

### Problem: Load Balancer Configuration

**Nginx Configuration:**
```nginx
upstream atp_backend {
    least_conn;
    server atp-server-1:3008 max_fails=3 fail_timeout=30s;
    server atp-server-2:3008 max_fails=3 fail_timeout=30s;
    server atp-server-3:3008 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name api.atp.dev;

    # SSL configuration
    ssl_certificate /etc/ssl/certs/atp.crt;
    ssl_certificate_key /etc/ssl/private/atp.key;
    ssl_protocols TLSv1.3;

    # WebSocket support
    location / {
        proxy_pass http://atp_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://atp_backend/health;
        access_log off;
    }
}
```

---

## Monitoring and Logging

### Problem: Missing Logs

**Symptoms:**
- No log output
- Empty log files
- Missing audit trails

**Solutions:**

**Solution 1: Log Configuration**
```javascript
// Ensure proper logging setup
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.ATP_LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: '/app/logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: '/app/logs/combined.log' }),
    new winston.transports.Console()
  ]
});
```

**Solution 2: Docker Logging**
```yaml
# docker-compose.yml
services:
  quantum-safe-server:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"
```

### Problem: High Log Volume

**Solutions:**

**Log Rotation:**
```bash
# Configure logrotate
cat > /etc/logrotate.d/atp << EOF
/app/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 atp atp
    postrotate
        docker-compose restart quantum-safe-server
    endscript
}
EOF
```

**Log Filtering:**
```javascript
// Filter sensitive information
const sanitizeLog = (data) => {
  const sanitized = { ...data };
  if (sanitized.signature) sanitized.signature = '[REDACTED]';
  if (sanitized.privateKey) sanitized.privateKey = '[REDACTED]';
  return sanitized;
};
```

---

## Emergency Procedures

### Critical Security Incident Response

**Immediate Actions (First 15 minutes):**
```bash
# 1. Activate incident response
echo "SECURITY INCIDENT DETECTED" | wall

# 2. Enable quantum-safe only mode
curl -X POST http://localhost:3008/api/security/quantum-safe-only

# 3. Block suspicious agents
curl -X POST http://localhost:3008/api/security/block-agent \
  -d '{"agent_did": "suspicious-agent-did"}'

# 4. Capture forensic evidence
docker-compose logs > incident-logs-$(date +%Y%m%d-%H%M%S).log
netstat -tuln > network-state-$(date +%Y%m%d-%H%M%S).log
```

**Investigation Phase (First hour):**
```bash
# Analyze recent connections
psql -d atp_production -c "
  SELECT * FROM connections 
  WHERE timestamp > NOW() - INTERVAL '2 hours'
  ORDER BY timestamp DESC;
" > recent-connections.csv

# Check for anomalies
grep -i "anomaly\|threat\|violation" /var/log/atp/*.log > security-events.log

# Network traffic analysis
tcpdump -r captured-traffic.pcap -nn | grep -E "(3008|suspicious-ip)"
```

### Service Recovery Procedures

**Complete Service Restart:**
```bash
#!/bin/bash
# Emergency service restart procedure

echo "🚨 Emergency ATP Service Restart"
echo "================================"

# 1. Graceful shutdown
echo "1. Stopping services gracefully..."
docker-compose down --timeout 30

# 2. Backup current state
echo "2. Creating backup..."
mkdir -p /backup/emergency-$(date +%Y%m%d-%H%M%S)
cp -r /var/lib/docker/volumes/atp_* /backup/emergency-$(date +%Y%m%d-%H%M%S)/

# 3. Clean restart
echo "3. Starting services..."
docker-compose up -d

# 4. Verify health
echo "4. Verifying service health..."
sleep 30
curl -f http://localhost:3008/health || echo "❌ Health check failed"

# 5. Notify stakeholders
echo "5. Service restart complete at $(date)"
```

### Data Recovery Procedures

**Database Recovery:**
```bash
# Restore from backup
pg_restore -h localhost -U atp_user -d atp_production /backup/atp-backup-latest.sql

# Verify data integrity
psql -d atp_production -c "
  SELECT 
    COUNT(*) as total_connections,
    COUNT(DISTINCT agent_did) as unique_agents,
    MAX(timestamp) as latest_activity
  FROM connections;
"
```

---

## Support Escalation

### When to Escalate

**Immediate Escalation (Critical):**
- Security breaches or quantum threats
- Complete service outages
- Data corruption or loss
- Compliance violations

**Professional Support (High):**
- Performance degradation >50%
- Authentication system failures
- Integration issues
- Configuration problems

**Standard Support (Medium/Low):**
- Feature questions
- Best practice guidance
- Non-critical bugs
- Documentation clarification

### Escalation Contacts

**Enterprise Support:**
- **Email**: enterprise-support@atp.dev
- **Phone**: +1-800-ATP-HELP
- **Portal**: https://support.atp.dev
- **Slack**: #atp-enterprise-support

**Security Incidents:**
- **Email**: security-incident@atp.dev
- **Phone**: +1-800-ATP-SEC1
- **PagerDuty**: ATP Security Team

### Information to Provide

**For All Issues:**
- ATP version and deployment method
- Operating system and Docker version
- Error messages and logs
- Steps to reproduce
- Business impact assessment

**For Security Issues:**
- Timeline of events
- Affected systems and data
- Current containment measures
- Regulatory requirements

---

## Conclusion

This troubleshooting guide provides comprehensive solutions for common ATP deployment issues. For complex problems or security incidents, don't hesitate to contact our enterprise support team.

**Remember:**
- Always backup before making changes
- Test solutions in staging first
- Document all changes made
- Follow security protocols

**🛡️ Keeping Your Quantum-Safe AI Agent Protocol Running Smoothly**

---

**Document Version:** 1.0.0  
**Last Updated:** July 5, 2025  
**Next Review:** October 5, 2025  
**Contact:** support@atp.dev