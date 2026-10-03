const fs=require('fs');
const html=fs.readFileSync('C:\\Users\\puaet\\carrinho-update\\index.html','utf8');
const secret=fs.readFileSync('C:\\Users\\puaet\\carrinho-update\\.sync-secret','utf8').trim();
const img1=(html.match(/const IMG_SQUISHY='([^']+)'/)||[])[1];
const img2=(html.match(/const IMG_STOP='([^']+)'/)||[])[1];
const products=[
{id:'squishy-baozi-surpresa',title:'Squishy Baozi Antiestresse 8,5 cm — Caixa Surpresa',subtitle:'Brinquedo sensorial macio com retorno lento e cor surpresa',price:34.99,oldPrice:59.99,discount:42,rating:'4,8',reviews:'539 avaliações · 1 mil+ vendidos',image:img1,link:'https://s.shopee.com.br/3VkiWwLD7e',features:['Squishy sensorial com retorno lento','Tamanho aproximado de 8,5 × 8,5 × 5 cm','Material macio e flexível em TPR, segundo o anúncio','Modelo e cor enviados de forma surpresa'],siteUrl:'https://carrinhodavitoria.setyourday.com.br/produto/squishy-baozi-antiestresse-8-5-cm-caixa-surpresa'},
{id:'jogo-stop-tapple-portugues',title:'Jogo Stop Tapple Caça Palavras em Português',subtitle:'Tabuleiro de resposta rápida com letras, temas e cronômetro de 10 segundos',price:47.15,maxPrice:136.78,oldPrice:159.90,discount:71,rating:'4,9',reviews:'1,5 mil avaliações · 3 mil+ vendidos',image:img2,link:'https://s.shopee.com.br/3LRIKdLqSd',features:['Tabuleiro com teclas de letras que abaixam','Cronômetro de 10 segundos por jogada','Todo em português','Para até 5 jogadores'],siteUrl:'https://carrinhodavitoria.setyourday.com.br/produto/jogo-stop-tapple-caca-palavras-em-portugues'}
];
(async()=>{for(const p of products){const r=await fetch('https://carrinhodavitoria.setyourday.com.br/api/sync-latest',{method:'POST',headers:{'content-type':'application/json','x-sync-secret':secret},body:JSON.stringify({product:p})});const j=await r.json();console.log(p.id,r.status,JSON.stringify(j));await new Promise(x=>setTimeout(x,1500));}})();
