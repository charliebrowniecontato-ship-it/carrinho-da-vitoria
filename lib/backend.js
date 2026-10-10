const crypto=require('node:crypto');
const errors={unauthorized:'Entre para continuar.',forbidden:'Seu perfil não permite esta ação.',invalid_credentials:'E-mail ou senha incorretos.',password_length:'A senha precisa ter entre 10 e 72 bytes.',rate_limited:'Muitas tentativas. Aguarde 15 minutos.',activation_invalid:'Este link de ativação expirou ou já foi usado.',conflict:'Este item foi alterado por outra pessoa. Atualize a página antes de salvar.',image_required:'Adicione ao menos uma foto para publicar.',invalid_item:'Confira nome, link e fotos do achado.',own_access:'Você não pode alterar seu próprio acesso.',invalid_member:'Confira o nome e o e-mail.',invalid_role:'Escolha uma função válida.',not_found:'Item não encontrado.'};
async function rpc(action,data={},session=''){
 if(!process.env.CV_SUPABASE_URL||!process.env.CV_SUPABASE_KEY||!process.env.CV_GATE_SECRET)throw new Error('Gestão temporariamente indisponível.');
 const response=await fetch(process.env.CV_SUPABASE_URL+'/rest/v1/rpc/cv_rpc',{method:'POST',headers:{apikey:process.env.CV_SUPABASE_KEY,'content-type':'application/json'},body:JSON.stringify({p_gate:process.env.CV_GATE_SECRET,p_action:action,p_data:data,p_session:session}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Não foi possível acessar o banco da loja.');
 return response.json();
}
function session(req){const c=(req.headers.cookie||'').match(/(?:^|;\s*)cv_session=([a-f0-9]{64})(?:;|$)/);return c?c[1]:'';}
function cookie(res,token=''){res.setHeader('Set-Cookie',`cv_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${token?43200:0}`);}
function reply(res,result){const code=result.ok?200:result.error==='unauthorized'||result.error==='invalid_credentials'?401:result.error==='forbidden'?403:result.error==='rate_limited'?429:result.error==='conflict'?409:400;return res.status(code).json({...result,...(!result.ok?{message:errors[result.error]||'Não foi possível concluir esta ação.'}:{})});}
function csrf(req){const origin=req.headers.origin;const host=req.headers.host;return typeof origin==='string'&&origin===`https://${host}`;}
function channels(kind){const raw=kind==='coupon'?(process.env.TELEGRAM_COUPON_CHAT_IDS||process.env.TELEGRAM_CHAT_IDS||process.env.TELEGRAM_CHAT_ID):(process.env.TELEGRAM_CHAT_IDS||process.env.TELEGRAM_CHAT_ID);return [...new Set(String(raw||'').split(/[,\s]+/).filter(x=>/^(?:-?\d+|@[\w]+)$/.test(x)))].slice(0,8);}
const markets={Shopee:['shopee.com.br'],Amazon:['amazon.com.br','amzn.to'],Magalu:['magazineluiza.com.br','magazinevoce.com.br','magalu.com','magalu.com.br','divulgador.magalu.com'], 'Mercado Livre':['mercadolivre.com.br','mercadolivre.com','meli.la']};
function marketUrl(value,store){let u;try{u=new URL(value);}catch{return false;}return !/[\s\"'<>]/.test(value)&&u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(markets[store]||[]).some(d=>u.hostname===d||u.hostname.endsWith('.'+d));}
function cleanString(v,n=1000){return String(v||'').replace(/[<>\u0000-\u0008]/g,'').slice(0,n).trim();}
function normalizeItem(raw){
 const kind=raw.kind==='coupon'?'coupon':'product',d=raw.data||{},store=cleanString(d.store,40);
 if(!marketUrl(d.link,store))throw Error('Use um link HTTPS da loja parceira selecionada.');
 const category=cleanString(d.category,30),cat={casa:'Casa',tecnologia:'Tecnologia',beleza:'Beleza',saude:'Saúde & Fitness',moda:'Moda',colecionaveis:'Colecionáveis',infantil:'Infantil',acessorios:'Acessórios',ofertas:'Ofertas'};
 const images=Array.isArray(d.images)?d.images.filter(x=>typeof x==='string'&&(/^(?:data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]{20,360000}|https:\/\/[^\s"'<>]+|\/api\/media\?id=[a-f0-9-]{36})$/.test(x))).slice(0,5):[];
 const amount=x=>x==null||x===''?null:Number.isFinite(Number(x))&&Number(x)>=0&&Number(x)<=1000000?Number(x):null;
 const price=amount(d.price),oldPrice=amount(d.oldPrice);
 const expiresAt=d.expiresAt?new Date(d.expiresAt).toISOString():null;
 const id=raw.id||cleanString(d.title,100).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+crypto.randomBytes(3).toString('hex');
 return {id,kind,status:raw.status,revision:raw.revision,data:{id,kind,title:cleanString(d.title,180),subtitle:cleanString(d.subtitle,600),description:cleanString(d.description,5000),brand:cleanString(d.brand,80),store,category:cat[category]?category:'ofertas',categoryLabel:cat[category]||'Ofertas',link:d.link,images,image:images[0]||'',price,oldPrice,discount:price!==null&&oldPrice>price?Math.round((1-price/oldPrice)*100):0,featured:!!d.featured,badge:cleanString(d.badge,50)||'Curadoria da Vitória',features:Array.isArray(d.features)?d.features.slice(0,10).map(x=>cleanString(x,200)):[],note:cleanString(d.note,1000),coupon:d.coupon?{label:cleanString(d.coupon.label,150),detail:cleanString(d.coupon.detail,500),minPurchase:amount(d.coupon.minPurchase),expiresAt:d.coupon.expiresAt||null,type:cleanString(d.coupon.type,20)}:null,imported:!!d.imported,maxPrice:amount(d.maxPrice),rating:cleanString(d.rating,10)||null,reviews:cleanString(d.reviews,100),specs:Array.isArray(d.specs)?d.specs.slice(0,30).filter(x=>Array.isArray(x)&&x.length===2).map(x=>x.map(v=>cleanString(v,180))):[],code:cleanString(d.code,60),couponLabel:cleanString(d.couponLabel,150),minPurchase:amount(d.minPurchase),expiresAt}};
}
function money(n){return n==null?'Confira o preço na loja':Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
async function dispatch(s,origin,limit=8){
 let sent=0,failed=0;const deadline=Date.now()+23000;
 for(let n=0;n<limit&&Date.now()<deadline;n++){
  const claim=await rpc('claim',{},s);if(!claim.ok||!claim.job)break;
  const j=claim.job,p=j.payload,productUrl=`${origin}/produto/${encodeURIComponent(j.item_id)}`,offerUrl=`${origin}/api/go?id=${encodeURIComponent(j.item_id)}&source=telegram`;
  if(!process.env.TELEGRAM_BOT_TOKEN){await rpc('complete',{id:j.id,lease:j.lease,status:'failed',error:'Telegram não configurado.'},s);failed++;continue;}
  const text=[p.kind==='coupon'?'🎟️ CUPOM NO CARRINHO DA VITÓRIA':'💜 NOVO ACHADINHO DA VITÓRIA', '',p.title,p.subtitle||'',p.kind==='coupon'?p.couponLabel||'':money(p.price),p.code?'Código: '+p.code:'',p.minPurchase?'Compra mínima: '+money(p.minPurchase):'',...(p.features||[]).slice(0,3).map(x=>'✓ '+x),'','Loja: '+p.store,'Preço, estoque e condições são confirmados na loja parceira.'].filter(Boolean).join('\n').slice(0,1000);
  const reply_markup={inline_keyboard:[...(p.kind!=='coupon'?[[{text:'🛒 VER NO CARRINHO',url:productUrl}]]:[]),[{text:p.kind==='coupon'?'🎟️ USAR CUPOM':'⚡ CONFERIR OFERTA',url:offerUrl}]]};
  const base='https://api.telegram.org/bot'+process.env.TELEGRAM_BOT_TOKEN;
  try{
   const photo=p.image&&!p.image.startsWith('data:')?new URL(p.image,origin).href:null;
   let result;
   if(photo){result=await fetch(base+'/sendPhoto',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:j.channel,photo,caption:text,reply_markup}),signal:AbortSignal.timeout(10000)}).then(r=>r.json());}
   if(!result?.ok){result=await fetch(base+'/sendMessage',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:j.channel,text,reply_markup,disable_web_page_preview:true}),signal:AbortSignal.timeout(10000)}).then(r=>r.json());}
   await rpc('complete',{id:j.id,lease:j.lease,status:result.ok?'sent':'failed',messageId:result.ok?result.result.message_id:null,error:result.ok?null:'Telegram recusou o envio. Confira o acesso do bot ao grupo.'},s);result.ok?sent++:failed++;
  }catch{await rpc('complete',{id:j.id,lease:j.lease,status:'uncertain',error:'Não foi possível confirmar o envio. Confira o grupo.'},s);failed++;}
 }
 return {sent,failed};
}
module.exports={rpc,session,cookie,reply,csrf,channels,normalizeItem,marketUrl,markets,dispatch};
