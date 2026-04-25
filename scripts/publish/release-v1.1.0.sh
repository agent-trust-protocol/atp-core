#!/usr/bin/env bash
# ATP v1.1.0 Release Script
# Run from the root of the atp-core repo
# Usage: bash release-v1.1.0.sh
set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo ""
echo "========================================"
echo " ATP v1.1.0 Release Script"
echo "========================================"
echo ""

# ── STEP 1: Tag v1.1.0 ────────────────────────────────────────────────────────
echo "[ 1/4 ] Tagging v1.1.0..."
if git tag -l | grep -q "^v1.1.0$"; then
  echo "  → Tag v1.1.0 already exists locally. Pushing to origin..."
else
  git tag v1.1.0
  echo "  → Tag v1.1.0 created."
fi
git push origin v1.1.0
echo "  ✓ Tag v1.1.0 pushed to origin."
echo ""

# ── STEP 2: GitHub Release (reminder — must be done in browser) ───────────────
echo "[ 2/4 ] GitHub Release"
echo "  → Please complete this step manually in your browser:"
echo "     URL:   https://github.com/agent-trust-protocol/atp-core/releases/new"
echo "     Tag:   v1.1.0"
echo "     Title: v1.1.0 — Quantum-Safe by Default"
echo "     ☑  Mark as Latest Release"
echo ""

# ── STEP 3: Publish npm Packages ──────────────────────────────────────────────
echo "[ 3/4 ] Publishing npm packages..."
echo "  Make sure you are logged in: npm whoami"
npm whoami 2>/dev/null || { echo "  ✗ Not logged into npm. Run: npm login"; exit 1; }

echo "  → Publishing @atp/sdk..."
cd "$REPO_ROOT/packages/sdk"
npm publish --access public

echo "  → Publishing @atp/openclaw-atp..."
cd "$REPO_ROOT/packages/openclaw-atp"
npm publish --access public

echo "  → Building and publishing create-atp-agent..."
cd "$REPO_ROOT/packages/create-atp-agent"
npm run build
npm publish --access public

cd "$REPO_ROOT"
echo "  ✓ All 3 packages published."
echo ""

# ── STEP 4: Delete stale branches ─────────────────────────────────────────────
echo "[ 4/4 ] Deleting stale remote branches..."
git push origin --delete claude/update-credentials-cleanup-yhREB    && echo "  ✓ Deleted claude/update-credentials-cleanup-yhREB" || echo "  ⚠ Branch not found or already deleted"
git push origin --delete claude/fix-upload-token-error-01UpBNdvSdbGwMwwx4yYSF5v && echo "  ✓ Deleted claude/fix-upload-token-error-01UpBNdvSdbGwMwwx4yYSF5v" || echo "  ⚠ Branch not found or already deleted"
git push origin --delete cursor/find-and-fix-three-bugs-5a2a        && echo "  ✓ Deleted cursor/find-and-fix-three-bugs-5a2a" || echo "  ⚠ Branch not found or already deleted"
echo ""

echo "========================================"
echo " Script complete!"
echo " Remaining manual steps:"
echo "   • Create GitHub Release (see Step 2 above)"
echo "   • Rotate Context7 key:  https://mcp.context7.com"
echo "   • Rotate GitHub PAT:    https://github.com/settings/tokens"
echo "   • Set Vercel env vars:  https://vercel.com/dashboard (see below)"
echo "   • Run DB migration:     psql \$DATABASE_URL < scripts/init-db.sql"
echo ""
echo " Vercel env vars to add:"
echo "   DATABASE_URL         — PostgreSQL connection string"
echo "   ADMIN_API_SECRET     — strong random secret"
echo "   NEXT_PUBLIC_APP_URL  — production URL"
echo "========================================"
