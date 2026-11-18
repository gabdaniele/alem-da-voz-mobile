# Entra na sua conta Expo (necessário para gerar o APK no EAS).
$env:PATH = "$env:LOCALAPPDATA\nvm\v24.21.0;" + $env:PATH
Set-Location (Join-Path $PSScriptRoot "app\mobile")
npx.cmd --yes eas-cli@latest login
