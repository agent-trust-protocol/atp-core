#!/bin/bash

# 🛡️ Agent Trust Protocol™ - Demo Environment Launcher
# Quick start script for Fortune 500 demonstrations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
DEMO_PORT=3009
DEMO_MODE="interactive"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

show_banner() {
    echo
    log_header "🛡️  ═══════════════════════════════════════════════════════════════"
    log_header "    Agent Trust Protocol™ - Interactive Demo Environment"
    log_header "    World's First Quantum-Safe AI Agent Protocol"
    log_header "═══════════════════════════════════════════════════════════════"
    echo
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 16+ to run the demo."
        log_info "Download from: https://nodejs.org/"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 16 ]; then
        log_error "Node.js version 16+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    log_success "Node.js $(node --version) is available"
    
    # Check if port is available
    if lsof -Pi :$DEMO_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "Port $DEMO_PORT is already in use"
        log_info "The demo will attempt to use an alternative port"
        DEMO_PORT=$((DEMO_PORT + 1))
    fi
    
    log_success "Prerequisites check completed"
}

start_interactive_demo() {
    log_info "Starting ATP Interactive Demo..."
    
    cd "$SCRIPT_DIR"
    
    # Start the demo server
    log_info "Launching demo server on port $DEMO_PORT..."
    
    if [ "$DEMO_PORT" -ne 3009 ]; then
        node server.js --port $DEMO_PORT &
    else
        node server.js &
    fi
    
    local server_pid=$!
    
    # Wait for server to start
    log_info "Waiting for demo server to start..."
    sleep 3
    
    # Check if server is running
    if ! kill -0 $server_pid 2>/dev/null; then
        log_error "Failed to start demo server"
        exit 1
    fi
    
    log_success "Demo server started successfully (PID: $server_pid)"
    
    # Show access information
    echo
    log_header "🚀 ATP Demo Environment Ready!"
    echo
    log_info "Demo Access URLs:"
    echo "   Local:    http://localhost:$DEMO_PORT"
    echo "   Network:  http://$(hostname):$DEMO_PORT"
    echo
    log_info "Demo Features Available:"
    echo "   🔐 Quantum-Safe Signatures"
    echo "   🛡️  Trust Level System"
    echo "   📊 Real-time Monitoring"
    echo "   🔌 API Integration Testing"
    echo "   🏢 Enterprise Features"
    echo "   ⚡ Performance Benchmarks"
    echo
    log_info "Press Ctrl+C to stop the demo server"
    echo
    
    # Open browser (optional)
    if command -v open &> /dev/null; then
        log_info "Opening demo in default browser..."
        open "http://localhost:$DEMO_PORT" 2>/dev/null || true
    elif command -v xdg-open &> /dev/null; then
        log_info "Opening demo in default browser..."
        xdg-open "http://localhost:$DEMO_PORT" 2>/dev/null || true
    fi
    
    # Wait for server process
    wait $server_pid
}

start_docker_demo() {
    log_info "Starting ATP Demo with Docker..."
    
    cd "$SCRIPT_DIR"
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker to use this mode."
        log_info "Falling back to interactive mode..."
        start_interactive_demo
        return
    fi
    
    # Build and start demo container
    log_info "Building demo container..."
    docker build -t atp-demo . || {
        log_error "Failed to build demo container"
        exit 1
    }
    
    log_info "Starting demo container..."
    docker run --rm -p $DEMO_PORT:3009 --name atp-demo-container atp-demo &
    
    local container_pid=$!
    
    # Wait for container to start
    sleep 5
    
    log_success "Demo container started successfully"
    
    # Show access information
    echo
    log_header "🚀 ATP Demo Environment Ready (Docker)!"
    echo
    log_info "Demo Access URLs:"
    echo "   Local:    http://localhost:$DEMO_PORT"
    echo "   Network:  http://$(hostname):$DEMO_PORT"
    echo
    log_info "Press Ctrl+C to stop the demo container"
    echo
    
    # Wait for container process
    wait $container_pid
}

start_full_demo() {
    log_info "Starting Full ATP Demo Environment..."
    
    cd "$SCRIPT_DIR"
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed."
        log_info "Falling back to interactive mode..."
        start_interactive_demo
        return
    fi
    
    # Start full demo environment
    log_info "Starting full demo environment with Docker Compose..."
    docker-compose -f docker-compose.demo.yml --profile full-demo up --build
}

cleanup() {
    log_info "Shutting down demo environment..."
    
    # Kill any running demo processes
    pkill -f "node server.js" 2>/dev/null || true
    
    # Stop Docker containers if running
    docker stop atp-demo-container 2>/dev/null || true
    docker-compose -f docker-compose.demo.yml down 2>/dev/null || true
    
    log_success "Demo environment stopped"
    exit 0
}

show_help() {
    echo "🛡️ Agent Trust Protocol™ - Demo Environment Launcher"
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -m, --mode MODE     Demo mode: interactive, docker, full (default: interactive)"
    echo "  -p, --port PORT     Demo port (default: 3009)"
    echo "  -h, --help          Show this help message"
    echo
    echo "Demo Modes:"
    echo "  interactive         Lightweight Node.js demo server"
    echo "  docker              Demo running in Docker container"
    echo "  full                Full ATP environment with Docker Compose"
    echo
    echo "Examples:"
    echo "  $0                          # Start interactive demo"
    echo "  $0 --mode docker            # Start Docker demo"
    echo "  $0 --port 8080              # Start on custom port"
    echo "  $0 --mode full              # Start full environment"
    echo
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--mode)
            DEMO_MODE="$2"
            shift 2
            ;;
        -p|--port)
            DEMO_PORT="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate demo mode
case $DEMO_MODE in
    interactive|docker|full)
        ;;
    *)
        log_error "Invalid demo mode: $DEMO_MODE"
        log_info "Valid modes: interactive, docker, full"
        exit 1
        ;;
esac

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
show_banner
check_prerequisites

case $DEMO_MODE in
    interactive)
        start_interactive_demo
        ;;
    docker)
        start_docker_demo
        ;;
    full)
        start_full_demo
        ;;
esac