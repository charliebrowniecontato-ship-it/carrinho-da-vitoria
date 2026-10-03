const fs=require('fs');
const s=fs.readFileSync('C:\\Users\\puaet\\carrinho-update\\index.html','utf8');
const secret=fs.readFileSync('C:\\Users\\puaet\\carrinho-update\\.sync-secret','utf8').trim();
const lines=s.split(/\r?\n/).filter(x=>x.trim().startsWith("{id:'"));
const products=lines.map(x=>eval('('+x.trim().replace(/,$/,'')+')')).filter(p=>p&&p.title&&p.link);
const skip=new Set(['mouse-rgb-kw201','microfone-lapela-duplo-onistek']);
const queue=products.filter(p=>!skip.has(p.id));
const slugify=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
(async()=>{
  console.log('Publicando',queue.length,'produtos antigos...');
  for(let i=0;i<queue.length;i++){
    const p=queue[i];
    const body={product:{...p,siteUrl:'https://carrinhodavitoria.setyourday.com.br/produto/'+slugify(p.title)}};
    try{
      const r=await fetch('https://carrinhodavitoria.setyourday.com.br/api/sync-latest',{
        method:'POST',
        headers:{'content-type':'application/json','x-sync-secret':secret},
        body:JSON.stringify(body)
      });
      const j=await r.json();
      console.log((i+1)+'/'+queue.length,p.id,r.status,j.ok?'OK message_id='+j.result?.message_id:JSON.stringify(j));
    }catch(e){console.log((i+1)+'/'+queue.length,p.id,'ERRO',e.message)}
    await new Promise(r=>setTimeout(r,1400));
  }
})();
