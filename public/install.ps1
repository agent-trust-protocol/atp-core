# ============================================================================
# Agent Trust Protocol (ATP) — Windows Installer
# Installs Node.js (if needed) and bootstraps a quantum-safe ATP agent.
#
# Usage (PowerShell):
#   irm https://agenttrustprotocol.com/install.ps1 | iex
# ============================================================================

$ErrorActionPreference = "Stop"
$RequiredNodeMajor = 18
$NodeLtsVersion = "22.14.0"
$NodeMsiUrl = "https://nodejs.org/dist/v${NodeLtsVersion}/node-v${NodeLtsVersion}-x64.msi"

# --- ATP Banner ---
Write-Host ""
Write-Host "    ___   ______ ____" -ForegroundColor Cyan
Write-Host "   /   | /_  __// __ \" -ForegroundColor Cyan
Write-Host "  / /| |  / /  / /_/ /" -ForegroundColor Cyan
Write-Host " / ___ | / /  / ____/" -ForegroundColor Cyan
Write-Host "/_/  |_|/_/  /_/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Agent Trust Protocol - Quantum-Safe AI Agent Security" -ForegroundColor White
Write-Host "======================================================" -ForegroundColor DarkGray
Write-Host ""

# --- Check for Node.js ---
function Test-NodeInstalled {
    try {
        $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
        if ($nodeCmd) {
            $versionStr = & node -v 2>$null
            $major = [int]($versionStr -replace 'v','').Split('.')[0]
            if ($major -ge $RequiredNodeMajor) {
                Write-Host "[OK] Node.js $versionStr detected" -ForegroundColor Green
                return $true
            } else {
                Write-Host "[!] Node.js $versionStr found but v${RequiredNodeMajor}+ required" -ForegroundColor Yellow
                return $false
            }
        }
    } catch {}
    Write-Host "[!] Node.js not found" -ForegroundColor Yellow
    return $false
}

# --- Check for admin privileges ---
function Test-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# --- Install Node.js ---
function Install-NodeJs {
    Write-Host ""
    Write-Host "Installing Node.js v${NodeLtsVersion}..." -ForegroundColor Cyan
    Write-Host ""

    # Check admin
    if (-not (Test-Admin)) {
        Write-Host "[!] Admin privileges required to install Node.js." -ForegroundColor Yellow
        Write-Host "    Please run PowerShell as Administrator and try again:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "    irm https://agenttrustprotocol.com/install.ps1 | iex" -ForegroundColor White
        Write-Host ""
        exit 1
    }

    # Download MSI
    $msiPath = Join-Path $env:TEMP "node-v${NodeLtsVersion}-x64.msi"
    Write-Host "Downloading Node.js installer..." -ForegroundColor DarkGray
    Invoke-WebRequest -Uri $NodeMsiUrl -OutFile $msiPath -UseBasicParsing

    # Silent install
    Write-Host "Running installer (this may take a minute)..." -ForegroundColor DarkGray
    Start-Process msiexec.exe -ArgumentList '/i', $msiPath, '/quiet', '/norestart' -Wait -NoNewWindow

    # Clean up
    Remove-Item $msiPath -Force -ErrorAction SilentlyContinue

    # Refresh PATH from registry
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machinePath;$userPath"

    # Verify
    try {
        $newVersion = & node -v 2>$null
        Write-Host ""
        Write-Host "[OK] Node.js $newVersion installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Node.js installation may have failed. Please install manually from https://nodejs.org" -ForegroundColor Red
        exit 1
    }
}

# --- Main ---
if (-not (Test-NodeInstalled)) {
    Install-NodeJs
}

# Verify npx
try {
    $npxCmd = Get-Command npx -ErrorAction Stop
} catch {
    Write-Host "[ERROR] npx not found. Please check your Node.js installation." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Bootstrapping your ATP agent..." -ForegroundColor Cyan
Write-Host ""

# Run the scaffolder
& npx create-atp-agent@latest

Write-Host ""
Write-Host "======================================================" -ForegroundColor DarkGray
Write-Host "Setup complete! Next steps:" -ForegroundColor Green
Write-Host ""
Write-Host "  cd <your-agent-name>" -ForegroundColor White
Write-Host "  npm install" -ForegroundColor White
Write-Host "  npm start" -ForegroundColor White
Write-Host ""
Write-Host "Docs:   https://agenttrustprotocol.com/docs" -ForegroundColor DarkGray
Write-Host "GitHub: https://github.com/agent-trust-protocol/atp-core" -ForegroundColor DarkGray
Write-Host "======================================================" -ForegroundColor DarkGray
