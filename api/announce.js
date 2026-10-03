const escapeHtml=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
module.exports=async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'method_not_allowed'});
  const secret=req.headers['x-sync-secret'];
  if(!process.env.BOT_SYNC_SECRET||secret!==process.env.BOT_SYNC_SECRET) return res.status(401).json({ok:false,error:'unauthorized'});
  const token=process.env.TELEGRAM_BOT_TOKEN, chat=process.env.TELEGRAM_CHAT_ID;
  if(!token||!chat) return res.status(500).json({ok:false,error:'telegram_env_missing'});
  const site='https://carrinhodavitoria.setyourday.com.br/';
  const instagram='https://www.instagram.com/carrinhodavitoria/';
  const shopee='https://l.instagram.com/?u=https%3A%2F%2Fs.shopee.com.br%2FAKZ5WcSZ57%3Futm_source%3Dig%26utm_medium%3Dsocial%26utm_content%3Dlink_in_bio%26fbclid%3DPAZXh0bgNhZW0DMTAwAHBkb2YCc3J0YwZhcHBfaWQPOTM2NjE5NzQzMzkyNDU5AAGnlOoNeoQ83WuFlHJUov-8wUMApLDkZYVOHlkRYPNfZBFbCGVVV5LhjTpgvAQ_aem_BIFjAEsncuXGft3BriBVhw&e=AUCjkmKbIDfOsjnZb3IhkIyLzi7xEQD1vREQb13qpivnthbyPnaC3dqk1KkFgof0JW7-5Q4IxmXcW0GugmfE-F977Foc42Ew50ZXu9cvp5C4sEg6RwWXlBYFl4_CCO61CQW_WFQkEHGMgWY2KojC1H8';
  const group=process.env.TELEGRAM_GROUP_URL||'https://t.me/carrinhodavitoria';
  const hero='https://lh3.googleusercontent.com/d/1iNrKJXKgY1SqpX71WJJUUqIfYnbnXAhP=w1600';
  const shopeeHref=escapeHtml(shopee);
  const caption=[
    '<b>🎉 SEJAM MUITO BEM-VINDOS AO ACHADINHOS DA VITÓRIA! 🛒✨</b>','',
    'Que bom ter vocês por aqui! 💜','',
    'Este é o nosso espaço para compartilhar <b>achadinhos, ofertas, cupons e produtos que realmente valem a pena.</b>','',
    '<b>Aqui vocês vão receber:</b>',
    '✅ Achadinhos selecionados',
    '🏷️ Promoções e descontos',
    '⚡ Ofertas que podem mudar rápido',
    '🛒 Links diretos para conferir os produtos',
    '💜 Curadoria do Carrinho da Vitória','',
    '<b>Conheça nossos canais oficiais:</b>','',
    '🌐 <a href="'+site+'"><b>nosso site</b></a>',
    '📸 <a href="'+instagram+'"><b>nosso Instagram</b></a>',
    '🧡 <a href="'+shopeeHref+'"><b>meu perfil na shopee 🧡</b></a>',
    '<a href="'+shopeeHref+'">s.shopee.com.br/AKZ5WcSZ57</a>','',
    '✈️ <a href="'+group+'"><b>grupo oficial no Telegram</b></a>','',
    'Salva nossos links e acompanha a gente por lá também. 💜','',
    '<b>Carrinho da Vitória — pequenos achados, grandes acertos.</b> 🛒✨'
  ].join('\n');
  const reply_markup={inline_keyboard:[
    [{text:'🌐 CONHECER NOSSO SITE',url:site}],
    [{text:'📸 SEGUIR NO INSTAGRAM',url:instagram}],
    [{text:'🧡 MEU PERFIL NA SHOPEE',url:shopee}],
    [{text:'🛒 VER OS ACHADINHOS',url:site+'#produtos'}]
  ]};
  const base='https://api.telegram.org/bot'+token;
  if(req.body&&req.body.deleteMessageId){
    await fetch(base+'/deleteMessage',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:chat,message_id:req.body.deleteMessageId})}).then(r=>r.json()).catch(()=>null);
  }
  let tg=await fetch(base+'/sendPhoto',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({chat_id:chat,photo:hero,caption,parse_mode:'HTML',reply_markup})
  }).then(r=>r.json());
  if(!tg.ok){
    tg=await fetch(base+'/sendMessage',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({chat_id:chat,text:caption,parse_mode:'HTML',reply_markup,disable_web_page_preview:true})
    }).then(r=>r.json());
  }
  return res.status(tg.ok?200:502).json({ok:!!tg.ok,result:tg.ok?{message_id:tg.result&&tg.result.message_id}:tg});
}
