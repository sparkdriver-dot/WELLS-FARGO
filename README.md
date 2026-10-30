# Buzón con envío obligatorio a Telegram

Aplicación web simple de buzón de mensajes. Todos los mensajes se envían obligatoriamente a Telegram (no se guardan localmente los nuevos mensajes). El panel de administración permite consultar el historial existente.

## Requisitos

- Node.js **22.9** o posterior

## Instalación

```bash
# Clona el repositorio
git clone <url-del-repo>
cd <nombre-del-repo>

# Copia el ejemplo de variables de entorno
cp .env.example .env

# Edita .env con tus valores reales
# - ADMIN_PASSWORD: contraseña de al menos 12 caracteres
# - TELEGRAM_BOT_TOKEN: token de tu bot de Telegram
# - TELEGRAM_CHAT_ID: ID del chat donde recibir los mensajes
# - En producción: COOKIE_SECURE=true y usa HTTPS

# Instala dependencias (si las hubiera; actualmente no hay dependencias externas)
npm install

# Inicia el servidor
npm start
```

Abre http://localhost:3000

## Configuración

Configura en `.env`:

- `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`: todos los mensajes se envían a Telegram. No existe modo de entrega local. La página confirma el envío únicamente cuando Telegram responde correctamente. Ante un error se conserva el texto para reintentar.
- `ADMIN_PASSWORD`: debe tener al menos 12 caracteres.
- `COOKIE_SECURE=true` en producción (requiere HTTPS).

**Importante:** No subas el archivo `.env` al repositorio (está en `.gitignore`).

## Panel de administración

Disponible en `/admin`. Permite consultar archivos históricos.

## Tests

```bash
npm test
```

Comprueba envío obligatorio, errores de entrega, protección del panel y ausencia de guardado local (con Telegram simulado).

## Notas

- Requiere Node.js 22.9+ por el uso de `--env-file-if-exists`.
- El directorio `data/` se crea automáticamente y está ignorado en git.
