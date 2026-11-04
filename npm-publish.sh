#!/usr/bin/env bash
set -e
cd "$(git rev-parse --show-toplevel)"

echo "Logged in as: $(npm whoami)"

echo ""
echo "[1/2] Installing + publishing atp-sdk (version from packages/sdk/package.json)..."
cd packages/sdk
npm install
npm publish --access public


echo ""
echo "[2/2] Installing + publishing create-atp-agent (version from packages/create-atp-agent/package.json)..."
cd ../create-atp-agent
npm install
npm publish --access public

echo ""
echo "Both packages published successfully!"
