param(
  [string]$JsonPath
)
$ErrorActionPreference='Stop'
$root = Split-Path -Parent $PSScriptRoot
$secretPath = Join-Path $root '.sync-secret'
if (!(Test-Path $secretPath)) { throw '.sync-secret não encontrado no projeto.' }
$secret = (Get-Content $secretPath -Raw).Trim()
$body = if ($JsonPath) { Get-Content $JsonPath -Raw } else { '{}' }
$r = Invoke-RestMethod -Uri 'https://carrinhodavitoria.setyourday.com.br/api/announce' -Method POST -Headers @{ 'x-sync-secret' = $secret } -ContentType 'application/json' -Body $body
$r | ConvertTo-Json -Depth 10
