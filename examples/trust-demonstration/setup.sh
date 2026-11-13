#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
node -e 'if (Number(process.versions.node.split(".")[0]) !== 24) { console.error("Use Node.js 24 for this assessment"); process.exit(1); }'
if [ -e source/atp-core ]; then
  echo 'source/atp-core already exists; use node run.mjs source/atp-core after setup.' >&2
  exit 1
fi
mkdir -p source
git clone https://github.com/agent-trust-protocol/atp-core.git source/atp-core
git -C source/atp-core checkout --detach f4ced09aaad2c10fc371fc8e7a0cde642984790f
npm ci --ignore-scripts --prefix source/atp-core/examples/action-boundary
npm ci --ignore-scripts --prefix source/atp-core/examples/hermes-hook
npm ci --include=dev --ignore-scripts --prefix source/atp-core/packages/sdk
echo 'Setup complete. Run: node run.mjs source/atp-core'
