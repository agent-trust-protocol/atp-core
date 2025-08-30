#!/bin/bash

# Generate mTLS certificates for ATP production security
set -e

CERT_DIR="./certs"
mkdir -p "$CERT_DIR"

echo "🔐 Generating ATP mTLS Certificates..."

# Generate CA private key
openssl genrsa -out "$CERT_DIR/ca-key.pem" 4096

# Generate CA certificate
openssl req -new -x509 -days 365 -key "$CERT_DIR/ca-key.pem" -out "$CERT_DIR/ca-cert.pem" -subj "/C=US/ST=CA/L=San Francisco/O=Agent Trust Protocol/OU=Security/CN=ATP-CA"

# Generate server private key
openssl genrsa -out "$CERT_DIR/server-key.pem" 4096

# Generate server certificate signing request
openssl req -new -key "$CERT_DIR/server-key.pem" -out "$CERT_DIR/server.csr" -subj "/C=US/ST=CA/L=San Francisco/O=Agent Trust Protocol/OU=Services/CN=localhost"

# Generate server certificate
openssl x509 -req -days 365 -in "$CERT_DIR/server.csr" -CA "$CERT_DIR/ca-cert.pem" -CAkey "$CERT_DIR/ca-key.pem" -CAcreateserial -out "$CERT_DIR/server-cert.pem"

# Generate client private key
openssl genrsa -out "$CERT_DIR/client-key.pem" 4096

# Generate client certificate signing request
openssl req -new -key "$CERT_DIR/client-key.pem" -out "$CERT_DIR/client.csr" -subj "/C=US/ST=CA/L=San Francisco/O=Agent Trust Protocol/OU=Clients/CN=atp-client"

# Generate client certificate
openssl x509 -req -days 365 -in "$CERT_DIR/client.csr" -CA "$CERT_DIR/ca-cert.pem" -CAkey "$CERT_DIR/ca-key.pem" -CAcreateserial -out "$CERT_DIR/client-cert.pem"

# Set proper permissions
chmod 600 "$CERT_DIR"/*-key.pem
chmod 644 "$CERT_DIR"/*-cert.pem

# Clean up CSR files
rm "$CERT_DIR"/*.csr

echo "✅ mTLS certificates generated in $CERT_DIR/"
echo "📋 Files created:"
echo "   - ca-cert.pem (Certificate Authority)"
echo "   - ca-key.pem (CA Private Key)"
echo "   - server-cert.pem (Server Certificate)"
echo "   - server-key.pem (Server Private Key)"
echo "   - client-cert.pem (Client Certificate)"
echo "   - client-key.pem (Client Private Key)"
echo ""
echo "🚀 Ready for production mTLS deployment!"