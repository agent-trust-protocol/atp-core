#!/usr/bin/env bash
set -e
cd "$(git rev-parse --show-toplevel)"

echo "Logged in as: $(npm whoami)"

echo ""
echo "[1/3] Installing + publishing atp-sdk (version from packages/sdk/package.json)..."
cd packages/sdk
npm install
npm publish --access public

echo ""
echo "[2/3] Installing + publishing @atpdevelopment/openclaw-atp (version from packages/openclaw-atp/package.json)..."
cd ../openclaw-atp
npm install
npm publish --access public

echo ""
echo "[3/3] Installing + publishing create-atp-agent (version from packages/create-atp-agent/package.json)..."
cd ../create-atp-agent
npm install
npm publish --access public

echo ""
echo "All 3 packages published successfully!"
