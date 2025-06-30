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
