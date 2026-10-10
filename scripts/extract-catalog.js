const fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync('index.html','utf8'),a=s.indexOf('const PRODUCTS='),b=s.indexOf('const PRODUCT_SPECS=',a),ctx={};
vm.runInNewContext(s.slice(s.lastIndexOf('<script>',a)+8,b)+';this.products=PRODUCTS;',ctx);
const text=s.slice(b),end=text.indexOf('\n};');
vm.runInNewContext(text.slice(0,end+3)+';this.specs=PRODUCT_SPECS;',ctx);
fs.writeFileSync('catalog-seed.json',JSON.stringify(ctx.products.map(p=>({...p,specs:ctx.specs[p.id]||[]})),null,2));
console.log('Preserved products:',ctx.products.length);
