#!/bin/bash

echo "🚀 Agent Trust Protocol (ATP) Case Study Test Runner"
echo "====================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "standalone-test.ts" ]; then
    echo -e "${RED}Error: Please run this script from the atp-case-study directory${NC}"
    exit 1
fi

echo "Select test to run:"
echo "1) Standalone Test (No services required)"
echo "2) Comprehensive Test (Requires all ATP services)"
echo "3) Quick Demo (Shows basic agent interactions)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo -e "\n${GREEN}Running Standalone Test...${NC}\n"
        echo "This test demonstrates agent interactions without external services."
        echo ""
        
        # Navigate to advanced-agents example and run the collaborative demo
        cd ../advanced-agents
        
        if [ -f "src/collaborative-agents-demo.ts" ]; then
            echo -e "${YELLOW}Building and running collaborative agents demo...${NC}"
            npm run build 2>/dev/null || true
            npm run demo:collaborative 2>/dev/null || node dist/collaborative-agents-demo.js
        else
            echo -e "${RED}Demo files not found. Please ensure the examples are built.${NC}"
        fi
        ;;
        
    2)
        echo -e "\n${GREEN}Running Comprehensive Test...${NC}\n"
        echo -e "${YELLOW}Note: This requires all ATP services to be running.${NC}"
        echo "Start services with: npm run start:all (from root directory)"
        echo ""
        read -p "Are services running? (y/n): " confirm
        
        if [ "$confirm" = "y" ]; then
            cd ../advanced-agents
            npm run build 2>/dev/null || true
            npm run demo:all 2>/dev/null || node dist/index.js
        else
            echo -e "${YELLOW}Please start services first, then run this test again.${NC}"
        fi
        ;;
        
    3)
        echo -e "\n${GREEN}Running Quick Demo...${NC}\n"
        echo "This shows basic agent initialization and trust establishment."
        echo ""
        
        # Run simple agent examples
        cd ../simple-agent
        
        if [ -f "src/agent.ts" ]; then
            echo -e "${YELLOW}Building and running simple agent demo...${NC}"
            npm run build 2>/dev/null || true
            npm start 2>/dev/null || node dist/agent.js
        else
            echo -e "${RED}Simple agent demo not found.${NC}"
        fi
        ;;
        
    *)
        echo -e "${RED}Invalid choice. Please run again and select 1, 2, or 3.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Test execution complete!${NC}"
echo ""
echo "📊 For detailed results, check the console output above."
echo "📚 For more information, see README.md"