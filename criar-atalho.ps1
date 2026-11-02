# Gera o Pomodoro via Docker, cria o atalho no Menu Iniciar e limpa o Docker.
# Sem acentos de proposito: o PowerShell 5.1 le .ps1 sem BOM como ANSI.

$ErrorActionPreference = 'Stop'

$compose = Join-Path $PSScriptRoot 'docker-compose.yml'
$exe = Join-Path $PSScriptRoot 'release\win-unpacked\Pomodoro.exe'
$atalho = Join-Path ([Environment]::GetFolderPath('Programs')) 'Pomodoro.lnk'
$dockerDesktop = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
$esperaMaximaSegundos = 180

function Test-DockerPronto {
    # Via cmd para o stderr do docker nao virar erro do PowerShell.
    cmd /c "docker info >nul 2>&1"
    return $LASTEXITCODE -eq 0
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker nao encontrado. Instale o Docker Desktop.'
}

Write-Host '1/5 Iniciando o Docker...'
if (-not (Test-DockerPronto)) {
    if (-not (Test-Path $dockerDesktop)) {
        throw "Docker parado e Docker Desktop nao encontrado em $dockerDesktop."
    }
    Start-Process $dockerDesktop

    $limite = (Get-Date).AddSeconds($esperaMaximaSegundos)
    while (-not (Test-DockerPronto)) {
        if ((Get-Date) -gt $limite) {
            throw "Docker nao ficou pronto em $esperaMaximaSegundos segundos."
        }
        Start-Sleep -Seconds 3
    }
}

try {
    Write-Host '2/5 Gerando o executavel...'
    docker compose -f $compose up --build --exit-code-from builder
    if ($LASTEXITCODE -ne 0) {
        throw "Build falhou (codigo $LASTEXITCODE)."
    }
    if (-not (Test-Path $exe)) {
        throw "Build terminou, mas $exe nao existe."
    }

    Write-Host '3/5 Criando o atalho...'
    $shell = New-Object -ComObject WScript.Shell
    $lnk = $shell.CreateShortcut($atalho)
    $lnk.TargetPath = $exe
    $lnk.WorkingDirectory = Split-Path $exe
    $lnk.Save()
    Write-Host "Atalho criado em $atalho"
}
finally {
    # Roda mesmo se o build falhar, para nao deixar container nem imagem para tras.
    Write-Host '4/5 e 5/5 Encerrando o container e deletando a imagem...'
    docker compose -f $compose down --rmi local
    if ($LASTEXITCODE -ne 0) {
        Write-Warning 'Nao foi possivel limpar o container ou a imagem.'
    }
}

Write-Host 'Pronto. Digite pomodoro na busca do Windows.'
