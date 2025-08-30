#!/bin/bash

# ATP™ SDK Publishing Script
# This script handles the publishing process to npm

set -e

# Configuration
DEFAULT_REGISTRY="https://registry.npmjs.org/"
PACKAGE_NAME="@atp/sdk"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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

# Parse command line arguments
RELEASE_TYPE="patch"
TAG="latest"
DRY_RUN=false
SKIP_TESTS=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --type|-t)
      RELEASE_TYPE="$2"
      shift 2
      ;;
    --tag)
      TAG="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -t, --type TYPE     Release type: patch, minor, major, prerelease (default: patch)"
      echo "  --tag TAG          NPM tag for publication (default: latest)"
      echo "  --dry-run          Perform a dry run without actually publishing"
      echo "  --skip-tests       Skip running tests (not recommended)"
      echo "  -h, --help         Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0 --type minor                    # Publish a minor version"
      echo "  $0 --type prerelease --tag beta    # Publish a beta prerelease"
      echo "  $0 --dry-run                       # Test the publish process"
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      exit 1
      ;;
  esac
done

log_info "Starting ATP™ SDK publishing process..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  log_error "package.json not found. Please run this script from the SDK root directory."
  exit 1
fi

# Check if the package name matches
CURRENT_PACKAGE=$(node -p "require('./package.json').name")
if [ "$CURRENT_PACKAGE" != "$PACKAGE_NAME" ]; then
  log_error "Package name mismatch. Expected $PACKAGE_NAME, found $CURRENT_PACKAGE"
  exit 1
fi

# Check npm authentication
log_info "Checking npm authentication..."
if ! npm whoami > /dev/null 2>&1; then
  log_error "Not logged in to npm. Please run 'npm login' first."
  exit 1
fi

NPM_USER=$(npm whoami)
log_success "Logged in as: $NPM_USER"

# Check if we can publish to the package
log_info "Checking publish permissions..."
if ! npm access list packages | grep -q "$PACKAGE_NAME" > /dev/null 2>&1; then
  log_warning "Cannot verify publish permissions. Proceeding anyway..."
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
log_info "Current version: $CURRENT_VERSION"

# Calculate new version
if [ "$RELEASE_TYPE" = "prerelease" ]; then
  NEW_VERSION=$(npm version --no-git-tag-version prerelease --preid=${TAG} 2>/dev/null || echo "error")
else
  NEW_VERSION=$(npm version --no-git-tag-version "$RELEASE_TYPE" 2>/dev/null || echo "error")
fi

if [ "$NEW_VERSION" = "error" ]; then
  log_error "Failed to calculate new version for release type: $RELEASE_TYPE"
  exit 1
fi

NEW_VERSION=${NEW_VERSION#v} # Remove 'v' prefix
log_info "New version will be: $NEW_VERSION"

# Revert version change for now
git checkout package.json 2>/dev/null || npm version --no-git-tag-version "$CURRENT_VERSION" > /dev/null

# Run build process (unless dry run)
if [ "$DRY_RUN" = false ]; then
  if [ "$SKIP_TESTS" = false ]; then
    log_info "Running full build process..."
    ./scripts/build.sh
  else
    log_warning "Skipping tests as requested..."
    npm run clean
    npm run build
  fi
else
  log_info "Dry run mode - skipping build"
fi

# Update version for real
log_info "Updating version to $NEW_VERSION..."
if [ "$RELEASE_TYPE" = "prerelease" ]; then
  npm version --no-git-tag-version prerelease --preid=${TAG} > /dev/null
else
  npm version --no-git-tag-version "$RELEASE_TYPE" > /dev/null
fi

# Show what will be published
log_info "Package contents that will be published:"
npm pack --dry-run

echo ""
log_info "Publishing configuration:"
echo "  Package: $PACKAGE_NAME"
echo "  Version: $NEW_VERSION"
echo "  Tag: $TAG"
echo "  Registry: $DEFAULT_REGISTRY"
echo "  User: $NPM_USER"
echo ""

# Confirm publication (unless dry run)
if [ "$DRY_RUN" = false ]; then
  read -p "Do you want to proceed with publishing? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Publishing cancelled by user"
    # Revert version change
    git checkout package.json 2>/dev/null || npm version --no-git-tag-version "$CURRENT_VERSION" > /dev/null
    exit 0
  fi
fi

# Publish to npm
if [ "$DRY_RUN" = true ]; then
  log_info "DRY RUN: Would publish with command:"
  echo "npm publish --tag $TAG --registry $DEFAULT_REGISTRY"
  log_success "Dry run completed successfully!"
else
  log_info "Publishing to npm..."
  
  if [ "$TAG" = "latest" ]; then
    npm publish --registry "$DEFAULT_REGISTRY"
  else
    npm publish --tag "$TAG" --registry "$DEFAULT_REGISTRY"
  fi
  
  if [ $? -eq 0 ]; then
    log_success "Successfully published $PACKAGE_NAME@$NEW_VERSION"
    
    # Create git tag
    git tag "v$NEW_VERSION"
    log_success "Created git tag: v$NEW_VERSION"
    
    # Show next steps
    echo ""
    log_info "Next steps:"
    echo "  1. Push the git tag: git push origin v$NEW_VERSION"
    echo "  2. Create a GitHub release: https://github.com/your-org/agent-trust-protocol/releases/new"
    echo "  3. Update CHANGELOG.md with release notes"
    echo "  4. Verify the package: npm view $PACKAGE_NAME@$NEW_VERSION"
    echo ""
    log_success "Package published successfully! 🎉"
    echo ""
    echo "📦 NPM: https://www.npmjs.com/package/$PACKAGE_NAME"
    echo "📋 Install: npm install $PACKAGE_NAME@$NEW_VERSION"
    
  else
    log_error "Failed to publish package"
    # Revert version change
    git checkout package.json 2>/dev/null || npm version --no-git-tag-version "$CURRENT_VERSION" > /dev/null
    exit 1
  fi
fi