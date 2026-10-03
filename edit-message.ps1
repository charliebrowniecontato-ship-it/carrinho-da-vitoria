$ErrorActionPreference='Stop'
$secret=Get-Content 'C:\Users\puaet\carrinho-update\.sync-secret' -Raw
$body=@{
  editMessageId=6
  product=@{
    id='mouse-rgb-kw201'
    title='Mouse Sem Fio Recarregável RGB KW201'
    subtitle='Clique silencioso, bateria recarregável e 3 níveis de DPI'
    price=17.29
    maxPrice=19.69
    oldPrice=17.59
    discount=2
    rating='4,9'
    reviews='32,4 mil avaliações · 50 mil+ vendidos'
    image='https://down-br.img.susercontent.com/file/sg-11134201-8259h-mfv94kn6czd995'
    link='https://s.shopee.com.br/7ptfH7yTpD'
    siteUrl='https://carrinhodavitoria.setyourday.com.br/produto/mouse-sem-fio-recarregavel-rgb-kw201'
    features=@('Sem fio 2.4 GHz com mini receptor USB','Bateria interna recarregável','Até 30 dias de bateria segundo o anúncio','3 níveis de DPI: 800, 1200 e 1600')
  }
} | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri 'https://carrinhodavitoria.setyourday.com.br/api/sync-latest' -Method Post -Headers @{'x-sync-secret'=$secret} -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 6
