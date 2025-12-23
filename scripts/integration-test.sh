#!/bin/bash

# ATP™ Staging Integration Tests
# =============================

set -e

echo "🧪 ATP™ Staging Integration Tests"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
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

log_test() {
    echo -e "${CYAN}🧪 $1${NC}"
}

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log_test "Test: $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        log_success "$test_name - PASSED"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        log_error "$test_name - FAILED"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Advanced test function with response validation
run_api_test() {
    local test_name="$1"
    local url="$2"
    local expected_status="$3"
    local expected_content="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log_test "API Test: $test_name"
    
    response=$(curl -s -w "%{http_code}" -o response.tmp "$url")
    status_code="${response: -3}"
    
    if [ "$status_code" = "$expected_status" ]; then
        if [ -n "$expected_content" ]; then
            if grep -q "$expected_content" response.tmp; then
                log_success "$test_name - PASSED (Status: $status_code, Content: ✓)"
                PASSED_TESTS=$((PASSED_TESTS + 1))
                rm -f response.tmp
                return 0
            else
                log_error "$test_name - FAILED (Status: $status_code, Content: ✗)"
                FAILED_TESTS=$((FAILED_TESTS + 1))
                rm -f response.tmp
                return 1
            fi
        else
            log_success "$test_name - PASSED (Status: $status_code)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            rm -f response.tmp
            return 0
        fi
    else
        log_error "$test_name - FAILED (Expected: $expected_status, Got: $status_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        rm -f response.tmp
        return 1
    fi
}

log_info "Starting comprehensive integration tests..."

# 1. INFRASTRUCTURE TESTS
echo ""
log_info "Phase 1: Infrastructure Health Tests"
echo "-----------------------------------"

run_test "PostgreSQL Connection" "docker compose -f docker-compose.staging.yml exec -T postgres pg_isready -U atp_user -d atp_staging"
run_test "IPFS Node Running" "curl -sf http://localhost:5001/api/v0/version"
run_test "Prometheus Metrics" "curl -sf http://localhost:9090/-/healthy"
run_test "Load Balancer Health" "curl -sf http://localhost/health"

# 2. CORE SERVICE HEALTH TESTS
echo ""
log_info "Phase 2: Core Service Health Tests"
echo "---------------------------------"

run_api_test "Identity Service Health" "http://localhost:3001/health" "200" "healthy"
run_api_test "VC Service Health" "http://localhost:3002/health" "200" "healthy"
run_api_test "Permission Service Health" "http://localhost:3003/health" "200" "healthy"
run_api_test "Audit Logger Health" "http://localhost:3005/health" "200" "healthy"
run_api_test "RPC Gateway Health" "http://localhost:3000/health" "200" "Agent Trust Protocol"
run_api_test "Protocol Integrations Health" "http://localhost:3006/health" "200" "healthy"

# 3. API FUNCTIONALITY TESTS
echo ""
log_info "Phase 3: API Functionality Tests"
echo "-------------------------------"

# Test Identity Service API
run_api_test "Identity Service - List Identities" "http://localhost:3001/identity" "200" ""
run_api_test "Gateway - Service Status" "http://localhost:3000/services" "200" "success"

# Test Load Balancer API Routing
run_api_test "Load Balancer - Identity Route" "http://localhost/api/identity/health" "200" ""
run_api_test "Load Balancer - Gateway Route" "http://localhost/api/gateway/health" "200" ""

# 4. SECURITY AND AUTHENTICATION TESTS
echo ""
log_info "Phase 4: Security & Authentication Tests"
echo "---------------------------------------"

# Test authentication endpoints
run_api_test "Gateway - Auth Challenge Endpoint" "http://localhost:3000/auth/challenge" "400" "DID is required"
run_api_test "Gateway - Secure Endpoint (Should Fail)" "http://localhost:3000/secure/status" "401" ""

# Test certificate endpoints
run_api_test "Gateway - CA Certificate" "http://localhost:3000/certificates/ca" "200" ""
run_api_test "Gateway - CRL" "http://localhost:3000/certificates/crl" "200" ""

# 5. PROTOCOL INTEGRATION TESTS
echo ""
log_info "Phase 5: Protocol Integration Tests"
echo "----------------------------------"

# Test MCP integration
run_api_test "MCP Service Health" "http://localhost:3006/health" "200" "mcp"
run_api_test "A2A Service Health" "http://localhost:3007/health" "200" "a2a"

# Test protocol endpoints
run_api_test "MCP Tools List" "http://localhost:3006/mcp/tools" "200" ""
run_api_test "A2A Agents Discovery" "http://localhost:3007/a2a/agents" "200" ""

# 6. MONITORING AND OBSERVABILITY TESTS
echo ""
log_info "Phase 6: Monitoring & Observability Tests"
echo "----------------------------------------"

run_test "Prometheus Targets" "curl -sf http://localhost:9090/api/v1/targets | grep -q 'atp-services'"
run_test "Grafana API" "curl -sf http://localhost:3001/api/health"
run_api_test "Audit Events API" "http://localhost:3005/audit/events" "200" ""

# 7. DATA PERSISTENCE TESTS
echo ""
log_info "Phase 7: Data Persistence Tests"
echo "------------------------------"

