# 🌐 GoDaddy DNS Automation Guide for ATP

## 🚀 **Automated Subdomain Creation**

I've created a script that will automatically set up **20+ subdomains** for your ATP system using GoDaddy's API. This saves you hours of manual work!

## 📋 **Step 1: Get GoDaddy API Credentials**

1. **Go to GoDaddy Developer Portal**
   - Visit: https://developer.godaddy.com/
   - Sign in with your GoDaddy account

2. **Create API Keys**
   - Click "Create New API Key"
   - Choose **"OTE"** environment first (for testing)
   - Copy the OTE API Key and Secret
   - Later, create **"Production"** keys for live deployment

## 🔧 **Step 2: Configure the Script**

Set your environment variables (replace with your actual values):

### **For Testing (OTE Environment):**
```bash
# Your GoDaddy OTE API credentials
export GODADDY_API_KEY="your_ote_api_key_here"
export GODADDY_API_SECRET="your_ote_api_secret_here"

# Your domain name (without www)
export DOMAIN="yourdomain.com"

# Your server's IP address where ATP will run
export SERVER_IP="your.server.ip.address"

# Use OTE test environment
export USE_OTE="true"
```

### **For Production (Live Environment):**
```bash
# Your GoDaddy Production API credentials
export GODADDY_API_KEY="your_production_api_key_here"
export GODADDY_API_SECRET="your_production_api_secret_here"

# Your domain name (without www)
export DOMAIN="yourdomain.com"

# Your server's IP address where ATP will run
export SERVER_IP="your.server.ip.address"

# Use production environment (default)
export USE_OTE="false"
```

## ⚡ **Step 3: Run the Automation**

```bash
# Make sure you're in the ATP directory
cd /Users/jacklu/agent-trust-protocol-1

# Run the DNS setup script
./setup-godaddy-domains.sh
```

## 🌐 **Subdomains That Will Be Created**

The script will automatically create these subdomains for your ATP system:

### **Core Services**
- `www.yourdomain.com` - Main Website
- `app.yourdomain.com` - Web Application  
- `api.yourdomain.com` - Main API
- `admin.yourdomain.com` - Admin Panel

### **Enterprise Features**
- `enterprise.yourdomain.com` - Enterprise Portal
- `sso.yourdomain.com` - Single Sign-On
- `compliance.yourdomain.com` - Compliance Dashboard

### **Microservices**
- `gateway.yourdomain.com` - RPC Gateway (Port 8080)
- `identity.yourdomain.com` - Identity Service (Port 8081)
- `monitor.yourdomain.com` - Monitoring (Port 8082)
- `audit.yourdomain.com` - Audit Logging
- `policy.yourdomain.com` - Policy Editor

### **Developer Resources**
- `docs.yourdomain.com` - Documentation
- `sdk.yourdomain.com` - SDK Downloads
- `dev.yourdomain.com` - Developer Portal

### **Protocol Endpoints**
- `mcp.yourdomain.com` - MCP Protocol
- `acp.yourdomain.com` - ACP Protocol
- `agp.yourdomain.com` - AGP Protocol

### **Testing Environments**
- `test.yourdomain.com` - Testing Environment
- `staging.yourdomain.com` - Staging Environment

### **Convenient Aliases (CNAME)**
- `dashboard.yourdomain.com` → `yourdomain.com`
- `portal.yourdomain.com` → `yourdomain.com`
- `console.yourdomain.com` → `yourdomain.com`

## 🔧 **Step 4: Configure Nginx (Reverse Proxy)**

After DNS is set up, create an Nginx configuration to route subdomains to the right services:

```bash
# Create Nginx config for ATP
cat > atp-nginx.conf << 'EOF'
# ATP System Nginx Configuration

# Main website
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API Gateway
server {
    listen 80;
    server_name api.yourdomain.com gateway.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Identity Service
server {
    listen 80;
    server_name identity.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Monitoring Service
server {
    listen 80;
    server_name monitor.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Policy Editor
server {
    listen 80;
    server_name policy.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000/policy-editor;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Enterprise Portal
server {
    listen 80;
    server_name enterprise.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000/enterprise;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF
```

## 🕒 **Step 5: Wait for DNS Propagation**

- **Local**: 5-15 minutes
- **Regional**: 1-4 hours  
- **Worldwide**: 24-48 hours

You can check propagation status:
```bash
# Check if DNS is working
dig www.yourdomain.com
dig api.yourdomain.com
```

## 🎯 **Benefits of This Automation**

✅ **Saves Time**: Creates 20+ subdomains in seconds vs hours manually  
✅ **No Mistakes**: Automated process eliminates typos  
✅ **Professional Setup**: Enterprise-grade subdomain structure  
✅ **Scalable**: Easy to add more subdomains later  
✅ **Consistent**: All subdomains follow the same pattern  

## 🔒 **Security Notes**

- Keep your GoDaddy API credentials secure
- Use environment variables (don't hardcode in scripts)
- Consider using HTTPS/SSL certificates for all subdomains
- Set up proper firewall rules for your server

## 🆘 **Troubleshooting**

### **If the script fails:**
1. **Check API credentials** - Make sure they're correct
2. **Verify domain ownership** - Ensure the domain is in your GoDaddy account
3. **Check API limits** - GoDaddy has rate limits on API calls
4. **Manual verification** - Log into GoDaddy DNS management to see if records were created

### **If DNS doesn't resolve:**
1. **Wait longer** - DNS propagation can take up to 48 hours
2. **Clear DNS cache** - Run `sudo dscacheutil -flushcache` (macOS)
3. **Use different DNS** - Try 8.8.8.8 or 1.1.1.1 for testing
4. **Check with online tools** - Use whatsmydns.net to check propagation

## 🎉 **Ready for Launch!**

Once DNS propagation is complete, your ATP system will be accessible via professional subdomains, making it ready for enterprise customers and production use!

**Your domain setup will be world-class and ready for Monday's launch! 🚀**