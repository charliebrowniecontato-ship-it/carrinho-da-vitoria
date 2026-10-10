const fs=require('node:fs');
fs.mkdirSync('public',{recursive:true});
for(const f of ['index.html','gestao.html','gestao.css','gestao.js','loja-gestao.js','icons.js','loja-refinada.css','loja-refinada.js','robots.txt','manifest-gestao.json'])if(fs.existsSync(f))fs.copyFileSync(f,'public/'+f);
if(fs.existsSync('assets'))fs.cpSync('assets','public/assets',{recursive:true});
console.log('Loja, gestão e recursos da marca preparados.');
