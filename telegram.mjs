export async function sendToTelegram(text,{token=process.env.TELEGRAM_BOT_TOKEN,chatId=process.env.TELEGRAM_CHAT_ID,fetchImpl=fetch}={}){
 if(!token||!chatId)throw new Error('Falta configurar Telegram.');
 let response,result;
 try{response=await fetchImpl('https://api.telegram.org/bot'+token+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chatId,text}),signal:AbortSignal.timeout(12000)});result=await response.json()}catch{throw new Error('No se pudo conectar con Telegram.')}
 if(!response.ok||result.ok!==true)throw new Error('Telegram no pudo recibir el mensaje.');
 return {ok:true};
}
