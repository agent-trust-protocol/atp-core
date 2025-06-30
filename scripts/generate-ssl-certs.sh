#!/bin/bash

# ATP™ SSL Certificate Generation Script
# =====================================
# Generates SSL certificates for development and production

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

echo -e "${BOLD}${CYAN}🔐 Agent Trust Protocol™ - SSL Certificate Generator${NC}"
echo -e "${CYAN}====================================================${NC}"
echo ""

# Check for required tools
log_step "Checking Required Tools"

if ! command -v openssl &> /dev/null; then
    log_error "OpenSSL is required but not installed. Please install OpenSSL."
    exit 1
fi

log_success "OpenSSL found: $(openssl version)"

# Configuration
CERT_DIR="ssl"
SECRETS_DIR="secrets"
DAYS_VALID=365
ENVIRONMENT=${1:-development}

if [ "$ENVIRONMENT" = "production" ]; then
    DAYS_VALID=730  # 2 years for production
fi

log_step "Generating SSL Certificates for $ENVIRONMENT"

# Create directories
mkdir -p "$CERT_DIR" "$SECRETS_DIR"
cd "$CERT_DIR"

# Certificate configuration
if [ "$ENVIRONMENT" = "production" ]; then
    DOMAIN="atp.dev"
    COUNTRY="US"
    STATE="California"
    CITY="San Francisco"
    ORG="Agent Trust Protocol"
    OU="ATP Security"
else
    DOMAIN="localhost"
    COUNTRY="US"
    STATE="Development"
    CITY="Local"
    ORG="ATP Development"
    OU="Dev Team"
fi

log_info "Domain: $DOMAIN"
log_info "Environment: $ENVIRONMENT"
log_info "Validity: $DAYS_VALID days"

# Function to create certificate configuration
create_cert_config() {
    local config_file=$1
    local cn=$2
    
    cat > "$config_file" << EOF
[req]
default_bits = 4096
prompt = no
default_md = sha256
req_extensions = v3_req
distinguished_name = dn

[dn]
C=$COUNTRY
ST=$STATE
L=$CITY
O=$ORG
OU=$OU
CN=$cn

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
EOF

    # Add alt names based on environment
    if [ "$ENVIRONMENT" = "production" ]; then
        cat >> "$config_file" << EOF
DNS.1=atp.dev
DNS.2=api.atp.dev
DNS.3=docs.atp.dev
DNS.4=dashboard.atp.dev
DNS.5=monitoring.atp.dev
EOF
    else
        cat >> "$config_file" << EOF
DNS.1=localhost
DNS.2=127.0.0.1
DNS.3=*.localhost
IP.1=127.0.0.1
EOF
    fi
}

# 1. Generate Certificate Authority (CA)
log_step "Step 1: Generating Certificate Authority (CA)"

if [ ! -f "ca-private-key.pem" ]; then
    log_info "Generating CA private key..."
    openssl genrsa -aes256 -passout pass:atp_ca_passphrase_change_in_production -out ca-private-key.pem 4096
    chmod 600 ca-private-key.pem
    log_success "CA private key generated"
else
    log_info "CA private key already exists"
fi

if [ ! -f "ca-certificate.pem" ]; then
    log_info "Generating CA certificate..."
    
    # Create CA config
    cat > ca.conf << EOF
[req]
default_bits = 4096
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_ca

[dn]
C=$COUNTRY
ST=$STATE
L=$CITY
O=$ORG
OU=Certificate Authority
CN=ATP Certificate Authority

[v3_ca]
basicConstraints = critical,CA:TRUE
keyUsage = critical, digitalSignature, cRLSign, keyCertSign
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
EOF

    openssl req -new -x509 -key ca-private-key.pem -days $DAYS_VALID -out ca-certificate.pem -config ca.conf -passin pass:atp_ca_passphrase_change_in_production
    chmod 644 ca-certificate.pem
    rm ca.conf
    log_success "CA certificate generated"
else
    log_info "CA certificate already exists"
fi

# 2. Generate Server Certificate for ATP Services
log_step "Step 2: Generating ATP Server Certificate"

log_info "Generating server private key..."
openssl genrsa -out atp-private-key.pem 4096
chmod 600 atp-private-key.pem

