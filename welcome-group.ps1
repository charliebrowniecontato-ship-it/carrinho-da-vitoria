$ErrorActionPreference='Stop'
Set-Location 'C:\Users\puaet\carrinho-update'
vercel env pull .env.production.local --environment=production --yes | Out-Null
Get-Content .env.production.local | ForEach-Object {
  if($_ -match '^([^#][^=]+)="?(.*?)"?$'){
    $name=$matches[1]; $value=$matches[2].TrimEnd('"'); Set-Item -Path ("Env:"+$name) -Value $value
  }
}
$token=$env:TELEGRAM_BOT_TOKEN
$chat=$env:TELEGRAM_CHAT_ID
$site='https://carrinhodavitoria.setyourday.com.br/'
$instagram='https://www.instagram.com/carrinhodavitoria/'
$group=$env:TELEGRAM_GROUP_URL
$text=@"
🎉 SEJAM MUITO BEM-VINDOS AO ACHADINHOS DA VITÓRIA! 🛒✨

Que bom ter vocês por aqui! 💜

Este é o nosso espaço para compartilhar achadinhos, ofertas, cupons e produtos que realmente valem a pena.

Aqui vocês vão receber:
✅ Achadinhos selecionados
🏷️ Promoções e descontos
⚡ Ofertas que podem mudar rápido
🛒 Links diretos para conferir os produtos
💜 Curadoria do Carrinho da Vitória

Quer conhecer mais do nosso trabalho?

🌐 Nosso site
$site

📸 Nosso Instagram
$instagram

✈️ Grupo oficial no Telegram
$group

Salva nossos links e acompanha a gente por lá também. 💜

Sejam bem-vindos ao Carrinho da Vitória — pequenos achados, grandes acertos. 🛒✨
"@
$markup=@{
  inline_keyboard=@(
    ,@(@{text='🌐 CONHECER NOSSO SITE';url=$site})
    ,@(@{text='📸 SEGUIR NO INSTAGRAM';url=$instagram})
    ,@(@{text='🛒 VER OS ACHADINHOS';url=($site+'#produtos')})
  )
} | ConvertTo-Json -Depth 5 -Compress
$body=@{chat_id=$chat;text=$text;reply_markup=(ConvertFrom-Json $markup);disable_web_page_preview=$true} | ConvertTo-Json -Depth 8
$r=Invoke-RestMethod -Uri ("https://api.telegram.org/bot"+$token+"/sendMessage") -Method Post -ContentType 'application/json; charset=utf-8' -Body $body
$r | ConvertTo-Json -Depth 5
