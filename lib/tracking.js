const crypto=require('node:crypto');
function tracking(req){const ua=String(req.headers['user-agent']||'');const ip=String(req.headers['x-forwarded-for']||'').split(',')[0];const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date());return {visitor:crypto.createHmac('sha256',process.env.CV_GATE_SECRET||'').update(day+'|'+ip+'|'+ua).digest('hex'),count:!!ua&&!/bot|crawler|spider|headless|preview|facebookexternalhit|telegrambot|whatsapp/i.test(ua)};}
module.exports={tracking};
