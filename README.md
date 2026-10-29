# Buzón con envío obligatorio a Telegram

Requiere Node.js 22.9 o posterior. Ejecuta `npm start` y abre http://localhost:3000.

Configura TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en .env. Todos los mensajes se envían a Telegram: no existe modo de entrega local ni se agregan mensajes nuevos al panel. La página confirma el envío únicamente cuando Telegram devuelve una respuesta correcta. Ante un error conserva el texto para reintentar; no hay reenvío automático ni garantía de entrega si Telegram no está disponible.

El panel /admin permanece disponible para consultar archivos históricos. ADMIN_PASSWORD debe tener al menos 12 caracteres. En producción usa HTTPS y COOKIE_SECURE=true. No publiques .env.

`npm test` comprueba envío obligatorio, errores de entrega, protección del panel y ausencia de guardado local, con Telegram simulado.
