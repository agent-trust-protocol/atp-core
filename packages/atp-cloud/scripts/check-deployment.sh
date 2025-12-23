#!/bin/bash
# ATP Cloud Deployment Check Script
# ⚠️  INTERNAL TESTING ONLY - NOT FOR PRODUCTION USE

set -e

echo "🔐 ATP Cloud Deployment Check"
echo "⚠️  INTERNAL TESTING ONLY - NOT FOR PRODUCTION USE"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is not installed${NC}"
    exit 1
fi

# Service endpoints
declare -A SERVICES=(
    ["Cloud Gateway"]="http://localhost:3010/health"
    ["Tenant Service"]="http://localhost:3011/health"
    ["Analytics Service"]="http://localhost:3012/health"
    ["Cloud Dashboard"]="http://localhost:3013"
)

# Database endpoints
declare -A DATABASES=(
    ["MongoDB"]="mongodb://localhost:27017"
    ["Redis"]="redis://localhost:6379"
)

# Docker containers
declare -A CONTAINERS=(
    ["atp-cloud-cloud-gateway-1"]="Cloud Gateway"
    ["atp-cloud-tenant-service-1"]="Tenant Service"
    ["atp-cloud-analytics-service-1"]="Analytics Service"
    ["atp-cloud-cloud-dashboard-1"]="Cloud Dashboard"
    ["atp-cloud-mongodb-1"]="MongoDB"
    ["atp-cloud-redis-1"]="Redis"
)

check_service_health() {
    local service_name="$1"
    local url="$2"
    local timeout=5
    
    echo -n "  $service_name: "
    
    if curl -f -s --max-time $timeout "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Healthy${NC}"
        return 0
    else
        echo -e "${RED}✗ Unhealthy${NC}"
        return 1
    fi
}

check_container_status() {
    local container="$1"
    local service="$2"
    
    echo -n "  $service: "
    
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container.*Up"; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        if docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep -q "$container"; then
            echo -e "${RED}✗ Stopped${NC}"
        else
            echo -e "${RED}✗ Not found${NC}"
        fi
        return 1
    fi
}

check_database_connection() {
    local db_name="$1"
    local connection_string="$2"
    
    echo -n "  $db_name: "
    
    case $db_name in
        "MongoDB")
            if mongosh --quiet --eval "quit()" "$connection_string" > /dev/null 2>&1; then
                echo -e "${GREEN}✓ Connected${NC}"
                return 0
            else
                echo -e "${RED}✗ Connection failed${NC}"
                return 1
            fi
            ;;
        "Redis")
            if redis-cli -h localhost -p 6379 ping > /dev/null 2>&1; then
                echo -e "${GREEN}✓ Connected${NC}"
                return 0
            else
                echo -e "${RED}✗ Connection failed${NC}"
                return 1
            fi
            ;;
    esac
}

show_docker_stats() {
    echo -e "${BLUE}Docker Container Stats:${NC}"
    
    if command -v docker &> /dev/null; then
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep "atp-cloud" || echo "  No ATP Cloud containers running"
    else
        echo "  Docker not available"
    fi
}

show_logs_info() {
    echo ""
    echo -e "${BLUE}Log Commands:${NC}"
    echo "  All services:     docker-compose -f docker/docker-compose.yml logs"
    echo "  Cloud Gateway:    docker-compose -f docker/docker-compose.yml logs cloud-gateway"
    echo "  Tenant Service:   docker-compose -f docker/docker-compose.yml logs tenant-service"
    echo "  Analytics:        docker-compose -f docker/docker-compose.yml logs analytics-service"
    echo "  Dashboard:        docker-compose -f docker/docker-compose.yml logs cloud-dashboard"
    echo "  Follow logs:      docker-compose -f docker/docker-compose.yml logs -f"
}

main() {
    local healthy_services=0
    local total_services=${#SERVICES[@]}
    local running_containers=0
    local total_containers=${#CONTAINERS[@]}
    
    echo -e "${BLUE}Checking ATP Cloud Services:${NC}"
    for service in "${!SERVICES[@]}"; do
        if check_service_health "$service" "${SERVICES[$service]}"; then
            ((healthy_services++))
        fi
    done
    
    echo ""
    echo -e "${BLUE}Checking Docker Containers:${NC}"
    for container in "${!CONTAINERS[@]}"; do
        if check_container_status "$container" "${CONTAINERS[$container]}"; then
            ((running_containers++))
        fi
    done
    
    echo ""
    echo -e "${BLUE}Checking Database Connections:${NC}"
    for db in "${!DATABASES[@]}"; do
        check_database_connection "$db" "${DATABASES[$db]}" || true
    done
    
    echo ""
    show_docker_stats
    
    echo ""
    echo -e "${BLUE}Summary:${NC}"
    echo "  Services Health: $healthy_services/$total_services healthy"
    echo "  Containers:      $running_containers/$total_containers running"
    
    if [ $healthy_services -eq $total_services ] && [ $running_containers -eq $total_containers ]; then
        echo ""
        echo -e "${GREEN}🎉 ATP Cloud is running successfully!${NC}"
        echo ""
        echo "Access URLs:"
        echo "  Cloud Dashboard:  http://localhost:3013"
        echo "  Cloud Gateway:    http://localhost:3010"
        echo "  API Explorer:     http://localhost:3010/api"
        echo ""
        show_logs_info
        exit 0
    else
        echo ""
        echo -e "${RED}⚠️  Some services are not healthy${NC}"
        echo ""
        show_logs_info
        echo ""
        echo "Troubleshooting:"
        echo "  1. Check logs for errors"
        echo "  2. Ensure all dependencies are installed"
        echo "  3. Try redeploying: ./scripts/deploy-cloud.sh"
        echo "  4. Reset environment: docker-compose -f docker/docker-compose.yml down && ./scripts/deploy-cloud.sh"
        exit 1
    fi
}

main