#!/bin/bash

# ATP™ NPM Publishing Script
# Publishes the Agent Trust Protocol packages to npm registry

set -e  # Exit on any error

echo "🛡️ Agent Trust Protocol™ - NPM Publishing Script"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check prerequisites
info "Checking prerequisites..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "packages" ]; then
    error "This script must be run from the ATP project root directory"
fi

# Check if npm is logged in
if ! npm whoami > /dev/null 2>&1; then
    warning "You are not logged in to npm"
    info "Please run: npm login"
    exit 1
fi

NPM_USER=$(npm whoami)
success "Logged in to npm as: $NPM_USER"

# Check if we have the correct permissions
info "Checking npm permissions..."

# Build all packages
info "Building all packages..."
npm run build || error "Build failed"
success "All packages built successfully"

# Run tests
info "Running tests..."
npm test || error "Tests failed"
success "All tests passed"

# Run linting
info "Running linting..."
npm run lint || error "Linting failed"
success "Linting passed"

# Show what will be published
info "Packages to be published:"
echo ""

PACKAGES=(
    "packages/shared"
    "packages/sdk"
    "packages/protocol-integrations"
    "packages/identity-service"
    "packages/vc-service"
    "packages/permission-service"
    "packages/rpc-gateway"
    "packages/audit-logger"
)

for package in "${PACKAGES[@]}"; do
    if [ -f "$package/package.json" ]; then
        NAME=$(node -p "require('./$package/package.json').name")
        VERSION=$(node -p "require('./$package/package.json').version")
        echo -e "  📦 ${BLUE}$NAME${NC}@${GREEN}$VERSION${NC}"
    fi
done

echo ""

# Ask for confirmation
read -p "Do you want to publish these packages to npm? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    warning "Publishing cancelled"
    exit 0
fi

# Dry run first
info "Performing dry run..."
for package in "${PACKAGES[@]}"; do
    if [ -f "$package/package.json" ]; then
        NAME=$(node -p "require('./$package/package.json').name")
        info "Dry run for $NAME..."
        
        cd "$package"
        npm publish --dry-run || error "Dry run failed for $NAME"
        cd - > /dev/null
        
        success "Dry run passed for $NAME"
    fi
done

success "All dry runs completed successfully"

# Final confirmation
echo ""
warning "This will publish packages to the public npm registry!"
read -p "Are you absolutely sure? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    warning "Publishing cancelled"
    exit 0
fi

# Publish packages in dependency order
info "Publishing packages to npm..."

# 1. Shared package (no dependencies)
info "Publishing @atp/shared..."
cd packages/shared
npm publish --access public || error "Failed to publish @atp/shared"
cd - > /dev/null
success "Published @atp/shared"

# Wait a moment for npm to process
sleep 2

# 2. SDK package (depends on shared)
info "Publishing @atp/sdk..."
cd packages/sdk
npm publish --access public || error "Failed to publish @atp/sdk"
cd - > /dev/null
success "Published @atp/sdk"

# 3. Protocol integrations (depends on shared)
info "Publishing @atp/protocol-integrations..."
cd packages/protocol-integrations
npm publish --access public || error "Failed to publish @atp/protocol-integrations"
cd - > /dev/null
success "Published @atp/protocol-integrations"

# 4. Services (depend on shared)
for service in identity-service vc-service permission-service rpc-gateway audit-logger; do
    info "Publishing @atp/$service..."
    cd "packages/$service"
    npm publish --access public || error "Failed to publish @atp/$service"
    cd - > /dev/null
    success "Published @atp/$service"
    sleep 1  # Brief pause between service publications
done

echo ""
success "🎉 All packages published successfully!"
echo ""

info "Packages are now available on npm:"
for package in "${PACKAGES[@]}"; do
    if [ -f "$package/package.json" ]; then
        NAME=$(node -p "require('./$package/package.json').name")
        VERSION=$(node -p "require('./$package/package.json').version")
        echo -e "  📦 https://www.npmjs.com/package/${NAME//@//}"
    fi
done

echo ""
info "Installation commands:"
echo "  npm install @atp/sdk          # Main SDK"
echo "  npm install @atp/shared       # Shared utilities"
echo "  npm install @atp/protocol-integrations  # MCP/A2A integrations"
echo ""

success "ATP™ packages are now live on npm! 🚀"
echo ""
info "Next steps:"
echo "  1. Update documentation with npm install instructions"
echo "  2. Create release notes on GitHub"
echo "  3. Announce on social media and Discord"
echo "  4. Update demo site with npm installation examples"