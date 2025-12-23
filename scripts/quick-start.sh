#!/bin/bash

# ATP™ Quick Start Script
# =====================
# Get developers up and running with ATP™ in 5 minutes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}🚀 Agent Trust Protocol™ - Quick Start${NC}"
echo -e "${CYAN}=====================================${NC}"
echo ""

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
    echo -e "${BOLD}${BLUE}📋 $1${NC}"
}

# Check prerequisites
log_step "Step 1: Checking Prerequisites"

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    log_error "Docker Compose is not available. Please install Docker Desktop with Compose v2."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    log_warning "Node.js not found. Some features may not work."
else
    NODE_VERSION=$(node --version)
    log_success "Node.js $NODE_VERSION detected"
fi

log_success "Docker and Docker Compose are available"

# Setup project
log_step "Step 2: Setting Up ATP™ Environment"

# Check if we're in the right directory
if [ ! -f "docker-compose.simple.yml" ]; then
    log_error "Please run this script from the ATP™ root directory"
    exit 1
fi

log_info "Creating necessary directories..."
mkdir -p logs monitoring nginx/ssl

# Start infrastructure services
log_step "Step 3: Starting ATP™ Infrastructure"

log_info "Starting PostgreSQL, IPFS, and Prometheus..."
docker compose -f docker-compose.simple.yml up -d

# Wait for services to be ready
log_info "Waiting for services to be ready..."
sleep 10

# Check service health
log_info "Checking service health..."

# Check PostgreSQL
if docker compose -f docker-compose.simple.yml exec -T postgres pg_isready -U atp_user -d atp_staging > /dev/null 2>&1; then
    log_success "PostgreSQL is ready"
else
    log_warning "PostgreSQL is starting up... (this is normal)"
fi

# Check IPFS
if curl -sf http://localhost:5001/api/v0/version > /dev/null 2>&1; then
    log_success "IPFS is ready"
else
    log_warning "IPFS is starting up... (this is normal)"
fi

# Check Prometheus
if curl -sf http://localhost:9090/-/healthy > /dev/null 2>&1; then
    log_success "Prometheus is ready"
else
    log_warning "Prometheus is starting up... (this is normal)"
fi

# Test basic functionality
log_step "Step 4: Testing Basic Functionality"

# Wait a bit more for services to fully start
sleep 5

# Test database
log_info "Testing database connectivity..."
if docker compose -f docker-compose.simple.yml exec -T postgres psql -U atp_user -d atp_staging -c "SELECT 'ATP™ Ready!' as status;" > /dev/null 2>&1; then
    log_success "Database is operational"
else
    log_warning "Database is still initializing..."
fi

# Test IPFS storage
log_info "Testing IPFS storage..."
TEST_DATA="ATP™ Quick Start Test $(date)"
if TEST_HASH=$(echo "$TEST_DATA" | curl -sf -F "file=@-" http://localhost:5001/api/v0/add 2>/dev/null | grep -o '"Hash":"[^"]*"' | cut -d'"' -f4); then
    log_success "IPFS storage working - stored data with hash: $TEST_HASH"
else
    log_warning "IPFS is still starting up..."
fi

# Create example configuration
log_step "Step 5: Creating Developer Configuration"

cat > .env.development << 'EOF'
# ATP™ Development Environment
NODE_ENV=development
LOG_LEVEL=info

# Service URLs
IDENTITY_SERVICE_URL=http://localhost:3001
VC_SERVICE_URL=http://localhost:3002
PERMISSION_SERVICE_URL=http://localhost:3003
RPC_GATEWAY_URL=http://localhost:3000
AUDIT_SERVICE_URL=http://localhost:3005
PROTOCOLS_SERVICE_URL=http://localhost:3006

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=atp_staging
POSTGRES_USER=atp_user
POSTGRES_PASSWORD=staging-password-change-in-production

# IPFS
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY_URL=http://localhost:8080

# Security (Development Only - Change in Production!)
AUDIT_ENCRYPTION_KEY=dev-encryption-key-32-characters
JWT_SECRET=development-jwt-secret-change-me

# Feature Flags
ENABLE_METRICS=true
ENABLE_AUDIT_ENCRYPTION=true
ENABLE_IPFS_STORAGE=true
ENABLE_MTLS=false

# Monitoring
PROMETHEUS_URL=http://localhost:9090
EOF

log_success "Development configuration created (.env.development)"

# Create quick test script
cat > test-atp.sh << 'EOF'
#!/bin/bash

echo "🧪 ATP™ Quick Test Script"
echo "========================"

# Test 1: Check services
echo "1. Testing service health..."
curl -sf http://localhost:5432 > /dev/null && echo "  ✅ PostgreSQL responding" || echo "  ⚠️  PostgreSQL not ready"
curl -sf http://localhost:5001/api/v0/version > /dev/null && echo "  ✅ IPFS API responding" || echo "  ⚠️  IPFS not ready"
curl -sf http://localhost:9090/-/healthy > /dev/null && echo "  ✅ Prometheus responding" || echo "  ⚠️  Prometheus not ready"

# Test 2: Database query
echo "2. Testing database..."
if docker compose -f docker-compose.simple.yml exec -T postgres psql -U atp_user -d atp_staging -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema LIKE 'atp_%';" 2>/dev/null | grep -q "[0-9]"; then
    echo "  ✅ Database schemas present"
else
    echo "  ⚠️  Database schemas not ready"
fi

# Test 3: IPFS storage
echo "3. Testing IPFS storage..."
TEST_HASH=$(echo "ATP™ Test $(date)" | curl -sf -F "file=@-" http://localhost:5001/api/v0/add 2>/dev/null | grep -o '"Hash":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TEST_HASH" ]; then
    echo "  ✅ IPFS storage working (Hash: $TEST_HASH)"
else
    echo "  ⚠️  IPFS storage not ready"
fi

echo ""
echo "🎉 Quick test complete!"
EOF

chmod +x test-atp.sh
log_success "Test script created (test-atp.sh)"

# Create example development files
mkdir -p examples/quick-start

cat > examples/quick-start/example-agent.js << 'EOF'
// ATP™ Example Agent - Basic Integration
// =====================================

const agentConfig = {
  name: 'My First ATP Agent',
  type: 'assistant',
  capabilities: ['chat', 'analysis']
};

const baseUrls = {
  identity: 'http://localhost:3001',
  gateway: 'http://localhost:3000',
  audit: 'http://localhost:3005'
};

// Example 1: Register Agent Identity
async function registerAgent() {
  try {
    const response = await fetch(`${baseUrls.identity}/identity/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: 'example-public-key-' + Date.now(),
        metadata: agentConfig
      })
    });

    const result = await response.json();
    console.log('✅ Agent registered:', result.data.did);
    return result.data;
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
  }
}

// Example 2: Log Agent Activity
async function logActivity(agentDid, action, details) {
  try {
    const response = await fetch(`${baseUrls.audit}/audit/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'example-agent',
        action: action,
        resource: 'agent-interaction',
        actor: agentDid,
        details: details
      })
    });

    const result = await response.json();
    console.log('✅ Activity logged:', result.event.id);
  } catch (error) {
    console.error('❌ Logging failed:', error.message);
  }
}

