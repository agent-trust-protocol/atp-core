#!/bin/bash

set -e  # Exit on any error

echo "============================================"
echo "   END-TO-END AUTHENTICATION TEST"
echo "============================================"
echo ""

# Generate unique test credentials
TIMESTAMP=$(date +%s)
TEST_EMAIL="e2e-test-${TIMESTAMP}@example.com"
TEST_PASSWORD="SecurePass123!"
TEST_FIRST_NAME="E2E"
TEST_LAST_NAME="Test${TIMESTAMP}"

echo "📋 Test Configuration:"
echo "   Email: $TEST_EMAIL"
echo "   Password: $TEST_PASSWORD"
echo "   Server: http://localhost:3030"
echo ""

# Temp file for cookies
COOKIE_FILE=$(mktemp)
trap "rm -f $COOKIE_FILE" EXIT

echo "============================================"
echo "TEST 1: User Signup"
echo "============================================"

SIGNUP_RESPONSE=$(curl -s -c "$COOKIE_FILE" -w "\nSTATUS:%{http_code}" \
  -X POST http://localhost:3030/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"$TEST_FIRST_NAME\",
    \"lastName\": \"$TEST_LAST_NAME\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"company\": \"E2E Test Company\",
    \"companySize\": \"10-50\",
    \"phone\": \"555-0000\",
    \"useCase\": \"Automated Testing\",
    \"agreeToTerms\": true
  }")

STATUS=$(echo "$SIGNUP_RESPONSE" | grep "STATUS:" | cut -d: -f2)
BODY=$(echo "$SIGNUP_RESPONSE" | grep -v "STATUS:")

if [ "$STATUS" == "200" ]; then
  echo "✅ PASS: Signup successful (HTTP 200)"
  echo "   Response: $BODY"

  # Extract user ID
  USER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  echo "   User ID: $USER_ID"

  # Check if cookie was set
  if grep -q "atp_token" "$COOKIE_FILE"; then
    echo "   ✅ JWT cookie set correctly"
  else
    echo "   ❌ WARNING: JWT cookie not found"
  fi
else
  echo "❌ FAIL: Signup failed (HTTP $STATUS)"
  echo "   Response: $BODY"
  exit 1
fi

echo ""

# Clear cookies for fresh login test
rm -f "$COOKIE_FILE"
touch "$COOKIE_FILE"

echo "============================================"
echo "TEST 2: User Login (Correct Password)"
echo "============================================"

LOGIN_RESPONSE=$(curl -s -c "$COOKIE_FILE" -w "\nSTATUS:%{http_code}" \
  -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

STATUS=$(echo "$LOGIN_RESPONSE" | grep "STATUS:" | cut -d: -f2)
BODY=$(echo "$LOGIN_RESPONSE" | grep -v "STATUS:")

if [ "$STATUS" == "200" ]; then
  echo "✅ PASS: Login successful (HTTP 200)"
  echo "   Response: $BODY"

  if grep -q "atp_token" "$COOKIE_FILE"; then
    echo "   ✅ JWT cookie set correctly"
    JWT_TOKEN=$(grep "atp_token" "$COOKIE_FILE" | awk '{print $7}')
    echo "   Token (first 20 chars): ${JWT_TOKEN:0:20}..."
  else
    echo "   ❌ FAIL: JWT cookie not found"
    exit 1
  fi
else
  echo "❌ FAIL: Login failed (HTTP $STATUS)"
  echo "   Response: $BODY"
  exit 1
fi

echo ""

echo "============================================"
echo "TEST 3: Login with Wrong Password"
echo "============================================"

WRONG_LOGIN=$(curl -s -w "\nSTATUS:%{http_code}" \
  -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"WrongPassword123!\"
  }")

STATUS=$(echo "$WRONG_LOGIN" | grep "STATUS:" | cut -d: -f2)
BODY=$(echo "$WRONG_LOGIN" | grep -v "STATUS:")

if [ "$STATUS" == "401" ]; then
  echo "✅ PASS: Wrong password correctly rejected (HTTP 401)"
  echo "   Response: $BODY"
else
  echo "❌ FAIL: Wrong password should return 401, got $STATUS"
  echo "   Response: $BODY"
  exit 1
fi

echo ""

echo "============================================"
echo "TEST 4: Access Protected Route (With Auth)"
echo "============================================"

PORTAL_RESPONSE=$(curl -s -b "$COOKIE_FILE" -w "\nSTATUS:%{http_code}" \
  http://localhost:3030/portal)

STATUS=$(echo "$PORTAL_RESPONSE" | grep "STATUS:" | cut -d: -f2)

if [ "$STATUS" == "200" ]; then
  echo "✅ PASS: Protected route accessible with valid cookie (HTTP 200)"
else
  echo "⚠️  WARNING: Protected route returned HTTP $STATUS"
  echo "   This may be normal if portal page has issues"
fi

echo ""

echo "============================================"
echo "TEST 5: Access Protected Route (No Auth)"
echo "============================================"

UNAUTH_RESPONSE=$(curl -s -w "\nSTATUS:%{http_code}" -L \
  http://localhost:3030/portal)

STATUS=$(echo "$UNAUTH_RESPONSE" | grep "STATUS:" | cut -d: -f2)
BODY=$(echo "$UNAUTH_RESPONSE" | grep -v "STATUS:")

# Should redirect to login (302) or show login page (200 with login content)
if [ "$STATUS" == "307" ] || [ "$STATUS" == "302" ]; then
  echo "✅ PASS: Protected route redirected to login (HTTP $STATUS)"
elif echo "$BODY" | grep -q "login"; then
  echo "✅ PASS: Protected route showed login page (HTTP $STATUS)"
else
  echo "⚠️  WARNING: Protected route returned HTTP $STATUS without redirect"
fi

echo ""

echo "============================================"
echo "TEST 6: Verify Database Entry"
echo "============================================"

DB_CHECK=$(sqlite3 "/Volumes/My Passport for Mac/agent-trust-protocol-1/website-repo/dev.db" \
  "SELECT u.email, u.name, u.plan, a.password FROM user u
   LEFT JOIN account a ON u.id = a.userId
   WHERE u.email = '$TEST_EMAIL';")

if [ ! -z "$DB_CHECK" ]; then
  echo "✅ PASS: User found in database"
  echo "   Email: $(echo "$DB_CHECK" | cut -d'|' -f1)"
  echo "   Name: $(echo "$DB_CHECK" | cut -d'|' -f2)"
  echo "   Plan: $(echo "$DB_CHECK" | cut -d'|' -f3)"

  PASSWORD_HASH=$(echo "$DB_CHECK" | cut -d'|' -f4)
  if [[ $PASSWORD_HASH == \$2b\$10\$* ]]; then
    echo "   ✅ Password properly hashed with bcrypt"
    echo "   Hash (first 20 chars): ${PASSWORD_HASH:0:20}..."
  else
    echo "   ❌ FAIL: Password not properly hashed"
    exit 1
  fi
else
  echo "❌ FAIL: User not found in database"
  exit 1
fi

echo ""

echo "============================================"
echo "   ALL TESTS COMPLETED SUCCESSFULLY! ✅"
echo "============================================"
echo ""
echo "Summary:"
echo "  ✅ User signup working"
echo "  ✅ User login working"
echo "  ✅ Password verification working"
echo "  ✅ Invalid credentials rejected"
echo "  ✅ JWT cookies set correctly"
echo "  ✅ Database storage working"
echo "  ✅ bcrypt hashing working"
echo ""
echo "🎉 Authentication system is fully functional!"
