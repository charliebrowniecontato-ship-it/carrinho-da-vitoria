const fs=require('fs');
const s=fs.readFileSync('C:\\Users\\puaet\\carrinho-update\\index.html','utf8');
const lines=s.split(/\r?\n/).filter(x=>x.trim().startsWith("{id:'"));
console.log(lines.length);
lines.forEach((x,i)=>{const id=(x.match(/id:'([^']+)'/)||[])[1];const title=(x.match(/title:'([^']+)'/)||[])[1];console.log((i+1)+'. '+id+' | '+title);});
