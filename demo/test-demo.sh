#!/bin/bash

# 🛡️ Agent Trust Protocol™ - Demo Environment Testing Script
# Comprehensive testing for the interactive demo

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
DEMO_PORT=3013
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_RESULTS=()

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}$1${NC}"
}

add_test_result() {
    TEST_RESULTS+=("$1")
}

show_banner() {
    echo
    log_header "🛡️  ═══════════════════════════════════════════════════════════════"
    log_header "    Agent Trust Protocol™ - Demo Environment Testing"
    log_header "    Comprehensive Demo Validation Suite"
    log_header "═══════════════════════════════════════════════════════════════"
    echo
}

start_demo_server() {
    log_info "Starting demo server for testing..."
    
    cd "$SCRIPT_DIR"
    node server.js --port $DEMO_PORT &
    local server_pid=$!
    
    # Wait for server to start
    sleep 3
    
    # Check if server is running
    if ! kill -0 $server_pid 2>/dev/null; then
        log_error "Failed to start demo server"
        return 1
    fi
    
    log_success "Demo server started (PID: $server_pid, Port: $DEMO_PORT)"
    echo $server_pid > /tmp/atp-demo-test.pid
    return 0
}

stop_demo_server() {
    if [ -f /tmp/atp-demo-test.pid ]; then
        local server_pid=$(cat /tmp/atp-demo-test.pid)
        if kill -0 $server_pid 2>/dev/null; then
            kill $server_pid
            log_info "Demo server stopped"
        fi
        rm -f /tmp/atp-demo-test.pid
    fi
}

