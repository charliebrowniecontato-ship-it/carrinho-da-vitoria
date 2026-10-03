$ErrorActionPreference='Stop'
Set-Location 'C:\Users\puaet\carrinho-update'
$secret=[guid]::NewGuid().ToString('N')+[guid]::NewGuid().ToString('N')
Set-Content -Path '.sync-secret' -Value $secret -NoNewline
$secret | vercel env add BOT_SYNC_SECRET production
