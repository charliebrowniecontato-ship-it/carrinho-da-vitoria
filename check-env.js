const fs=require('fs');
const env={};
for(const line of fs.readFileSync('C:\\Users\\puaet\\carrinho-update\\.env.production.local','utf8').split(/\r?\n/)){
 if(!line||line.startsWith('#')||!line.includes('=')) continue;
 const i=line.indexOf('='); let v=line.slice(i+1).trim();
 if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1);
 env[line.slice(0,i)]=v;
}
for(const k of ['TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID','TELEGRAM_GROUP_URL']) console.log(k, !!env[k], env[k]?.length||0, env[k]?.slice(0,4)||'');
