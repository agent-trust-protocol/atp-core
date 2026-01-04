# 🌐 ATP Domain Deployment Guide

## Domain Architecture

### 🎯 **agenttrustprotocol.com** - Main Application
- **Purpose**: Primary public-facing ATP website and application
- **Audience**: End users, enterprises, general public
- **Features**: Full ATP platform, demos, marketing content

### 🛠️ **agenttrust.dev** - Developer Portal  
- **Purpose**: Developer-focused resources and tools
- **Audience**: Developers, integrators, technical users
- **Features**: API docs, SDKs, developer tools, technical guides

## Deployment Configuration

### Environment Variables for Production

```bash
# Copy to your production environment
cp .env.production.domains .env.production

# Key variables to set:
NEXT_PUBLIC_APP_DOMAIN=https://agenttrustprotocol.com
NEXT_PUBLIC_DEV_DOMAIN=https://agenttrust.dev
CORS_ORIGIN=https://agenttrustprotocol.com,https://agenttrust.dev,https://www.agenttrustprotocol.com,https://www.agenttrust.dev
```

### Docker Deployment

```bash
# Build production image
docker build -f docker/Dockerfile.prod -t atp-production .

# Run with domain configuration
docker run -d \
  --name atp-production \
  -p 80:3000 \
  -p 443:3443 \
  --env-file .env.production.domains \
  atp-production
```

### SSL/TLS Setup

```bash
# Generate SSL certificates (example with Let's Encrypt)
certbot certonly --webroot \
  -w /var/www/html \
  -d agenttrustprotocol.com \
  -d www.agenttrustprotocol.com \
  -d agenttrust.dev \
  -d www.agenttrust.dev
```

## DNS Configuration

### Required DNS Records

#### agenttrustprotocol.com
```
A     agenttrustprotocol.com      → [YOUR_SERVER_IP]
A     www.agenttrustprotocol.com  → [YOUR_SERVER_IP]
AAAA  agenttrustprotocol.com      → [YOUR_IPv6] (optional)
```

#### agenttrust.dev
```
A     agenttrust.dev     → [YOUR_SERVER_IP]
A     www.agenttrust.dev → [YOUR_SERVER_IP]
A     api.agenttrust.dev → [YOUR_API_SERVER_IP]
```

### Subdomains (Optional)
```
A     api.agenttrustprotocol.com  → [YOUR_API_SERVER]
A     docs.agenttrust.dev         → [YOUR_DOCS_SERVER]
A     portal.agenttrust.dev       → [YOUR_PORTAL_SERVER]
```

## Nginx Configuration

### Main Site (agenttrustprotocol.com)
```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name agenttrustprotocol.com www.agenttrustprotocol.com;
    
    ssl_certificate /etc/letsencrypt/live/agenttrustprotocol.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/agenttrustprotocol.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3030;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Developer Portal (agenttrust.dev)
```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name agenttrust.dev www.agenttrust.dev;
    
    ssl_certificate /etc/letsencrypt/live/agenttrust.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/agenttrust.dev/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;  # Developer portal port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Kubernetes Deployment

### Production Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: atp-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: atp-production
  template:
    metadata:
      labels:
        app: atp-production
    spec:
      containers:
      - name: atp-app
        image: atp-production:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_APP_DOMAIN
          value: "https://agenttrustprotocol.com"
        - name: NEXT_PUBLIC_DEV_DOMAIN
          value: "https://agenttrust.dev"
        - name: NODE_ENV
          value: "production"
```

### Ingress Configuration
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: atp-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - agenttrustprotocol.com
    - www.agenttrustprotocol.com
    - agenttrust.dev
    - www.agenttrust.dev
    secretName: atp-tls
  rules:
  - host: agenttrustprotocol.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: atp-production
            port:
              number: 3000
  - host: agenttrust.dev
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: atp-developer-portal
            port:
              number: 3000
```

## Security Considerations

### HTTPS Redirect
```nginx
server {
    listen 80;
    server_name agenttrustprotocol.com www.agenttrustprotocol.com agenttrust.dev www.agenttrust.dev;
    return 301 https://$server_name$request_uri;
}
```

### Security Headers
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## Monitoring & Health Checks

### Health Check Endpoints
- `https://agenttrustprotocol.com/api/health`
- `https://agenttrust.dev/api/health`

### Monitoring URLs
- **Uptime**: Monitor both domains for 200 response
- **SSL**: Check certificate expiration
- **Performance**: Monitor page load times

## Backup Strategy

### Database Backups
```bash
# Automated backup script
#!/bin/bash
pg_dump $DATABASE_URL > backups/atp-$(date +%Y%m%d).sql
aws s3 cp backups/ s3://atp-backups/ --recursive
```

### Application Backups
```bash
# Docker image backup
docker save atp-production:latest | gzip > atp-production-$(date +%Y%m%d).tar.gz
```

## Post-Deployment Checklist

### ✅ Domain Verification
- [ ] `agenttrustprotocol.com` resolves correctly
- [ ] `www.agenttrustprotocol.com` resolves correctly  
- [ ] `agenttrust.dev` resolves correctly
- [ ] `www.agenttrust.dev` resolves correctly
- [ ] SSL certificates are valid and trusted
- [ ] HTTP redirects to HTTPS
- [ ] All subdomains work as expected

### ✅ Application Health
- [ ] Website loads properly on both domains
- [ ] API endpoints respond correctly
- [ ] Interactive demos function properly
- [ ] Database connections established
- [ ] Authentication flows work
- [ ] CORS settings allow cross-domain requests

### ✅ Security Verification  
- [ ] SSL Labs rating A+ on both domains
- [ ] Security headers present
- [ ] No hardcoded secrets in production
- [ ] Proper firewall rules applied
- [ ] Database access restricted
- [ ] Admin interfaces secured

### ✅ Performance Optimization
- [ ] CDN configured (optional)
- [ ] Image optimization enabled
- [ ] Gzip compression active
- [ ] Caching headers set
- [ ] Database queries optimized

## Troubleshooting

### Common Issues

1. **DNS Not Propagating**
   ```bash
   # Check DNS propagation
   dig agenttrustprotocol.com
   nslookup agenttrust.dev
   ```

2. **SSL Certificate Issues**
   ```bash
   # Verify certificate
   openssl s_client -connect agenttrustprotocol.com:443
   ```

3. **CORS Errors**
   - Verify CORS_ORIGIN includes both domains
   - Check browser developer tools
   - Test with curl

### Log Monitoring
```bash
# Application logs
docker logs atp-production --tail=100 -f

# Nginx access logs
tail -f /var/log/nginx/access.log

# SSL certificate renewal logs
tail -f /var/log/letsencrypt/letsencrypt.log
```

---

**🚀 Ready for Production**: Your ATP application is now configured for both `agenttrustprotocol.com` and `agenttrust.dev` with enterprise-grade security and scalability.