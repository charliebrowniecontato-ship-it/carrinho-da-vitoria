const {channels}=require('../lib/backend');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({ok:false});
 if(!process.env.BOT_SYNC_SECRET||req.headers['x-sync-secret']!==process.env.BOT_SYNC_SECRET)return res.status(401).json({ok:false});
 const token=String(process.env.TELEGRAM_BOT_TOKEN||'').trim();
 const destinations=[...new Set([...channels('product'),...channels('coupon')])];
 if(!token||!destinations.length)return res.status(503).json({ok:false,error:'telegram_not_configured'});
 const call=async(method,data={})=>{
  const r=await fetch('https://api.telegram.org/bot'+token+'/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(7000)}).then(r=>r.json());
  if(!r.ok)throw Error(method);return r.result;
 };
 try{
  const bot=await call('getMe');
  for(const chat_id of destinations){
   const [chat,member]=await Promise.all([call('getChat',{chat_id}),call('getChatMember',{chat_id,user_id:bot.id})]);
   if(['left','kicked'].includes(member.status)||member.can_send_messages===false||chat.type==='channel'&&member.can_post_messages!==true&&member.status!=='creator')return res.status(503).json({ok:false,error:'telegram_permission'});
  }
  return res.status(200).json({ok:true,telegram:true,productDestinations:channels('product').length,couponDestinations:channels('coupon').length,readOnly:true});
 }catch{return res.status(503).json({ok:false,error:'telegram_unavailable'});}
};
