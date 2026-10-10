const {markets,marketUrl}=require('./backend');
const allowed=u=>Object.keys(markets).some(s=>marketUrl(u,s));
function decode(s){return String(s||'').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');}
function parseMetadata(html){
 const meta={};for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){const a={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))a[m[1].toLowerCase()]=decode(m[2]??m[3]);if(a.property||a.name)meta[a.property||a.name]=a.content;}
 let product;for(const x of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{const j=JSON.parse(x[1]),all=Array.isArray(j)?j:j['@graph']||[j];product=all.find(o=>[].concat(o['@type']).includes('Product'));if(product)break;}catch{}}
 const title=product?.name||meta['og:title']||decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]);
 const description=product?.description||meta['og:description']||meta.description;
 const images=[].concat(product?.image||meta['og:image']||[]).map(x=>typeof x==='object'?x.url:x).filter(x=>/^https:\/\//.test(x||'')).slice(0,5);
 const offer=Array.isArray(product?.offers)?product.offers[0]:product?.offers,price=offer?.price??meta['product:price:amount'];
 return {title:String(title||'').replace(/<[^>]+>/g,'').slice(0,180),description:String(description||'').replace(/<[^>]+>/g,'').slice(0,5000),images,price:price&&!isNaN(Number(price))?Number(price):null,brand:typeof product?.brand==='object'?product.brand.name:product?.brand||''};
}
async function metadata(url){
 const deadline=Date.now()+8500;
 for(let i=0;i<5;i++){
  if(Date.now()>=deadline)throw Error('Consulta indisponível agora. Preencha manualmente.');
  if(!allowed(url))throw Error('O destino do link não é uma loja parceira compatível.');
  const r=await fetch(url,{redirect:'manual',headers:{'user-agent':'CarrinhoDaVitoria/2.0 (+product-metadata)','accept':'text/html'},signal:AbortSignal.timeout(Math.min(7000,Math.max(1,deadline-Date.now())))});
  if(r.status>=300&&r.status<400&&r.headers.get('location')){url=new URL(r.headers.get('location'),url).href;continue;}
  if(!r.ok)throw Error('A loja bloqueou a consulta automática. Preencha os dados manualmente.');
  if(!/text\/html/.test(r.headers.get('content-type')||''))throw Error('O link não retornou uma página de produto.');
  const reader=r.body.getReader(),parts=[];let length=0;while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>2000000){await reader.cancel();throw Error('Página grande demais para consultar.');}parts.push(Buffer.from(value));}
  const info=parseMetadata(Buffer.concat(parts).toString());if(!info.title&&!info.images.length)throw Error('A loja não disponibilizou os dados. Preencha manualmente.');return {...info,resolvedUrl:url};
 }
 throw Error('Não foi possível resolver o link.');
}
module.exports={metadata,parseMetadata,allowed};
