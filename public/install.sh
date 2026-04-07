#!/usr/bin/env bash
set -e

# ============================================================================
# Agent Trust Protocol (ATP) — Universal Installer
# Installs Node.js (if needed) and bootstraps a quantum-safe ATP agent.
#
# Usage:
#   curl -fsSL https://agenttrustprotocol.com/install.sh | bash
# ============================================================================

REQUIRED_NODE_MAJOR=18
NVM_VERSION="v0.40.1"

# --- ATP Banner ---
echo ""
echo "    ___   ______ ____"
echo "   /   | /_  __// __ \\"
echo "  / /| |  / /  / /_/ /"
echo " / ___ | / /  / ____/"
echo "/_/  |_|/_/  /_/"
echo ""
echo "Agent Trust Protocol — Quantum-Safe AI Agent Security"
echo "======================================================"
echo ""

# --- Check for Node.js ---
check_node() {
  if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VERSION" -ge "$REQUIRED_NODE_MAJOR" ] 2>/dev/null; then
      echo "[OK] Node.js v$(node -v | sed 's/v//') detected"
      return 0
    else
      echo "[!] Node.js v$(node -v | sed 's/v//') found but v${REQUIRED_NODE_MAJOR}+ required"
      return 1
    fi
  else
    echo "[!] Node.js not found"
    return 1
  fi
}

# --- Install Node.js via nvm ---
install_node() {
  echo ""
  echo "Installing Node.js via nvm..."
  echo ""

  # Download and install nvm
  export NVM_DIR="${HOME}/.nvm"
  curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" | bash

  # Source nvm into current shell
  [ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"

  # Install latest LTS
  nvm install --lts
  nvm use --lts

  echo ""
  echo "[OK] Node.js $(node -v) installed successfully"
}

# --- Main ---
if ! check_node; then
  install_node
fi

# Verify npx is available
if ! command -v npx >/dev/null 2>&1; then
  echo "[ERROR] npx not found. Please check your Node.js installation."
  exit 1
fi

echo ""
echo "Bootstrapping your ATP agent..."
echo ""

# Run the scaffolder
npx create-atp-agent@latest

echo ""
echo "======================================================"
echo "Setup complete! Next steps:"
echo ""
echo "  cd <your-agent-name>"
echo "  npm install"
echo "  npm start"
echo ""
echo "Docs:  https://agenttrustprotocol.com/docs"
echo "GitHub: https://github.com/agent-trust-protocol/atp-core"
echo "======================================================"