test_server_health() {
    log_info "Testing server health endpoint..."
    
    local response=$(curl -s -w "%{http_code}" http://localhost:$DEMO_PORT/api/health)
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        log_success "Health endpoint returned 200 OK"
        
        # Check if response contains expected fields
        if echo "$body" | grep -q '"status".*"healthy"' && echo "$body" | grep -q '"demo_mode".*true'; then
            log_success "Health response contains expected fields"
            add_test_result "✅ Health Endpoint: PASS"
        else
            log_warning "Health response missing expected fields"
            add_test_result "⚠️  Health Endpoint: PARTIAL"
        fi
    else
        log_error "Health endpoint returned $http_code"
        add_test_result "❌ Health Endpoint: FAIL"
    fi
}

test_demo_status() {
    log_info "Testing demo status endpoint..."
    
    local response=$(curl -s -w "%{http_code}" http://localhost:$DEMO_PORT/api/demo/status)
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        log_success "Demo status endpoint returned 200 OK"
        
        if echo "$body" | grep -q '"demo_active".*true'; then
            log_success "Demo status shows active"
            add_test_result "✅ Demo Status: PASS"
        else
            log_warning "Demo status not active"
            add_test_result "⚠️  Demo Status: PARTIAL"
        fi
    else
        log_error "Demo status endpoint returned $http_code"
        add_test_result "❌ Demo Status: FAIL"
    fi
}

test_static_files() {
    log_info "Testing static file serving..."
    
    # Test main HTML file
    local html_response=$(curl -s -w "%{http_code}" http://localhost:$DEMO_PORT/)
    local html_code="${html_response: -3}"
    
    if [ "$html_code" = "200" ]; then
        log_success "Main HTML page loads successfully"
        
        # Check if HTML contains expected content
        local html_body="${html_response%???}"
        if echo "$html_body" | grep -q "Agent Trust Protocol" && echo "$html_body" | grep -q "Interactive Demo"; then
            log_success "HTML contains expected demo content"
            add_test_result "✅ Static Files: PASS"
        else
            log_warning "HTML missing expected content"
            add_test_result "⚠️  Static Files: PARTIAL"
        fi
    else
        log_error "Main HTML page returned $html_code"
        add_test_result "❌ Static Files: FAIL"
    fi
    
    # Test JavaScript file
    local js_response=$(curl -s -w "%{http_code}" http://localhost:$DEMO_PORT/demo.js)
    local js_code="${js_response: -3}"
    
    if [ "$js_code" = "200" ]; then
        log_success "JavaScript file loads successfully"
    else
        log_warning "JavaScript file returned $js_code"
    fi
}

test_cors_headers() {
    log_info "Testing CORS headers..."
    
    local cors_response=$(curl -s -I -X OPTIONS http://localhost:$DEMO_PORT/api/health)
    
    if echo "$cors_response" | grep -qi "access-control-allow-origin"; then
        log_success "CORS headers present"
        add_test_result "✅ CORS Headers: PASS"
    else
        log_warning "CORS headers missing"
        add_test_result "⚠️  CORS Headers: PARTIAL"
    fi
}

test_error_handling() {
    log_info "Testing error handling..."
    
    # Test 404 for non-existent file
    local not_found_response=$(curl -s -w "%{http_code}" http://localhost:$DEMO_PORT/nonexistent.html)
    local not_found_code="${not_found_response: -3}"
    
    if [ "$not_found_code" = "404" ]; then
        log_success "404 error handling works correctly"
        add_test_result "✅ Error Handling: PASS"
    else
        log_warning "404 error handling returned $not_found_code"
        add_test_result "⚠️  Error Handling: PARTIAL"
    fi
    
    # Test 404 for non-existent API endpoint
    local api_not_found_response=$(curl -s -w "%{http_code}" http://localhost:$DEMO_PORT/api/nonexistent)
    local api_not_found_code="${api_not_found_response: -3}"
    
    if [ "$api_not_found_code" = "404" ]; then
        log_success "API 404 error handling works correctly"
    else
        log_warning "API 404 error handling returned $api_not_found_code"
    fi
}

test_performance() {
    log_info "Testing demo performance..."
    
    # Test response time for health endpoint
    local start_time=$(date +%s%N)
    curl -s http://localhost:$DEMO_PORT/api/health > /dev/null
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    if [ $response_time -lt 1000 ]; then
        log_success "Health endpoint response time: ${response_time}ms (Good)"
        add_test_result "✅ Performance: PASS"
    elif [ $response_time -lt 5000 ]; then
        log_warning "Health endpoint response time: ${response_time}ms (Acceptable)"
        add_test_result "⚠️  Performance: PARTIAL"
    else
        log_error "Health endpoint response time: ${response_time}ms (Slow)"
        add_test_result "❌ Performance: FAIL"
    fi
}

test_security() {
    log_info "Testing security features..."
    
    # Test directory traversal protection
    local traversal_response=$(curl -s -w "%{http_code}" http://localhost:$DEMO_PORT/../package.json)
    local traversal_code="${traversal_response: -3}"
    
    if [ "$traversal_code" = "403" ] || [ "$traversal_code" = "404" ]; then
        log_success "Directory traversal protection works"
        add_test_result "✅ Security: PASS"
    else
        log_error "Directory traversal protection failed (returned $traversal_code)"
        add_test_result "❌ Security: FAIL"
    fi
}

run_comprehensive_tests() {
    log_info "Running comprehensive demo tests..."
    echo
    
    # Start demo server
    if ! start_demo_server; then
        log_error "Failed to start demo server for testing"
        exit 1
    fi
    
    # Run all tests
    test_server_health
    echo
    test_demo_status
    echo
    test_static_files
    echo
    test_cors_headers
    echo
    test_error_handling
    echo
    test_performance
    echo
    test_security
    echo
    
    # Stop demo server
    stop_demo_server
}

show_test_results() {
    echo
    log_header "🧪 Demo Test Results Summary"
    log_header "═══════════════════════════════════════"
    echo
    
    local pass_count=0
    local partial_count=0
    local fail_count=0
    
    for result in "${TEST_RESULTS[@]}"; do
        echo "  $result"
        if [[ $result == *"PASS"* ]]; then
            ((pass_count++))
        elif [[ $result == *"PARTIAL"* ]]; then
            ((partial_count++))
        elif [[ $result == *"FAIL"* ]]; then
            ((fail_count++))
        fi
    done
    
    echo
    log_header "Test Summary:"
    log_success "Passed: $pass_count"
    if [ $partial_count -gt 0 ]; then
        log_warning "Partial: $partial_count"
    fi
    if [ $fail_count -gt 0 ]; then
        log_error "Failed: $fail_count"
    fi
    
    echo
    if [ $fail_count -eq 0 ]; then
        log_success "🎉 Demo environment is ready for Fortune 500 demonstrations!"
        echo
        log_info "Demo can be started with:"
        echo "  cd demo && node server.js"
        echo "  or"
        echo "  cd demo && ./start-demo.sh"
    else
        log_error "❌ Demo environment has issues that need to be addressed"
        exit 1
    fi
}

cleanup() {
    log_info "Cleaning up test environment..."
    stop_demo_server
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
show_banner

# Check prerequisites
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 16+ to run tests."
    exit 1
fi

if ! command -v curl &> /dev/null; then
    log_error "curl is not installed. Please install curl to run tests."
    exit 1
fi

# Run tests
run_comprehensive_tests
show_test_results