log_info "Creating certificate signing request..."
create_cert_config "server.conf" "$DOMAIN"
openssl req -new -key atp-private-key.pem -out atp-csr.pem -config server.conf

log_info "Signing server certificate with CA..."
openssl x509 -req -in atp-csr.pem -CA ca-certificate.pem -CAkey ca-private-key.pem -CAcreateserial -out atp-certificate.pem -days $DAYS_VALID -extensions v3_req -extfile server.conf -passin pass:atp_ca_passphrase_change_in_production

chmod 644 atp-certificate.pem
rm atp-csr.pem server.conf

log_success "ATP server certificate generated"

# 3. Generate Client Certificates for mTLS
log_step "Step 3: Generating Client Certificates for mTLS"

generate_client_cert() {
    local client_name=$1
    local client_cn=$2
    
    log_info "Generating client certificate for $client_name..."
    
    # Generate client private key
    openssl genrsa -out "$client_name-private-key.pem" 4096
    chmod 600 "$client_name-private-key.pem"
    
    # Create client certificate config
    cat > "$client_name.conf" << EOF
[req]
default_bits = 4096
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=$COUNTRY
ST=$STATE
L=$CITY
O=$ORG
OU=ATP Client
CN=$client_cn

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth
EOF

    # Generate CSR and sign with CA
    openssl req -new -key "$client_name-private-key.pem" -out "$client_name-csr.pem" -config "$client_name.conf"
    openssl x509 -req -in "$client_name-csr.pem" -CA ca-certificate.pem -CAkey ca-private-key.pem -CAcreateserial -out "$client_name-certificate.pem" -days $DAYS_VALID -extensions v3_req -extfile "$client_name.conf" -passin pass:atp_ca_passphrase_change_in_production
    
    chmod 644 "$client_name-certificate.pem"
    rm "$client_name-csr.pem" "$client_name.conf"
    
    log_success "Client certificate for $client_name generated"
}

# Generate certificates for ATP services
generate_client_cert "identity-service" "Identity Service Client"
generate_client_cert "vc-service" "VC Service Client"
generate_client_cert "permission-service" "Permission Service Client"
generate_client_cert "rpc-gateway" "RPC Gateway Client"
generate_client_cert "audit-logger" "Audit Logger Client"

# 4. Generate PKCS#12 bundles for easier deployment
log_step "Step 4: Generating PKCS#12 Bundles"

log_info "Creating server PKCS#12 bundle..."
openssl pkcs12 -export -out atp-server-bundle.p12 -inkey atp-private-key.pem -in atp-certificate.pem -certfile ca-certificate.pem -passout pass:atp_server_bundle_password

log_info "Creating client PKCS#12 bundles..."
for service in identity-service vc-service permission-service rpc-gateway audit-logger; do
    openssl pkcs12 -export -out "$service-client-bundle.p12" -inkey "$service-private-key.pem" -in "$service-certificate.pem" -certfile ca-certificate.pem -passout pass:atp_client_bundle_password
done

# 5. Create certificate verification and information files
log_step "Step 5: Creating Certificate Information"

# Create certificate info file
cat > certificate-info.txt << EOF
ATP™ SSL Certificate Information
Generated: $(date)
Environment: $ENVIRONMENT
Domain: $DOMAIN
Validity: $DAYS_VALID days

Files Generated:
================

Certificate Authority:
- ca-private-key.pem      (CA private key - KEEP SECURE)
- ca-certificate.pem      (CA public certificate)

