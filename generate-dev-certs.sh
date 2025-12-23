#!/bin/bash

# Generate self-signed certificates for development HTTPS
# DO NOT USE THESE CERTIFICATES IN PRODUCTION

echo "Generating development certificates for HTTPS..."

# Create directory for certificates
mkdir -p ./certs

# Generate private key
openssl genrsa -out ./certs/server.key 2048

# Generate certificate signing request
openssl req -new -key ./certs/server.key -out ./certs/server.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in ./certs/server.csr -signkey ./certs/server.key -out ./certs/server.crt

echo "Certificates generated successfully!"
echo "  - Private key: ./certs/server.key"
echo "  - Certificate: ./certs/server.crt"
echo ""
echo "To use HTTPS, run: npm run start:https"
echo "Note: Your browser will show a security warning because this is a self-signed certificate."

# Make the script executable
chmod +x generate-dev-certs.sh