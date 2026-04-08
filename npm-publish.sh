#!/usr/bin/env bash
set -e
cd "$(git rev-parse --show-toplevel)"

echo "Logged in as: $(npm whoami)"

echo ""
echo "[1/3] Installing + publishing atp-sdk@1.2.1..."
cd packages/sdk
npm install
npm publish --access public

echo ""
echo "[2/3] Installing + publishing openclaw-atp@1.1.0..."
cd ../openclaw-atp
npm install
npm publish --access public

echo ""
echo "[3/3] Installing + publishing create-atp-agent@1.0.0..."
cd ../create-atp-agent
npm install
npm publish --access public

echo ""
echo "All 3 packages published successfully!"