Server Certificate:
- atp-private-key.pem     (Server private key)
- atp-certificate.pem     (Server public certificate)
- atp-server-bundle.p12   (Server PKCS#12 bundle)

Client Certificates (for mTLS):
- identity-service-private-key.pem & identity-service-certificate.pem
- vc-service-private-key.pem & vc-service-certificate.pem
- permission-service-private-key.pem & permission-service-certificate.pem
- rpc-gateway-private-key.pem & rpc-gateway-certificate.pem
- audit-logger-private-key.pem & audit-logger-certificate.pem

PKCS#12 Bundles:
- *-client-bundle.p12     (Client bundles for services)

Security Notes:
===============
- Keep all private keys (.pem files) secure and never commit to version control
- CA private key is protected with passphrase: atp_ca_passphrase_change_in_production
- PKCS#12 bundles use passwords: atp_server_bundle_password / atp_client_bundle_password
- Change all default passwords in production
- Regularly rotate certificates (recommend every 1-2 years)

Verification Commands:
=====================
# Verify server certificate
openssl x509 -in atp-certificate.pem -text -noout

# Verify certificate chain
openssl verify -CAfile ca-certificate.pem atp-certificate.pem

# Test server certificate
openssl s_client -connect localhost:443 -CAfile ca-certificate.pem
EOF

# Create verification script
cat > verify-certificates.sh << 'EOF'
#!/bin/bash
echo "🔍 Verifying ATP SSL Certificates..."

echo "✅ Checking CA certificate..."
openssl x509 -in ca-certificate.pem -text -noout | grep -E "(Subject:|Not Before|Not After|Public Key)"

echo ""
echo "✅ Checking server certificate..."
openssl x509 -in atp-certificate.pem -text -noout | grep -E "(Subject:|Issuer:|Not Before|Not After|DNS:|IP Address)"

echo ""
echo "✅ Verifying certificate chain..."
if openssl verify -CAfile ca-certificate.pem atp-certificate.pem; then
    echo "✅ Certificate chain is valid"
else
    echo "❌ Certificate chain verification failed"
fi

echo ""
echo "✅ Certificate Summary:"
echo "CA: $(openssl x509 -in ca-certificate.pem -subject -noout | cut -d= -f2-)"
echo "Server: $(openssl x509 -in atp-certificate.pem -subject -noout | cut -d= -f2-)"
echo "Expires: $(openssl x509 -in atp-certificate.pem -enddate -noout | cut -d= -f2)"
EOF

chmod +x verify-certificates.sh

# 6. Move CA files to secrets directory for security
log_step "Step 6: Securing Certificate Authority Files"

cp ca-private-key.pem "../$SECRETS_DIR/"
cp ca-certificate.pem "../$SECRETS_DIR/"
log_success "CA files secured in secrets directory"

# 7. Display summary
cd ..
log_step "🎉 SSL Certificate Generation Complete!"

echo ""
echo -e "${CYAN}📋 Certificate Summary${NC}"
echo -e "${CYAN}======================${NC}"
echo -e "📁 SSL Directory: ${BOLD}$CERT_DIR/${NC}"
echo -e "🔐 Secrets Directory: ${BOLD}$SECRETS_DIR/${NC}"
echo -e "🌐 Domain: ${BOLD}$DOMAIN${NC}"
echo -e "📅 Valid for: ${BOLD}$DAYS_VALID days${NC}"
echo -e "🔗 Environment: ${BOLD}$ENVIRONMENT${NC}"

echo ""
echo -e "${GREEN}✅ Generated Files:${NC}"
echo -e "• Server certificate: ${CYAN}atp-certificate.pem${NC}"
echo -e "• Server private key: ${CYAN}atp-private-key.pem${NC}"
echo -e "• CA certificate: ${CYAN}ca-certificate.pem${NC}"
echo -e "• Client certificates: ${CYAN}5 service certificates${NC}"
echo -e "• PKCS#12 bundles: ${CYAN}6 bundle files${NC}"

echo ""
echo -e "${YELLOW}⚠️  Security Reminders:${NC}"
echo -e "• ${YELLOW}Keep private keys secure and never commit to git${NC}"
echo -e "• ${YELLOW}Change default passwords in production${NC}"
echo -e "• ${YELLOW}Regularly rotate certificates${NC}"
echo -e "• ${YELLOW}Test certificates before deployment${NC}"

echo ""
echo -e "${BLUE}🔍 Next Steps:${NC}"
echo -e "1. Verify certificates: ${CYAN}cd ssl && ./verify-certificates.sh${NC}"
echo -e "2. Update nginx configuration for HTTPS"
echo -e "3. Configure services for TLS/mTLS"
echo -e "4. Test HTTPS endpoints"

if [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    log_warning "PRODUCTION DEPLOYMENT:"
    echo -e "• Update domain names to match your actual domains"
    echo -e "• Use proper Certificate Authority (not self-signed) for public deployment"
    echo -e "• Consider using Let's Encrypt for automated certificate management"
    echo -e "• Implement certificate rotation strategy"
fi

log_success "🚀 ATP™ SSL certificates ready for deployment!" 