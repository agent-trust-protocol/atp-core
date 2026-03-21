#!/bin/bash

# GitHub Organization Migration Script
# Updates all references from bigblackcoder/agent-trust-protocol to agent-trust-protocol/core

echo "🚀 Starting GitHub Organization Migration..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
OLD_REPO="bigblackcoder/agent-trust-protocol"
NEW_REPO="agent-trust-protocol/core"
OLD_URL="https://github.com/bigblackcoder/agent-trust-protocol"
NEW_URL="https://github.com/agent-trust-protocol/core"

# Count references before update
BEFORE_COUNT=$(grep -r "$OLD_REPO" . --include="*.md" --include="*.json" --include="*.yml" --include="*.yaml" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git 2>/dev/null | wc -l)
echo -e "${YELLOW}Found $BEFORE_COUNT references to update${NC}"

# Update all markdown files
echo -e "\n${GREEN}Updating Markdown files...${NC}"
find . -name "*.md" -type f ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/.git/*" -exec sed -i '' "s|$OLD_REPO|$NEW_REPO|g" {} \;
find . -name "*.md" -type f ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/.git/*" -exec sed -i '' "s|$OLD_URL|$NEW_URL|g" {} \;

# Update package.json files
echo -e "${GREEN}Updating package.json files...${NC}"
find . -name "package.json" -type f ! -path "*/node_modules/*" ! -path "*/.next/*" -exec sed -i '' "s|$OLD_REPO|$NEW_REPO|g" {} \;
find . -name "package.json" -type f ! -path "*/node_modules/*" ! -path "*/.next/*" -exec sed -i '' "s|$OLD_URL|$NEW_URL|g" {} \;

# Update TypeScript/JavaScript files
echo -e "${GREEN}Updating TypeScript/JavaScript files...${NC}"
find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -type f ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/.git/*" -exec sed -i '' "s|$OLD_REPO|$NEW_REPO|g" {} \;
find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -type f ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/.git/*" -exec sed -i '' "s|$OLD_URL|$NEW_URL|g" {} \;

# Update YAML files
echo -e "${GREEN}Updating YAML files...${NC}"
find . \( -name "*.yml" -o -name "*.yaml" \) -type f ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/.git/*" -exec sed -i '' "s|$OLD_REPO|$NEW_REPO|g" {} \;

# Update git remote origin
echo -e "\n${GREEN}Updating git remote...${NC}"
if git remote get-url origin 2>/dev/null | grep -q "$OLD_REPO"; then
    git remote set-url origin "$NEW_URL.git"
    echo "✅ Git remote updated to: $NEW_URL.git"
else
    echo "⚠️  Git remote doesn't match expected pattern, skipping..."
fi

# Update submodules if they exist
if [ -f .gitmodules ]; then
    echo -e "${GREEN}Updating submodules...${NC}"
    sed -i '' "s|$OLD_URL|$NEW_URL|g" .gitmodules
    git submodule sync
fi

# Count references after update
AFTER_COUNT=$(grep -r "$OLD_REPO" . --include="*.md" --include="*.json" --include="*.yml" --include="*.yaml" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git 2>/dev/null | wc -l)

echo -e "\n================================================"
echo -e "${GREEN}✅ Migration Complete!${NC}"
echo -e "References updated: $((BEFORE_COUNT - AFTER_COUNT))"
echo -e "Remaining references: $AFTER_COUNT"

# Show files that were updated
echo -e "\n${YELLOW}Key files updated:${NC}"
echo "- README.md"
echo "- package.json files"
echo "- Documentation files"
echo "- Source code files"
echo "- Git remote origin"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Review changes: git diff"
echo "2. Commit changes: git add -A && git commit -m 'chore: migrate to GitHub organization'"
echo "3. Push to new repo: git push origin main"
echo "4. Update NPM package: npm version patch && npm publish"

# List any remaining references that couldn't be updated
if [ $AFTER_COUNT -gt 0 ]; then
    echo -e "\n${YELLOW}⚠️  Some references may need manual update:${NC}"
    grep -r "$OLD_REPO" . --include="*.md" --include="*.json" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git 2>/dev/null | head -5
fi