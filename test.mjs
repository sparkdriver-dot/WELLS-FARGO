import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readdir} from 'node:fs/promises';
import {once} from 'node:events';
import path from 'node:path';
import {createApp} from './server.mjs';
test('Telegram obligatorio: confirma entrega, propaga fallos y no guarda localmente',async()=>{
 const dir=await mkdtemp(path.resolve('.buzon-test-'));
 const originalFetch=globalThis.fetch;
 const originalMode=process.env.DELIVERY_MODE;
 const token=process.env.TELEGRAM_BOT_TOKEN,chat=process.env.TELEGRAM_CHAT_ID;
 process.env.DELIVERY_MODE='local';process.env.TELEGRAM_BOT_TOKEN='test';process.env.TELEGRAM_CHAT_ID='test';
 let reject=false,calls=0;
 globalThis.fetch=async(url,options)=>{
  if(String(url).startsWith('https://api.telegram.org/')){calls++;assert.equal(JSON.parse(options.body).text,'hola');return Response.json({ok:!reject},{status:reject?502:200})}
  return originalFetch(url,options);
 };
 const server=await createApp({dataDir:dir,adminPassword:'test-password-long-123'});
 try{
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const base='http://127.0.0.1:'+server.address().port;
 const post=message=>fetch(base+'/api/messages',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({message})});
 assert.equal((await fetch(base+'/api/admin/messages')).status,401);
 assert.equal((await post('  ')).status,400);
 assert.equal((await post(' hola ')).status,201);
 reject=true;assert.equal((await post('hola')).status,502);
 assert.equal(calls,2);assert.deepEqual(await readdir(dir),[]);
 }finally{
 globalThis.fetch=originalFetch;
 for(const [key,value] of Object.entries({DELIVERY_MODE:originalMode,TELEGRAM_BOT_TOKEN:token,TELEGRAM_CHAT_ID:chat})){if(value===undefined)delete process.env[key];else process.env[key]=value}
 await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});
 }
});
