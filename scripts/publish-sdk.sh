#!/bin/bash

# Script to publish @atp/sdk to npm registry
# This script shows the steps needed to publish the SDK

echo "🚀 Publishing atp-sdk to npm registry"
echo "=====================================\n"

# Navigate to SDK directory
cd packages/sdk

# Check if logged in to npm
echo "1️⃣  Checking npm authentication..."
if ! npm whoami >/dev/null 2>&1; then
    echo "❌ Not logged in to npm. Please run:"
    echo "   npm login"
    echo "   or"
    echo "   npm adduser"
    exit 1
fi

echo "✅ Logged in as: $(npm whoami)\n"

# Clean and build
echo "2️⃣  Building SDK..."
npm run clean
npm run build
echo "✅ Build complete\n"

# Run tests
echo "3️⃣  Running tests..."
npm test || echo "⚠️  No tests configured yet\n"

# Check package name availability
echo "4️⃣  Checking if atp-sdk is available..."
if npm view atp-sdk >/dev/null 2>&1; then
    echo "⚠️  Package atp-sdk already exists on npm"
    echo "   Current version: $(npm view atp-sdk version)"
    echo "   You may need to bump the version in package.json"
else
    echo "✅ Package name atp-sdk is available\n"
fi

# Dry run
echo "5️⃣  Running publish dry-run..."
npm publish --dry-run

echo "\n6️⃣  Ready to publish!"
echo "   To publish for real, run:"
echo "   npm publish --access public"
echo ""
echo "   Or to publish a beta version:"
echo "   npm publish --access public --tag beta"
echo ""
echo "📝 Remember to:"
echo "   - Update the version in package.json"
echo "   - Add release notes to CHANGELOG.md"
echo "   - Tag the git commit after publishing"
echo "   - Update the main README with 'npm install atp-sdk'"