// Example 3: Check Gateway Status
async function checkGatewayStatus() {
  try {
    const response = await fetch(`${baseUrls.gateway}/health`);
    const result = await response.json();
    console.log('✅ Gateway status:', result.status);
    return result;
  } catch (error) {
    console.error('❌ Gateway check failed:', error.message);
  }
}

// Run example
async function runExample() {
  console.log('🚀 ATP™ Example Agent Starting...');
  
  // Check gateway
  await checkGatewayStatus();
  
  // Register agent
  const agent = await registerAgent();
  
  if (agent) {
    // Log some activities
    await logActivity(agent.did, 'agent-startup', { 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
    
    await logActivity(agent.did, 'example-task', {
      task: 'demonstrate-atp-integration',
      duration: 1000,
      success: true
    });
    
    console.log('🎉 Example complete! Check audit logs for recorded activities.');
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined') {
  module.exports = { registerAgent, logActivity, checkGatewayStatus };
}

// Run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  runExample();
}
EOF

log_success "Example agent created (examples/quick-start/example-agent.js)"

# Create package.json for examples
cat > examples/quick-start/package.json << 'EOF'
{
  "name": "atp-quick-start-examples",
  "version": "1.0.0",
  "description": "ATP™ Quick Start Examples",
  "type": "module",
  "scripts": {
    "test": "node example-agent.js",
    "demo": "node example-agent.js"
  },
  "dependencies": {
    "node-fetch": "^3.3.0"
  }
}
EOF

# Final status check
log_step "Step 6: Final Status Check"

echo ""
echo -e "${BOLD}${GREEN}🎉 ATP™ Quick Start Complete!${NC}"
echo ""
echo -e "${BOLD}📋 Your ATP™ Environment:${NC}"
echo -e "• PostgreSQL Database: ${GREEN}localhost:5432${NC}"
echo -e "• IPFS Storage: ${GREEN}localhost:5001 (API), localhost:8080 (Gateway)${NC}"
echo -e "• Prometheus Monitoring: ${GREEN}localhost:9090${NC}"
echo ""
echo -e "${BOLD}🔧 Configuration Files Created:${NC}"
echo -e "• ${CYAN}.env.development${NC} - Environment variables"
echo -e "• ${CYAN}test-atp.sh${NC} - Quick testing script"
echo -e "• ${CYAN}examples/quick-start/${NC} - Example code"
echo ""
echo -e "${BOLD}🚀 Next Steps:${NC}"
echo -e "1. Run ${CYAN}./test-atp.sh${NC} to test your setup"
echo -e "2. Check the developer guide: ${CYAN}docs/DEVELOPER_ONBOARDING.md${NC}"
echo -e "3. Try the example: ${CYAN}cd examples/quick-start && npm install && npm run demo${NC}"
echo -e "4. Build your first agent with ATP™!"
echo ""
echo -e "${BOLD}📚 Documentation:${NC}"
echo -e "• Developer Guide: ${CYAN}docs/DEVELOPER_ONBOARDING.md${NC}"
echo -e "• Architecture: ${CYAN}docs/architecture.md${NC}"
echo -e "• Security: ${CYAN}docs/security.md${NC}"
echo ""
echo -e "${BOLD}🔍 Monitoring & Debugging:${NC}"
echo -e "• View logs: ${CYAN}docker compose -f docker-compose.simple.yml logs${NC}"
echo -e "• Check status: ${CYAN}docker compose -f docker-compose.simple.yml ps${NC}"
echo -e "• Stop services: ${CYAN}docker compose -f docker-compose.simple.yml down${NC}"
echo ""
echo -e "${GREEN}Welcome to the ATP™ developer community! 🎊${NC}"
echo ""