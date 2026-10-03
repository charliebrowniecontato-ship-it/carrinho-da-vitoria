$ErrorActionPreference='Stop'
$secret=Get-Content 'C:\Users\puaet\carrinho-update\.sync-secret' -Raw
$r=Invoke-RestMethod -Uri 'https://carrinhodavitoria.setyourday.com.br/api/announce' -Method Post -Headers @{'x-sync-secret'=$secret} -ContentType 'application/json' -Body '{}'
$r | ConvertTo-Json -Depth 6
