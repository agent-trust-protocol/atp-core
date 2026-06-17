#!/bin/bash
# ATP Repo Health Check v3
# Usage: bash scripts/dev/health-check.sh
PASS=0; FAIL=0

chk() {
  local label="$1" cmd="$2" want_empty="${3:-true}"
  result=$(eval "$cmd" 2>/dev/null)
  if [ "$want_empty" = "true" ] && [ -z "$result" ]; then
    echo "  + $label"; ((PASS++))
  elif [ "$want_empty" = "false" ] && [ -n "$result" ]; then
    echo "  + $label"; ((PASS++))
  else
    echo "  x $label"
    [ -n "$result" ] && echo "    -> $(echo "$result" | head -2)"
    ((FAIL++))
  fi
}

echo ""
echo "=== ATP Repo Health Check v3 — $(date '+%Y-%m-%d') ==="
echo ""

echo "-- Security --"
chk "No exposed Context7 key" \
  "grep -r 'ctx7sk-' . --include='*.md' --include='*.json' --include='*.js' --include='*.ts' | grep -v node_modules"
chk "No hardcoded GitHub PAT" \
  "grep -r 'ghp_\|github_pat_' . --include='*.md' --include='*.json' | grep -v node_modules"
chk "No docs.atp.dev broken links" \
  "grep -rn 'https://docs.atp.dev' . --include='*.md' --include='*.tsx' --include='*.ts' | grep -v node_modules"

echo ""
echo "-- Root cleanliness --"
chk "No loose .js files in root"       "ls *.js 2>/dev/null | grep -v 'jest\.\|eslint\.\|next\.\|postcss\.\|tailwind\.\|maintenance\.'"
chk "No quicksort.js"                  "ls quicksort.js 2>/dev/null"
chk "No reset-password.js"             "ls reset-password.js 2>/dev/null"
chk "No mock-*.js in root"             "ls mock-*.js 2>/dev/null"
chk "No quantum-safe-*.js in root"     "ls quantum-safe-*.js 2>/dev/null"
chk "No debug-*.js in root"            "ls debug-*.js 2>/dev/null"
chk "No deploy scripts in root"        "ls deploy*.sh public-launch.sh push-to-github*.sh 2>/dev/null"
chk "test/mocks/ directory exists"     "ls -d test/mocks/ 2>/dev/null" false
chk "src/quantum/ directory exists"    "ls -d src/quantum/ 2>/dev/null" false
chk "scripts/deploy/ exists"           "ls -d scripts/deploy/ 2>/dev/null" false

echo ""
echo "-- IDE tooling --"
chk ".cursor/ NOT tracked by git"      "git ls-files .cursor"
chk ".giga/ NOT tracked by git"        "git ls-files .giga"
chk ".vscode/ NOT tracked by git"      "git ls-files .vscode"
chk ".roomodes NOT tracked by git"     "git ls-files .roomodes"
chk ".cursor/ in .gitignore"           "grep '\.cursor' .gitignore" false
chk ".giga/ in .gitignore"             "grep '\.giga' .gitignore" false

echo ""
echo "-- Docs integrity --"
chk "CHANGELOG.md exists"              "ls CHANGELOG.md" false
chk "RELEASE_NOTES_v1.1.0.md removed" "ls RELEASE_NOTES_v1.1.0.md 2>/dev/null"
chk "No 'coming soon' in README"       "grep -i 'coming soon' README.md"
chk "Trademark present in README"      "grep 'ATP\|Protocol' README.md" false
chk "Sovr INC attribution present"     "grep 'Sovr INC' README.md" false
chk "Discord link in README"           "grep -i 'discord' README.md" false
chk "npm publish workflow exists"      "ls .github/workflows/publish*.yml .github/workflows/npm*.yml 2>/dev/null" false

echo ""
echo "-- Virality signals --"
chk "npx CLI exists (create-atp-agent)" \
  "ls -d packages/create-atp-agent/ 2>/dev/null" false
chk "adapters/ADAPTER.md spec exists"  "ls adapters/ADAPTER.md 2>/dev/null" false

echo ""
echo "-- packages/sdk build & test --"
# did:atp v2 baseline:
#   Phase 0 (2026-06-10, before any code): 362 tests pass, 14/16 suites pass.
#   Phase 1 (did:atp v2 module landed):    386 tests pass, 15/17 suites pass.
# In both, the SAME 2 suites fail to *run* (src/__tests__/utils/jwt.test.ts,
# src/__tests__/simple-agent.test.ts) due to a pre-existing jose ESM parse
# error under Jest — unrelated to did:atp. The test step (and this script)
# therefore exits nonzero until those suites are fixed.
SDK_STATUS=0
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if (cd "$REPO_ROOT/packages/sdk" && npm run build); then
  echo "  + packages/sdk build"; ((PASS++))
else
  echo "  x packages/sdk build"; ((FAIL++)); SDK_STATUS=1
fi

if (cd "$REPO_ROOT/packages/sdk" && npm test); then
  echo "  + packages/sdk tests"; ((PASS++))
else
  echo "  x packages/sdk tests"; ((FAIL++)); SDK_STATUS=1
fi

echo ""
echo "======================================="
echo "  Passed: $PASS  |  Failed: $FAIL"
[ $FAIL -eq 0 ] && echo "  + Repo is clean and enterprise-ready" \
               || echo "  x Fix the $FAIL items above before pushing"
echo ""

exit "$SDK_STATUS"