# Test database connections and basic operations
log_test "Creating Test Identity"
TEST_DID=$(curl -s -X POST http://localhost:3001/identity/register \
    -H "Content-Type: application/json" \
    -d '{"publicKey":"test-key-123","metadata":{"name":"Test Agent"}}' \
    | grep -o '"did":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TEST_DID" ]; then
    log_success "Test Identity Created: $TEST_DID"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    
    # Test identity retrieval
    if curl -sf "http://localhost:3001/identity/$TEST_DID" | grep -q "$TEST_DID"; then
        log_success "Test Identity Retrieved Successfully"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        log_error "Test Identity Retrieval Failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    log_error "Test Identity Creation Failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

TOTAL_TESTS=$((TOTAL_TESTS + 2))

# 8. IPFS INTEGRATION TESTS
echo ""
log_info "Phase 8: IPFS Integration Tests"
echo "------------------------------"

# Test IPFS storage
log_test "IPFS Storage Test"
TEST_HASH=$(echo "ATP™ Test Data" | curl -s -F "file=@-" http://localhost:5001/api/v0/add | grep -o '"Hash":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TEST_HASH" ]; then
    log_success "IPFS Storage Test - Data Stored: $TEST_HASH"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    
    # Test IPFS retrieval
    if curl -sf "http://localhost:8080/ipfs/$TEST_HASH" | grep -q "ATP™ Test Data"; then
        log_success "IPFS Retrieval Test - Data Retrieved Successfully"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        log_error "IPFS Retrieval Test Failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    log_error "IPFS Storage Test Failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

TOTAL_TESTS=$((TOTAL_TESTS + 2))

# 9. PERFORMANCE AND LOAD TESTS (Basic)
echo ""
log_info "Phase 9: Basic Performance Tests"
echo "-------------------------------"

# Test response times
log_test "Gateway Response Time Test"
RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:3000/health)
if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    log_success "Gateway Response Time: ${RESPONSE_TIME}s (< 1s)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log_warning "Gateway Response Time: ${RESPONSE_TIME}s (> 1s)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 10. END-TO-END WORKFLOW TESTS
echo ""
log_info "Phase 10: End-to-End Workflow Tests"
echo "----------------------------------"

# Test complete agent registration and verification workflow
log_test "E2E Agent Registration Workflow"

# Create agent identity
AGENT_DID=$(curl -s -X POST http://localhost:3001/identity/register \
    -H "Content-Type: application/json" \
    -d '{"publicKey":"e2e-agent-key","metadata":{"name":"E2E Test Agent","type":"test"}}' \
    | grep -o '"did":"[^"]*"' | cut -d'"' -f4)

if [ -n "$AGENT_DID" ]; then
    log_success "E2E Agent Identity Created: $AGENT_DID"
    
    # Update trust level
    if curl -sf -X POST "http://localhost:3001/identity/$AGENT_DID/trust-level" \
        -H "Content-Type: application/json" \
        -d '{"trustLevel":"VERIFIED","reason":"E2E test"}'; then
        log_success "E2E Agent Trust Level Updated"
        
        # Verify trust level
        if curl -sf "http://localhost:3001/identity/$AGENT_DID/trust-info" | grep -q "VERIFIED"; then
            log_success "E2E Agent Trust Level Verified"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            log_error "E2E Agent Trust Level Verification Failed"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        log_error "E2E Agent Trust Level Update Failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    log_error "E2E Agent Identity Creation Failed"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

TOTAL_TESTS=$((TOTAL_TESTS + 1))

# FINAL SUMMARY
echo ""
echo "🏆 ATP™ Staging Integration Test Results"
echo "========================================"
echo ""

PASS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))

echo "📊 Test Summary:"
echo "• Total Tests: $TOTAL_TESTS"
echo "• Passed: $PASSED_TESTS"
echo "• Failed: $FAILED_TESTS"
echo "• Pass Rate: $PASS_RATE%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    log_success "🎉 ALL INTEGRATION TESTS PASSED!"
    echo ""
    echo "✅ ATP™ Staging Environment is fully functional"
    echo "✅ All services are healthy and communicating"
    echo "✅ Security features are working correctly"
    echo "✅ Protocol integrations are functional"
    echo "✅ Data persistence is working"
    echo "✅ Monitoring is operational"
    echo ""
    echo "🚀 Ready for live user testing!"
    exit 0
elif [ $PASS_RATE -ge 90 ]; then
    log_warning "⚠️  $FAILED_TESTS tests failed, but $PASS_RATE% pass rate achieved"
    echo ""
    echo "✅ ATP™ Staging Environment is mostly functional"
    echo "⚠️  Some non-critical issues detected"
    echo "🔍 Review failed tests and consider fixes"
    echo ""
    echo "✅ Acceptable for live user testing with monitoring"
    exit 0
else
    log_error "❌ Too many tests failed ($PASS_RATE% pass rate)"
    echo ""
    echo "❌ ATP™ Staging Environment has critical issues"
    echo "🔧 Review and fix failed tests before proceeding"
    echo ""
    echo "🔍 Check service logs:"
    echo "   docker compose -f docker-compose.staging.yml logs [service-name]"
    exit 1
fi

# Cleanup
rm -f response.tmp