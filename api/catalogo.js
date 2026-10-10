const {rpc}=require('../lib/backend');
module.exports=async(req,res)=>{if(req.method!=='GET')return res.status(405).end();try{const r=await rpc('catalog');res.setHeader('Cache-Control','public, max-age=0, s-maxage=10, stale-while-revalidate=30');return res.status(r.ok?200:503).json(r);}catch{return res.status(503).json({ok:false});}};
