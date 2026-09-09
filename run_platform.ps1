$ErrorActionPreference = 'Stop'
$backendDirectory = Join-Path $PSScriptRoot 'backend'
$frontendDirectory = Join-Path $PSScriptRoot 'frontend'
$logDirectory = Join-Path $PSScriptRoot 'logs'

function Test-HttpReady {
    param([string]$Uri, [string]$ExpectedProperty, [string]$ExpectedValue)
    try {
        $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 3
        if ($ExpectedProperty) {
            $body = $response.Content | ConvertFrom-Json
            return $body.$ExpectedProperty -eq $ExpectedValue
        }
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Test-PortOccupied {
    param([int]$Port)
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $client.Connect('127.0.0.1', $Port)
        return $true
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

function Wait-ServiceReady {
    param($ServiceProcess, [string]$Uri, [string]$ErrorLog,
          [string]$ExpectedProperty, [string]$ExpectedValue)
    $deadline = (Get-Date).AddSeconds(120)
    do {
        if (Test-HttpReady $Uri $ExpectedProperty $ExpectedValue) { return }
        $ServiceProcess.Refresh()
        if ($ServiceProcess.HasExited) {
            if (Test-Path -LiteralPath $ErrorLog) {
                Get-Content -LiteralPath $ErrorLog -Tail 18 | Write-Host
            }
            throw "Service exited before it was ready. See $ErrorLog"
        }
        Start-Sleep -Seconds 1
    } while ((Get-Date) -lt $deadline)
    throw "Service did not become ready within 120 seconds. See $ErrorLog"
}

try {
    Write-Host 'BidVerify platform launcher'
    New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

    Write-Host '[1/2] Checking backend...'
    $backendMatches = Test-HttpReady 'http://127.0.0.1:8000/' 'message' 'Bid Compliance API is running'
    if ($backendMatches) {
        if (-not (Test-HttpReady 'http://127.0.0.1:8000/health' 'status' 'healthy')) {
            throw 'The backend is running but its database is unavailable. Check backend/.env and database connectivity.'
        }
        Write-Host 'Backend is already healthy.'
    } else {
        if (Test-PortOccupied 8000) {
            throw 'Port 8000 is occupied by another service or a backend still starting. Check it before retrying.'
        }
        $pythonExecutable = Join-Path $backendDirectory 'venv/Scripts/python.exe'
        if (-not (Test-Path -LiteralPath $pythonExecutable)) {
            throw 'Backend virtual environment is missing. Follow the Backend Setup steps in README.md.'
        }
        $backendErrorLog = Join-Path $logDirectory 'backend.stderr.log'
        $backendProcess = Start-Process -FilePath $pythonExecutable `
            -ArgumentList '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000' `
            -WorkingDirectory $backendDirectory -WindowStyle Hidden `
            -RedirectStandardOutput (Join-Path $logDirectory 'backend.stdout.log') `
            -RedirectStandardError $backendErrorLog -PassThru
        Wait-ServiceReady $backendProcess 'http://127.0.0.1:8000/health' $backendErrorLog 'status' 'healthy'
        Write-Host "Backend ready (PID $($backendProcess.Id))."
    }

    Write-Host '[2/2] Checking frontend...'
    if (Test-PortOccupied 5173) {
        if (-not (Test-HttpReady 'http://127.0.0.1:5173/@vite/client')) {
            throw 'Port 5173 is occupied but Vite is not responding. Check that service before retrying.'
        }
        Write-Host 'Vite is already running.'
    } else {
        $nodeExecutable = (Get-Command node.exe -ErrorAction Stop).Source
        $viteScript = Join-Path $frontendDirectory 'node_modules/vite/bin/vite.js'
        if (-not (Test-Path -LiteralPath $viteScript)) {
            throw 'Frontend dependencies are missing. Run npm install from frontend/ first.'
        }
        $frontendErrorLog = Join-Path $logDirectory 'frontend.stderr.log'
        $frontendProcess = Start-Process -FilePath $nodeExecutable `
            -ArgumentList ('"{0}" --host 127.0.0.1 --port 5173 --strictPort' -f $viteScript) `
            -WorkingDirectory $frontendDirectory -WindowStyle Hidden `
            -RedirectStandardOutput (Join-Path $logDirectory 'frontend.stdout.log') `
            -RedirectStandardError $frontendErrorLog -PassThru
        Wait-ServiceReady $frontendProcess 'http://127.0.0.1:5173/@vite/client' $frontendErrorLog
        Write-Host "Frontend ready (PID $($frontendProcess.Id))."
    }

    Write-Host 'Platform ready: http://localhost:5173'
    Write-Host 'Backend docs:   http://127.0.0.1:8000/docs'
    Write-Host "Background service logs: $logDirectory"
} catch {
    Write-Host "Startup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
