import {sendToTelegram} from './telegram.mjs';
import http from 'node:http';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export async function createApp({dataDir=process.env.DATA_DIR||path.join(path.dirname(fileURLToPath(import.meta.url)),'data'),adminUser=process.env.ADMIN_USER||'admin',adminPassword=process.env.ADMIN_PASSWORD,secure=process.env.COOKIE_SECURE==='true'}={}){
if(!adminPassword||adminPassword.length<12||adminPassword==='CAMBIA_ESTO_POR_UNA_CLAVE_LARGA')throw Error('Configura ADMIN_PASSWORD con una contraseña propia de al menos 12 caracteres en .env.');
await mkdir(dataDir,{recursive:true});const file=path.join(dataDir,'messages.json');let messages=[];
try{messages=JSON.parse(await readFile(file,'utf8'));if(!Array.isArray(messages))throw Error('Archivo no válido.')}catch(e){if(e.code!=='ENOENT')throw e}
const salt=randomBytes(16),hash=scryptSync(adminPassword,salt,64),sessions=new Map(),streams=new Set(),limits=new Map();let queue=Promise.resolve();
const snapshot=()=>({messages:[...messages].reverse(),total:messages.length,unread:messages.filter(m=>!m.read).length});
const rate=(key,max,window)=>{const now=Date.now();let e=limits.get(key);if(!e||e.until<now){e={count:0,until:now+window};limits.set(key,e)}return ++e.count<=max};
const change=fn=>{const operation=queue.then(async()=>{const next=fn(messages);await writeFile(file+'.tmp',JSON.stringify(next,null,2),'utf8');await rename(file+'.tmp',file);messages=next;for(const c of streams)c.res.write('data: '+JSON.stringify(snapshot())+'\n\n')});queue=operation.catch(()=>{});return operation};
const timer=setInterval(()=>{const now=Date.now();for(const [k,s]of sessions)if(s.expires<=now)sessions.delete(k);for(const [k,l]of limits)if(l.until<now)limits.delete(k);for(const c of streams)if(c.expires<=now){c.res.end();streams.delete(c)}else c.res.write(': heartbeat\n\n')},15000);timer.unref();
const server=http.createServer(async(req,res)=>{try{
res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
const url=new URL(req.url,'http://localhost');const json=(code,value)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value))};
const sid=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('session='))?.slice(8),session=sessions.get(sid),authenticated=session&&session.expires>Date.now();
if(req.method==='POST'){let valid=false;try{valid=!!req.headers.origin&&new URL(req.headers.origin).host===req.headers.host}catch{}if(!valid)return json(403,{error:'Origen no permitido.'});if(!req.headers['content-type']?.startsWith('application/json'))return json(415,{error:'Formato no válido.'})}
const body=async()=>{let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>20000)throw Object.assign(Error('Solicitud demasiado grande.'),{status:413})}try{return JSON.parse(text)}catch{throw Object.assign(Error('Solicitud no válida.'),{status:400})}};
const ip=req.socket.remoteAddress||'unknown';
if(url.pathname==='/api/messages'&&req.method==='POST'){if(!rate('message:'+ip,10,60000))return json(429,{error:'Espera un minuto antes de enviar más mensajes.'});const input=await body();if(typeof input.message!=='string'||!input.message.trim()||input.message.length>4000)return json(400,{error:'Escribe entre 1 y 4000 caracteres.'});try{await sendToTelegram(input.message.trim())}catch{return json(502,{error:'No se pudo enviar a Telegram. Revisa la conexión o la configuración del bot e intenta nuevamente.'})}return json(201,{ok:true})}
if(url.pathname==='/api/login'&&req.method==='POST'){if(!rate('login:'+ip,8,600000))return json(429,{error:'Demasiados intentos. Espera 10 minutos.'});const input=await body(),supplied=scryptSync(typeof input.password==='string'?input.password:'',salt,64);if(input.username!==adminUser||!timingSafeEqual(supplied,hash))return json(401,{error:'Usuario o contraseña incorrectos.'});if(sid)sessions.delete(sid);const token=randomBytes(32).toString('hex');sessions.set(token,{expires:Date.now()+28800000});res.setHeader('Set-Cookie','session='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800'+(secure?'; Secure':''));return json(200,{ok:true})}
if(url.pathname.startsWith('/api/admin/')||url.pathname==='/api/logout'){
if(!authenticated)return json(401,{error:'Inicia sesión para acceder al panel.'});
if(url.pathname==='/api/logout'&&req.method==='POST'){sessions.delete(sid);for(const c of streams)if(c.sid===sid){c.res.end();streams.delete(c)}res.setHeader('Set-Cookie','session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'+(secure?'; Secure':''));return json(200,{ok:true})}
if(url.pathname==='/api/admin/messages'&&req.method==='GET')return json(200,snapshot());
if(url.pathname==='/api/admin/events'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'text/event-stream','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write('retry: 2000\ndata: '+JSON.stringify(snapshot())+'\n\n');const c={res,sid,expires:session.expires};streams.add(c);res.on('close',()=>streams.delete(c));return}
if(url.pathname==='/api/admin/read'&&req.method==='POST'){const input=await body();if(!messages.some(m=>m.id===input.id))return json(404,{error:'Mensaje no encontrado.'});await change(list=>list.map(m=>m.id===input.id?{...m,read:true}:m));return json(200,{ok:true})}}
const assets={'/':'index.html','/admin':'admin.html','/admin/':'admin.html','/style.css':'style.css','/message.css':'message.css','/form.js':'form.js','/logo.js':'logo.js','/images/logo.png':'images/logo.png','/admin.js':'admin.js'};
if(req.method==='GET'&&assets[url.pathname]){const name=assets[url.pathname];res.writeHead(200,{'Content-Type':name.endsWith('.png')?'image/png':name.endsWith('.css')?'text/css; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8'});return res.end(await readFile(new URL('./public/'+name,import.meta.url)))}json(404,{error:'No encontrado.'});
}catch(e){if(!e.status)console.error(e);if(!res.headersSent){res.writeHead(e.status||500,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:e.status?e.message:'No se pudo guardar el cambio. Intenta nuevamente.'}))}else res.end()}});
server.on('close',()=>{clearInterval(timer);for(const c of streams)c.res.end()});return server}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{const server=await createApp();const port=Number(process.env.PORT||3000);server.listen(port,'0.0.0.0',()=>console.log('Web: http://localhost:'+port+' | Panel: http://localhost:'+port+'/admin'))}catch(e){console.error(e.message);process.exitCode=1}}




