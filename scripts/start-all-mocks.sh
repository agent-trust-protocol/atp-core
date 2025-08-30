#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${REPO_ROOT}/logs"
mkdir -p "${LOG_DIR}"

start_service() {
  local name="$1"; shift
  local port="$1"; shift
  local cmd=("$@")
  if lsof -i ":${port}" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "[SKIP] ${name} already listening on :${port}"
    return 0
  fi
  echo "[START] ${name} on :${port}"
  nohup "${cmd[@]}" >"${LOG_DIR}/${name}.log" 2>&1 &
  sleep 0.5
  if curl -fsS "http://localhost:${port}/health" >/dev/null 2>&1; then
    echo "[OK] ${name} healthy"
  else
    echo "[WARN] ${name} started but health check did not respond yet"
  fi
}

start_service "mock-identity-service" 3001 node "${REPO_ROOT}/mock-identity-service.js"
start_service "mock-credentials-service" 3002 node "${REPO_ROOT}/mock-credentials-service.js"
start_service "mock-permission-service" 3003 node "${REPO_ROOT}/mock-permission-service.js"
start_service "mock-audit-service" 3006 node "${REPO_ROOT}/mock-audit-service.js"
start_service "mock-gateway-service" 3000 node "${REPO_ROOT}/mock-gateway-service.js"

echo "\nLogs: ${LOG_DIR}"
echo "Done."


