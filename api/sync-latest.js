function slugify(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}
function money(v){return Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function buildCaption(p,siteUrl){
  const price=p.maxPrice?money(p.price)+' a '+money(p.maxPrice):money(p.price);
  const old=p.oldPrice?money(p.oldPrice):null;
  const lines=['🔥 NOVO ACHADINHO NO CARRINHO!','',
    '🛍️ '+p.title,
    p.subtitle?'✨ '+p.subtitle:'',
    '',
    old?'💸 '+old+'  →  '+price:'💸 '+price,
    p.discount?'🏷️ '+p.discount+'% OFF':'',
    p.rating?'⭐ '+p.rating+(p.reviews?' · '+p.reviews:''):'',
    '',
    ...(p.features||[]).slice(0,4).map(x=>'✅ '+x),
    '',
    '🧡 Selecionado pelo Carrinho da Vitória',
    '⚡ Preço, estoque e frete podem mudar na loja parceira.',
    '',
    '🔗 Ver detalhes no Carrinho da Vitória',
    siteUrl
  ];
  return lines.filter((x,i)=>x!==''||lines[i-1]!=='').join('\n').slice(0,1024);
}
module.exports=async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'method_not_allowed'});
  const secret=req.headers['x-sync-secret'];
  if(!process.env.BOT_SYNC_SECRET||secret!==process.env.BOT_SYNC_SECRET) return res.status(401).json({ok:false,error:'unauthorized'});
  const p=req.body&&req.body.product;
  if(!p||!p.title||!p.link) return res.status(400).json({ok:false,error:'invalid_product'});
  const token=process.env.TELEGRAM_BOT_TOKEN, chat=process.env.TELEGRAM_CHAT_ID;
  if(!token||!chat) return res.status(500).json({ok:false,error:'telegram_env_missing'});
  const siteUrl=p.siteUrl||'https://carrinhodavitoria.setyourday.com.br/produto/'+encodeURIComponent(p.slug||p.id||slugify(p.title));
  const caption=buildCaption(p,siteUrl);
  const reply_markup={inline_keyboard:[
    [{text:'🛒 VER ACHADO NO SITE',url:siteUrl}],
    [{text:'⚡ IR DIRETO À OFERTA',url:p.link}]
  ]};
  const base='https://api.telegram.org/bot'+token;
  let tg;
  if(req.body&&req.body.editMessageId){
    tg=await fetch(base+'/editMessageCaption',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:chat,message_id:req.body.editMessageId,caption,reply_markup})}).then(r=>r.json());
  }else if(p.image){
    if(/^data:image\//i.test(p.image)){
      const m=p.image.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if(m){
        const mime=m[1], ext=mime.includes('webp')?'webp':mime.includes('png')?'png':'jpg';
        const form=new FormData();
        form.append('chat_id',chat);
        form.append('caption',caption);
        form.append('reply_markup',JSON.stringify(reply_markup));
        form.append('photo',new Blob([Buffer.from(m[2],'base64')],{type:mime}),'achadinho.'+ext);
        tg=await fetch(base+'/sendPhoto',{method:'POST',body:form}).then(r=>r.json());
      }
    }else{
      tg=await fetch(base+'/sendPhoto',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:chat,photo:p.image,caption,reply_markup})}).then(r=>r.json());
    }
  }
  if(!tg||!tg.ok){
    tg=await fetch(base+'/sendMessage',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:chat,text:caption,reply_markup,disable_web_page_preview:true})}).then(r=>r.json());
  }
  return res.status(tg.ok?200:502).json({ok:!!tg.ok,result:tg.ok?{message_id:tg.result&&tg.result.message_id}:tg});
}
