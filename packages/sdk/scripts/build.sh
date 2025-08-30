#!/bin/bash

# ATP™ SDK Build Script
# This script builds the SDK for production release

set -e

echo "🏗️  Building ATP™ SDK..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
npm run clean

# Run linting
echo "🔍 Running linter..."
npm run lint:check

# Run formatting check
echo "✨ Checking code formatting..."
npm run format:check

# Run tests with coverage
echo "🧪 Running tests with coverage..."
npm run test:coverage

# Check test coverage thresholds
echo "📊 Checking coverage thresholds..."
COVERAGE_LINES=$(grep -oP '"lines":{"total":\d+,"covered":\d+,"skipped":\d+,"pct":\K\d+\.\d+' coverage/coverage-summary.json)
if (( $(echo "$COVERAGE_LINES < 80" | bc -l) )); then
  echo "❌ Line coverage is below 80%: $COVERAGE_LINES%"
  exit 1
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build:types
npm run build:esm
npm run build:cjs

# Validate build outputs
echo "✅ Validating build outputs..."
if [ ! -f "dist/index.js" ]; then
  echo "❌ Main build file missing: dist/index.js"
  exit 1
fi

if [ ! -f "dist/index.cjs" ]; then
  echo "❌ CommonJS build file missing: dist/index.cjs"
  exit 1
fi

if [ ! -f "dist/index.d.ts" ]; then
  echo "❌ TypeScript declarations missing: dist/index.d.ts"
  exit 1
fi

# Test imports
echo "🔍 Testing module imports..."
node -e "
  import('./dist/index.js')
    .then(() => console.log('✅ ESM import successful'))
    .catch(err => { console.error('❌ ESM import failed:', err.message); process.exit(1); })
"

node -e "
  try {
    require('./dist/index.cjs');
    console.log('✅ CommonJS import successful');
  } catch (err) {
    console.error('❌ CommonJS import failed:', err.message);
    process.exit(1);
  }
"

# Generate documentation
echo "📚 Generating documentation..."
npm run docs

# Validate package
echo "📦 Validating package..."
npm pack --dry-run

# Get package size
PACKAGE_SIZE=$(npm pack --dry-run 2>&1 | grep "npm notice package size" | grep -oP '\d+\.\d+\s*\w+' || echo "unknown")
echo "📏 Package size: $PACKAGE_SIZE"

# Check for large files
echo "🔍 Checking for unexpectedly large files..."
find dist -type f -size +100k -exec ls -lh {} \; | while read line; do
  echo "⚠️  Large file found: $line"
done

echo "✅ Build completed successfully!"
echo ""
echo "📋 Build Summary:"
echo "  - Tests: ✅ Passed with $COVERAGE_LINES% coverage"
echo "  - Linting: ✅ Passed"
echo "  - TypeScript: ✅ Compiled"
echo "  - Documentation: ✅ Generated"
echo "  - Package size: $PACKAGE_SIZE"
echo ""
echo "🚀 Ready for publishing!"