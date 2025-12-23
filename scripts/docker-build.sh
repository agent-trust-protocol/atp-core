#!/bin/bash

# Production-ready Docker build script for Agent Trust Protocol
# Supports multiple build strategies and platforms

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default values
BUILD_TYPE="alpine"
PLATFORM=""
SERVICES="all"
PUSH_IMAGES=false
REGISTRY=""
PARALLEL_BUILDS=true

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Build Docker images for Agent Trust Protocol services

OPTIONS:
    --type TYPE         Build type: alpine (default), debian, native
    --platform PLATFORM Target platform: linux/amd64, linux/arm64, or both
    --services SERVICES Services to build: all (default), identity, vc, permission, rpc
    --push              Push images to registry after building
    --registry URL      Docker registry URL (required if --push is used)
    --sequential        Build services sequentially instead of parallel
    --help              Show this help message

EXAMPLES:
    $0                                    # Build all services with Alpine (default)
    $0 --type debian --platform linux/amd64   # Build with Debian base for x86_64
    $0 --services identity,vc --push --registry my-registry.com

SUPPORTED BUILD TYPES:
    alpine   - Alpine Linux with comprehensive build tools (recommended)
    debian   - Debian base for maximum compatibility
    native   - Node.js native SQLite (Node.js 22+ required)

EOF
}

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --type)
            BUILD_TYPE="$2"
            shift 2
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --services)
            SERVICES="$2"
            shift 2
            ;;
        --push)
            PUSH_IMAGES=true
            shift
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --sequential)
            PARALLEL_BUILDS=false
            shift
            ;;
        --help)
            print_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Validate build type
case $BUILD_TYPE in
    alpine|debian|native)
        ;;
    *)
        log_error "Invalid build type: $BUILD_TYPE"
        log_error "Supported types: alpine, debian, native"
        exit 1
        ;;
esac

# Validate registry if push is enabled
if [ "$PUSH_IMAGES" = true ] && [ -z "$REGISTRY" ]; then
    log_error "Registry URL is required when --push is enabled"
    exit 1
fi

# Set platform arguments
PLATFORM_ARGS=""
if [ -n "$PLATFORM" ]; then
    PLATFORM_ARGS="--platform $PLATFORM"
fi

# Determine which services to build
if [ "$SERVICES" = "all" ]; then
    SERVICE_LIST=("identity-service" "vc-service" "permission-service" "rpc-gateway")
else
    IFS=',' read -ra SERVICE_LIST <<< "$SERVICES"
fi

log "Starting Docker build process..."
log "Build type: $BUILD_TYPE"
log "Platform: ${PLATFORM:-auto-detect}"
log "Services: ${SERVICE_LIST[*]}"
log "Parallel builds: $PARALLEL_BUILDS"

# Change to project root
cd "$PROJECT_ROOT"

# Ensure we have the latest code built
log "Building TypeScript code..."
npm run build || {
    log_error "TypeScript build failed"
    exit 1
}

# Function to build a single service
build_service() {
    local service=$1
    local dockerfile_suffix=""
    
    case $BUILD_TYPE in
        alpine)
            dockerfile_suffix="-improved"
            ;;
        debian)
            dockerfile_suffix="-debian"
            ;;
        native)
            dockerfile_suffix="-native"
            ;;
    esac
    
    local dockerfile="docker/${service}${dockerfile_suffix}.Dockerfile"
    local image_name="atp-${service}"
    
    if [ -n "$REGISTRY" ]; then
        image_name="${REGISTRY}/${image_name}"
    fi
    
    log "Building $service..."
    
    if [ -f "$dockerfile" ]; then
        docker build $PLATFORM_ARGS \
            -f "$dockerfile" \
            -t "${image_name}:latest" \
            -t "${image_name}:${BUILD_TYPE}" \
            . || {
            log_error "Failed to build $service"
            return 1
        }
        
        log_success "Built $service successfully"
        
        if [ "$PUSH_IMAGES" = true ]; then
            log "Pushing $service to registry..."
            docker push "${image_name}:latest" || {
                log_error "Failed to push $service"
                return 1
            }
            docker push "${image_name}:${BUILD_TYPE}" || {
                log_error "Failed to push $service"
                return 1
            }
            log_success "Pushed $service successfully"
        fi
    else
        log_warn "Dockerfile not found: $dockerfile"
        return 1
    fi
}

# Build services
if [ "$PARALLEL_BUILDS" = true ]; then
    log "Building services in parallel..."
    
    # Start all builds in background
    pids=()
    for service in "${SERVICE_LIST[@]}"; do
        build_service "$service" &
        pids+=($!)
    done
    
    # Wait for all builds to complete
    failed_builds=()
    for i in "${!pids[@]}"; do
        if ! wait "${pids[$i]}"; then
            failed_builds+=("${SERVICE_LIST[$i]}")
        fi
    done
    
    if [ ${#failed_builds[@]} -gt 0 ]; then
        log_error "Failed to build: ${failed_builds[*]}"
        exit 1
    fi
else
    log "Building services sequentially..."
    
    for service in "${SERVICE_LIST[@]}"; do
        build_service "$service" || {
            log_error "Build process stopped due to failure"
            exit 1
        }
    done
fi

log_success "All Docker builds completed successfully!"

# Show built images
log "Built images:"
for service in "${SERVICE_LIST[@]}"; do
    image_name="atp-${service}"
    if [ -n "$REGISTRY" ]; then
        image_name="${REGISTRY}/${image_name}"
    fi
    echo "  - ${image_name}:latest"
    echo "  - ${image_name}:${BUILD_TYPE}"
done

log "Docker build process completed successfully!"
log ""
log "Next steps:"
log "1. Start services: docker-compose -f docker-compose-improved.yml up -d"
log "2. Check health: curl http://localhost:3001/health"
log "3. Test APIs: curl http://localhost:3001/identity/register -X POST"