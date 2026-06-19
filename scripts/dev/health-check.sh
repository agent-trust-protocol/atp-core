#!/usr/bin/env bash
# Health check for the ATP SDK: full build + test suite.
# Exits nonzero on any failure.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SDK="$ROOT/packages/sdk"

echo "== Build packages/sdk =="
(cd "$SDK" && npx tsc --noEmit)
(cd "$SDK" && npm run build)

echo "== Test packages/sdk =="
(cd "$SDK" && npm test)

echo "== Health check passed =="
