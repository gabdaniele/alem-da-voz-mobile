# Liga a API do Além da Voz usando o Node 24 (sem trocar o Node padrão do computador).
$env:PATH = "$env:LOCALAPPDATA\nvm\v24.21.0;" + $env:PATH
Set-Location $PSScriptRoot
npm.cmd run api
