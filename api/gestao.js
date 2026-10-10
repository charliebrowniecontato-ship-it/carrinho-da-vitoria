const {rpc,session,cookie,reply,csrf,channels,normalizeItem,dispatch}=require('../lib/backend');
const {metadata}=require('../lib/metadata');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const s=session(req),action=req.method==='GET'?req.query.action:req.body?.action;
 const read=['setup_status','me','dashboard','members','analytics'];
 if(req.method!=='POST'&&req.method!=='GET')return res.status(405).json({ok:false});
 if(req.method==='GET'&&!read.includes(action))return res.status(405).json({ok:false});
 if(req.method==='POST'&&!csrf(req))return res.status(403).json({ok:false,message:'Origem inválida.'});
 const allowed=[...read,'activate','login','logout','password','invite','member','upload','save','retry','dispatch'];
 if(!allowed.includes(action))return res.status(400).json({ok:false});
 try{
  let d=req.method==='GET'?{...req.query}:{...(req.body?.data||{})};
  if(['activate','login'].includes(action)){d.ip=String(req.headers['x-forwarded-for']||'').split(',')[0];}
  if(action==='save'){
   const auth=await rpc('me',{},s);if(!auth.ok)return reply(res,auth);if(auth.user.role==='viewer')return reply(res,{ok:false,error:'forbidden'});
   d=normalizeItem(d);d.notify=req.body.data.notify!==false;d.channels=channels(d.kind);
   if(d.status==='published'){
    try{const info=await metadata(d.data.link);d.data.verification={status:'checked',checkedAt:new Date().toISOString(),source:'Página pública da loja'};
     if(!d.data.description&&info.description)d.data.description=info.description.replace(/[<>]/g,'').slice(0,5000);
     if(d.data.price===null&&info.price!==null)d.data.price=info.price;
    }catch{d.data.verification={status:'unavailable',checkedAt:new Date().toISOString()};}
   }
  }
  if(action==='upload'){
   const bytes=Buffer.from(d.base64||'','base64');const sig=bytes.subarray(0,12).toString('hex');
   const valid=d.mime==='image/jpeg'?sig.startsWith('ffd8ff'):d.mime==='image/png'?sig.startsWith('89504e470d0a1a0a'):d.mime==='image/webp'?bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP':false;
   if(!valid||bytes.length>270000)throw Error('Escolha uma imagem JPEG, PNG ou WebP menor que 270 KB.');
  }
  const origin='https://'+req.headers.host;
  if(action==='dispatch'){const auth=await rpc('me',{},s);if(!auth.ok)return reply(res,auth);if(!['admin','editor'].includes(auth.user.role))return reply(res,{ok:false,error:'forbidden'});return reply(res,{ok:true,delivery:await dispatch(s,origin)});}
  let r=await rpc(action,d,s);
  if(r.ok&&r.session){cookie(res,r.session);delete r.session;}
  if(action==='logout')cookie(res);
  if(action==='dashboard'&&r.ok)r.channels={product:channels('product').length,coupon:channels('coupon').length,configured:!!process.env.TELEGRAM_BOT_TOKEN};
  if(action==='invite'&&r.ok){r.activationUrl=origin+'/gestao#ativar='+r.code;delete r.code;}
  if((action==='save'||action==='retry')&&r.ok){try{r.delivery=await dispatch(s,origin);}catch{r.delivery={sent:0,failed:1};}}
  return reply(res,r);
 }catch(e){return res.status(503).json({ok:false,message:e.message||'Não foi possível concluir. Tente novamente.'});}
};
