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
    $backendPort = 8000
    if (Test-HttpReady 'http://127.0.0.1:8000/' 'message' 'Bid Compliance API is running') {
        $backendPort = 8000
    } elseif (Test-HttpReady 'http://127.0.0.1:8001/' 'message' 'Bid Compliance API is running') {
        $backendPort = 8001
    } elseif (Test-PortOccupied 8000) {
        $backendPort = 8001
    }

    $env:MOCK_API_BASE_URL = "http://127.0.0.1:$backendPort"
    $backendUri = "http://127.0.0.1:$backendPort"
    $backendMatches = Test-HttpReady "$backendUri/" 'message' 'Bid Compliance API is running'
    $backendProcess = $null
    if ($backendMatches) {
        if (-not (Test-HttpReady "$backendUri/health" 'status' 'healthy')) {
            throw "The backend is running on port $backendPort but its database is unavailable. Check backend/.env and database connectivity."
        }
        Write-Host "Backend is already healthy on port $backendPort."
    } else {
        if (Test-PortOccupied $backendPort) {
            throw "Port $backendPort is occupied by another service or a backend still starting. Check it before retrying."
        }
        $pythonExecutable = Join-Path $backendDirectory 'venv/Scripts/python.exe'
        if (-not (Test-Path -LiteralPath $pythonExecutable)) {
            throw 'Backend virtual environment is missing. Follow the Backend Setup steps in README.md.'
        }
        $backendErrorLog = Join-Path $logDirectory 'backend.stderr.log'
        $backendProcess = Start-Process -FilePath $pythonExecutable `
            -ArgumentList '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', "$backendPort" `
            -WorkingDirectory $backendDirectory -WindowStyle Hidden `
            -RedirectStandardOutput (Join-Path $logDirectory 'backend.stdout.log') `
            -RedirectStandardError $backendErrorLog -PassThru
        Wait-ServiceReady $backendProcess "$backendUri/health" $backendErrorLog 'status' 'healthy'
        Write-Host "Backend ready on port $backendPort (PID $($backendProcess.Id))."
    }

    Write-Host '[2/2] Checking frontend...'
    $env:VITE_API_URL = "http://127.0.0.1:$backendPort"
    $frontendProcess = $null
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
    Write-Host "Backend docs:   http://127.0.0.1:$backendPort/docs"
    Write-Host "Background service logs: $logDirectory"

    if ($backendProcess -or $frontendProcess) {
        Write-Host 'Platform is active. Press Ctrl+C in this window to stop.' -ForegroundColor Green
        try {
            while ($true) {
                Start-Sleep -Seconds 2
                if ($backendProcess -and $backendProcess.HasExited) {
                    Write-Host "Backend process (PID $($backendProcess.Id)) exited unexpectedly." -ForegroundColor Red
                    break
                }
                if ($frontendProcess -and $frontendProcess.HasExited) {
                    Write-Host "Frontend process (PID $($frontendProcess.Id)) exited unexpectedly." -ForegroundColor Red
                    break
                }
            }
        } finally {
            if ($backendProcess -and -not $backendProcess.HasExited) {
                Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
            }
            if ($frontendProcess -and -not $frontendProcess.HasExited) {
                Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
            }
        }
    }
} catch {
    Write-Host "Startup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
