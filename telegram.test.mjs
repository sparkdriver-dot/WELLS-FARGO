import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sendToTelegram} from './telegram.mjs';
test('envía solamente el mensaje al chat configurado',async()=>{
 await sendToTelegram('Mensaje de prueba',{token:'test-token',chatId:'test-chat',fetchImpl:async(url,opts)=>{assert.equal(url,'https://api.telegram.org/bottest-token/sendMessage');assert.deepEqual(JSON.parse(opts.body),{chat_id:'test-chat',text:'Mensaje de prueba'});return Response.json({ok:true})}});
});
test('rechaza errores y configuración incompleta',async()=>{
 await assert.rejects(sendToTelegram('hola',{token:'',chatId:''}));
 await assert.rejects(sendToTelegram('hola',{token:'test',chatId:'test',fetchImpl:async()=>Response.json({ok:false},{status:401})}));
 await assert.rejects(sendToTelegram('hola',{token:'test',chatId:'test',fetchImpl:async()=>{throw Error('private request URL')}}),{message:'No se pudo conectar con Telegram.'});
});
