# ATP Production Deployment with Modern UI

## 🚀 Complete Production Deployment Guide

This guide covers deploying the Agent Trust Protocol with the new modern UI to production.

## 📋 Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available
- 20GB disk space
- SSL certificates (for production)
- Domain name configured (optional)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Modern UI     │    │   ATP Services  │
│   (Nginx)       │◄──►│   (Next.js)     │◄──►│   (Microservices)│
│   Port 80/443   │    │   Port 3000     │    │   Ports 3001-8  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Monitoring    │    │   Database      │    │   Cache         │
│   (Prometheus/  │    │   (PostgreSQL)  │    │   (Redis)       │
│    Grafana)     │    │   Port 5432     │    │   Port 6379     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Features Included

### ✅ Modern UI Features
- **Enterprise Dashboard**: Real-time metrics and monitoring
- **Visual Policy Editor**: Drag-and-drop policy creation
- **Policy Management**: Complete policy lifecycle management
- **Advanced Analytics**: Performance monitoring and insights
- **Responsive Design**: Mobile-optimized interface

### ✅ ATP Core Services
- **Gateway Service**: API routing and authentication
- **Identity Service**: Agent identity management
- **Permission Service**: Access control and policies
- **VC Service**: Verifiable credentials
- **Audit Logger**: Comprehensive audit trails
- **Quantum Service**: Quantum-safe cryptography

### ✅ Infrastructure
- **Load Balancing**: Nginx with SSL termination
- **Database**: PostgreSQL with persistence
- **Caching**: Redis for performance
- **Monitoring**: Prometheus + Grafana
- **Security**: Rate limiting and security headers

## 🚀 Quick Start Deployment

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd agent-trust-protocol-1

# Set environment variables
export JWT_SECRET="your-super-secret-jwt-key-change-in-production"
export NODE_ENV=production
```

### 2. Generate SSL Certificates (Development)

```bash
# Generate self-signed certificates for development
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### 3. Deploy Production Stack

```bash
# Run the production deployment script
./scripts/deploy-production-modern.sh
```

### 4. Verify Deployment

```bash
# Check service status
docker-compose -f docker-compose.production.modern.yml ps

# View logs
docker-compose -f docker-compose.production.modern.yml logs -f
```

## 🌐 Access Points

After successful deployment, access the system at:

| Service | URL | Description |
|---------|-----|-------------|
| **Modern UI** | https://localhost | Main application interface |
| **Policy Editor** | https://localhost/policy-editor | Visual policy creation |
| **Dashboard** | https://localhost/dashboard | Enterprise monitoring |
| **Policy Management** | https://localhost/policies | Policy administration |
| **Grafana** | http://localhost:3006 | Monitoring dashboard (admin/admin) |
| **Prometheus** | http://localhost:9090 | Metrics collection |

## 🔧 Configuration

### Environment Variables

Create a `.env` file for production:

```bash
# Core Configuration
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Database
DATABASE_URL=postgresql://atp_user:atp_password@postgres:5432/atp_production

# Redis
REDIS_URL=redis://redis:6379

# Quantum Service
QUANTUM_ENABLED=true
DILITHIUM_LEVEL=3

# UI Configuration
ATP_API_URL=https://your-domain.com/api
ATP_QUANTUM_URL=https://your-domain.com/quantum
```

### SSL Configuration (Production)

For production, replace the self-signed certificates:

```bash
# Copy your SSL certificates
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem

# Restart nginx
docker-compose -f docker-compose.production.modern.yml restart nginx
```

## 📊 Monitoring and Maintenance

### Health Checks

```bash
# Check all services
curl -f https://localhost/health

# Check individual services
curl -f http://localhost:3001/health  # Gateway
curl -f http://localhost:3008/health  # Quantum
```

### Logs and Debugging

```bash
# View all logs
docker-compose -f docker-compose.production.modern.yml logs -f

# View specific service logs
docker-compose -f docker-compose.production.modern.yml logs -f atp-ui-modern
docker-compose -f docker-compose.production.modern.yml logs -f atp-gateway

# Access service containers
docker-compose -f docker-compose.production.modern.yml exec atp-ui-modern sh
```

### Backup and Recovery

```bash
# Backup database
docker-compose -f docker-compose.production.modern.yml exec postgres \
  pg_dump -U atp_user atp_production > backup.sql

# Restore database
docker-compose -f docker-compose.production.modern.yml exec -T postgres \
  psql -U atp_user atp_production < backup.sql
```

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Change default JWT secret
- [ ] Use proper SSL certificates
- [ ] Configure firewall rules
- [ ] Set up proper DNS
- [ ] Enable rate limiting
- [ ] Configure backup strategy
- [ ] Set up monitoring alerts
- [ ] Review security headers

### Security Headers

The nginx configuration includes:
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

## 📈 Performance Optimization

### Caching Strategy

- **Static Assets**: 1-year cache with immutable headers
- **API Responses**: Redis caching for frequently accessed data
- **Database**: Connection pooling and query optimization

### Scaling Considerations

- **Horizontal Scaling**: Add more service instances
- **Load Balancing**: Nginx handles traffic distribution
- **Database**: Consider read replicas for high traffic
- **Monitoring**: Prometheus + Grafana for performance tracking

## 🛠️ Troubleshooting

### Common Issues

1. **Services not starting**
   ```bash
   # Check resource usage
   docker system df
   docker stats
   
   # Check logs
   docker-compose -f docker-compose.production.modern.yml logs
   ```

2. **Database connection issues**
   ```bash
   # Check PostgreSQL
   docker-compose -f docker-compose.production.modern.yml exec postgres pg_isready
   
   # Check Redis
   docker-compose -f docker-compose.production.modern.yml exec redis redis-cli ping
   ```

3. **UI not loading**
   ```bash
   # Check UI service
   curl -f http://localhost:3000
   
   # Check nginx
   docker-compose -f docker-compose.production.modern.yml logs nginx
   ```

### Performance Issues

```bash
# Monitor resource usage
docker stats

# Check service health
curl -f https://localhost/health

# View Grafana dashboards
# Access http://localhost:3006 (admin/admin)
```

## 🔄 Updates and Maintenance

### Updating Services

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.production.modern.yml down
docker-compose -f docker-compose.production.modern.yml build
docker-compose -f docker-compose.production.modern.yml up -d
```

### Rolling Updates

```bash
# Update individual services
docker-compose -f docker-compose.production.modern.yml build atp-ui-modern
docker-compose -f docker-compose.production.modern.yml up -d atp-ui-modern
```

## 📞 Support

For issues and support:
- Check logs: `docker-compose -f docker-compose.production.modern.yml logs`
- Review this documentation
- Check the troubleshooting section
- Monitor Grafana dashboards for system health

## 🎉 Success!

Your ATP system with modern UI is now deployed and ready for production use!

**Key Features Available:**
- ✅ Modern, responsive UI
- ✅ Visual Policy Editor
- ✅ Enterprise Dashboard
- ✅ Real-time monitoring
- ✅ Quantum-safe cryptography
- ✅ Complete audit trails
- ✅ Production-ready infrastructure 