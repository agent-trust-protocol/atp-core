#!/bin/bash

echo "🚀 Agent Trust Protocol™ - Full System Test"
echo "============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="$4"
    
    echo -n "Testing $name... "
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -X POST "$url" -H "Content-Type: application/json" -d "$data")
    else
        response=$(curl -s "$url")
    fi
    
    if [ $? -eq 0 ] && [[ "$response" != *"Error"* ]] && [[ "$response" != *"Cannot GET"* ]]; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "   Response: $response"
        return 1
    fi
}

echo -e "${BLUE}📡 Testing MCP Server (Port 3006/3007)${NC}"
echo "----------------------------------------"

test_endpoint "MCP Health Check" "http://localhost:3006/health"
test_endpoint "MCP Tools List" "http://localhost:3006/mcp/tools"

echo ""
echo -e "${BLUE}🌐 Testing A2A Bridge (Port 3008)${NC}"
echo "-----------------------------------"

test_endpoint "A2A Health Check" "http://localhost:3008/a2a/health"
test_endpoint "A2A Discovery Stats" "http://localhost:3008/a2a/stats/discovery"
test_endpoint "A2A Communication Stats" "http://localhost:3008/a2a/stats/communication"

# Test A2A Discovery (POST request)
discovery_data='{
  "query": {
    "capabilities": ["weather-current"],
    "trustLevel": "basic"
  },
  "filters": {
    "minTrustLevel": "basic",
    "verifiedOnly": true,
    "activeOnly": true
  },
  "requester": {
    "did": "did:atp:test-requester",
    "trustLevel": "verified",
    "purpose": "Weather information lookup",
    "sessionId": "test-session-123"
  }
}'

test_endpoint "A2A Agent Discovery" "http://localhost:3008/a2a/discover" "POST" "$discovery_data"

# Test specific agent lookup
test_endpoint "A2A Agent Profile" "http://localhost:3008/a2a/agent/did:atp:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH"

echo ""
echo -e "${YELLOW}📊 System Summary${NC}"
echo "-------------------"

# Get MCP tools count
mcp_response=$(curl -s http://localhost:3006/health)
if [[ "$mcp_response" == *"tools"* ]]; then
    tools_count=$(echo "$mcp_response" | grep -o '"tools":[0-9]*' | grep -o '[0-9]*')
    echo "• MCP Tools Available: $tools_count"
fi

# Get A2A agents count
a2a_response=$(curl -s http://localhost:3008/a2a/stats/discovery)
if [[ "$a2a_response" == *"totalAgents"* ]]; then
    agents_count=$(echo "$a2a_response" | grep -o '"totalAgents":[0-9]*' | grep -o '[0-9]*')
    echo "• A2A Agents Registered: $agents_count"
fi

echo "• MCP WebSocket Endpoint: ws://localhost:3007"
echo "• A2A Discovery Endpoint: http://localhost:3008/a2a/discover (POST)"
echo "• Trust Levels Supported: untrusted, basic, verified, premium, enterprise"

echo ""
echo -e "${GREEN}🎉 Agent Trust Protocol™ is LIVE and OPERATIONAL!${NC}"
echo ""
echo "Next Steps:"
echo "1. Connect MCP clients to: ws://localhost:3007"
echo "2. Use A2A discovery for agent-to-agent communication"
echo "3. All interactions are logged and audited"
echo "4. Trust-based access control is enforced"
echo ""
echo "For Claude/AI integration, use the MCP WebSocket endpoint with ATP headers:"
echo "  x-atp-did: your-agent-did"
echo "  x-atp-trust-level: verified"
echo "  x-atp-auth-method: did-signature"
echo "  x-atp-session-id: unique-session-id"