# Remove o atalho do Pomodoro do Menu Iniciar e a pasta release.

$ErrorActionPreference = 'Stop'

$atalho = Join-Path ([Environment]::GetFolderPath('Programs')) 'Pomodoro.lnk'
$release = Join-Path $PSScriptRoot 'release'

if (Test-Path $atalho) {
    Remove-Item $atalho
    Write-Host "Atalho removido: $atalho"
}
else {
    Write-Host 'Nenhum atalho do Pomodoro encontrado.'
}

if (Test-Path $release) {
    Remove-Item $release -Recurse -Force
    Write-Host "Pasta removida: $release"
}
else {
    Write-Host 'Pasta release nao encontrada.'
}
