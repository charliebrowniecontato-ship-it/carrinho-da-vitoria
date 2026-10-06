param(
  [Parameter(Mandatory=$true)][string]$JsonPath
)
$ErrorActionPreference='Stop'
$root = Split-Path -Parent $PSScriptRoot
$secretPath = Join-Path $root '.sync-secret'
if (!(Test-Path $secretPath)) { throw '.sync-secret não encontrado no projeto.' }
if (!(Test-Path $JsonPath)) { throw "Arquivo JSON não encontrado: $JsonPath" }
$secret = (Get-Content $secretPath -Raw).Trim()
$body = Get-Content $JsonPath -Raw
$r = Invoke-RestMethod -Uri 'https://carrinhodavitoria.setyourday.com.br/api/sync-latest' -Method POST -Headers @{ 'x-sync-secret' = $secret } -ContentType 'application/json' -Body $body
$r | ConvertTo-Json -Depth 10
