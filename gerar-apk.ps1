# Gera um novo APK no EAS (conta Expo precisa estar logada: rode entrar-expo.ps1 antes, se pedir).
$env:PATH = "$env:LOCALAPPDATA\nvm\v24.21.0;" + $env:PATH
$env:EAS_NO_VCS = "1"
Set-Location (Join-Path $PSScriptRoot "app\mobile")
npx.cmd --yes eas-cli@latest build --platform android --profile preview
