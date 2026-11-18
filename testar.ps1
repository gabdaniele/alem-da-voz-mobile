# Roda os testes da API e do reconhecimento usando o Node 24.
$env:PATH = "$env:LOCALAPPDATA\nvm\v24.21.0;" + $env:PATH
Set-Location $PSScriptRoot
npm.cmd test
