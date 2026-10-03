const fs=require('fs');
const env={};
for(const line of fs.readFileSync('C:\\Users\\puaet\\carrinho-update\\.env.production.local','utf8').split(/\r?\n/)){
  if(!line||line.startsWith('#')||!line.includes('=')) continue;
  const i=line.indexOf('='); let v=line.slice(i+1).trim();
  if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1);
  env[line.slice(0,i)]=v.replace(/\\n/g,'\n');
}
const token=env.TELEGRAM_BOT_TOKEN, chat=env.TELEGRAM_CHAT_ID;
const site='https://carrinhodavitoria.setyourday.com.br/';
const instagram='https://www.instagram.com/carrinhodavitoria/';
const group=env.TELEGRAM_GROUP_URL||'https://t.me/carrinhodavitoria';
const text=[
'🎉 SEJAM MUITO BEM-VINDOS AO ACHADINHOS DA VITÓRIA! 🛒✨','',
'Que bom ter vocês por aqui! 💜','',
'Este é o nosso espaço para compartilhar achadinhos, ofertas, cupons e produtos que realmente valem a pena.','',
'Aqui vocês vão receber:',
'✅ Achadinhos selecionados',
'🏷️ Promoções e descontos',
'⚡ Ofertas que podem mudar rápido',
'🛒 Links diretos para conferir os produtos',
'💜 Curadoria do Carrinho da Vitória','',
'Quer conhecer mais do nosso trabalho?','',
'🌐 Nosso site',
site,'',
'📸 Nosso Instagram',
instagram,'',
'✈️ Grupo oficial no Telegram',
group,'',
'Salva nossos links e acompanha a gente por lá também. 💜','',
'Sejam bem-vindos ao Carrinho da Vitória — pequenos achados, grandes acertos. 🛒✨'
].join('\n');
const reply_markup={inline_keyboard:[
 [{text:'🌐 CONHECER NOSSO SITE',url:site}],
 [{text:'📸 SEGUIR NO INSTAGRAM',url:instagram}],
 [{text:'🛒 VER OS ACHADINHOS',url:site+'#produtos'}]
]};
(async()=>{
 const r=await fetch('https://api.telegram.org/bot'+token+'/sendMessage',{
   method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({chat_id:chat,text,reply_markup,disable_web_page_preview:true})
 });
 console.log(await r.text());
})();
