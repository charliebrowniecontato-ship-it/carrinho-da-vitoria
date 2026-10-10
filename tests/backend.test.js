const test=require('node:test'),assert=require('node:assert/strict');
const {marketUrl,normalizeItem,session,csrf,channels,dispatch}=require('../lib/backend');
const {parseMetadata,allowed}=require('../lib/metadata');const {tracking}=require('../lib/tracking');
test('Affiliate destinations reject spoofed hosts, local addresses, URL credentials and injection',()=>{
 for(const url of ['https://shopee.com.br.evil.example/x','https://localhost/a','http://s.shopee.com.br/x','https://127.0.0.1','https://user@s.shopee.com.br/x','https://s.shopee.com.br/x" onclick="x'])assert.equal(marketUrl(url,'Shopee'),false);
 assert.equal(marketUrl('https://s.shopee.com.br/123?affiliate=a','Shopee'),true);assert.equal(allowed('https://amzn.to/abc'),true);
});
test('Product without price keeps null price; photo count capped; HTML and computed discounts handled',()=>{
 const base={kind:'product',status:'draft',data:{store:'Shopee',link:'https://s.shopee.com.br/abc',title:'<b>Ventilador</b>',images:Array(7).fill('https://images.example/photo.jpg')}};
 const p=normalizeItem(base);assert.equal(p.data.price,null);assert.equal(p.data.images.length,5);assert.ok(!p.data.title.includes('<'));assert.match(p.id,/^[a-z0-9-]+$/);
 const priced=normalizeItem({...base,data:{...base.data,price:80,oldPrice:100}});assert.equal(priced.data.discount,20);
});
test('Cookie session is exact and mutations require same origin',()=>{
 assert.equal(session({headers:{cookie:'cv_session='+ 'a'.repeat(64)}}),'a'.repeat(64));assert.equal(session({headers:{cookie:'cv_session=bad'}}),'');assert.equal(csrf({headers:{host:'shop.example',origin:'https://evil.example'}}),false);assert.equal(csrf({headers:{host:'shop.example',origin:'https://shop.example'}}),true);
});
test('Metadata is data-only; parses JSON-LD and OG without executing scripts',()=>{
 const m=parseMetadata('<meta content="Nome &amp; algo" property="og:title"><script type="application/ld+json">{"@type":"Product","name":"Produto","brand":{"name":"Marca"},"offers":{"price":"99.90"},"image":["https://image.example/a.jpg"]}</script>');assert.equal(m.title,'Produto');assert.equal(m.price,99.9);assert.equal(m.brand,'Marca');assert.equal(m.images.length,1);
});
test('Bots are excluded and raw IP is not stored in metrics payload',()=>{const x=tracking({headers:{'user-agent':'TelegramBot','x-forwarded-for':'198.51.100.2'}});assert.equal(x.count,false);assert.match(x.visitor,/^[a-f0-9]{64}$/);assert.equal(JSON.stringify(x).includes('198.51.100.2'),false);});
test('Group list is deduplicated and rejects malformed destinations',()=>{const old=process.env.TELEGRAM_CHAT_IDS;process.env.TELEGRAM_CHAT_IDS='-123,-123,@grupo,bad/x';assert.deepEqual(channels('product'),['-123','@grupo']);if(old===undefined)delete process.env.TELEGRAM_CHAT_IDS;else process.env.TELEGRAM_CHAT_IDS=old;});
test('Outbox sends once and retains the original failure if transport cannot confirm delivery',async()=>{
 const orig=global.fetch,old={url:process.env.CV_SUPABASE_URL,key:process.env.CV_SUPABASE_KEY,gate:process.env.CV_GATE_SECRET,tg:process.env.TELEGRAM_BOT_TOKEN};Object.assign(process.env,{CV_SUPABASE_URL:'https://db.example',CV_SUPABASE_KEY:'test',CV_GATE_SECRET:'test',TELEGRAM_BOT_TOKEN:'test'});let claim=0,sends=0,completed;
 global.fetch=async(url,o)=>{if(url.includes('db.example')){const d=JSON.parse(o.body);if(d.p_action==='claim')return {ok:true,json:async()=>({ok:true,job:claim++?null:{id:'job',item_id:'produto',channel:'-123',lease:'lease',payload:{kind:'product',title:'Teste',store:'Shopee'}}})};if(d.p_action==='complete')completed=d.p_data;return {ok:true,json:async()=>({ok:true})};}sends++;throw Error('network interrupted');};
 try{const r=await dispatch('session','https://shop.example');assert.equal(sends,1);assert.equal(completed.status,'uncertain');assert.equal(r.failed,1);}finally{global.fetch=orig;for(const [k,v]of Object.entries({CV_SUPABASE_URL:old.url,CV_SUPABASE_KEY:old.key,CV_GATE_SECRET:old.gate,TELEGRAM_BOT_TOKEN:old.tg})){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});
